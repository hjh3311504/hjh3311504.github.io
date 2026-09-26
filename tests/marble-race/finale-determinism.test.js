import test from 'node:test';
import assert from 'node:assert/strict';
import { createRace, stepRace } from '../../src/lib/marble-race/physics.js';
import { createRaceClock } from '../../src/lib/marble-race/clock.js';

// 결승의 연결 접촉을 다시 풀면서 이전 보정 방식과 물리 결과가 달라진다.
// 현재 지형·보정 규칙에서 배속과 무관하게 같은 경기 시각의 결과를 재현해야 한다.
test('200개 결승의 연결 접촉 보정·도착 순서·스킬은0.25·1·2배속에서 동일하다', () => {
	const states = [];
	for (const speed of [0.25, 1, 2]) {
		const race = createRace(Array(200).fill('공'), 'keyboard', 47, { skillsEnabled: true });
		const clock = createRaceClock();
		race.marbles.forEach((m, i) =>
			Object.assign(m, {
				x: 45 + (i % 20) * 33,
				y: race.layout.finale.start - 30 - Math.floor(i / 20) * 30,
				vx: 0,
				vy: 150
			})
		);
		for (let i = 0; i < (120 * 12) / speed; i++)
			clock.advance(1 / 120, speed, () => {
				stepRace(race);
			});
		assert.ok(Math.abs(race.time - 12) < 1e-8);
		assert.ok(race.marbles.some((m) => m.y > race.layout.finale.start));
		states.push({
			time: race.time,
			marbles: race.marbles,
			finished: race.finished.map((m) => m.id),
			events: race.events,
			skills: race.skills
		});
	}
	assert.deepEqual(states[0], states[1]);
	assert.deepEqual(states[1], states[2]);
});

test('1000개 출발의 상태·스킬·모든 효과음 이벤트는0.25·1·2배속에서 동일하다', () => {
	const states = [];
	for (const speed of [0.25, 1, 2]) {
		const race = createRace(Array(1000).fill('공'), 'keyboard', 47, { skillsEnabled: true });
		const clock = createRaceClock();
		const events = [];
		for (let i = 0; i < (120 * 10) / speed; i++)
			clock.advance(1 / 120, speed, () => {
				events.push(...stepRace(race));
			});
		assert.ok(Math.abs(race.time - 10) < 1e-8);
		assert.ok(events.length > 0);
		assert.ok(events.some((event) => event.kind === 'skill'));
		states.push({
			time: race.time,
			marbles: race.marbles,
			blocks: race.blocks,
			finished: race.finished.map((m) => m.id),
			events,
			skills: race.skills
		});
	}
	assert.deepEqual(states[0], states[1]);
	assert.deepEqual(states[1], states[2]);
});
