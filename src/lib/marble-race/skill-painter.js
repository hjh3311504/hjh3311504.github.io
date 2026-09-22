import { drawPulse } from './pulse-painter.js';
import { SKILL_DURATIONS, PULSE_RADIUS } from './skills.js';

// 경기 효과는 경기 시간만 사용하며 그림을 위해 경기 난수를 소비하지 않는다.
export function drawSkill(ctx, wave, age, reduced = false, view = {}) {
	const duration = SKILL_DURATIONS[wave.type];
	if (age < 0 || age >= duration) return;
	const progress = age / duration;
	if (wave.type === 'pulse') {
		if (
			wave.y + PULSE_RADIUS < (view.top ?? -Infinity) ||
			wave.y - PULSE_RADIUS > (view.bottom ?? Infinity)
		)
			return;
		drawPulse(ctx, wave, progress, reduced);
		return;
	}
	ctx.save();
	if (wave.type === 'lightning') {
		const top = Math.max(wave.top, view.top ?? wave.top);
		const bottom = Math.min(wave.y, view.bottom ?? wave.y);
		if (bottom >= top) drawLightning(ctx, wave, progress, reduced, top, bottom);
	} else if (wave.type === 'gust') {
		if (wave.y >= (view.top ?? -Infinity) && wave.y - wave.height <= (view.bottom ?? Infinity)) {
			drawTornado(ctx, wave, progress, reduced);
		}
	}
	ctx.restore();
}

export function drawElectricField(ctx, marble, time, reduced = false) {
	ctx.save();
	ctx.translate(marble.x, marble.y);
	ctx.strokeStyle = '#ffffff';
	ctx.lineWidth = 2;
	ctx.shadowColor = '#c2dbff';
	ctx.shadowBlur = reduced ? 0 : 7;
	const phase = reduced ? 0 : time * 3;
	for (let i = 0; i < 2; i++) {
		ctx.beginPath();
		ctx.ellipse(0, 0, marble.r + 7, marble.r + 3, phase + (i * Math.PI) / 2, 0, Math.PI * 2);
		ctx.stroke();
	}
	if (!reduced) {
		for (let i = 0; i < 4; i++) {
			ctx.save();
			ctx.rotate((i * Math.PI) / 2 + phase * 0.4);
			const r = marble.r + 4;
			ctx.beginPath();
			ctx.moveTo(r, -7);
			ctx.lineTo(r + 5, -2);
			ctx.lineTo(r + 1, 1);
			ctx.lineTo(r + 5, 7);
			ctx.stroke();
			ctx.restore();
		}
	}
	ctx.restore();
}

// 시각 효과는 고정된 식으로 만들며 스킬 추첨 난수와 분리한다.
function visualNoise(seed) {
	const value = Math.sin(seed * 127.1 + 311.7) * 43758.5453;
	return value - Math.floor(value);
}

function strokeLightning(ctx, points, width, reduced) {
	ctx.beginPath();
	for (let i = 0; i < points.length; i++) {
		const [x, y] = points[i];
		if (i === 0) ctx.moveTo(x, y);
		else ctx.lineTo(x, y);
	}
	ctx.strokeStyle = '#eeb51b';
	ctx.lineWidth = width * 3;
	ctx.shadowColor = '#ffcd24';
	ctx.shadowBlur = reduced ? 0 : 14;
	ctx.stroke();
	ctx.shadowBlur = 0;
	ctx.strokeStyle = '#ffe667';
	ctx.lineWidth = width * 1.5;
	ctx.stroke();
	ctx.strokeStyle = '#fffbd4';
	ctx.lineWidth = width * 0.55;
	ctx.stroke();
}

function drawLightning(ctx, wave, progress, reduced, top, bottom) {
	ctx.globalAlpha = (1 - progress) ** 0.65 * (reduced ? 0.5 : 1);
	ctx.lineJoin = 'round';
	ctx.lineCap = 'round';
	const step = 11;
	const offsetAt = (y) => {
		const taper = Math.min(1, Math.max(0, (wave.y - y) / 55));
		return (
			(Math.sin(y / 39 + wave.id * 2) * 10 +
				Math.sin(y / 17 + wave.id) * 5 +
				(visualNoise(Math.floor(y / step) + wave.id * 31) - 0.5) * 10) *
			taper
		);
	};
	const points = [[wave.x + offsetAt(top), top]];
	// 카메라 범위만 그려 긴 낙하 코스에서도 선분 수를 제한한다.
	for (let y = Math.ceil(top / step) * step; y < bottom; y += step) {
		points.push([wave.x + offsetAt(y), y]);
	}
	points.push([wave.x + offsetAt(bottom), bottom]);
	// 굵은 중심선 양옆에 불규칙한 잔가지를 만든다.
	for (let i = 2; i < points.length - 1; i += 5) {
		const [x, y] = points[i];
		const seed = Math.floor(y / step) + wave.id * 13;
		const side = visualNoise(seed) > 0.5 ? 1 : -1;
		const length = 25 + visualNoise(seed + 2) * 45;
		const branch = [[x, y]];
		for (let j = 1; j <= 5; j++) {
			branch.push([
				x + side * (j * 5 + visualNoise(seed + j) * 13),
				Math.min(wave.y, y + (length * j) / 5)
			]);
		}
		strokeLightning(ctx, branch, 0.55, reduced);
	}
	strokeLightning(ctx, points, 1.25, reduced);
	if (wave.y > bottom) return;
	// 낙뢰 지점에 낮은 빛의 고리와 위로 튀는 불꽃을 그린다.
	ctx.save();
	ctx.translate(wave.x, wave.y);
	ctx.scale(1, 0.35);
	const glow = ctx.createRadialGradient(0, 0, 0, 0, 0, 42);
	glow.addColorStop(0, '#fff7b0bb');
	glow.addColorStop(0.3, '#ffd52377');
	glow.addColorStop(1, '#ffc21a00');
	ctx.fillStyle = glow;
	ctx.fillRect(-42, -42, 84, 84);
	ctx.restore();
	for (let i = 0; i < 7; i++) {
		const angle = Math.PI + (i / 6) * Math.PI;
		const length = 18 + visualNoise(wave.id + i * 3) * 26;
		strokeLightning(
			ctx,
			[
				[wave.x, wave.y],
				[wave.x + Math.cos(angle) * length * 0.45, wave.y + Math.sin(angle) * length * 0.45],
				[
					wave.x + Math.cos(angle + 0.2) * length * 0.7,
					wave.y + Math.sin(angle + 0.2) * length * 0.7
				],
				[wave.x + Math.cos(angle) * length, wave.y + Math.sin(angle) * length]
			],
			0.6,
			reduced
		);
	}
}

