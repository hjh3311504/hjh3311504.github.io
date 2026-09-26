import test from 'node:test';
import assert from 'node:assert/strict';
import { createRace, stepRace } from '../../src/lib/marble-race/physics.js';
import { createFinaleDuel } from './helpers/finale-duel.js';

test('왼쪽40°·오른쪽30° 벽과 왼쪽 회전바의32개 접전은 완주하고 역전 빈도를 기록한다', (t) => {
	let reversed = 0,
		maxTime = 0;
	for (const side of [-1, 1])
		for (let phase = 0; phase < 16; phase++) {
			const race = createFinaleDuel({ currentGuide: true, side, phase: (phase * Math.PI) / 8 });
			while (race.time < 20 && race.finished.length < 2) stepRace(race);
			assert.equal(race.finished.length, 2);
			reversed += race.finished[0].id === 1 ? 1 : 0;
			maxTime = Math.max(maxTime, race.time);
		}
	// 왼쪽 배치는 좁은 통로에서 되튕겨 같은 접전의 역전 빈도가 달라질 수 있다.
	// 사용자 위치 변경 뒤에도32조합의 실제 완주를 검사하고 횟수는 숨기지 않는다.
	t.diagnostic(JSON.stringify({ reversed, maxTime }));
});

test('왼쪽40°·오른쪽30° 경사와13.2초 회전 주기에서60개 밀집·각도4가지 모두120경기초 안에 완주한다', (t) => {
	const results = [];
	for (const phase of [0, Math.PI / 2, Math.PI, Math.PI * 1.5]) {
		const race = createRace(Array(60).fill('공'), 'keyboard', 47, { skillsEnabled: false });
		race.blocks.find((b) => b.id === 'finale-bar').phase = phase;
		race.marbles.forEach((m, i) =>
			Object.assign(m, {
				x: 45 + (i % 20) * 33,
				y: race.layout.finale.start - 30 - Math.floor(i / 20) * 30,
				vx: 0,
				vy: 150
			})
		);
		while (race.time < 120 && race.finished.length < 60) stepRace(race);
		assert.equal(race.finished.length, 60);
		assert.equal(new Set(race.finished.map((m) => m.id)).size, 60);
		assert.ok(race.marbles.every((m) => Number.isFinite(m.x) && Number.isFinite(m.y)));
		results.push({ phase, finishedAt: race.time });
	}
	t.diagnostic(JSON.stringify(results));
});
