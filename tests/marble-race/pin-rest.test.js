import test from 'node:test';
import assert from 'node:assert/strict';
import { createRace, stepRace, STEP } from '../../src/lib/marble-race/physics.js';

function fixture(offset = 0, finalApproach = false, seed = 47) {
	const race = createRace(['가', '나'], 'keyboard', seed);
	const pin = race.blocks.find(
		(b) => b.pin && (!finalApproach || b.connectorId === 'finale-approach')
	);
	race.blocks = [pin];
	race.marbles[1].finished = true;
	const marble = race.marbles[0];
	Object.assign(marble, { x: pin.x + offset, y: pin.y - 100, vx: 0, vy: 100, bestY: pin.y - 100 });
	return { race, pin, marble };
}

function run(race, seconds, inspect = () => {}) {
	for (let i = 0; i < Math.round(seconds / STEP); i++) {
		stepRace(race);
		inspect();
	}
}

test('핀 정중앙·좌우 미세 편차의 정체는 짧은 바람으로3.5초 안에 탈출한다', () => {
	for (const finalApproach of [false, true])
		for (const offset of [-0.1, -0.01, 0, 0.01, 0.1]) {
			const { race, pin, marble } = fixture(offset, finalApproach);
			let firstWind = null;
			run(race, 3.5, () => {
				if (marble.windUntil > race.time && firstWind === null) {
					firstWind = race.time;
					assert.ok(marble.windUntil - race.time <= 0.35 + STEP);
					if (Math.abs(offset) === 0.1) assert.equal(marble.windDirection, Math.sign(offset));
				}
				assert.ok(Math.hypot(marble.x - pin.x, marble.y - pin.y) >= 29 - 0.001);
			});
			assert.ok(firstWind > 1 && firstWind < 3, `편차${offset}: ${firstWind}`);
			assert.ok(marble.y > pin.y + 29);
			assert.equal(pin.alive, true);
			assert.equal(marble.pinRest, null);
		}
});

test('정상 반동·옆으로 굴러가는 구슬에는 정체 바람을 주지 않는다', () => {
	for (const offset of [-12, -2, -0.5, 0.5, 2, 12]) {
		const { race, marble } = fixture(offset);
		run(race, 3.5, () => assert.equal(marble.windUntil, 0));
	}
});

test('핀에서 떨어지거나 빠르게 움직이면 이전 정체 시간을 버린다', () => {
	for (const moving of [false, true]) {
		const { race, pin, marble } = fixture();
		Object.assign(marble, { x: pin.x, y: pin.y - 29, vx: 0, vy: 0 });
		run(race, 0.6);
		assert.ok(marble.pinRest);
		if (moving) marble.vy = -100;
		else marble.y -= 50;
		stepRace(race);
		assert.equal(marble.pinRest, null);
		Object.assign(marble, { x: pin.x, y: pin.y - 29, vx: 0, vy: 0 });
		run(race, 0.6);
		assert.equal(marble.windUntil, 0, '끊어진 정체 시간을 합산하지 않는다');
	}
});

test('일반 장치나 결승 진입 구슬에는 핀 정체 바람을 적용하지 않는다', () => {
	for (const enteredFinale of [false, true]) {
		const { race, pin, marble } = fixture();
		if (enteredFinale) marble.finaleEntry = 0;
		else pin.pin = false;
		Object.assign(marble, { x: pin.x, y: pin.y - 29, vx: 0, vy: 0 });
		run(race, 3, () => assert.equal(marble.windUntil, 0));
		assert.equal(marble.pinRest, null);
	}
});

test('동일 난수에서는 정체 탈출 방향과 위치가 같고 새 경기에는 기록이 없다', () => {
	for (const seed of [1, 47, 999]) {
		const a = fixture(0, false, seed),
			b = fixture(0, false, seed);
		run(a.race, 3.5);
		run(b.race, 3.5);
		assert.deepEqual(a.marble, b.marble);
		assert.equal(createRace(['가', '나'], 'keyboard', seed).marbles[0].pinRest, null);
	}
});

test('동결 중에는 핀 정체 시간을 누적하지 않는다', () => {
	const { race, pin, marble } = fixture();
	Object.assign(marble, { x: pin.x, y: pin.y - 29, vx: 0, vy: 0 });
	run(race, 0.6);
	assert.ok(marble.pinRest);
	marble.held = { until: race.time + 1, blockId: pin.id, x: marble.x, y: marble.y };
	run(race, 0.8);
	assert.equal(marble.pinRest, null);
	assert.equal(marble.windUntil, 0);
	run(race, 0.8);
	assert.equal(marble.windUntil, 0);
});
