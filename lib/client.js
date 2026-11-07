/**
 * Client bundle for `dsh-tongji-agi`.
 *
 * Three jobs:
 *  1. mount the Typert remote contribution that backs `ctx.remote.tongji.*`
 *     (`snapshot`, `watch`, `configure`, `forget`);
 *  2. register a "同济AGI" section in Settings;
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
		const API_KEY_URL = 'https://agi.tongji.edu.cn/system/my-apikey?kind=plan';

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
				nav: '同济AGI',
				title: '同济AGI',
				description: '查看积分余额、重置时间和同济 AI 平台的用量明细。',
				setupTitle: '配置模型 API Key',
				setupGetKey: '前往同济平台获取 API Key',
				setupPath: '设置 → 模型 → 同济 AGI → 编辑',
				setupSaveKey: '将 API Key 填入 API 密钥栏并保存。',
				setupAccountNote: '查询余额、重置时间和用量，请在下方登录同济统一身份认证。',
				statusIdle: '未查询',
				statusLoading: '查询中…',
				statusReady: '已同步',
				statusError: '查询失败',
				modePoints: '按点数计费',
				modeSubscription: '订阅额度',
				points: '可用余额',
				pointsUnit: '点',
				railLabel: '积分余额',
				railHint: '同济 AI 平台侧栏摘要',
				tokensPerPoint: '每点 Token',
				resetNext: '下次积分重置',
				resetWeek: '每 7 天',
				resetMonth: '每月',
				resetTimeZone: '北京时间',
				resetUnavailable: '暂无平台重置时间',
				resetPending: '等待平台更新',
				username: '统一身份认证账号',
				password: '密码',
				usernamePlaceholder: '学号或工号',
				passwordPlaceholder: '登录密码',
				save: '保存并登录',
				saving: '登录中…',
				forget: '清除凭据',
				accountSettings: '账号设置',
				accountPrivacy: '统一身份认证凭据保存在本机凭据库中。',
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
				usagePointsCost: '消耗点数',
				usageDaily: '每日用量',
				usageDailyDetails: '查看每日明细',
				usageDailyDate: '日期',
				usageDailyRange: '每日用量区间',
				usageDays: '{days} 天',
				usageDayCalls: '{calls} 次调用',
				usageHistoryEmpty: '这个区间暂无每日记录。',
				usageModels: '模型明细',
				usageModelsOrder: '按 Token 总量排序',
				usageModel: '模型',
				usageInput: '输入',
				usageCached: '缓存',
				usageOutput: '输出',
				usageTotal: '总量',
				usageShare: '占比',
				usageScrollHint: '左右滚动查看全部列',
				usageRefresh: '刷新统计',
				usageRefreshing: '统计中…',
				usageEmpty: '暂无统计数据',
				railOptions: '侧边栏显示',
				railOptionsHint: '点击卡片切换显示项，预览和侧边栏会同步更新。',
				railPreview: '侧边栏预览',
				railDefault: '全部关闭时，侧边栏默认显示积分余额。',
				railShowPoints: '积分余额',
				railShowToday: '今日 Token',
				railShowCalls: '今日调用',
				railShowReset: '积分重置',
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
				nav: 'Tongji AGI',
				title: 'Tongji AGI',
				description: 'See your points balance, next reset, and detailed Tongji AI usage.',
				setupTitle: 'Configure your model API key',
				setupGetKey: 'Get an API key from Tongji AI',
				setupPath: 'Settings → Models → 同济 AGI → Edit',
				setupSaveKey: 'Enter the key in the API key field and save.',
				setupAccountNote: 'Sign in with your Tongji unified account below to see balance, reset time, and usage.',
				statusIdle: 'Not queried',
				statusLoading: 'Querying…',
				statusReady: 'In sync',
				statusError: 'Query failed',
				modePoints: 'Points',
				modeSubscription: 'Subscription quota',
				points: 'Available balance',
				pointsUnit: 'points',
				railLabel: 'Points',
				railHint: 'Tongji AI platform sidebar summary',
				tokensPerPoint: 'Tokens per point',
				resetNext: 'Next points reset',
				resetWeek: 'Every 7 days',
				resetMonth: 'Monthly',
				resetTimeZone: 'Beijing time',
				resetUnavailable: 'No reset time from Tongji AI',
				resetPending: 'Waiting for update',
				username: 'Unified account',
				password: 'Password',
				usernamePlaceholder: 'Student or staff ID',
				passwordPlaceholder: 'Password',
				save: 'Save and sign in',
				saving: 'Signing in…',
				forget: 'Clear credentials',
				accountSettings: 'Account settings',
				accountPrivacy: 'Your unified sign-in credentials are stored in the local credential store.',
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
				usagePointsCost: 'Points spent',
				usageDaily: 'Daily usage',
				usageDailyDetails: 'View daily details',
				usageDailyDate: 'Date',
				usageDailyRange: 'Daily usage window',
				usageDays: '{days} days',
				usageDayCalls: 'Calls {calls}',
				usageHistoryEmpty: 'No daily records in this window.',
				usageModels: 'Model breakdown',
				usageModelsOrder: 'Sorted by total tokens',
				usageModel: 'Model',
				usageInput: 'Input',
				usageCached: 'Cached',
				usageOutput: 'Output',
				usageTotal: 'Total',
				usageShare: 'Share',
				usageScrollHint: 'Scroll horizontally to see all columns',
				usageRefresh: 'Refresh usage',
				usageRefreshing: 'Loading…',
				usageEmpty: 'No usage recorded yet',
				railOptions: 'Sidebar shows',
				railOptionsHint: 'Select the tiles to update the preview and sidebar.',
				railPreview: 'Sidebar preview',
				railDefault: 'The sidebar shows points when all tiles are off.',
				railShowPoints: 'Points',
				railShowToday: 'Today tokens',
				railShowCalls: 'Today calls',
				railShowReset: 'Points reset',
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
			getSnapshot() {
				return store.api;
			},
		};

		function useApi() {
			return React.useSyncExternalStore(store.subscribe, store.getSnapshot);
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
			field: { display: 'flex', flexDirection: 'column', gap: '4px' },
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
			railLabel: { opacity: 0.65, whiteSpace: 'nowrap' },
			railValue: {
				fontWeight: 600, fontVariantNumeric: 'tabular-nums', textAlign: 'right',
				overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
			},
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
		};

		const PANEL_CSS = `
.tja-panel {
	--tja-ink: light-dark(#161925, #efedf8);
	--tja-muted: light-dark(#596173, #b0b4c9);
	--tja-border: light-dark(#d7dbe6, #444456);
	--tja-surface: light-dark(#fff, #252534);
	--tja-soft: light-dark(#f3f4f8, #2d2d3d);
	--tja-wash: light-dark(#eeebff, #363055);
	--tja-accent: light-dark(#4738c9, #c0b8ff);
	--tja-accent-fill: light-dark(#5146d9, #7163e8);
	--tja-bars: light-dark(#b9b2f9, #756bbd);
	--tja-green: light-dark(#178447, #6ed79d);
	--tja-red: light-dark(#ac302d, #ffaaa1);
	color: var(--tja-ink);
	container-type: inline-size;
	display: flex;
	flex-direction: column;
	gap: 16px;
	min-width: 0;
	width: 100%;
	padding: 4px 0;
	font-size: 13px;
	line-height: 1.5;
}
.tja-panel :where(h3, h4, h5, p, dl, dd) { margin: 0; }
.tja-panel h3 { font-size: 24px; line-height: 1.2; font-weight: 700; letter-spacing: -.025em; }
.tja-panel h4 { font-size: 18px; line-height: 1.3; font-weight: 700; }
.tja-panel h5 { font-size: 15px; line-height: 1.4; font-weight: 700; }
.tja-heading, .tja-section-head, .tja-date-detail, .tja-balance {
	display: flex;
	align-items: center;
	justify-content: space-between;
	flex-wrap: wrap;
	gap: 8px 16px;
}
.tja-heading { align-items: flex-start; }
.tja-heading p, .tja-section-head p { margin-top: 3px; }
.tja-caption, .tja-status { color: var(--tja-muted); font-size: 12px; }
.tja-status { display: inline-flex; align-items: center; gap: 6px; margin-top: 3px; }
.tja-status::before { content: ''; width: 7px; height: 7px; border-radius: 50%; background: currentColor; }
.tja-status[data-status="ready"]::before { background: var(--tja-green); }
.tja-status[data-status="error"]::before { background: var(--tja-red); }
.tja-status[data-status="challenge"]::before { background: light-dark(#a3630c, #f1bb68); }
.tja-balance { background: var(--tja-wash); padding: 16px 20px; border-radius: 14px; }
.tja-balance-value, .tja-metrics dd, .tja-table, .tja-date-detail { font-variant-numeric: tabular-nums; }
.tja-balance-value { color: var(--tja-accent); font-size: clamp(26px, 6cqi, 40px); font-weight: 750; line-height: 1.18; overflow-wrap: anywhere; }
.tja-unit { color: var(--tja-muted); font-size: 14px; font-weight: 500; margin-inline-start: 7px; }
.tja-balance-meta { padding-inline-start: 16px; border-inline-start: 1px solid var(--tja-border); }
.tja-reset-info {
	display: flex; flex: 1 0 100%; flex-wrap: wrap; align-items: baseline; justify-content: space-between;
	gap: 4px 12px; border-top: 1px solid var(--tja-border); padding-top: 8px;
}
.tja-reset-value { font-variant-numeric: tabular-nums; font-weight: 650; }
.tja-reset-info time { margin-inline-end: 7px; }
.tja-flow { display: flex; flex-direction: column; gap: 12px; min-width: 0; }
.tja-button {
	display: inline-flex; align-items: center; justify-content: center; gap: 6px;
	padding: 6px 10px; border: 1px solid var(--tja-border); border-radius: 7px;
	background: var(--tja-surface); color: inherit; font: inherit; font-size: 12px;
	cursor: pointer; white-space: nowrap;
}
.tja-button:hover:not(:disabled) { background: var(--tja-soft); }
.tja-button:disabled { opacity: .65; cursor: default; }
.tja-button.tja-primary, .tja-button[aria-pressed="true"] { background: var(--tja-accent-fill); border-color: var(--tja-accent-fill); color: #fff; }
.tja-button:is(.tja-primary, [aria-pressed="true"]):hover:not(:disabled) { background: var(--tja-accent-fill); filter: brightness(.93); }
.tja-button.tja-accent { color: var(--tja-accent); border-color: var(--tja-accent); }
.tja-button svg { width: 15px; height: 15px; flex: none; }
.tja-panel :where(a, button, input, summary, [tabindex]):focus-visible { outline: 2px solid var(--tja-accent); outline-offset: 2px; }
.tja-metrics, .tja-card, .tja-disclosure { border: 1px solid var(--tja-border); border-radius: 12px; background: var(--tja-surface); min-width: 0; }
.tja-guide { border-inline-start: 3px solid var(--tja-accent-fill); gap: 7px; }
.tja-guide ol { display: grid; gap: 4px; padding-inline-start: 18px; margin: 0; }
.tja-guide li::marker { color: var(--tja-accent); font-weight: 650; }
.tja-guide a { color: var(--tja-accent); text-underline-offset: 2px; }
.tja-guide-path { font-weight: 650; }
.tja-rail-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(min(140px, 100%), 1fr)); gap: 7px; }
.tja-rail-choice {
	display: flex; align-items: center; gap: 7px; min-width: 0; min-height: 42px;
	padding: 7px 9px; border: 1px solid var(--tja-border); border-radius: 8px;
	background: var(--tja-surface); color: inherit; text-align: start; font: inherit; cursor: pointer;
}
.tja-rail-choice:hover { background: var(--tja-soft); }
.tja-rail-choice[aria-pressed="true"] { border-color: var(--tja-accent); background: var(--tja-wash); }
.tja-rail-choice svg { width: 16px; height: 16px; flex: none; color: var(--tja-accent); }
.tja-rail-check { width: 1em; margin-inline-start: auto; flex: none; color: var(--tja-accent); }
.tja-rail-preview { padding: 8px 10px; border: 1px solid var(--tja-border); border-radius: 8px; background: var(--tja-soft); }
.tja-rail-preview p { margin-bottom: 4px; }
.tja-metrics { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); padding: 10px 0; }
.tja-metric { padding: 0 14px; min-width: 0; }
.tja-metric + .tja-metric { border-inline-start: 1px solid var(--tja-border); }
.tja-metrics dd { font-size: clamp(15px, 3.5cqi, 25px); font-weight: 720; line-height: 1.35; overflow-wrap: anywhere; }
.tja-card { padding: 13px; }
.tja-model-head { justify-content: flex-start; }
.tja-segments { display: flex; flex-wrap: wrap; gap: 4px; }
.tja-segments .tja-button { padding: 3px 8px; }
.tja-chart { display: grid; grid-template-columns: auto minmax(0, 1fr); gap: 4px 8px; padding-top: 5px; }
.tja-axis { display: flex; flex-direction: column; justify-content: space-between; text-align: end; font-variant-numeric: tabular-nums; }
.tja-axis, .tja-chart-dates { font-size: 11px; color: var(--tja-muted); line-height: 1; }
.tja-plot {
	display: grid; gap: 1px; min-width: 0; height: 124px;
	border-inline-start: 1px solid var(--tja-border); border-block-end: 1px solid var(--tja-border);
	background: repeating-linear-gradient(to bottom, var(--tja-border) 0 1px, transparent 1px 25%);
}
.tja-plot button {
	align-items: end; display: flex; justify-content: center; min-width: 0; padding: 0;
	border: 0; background: transparent; cursor: pointer;
}
.tja-plot button span { display: block; width: 76%; height: var(--tja-bar-height); min-height: 1px; border-radius: 2px 2px 0 0; background: var(--tja-bars); }
.tja-plot button:hover span, .tja-plot button[aria-pressed="true"] span { background: var(--tja-accent-fill); }
.tja-plot button:focus-visible { outline-offset: -2px; }
.tja-chart-dates { display: flex; grid-column: 2; justify-content: space-between; padding-top: 3px; }
.tja-date-detail { background: var(--tja-wash); padding: 6px 9px; border-radius: 7px; }
.tja-date-detail dt { font-weight: 650; }
.tja-subdisclosure { border-top: 1px solid var(--tja-border); }
.tja-disclosure summary, .tja-subdisclosure summary {
	display: flex; align-items: center; justify-content: space-between; gap: 8px;
	list-style: none; cursor: pointer; padding: 9px 12px; font-weight: 650;
}
.tja-subdisclosure summary { padding: 7px 0 0; color: var(--tja-muted); font-size: 12px; }
.tja-panel summary::-webkit-details-marker { display: none; }
.tja-panel summary::after {
	content: ''; width: 6px; height: 6px; flex: none; margin-inline-end: 3px;
	border: solid currentColor; border-width: 0 1.5px 1.5px 0; transform: rotate(-45deg);
}
.tja-panel details[open] > summary::after { transform: rotate(45deg); }
.tja-disclosure-body { padding: 0 12px 12px; }
.tja-subdisclosure[open] > summary { margin-bottom: 7px; }
.tja-scroll { overflow-x: auto; max-width: 100%; }
.tja-scroll-hint { display: none; }
.tja-table { width: 100%; border-collapse: collapse; font-size: 12px; text-align: end; }
.tja-model-table { min-width: 465px; }
.tja-table :where(th, td) { padding: 6px 8px; text-align: inherit; white-space: nowrap; }
.tja-table tr > :first-child { text-align: start; }
.tja-table thead { background: var(--tja-soft); color: var(--tja-muted); }
.tja-table tbody tr + tr { border-top: 1px solid var(--tja-border); }
.tja-table tbody th { font-weight: 550; }
.tja-model-name { max-width: 210px; overflow: hidden; text-overflow: ellipsis; }
.tja-share { display: flex; justify-content: flex-end; align-items: center; gap: 5px; }
.tja-share-track { width: clamp(26px, 8cqi, 72px); height: 5px; border-radius: 9px; background: var(--tja-soft); overflow: hidden; }
.tja-share-track span { display: block; height: 100%; background: var(--tja-accent-fill); border-radius: inherit; }
.tja-share-number { min-width: 5ch; }
.tja-empty { padding: 13px; color: var(--tja-muted); }
.tja-panel .tja-error { color: var(--tja-red); }
.tja-panel .tja-notice { color: var(--tja-green); }
@container (max-width: 500px) {
	.tja-scroll-hint { display: block; }
}
@container (max-width: 420px) {
	.tja-panel h3 { font-size: 20px; }
	.tja-balance { padding: 12px; }
	.tja-balance-meta { padding-inline-start: 9px; }
	.tja-metric { padding-inline: 7px; }
	.tja-card { padding: 10px; }
	.tja-plot { height: 94px; }
}
`;

		// 侧边栏展示项由用户自选，偏好存在浏览器里：宿主插件没有 settings 服务，
		// 而 localStorage 与官方 cost-meter 的做法一致，刷新后仍然生效。
		const RAIL_STORAGE_KEY = 'dsh-tongji-agi:rail-fields';
		const RAIL_FIELDS = {
			points: { label: 'railShowPoints', icon: 'M3 6h16a2 2 0 0 1 2 2v10H5a2 2 0 0 1-2-2V6Zm0 0 14-3m4 8h-5v4h5' },
			reset: { label: 'railShowReset', icon: 'M20 4v5h-5m5 0a8 8 0 1 0 0 6M12 8v4l2 2' },
			today: { label: 'railShowToday', icon: 'm8 6-5 6 5 6m8-12 5 6-5 6m-3-14-2 16' },
			calls: { label: 'railShowCalls', icon: 'm13 2-9 12h7l-1 8 10-12h-7l1-8Z' },
			model: { label: 'railShowModel', icon: 'M3 20h18M6 16v-5m6 5V6m6 10v-8' },
			updated: { label: 'railShowUpdated', icon: 'M12 7v5l3 2m6-2a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z' },
		};
		const RAIL_FIELD_ORDER = Object.keys(RAIL_FIELDS);
		const DEFAULT_RAIL_FIELDS = Object.freeze({ points: true, reset: false, today: false, calls: false, model: false, updated: false });
		const railPrefs = {
			value: null,
			listeners: new Set(),
			subscribe(listener) {
				railPrefs.listeners.add(listener);
				return () => railPrefs.listeners.delete(listener);
			},
			getSnapshot() {
				return railPrefs.value ??= readRailFields();
			},
		};

		function readRailFields() {
			try {
				const raw = window.localStorage?.getItem(RAIL_STORAGE_KEY);
				if (raw == null) return DEFAULT_RAIL_FIELDS;
				const parsed = JSON.parse(raw);
				if (parsed === null || typeof parsed !== 'object') return DEFAULT_RAIL_FIELDS;
				return Object.freeze({
					points: parsed.points !== false,
					reset: parsed.reset === true,
					today: parsed.today === true,
					calls: parsed.calls === true,
					model: parsed.model === true,
					updated: parsed.updated === true,
				});
			} catch {
				return DEFAULT_RAIL_FIELDS;
			}
		}

		function writeRailFields(next) {
			railPrefs.value = next;
			try {
				window.localStorage?.setItem(RAIL_STORAGE_KEY, JSON.stringify(next));
			} catch {
				// Private mode: keep the in-memory value and move on.
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
			const value = React.useSyncExternalStore(railPrefs.subscribe, railPrefs.getSnapshot);
			const toggle = React.useCallback((field) => {
				const current = railPrefs.getSnapshot();
				writeRailFields(Object.freeze({ ...current, [field]: current[field] !== true }));
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

		const AMOUNT_FORMATS = {
			zh: new Intl.NumberFormat('zh-CN', { maximumFractionDigits: 4 }),
			en: new Intl.NumberFormat('en-US', { maximumFractionDigits: 4 }),
		};
		const DAY_FORMATS = {
			zh: new Intl.DateTimeFormat('zh-CN', { month: 'long', day: 'numeric', timeZone: 'UTC' }),
			en: new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', timeZone: 'UTC' }),
		};
		const PLATFORM_DAY = new Intl.DateTimeFormat('sv-SE', { timeZone: 'Asia/Shanghai', year: 'numeric', month: '2-digit', day: '2-digit' });
		const HISTORY_WINDOWS = [7, 14, 30];
		const DAY_MS = 86_400_000;
		const EMPTY_ROWS = [];

		function formatAmount(value, locale) {
			const text = formatNumber(value);
			return text === null || text.startsWith('<') ? text : (AMOUNT_FORMATS[locale] ?? AMOUNT_FORMATS.en).format(Number(text));
		}

		function dayOf(value) {
			return typeof value === 'string' && /^\d{4}-\d{2}-\d{2}/.test(value) ? value.slice(0, 10) : null;
		}

		function todayDaily(usage) {
			const today = PLATFORM_DAY.format();
			const daily = Array.isArray(usage?.daily) ? usage.daily : EMPTY_ROWS;
			return daily.findLast((entry) => dayOf(entry.date) === today) ?? null;
		}

		function historyWindow(daily, days, today) {
			const byDay = new Map(daily.map((entry) => [dayOf(entry.date), entry]));
			const end = Date.parse(today + 'T00:00:00Z');
			return Array.from({ length: days }, (_, index) => {
				const date = new Date(end - (days - index - 1) * DAY_MS).toISOString().slice(0, 10);
				return { date, usage: byDay.get(date) };
			});
		}

		function renderTableHead(labels) {
			return h('thead', null, h('tr', null, labels.map((label) => h('th', { key: label, scope: 'col' }, label))));
		}

		function DailyUsage({ daily, t, locale }) {
			const [days, setDays] = React.useState(14);
			const [selectedDay, setSelectedDay] = React.useState(null);
			const today = PLATFORM_DAY.format();
			const history = React.useMemo(() => historyWindow(daily, days, today), [daily, days, today]);
			const records = history.filter((entry) => entry.usage !== undefined);
			const selected = records.find((entry) => entry.date === selectedDay) ?? records.at(-1);
			const peak = records.reduce((max, entry) => Math.max(max, Number(entry.usage.tokens) || 0), 0);
			const magnitude = 10 ** Math.floor(Math.log10(Math.max(1, peak / 4)));
			const step = Math.max(1, Math.ceil(peak / 4 / magnitude) * magnitude);
			const amount = (value) => formatAmount(value, locale) ?? t('empty');
			const dateLabel = (date) => (DAY_FORMATS[locale] ?? DAY_FORMATS.en).format(new Date(date + 'T00:00:00Z'));

			return h(
				'section',
				{ className: 'tja-card tja-flow' },
				h('div', { className: 'tja-section-head' },
					h('h5', null, t('usageDaily')),
					h('div', { className: 'tja-segments', role: 'group', 'aria-label': t('usageDailyRange') },
						HISTORY_WINDOWS.map((count) => h('button', {
							key: count,
							type: 'button',
							className: 'tja-button',
							'aria-pressed': count === days,
							onClick: () => setDays(count),
						}, t('usageDays').replace('{days}', count))),
					),
				),
				selected === undefined
					? h('p', { className: 'tja-caption' }, t('usageHistoryEmpty'))
					: h(React.Fragment, null,
						h('div', { className: 'tja-chart' },
							h('div', { className: 'tja-axis', 'aria-hidden': true },
								[4, 3, 2, 1, 0].map((tick) => h('span', { key: tick }, formatCompact(tick * step))),
							),
							h('div', { className: 'tja-plot', style: { gridTemplateColumns: 'repeat(' + days + ', minmax(0, 1fr))' } },
								history.map(({ date, usage }) => {
									if (usage === undefined) return h('span', { key: date, 'aria-hidden': true });
									const detail = dateLabel(date) + ' · ' + amount(usage.tokens) + ' Token · ' + t('usageDayCalls').replace('{calls}', amount(usage.calls));
									return h('button', {
										key: date,
										type: 'button',
										'aria-label': detail,
										'aria-pressed': date === selected.date,
										title: detail,
										style: { '--tja-bar-height': (100 * (Number(usage.tokens) || 0) / (4 * step)) + '%' },
										onClick: () => setSelectedDay(date),
									}, h('span', { 'aria-hidden': true }));
								}),
							),
							h('div', { className: 'tja-chart-dates', 'aria-hidden': true },
								[0, Math.floor(days / 2), days - 1].map((index) => h('span', { key: index }, history[index].date.slice(5))),
							),
						),
						h('dl', { className: 'tja-date-detail', 'aria-live': 'polite' },
							h('dt', null, dateLabel(selected.date)),
							h('dd', null, amount(selected.usage.tokens) + ' Token · ' + t('usageDayCalls').replace('{calls}', amount(selected.usage.calls))),
						),
						h('details', { className: 'tja-subdisclosure' },
							h('summary', null, t('usageDailyDetails')),
							h('table', { className: 'tja-table', 'aria-label': t('usageDailyDetails') },
								renderTableHead([t('usageDailyDate'), t('usageTokens'), t('usageCalls')]),
								h('tbody', null, records.toReversed().map(({ date, usage }) => h('tr', { key: date },
									h('th', { scope: 'row' }, h('time', { dateTime: date }, date)),
									h('td', null, amount(usage.tokens)),
									h('td', null, amount(usage.calls)),
								))),
							),
						),
					),
			);
		}

		function ModelUsage({ models, t, locale }) {
			const columns = ['usageModel', 'usageInput', 'usageCached', 'usageOutput', 'usageTotal', 'usageShare'];
			return h(
				'section',
				{ className: 'tja-card tja-flow' },
				h('div', { className: 'tja-section-head tja-model-head' },
					h('h5', null, t('usageModels')),
					h('span', { className: 'tja-caption' }, t('usageModelsOrder')),
				),
				models.length === 0
					? h('p', { className: 'tja-caption' }, t('usageEmpty'))
					: h(React.Fragment, null,
						h('p', { className: 'tja-caption tja-scroll-hint' }, t('usageScrollHint')),
						h('div', { className: 'tja-scroll', tabIndex: 0, role: 'region', 'aria-label': t('usageModels') },
							h('table', { className: 'tja-table tja-model-table', 'aria-label': t('usageModels') },
								renderTableHead(columns.map(t)),
								h('tbody', null, models.map((entry, index) => h('tr', { key: entry.name + ':' + index },
									h('th', { className: 'tja-model-name', scope: 'row', title: entry.name }, entry.name),
									['inputTokens', 'cachedTokens', 'outputTokens', 'tokens'].map((field) => h('td', { key: field },
										formatAmount(entry[field], locale) ?? t('empty'),
									)),
									h('td', null, h('div', { className: 'tja-share' },
										h('span', { className: 'tja-share-track', 'aria-hidden': true },
											h('span', { style: { width: Math.min(100, Math.max(0, (Number(entry.share) || 0) * 100)) + '%' } }),
										),
										h('span', { className: 'tja-share-number' }, formatShare(entry.share) ?? t('empty')),
									)),
								))),
							),
						),
					),
			);
		}

		function UsageOverview({ usage, busy, refreshing, onRefresh, t, locale }) {
			const time = formatTime(usage?.updatedAt, locale);
			const period = usage === null ? t('usageHint') : t('usageRange') + ' · ' + rangeLabel(t, usage.range);
			const metrics = usage === null ? EMPTY_ROWS : [
				['usageCalls', usage.calls],
				['usageTokens', usage.textTokens ?? usage.totalTokens],
				['usagePointsCost', usage.pointsCost],
			];
			return h(
				'section',
				{ className: 'tja-flow', 'aria-label': t('usageTitle') },
				h('div', { className: 'tja-section-head' },
					h('div', null,
						h('h4', null, t('usageTitle')),
						h('p', { className: 'tja-caption' }, time === null ? period : period + ' · ' + t('usageUpdatedAt') + ' ' + time),
					),
					h('button', { type: 'button', className: 'tja-button tja-accent', disabled: busy, onClick: onRefresh },
						h('svg', { viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 1.8, strokeLinecap: 'round', strokeLinejoin: 'round', 'aria-hidden': true },
							h('path', { d: 'M20 4v5h-5M20 9a8 8 0 1 0 .2 6' }),
						),
						t(refreshing ? 'usageRefreshing' : 'usageRefresh'),
					),
				),
				usage === null
					? h('p', { className: 'tja-card tja-empty' }, t('usageEmpty'))
					: h(React.Fragment, null,
						h('dl', { className: 'tja-metrics' }, metrics.map(([key, value]) =>
							h('div', { className: 'tja-metric', key },
								h('dt', { className: 'tja-caption' }, t(key)),
								h('dd', null, formatAmount(value, locale) ?? t('empty')),
							),
						)),
						h(DailyUsage, { daily: Array.isArray(usage.daily) ? usage.daily : EMPTY_ROWS, t, locale }),
						h(ModelUsage, { models: Array.isArray(usage.models) ? usage.models : EMPTY_ROWS, t, locale }),
					),
			);
		}

		const RESET_FORMATS = {
			zh: resetFormatters('zh-CN'),
			en: resetFormatters('en-US'),
		};

		function resetFormatters(locale) {
			const options = { timeZone: 'Asia/Shanghai', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hourCycle: 'h23' };
			return {
				full: new Intl.DateTimeFormat(locale, { ...options, year: 'numeric' }),
				short: new Intl.DateTimeFormat(locale, options),
			};
		}

		function resetDisplay(reset, t, locale) {
			const nextAt = reset?.nextAt;
			if (!Number.isFinite(nextAt)) return null;
			const cycle = reset.cycle === 'week' ? t('resetWeek') : reset.cycle === 'month' ? t('resetMonth') : null;
			if (nextAt <= Date.now()) return { short: t('resetPending'), full: null, cycle };
			const formats = RESET_FORMATS[locale] ?? RESET_FORMATS.en;
			return { short: formats.short.format(nextAt), full: formats.full.format(nextAt), cycle };
		}

		function SetupGuide({ t }) {
			return h('section', { className: 'tja-card tja-flow tja-guide', 'aria-label': t('setupTitle') },
				h('h5', null, t('setupTitle')),
				h('ol', null,
					h('li', null, h('a', { href: API_KEY_URL, target: '_blank', rel: 'noopener noreferrer' }, t('setupGetKey'))),
					h('li', null, h('span', { className: 'tja-guide-path' }, t('setupPath')), ' · ', t('setupSaveKey')),
				),
				h('p', { className: 'tja-caption' }, t('setupAccountNote')),
			);
		}

		function PointsResetInfo({ reset, t, locale }) {
			const display = resetDisplay(reset, t, locale);
			const detail = [display?.full && t('resetTimeZone'), display?.cycle].filter(Boolean).join(' · ');
			return h('div', { className: 'tja-reset-info' },
				h('span', { className: 'tja-caption' }, t('resetNext')),
				h('span', null,
					display?.full
						? h('time', { className: 'tja-reset-value', dateTime: new Date(reset.nextAt).toISOString() }, display.full)
						: h('span', { className: 'tja-caption' }, display?.short ?? t('resetUnavailable')),
					detail ? h('span', { className: 'tja-caption' }, display?.full ? detail : ' · ' + detail) : null,
				),
			);
		}

		function railLines(state, fields, t, locale, loading) {
			const usage = usageOf(state);
			const today = todayDaily(usage);
			const model = topModelOf(usage);
			const reset = resetDisplay(state?.pointsReset, t, locale);
			const share = model ? formatShare(model.share) : null;
			const values = {
				points: formatAmount(state?.points, locale),
				reset: reset?.short,
				today: formatCompact(today?.tokens),
				calls: formatAmount(today?.calls, locale),
				model: model ? [share, model.name].filter(Boolean).join(' ') : null,
				updated: formatTime(usage?.updatedAt ?? state?.updatedAt, locale),
			};
			const titles = {
				reset: reset?.full ? [reset.full, t('resetTimeZone'), reset.cycle].filter(Boolean).join(' · ') : undefined,
				model: model ? model.name + ' · ' + (formatCompact(model.tokens) ?? t('empty')) : undefined,
			};
			const selected = RAIL_FIELD_ORDER.filter((field) => fields[field]);
			return (selected.length ? selected : ['points']).map((key) => ({
				key, label: t(RAIL_FIELDS[key].label), value: values[key] ?? (loading ? '…' : t('empty')), title: titles[key],
			}));
		}

		function RailRows({ lines, status, hint }) {
			return h('div', { style: styles.railStack, title: hint, 'data-tongji-balance': status },
				lines.map(({ key, label, value, title }) =>
					h('div', { key, style: styles.railLine },
						h('span', { style: styles.railLabel }, label),
						h('span', { style: styles.railValue, title }, value),
					),
				),
			);
		}

		function SidebarSettings({ state, loading, t, locale }) {
			const [fields, toggle] = useRailFields();
			return h('details', { className: 'tja-disclosure' },
				h('summary', null, t('railOptions')),
				h('div', { className: 'tja-flow tja-disclosure-body' },
					h('p', { className: 'tja-caption' }, t('railOptionsHint')),
					h('div', { className: 'tja-rail-grid', role: 'group', 'aria-label': t('railOptions') },
						RAIL_FIELD_ORDER.map((key) => h('button', {
							key, type: 'button', className: 'tja-rail-choice', 'aria-pressed': fields[key], onClick: () => toggle(key),
						},
							h('svg', { viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 1.6, strokeLinecap: 'round', strokeLinejoin: 'round', 'aria-hidden': true },
								h('path', { d: RAIL_FIELDS[key].icon }),
							),
							h('span', null, t(RAIL_FIELDS[key].label)),
							h('span', { className: 'tja-rail-check', 'aria-hidden': true }, fields[key] ? '✓' : ''),
						)),
					),
					h('div', { className: 'tja-rail-preview', role: 'region', 'aria-label': t('railPreview') },
						h('p', { className: 'tja-caption' }, t('railPreview')),
						h(RailRows, { lines: railLines(state, fields, t, locale, loading) }),
					),
					RAIL_FIELD_ORDER.some((field) => fields[field]) ? null : h('p', { className: 'tja-caption' }, t('railDefault')),
				),
			);
		}

		function BalanceSection(props) {
			const { t, locale } = props;
			const api = useApi();
			const [state, setState] = React.useState(null);
			const [username, setUsername] = React.useState('');
			const [password, setPassword] = React.useState('');
			const [code, setCode] = React.useState('');
			const [pending, setPending] = React.useState(null);
			const [notice, setNotice] = React.useState(null);
			const [failure, setFailure] = React.useState(null);
			const busy = pending !== null;

			// Follow the streamed state: the service publishes on login, on the
			// 30 s poll and whenever credentials change.
			React.useEffect(() => {
				if (api === null) return undefined;
				const controller = new AbortController();
				let live = true;
				void Promise.resolve().then(() => api.snapshot()).catch(() => {});
				(async () => {
					try {
						for await (const next of api.watch(controller.signal)) {
							if (!live) return;
							if (next && typeof next === 'object') {
								setState((current) => next.serial < current?.serial ? current : next);
							}
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

			const savedUsername = state?.username;
			React.useEffect(() => {
				if (savedUsername == null) return;
				setUsername((current) => current === '' ? String(savedUsername) : current);
			}, [savedUsername]);

			const run = React.useCallback(
				async (operation, action) => {
					setPending(operation);
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
						if (answer.value && typeof answer.value === 'object') {
							setState((current) => answer.value.serial < current?.serial ? current : answer.value);
						}
						return answer.value ?? null;
					} catch (cause) {
						setFailure(cause instanceof Error ? cause.message : String(cause));
						return null;
					} finally {
						setPending(null);
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
				void run('account', () => api.configure(account, password)).then((value) => {
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
				void run('forget', () => api.forget()).then((value) => {
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
				void run('balance', () => api.snapshot());
			};

			// 统计单独刷：不动余额、不重登，失败时保留上一轮数据。
			const refreshUsage = () => {
				if (api === null) {
					setFailure(t('unavailable'));
					return;
				}
				void run('usage', () => api.refreshUsage());
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
				void run('code', () => api.submitCode(entered)).then((value) => {
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
				void run('resend', () => api.resendCode()).then((value) => {
					if (value === null) return;
					setCode('');
					setNotice(t('challengeResent'));
				});
			};

			const configured = state?.configured === true;
			const status = state?.status ?? (api === null ? 'idle' : 'loading');
			const challenge = state?.challenge ?? null;
			const statusKeys = {
				ready: 'statusReady',
				challenge: 'statusChallenge',
				loading: 'statusLoading',
				error: 'statusError',
			};
			const statusText = t(statusKeys[status] ?? 'statusIdle');
			const pointsMode = state?.mode === 'points';
			const points = formatAmount(state?.points, locale);
			const tokensPerPoint = formatAmount(state?.tokensPerPoint, locale);
			const updated = formatTime(state?.updatedAt, locale);
			const waitingForAccount = !configured && (status === 'idle' || status === 'loading');

			return h(
				'div',
				{ className: 'tja-panel' },
				h('style', null, PANEL_CSS),
				h('header', { className: 'tja-heading' },
					h('div', null,
						h('h3', null, t('title')),
						h('p', { className: 'tja-caption' }, t('description')),
					),
					h('span', { className: 'tja-status', 'data-status': status, role: 'status' }, statusText),
				),
				configured
					? h('section', { className: 'tja-balance', 'aria-label': t('points') },
						h('div', null,
							h('p', { className: 'tja-caption' }, t('points')),
							h('p', { className: 'tja-balance-value' },
								points ?? t('empty'),
								points !== null && pointsMode ? h('span', { className: 'tja-unit' }, t('pointsUnit')) : null,
							),
						),
						h('div', { className: 'tja-balance-meta' },
							h('strong', null, t(pointsMode ? 'modePoints' : 'modeSubscription')),
							tokensPerPoint !== null && pointsMode
								? h('p', { className: 'tja-caption' }, t('tokensPerPoint') + ' ' + tokensPerPoint)
								: null,
							updated === null ? null : h('p', { className: 'tja-caption' }, t('updatedAt') + ' ' + updated),
						),
						pointsMode ? h(PointsResetInfo, { reset: state?.pointsReset, t, locale }) : null,
					)
					: null,
				h(SetupGuide, { t }),
				state?.message ? h('p', { className: status === 'error' ? 'tja-error' : 'tja-caption' }, String(state.message)) : null,
				status === 'challenge'
					? h(
						'form',
						{ style: styles.challenge, onSubmit: submitChallenge },
						h('p', { style: styles.challengeTitle }, t('challengeTitle')),
						h('p', { className: 'tja-caption' },
							challenge?.mobile ? t('challengeSent').replace('{mobile}', String(challenge.mobile)) : t('challengeSentNoMobile'),
						),
						h('div', { style: styles.field },
							h('label', { className: 'tja-caption', htmlFor: 'dsh-tongji-agi-sms-code' }, t('challengeCode')),
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
						h('div', { style: styles.actions },
							h('button', { type: 'submit', className: 'tja-button tja-primary', disabled: busy },
								t(pending === 'code' ? 'challengeSubmitting' : 'challengeSubmit'),
							),
							h('button', { type: 'button', className: 'tja-button', disabled: busy, onClick: resend }, t('challengeResend')),
						),
					)
					: null,
				failure === null ? null : h('p', { className: 'tja-error', role: 'alert' }, failure),
				notice === null ? null : h('p', { className: 'tja-notice', role: 'status' }, notice),
				configured ? h(UsageOverview, {
					usage: usageOf(state), busy, refreshing: pending === 'usage', onRefresh: refreshUsage, t, locale,
				}) : null,
				waitingForAccount
					? h('p', { className: 'tja-card tja-empty' }, t(api === null ? 'unavailable' : 'statusLoading'))
					: h('details', { className: 'tja-disclosure', open: !configured || status === 'error' ? true : undefined },
						h('summary', null, t('accountSettings')),
						h('form', { className: 'tja-flow tja-disclosure-body', onSubmit: submit },
							h('p', { className: 'tja-caption' }, configured
								? t('configured').replace('{username}', String(state?.username ?? ''))
								: t('notConfigured'),
							),
							h('p', { className: 'tja-caption' }, t('accountPrivacy')),
							h('div', { style: styles.field },
								h('label', { className: 'tja-caption', htmlFor: 'dsh-tongji-agi-username' }, t('username')),
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
							h('div', { style: styles.field },
								h('label', { className: 'tja-caption', htmlFor: 'dsh-tongji-agi-password' }, t('password')),
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
							h('div', { style: styles.actions },
								h('button', { type: 'submit', className: 'tja-button tja-primary', disabled: busy }, t(pending === 'account' ? 'saving' : 'save')),
								h('button', { type: 'button', className: 'tja-button', disabled: busy, onClick: refresh }, t('refreshing')),
								configured ? h('button', { type: 'button', className: 'tja-button', disabled: busy, onClick: forget }, t('forget')) : null,
							),
						),
					),
				h(SidebarSettings, { state, loading: status === 'idle' || status === 'loading', t, locale }),
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

			const status = state?.status ?? 'idle';
			const loading = api === null || status === 'idle' || status === 'loading';
			return h(RailRows, { lines: railLines(state, railFields, t, locale, loading), status, hint: t('railHint') });
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
