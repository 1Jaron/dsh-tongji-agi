import { Agent, request } from 'node:https'

const API_HOST = 'agi.tongji.edu.cn'
const API_ORIGIN = `https://${API_HOST}`
const API_BASE = '/api/v1'
const ACCOUNT_KEY = 'dsh-tongji-agi/account'
const REMOTE_METHODS = '@deepseek-ai/dsh-typert-protocol/remote-methods'
const POLL_INTERVAL = 30_000
const CACHE_TTL = 8_000
const REQUEST_TIMEOUT = 15_000

/**
 * 平台账号是「邮箱 + 验证码」注册体系，学号密码只存在于同济统一身份认证（IAM）。
 * 因此登录必须走 OAuth2 授权码流程：
 *   sso/discover → IAM 授权页 → 双 POST 提交凭据 → sso/callback?token=<JWT>
 * 拿到的 JWT 直接作为 agi 平台的 Bearer token 使用，无需再换 code。
 */
const SSO_DOMAIN = 'tongji'
const SSO_CALLBACK = '/sso/callback'
const IAM_ORIGIN = 'https://iam.tongji.edu.cn'
const IAM_LOGIN_FIELD_CHECKCODE = '请输入验证码'
const MAX_SSO_HOPS = 10
/** IAM 二级认证（增强认证）的认证链名，出现在 AuthnEngine 的 currentAuth 上。 */
const SMS_CURRENT_AUTH = 'urn_oasis_names_tc_SAML_2.0_ac_classes_SMSUsernamePassword'
/** IAM 页面在弹出短信框 180 秒后自动 reload，过期后必须重新走密码认证。 */
const SMS_CHALLENGE_TTL = 170_000
const SMS_EXPIRED = '验证码已过期，请重新登录'
const USER_AGENT =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/156.0.0.0 Safari/537.36'

/**
 * 拼 query string。空值直接跳过，避免把 `?kind=undefined` 发给平台。
 */
function buildQuery(query) {
  if (!query) return ''
  const params = new URLSearchParams()
  for (const [key, value] of Object.entries(query)) {
    if (value === undefined || value === null || value === '') continue
    params.append(key, String(value))
  }
  const text = params.toString()
  return text ? `?${text}` : ''
}

function apiRequest(method, path, options = {}) {
  const { token, body, query, signal } = options
  return new Promise((resolve, reject) => {
    signal?.throwIfAborted()
    const payload = body === undefined ? undefined : Buffer.from(JSON.stringify(body), 'utf8')
    const headers = { accept: 'application/json' }
    if (payload) {
      headers['content-type'] = 'application/json'
      headers['content-length'] = String(payload.length)
    }
    if (token) headers.authorization = `Bearer ${token}`
    const req = request(
      { host: API_HOST, path: `${API_BASE}${path}${buildQuery(query)}`, method, headers, agent: directAgent(), signal, timeout: REQUEST_TIMEOUT },
      (res) => {
        const chunks = []
        res.on('data', (chunk) => chunks.push(chunk))
        res.on('error', reject)
        res.on('end', () => {
          const text = Buffer.concat(chunks).toString('utf8')
          let parsed
          try {
            parsed = text ? JSON.parse(text) : null
          } catch {
            parsed = null
          }
          resolve({ status: res.statusCode ?? 0, body: parsed, text })
        })
      },
    )
    req.on('timeout', () => req.destroy(new Error('tongji api request timed out')))
    req.on('error', reject)
    if (payload) req.write(payload)
    req.end()
  })
}

/**
 * Normalise the raw balance field to a number.
 *
 * The client renders `state.points` through `formatNumber()`, which only
 * accepts finite numbers — returning a string here made the panel fall back to
 * the empty placeholder. Keep the wire type numeric and leave rounding to the
 * client, which knows the locale and the placeholder rules.
 */
function formatPoints(value) {
  const numeric = typeof value === 'number' ? value : Number(value)
  if (!Number.isFinite(numeric)) return null
  if (numeric < 0) return 0
  return numeric
}

function pickBalance(overview) {
  const mode = typeof overview?.mode === 'string' ? overview.mode : 'subscription'
  const raw = mode === 'points' ? overview?.total_available : overview?.wallet_balance
  return { mode, points: formatPoints(raw) }
}

