# dsh-tongji-agi — 同济 AI 平台路由与余额面板

把同济大学人工智能服务平台（`agi.tongji.edu.cn`）接进 DeepSeek Harness，做两件事：

1. **模型路由**：以 `llm-pi-ai` 的一个 provider（`tongji`）提供 8 个对话模型，走 OpenAI Chat Completions 协议。
2. **余额与用量面板**：注册 `tongjiBalance` 服务，在 Web 客户端设置页显示账户余额、积分与用量统计，并在左侧栏底部显示一行积分余额。

两半互相独立：只用模型不需要登录 SSO；只用面板也不需要 API key（面板走统一身份认证）。

---

## 安装与启用

### 从 GitHub 安装（推荐）

在 Harness 的**设置 → 插件 → 安装**里填仓库地址：

```
github:1Jaron/dsh-tongji-agi
```

或者用完整写法，两者等价：

```
https://github.com/1Jaron/dsh-tongji-agi
```

装完自动写入 profile 的 `dsh.profile.bundles` 并启用。仓库里本包位于根目录，所以上面这种写法就够；
若你把插件放进 monorepo 子目录，则要带路径：`github:<user>/<repo>#path:dsh-tongji-agi`。

**装之前确认本机有 `git`**（`git --version` 能跑）。DSH 自带 `node` / `pnpm` / `python`，但**不捆绑 git**。
插件管理器在调用 pnpm 之前会先跑一次 `git ls-remote -- <repo> HEAD` 探测连通性（超时 5 秒），
失败即中止，报「无法访问 GitHub」。pnpm 不用自己装——启动器自带的优先于 PATH。

国内网络直连 GitHub 可能失败，此时会提示「无法连接 github.com」：GitHub 地址和 `.tgz` 直链**不经过安装源**，
设置里的「改用国内镜像」只对 npm 包名生效，帮不上忙，需要给 git 配代理，或改用下面的本地方式。

本包没有构建脚本，所以不会触发 pnpm 的「允许这些脚本并重试」流程。

### 从本地目录安装（开发用）

在插件页填插件目录的绝对路径即可，或者手工挂 `link:`：

```json
// $DSH_HOME/profiles/<name>/package.json
{
  "dependencies": {
    "dsh-tongji-agi": "link:C:/path/to/dsh-tongji-agi"
  },
  "dsh": {
    "profile": {
      "bundles": ["dsh-tongji-agi"]
    }
  }
}
```

`link:` 安装直接链接源码目录，**不经过打包**，所以改文件立刻生效（`index.js` 仍需重启）。也正因为如此，
`package.json` 的 `files` 数组对 `link:` 完全不起作用——它只过滤 `npm pack` / 从 git 抓取的内容。

### 加载机制

`dsh.profile.bundles` 里的每一项都会被读取其 `package.json` 的 `dsh.bundle.patch`，本包指向 `./cordis.patch.yml`。宿主**不会**监听 `index.js` 的变化，改完需要重启；`lib/client.js` 由 client-hmr 负责热载。

启用后：

- 模型选择器出现「同济 AI 平台」下的 8 个模型；
- 设置页多出「同济余额」分区；
- 左侧栏底部多出一行积分余额（可在设置页勾选显示项）。

---

## 端点与协议

| 协议 | 端点 | baseURL | 状态 |
| --- | --- | --- | --- |
| OpenAI Chat Completions | `POST /v1/chat/completions` | `https://agi.tongji.edu.cn/v1` | **默认启用**，route 名 `tongji` |
| OpenAI Responses | `POST /v1/responses` | `https://agi.tongji.edu.cn/v1` | 在 patch 里注释，按需启用 |
| Anthropic Compatible | `POST /anthropic/v1/messages` | `https://agi.tongji.edu.cn/anthropic` | 在 patch 里注释，按需启用 |

三种端点共用同一把 key。`cordis.patch.yml` 里把后两种写成注释块（用 YAML flow 写法压缩过），取消注释即可；注意 patch 是**整行替换** `config`，不是深合并，所以同时启用多个 provider 时要把它们写在同一份 `providers` 映射里。

