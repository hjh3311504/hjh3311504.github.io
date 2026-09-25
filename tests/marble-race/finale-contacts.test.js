import test from 'node:test';
import assert from 'node:assert/strict';
import { createRace, stepRace, collision } from '../../src/lib/marble-race/physics.js';
import { createRaceClock } from '../../src/lib/marble-race/clock.js';
import { createPresentation } from '../../src/lib/marble-race/presentation.js';

function crowd(count = 60, phase = 0) {
	const race = createRace(Array(count).fill('공'), 'keyboard', 47);
	race.blocks.find((b) => b.id === 'finale-bar').phase = phase;
	race.marbles.forEach((m, i) =>
		Object.assign(m, {
			x: 45 + (i % 20) * 33,
			y: race.layout.finale.start - 30 - Math.floor(i / 20) * 30,
			vx: 0,
			vy: 150
		})
	);
	return race;
}
function overlap(race) {
	let depth = 0;
	for (let i = 0; i < race.marbles.length; i++) {
		const a = race.marbles[i];
		if (a.finished) continue;
		for (let j = i + 1; j < race.marbles.length; j++) {
			const b = race.marbles[j];
			if (!b.finished && !(a.held && b.held))
				depth = Math.max(depth, a.r + b.r - Math.hypot(a.x - b.x, a.y - b.y));
		}
	}
	return depth;
}

test('회전바에 닿지 않은 결승 겹침도 매 물리 단계에서 함께 푼다', () => {
	for (const time of [0, 0.03, 0.099, 0.1]) {
		const race = crowd(3);
		race.time = time;
		race.marbles.forEach((m, i) =>
			Object.assign(m, { x: 300 + i * 18, y: race.layout.finale.start + 100, vx: 0, vy: 0 })
		);
		stepRace(race, 0.001);
		assert.ok(overlap(race) <= 0.25);
		assert.equal(race.events.length, 0, '위치 보정은 효과음을 만들지 않는다');
		assert.ok(
			race.marbles.every((m) => Math.abs(m.vx) < 1e-9),
			'정지 상태에 추가 반발력을 만들지 않는다'
		);
	}
});

test('결승 왼쪽40°·오른쪽30° 직선은 같은 폭40 통로에 연결한다', () => {
	const race = crowd(2),
		left = race.blocks.find((b) => b.id === 'finale-guide--1'),
		right = race.blocks.find((b) => b.id === 'finale-guide-1');
	assert.equal(left.arc, undefined);
	assert.equal(right.arc, undefined);
	assert.ok(Math.abs(left.angle - (Math.PI * 2) / 9) < 1e-9);
	assert.ok(Math.abs(right.angle - (Math.PI * 5) / 6) < 1e-9);
	assert.ok(right.y > left.y, '완만한 오른쪽 벽의 시작 높이가 더 낮다');
	assert.equal(left.h, 12);
	assert.equal(right.h, 12);
	for (const [side, guide] of [
		[-1, left],
		[1, right]
	]) {
		const nx = -side * Math.sin(guide.angle),
			ny = side * Math.cos(guide.angle);
		for (let i = 1; i < 20; i++) {
			const distance = (i / 20 - 0.5) * (guide.w - guide.h);
			const point = {
				x: guide.x + Math.cos(guide.angle) * distance + (nx * guide.h) / 2,
				y: guide.y + Math.sin(guide.angle) * distance + (ny * guide.h) / 2,
				r: 13
			};
			const hit = collision(point, guide, 0);
			assert.ok(hit);
			assert.ok(Math.abs(hit.depth - 13) < 1e-9);
			assert.ok(Math.abs(hit.nx - nx) < 1e-9 && Math.abs(hit.ny - ny) < 1e-9);
			assert.equal(
				collision({ ...point, x: point.x + nx * 13.01, y: point.y + ny * 13.01 }, guide, 0),
				null
			);
		}
	}
	assert.equal(race.layout.finish.right - race.layout.finish.left, 40);
});

test('60개 밀집·회전 각도4가지에서 겹침1 이하와 벽 관통 없이 완주한다', (t) => {
	const metrics = [];
	for (const phase of [0, Math.PI / 2, Math.PI, Math.PI * 1.5]) {
		const race = crowd(60, phase);
		let maximum = 0;
		while (race.time < 60 && race.finished.length < 60) {
			stepRace(race);
			maximum = Math.max(maximum, overlap(race));
			assert.ok(maximum <= 1, `각도${phase}, 시각${race.time}: 겹침${maximum}`);
			for (const m of race.marbles) {
				if (!m.finished && m.y > race.layout.finale.mouthY + 30)
					assert.ok(m.x - m.r >= 340 - 0.01 && m.x + m.r <= 380 + 0.01);
			}
		}
		assert.equal(race.finished.length, 60);
		metrics.push({ phase, maximum, finish: race.time });
	}
	t.diagnostic(JSON.stringify(metrics));
});

