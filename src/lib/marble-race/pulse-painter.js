import { PULSE_RADIUS } from './skills.js';

// 경기장 파동과 도감 그림에 같은 원형 효과를 사용한다.
export function drawPulse(ctx, wave, progress, reduced = false) {
	const radius = reduced ? PULSE_RADIUS : 16 + (PULSE_RADIUS - 16) * (1 - (1 - progress) ** 2);
	ctx.save();
	ctx.globalAlpha = (1 - progress) * (reduced ? 0.35 : 0.85);
	ctx.strokeStyle = wave.color;
	ctx.lineWidth = 5;
	ctx.beginPath();
	ctx.arc(wave.x, wave.y, radius, 0, Math.PI * 2);
	ctx.stroke();
	if (!reduced) {
		ctx.strokeStyle = '#ffffff';
		ctx.lineWidth = 2;
		ctx.beginPath();
		ctx.arc(wave.x, wave.y, Math.max(13, radius - 8), 0, Math.PI * 2);
		ctx.stroke();
	}
	ctx.restore();
}