---

## 密钥

`cordis.patch.yml` 里的 `apiKeyEnv: TONGJI_API_KEY` 只是**引用名**，不是密钥本身。每次请求由凭据 seam 解析，优先级：托管凭据库（`$DSH_HOME/.credentials.yaml`）→ 进程环境变量 → `.env`。

任选一种：

```yaml
# $DSH_HOME/.credentials.yaml
TONGJI_API_KEY: sk-...
```

```powershell
$env:TONGJI_API_KEY = 'sk-...'
```

没配时请求会直接失败并报 `MISSING_CREDENTIAL`（宿主抛的，不是平台返回的）。

---

## 模型

`models` 按该 key 实际可用的 `GET /v1/models` 填写。2026-11-06 实测 10 个，其中 Qwen3-Embedding、Qwen3-Reranker 不是对话模型，未列入；下表是 patch 里启用的 8 个。

| id | 备注 |
| --- | --- |
| `DeepSeek-V4.1-Flash` | 默认模型；推理内容在 `message.reasoning` |
| `GLM-5.3` | |
| `GLM-5.3-Flash` | |
| `Qwen3.8-Flash-Next` | 推理内容在 `reasoning_content` |
| `Qwen3.8-27B` | 推理内容在 `reasoning_content` |
| `MiniMax-M3.1-Flash` | |
| `MiMo-V2.6-Pro` | |
| `MiMo-V2.6-Flash` | |

每个模型都写了 `contextWindow: 65536` / `maxTokens: 8192` / `input: [text]`；provider 级也有同名的 `defaultContextWindow` / `defaultMaxTokens`，保留逐模型显式值是为了方便单独覆盖。

平台文档里提到但**不可用**的：`DeepSeek-R1` 系列返回

```
400 {"error":{"message":"Invalid model: DeepSeek-R1"}}
```

加模型时 id 必须与 `GET /v1/models` 返回的一字不差（区分大小写与连字符）。

---

## 网络与常见错误

三种失败要分清：

| 现象 | 原因 |
| --- | --- |
| `MISSING_CREDENTIAL` | 本地没配 `TONGJI_API_KEY` |
| `403 {"message":"当前网络环境不支持"}` | 平台侧网段白名单，见下 |
| `403 API密钥不存在` | key 拼错或已失效 |

### 关于 `403 当前网络环境不支持`

这是平台按**来源 IP 网段**做的白名单拦截，不是插件能绕过的（伪造 `X-Forwarded-For` 无效）。

已知踩坑：校园无线走的是运营商 CGNAT 出口（`100.64.0.0/10`，实测 `100.80.1.98/15`），而套餐里勾的
「校园网」网段并不包含它 —— 于是人在校园里、连着校园 Wi-Fi，照样 403。

三种解法：

1. 连学校 VPN 后再调（出口落在白名单网段内）；
2. 换有线 / 其他已备案网段；
3. 找平台管理员在「系统管理 → 网段管理」里把 `100.64.0.0/10` 加进允许列表。

排查顺序建议：先在浏览器里用同一把 key `curl` 一次 `POST /v1/chat/completions`。浏览器能通而 Harness 不通，
才轮到查本地代理；两边都 403 就是网段问题，跟插件无关。

---

## 余额与用量

面板通过 SSO 拿一个 JWT 当 Bearer，然后调：

| 用途 | 请求 |
| --- | --- |
| 余额 | `GET /api/v1/billing/overview` |
| 用量统计 | `GET /api/v1/my-usage/stats?kind=plan&range=7d` |
| 用量历史 | `GET /api/v1/my-usage/history?months=12` |

余额读 `total_available`（点数模式）或 `wallet_balance`（订阅模式），面板按 `mode` 自动切换单位。401 时会清 token、重登一次再重试。

`range` 依次尝试 `1d` / `7d` / `30d`，后续沿用第一个成功的区间。余额先显示，用量在后台刷新。用量统计请求失败时保留上次结果。设置页的「刷新统计」使用当前令牌，首次还没有令牌时会先刷新余额。