function messageOf(response, fallback) {
  const text = typeof response?.body?.message === 'string' ? response.body.message : ''
  if (text) return text
  if (typeof response?.status === 'number' && response.status > 0) return `${fallback} (HTTP ${response.status})`
  return fallback
}

/**
 * 用量统计的 range 参数没有公开文档，平台可能随时收窄枚举值。
 * 按「今日 → 近 7 天 → 近 30 天」依次试探，并记住第一次成功的那个，
 * 后续轮询只发一次请求。
 */
const USAGE_RANGES = Object.freeze(['1d', '7d', '30d'])

function numberOr(value, fallback = 0) {
  return formatPoints(value) ?? fallback
}

/**
 * 把 /my-usage/stats 与 /my-usage/history 两份响应拍平成客户端好渲染的形状：
 * 模型占比在这里算好（客户端只负责按 locale 排版），日序列按日期升序。
 */
function normalizeUsage({ range, stats, history }) {
  const byModel = Array.isArray(stats?.by_model) ? stats.by_model : []
  const models = byModel
    .map((entry) => {
      const inputTokens = numberOr(entry?.input_tokens)
      const cachedTokens = numberOr(entry?.cached_tokens)
      const outputTokens = numberOr(entry?.output_tokens)
      const name = typeof entry?.model_display_name === 'string' && entry.model_display_name ? entry.model_display_name : 'unknown'
      return { name, inputTokens, cachedTokens, outputTokens, tokens: inputTokens + cachedTokens + outputTokens }
    })
    .filter((entry) => entry.tokens > 0)
    .sort((a, b) => b.tokens - a.tokens)
  const totalTokens = models.reduce((sum, entry) => sum + entry.tokens, 0)
  const withShare = models.map((entry) => ({ ...entry, share: totalTokens > 0 ? entry.tokens / totalTokens : 0 }))
  const daily = (Array.isArray(history?.list) ? history.list : [])
    .map((entry) => ({
      date: typeof entry?.date === 'string' ? entry.date : '',
      tokens: numberOr(entry?.text_quota_used),
      calls: numberOr(entry?.calls),
    }))
    .filter((entry) => entry.date !== '')
    .sort((a, b) => (a.date < b.date ? -1 : a.date > b.date ? 1 : 0))
  const summary = stats?.summary ?? {}
  return Object.freeze({
    range,
    since: typeof stats?.since === 'string' ? stats.since : null,
    until: typeof stats?.until === 'string' ? stats.until : null,
    calls: numberOr(summary.calls),
    textTokens: summary.text_tokens == null || summary.text_tokens === '' ? null : formatPoints(summary.text_tokens),
    pointsCost: numberOr(summary.points_cost),
    moneyCost: numberOr(summary.money_cost),
    totalTokens,
    models: Object.freeze(withShare),
    daily: Object.freeze(daily),
    updatedAt: Date.now(),
  })
}

function decodeEntities(value) {
  return value.replace(/&amp;/g, '&').replace(/&#39;/g, "'").replace(/&quot;/g, '"')
}

function pick(html, pattern) {
  const match = pattern.exec(html)
  return match ? decodeEntities(match[1]) : undefined
}

/**
 * 统一身份认证页面把关键参数藏在两处，且都不在隐藏域的 value 里：
 *   - 表单 action / authnLcKey 在 authen1Form 上；
 *   - spAuthChainCode 由内联脚本 $("#spAuthChainCode1").val('...') 写入。
 * 少任何一个，IAM 都会静默返回「无登录认证用户信息」。
 */
function readLoginForm(html) {
  return {
    action: pick(html, /id="authen1Form"[\s\S]*?action='([^']+)'/),
    authnLcKey: pick(html, /name="authnLcKey"[^>]*value='([^']+)'/),
    chainCode: pick(html, /\$\("#spAuthChainCode1"\)\.val\('([^']+)'\)/),
  }
}

