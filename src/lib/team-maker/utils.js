export const SVG_NAMESPACE = ['http:', '', 'www.w3.org', '2000', 'svg'].join('/');

export const clone = (value) => JSON.parse(JSON.stringify(value));

export const clamp = (value, minimum, maximum) => Math.min(maximum, Math.max(minimum, value));

export const formatPercent = (rate) => `${(rate * 100).toFixed(1).replace(/\.0$/, '')}%`;

let sequence = 0;

export function createId(prefix) {
	sequence += 1;
	if (globalThis.crypto?.randomUUID) return `${prefix}-${globalThis.crypto.randomUUID()}`;
	return `${prefix}-${Date.now()}-${sequence}`;
}