---

## 登录（SSO + 短信二次认证）

账号密码不落盘到明文配置，而是写进宿主凭据库的 `dsh-tongji-agi/account` 记录（`kind: 'grant'`），登录流程：

1. 向 `https://agi.tongji.edu.cn/api/v1/auth/sso/discover?domain=tongji` 获取统一身份认证的登录地址。
2. 跟随 3 次 302 到登录页，从 HTML 里取三样东西：`authen1Form` 的 `action`、`authnLcKey`，以及内联脚本 `$("#spAuthChainCode1").val('...')` 里的 `spAuthChainCode`（**不是**那个隐藏域的 `value`，它是空串）。
3. 两次 POST：先 `ActionAuthChain`（带 `X-Requested-With`，返回 `{"loginFailed":"false"}`），再 `AuthnEngine`。`j_checkcode` 留空时必须原样回传 `请输入验证码`，否则被当成校验失败。
4. 成功后 302 到 `https://agi.tongji.edu.cn/sso/callback?token=<JWT>`，把这个 JWT 直接当 `Authorization: Bearer` 用。

SSO 仅访问 `iam.tongji.edu.cn` 和 `agi.tongji.edu.cn` 的 HTTPS 地址，密码只提交给 IAM，两站的会话 Cookie 分开保存。清除或更换账号会取消旧账号的查询，并清空面板里的旧账号数据。

### 短信二次认证

部分账号会触发 IAM 增强认证。识别条件是响应体 `view === 'biometrics'`（或 `'4'`）、`authList` 含 `sms`，或页面文本含「增强认证」——`loginFailed: 'popViewException'` 不能当判据，正常情况它也是 null。

触发后服务进入 `challenge` 状态并**暂停自动刷新**（否则 30 秒轮询会重发短信、顶掉用户正在填的那次），面板显示验证码输入框：

- **提交**：`submitCode(code)` 接受 1–6 位数字。输错后可在当前会话继续尝试。会话有效期为 170 秒，过期后需重新登录。
- **重发**：`resendCode()`，IAM 侧有 180 秒冷却，太频繁会报「验证码发送过于频繁，请稍后再试」。
- 没有待验证请求时提交会报「没有待验证的登录请求，请重新登录」。

对应远程方法 `submitCode` / `resendCode`，UI 文案 key 是 `statusChallenge` / `challenge*` 一组（12 个）。

---

## 侧边栏积分余额栏

注册在 `sidebar.footer.action` 槽位（id `tongji-balance-rail`，`order: -10`），即左侧工作区列表下方那一行。显示项可勾选：积分、今日用量、主用模型、更新时间；四项全关时回落为只显示积分余额。

选择存在 `localStorage` 的 `dsh-tongji-agi:rail-fields`（宿主没有 settings 服务，与 dsh-cost-meter 的做法一致），换浏览器或清缓存会回到默认值（只显示积分）。

---

## 文件与包约定

| 文件 | 作用 |
| --- | --- |
| `index.js` | host 半：`TongjiBalance` 服务、SSO、余额与用量拉取 |
| `lib/typert.host.js` | host 侧远程方法声明（`TYPERT`） |
| `lib/client.js` | 浏览器半：设置分区、侧边栏行、内联文案与样式 |
| `cordis.patch.yml` | bundle patch：provider 路由 + 注册 `tongji-balance` |
| `locale/{zh,en}.json` | 插件管理器展示用的元数据 |
| `icon.svg` | 插件图标 |
| `LICENSE` | MIT |
| `.gitattributes` | 强制 LF，避免 Windows 检出时 CRLF 污染 YAML / JS |

7 个远程方法（`snapshot` / `watch` / `configure` / `forget` / `submitCode` / `resendCode` / `refreshUsage`）必须在三处保持一致：`index.js` 的 `REMOTE_METHODS` 方法表、`lib/typert.host.js` 的 `invocations`、`lib/client.js` 的 `CONTRIBUTION.descriptors`。任一处缺失，客户端就调不到该方法（`remote.tongji` 静默降级，只在日志里 warn）。