function drawTornado(ctx, wave, progress, reduced) {
	const rise = reduced ? 0 : progress * wave.height * 0.1;
	const bottom = wave.y - rise;
	const height = (wave.height - rise) * (reduced ? 1 : Math.min(1, progress / 0.2));
	if (height < 1) return;
	const top = bottom - height;
	const halfWidth = wave.width * 0.43;
	const phase = reduced ? 0 : -progress * Math.PI * 8;
	const x = wave.x;
	ctx.globalAlpha = Math.min(1, (1 - progress) * 5) * 0.9;
	ctx.lineCap = 'round';
	ctx.lineJoin = 'round';

	// 좁은 뿌리에서 넓은 입구로 이어지는 연기를 테두리 없이 그린다.
	const shade = ctx.createLinearGradient(x - halfWidth, 0, x + halfWidth, 0);
	shade.addColorStop(0, '#44444400');
	shade.addColorStop(0.25, '#42424222');
	shade.addColorStop(0.5, '#25252555');
	shade.addColorStop(0.75, '#50505011');
	shade.addColorStop(1, '#44444400');
	ctx.fillStyle = shade;
	ctx.beginPath();
	ctx.moveTo(x - halfWidth, top + 12);
	ctx.bezierCurveTo(
		x - halfWidth * 0.9,
		top + height * 0.4,
		x - 4,
		bottom - height * 0.25,
		x - 3,
		bottom
	);
	ctx.quadraticCurveTo(x + 4, bottom, x + 4, bottom - 8);
	ctx.bezierCurveTo(
		x + 8,
		bottom - height * 0.3,
		x + halfWidth * 0.9,
		top + height * 0.45,
		x + halfWidth,
		top + 12
	);
	ctx.quadraticCurveTo(x, top - 3, x - halfWidth, top + 12);
	ctx.fill();

	// 높이마다 폭과 중심이 다른 나선을 겹쳐 끊기지 않는 회오리를 만든다.
	for (const front of [false, true]) {
		for (let strand = 0; strand < 5; strand++) {
			ctx.beginPath();
			let drawing = false;
			for (let i = 0; i <= 200; i++) {
				const t = i / 200;
				const angle = t * Math.PI * (10 + strand * 0.7) + phase + strand * 2.1;
				if (Math.sin(angle) >= 0 !== front) {
					drawing = false;
					continue;
				}
				const radius = (3 + (halfWidth - 3) * t ** 1.6) * (1 + 0.1 * Math.sin(t * 23 + strand * 2));
				const center = Math.sin(t * 7 + phase * 0.12) * (2 + t * 6);
				const px = x + center + Math.cos(angle) * radius;
				const py =
					bottom -
					4 -
					t * (height - 18) +
					Math.sin(angle) * (2 + t * 11) +
					Math.sin(t * 19 + strand * 2) * t * 4 -
					(px - x) * 0.1;
				if (drawing) ctx.lineTo(px, py);
				else ctx.moveTo(px, py);
				drawing = true;
			}
			ctx.strokeStyle = front ? '#29292933' : '#33333322';
			ctx.lineWidth = 8;
			ctx.stroke();
			ctx.strokeStyle = front ? '#3b3b3be6' : '#45454588';
			ctx.lineWidth = 1.6;
			ctx.stroke();
			ctx.strokeStyle = front ? '#b3b3b388' : '#71717166';
			ctx.lineWidth = 0.6;
			ctx.stroke();
		}
	}
	// 바깥의 짧은 곡선도 아래에서 위로 움직여 흩어지는 연기를 표현한다.
	for (let i = 0; i < 8; i++) {
		const t = reduced ? (i + 0.5) / 8 : (i / 8 + progress * 0.8) % 1;
		const radius = 5 + halfWidth * t ** 1.6;
		const y = bottom - 6 - t * (height - 24);
		ctx.beginPath();
		ctx.ellipse(x, y, radius, 3 + t * 10, -0.1, phase + i * 2, phase + i * 2 + 1.9);
		ctx.strokeStyle = '#55555577';
		ctx.lineWidth = 1.2;
		ctx.stroke();
	}
}
