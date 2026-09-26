import test from 'node:test';
import assert from 'node:assert/strict';
import { createLiveClock } from '../../src/lib/marble-race/live-clock.js';

test('화면이500ms 멈춰도 시간을 보존하고0.25·1·2배속만큼 계산한다', () => {
	for (const speed of [0.25, 1, 2]) {
		const clock = createLiveClock();
		clock.start(1000, speed);
		clock.accrue(1500);
		let steps = 0;
		while (clock.takeStep(false)) steps++;
		assert.equal(steps, 60 * speed);
		assert.ok(clock.unused < 1e-10);
	}
});
test('정지 중 시간은 더하지 않고 이전 잔여 시간과 배속 구간을 보존한다', () => {
	const clock = createLiveClock();
	clock.start(0, 1);
	clock.setSpeed(100, 2);
	clock.pause(200);
	clock.accrue(5000);
	assert.ok(Math.abs(clock.unused - 0.2) < 1e-10);
	clock.start(6000, 2);
	clock.accrue(6100);
	let steps = 0;
	while (clock.takeStep(false)) steps++;
	assert.equal(steps, 60);
	assert.ok(clock.unused < 1e-10);
});
test('필수0.25배속은 밀린 시간에도 적용하며 전환 뒤 원래 배속을 사용한다', () => {
	const clock = createLiveClock();
	clock.start(0, 2);
	clock.accrue(1000);
	for (let i = 0; i < 15; i++) assert.equal(clock.takeStep(true), true);
	assert.ok(Math.abs(clock.unused - 0.5) < 1e-10);
	let steps = 0;
	while (clock.takeStep(false)) steps++;
	assert.equal(steps, 120);
});