function createCookieJar() {
  const store = new Map()
  return {
    header(origin) {
      const cookies = store.get(origin)
      return cookies ? [...cookies].map(([name, value]) => `${name}=${value}`).join('; ') : ''
    },
    absorb(origin, setCookie) {
      if (!setCookie?.length) return
      const cookies = store.get(origin) ?? new Map()
      for (const cookie of setCookie) {
        const [pair] = cookie.split(';')
        const index = pair.indexOf('=')
        if (index > 0) cookies.set(pair.slice(0, index).trim(), pair.slice(index + 1).trim())
      }
      store.set(origin, cookies)
    },
    clear() {
      store.clear()
    },
  }
}

/**
 * 宿主进程可能带着 NODE_USE_ENV_PROXY=1 与一个不可用的代理地址启动，
 * 此时 fetch 与默认 agent 都会先去连代理然后失败。显式传 agent 才是直连。
 */
function directAgent() {
  return new Agent({ keepAlive: false, maxSockets: 8 })
}

/**
 * 发一次不跟随重定向的请求，返回 { status, headers, text }。
 * 统一身份认证流程要靠手写 cookie jar 与 302 链，所以不能用 fetch 的自动跟随。
 */
function ssoRequest(jar, url, init = {}) {
  init.signal?.throwIfAborted()
  const target = new URL(url)
  const { origin } = target
  if ((origin !== IAM_ORIGIN && origin !== API_ORIGIN) || target.username || target.password) {
    throw ssoError('请求', '发现不受信任的地址')
  }
  const payload = init.body === undefined ? undefined : Buffer.from(init.body, 'utf8')
  const cookie = jar.header(origin)
  const headers = {
    'user-agent': USER_AGENT,
    accept: 'text/html,application/xhtml+xml,application/json;q=0.9,*/*;q=0.8',
    'accept-language': 'zh-CN,zh;q=0.9',
    ...(cookie ? { cookie } : {}),
    ...init.headers,
  }
  if (payload) headers['content-length'] = String(payload.length)
  return new Promise((resolve, reject) => {
    const req = request(
      {
        protocol: target.protocol,
        host: target.hostname,
        port: target.port || 443,
        path: `${target.pathname}${target.search}`,
        method: init.method ?? 'GET',
        headers,
        agent: directAgent(),
        signal: init.signal,
        timeout: REQUEST_TIMEOUT,
      },
      (res) => {
        const chunks = []
        res.on('data', (chunk) => chunks.push(chunk))
        res.on('error', reject)
        res.on('end', () => {
          jar.absorb(origin, res.headers['set-cookie'])
          resolve({
            url: target.href,
            status: res.statusCode ?? 0,
            headers: res.headers,
            text: Buffer.concat(chunks).toString('utf8'),
          })
        })
      },
    )
    req.on('timeout', () => req.destroy(new Error('tongji sso request timed out')))
    req.on('error', reject)
    if (payload) req.write(payload)
    req.end()
  })
}

function ssoError(step, detail) {
  return new Error(`同济统一身份认证${step}失败：${detail}`)
}

/**
 * 判断 ajax 返回的到底是「需要短信二级认证」还是「账号密码错误」。
 * IAM 在增强认证时回的是 { op:'biometrics', view:'biometrics', authList:'sms',
 * loginFailed:'popViewException' }，popViewException 反而是 null，所以不能只看它。
 */
function isSmsChallenge(body, text) {
  if (body && typeof body === 'object') {
    const view = String(body.view ?? '')
    if (view === 'biometrics' || view === '4') return true
    const list = String(body.authList ?? '')
    if (list.split(',').includes('sms')) return true
  }
  return typeof text === 'string' && text.includes('增强认证')
}

/** 顺着 302 链找 /sso/callback?token=...，找到即返回令牌。 */
async function followToToken(jar, first, signal) {
  let current = first
  for (let hop = 0; current.headers.location && hop < MAX_SSO_HOPS; hop += 1) {
    const target = new URL(current.headers.location, current.url)
    if (target.origin === API_ORIGIN && target.pathname === SSO_CALLBACK && !target.username && !target.password) {
      const token = target.searchParams.get('token')
      if (token) return token
    }
    current = await ssoRequest(jar, target, { signal })
  }
  throw ssoError('回调', `未取得访问令牌（HTTP ${current.status}）`)
}

