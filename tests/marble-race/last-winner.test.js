import test from 'node:test';
import assert from 'node:assert/strict';
import { createRace, winners, stepRace } from '../../src/lib/marble-race/physics.js';
import { createDirector } from '../../src/lib/marble-race/director.js';

for (const count of [2, 3, 30]) {
	test(`${count}개 중 미도착1개가 남으면 골인 전에 당첨하고 이후에는 다시 축하하지 않는다`, () => {
		const race = createRace(Array(count).fill('같은 이름'));
		const director = createDirector('last');
		race.marbles.forEach((m) => (m.y = race.layout.finale.rotor.y));
		assert.equal(director.update(race).active, true);
		// 고유 번호가 가장 큰 구슬이 당첨되는 것으로 잘못 구현하지 않도록 역순으로 도착시킨다.
		for (let id = count - 1; id >= 1; id--) {
			race.marbles[id].finished = true;
			race.finished.push(race.marbles[id]);
			const state = director.update(race);
			assert.deepEqual(
				state.newWinners.map((m) => m.id),
				id === 1 ? [0] : []
			);
			assert.equal(state.complete, id === 1);
			assert.equal(state.active, id !== 1);
			assert.equal(state.finishedCelebration, id === 1);
			assert.deepEqual(director.update(race).newWinners, []);
		}
		assert.equal(winners(race, 'last')[0].id, 0);
		assert.equal(race.marbles[0].finished, false);
		assert.equal(race.marbles[0].finishTime, null);
		assert.equal(race.finished.length, count - 1);
		race.marbles[0].finished = true;
		race.finished.push(race.marbles[0]);
		assert.equal(winners(race, 'last')[0].id, 0);
		assert.deepEqual(director.update(race).newWinners, []);
		assert.equal(director.update(race).finishedCelebration, false);
		assert.deepEqual(
			createDirector('last').update(createRace(['새 경기', '새 경기'])).newWinners,
			[]
		);
	});
}

test('마지막2개가 같은 계산에 골인해도 실제 교차 순서의 마지막 구슬만 한 번 당첨한다', () => {
	const race = createRace(['나중 도착', '먼저 도착']);
	const director = createDirector('last');
	race.blocks = [];
	for (const [id, marble] of race.marbles.entries()) {
		Object.assign(marble, {
			x: 360,
			y: race.layout.finish.y - (id === 0 ? 0.8 : 0.2),
			vx: 0,
			vy: 400,
			r: 0.1,
			finaleEntry: 0
		});
	}
	stepRace(race);
	assert.deepEqual(
		race.finished.map((m) => m.id),
		[1, 0]
	);
	assert.deepEqual(
		director.update(race).newWinners.map((m) => m.id),
		[0]
	);
	assert.deepEqual(director.update(race).newWinners, []);
});