`package.json` 的关键字段：

```json
{
  "type": "module",
  "engines": { "node": "^22.19.0 || >=24.0.0" },
  "exports": {
    ".": "./index.js",
    "./client": "./lib/client.js",
    "./typert": "./lib/typert.host.js",
    "./locale/*.json": "./locale/*.json",
    "./icon": "./icon.svg",
    "./package.json": "./package.json"
  },
  "files": ["index.js", "lib", "cordis.patch.yml", "locale/*.json", "icon.svg", "README.md"],
  "dsh": {
    "bundle": { "patch": "./cordis.patch.yml" },
    "client": { "platform": "web" }
  }
}
```

- `exports` 六项都必需：`./typert` 缺失时宿主静默跳过远程方法挂载；`./package.json` 缺失会让插件管理器读不到元数据。
- `dsh.client.platform` 必须是 `"web"`，否则宿主不加载 client bundle，且**不报错**。
- 没有 `main` / `types` / `scripts`：本包无 TS 构建、无 npm 脚本，`exports["."]` 已足够。
- 没有 `dependencies` / `devDependencies`：host 半只用 `node:https`，client 半从浏览器模块表取 React。装包不会拉任何第三方代码。
- `files` 决定从 git 安装时抓取哪些文件（`link:` 安装不看它）。新增运行期文件必须加进去，否则从 GitHub 装的用户会缺文件——而本地 `link:` 一切正常，很难复现。
- `repository` / `license` / `publishConfig` 只影响仓库页与 `npm publish`，不影响从 git 安装。

从 git 安装时，宿主**装完才**校验 `engines` 与 `peerDependencies`（不像 npm 包名那样装前就查）。不匹配会回滚
`package.json` / `pnpm-lock.yaml` / `node_modules` 并重装，所以失败时不必手工清理。

---

## 本地化

两套独立的文案体系，别混：

- **`locale/{zh,en}.json`** —— 只有 `meta.title` 和 `meta.description`，给插件管理器 / 市场列表展示用。
- **`lib/client.js` 里的 `DICTIONARIES`** —— 69 个运行时 UI key（状态、按钮、用量、短信验证等），随 client bundle 一起加载；`ctx.locale.register('dsh-tongji-agi.balance', DICTIONARIES)` 注册后，`t(key)` 优先走宿主 locale 服务，取不到再回落内联表。

加文案时两边都要动：给用户看的新按钮/新状态加到 `DICTIONARIES`（zh 与 en 各一份），只有插件描述变了才动 `locale/*.json`。

---

## 开发提示

- **代理**：Harness 可能带 `NODE_USE_ENV_PROXY=1` 和一个不可用的 `ALL_PROXY`（例如 `http://127.0.0.1:51926`），导致所有请求卡死。所以每次请求都显式传 `agent: directAgent()`（`new Agent({ keepAlive: false, maxSockets: 8 })`），不走环境代理。
- **样式**：宿主没有样式注入 API，`lib/client.js` 里全部用内联 `style` 对象。
- **依赖**：不能 `import 'zod'`，也不能 `import '@deepseek-ai/dsh-typert-protocol'`——本包没有任何 `dependencies`，无论 `link:` 挂载还是从 git 安装，装完都没有 `node_modules` 里的这些包，ESM 裸导入会 `ERR_MODULE_NOT_FOUND`，整条 entry 加载失败，client bundle 也不会进 `__DSH_BOOT__`。所以 `TongjiBalance` 是**普通 class**（不 `extends` 任何基类），协议字段自行实现，用 `ctx.provide('tongjiBalance', this)` 暴露。真要加依赖，必须同时写进 `dependencies` 和 `files`。
- **重启**：改 `index.js` 要重启 Harness；改 `lib/client.js` 有 client-hmr 自动热载。
- **超时**：所有平台请求 `REQUEST_TIMEOUT = 15_000`；余额轮询 `POLL_INTERVAL = 30_000`，`snapshot()` 缓存 `CACHE_TTL = 8_000`，轮询 timer 已 `unref()` 并在 `ctx.effect` 里清理。
