import { BLOCKS } from './catalog.js';
import { drawCrackWax } from './wax-painter.js';

// 블록 중심 좌표에서 그린다. 회전·위치와 파괴 상태는 호출자가 적용한다.
export function drawSpecialBlock(ctx, block, time = 0) {
	if (block.type === 'butter') {
		drawCrackWax(ctx, block);
		return;
	}
	const { type, w, h } = block;
	ctx.save();
	if (type === 'pond') ctx.globalAlpha *= 0.7;
	const gradient = ctx.createLinearGradient(0, -h / 2, 0, h / 2);
	gradient.addColorStop(0, BLOCKS[type].color);
	gradient.addColorStop(1, `${BLOCKS[type].color}b0`);
	ctx.fillStyle = gradient;
	ctx.strokeStyle = '#ffffff55';
	ctx.lineWidth = 1.5;
	ctx.beginPath();
	ctx.roundRect(-w / 2, -h / 2, w, h, block.cornerRadius ?? 8);
	ctx.fill();
	ctx.stroke();
	ctx.strokeStyle = type === 'frost' ? '#f0fcff' : '#ffffff9a';
	ctx.lineWidth = type === 'frost' ? 2 : 1.3;
	if (type === 'frost') {
		for (const x of [-60, 0, 60])
			for (let spoke = 0; spoke < 3; spoke++) {
				const angle = (spoke * Math.PI) / 3;
				ctx.beginPath();
				ctx.moveTo(x - Math.cos(angle) * 8, -Math.sin(angle) * 8);
				ctx.lineTo(x + Math.cos(angle) * 8, Math.sin(angle) * 8);
				ctx.stroke();
			}
	} else if (type === 'pond') {
		for (let row = -1; row <= 1; row++) {
			ctx.beginPath();
			for (let x = -w / 2 + 9; x < w / 2 - 6; x += 4) {
				const y = (row * h) / 4 + Math.sin(x / 10 + time) * 2;
				if (x === -w / 2 + 9) ctx.moveTo(x, y);
				else ctx.lineTo(x, y);
			}
			ctx.stroke();
		}
	}
	ctx.restore();
}
