import test from 'node:test';
import assert from 'node:assert/strict';
import { stepRace } from '../../src/lib/marble-race/physics.js';
import { createFinaleDuel } from './helpers/finale-duel.js';

function runDuel(options, configure = () => {}) {
	const race = createFinaleDuel(options);
	configure(race);
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
	const bar = race.blocks.find((b) => b.id === 'finale-bar');
	assert.equal(bar.w, 448);
	assert.equal(bar.x, 160);
	assert.equal(bar.y, race.layout.finale.start + 480);
	for (const m of race.finished) {
		assert.equal(m.chuteEntered, true);
		assert.ok(m.x - m.r >= 340 && m.x + m.r <= 380, '중앙 통로로 골인한다');
	}
	return { race, rises, overtakenDuringRebound };
}

for (const side of [-1, 1]) {
	test(`${side === -1 ? '왼쪽' : '오른쪽'} 진입에서 길이448 바의 반동으로 선두를 추월하고 중앙으로 골인한다`, () => {
		const options = { currentGuide: true, side, phase: Math.PI / 8 };
		// 같은 최신 지형에서 바의 반동이 실제 추월 원인인지 비교한다.
		const withoutBar = runDuel(options, (race) => {
			race.blocks.find((b) => b.id === 'finale-bar').alive = false;
		});
		const withBar = runDuel(options);
		assert.deepEqual(
			withoutBar.race.finished.map((m) => m.id),
			[0, 1]
		);
		assert.deepEqual(
			withBar.race.finished.map((m) => m.id),
			[1, 0]
		);
		assert.equal(withoutBar.overtakenDuringRebound, false);
		assert.ok(withBar.overtakenDuringRebound);
		assert.ok(
			withBar.rises.some((rise) => rise >= 60),
			'구슬 지름2개 이상 되튕긴다'
		);
		assert.ok(withBar.race.marbles.every((m) => m.windUntil === 0));
	});
}

test('현재 길이448·양쪽 진입과 시작 각도32조합에서 반동·역전과20경기초 내 완주를 확인한다', (t) => {
	const metrics = [];
	for (const side of [-1, 1]) {
		let reversed = 0,
			rebounds = 0,
			maximumTime = 0;
		for (let phase = 0; phase < 16; phase++) {
			const result = runDuel({ currentGuide: true, side, phase: (phase * Math.PI) / 8 });
			reversed += result.race.finished[0].id === 1 ? 1 : 0;
			rebounds += result.rises.some((rise) => rise >= 60) ? 1 : 0;
			maximumTime = Math.max(maximumTime, result.race.time);
		}
		assert.ok(reversed > 0, '양쪽 진입 모두 실제 역전 사례가 있다');
		assert.ok(rebounds > 0, '양쪽 진입 모두 구슬 지름2개 이상의 반동이 있다');
		metrics.push({ side, reversed, rebounds, maximumTime });
	}
	t.diagnostic(JSON.stringify(metrics));
});
