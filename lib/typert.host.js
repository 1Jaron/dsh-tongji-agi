/**
 * Typert host manifest for the Tongji balance service.
 *
 * The gateway loads this module through `import()` and validates `TYPERT`
 * before it exposes any remote method. The manifest must stay dependency-free:
 * `dsh-tongji-agi` is mounted with a `link:` specifier and therefore has no
 * `node_modules` of its own, so a `zod` import would fail to resolve. Strict
 * codecs only need `mode`, `typeSymbol` and a `create()` factory — the host
 * calls `codec.create().parse(value)` at the boundary, so a plain object is
 * enough.
 */

const PACKAGE_NAME = 'dsh-tongji-agi';

/** Wire shape of the frozen balance state published by the service. */
const BALANCE_STATE_SYMBOL = `${PACKAGE_NAME}#BalanceState`;
/** Wire shape of a plain string argument (username / password). */
const STRING_SYMBOL = `${PACKAGE_NAME}#String`;

/**
 * Build a strict codec accepted by both the host validator and the client
 * gateway. `parse` returns the value unchanged: the balance payload is built
 * by this plugin itself and every field is already JSON-safe.
 *
 * @param {string} typeSymbol - stable wire identity of the codec.
 * @returns {{ mode: 'strict', typeSymbol: string, schema: { parse: (value: unknown) => unknown }, create: () => { parse: (value: unknown) => unknown } }}
 */
function strictCodec(typeSymbol) {
	const schema = { parse: (value) => value };
	return { mode: 'strict', typeSymbol, schema, create: () => schema };
}

const balanceStateCodec = strictCodec(BALANCE_STATE_SYMBOL);
const stringCodec = strictCodec(STRING_SYMBOL);

/** Invocation id for one remote method of the `tongji` namespace. */
function invocationId(method) {
	return `${PACKAGE_NAME}#tongjiBalance/${method}`;
}

/** Shared descriptor fields of every method exposed by `TongjiBalance`. */
function baseInvocation(method) {
	return {
		id: invocationId(method),
		service: 'tongjiBalance',
		namespace: 'tongji',
		method,
		invocation: { kind: 'direct' },
	};
}

/** `username` / `password` arguments of `configure`. */
const credentialParameters = [
	{ name: 'username', wire: 'username', source: 'json', codec: stringCodec },
	{ name: 'password', wire: 'password', source: 'json', codec: stringCodec },
];

/** `code` argument of `submitCode` — the SMS digits the user typed. */
const codeParameters = [{ name: 'code', wire: 'code', source: 'json', codec: stringCodec }];

export const TYPERT = {
	package: PACKAGE_NAME,
	face: 'host',
	schemas: [],
	model: { services: [], events: [], objects: [] },
	invocations: [
		{
			...baseInvocation('snapshot'),
			parameters: [],
			result: balanceStateCodec,
		},
		{
			...baseInvocation('watch'),
			mode: 'stream',
			parameters: [],
			cancellation: { parameter: 'signal' },
			result: balanceStateCodec,
		},
		{
			...baseInvocation('configure'),
			parameters: credentialParameters,
			result: balanceStateCodec,
		},
		{
			...baseInvocation('forget'),
			parameters: [],
			result: balanceStateCodec,
		},
		{
			...baseInvocation('submitCode'),
			parameters: codeParameters,
			result: balanceStateCodec,
		},
		{
			...baseInvocation('resendCode'),
			parameters: [],
			result: balanceStateCodec,
		},
		{
			// 只刷新用量统计，不动余额、不触发重新登录：客户端「刷新」按钮用。
			...baseInvocation('refreshUsage'),
			parameters: [],
			result: balanceStateCodec,
		},
	],
};

export default TYPERT;