/** 请求 IAM 下发短信验证码；返回 undefined 表示成功，否则返回错误说明。 */
async function sendSmsCode(challenge, signal) {
  const body = new URLSearchParams({
    j_username: challenge.username,
    authenFlag: '',
    type: 'sms',
  }).toString()
  let response
  try {
    response = await ssoRequest(challenge.jar, `${IAM_ORIGIN}/idp/sendCheckCode.do`, {
      method: 'POST',
      signal,
      headers: {
        'content-type': 'application/x-www-form-urlencoded; charset=UTF-8',
        'x-requested-with': 'XMLHttpRequest',
        accept: '*/*',
        origin: IAM_ORIGIN,
        referer: `${IAM_ORIGIN}/idp/authcenter/ActionAuthChain?entityId=SYS20260057&authnLcKey=${challenge.authnLcKey}`,
      },
      body,
    })
  } catch (error) {
    return error?.message ?? String(error)
  }
  if (response.status !== 200) return `HTTP ${response.status}`
  if (/TooFast|过于频繁/i.test(response.text)) return '验证码发送过于频繁，请稍后再试'
  if (!/Successmsg|success/i.test(response.text)) return response.text.slice(0, 200) || '未知错误'
  challenge.sentAt = Date.now()
  return undefined
}

/** 登录停在「等短信验证码」这一步时用它把 challenge 抛给 runRefresh。 */
class SmsChallengePending extends Error {
  constructor(challenge) {
    super('需要短信验证码')
    this.name = 'SmsChallengePending'
    this.challenge = challenge
  }
}

/** 只把能进状态快照的字段暴露出去（jar/密码留在插件内存里）。 */
function describeChallenge(challenge) {
  return Object.freeze({
    kind: 'sms',
    mobile: challenge.mobile ?? '',
    email: challenge.email ?? '',
    sentAt: challenge.sentAt ?? 0,
    expiresAt: (challenge.createdAt ?? Date.now()) + SMS_CHALLENGE_TTL,
  })
}

/**
 * 走完 IAM 的 OAuth2 授权码流程。
 * 返回 { kind:'token', token } 或 { kind:'challenge', challenge }（需要短信二级认证）。
 * 关键点（少一个就失败）：
 *   1. state 必须用 sso/discover 下发的带签名值，不能自造；
 *   2. 提交凭据要两次 POST：先 ajax 到 ActionAuthChain，再表单 POST 到 AuthnEngine；
 *   3. j_checkcode 留空时必须原样回传提示文字「请输入验证码」；
 *   4. token 出现在 302 链的 /sso/callback?token=... 上，不需要再用 code 交换。
 */
