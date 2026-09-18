import test from 'node:test';
import assert from 'node:assert/strict';
import { createRaceClock } from '../../src/lib/marble-race/clock.js';
import { createRace, stepRace } from '../../src/lib/marble-race/physics.js';

test('1배속과2배속은 같은 경기 시각의 물리 상태와 도착 순서가 같다', () => {
	const a = createRace(['가', '나', '다'], 'keyboard', 47);
	const b = createRace(['가', '나', '다'], 'keyboard', 47);
	const normal = createRaceClock(),
		fast = createRaceClock();
	for (let i = 0; i < 3600 && a.finished.length < 3; i++) {
		normal.advance(1 / 60, 1, () => stepRace(a));
		normal.advance(1 / 60, 1, () => stepRace(a));
		fast.advance(1 / 60, 2, () => stepRace(b));
		assert.deepEqual(
			a.marbles.map((m) => [m.x, m.y, m.vx, m.vy]),
			b.marbles.map((m) => [m.x, m.y, m.vx, m.vy])
		);
		assert.equal(a.time, b.time);
	}
	assert.equal(a.finished.length, 3);
	assert.deepEqual(
		a.finished.map((m) => m.id),
		b.finished.map((m) => m.id)
	);
	assert.deepEqual(
		a.respawnQueue.map((b) => [b.id, b.respawnAt]),
		b.respawnQueue.map((b) => [b.id, b.respawnAt])
	);
});
test('배속 전환·일시정지·초기화는 남은 계산 시간과 종료 처리를 지킨다', () => {
	const clock = createRaceClock();
	let steps = 0;
	const step = () => {
		steps++;
	};
	clock.advance(1 / 240, 1, step);
	assert.equal(steps, 0);
	clock.advance(1 / 480, 2, step);
	assert.equal(steps, 1);
	clock.advance(0, 2, step);
	assert.equal(steps, 1);
	clock.advance(1 / 240, 1, step);
	clock.reset();
	clock.advance(1 / 240, 1, step);
	assert.equal(steps, 1);
	clock.reset();
	clock.advance(0.08, 2, () => {
		steps++;
		return false;
	});
	assert.equal(steps, 2);
	clock.advance(0, 1, step);
	assert.equal(steps, 2);
});
