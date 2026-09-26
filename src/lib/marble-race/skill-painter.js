import { drawPulse } from './pulse-painter.js';
import { SKILL_DURATIONS, PULSE_RADIUS } from './skills.js';

// 같은 크기의 전기 고리는 빛 번짐을 한 번만 그리고 회전·이동해서 재사용한다.
// Canvas가 사라지면 이 캐시도 함께 수거된다.
const electricSprites = new WeakMap();
const tornadoStrands = Array.from({ length: 5 }, (_, strand) =>
	Array.from({ length: 201 }, (_, i) => {
		const t = i / 200;
		const angle = t * Math.PI * (10 + strand * 0.7) + strand * 2.1;
		return {
			t,
			sin: Math.sin(angle),
			cos: Math.cos(angle),
			growth: t ** 1.6,
			bulge: 1 + 0.1 * Math.sin(t * 23 + strand * 2),
			noise: Math.sin(t * 19 + strand * 2) * t * 4
		};
	})
);

// 경기 효과는 경기 시간만 사용하며 그림을 위해 경기 난수를 소비하지 않는다.
export function drawSkill(ctx, wave, age, reduced = false, view = {}) {
	const duration = SKILL_DURATIONS[wave.type];
	if (age < 0 || age >= duration) return;
	const progress = age / duration;
	const extent =
		wave.type === 'pulse' ? PULSE_RADIUS : wave.type === 'gust' ? wave.width / 2 + 16 : 96;
	if (wave.x + extent < (view.left ?? -Infinity) || wave.x - extent > (view.right ?? Infinity))
		return;
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
	let cache = electricSprites.get(ctx);
	if (!cache) electricSprites.set(ctx, (cache = new Map()));
	const transform = ctx.getTransform();
	const quality = Math.min(
		4,
		Math.max(0.25, 2 ** Math.ceil(Math.log2(Math.hypot(transform.a, transform.b))))
	);
	const key = `${marble.r}:${quality}:${reduced}`;
	let sprite = cache.get(key);
	if (!sprite) {
		const size = (marble.r + 24) * 2;
		const makeLayer = (bolts) => {
			const bitmap = ctx.canvas.ownerDocument?.createElement('canvas') ?? new OffscreenCanvas(1, 1);
			bitmap.width = bitmap.height = Math.ceil(size * quality);
			const brush = bitmap.getContext('2d');
			brush.scale(quality, quality);
			brush.translate(size / 2, size / 2);
			brush.strokeStyle = '#ffffff';
			brush.lineWidth = 2;
			brush.shadowColor = '#c2dbff';
			brush.shadowBlur = reduced ? 0 : 7 * quality;
			if (bolts) {
				for (let i = 0; i < 4; i++) {
					brush.save();
					brush.rotate((i * Math.PI) / 2);
					const r = marble.r + 4;
					brush.beginPath();
					brush.moveTo(r, -7);
					brush.lineTo(r + 5, -2);
					brush.lineTo(r + 1, 1);
					brush.lineTo(r + 5, 7);
					brush.stroke();
					brush.restore();
				}
			} else {
				for (let i = 0; i < 2; i++) {
					brush.beginPath();
					brush.ellipse(0, 0, marble.r + 7, marble.r + 3, (i * Math.PI) / 2, 0, Math.PI * 2);
					brush.stroke();
				}
			}
			return bitmap;
		};
		sprite = { size, rings: makeLayer(false), bolts: reduced ? null : makeLayer(true) };
		if (cache.size >= 16) cache.clear();
		cache.set(key, sprite);
	}
	ctx.save();
	ctx.translate(marble.x, marble.y);
	const phase = reduced ? 0 : time * 3;
	const half = sprite.size / 2;
	ctx.rotate(phase);
	ctx.drawImage(sprite.rings, -half, -half, sprite.size, sprite.size);
	if (sprite.bolts) {
		ctx.rotate(-phase * 0.6);
		ctx.drawImage(sprite.bolts, -half, -half, sprite.size, sprite.size);
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
	// 앞·뒤 나선의 같은 좌표를 두 번 계산하지 않는다. 고정 삼각함수도 재사용한다.
	const sinPhase = Math.sin(phase),
		cosPhase = Math.cos(phase);
	const centers = tornadoStrands[0].map(({ t }) => Math.sin(t * 7 + phase * 0.12) * (2 + t * 6));
	const points = new Float64Array(5 * 201 * 3);
	for (let strand = 0; strand < tornadoStrands.length; strand++) {
		tornadoStrands[strand].forEach(({ t, sin, cos, growth, bulge, noise }, i) => {
			const sine = sin * cosPhase + cos * sinPhase;
			const px =
				x + centers[i] + (cos * cosPhase - sin * sinPhase) * (3 + (halfWidth - 3) * growth) * bulge;
			const offset = (strand * 201 + i) * 3;
			points[offset] = px;
			points[offset + 1] =
				bottom - 4 - t * (height - 18) + sine * (2 + t * 11) + noise - (px - x) * 0.1;
			points[offset + 2] = Number(sine >= 0);
		});
	}
	for (const front of [false, true]) {
		for (let strand = 0; strand < 5; strand++) {
			ctx.beginPath();
			let drawing = false;
			for (let i = 0; i <= 200; i++) {
				const offset = (strand * 201 + i) * 3;
				if (points[offset + 2] !== Number(front)) {
					drawing = false;
					continue;
				}
				if (drawing) ctx.lineTo(points[offset], points[offset + 1]);
				else ctx.moveTo(points[offset], points[offset + 1]);
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