async function ssoStart(account, signal) {
  const jar = createCookieJar()
  try {
    const discover = await apiRequest('GET', '/auth/sso/discover', { query: { domain: SSO_DOMAIN }, signal })
    const authorize = discover.body?.data?.redirect_url
    if (discover.status !== 200 || typeof authorize !== 'string' || !authorize) {
      throw ssoError('发现', messageOf(discover, '该学校暂未开通'))
    }

    let page = await ssoRequest(jar, authorize, { signal })
    for (let hop = 0; hop < 3 && page.status >= 300 && page.status < 400; hop += 1) {
      const location = page.headers.location
      if (!location) break
      page = await ssoRequest(jar, new URL(location, page.url), { signal })
    }
    if (page.status !== 200) throw ssoError('打开登录页', `HTTP ${page.status}`)

    const form = readLoginForm(page.text)
    if (!form.action || !form.authnLcKey) throw ssoError('解析登录页', '未找到登录表单')
    const action = new URL(form.action, page.url)
    if (new URL(page.url).origin !== IAM_ORIGIN || action.origin !== IAM_ORIGIN || action.username || action.password) {
      throw ssoError('解析登录页', '登录表单不属于同济统一身份认证')
    }

    const payload = new URLSearchParams({
      j_username: account.username,
      j_password: account.password,
      j_checkcode: IAM_LOGIN_FIELD_CHECKCODE,
      op: 'login',
      spAuthChainCode: form.chainCode ?? '',
      authnLcKey: form.authnLcKey,
    }).toString()
    const referer = `${IAM_ORIGIN}/idp/authcenter/ActionAuthChain?entityId=SYS20260057&authnLcKey=${form.authnLcKey}`
    const commonHeaders = {
      'content-type': 'application/x-www-form-urlencoded',
      origin: IAM_ORIGIN,
      referer,
    }

    const ajax = await ssoRequest(jar, `${IAM_ORIGIN}/idp/authcenter/ActionAuthChain?authnLcKey=${form.authnLcKey}`, {
      method: 'POST',
      signal,
      headers: { ...commonHeaders, 'content-type': 'application/x-www-form-urlencoded; charset=UTF-8', 'x-requested-with': 'XMLHttpRequest', accept: '*/*' },
      body: payload,
    })
    const ajaxText = ajax.text
    let ajaxBody
    try {
      ajaxBody = JSON.parse(ajaxText)
    } catch {
      ajaxBody = undefined
    }
    if (ajaxBody?.loginFailed !== 'false') {
      if (isSmsChallenge(ajaxBody, ajaxText)) {
        // 密码是对的，只是被要求做增强认证。保留 jar/lcKey/chain，等用户回填验证码。
        const challenge = {
          jar,
          username: account.username,
          authnLcKey: form.authnLcKey,
          chainCode: ajaxBody?.spAuthChainCode ?? form.chainCode ?? '',
          mobile: typeof ajaxBody?.mobile === 'string' ? ajaxBody.mobile : '',
          email: typeof ajaxBody?.email === 'string' ? ajaxBody.email : '',
          sentAt: 0,
          createdAt: Date.now(),
        }
        const failure = await sendSmsCode(challenge, signal)
        if (failure) throw ssoError('发送短信验证码', failure)
        jar.kept = true
        return { kind: 'challenge', challenge }
      }
      throw ssoError('登录', ajaxBody?.loginFailed === 'true' ? '账号或密码不正确' : ajaxText.slice(0, 200) || `HTTP ${ajax.status}`)
    }

    const submit = await ssoRequest(jar, action, { method: 'POST', headers: commonHeaders, body: payload, signal })
    return { kind: 'token', token: await followToToken(jar, submit, signal) }
  } finally {
    if (!jar.kept) jar.clear()
  }
}

/**
 * 用用户填的短信验证码完成二级认证，返回 access_token。
 * 表单字段与 IAM 二级认证页 (#authen4Form) 完全一致。
 */
async function ssoFinish(challenge, code, signal) {
  const { jar, authnLcKey } = challenge
  const payload = new URLSearchParams({
    j_username: challenge.username,
    type: 'sms',
    sms_checkcode: code,
    popViewException: 'Pop2',
    op: 'login',
    spAuthChainCode: challenge.chainCode ?? '',
    j_checkcode: IAM_LOGIN_FIELD_CHECKCODE,
  }).toString()
  const chainUrl = `${IAM_ORIGIN}/idp/authcenter/ActionAuthChain?authnLcKey=${authnLcKey}&doBiomAuth=1`
  const headers = {
    'content-type': 'application/x-www-form-urlencoded',
    origin: IAM_ORIGIN,
    referer: `${IAM_ORIGIN}/idp/authcenter/ActionAuthChain?entityId=SYS20260057&authnLcKey=${authnLcKey}`,
  }

  // IAM 先校验验证码，只有通过后才提交表单来获取令牌。
  const check = await ssoRequest(jar, chainUrl, {
    method: 'POST',
    signal,
    headers: {
      ...headers,
      'content-type': 'application/x-www-form-urlencoded; charset=UTF-8',
      'x-requested-with': 'XMLHttpRequest',
      accept: '*/*',
    },
    body: payload,
  })
  let answer
  try {
    answer = JSON.parse(check.text)
  } catch {
    throw ssoError('验证码校验', `响应无法解析（HTTP ${check.status}）`)
  }
  const passed = answer && (answer.loginFailed === 'false' || answer.loginFailed === false || answer.loginFailed === undefined)
  if (check.status !== 200 || !passed) {
    const tip = answer?.authnErrorTip || answer?.loginFailed || ''
    if (/验证码|错误|过期|不正确/.test(tip)) {
      throw new Error(`短信验证码不正确或已过期：${tip}`)
    }
    throw ssoError('验证码校验', tip || `HTTP ${check.status}`)
  }
  const submit = await ssoRequest(
    jar,
    `${IAM_ORIGIN}/idp/AuthnEngine?currentAuth=${encodeURIComponent(SMS_CURRENT_AUTH)}&authnLcKey=${authnLcKey}&entityId=SYS20260057`,
    { method: 'POST', headers, body: payload, signal },
  )
  return followToToken(jar, submit, signal)
}

