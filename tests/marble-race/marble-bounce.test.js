import test from 'node:test';
import assert from 'node:assert/strict';
import { createRace, stepRace } from '../../src/lib/marble-race/physics.js';

const dt = 0.001;
const damped = (speed) => speed * Math.exp(-dt * 1.5);
const near = (actual, expected) =>
	assert.ok(Math.abs(actual - expected) < 1e-8, `${actual} ≈ ${expected}`);
function pair(vxA, vxB) {
	const race = createRace(['가', '나'], 'keyboard', 47);
	race.blocks = [];
	race.marbles.forEach((marble, index) =>
		Object.assign(marble, {
			x: 300 + index * 25,
			y: 200,
			vx: index ? vxB : vxA,
			vy: 0
		})
	);
	return race;
}

test('마주 달리는 구슬은 접근 속도의80%로 서로 튕겨 나가고 운동량을 보존한다', () => {
	const race = pair(100, -50);
	stepRace(race, dt);
	const [a, b] = race.marbles;
	near(b.vx - a.vx, damped(150) * 0.8);
	near(a.vx + b.vx, damped(50));
	assert.ok(a.vx < 0 && b.vx > 0);
	near(a.vy, 420 * dt);
	near(b.vy, 420 * dt);
});

test('정지한 구슬에 충돌하면 속도를 전달하고 전체 운동 에너지는 늘지 않는다', () => {
	const race = pair(100, 0);
	stepRace(race, dt);
	const [a, b] = race.marbles;
	near(a.vx, damped(10));
	near(b.vx, damped(90));
	assert.ok(a.vx ** 2 + b.vx ** 2 < damped(100) ** 2);
});

test('이미 멀어지는 구슬은 겹쳐 있어도 반발력을 다시 받지 않는다', () => {
	const race = pair(-100, 50);
	stepRace(race, dt);
	near(race.marbles[0].vx, damped(-100));
	near(race.marbles[1].vx, damped(50));
});

test('번개나 얼음에 고정된 구슬은 충돌 후에도 제자리를 유지한다', () => {
	for (const kind of ['lightning', 'frost']) {
		const race = pair(100, 0);
		const held = race.marbles[1];
		held.held = { kind, until: 2, x: held.x, y: held.y };
		// 중력으로 접촉 방향이 기울지 않도록 이동 구슬의 세로 속도를 맞춘다.
		race.marbles[0].vy = -420 * dt;
		stepRace(race, dt);
		near(race.marbles[0].vx, damped(-80));
		assert.equal(held.x, 325);
		assert.equal(held.y, 200);
		assert.equal(held.vx, 0);
		assert.equal(held.vy, 0);
	}
});

test('도착한 구슬은 반발 처리에서 제외한다', () => {
	const race = pair(100, 0);
	race.marbles[1].finished = true;
	stepRace(race, dt);
	near(race.marbles[0].vx, damped(100));
	assert.equal(race.marbles[1].vx, 0);
});

test('충돌 격자는 높이 범위와 도착 여부가 바뀌어도 같은 반발을 계산한다', () => {
	const race = pair(100, -50);
	const [a, b] = race.marbles;
	// 같은 경기에서 배열을 재사용하고, 높이 범위를 늘린 다음 다시 줄인다.
	for (const y of [200, -100, 100000, 40, 200]) {
		Object.assign(a, { x: 300, y, vx: 100, vy: 0, finished: false });
		Object.assign(b, { x: 325, y, vx: -50, vy: 0, finished: false });
		stepRace(race, dt);
		near(b.vx - a.vx, damped(150) * 0.8);
		b.finished = true;
		Object.assign(a, { x: 300, y, vx: 100, vy: 0 });
		stepRace(race, dt);
		near(a.vx, damped(100));
	}
});
