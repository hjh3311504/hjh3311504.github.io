import test from 'node:test';
import assert from 'node:assert/strict';
import { stepRace } from '../../src/lib/marble-race/physics.js';
import { createFinaleDuel } from './helpers/finale-duel.js';

function runDuel(options) {
	const race = createFinaleDuel(options);
	const rises = [];
	let ascent = null;
	let overtakenDuringRebound = false;
	while (race.time < 20 && race.finished.length < 2) {
		stepRace(race);
		const leader = race.marbles[0];
		if (
			!ascent &&
			race.events.some((event) => event.blockId === 'finale-bar' && event.id === 0) &&
			leader.vy < -100
		) {
			ascent = { start: leader.y, top: leader.y };
		}
		if (ascent) {
			ascent.top = Math.min(ascent.top, leader.y);
			if (leader.vy < 0 && race.marbles[1].y > leader.y) overtakenDuringRebound = true;
			if (leader.vy >= 0 || leader.finished) {
				rises.push(ascent.start - ascent.top);
				ascent = null;
			}
		}
	}
	assert.equal(race.finished.length, 2, '두 구슬 모두20경기초 안에 완주한다');
	return { race, rises, overtakenDuringRebound };
}

test('기존에는 선두가 이기던 접전에서 선두의 되튕김 사이 추격 구슬이 먼저 골인한다', () => {
	const before = runDuel({ previous: true });
	const after = runDuel({ previous: false });
	assert.deepEqual(
		before.race.finished.map((m) => m.id),
		[0, 1]
	);
	assert.deepEqual(
		after.race.finished.map((m) => m.id),
		[1, 0]
	);
	assert.ok(after.overtakenDuringRebound);
	assert.ok(
		after.rises.some((rise) => rise >= 60),
		'선두가 구슬 지름2개 이상 위로 돌아온다'
	);
	assert.ok(after.race.marbles.every((m) => m.windUntil === 0));
});

test('양쪽 진입과 시작 각도32조합에서 기존보다 선두의 평균 되튕김 높이가 커진다', (t) => {
	const metrics = [];
	for (const previous of [true, false]) {
		let reversed = 0;
		const rises = [];
		for (const side of [-1, 1])
			for (let phase = 0; phase < 16; phase++) {
				const result = runDuel({ previous, side, phase: (phase * Math.PI) / 8 });
				rises.push(...result.rises);
				reversed += result.race.finished[0].id === 1 ? 1 : 0;
			}
		metrics.push({ reversed, meanRise: rises.reduce((a, b) => a + b, 0) / rises.length });
	}
	t.diagnostic(JSON.stringify(metrics));
	assert.ok(metrics[1].meanRise > metrics[0].meanRise * 1.2);
	assert.ok(
		metrics[1].reversed >= metrics[0].reversed,
		'고정 접전 표본의 역전 기회를 줄이지 않는다'
	);
});
