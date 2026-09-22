import { PULSE_RADIUS, LIGHTNING_WIDTH, GUST_WIDTH, GUST_HEIGHT } from './skills.js';

// 발동 중심만 확인하면 화면을 가로지르는 번개나 바람을 놓치므로 효과 범위로 판단한다.
export function isSkillVisible(effect, view) {
	if (!Number.isFinite(effect.x) || !Number.isFinite(effect.y)) return false;
	const left = view.left ?? 0;
	const right = view.right ?? 720;
	const top = view.top ?? 0;
	const bottom = view.bottom ?? Infinity;
	const type = effect.soundType ?? effect.type;
	if (type === 'pulse') {
		const dx = Math.max(left - effect.x, effect.x - right, 0);
		const dy = Math.max(top - effect.y, effect.y - bottom, 0);
		return Math.hypot(dx, dy) < PULSE_RADIUS;
	}
	const halfWidth = (type === 'lightning' ? LIGHTNING_WIDTH : GUST_WIDTH) / 2;
	const effectTop = type === 'lightning' ? 0 : effect.y - GUST_HEIGHT;
	return (
		effect.x + halfWidth > left &&
		effect.x - halfWidth < right &&
		effect.y > top &&
		effectTop < bottom
	);
}