const EMPTY_ACCOUNT_STATE = Object.freeze({
  status: 'unconfigured',
  configured: false,
  mode: 'subscription',
  points: null,
  tokensPerPoint: null,
  username: null,
  challenge: null,
  message: null,
  usage: null,
  updatedAt: null,
})

export class TongjiBalance {
  static inject = ['credentials']

  constructor(ctx) {
    // 宿主插件以 link: 方式挂载、没有自己的 node_modules，因此不能 import
    // '@deepseek-ai/dsh-typert-protocol'（ESM 裸导入会 ERR_MODULE_NOT_FOUND，
    // 导致整条 entry 加载失败、client bundle 也不会进 __DSH_BOOT__）。
    // 这里按协议自实现等价契约：ctx.provide 注册服务 + 冻结的 typertRemote 绑定。
    this.ctx = ctx
    this.name = 'tongjiBalance'
    this.typertRemote = Object.freeze({
      service: this,
      serviceKey: 'tongjiBalance',
      namespace: 'tongji',
    })
    ctx.provide('tongjiBalance', this)
    this.token = undefined
    this.serial = 0
    this.fetchedAt = 0
    this.accountSession = new AbortController()
    this.credentialWrite = Promise.resolve()
    this.inflight = undefined
    this.usageInflight = undefined
    this.pendingChallenge = undefined
    this.usageRange = undefined
    this.listeners = new Set()
    this.state = Object.freeze({ ...EMPTY_ACCOUNT_STATE, status: 'idle', serial: 0 })
    const timer = setInterval(() => {
      void this.refresh().catch(() => {})
    }, POLL_INTERVAL)
    timer.unref?.()
    this.ctx.effect(() => () => {
      clearInterval(timer)
      this.accountSession.abort()
      this.pendingChallenge?.jar.clear()
    }, 'dsh-tongji-agi: balance polling')
  }

  snapshot() {
    if (Date.now() - this.fetchedAt > CACHE_TTL) void this.refresh().catch(() => {})
    return this.state
  }

  async *watch(signal) {
    if (signal.aborted) return
    let pending = this.state
    let delivered
    let wake
    const listener = (next) => {
      pending = next
      wake?.()
    }
    const stop = () => {
      this.listeners.delete(listener)
      wake?.()
    }
    this.listeners.add(listener)
    signal.addEventListener('abort', stop, { once: true })
    try {
      while (!signal.aborted) {
        if (pending !== delivered) {
          delivered = pending
          yield delivered
        } else {
          await new Promise((resolve) => { wake = resolve })
          wake = undefined
        }
      }
    } finally {
      stop()
      signal.removeEventListener('abort', stop)
    }
  }

  async configure(username, password) {
    const name = typeof username === 'string' ? username.trim() : ''
    const secret = typeof password === 'string' ? password : ''
    if (!name) throw new Error('请输入同济统一身份认证账号')
    if (!secret) throw new Error('请输入密码')
    const signal = await this.setAccount({ username: name, password: secret })
    return signal.aborted ? this.state : this.refresh()
  }

  async forget() {
    await this.setAccount()
    return this.state
  }

  setAccount(account) {
    // 凭据写入按调用顺序完成。提交新凭据后，立即取消旧账号的网络请求。
    const write = this.credentialWrite.then(async () => {
      if (account) {
        await this.ctx.credentials.modifyRecord(ACCOUNT_KEY, async () => ({ kind: 'grant', payload: account }))
      } else {
        await this.ctx.credentials.deleteRecord(ACCOUNT_KEY)
      }
      this.accountSession.abort()
      this.accountSession = new AbortController()
      this.pendingChallenge?.jar.clear()
      this.pendingChallenge = undefined
      this.token = undefined
      this.inflight = undefined
      this.usageInflight = undefined
      this.usageRange = undefined
      this.fetchedAt = account ? 0 : Date.now()
      this.publish({
        ...EMPTY_ACCOUNT_STATE,
        status: account ? 'loading' : 'unconfigured',
        configured: Boolean(account),
        username: account?.username ?? null,
      })
      return this.accountSession.signal
    })
    this.credentialWrite = write.catch(() => {})
    return write
  }