test('양쪽1열 구슬은 각각40°·30° 경사면을 내려가 완주한다', () => {
	for (const side of [-1, 1]) {
		const race = crowd(12),
			guide = race.blocks.find((b) => b.id === `finale-guide-${side}`);
		race.marbles.forEach((m, i) => {
			const distance = -150 + i * 27;
			const offset = 6 + m.r + 0.01;
			const x = guide.x + Math.cos(guide.angle) * distance - side * Math.sin(guide.angle) * offset;
			const y = guide.y + Math.sin(guide.angle) * distance + side * Math.cos(guide.angle) * offset;
			Object.assign(m, {
				x,
				y,
				vx: 0,
				vy: 0,
				finaleEntry: 0
			});
		});
		while (race.time < 60 && race.finished.length < 12) {
			stepRace(race);
			assert.ok(overlap(race) <= 1);
		}
		assert.equal(race.finished.length, 12);
	}
});

test('위아래2개가 실제 위치·0.25배속 보간에서 겹치지 않고 회전바2회전 안에 완주한다', () => {
	const race = createRace(['아래', '위'], 'keyboard', 47);
	const display = createPresentation();
	const bar = race.blocks.find((b) => b.id === 'finale-bar');
	race.marbles.forEach((m, i) =>
		Object.assign(m, {
			x: 330,
			y: race.layout.finale.guideStartY + 318 * Math.tan((Math.PI * 2) / 9) - 18 - i * 26,
			vx: 0,
			vy: 150
		})
	);
	bar.phase = Math.PI / 4;
	display.push(race, 0);
	let rebound = false;
	while (race.time < (4 * Math.PI) / bar.angularSpeed && race.finished.length < 2) {
		stepRace(race);
		assert.ok(overlap(race) <= 1);
		rebound ||= race.marbles.some((m) => m.vy < -100);
		// 0.25배속의 수신 간격33.3ms 중간에 화면을 그린다.
		const now = race.time * 4000;
		display.push(race, now);
		const frame = display.sample(race, now + 1000 / 60);
		assert.ok(overlap(frame) <= 1);
		for (const m of frame.marbles)
			if (!m.finished) assert.ok((collision(m, bar, frame.time)?.depth ?? 0) <= 1);
	}
	assert.ok(rebound, '회전바에 밀려 위로 튕긴 장면을 포함한다');
	assert.equal(race.finished.length, 2);
});

test('고정 구슬을 밀거나 도착 구슬을 재충돌시키지 않고 위치 보정에서 효과음을 만들지 않는다', () => {
	const race = crowd(3),
		[fixed, moving, finished] = race.marbles;
	const y = race.layout.finale.start + 100;
	race.time = 0.099;
	Object.assign(fixed, {
		x: 360,
		y,
		vx: 0,
		vy: 0,
		held: { kind: 'lightning', x: 360, y, until: 2 }
	});
	Object.assign(moving, { x: 360, y: y + 20, vx: 0, vy: 0 });
	Object.assign(finished, { x: 360, y: y + 26, finished: true, vx: 0, vy: 0 });
	const end = { x: finished.x, y: finished.y };
	stepRace(race, 0.001);
	assert.equal(fixed.x, 360);
	assert.equal(fixed.y, y);
	assert.deepEqual({ x: finished.x, y: finished.y }, end);
	assert.ok(overlap(race) <= 0.25);
	assert.equal(race.events.length, 0);
});

test('결승 밀집 충돌도0.25·1·2배속의 동일 경기 시각에서 일치한다', () => {
	const states = [];
	for (const speed of [0.25, 1, 2]) {
		const race = crowd(12),
			clock = createRaceClock();
		for (let i = 0; i < (120 * 6) / speed; i++)
			clock.advance(1 / 120, speed, () => {
				stepRace(race);
			});
		states.push(
			race.marbles.map(({ x, y, vx, vy, finished, finishTime }) => ({
				x,
				y,
				vx,
				vy,
				finished,
				finishTime
			}))
		);
	}
	assert.deepEqual(states[0], states[1]);
	assert.deepEqual(states[1], states[2]);
});
