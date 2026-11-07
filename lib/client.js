/**
 * Client bundle for `dsh-tongji-agi`.
 *
 * Three jobs:
 *  1. mount the Typert remote contribution that backs `ctx.remote.tongji.*`
 *     (`snapshot`, `watch`, `configure`, `forget`);
 *  2. register a "同济余额" section in Settings;
 *  3. register a compact "积分余额" row in `sidebar.footer.action`, i.e. the
 *     strip right below the workspace list in the left sidebar.
 *
 * The bundle is an IIFE handed to `window.__ModuleLoader__.load`, so the
 * factory must stay side-effect free: everything happens inside `apply(ctx)`
 * and every registration is owned by `ctx.effect` / `ctx.slots.inject`.
 */

window.__ModuleLoader__.load({
	id: 'dsh-tongji-agi',
	factory(require) {
		const React = require('react');
		const h = React.createElement;

		const NS = 'dsh-tongji-agi.balance';
		const PACKAGE_NAME = 'dsh-tongji-agi';

		/** Strict codec: the host only needs `create().parse(value)`. */
		function codec(name) {
			const schema = { parse: (value) => value };
			return { mode: 'strict', typeSymbol: `${PACKAGE_NAME}#${name}`, schema, create: () => schema };
		}

		const BALANCE_STATE = codec('BalanceState');
		const STRING = codec('String');

		/** Remote contribution mirrored from `lib/typert.host.js`. */
		const CONTRIBUTION = {
			package: PACKAGE_NAME,
			descriptors: [
				{
					id: `${PACKAGE_NAME}#tongjiBalance/snapshot`,
					service: 'tongjiBalance',
					namespace: 'tongji',
					method: 'snapshot',
					invocation: { kind: 'direct' },
					parameters: [],
					result: BALANCE_STATE,
				},
				{
					id: `${PACKAGE_NAME}#tongjiBalance/watch`,
					service: 'tongjiBalance',
					namespace: 'tongji',
					method: 'watch',
					mode: 'stream',
					invocation: { kind: 'direct' },
					parameters: [],
					cancellation: { parameter: 'signal' },
					result: BALANCE_STATE,
				},
				{
					id: `${PACKAGE_NAME}#tongjiBalance/configure`,
					service: 'tongjiBalance',
					namespace: 'tongji',
					method: 'configure',
					invocation: { kind: 'direct' },
					parameters: [
						{ name: 'username', wire: 'username', source: 'json', codec: STRING },
						{ name: 'password', wire: 'password', source: 'json', codec: STRING },
					],
					result: BALANCE_STATE,
				},
				{
					id: `${PACKAGE_NAME}#tongjiBalance/forget`,
					service: 'tongjiBalance',
					namespace: 'tongji',
					method: 'forget',
					invocation: { kind: 'direct' },
					parameters: [],
					result: BALANCE_STATE,
				},
				{
					id: `${PACKAGE_NAME}#tongjiBalance/submitCode`,
					service: 'tongjiBalance',
					namespace: 'tongji',
					method: 'submitCode',
					invocation: { kind: 'direct' },
					parameters: [ { name: 'code', wire: 'code', source: 'json', codec: STRING } ],
					result: BALANCE_STATE,
				},
				{
					id: `${PACKAGE_NAME}#tongjiBalance/resendCode`,
					service: 'tongjiBalance',
					namespace: 'tongji',
					method: 'resendCode',
					invocation: { kind: 'direct' },
					parameters: [],
					result: BALANCE_STATE,
				},
				{
					id: `${PACKAGE_NAME}#tongjiBalance/refreshUsage`,
					service: 'tongjiBalance',
					namespace: 'tongji',
					method: 'refreshUsage',
					invocation: { kind: 'direct' },
					parameters: [],
					result: BALANCE_STATE,
				},
			],
		};

		const DICTIONARIES = {
			zh: {
				nav: '同济余额',
				title: '同济 AI 平台余额',
				description: '使用同济统一身份认证账号登录 agi.tongji.edu.cn，读取当前可用的点数或订阅额度。凭据保存在本机凭据库中。',
				status: '状态',
				statusIdle: '未查询',
				statusLoading: '查询中…',
				statusReady: '已同步',
				statusError: '查询失败',
				mode: '计费方式',
				modePoints: '按点数计费',
				modeSubscription: '订阅额度',
				points: '可用余额',
				pointsUnit: '点',
				railLabel: '积分余额',
				railHint: '同济 AI 平台当前可用点数',
				tokensPerPoint: '每点 Token',
				username: '统一身份认证账号',
				password: '密码',
				usernamePlaceholder: '学号或工号',
				passwordPlaceholder: '登录密码',
				save: '保存并登录',
				saving: '登录中…',
				forget: '清除凭据',
				refreshing: '刷新',
				updatedAt: '更新时间',
				usageTitle: '用量统计',
				usageHint: '数据来自同济 AI 平台的用量接口，与余额同一次登录读取。',
				usageRange: '统计区间',
				usageRangeDay: '今日',
				usageRangeWeek: '近 7 天',
				usageRangeMonth: '近 30 天',
				usageRangeAuto: '自动',
				usageUpdatedAt: '统计时间',
				usageCalls: '调用次数',
				usageTokens: 'Token 消耗',
				usageTodayTokens: '今日 Token',
				usagePointsCost: '消耗点数',
				usageModelShare: '模型占比',
				usageDaily: '每日 Token',
				usageRefresh: '刷新统计',
				usageRefreshing: '统计中…',
				usageEmpty: '暂无统计数据',
				railOptions: '侧边栏显示',
				railOptionsHint: '选择侧边栏积分余额栏要展示的内容。',
				railShowPoints: '积分余额',
				railShowToday: '今日 Token',
				railShowModel: '模型占比',
				railShowUpdated: '刷新时间',
				notConfigured: '尚未配置账号。填入同济统一身份认证账号与密码后即可查询余额。',
				configured: '已配置账号 {username}。',
				saved: '凭据已保存，余额将在数秒内刷新。',
				forgotten: '凭据已清除。',
				missingUsername: '请输入同济统一身份认证账号。',
				missingPassword: '请输入密码。',
				unavailable: '远程余额服务尚未就绪，请稍后重试。',
				mountFailed: '无法挂载余额远程服务。',
				empty: '—',
				statusChallenge: '等待短信验证码',
				challengeTitle: '需要短信验证',
				challengeSent: '同济统一身份认证已向 {mobile} 发送验证码，请在 3 分钟内填入下方输入框。',
				challengeSentNoMobile: '同济统一身份认证已发送短信验证码，请在 3 分钟内填入下方输入框。',
				challengeCode: '短信验证码',
				challengeCodePlaceholder: '手机收到的数字验证码',
				challengeSubmit: '提交验证码',
				challengeSubmitting: '验证中…',
				challengeResend: '重新发送',
				challengeExpired: '验证码已过期，请重新登录。',
				challengeMissing: '请输入短信中的数字验证码。',
				challengeResent: '验证码已重新发送。',
			},
			en: {
				nav: 'Tongji balance',
				title: 'Tongji AI platform balance',
				description: 'Sign in to agi.tongji.edu.cn with your Tongji unified account to read the remaining points or subscription quota. Credentials are stored in the local credential store.',
				status: 'Status',
				statusIdle: 'Not queried',
				statusLoading: 'Querying…',
				statusReady: 'In sync',
				statusError: 'Query failed',
				mode: 'Billing mode',
				modePoints: 'Points',
				modeSubscription: 'Subscription quota',
				points: 'Available balance',
				pointsUnit: 'points',
				railLabel: 'Points',
				railHint: 'Points currently available on the Tongji AI platform',
				tokensPerPoint: 'Tokens per point',
				username: 'Unified account',
				password: 'Password',
				usernamePlaceholder: 'Student or staff ID',
				passwordPlaceholder: 'Password',
				save: 'Save and sign in',
				saving: 'Signing in…',
				forget: 'Clear credentials',
				refreshing: 'Refresh',
				updatedAt: 'Updated',
				usageTitle: 'Usage',
				usageHint: 'Read from the Tongji AI platform usage endpoints with the same sign-in as the balance.',
				usageRange: 'Window',
				usageRangeDay: 'Today',
				usageRangeWeek: 'Last 7 days',
				usageRangeMonth: 'Last 30 days',
				usageRangeAuto: 'Auto',
				usageUpdatedAt: 'Sampled',
				usageCalls: 'Calls',
				usageTokens: 'Tokens',
				usageTodayTokens: 'Today',
				usagePointsCost: 'Points spent',
				usageModelShare: 'Model share',
				usageDaily: 'Daily tokens',
				usageRefresh: 'Refresh usage',
				usageRefreshing: 'Loading…',
				usageEmpty: 'No usage recorded yet',
				railOptions: 'Sidebar shows',
				railOptionsHint: 'Pick what the sidebar points rail displays.',
				railShowPoints: 'Points',
				railShowToday: 'Today tokens',
				railShowModel: 'Top model share',
				railShowUpdated: 'Refresh time',
				notConfigured: 'No account yet. Enter your Tongji unified account and password to read the balance.',
				configured: 'Signed in as {username}.',
				saved: 'Credentials saved; the balance refreshes within a few seconds.',
				forgotten: 'Credentials cleared.',
				missingUsername: 'Enter your Tongji unified account.',
				missingPassword: 'Enter your password.',
				unavailable: 'The remote balance service is not ready yet. Try again shortly.',
				mountFailed: 'Could not mount the balance remote service.',
				empty: '—',
				statusChallenge: 'Waiting for SMS code',
				challengeTitle: 'SMS verification required',
				challengeSent: 'Tongji unified sign-in sent a code to {mobile}. Enter it below within 3 minutes.',
				challengeSentNoMobile: 'Tongji unified sign-in sent an SMS code. Enter it below within 3 minutes.',
				challengeCode: 'SMS code',
				challengeCodePlaceholder: 'Numeric code from your phone',
				challengeSubmit: 'Submit code',
				challengeSubmitting: 'Verifying…',
				challengeResend: 'Resend code',
				challengeExpired: 'The code expired. Please sign in again.',
				challengeMissing: 'Enter the numeric SMS code.',
				challengeResent: 'The code was sent again.',
			},
		};

		/** Minimal cross-component store so the panel reacts to a late mount. */
		const store = {
			api: null,
			listeners: new Set(),
			subscribe(listener) {
				store.listeners.add(listener);
				return () => {
					store.listeners.delete(listener);
				};
			},
			publish(api) {
				store.api = api;
				for (const listener of [...store.listeners]) listener();
			},
		};

		function useApi() {
			const [api, setApi] = React.useState(store.api);
			React.useEffect(() => store.subscribe(() => setApi(store.api)), []);
			return api;
		}

		// Accept numeric strings as well: the host is the source of truth for the
		// wire type, but a stale cached state or a future host build must not be
		// able to blank the row again.
		function formatNumber(value) {
			const numeric = typeof value === 'number' ? value : typeof value === 'string' ? Number(value) : NaN;
			if (!Number.isFinite(numeric)) return null;
			if (numeric === 0) return '0';
			if (Math.abs(numeric) < 0.0001) return '<0.0001';
			return String(Math.round(numeric * 10000) / 10000);
		}

		function formatTime(value, locale) {
			if (typeof value !== 'number' || !Number.isFinite(value)) return null;
			try {
				return new Intl.DateTimeFormat(locale === 'zh' ? 'zh-CN' : 'en-US', {
					hour: '2-digit',
					minute: '2-digit',
					second: '2-digit',
				}).format(new Date(value));
			} catch {
				return null;
			}
		}

		const styles = {
			root: { display: 'flex', flexDirection: 'column', gap: '12px', padding: '4px 0' },
			header: { display: 'flex', flexDirection: 'column', gap: '4px' },
			title: { fontSize: '14px', fontWeight: 600, margin: 0 },
			description: { fontSize: '12px', opacity: 0.65, margin: 0, lineHeight: 1.5 },
			row: { display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: '12px', fontSize: '13px' },
			label: { opacity: 0.65 },
			value: { fontWeight: 600, fontVariantNumeric: 'tabular-nums' },
			form: { display: 'flex', flexDirection: 'column', gap: '8px' },
			field: { display: 'flex', flexDirection: 'column', gap: '4px' },
			fieldLabel: { fontSize: '12px', opacity: 0.7 },
			input: {
				width: '100%',
				boxSizing: 'border-box',
				padding: '6px 8px',
				fontSize: '13px',
				borderRadius: '6px',
				border: '1px solid rgba(127, 127, 127, 0.35)',
				background: 'transparent',
				color: 'inherit',
			},
			actions: { display: 'flex', gap: '8px', flexWrap: 'wrap' },
			button: {
				padding: '6px 12px',
				fontSize: '12px',
				borderRadius: '6px',
				border: '1px solid rgba(127, 127, 127, 0.35)',
				background: 'transparent',
				color: 'inherit',
				cursor: 'pointer',
			},
			primary: { borderColor: 'rgba(64, 128, 255, 0.6)', color: 'rgb(64, 128, 255)' },
			notice: { fontSize: '12px', lineHeight: 1.5, margin: 0 },
			error: { fontSize: '12px', lineHeight: 1.5, margin: 0, color: 'rgb(220, 80, 80)' },
			ok: { fontSize: '12px', lineHeight: 1.5, margin: 0, color: 'rgb(60, 160, 100)' },
			challenge: {
				display: 'flex',
				flexDirection: 'column',
				gap: '8px',
				padding: '10px 12px',
				borderRadius: '8px',
				border: '1px solid rgba(240, 170, 60, 0.5)',
				background: 'rgba(240, 170, 60, 0.08)',
			},
			challengeTitle: { fontSize: '13px', fontWeight: 600, margin: 0 },
			rail: {
				display: 'flex',
				alignItems: 'baseline',
				justifyContent: 'space-between',
				gap: '12px',
				width: '100%',
				boxSizing: 'border-box',
				padding: '2px 8px 4px',
				fontSize: '12px',
				lineHeight: 1.4,
				cursor: 'default',
			},
			railLabel: { opacity: 0.65, whiteSpace: 'nowrap' },
			railValue: { fontWeight: 600, fontVariantNumeric: 'tabular-nums', textAlign: 'right' },
			railStack: {
				display: 'flex',
				flexDirection: 'column',
				gap: '2px',
				width: '100%',
				boxSizing: 'border-box',
				padding: '2px 8px 4px',
				fontSize: '12px',
				lineHeight: 1.4,
				cursor: 'default',
			},
			railLine: { display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: '8px' },
			railSub: { fontSize: '11px', opacity: 0.6, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' },
			section: {
				display: 'flex',
				flexDirection: 'column',
				gap: '8px',
				paddingTop: '4px',
				borderTop: '1px solid rgba(127, 127, 127, 0.25)',
			},
			sectionHead: { display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: '12px' },
			sectionTitle: { fontSize: '13px', fontWeight: 600, margin: 0 },
			sectionHint: { fontSize: '12px', opacity: 0.6, margin: 0, lineHeight: 1.5 },
			bar: {
				position: 'relative',
				height: '6px',
				borderRadius: '3px',
				background: 'rgba(127, 127, 127, 0.25)',
				overflow: 'hidden',
			},
			barFill: { position: 'absolute', left: 0, top: 0, bottom: 0, borderRadius: '3px', background: 'rgb(64, 128, 255)' },
			modelRow: { display: 'flex', flexDirection: 'column', gap: '3px' },
			modelHead: { display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: '12px', fontSize: '12px' },
			modelName: { overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' },
			modelValue: { fontVariantNumeric: 'tabular-nums', opacity: 0.85, whiteSpace: 'nowrap' },
			daily: { display: 'flex', alignItems: 'flex-end', gap: '2px', height: '36px' },
			dailyBar: { flex: '1 1 0', minWidth: '2px', borderRadius: '2px 2px 0 0', background: 'rgba(64, 128, 255, 0.55)' },
			toggles: { display: 'flex', flexWrap: 'wrap', gap: '6px 14px' },
			toggle: { display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', cursor: 'pointer' },
			toggleBox: { margin: 0, accentColor: 'rgb(64, 128, 255)', cursor: 'pointer' },
		};

		// 侧边栏展示项由用户自选，偏好存在浏览器里：宿主插件没有 settings 服务，
		// 而 localStorage 与官方 cost-meter 的做法一致，刷新后仍然生效。
		const RAIL_STORAGE_KEY = 'dsh-tongji-agi:rail-fields';
		const RAIL_FIELD_ORDER = [ 'points', 'today', 'model', 'updated' ];
		const DEFAULT_RAIL_FIELDS = Object.freeze({ points: true, today: false, model: false, updated: false });
		const railPrefs = { value: DEFAULT_RAIL_FIELDS, listeners: new Set() };

		function readRailFields() {
			if (typeof window === 'undefined' || window.localStorage === undefined) return DEFAULT_RAIL_FIELDS;
			try {
				const raw = window.localStorage.getItem(RAIL_STORAGE_KEY);
				if (raw === null) return DEFAULT_RAIL_FIELDS;
				const parsed = JSON.parse(raw);
				if (parsed === null || typeof parsed !== 'object') return DEFAULT_RAIL_FIELDS;
				return Object.freeze({
					points: parsed.points !== false,
					today: parsed.today === true,
					model: parsed.model === true,
					updated: parsed.updated === true,
				});
			} catch {
				return DEFAULT_RAIL_FIELDS;
			}
		}

		function writeRailFields(next) {
			railPrefs.value = next;
			if (typeof window !== 'undefined' && window.localStorage !== undefined) {
				try {
					window.localStorage.setItem(RAIL_STORAGE_KEY, JSON.stringify(next));
				} catch {
					// Private mode: keep the in-memory value and move on.
				}
			}
			for (const listener of [ ...railPrefs.listeners ]) {
				try {
					listener();
				} catch {
					// A broken subscriber must not break the toggle.
				}
			}
		}

		function useRailFields() {
			const [value, setValue] = React.useState(() => {
				railPrefs.value = readRailFields();
				return railPrefs.value;
			});
			React.useEffect(() => {
				const listener = () => setValue(railPrefs.value);
				railPrefs.listeners.add(listener);
				return () => railPrefs.listeners.delete(listener);
			}, []);
			const toggle = React.useCallback((field) => {
				writeRailFields(Object.freeze({ ...railPrefs.value, [field]: railPrefs.value[field] !== true }));
			}, []);
			return [ value, toggle ];
		}

		// Token 数动辄七位，侧栏与统计块都用紧凑写法，完整数值留在 title 里。
		function formatCompact(value) {
			const numeric = typeof value === 'number' ? value : typeof value === 'string' ? Number(value) : NaN;
			if (!Number.isFinite(numeric)) return null;
			const abs = Math.abs(numeric);
			if (abs >= 1e9) return `${Math.round((numeric / 1e9) * 100) / 100}B`;
			if (abs >= 1e6) return `${Math.round((numeric / 1e6) * 100) / 100}M`;
			if (abs >= 1e3) return `${Math.round((numeric / 1e3) * 100) / 100}K`;
			return String(Math.round(numeric * 100) / 100);
		}

		function formatShare(value) {
			const numeric = typeof value === 'number' ? value : typeof value === 'string' ? Number(value) : NaN;
			if (!Number.isFinite(numeric)) return null;
			return `${Math.round(numeric * 1000) / 10}%`;
		}

		function usageOf(state) {
			return state?.usage !== null && typeof state?.usage === 'object' ? state.usage : null;
		}

		function latestDaily(usage) {
			const daily = Array.isArray(usage?.daily) ? usage.daily : [];
			return daily.length === 0 ? null : daily[daily.length - 1];
		}

		function topModelOf(usage) {
			const models = Array.isArray(usage?.models) ? usage.models : [];
			return models.length === 0 ? null : models[0];
		}

		function rangeLabel(t, range) {
			if (range === '1d') return t('usageRangeDay');
			if (range === '7d') return t('usageRangeWeek');
			if (range === '30d') return t('usageRangeMonth');
			return t('usageRangeAuto');
		}

		function BalanceSection(props) {
			const { t, locale } = props;
			const api = useApi();
			const [state, setState] = React.useState(null);
			const [username, setUsername] = React.useState('');
			const [password, setPassword] = React.useState('');
			const [code, setCode] = React.useState('');
			const [busy, setBusy] = React.useState(false);
			const [notice, setNotice] = React.useState(null);
			const [failure, setFailure] = React.useState(null);

			// Follow the streamed state: the service publishes on login, on the
			// 30 s poll and whenever credentials change.
			React.useEffect(() => {
				if (api === null) return undefined;
				const controller = new AbortController();
				let live = true;
				(async () => {
					try {
						for await (const next of api.watch(controller.signal)) {
							if (!live) return;
							if (next && typeof next === 'object') setState(next);
						}
					} catch (cause) {
						if (live && controller.signal.aborted !== true) {
							setFailure(cause instanceof Error ? cause.message : String(cause));
						}
					}
				})();
				return () => {
					live = false;
					controller.abort();
				};
			}, [api]);

			React.useEffect(() => {
				if (state === null || state.username === null || state.username === undefined) return;
				setUsername((current) => (current === '' ? String(state.username) : current));
			}, [state]);

			const run = React.useCallback(
				async (action) => {
					setBusy(true);
					setNotice(null);
					setFailure(null);
					try {
						const answer = await action();
						if (answer === undefined || answer === null) {
							setFailure(t('unavailable'));
							return null;
						}
						if (answer.ok !== true) {
							setFailure(answer.error?.message ?? t('unavailable'));
							return null;
						}
						if (answer.value && typeof answer.value === 'object') setState(answer.value);
						return answer.value ?? null;
					} catch (cause) {
						setFailure(cause instanceof Error ? cause.message : String(cause));
						return null;
					} finally {
						setBusy(false);
					}
				},
				[t],
			);

			const submit = (event) => {
				event.preventDefault();
				if (api === null) {
					setFailure(t('unavailable'));
					return;
				}
				const account = username.trim();
				if (account === '') {
					setFailure(t('missingUsername'));
					return;
				}
				if (password === '') {
					setFailure(t('missingPassword'));
					return;
				}
				void run(() => api.configure(account, password)).then((value) => {
					if (value === null) return;
					setPassword('');
					setNotice(t('saved'));
				});
			};

			const forget = () => {
				if (api === null) {
					setFailure(t('unavailable'));
					return;
				}
				void run(() => api.forget()).then((value) => {
					if (value === null) return;
					setUsername('');
					setPassword('');
					setNotice(t('forgotten'));
				});
			};

			const refresh = () => {
				if (api === null) {
					setFailure(t('unavailable'));
					return;
				}
				void run(() => api.snapshot());
			};

			// 统计单独刷：不动余额、不重登，失败时保留上一轮数据。
			const refreshUsage = () => {
				if (api === null) {
					setFailure(t('unavailable'));
					return;
				}
				void run(() => api.refreshUsage());
			};

			// 二级认证：把用户填的短信验证码交给后端，成功后面板自己切回余额。
			const submitChallenge = (event) => {
				event.preventDefault();
				if (api === null) {
					setFailure(t('unavailable'));
					return;
				}
				const entered = code.trim();
				if (/^[0-9]{1,6}$/.test(entered) !== true) {
					setFailure(t('challengeMissing'));
					return;
				}
				void run(() => api.submitCode(entered)).then((value) => {
					if (value === null) return;
					setCode('');
					setNotice(t('saved'));
				});
			};

			const resend = () => {
				if (api === null) {
					setFailure(t('unavailable'));
					return;
				}
				void run(() => api.resendCode()).then((value) => {
					if (value === null) return;
					setCode('');
					setNotice(t('challengeResent'));
				});
			};

			const configured = state?.configured === true;
			const status = state?.status ?? 'idle';
			const challenge = state?.challenge ?? null;
			const statusText =
				status === 'ready'
					? t('statusReady')
					: status === 'challenge'
						? t('statusChallenge')
						: status === 'loading'
							? t('statusLoading')
							: status === 'error'
								? t('statusError')
								: t('statusIdle');
			const modeText = state?.mode === 'points' ? t('modePoints') : t('modeSubscription');
			const points = formatNumber(state?.points);
			const tokensPerPoint = formatNumber(state?.tokensPerPoint);
			const updated = formatTime(state?.updatedAt, locale);
			const usage = usageOf(state);
			const usageRangeText = rangeLabel(t, usage?.range);
			const usageUpdated = formatTime(usage?.updatedAt, locale);
			const usageCalls = formatNumber(usage?.calls);
			const usageTokens = formatCompact(usage?.totalTokens);
			const todayEntry = latestDaily(usage);
			const todayTokens = formatCompact(todayEntry?.tokens);
			const usagePointsCost = formatNumber(usage?.pointsCost);
			const topModel = topModelOf(usage);
			const models = Array.isArray(usage?.models) ? usage.models.slice(0, 5) : [];
			const daily = Array.isArray(usage?.daily) ? usage.daily.slice(-14) : [];
			const dailyPeak = daily.reduce((peak, entry) => (entry.tokens > peak ? entry.tokens : peak), 0);
			const [ railFields, toggleRailField ] = useRailFields();

			const rows = [
				[ t('status'), statusText ],
				configured ? [ t('mode'), modeText ] : null,
				configured ? [ t('points'), points === null ? t('empty') : `${points} ${t('pointsUnit')}` ] : null,
				configured && tokensPerPoint !== null ? [ t('tokensPerPoint'), tokensPerPoint ] : null,
				configured && updated !== null ? [ t('updatedAt'), updated ] : null,
			].filter((entry) => entry !== null);

			return h(
				'div',
				{ style: styles.root },
				h(
					'div',
					{ style: styles.header },
					h('h3', { style: styles.title }, t('title')),
					h('p', { style: styles.description }, t('description')),
				),
				...rows.map(([ label, value ]) =>
					h(
						'div',
						{ key: label, style: styles.row },
						h('span', { style: styles.label }, label),
						h('span', { style: styles.value }, value),
					),
				),
				configured
					? h('p', { style: styles.description }, t('configured').replace('{username}', String(state?.username ?? '')))
					: h('p', { style: styles.description }, t('notConfigured')),
				state?.message ? h('p', { style: status === 'error' ? styles.error : styles.description }, String(state.message)) : null,
				status === 'challenge'
					? h(
						'form',
						{ style: styles.challenge, onSubmit: submitChallenge },
						h('p', { style: styles.challengeTitle }, t('challengeTitle')),
						h(
							'p',
							{ style: styles.description },
							challenge !== null && challenge.mobile !== ''
								? t('challengeSent').replace('{mobile}', String(challenge.mobile))
								: t('challengeSentNoMobile'),
						),
						h(
							'div',
							{ style: styles.field },
							h('label', { style: styles.fieldLabel, htmlFor: 'dsh-tongji-agi-sms-code' }, t('challengeCode')),
							h('input', {
								id: 'dsh-tongji-agi-sms-code',
								style: styles.input,
								type: 'text',
								inputMode: 'numeric',
								autoComplete: 'one-time-code',
								maxLength: 6,
								value: code,
								placeholder: t('challengeCodePlaceholder'),
								onChange: (event) => setCode(event.target.value),
							}),
						),
						h(
							'div',
							{ style: styles.actions },
							h(
								'button',
								{ type: 'submit', style: { ...styles.button, ...styles.primary }, disabled: busy },
								busy ? t('challengeSubmitting') : t('challengeSubmit'),
							),
							h('button', { type: 'button', style: styles.button, disabled: busy, onClick: resend }, t('challengeResend')),
						),
					)
					: null,
				h(
					'form',
					{ style: styles.form, onSubmit: submit },
					h(
						'div',
						{ style: styles.field },
						h('label', { style: styles.fieldLabel, htmlFor: 'dsh-tongji-agi-username' }, t('username')),
						h('input', {
							id: 'dsh-tongji-agi-username',
							style: styles.input,
							type: 'text',
							autoComplete: 'username',
							value: username,
							placeholder: t('usernamePlaceholder'),
							onChange: (event) => setUsername(event.target.value),
						}),
					),
					h(
						'div',
						{ style: styles.field },
						h('label', { style: styles.fieldLabel, htmlFor: 'dsh-tongji-agi-password' }, t('password')),
						h('input', {
							id: 'dsh-tongji-agi-password',
							style: styles.input,
							type: 'password',
							autoComplete: 'current-password',
							value: password,
							placeholder: t('passwordPlaceholder'),
							onChange: (event) => setPassword(event.target.value),
						}),
					),
					h(
						'div',
						{ style: styles.actions },
						h(
							'button',
							{ type: 'submit', style: { ...styles.button, ...styles.primary }, disabled: busy },
							busy ? t('saving') : t('save'),
						),
						h('button', { type: 'button', style: styles.button, disabled: busy, onClick: refresh }, t('refreshing')),
						configured
							? h('button', { type: 'button', style: styles.button, disabled: busy, onClick: forget }, t('forget'))
							: null,
					),
				),
				failure === null ? null : h('p', { style: styles.error }, failure),
				notice === null ? null : h('p', { style: styles.ok }, notice),
				configured
					? h(
						'div',
						{ style: styles.section },
						h(
							'div',
							{ style: styles.sectionHead },
							h('h4', { style: styles.sectionTitle }, t('usageTitle')),
							h(
								'button',
								{ type: 'button', style: styles.button, disabled: busy, onClick: refreshUsage },
								busy ? t('usageRefreshing') : t('usageRefresh'),
							),
						),
						h('p', { style: styles.sectionHint }, t('usageHint')),
						usage === null
							? h('p', { style: styles.description }, t('usageEmpty'))
							: h(
								'div',
								{ style: styles.section },
								[
									[ t('usageRange'), usageRangeText ],
									[ t('usageCalls'), usageCalls === null ? t('empty') : usageCalls ],
									[ t('usageTokens'), usageTokens === null ? t('empty') : usageTokens ],
									[ t('usageTodayTokens'), todayTokens === null ? t('empty') : todayTokens ],
									[ t('usagePointsCost'), usagePointsCost === null ? t('empty') : usagePointsCost ],
									[ t('usageUpdatedAt'), usageUpdated === null ? t('empty') : usageUpdated ],
								].map(([ label, value ]) =>
									h(
										'div',
										{ key: label, style: styles.row },
										h('span', { style: styles.label }, label),
										h('span', { style: styles.value }, value),
									),
								),
								models.length === 0
									? null
									: h(
										'div',
										{ style: styles.section },
										h('span', { style: styles.fieldLabel }, t('usageModelShare')),
										...models.map((entry) =>
											h(
												'div',
												{ key: entry.name, style: styles.modelRow },
												h(
													'div',
													{ style: styles.modelHead },
													h('span', { style: styles.modelName, title: entry.name }, entry.name),
													h(
														'span',
														{ style: styles.modelValue },
														`${formatShare(entry.share) ?? t('empty')} · ${formatCompact(entry.tokens) ?? t('empty')}`,
													),
												),
												h(
													'div',
													{ style: styles.bar },
													h('div', {
														style: { ...styles.barFill, width: `${Math.max(2, Math.round((entry.share ?? 0) * 100))}%` },
													}),
												),
											),
										),
									),
								daily.length === 0
									? null
									: h(
										'div',
										{ style: styles.section },
										h('span', { style: styles.fieldLabel }, t('usageDaily')),
										h(
											'div',
											{ style: styles.daily },
											...daily.map((entry) => {
												const ratio = dailyPeak > 0 ? entry.tokens / dailyPeak : 0;
												return h('div', {
													key: entry.date,
													style: { ...styles.dailyBar, height: `${Math.max(2, Math.round(ratio * 100))}%` },
													title: `${entry.date} · ${formatCompact(entry.tokens) ?? '0'}`,
												});
											}),
										),
									),
							),
						h('span', { style: styles.fieldLabel }, t('railOptions')),
						h('p', { style: styles.sectionHint }, t('railOptionsHint')),
						h(
							'div',
							{ style: styles.toggles },
							...RAIL_FIELD_ORDER.map((field) => {
								const labelKey =
									field === 'points'
										? 'railShowPoints'
										: field === 'today'
											? 'railShowToday'
											: field === 'model'
												? 'railShowModel'
												: 'railShowUpdated';
								return h(
									'label',
									{ key: field, style: styles.toggle },
									h('input', {
										type: 'checkbox',
										style: styles.toggleBox,
										checked: railFields[field] === true,
										onChange: () => toggleRailField(field),
									}),
									h('span', null, t(labelKey)),
								);
							}),
						),
					)
					: null,
			);
		}

		// Compact one-line readout for the left sidebar: it sits in
		// `sidebar.footer.action`, directly under the workspace list, and shares
		// the same streamed state as the settings section.
		function BalanceRail(props) {
			const { t, locale } = props;
			const api = useApi();
			const [state, setState] = React.useState(null);
			const [railFields] = useRailFields();

			React.useEffect(() => {
				if (api === null) return undefined;
				const controller = new AbortController();
				let live = true;
				(async () => {
					try {
						for await (const next of api.watch(controller.signal)) {
							if (!live) return;
							if (next && typeof next === 'object') setState(next);
						}
					} catch {
						// The rail is a passive readout: keep the last value and let
						// the settings section surface the failure text.
					}
				})();
				return () => {
					live = false;
					controller.abort();
				};
			}, [api]);

			const status = typeof state?.status === 'string' ? state.status : 'idle';
			const points = formatNumber(state?.points);
			const loading = api === null || status === 'idle' || status === 'loading';
			const usage = usageOf(state);
			const todayEntry = latestDaily(usage);
			const todayText = formatCompact(todayEntry?.tokens);
			const topModel = topModelOf(usage);
			const modelShare = topModel === null ? null : formatShare(topModel.share);
			const updatedText = formatTime(usage?.updatedAt ?? state?.updatedAt, locale);

			// 每一行都由设置页的复选框控制；全部关掉时退回只显示余额，避免整栏空白。
			const lines = [];
			if (railFields.points === true) {
				lines.push({ key: 'points', label: t('railShowPoints'), value: points !== null ? points : loading ? '…' : t('empty') });
			}
			if (railFields.today === true) {
				lines.push({ key: 'today', label: t('railShowToday'), value: todayText === null ? (loading ? '…' : t('empty')) : todayText });
			}
			if (railFields.model === true) {
				lines.push({
					key: 'model',
					label: t('railShowModel'),
					value: topModel === null ? (loading ? '…' : t('empty')) : `${modelShare ?? ''} ${topModel.name}`.trim(),
					title: topModel === null ? undefined : `${topModel.name} · ${formatCompact(topModel.tokens) ?? '0'}`,
				});
			}
			if (railFields.updated === true) {
				lines.push({ key: 'updated', label: t('railShowUpdated'), value: updatedText === null ? (loading ? '…' : t('empty')) : updatedText });
			}
			if (lines.length === 0) {
				lines.push({ key: 'points', label: t('railShowPoints'), value: points !== null ? points : loading ? '…' : t('empty') });
			}

			return h(
				'div',
				{
					style: styles.railStack,
					title: t('railHint'),
					'data-tongji-balance': status,
				},
				...lines.map((line) =>
					h(
						'div',
						{ key: line.key, style: styles.railLine },
						h('span', { style: styles.railLabel }, line.label),
						h(
							'span',
							{ style: { ...styles.railValue, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }, title: line.title },
							line.value,
						),
					),
				),
			);
		}

		function activeLocale(ctx) {
			const service = ctx.locale;
			if (service === undefined || service === null) return 'zh';
			try {
				const snapshot = typeof service.getSnapshot === 'function' ? service.getSnapshot() : undefined;
				if (typeof snapshot?.active === 'string') return snapshot.active;
			} catch {
				// fall through to the default below
			}
			return 'zh';
		}

		const inject = [ 'slots', 'locale', 'remote' ];

		async function mountRemote(ctx) {
			const remote = ctx.remote;
			if (remote === undefined || remote === null || typeof remote.$mount !== 'function') {
				ctx.logger?.warn?.('dsh-tongji-agi: client remote gateway is unavailable');
				return;
			}
			try {
				const dispose = await remote.$mount(CONTRIBUTION);
				ctx.effect(() => () => {
					void dispose();
				}, 'dsh-tongji-agi: remote contribution');
				const api = ctx.get(`remote.tongji`) ?? ctx.remote.tongji;
				if (api === undefined || api === null) {
					ctx.logger?.warn?.('dsh-tongji-agi: remote.tongji was not installed');
					return;
				}
				store.publish(api);
			} catch (cause) {
				ctx.logger?.warn?.(`dsh-tongji-agi: mounting the balance remote service failed: ${String(cause)}`);
			}
		}

		function dictionaryFor(locale) {
			if (DICTIONARIES[locale] !== undefined) return DICTIONARIES[locale];
			return DICTIONARIES.zh;
		}

		function makeTranslate(ctx) {
			const service = ctx.locale;
			let bound;
			if (service !== undefined && service !== null && typeof service.bind === 'function') {
				try {
					bound = service.bind(NS);
				} catch {
					bound = undefined;
				}
			}
			return (key) => {
				if (typeof bound === 'function') {
					try {
						const text = bound(key);
						if (typeof text === 'string' && text !== key) return text;
					} catch {
						// fall through to the bundled table below
					}
				}
				const text = dictionaryFor(activeLocale(ctx))[key] ?? DICTIONARIES.zh[key];
				return typeof text === 'string' ? text : key;
			};
		}

		function apply(ctx) {
			const service = ctx.locale;
			if (service !== undefined && service !== null && typeof service.register === 'function') {
				ctx.effect(() => service.register(NS, DICTIONARIES), 'dsh-tongji-agi: dictionaries');
			}
			const t = makeTranslate(ctx);
			void mountRemote(ctx);
			ctx.slots.inject('settings.section', () =>
				ctx.slots.register(
					{
						name: 'settings.section',
						id: 'dsh-tongji-agi',
						order: 10,
						label: () => t('nav'),
						locale: NS,
						inject: () => ({ t, locale: activeLocale(ctx) }),
					},
					BalanceSection,
				),
			);
			ctx.slots.inject('sidebar.footer.action', () =>
				ctx.slots.register(
					{
						name: 'sidebar.footer.action',
						id: 'tongji-balance-rail',
						order: -10,
						locale: NS,
						inject: () => ({ t, locale: activeLocale(ctx) }),
					},
					BalanceRail,
				),
			);
		}

		return { inject, apply };
	},
});