  publish(next) {
    const frozen = Object.freeze({ ...next, serial: ++this.serial })
    this.state = frozen
    for (const listener of this.listeners) {
      try {
        listener(frozen)
      } catch {
        // A broken subscriber must not break the poller.
      }
    }
    return frozen
  }

  async readAccount() {
    const record = await this.ctx.credentials.readRecord(ACCOUNT_KEY)
    const payload = record?.kind === 'grant' ? record.payload : undefined
    const username = typeof payload?.username === 'string' ? payload.username.trim() : ''
    const password = typeof payload?.password === 'string' ? payload.password : ''
    if (!username || !password) return undefined
    return { username, password }
  }

  async login(account, signal) {
    const outcome = await ssoStart(account, signal)
    if (signal.aborted && outcome.kind === 'challenge') outcome.challenge.jar.clear()
    signal.throwIfAborted()
    if (outcome.kind === 'challenge') {
      // 短信二级认证：把 challenge 留在内存里，等用户回填验证码。
      this.pendingChallenge = outcome.challenge
      throw new SmsChallengePending(outcome.challenge)
    }
    this.pendingChallenge = undefined
    this.token = outcome.token
    return outcome.token
  }

  /**
   * 用户填完短信验证码后调用。成功即拿到令牌并把面板切回余额。
   */
  async submitCode(code) {
    const text = typeof code === 'string' ? code.trim() : ''
    if (!/^[0-9]{1,6}$/.test(text)) throw new Error('请输入短信中的数字验证码')
    return this.withSmsChallenge(async (challenge, signal) => {
      const token = await ssoFinish(challenge, text, signal)
      signal.throwIfAborted()
      challenge.jar.clear()
      this.pendingChallenge = undefined
      this.token = token
      this.fetchedAt = 0
      return this.refresh()
    })
  }

  /** 重新发一条短信（IAM 有 180 秒冷却，太快会返回提示）。 */
  async resendCode() {
    return this.withSmsChallenge(async (challenge, signal) => {
      const failure = await sendSmsCode(challenge, signal)
      signal.throwIfAborted()
      if (failure) throw new Error(failure)
      return this.publish({ ...this.state, status: 'challenge', challenge: describeChallenge(challenge), message: null })
    })
  }

  async withSmsChallenge(action) {
    const challenge = this.pendingChallenge
    if (!challenge) throw new Error('没有待验证的登录请求，请重新登录')
    if (challenge.busy) throw new Error('正在处理短信验证码，请稍候')
    if (this.expireChallenge(challenge)) throw new Error(SMS_EXPIRED)
    challenge.busy = true
    try {
      return await action(challenge, this.accountSession.signal)
    } finally {
      challenge.busy = false
    }
  }

  expireChallenge(challenge) {
    if (Date.now() < challenge.createdAt + SMS_CHALLENGE_TTL) return false
    challenge.jar.clear()
    if (this.state.challenge) {
      this.publish({ ...this.state, status: 'error', challenge: null, message: SMS_EXPIRED })
    }
    return true
  }

  async fetchOverview(token, signal) {
    return apiRequest('GET', '/billing/overview', { token, signal })
  }

  /**
   * 统计接口没有可用数据时保留上一次结果。
   */
  async fetchUsage(token, signal) {
    const ranges = this.usageRange ? [this.usageRange] : USAGE_RANGES
    let stats = undefined
    let usedRange = null
    for (const range of ranges) {
      const response = await apiRequest('GET', '/my-usage/stats', { token, signal, query: { kind: 'plan', range } })
      if (response.status === 401) return null
      if (response.status === 200 && response.body?.data) {
        stats = response.body.data
        usedRange = range
        break
      }
    }
    if (!stats) return null
    const history = await apiRequest('GET', '/my-usage/history', { token, signal, query: { months: 12 } })
    return normalizeUsage({
      range: usedRange,
      stats,
      history: history.status === 200 ? history.body?.data : undefined,
    })
  }

  refresh() {
    if (this.inflight) return this.inflight
    if (this.pendingChallenge) {
      // 等待验证码期间只检查有效期。会话过期后由用户重新登录。
      if (!this.pendingChallenge.busy) this.expireChallenge(this.pendingChallenge)
      return Promise.resolve(this.state)
    }
    const inflight = this.runRefresh(this.accountSession.signal).finally(() => {
      if (this.inflight === inflight) this.inflight = undefined
    })
    this.inflight = inflight
    return inflight
  }

  /**
   * 只刷统计、不重登也不动余额：设置页的「刷新统计」按钮走这里。
   * 拿不到 token 时退化成整轮刷新，保证首次点也能出数。
   */
  refreshUsage() {
    const token = this.token
    if (!token) return this.refresh()
    if (this.usageInflight?.token === token) return this.usageInflight.promise
    const signal = this.accountSession.signal
    const promise = this.fetchUsage(token, signal)
      .then((usage) => {
        if (usage && !signal.aborted && this.token === token) {
          this.usageRange = usage.range
          this.publish({ ...this.state, usage })
        }
        return this.state
      }, () => this.state)
      .finally(() => {
        if (this.usageInflight?.promise === promise) this.usageInflight = undefined
      })
    this.usageInflight = { token, promise }
    return promise
  }

  async runRefresh(signal) {
    if (signal.aborted) return this.state
    this.publish({ ...this.state, status: 'loading' })
    let account
    try {
      account = await this.readAccount()
    } catch (error) {
      if (!signal.aborted) {
        this.fetchedAt = Date.now()
        this.publish({ ...this.state, status: 'error', message: `读取凭据失败：${error?.message ?? error}` })
      }
      return this.state
    }
    if (signal.aborted) return this.state
    if (!account) {
      this.token = undefined
      this.fetchedAt = Date.now()
      return this.publish(EMPTY_ACCOUNT_STATE)
    }

    try {
      let token = this.token ?? await this.login(account, signal)
      let response = await this.fetchOverview(token, signal)
      signal.throwIfAborted()
      if (response.status === 401) {
        this.token = undefined
        token = await this.login(account, signal)
        response = await this.fetchOverview(token, signal)
        signal.throwIfAborted()
      }
      if (response.status !== 200) throw new Error(messageOf(response, '同济平台余额查询失败'))
      const overview = response.body?.data ?? {}
      const { mode, points } = pickBalance(overview)
      this.fetchedAt = Date.now()
      this.publish({
        ...this.state,
        status: 'ready',
        configured: true,
        mode,
        points,
        tokensPerPoint: typeof overview.tokens_per_point === 'number' ? overview.tokens_per_point : null,
        username: account.username,
        challenge: null,
        message: null,
        updatedAt: Date.now(),
      })
      // 余额先显示，用量失败或超时都保留上一次统计。
      void this.refreshUsage()
    } catch (error) {
      if (signal.aborted) return this.state
      this.fetchedAt = Date.now()
      if (error instanceof SmsChallengePending) {
        this.publish({
          ...this.state,
          status: 'challenge',
          configured: true,
          username: account.username,
          challenge: describeChallenge(error.challenge),
          message: null,
        })
        return this.state
      }
      this.publish({
        ...this.state,
        status: 'error',
        configured: true,
        username: account.username,
        message: error?.message ?? String(error),
      })
    }
    return this.state
  }
}

Object.defineProperty(TongjiBalance.prototype, REMOTE_METHODS, {
  configurable: true,
  value: Object.freeze({
    version: 1,
    methods: Object.freeze([
      { method: 'snapshot', invocation: Object.freeze({ kind: 'direct' }) },
      { method: 'watch', mode: 'stream', invocation: Object.freeze({ kind: 'direct' }) },
      { method: 'configure', invocation: Object.freeze({ kind: 'direct' }) },
      { method: 'forget', invocation: Object.freeze({ kind: 'direct' }) },
      { method: 'submitCode', invocation: Object.freeze({ kind: 'direct' }) },
      { method: 'resendCode', invocation: Object.freeze({ kind: 'direct' }) },
      { method: 'refreshUsage', invocation: Object.freeze({ kind: 'direct' }) },
    ]),
  }),
})

export { TongjiBalance as default }
