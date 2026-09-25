import test from 'node:test';
import assert from 'node:assert/strict';
import { createRace, stepRace } from '../../src/lib/marble-race/physics.js';
import { createRaceClock } from '../../src/lib/marble-race/clock.js';

function solo(count, x, offset, vx, phase) {
	const race = createRace(Array(count).fill('공'), 'keyboard', 47);
	for (const m of race.marbles.slice(1)) {
		m.finished = true;
		race.finished.push(m);
	}
	const bar = race.blocks.find((b) => b.id === 'finale-bar');
	bar.phase = phase;
	const slope = Math.tan(((x < 360 ? 40 : 30) * Math.PI) / 180);
	Object.assign(race.marbles[0], {
		x,
		y: race.layout.finale.mouthY - Math.abs(x - 360) * slope - offset,
		vx,
		vy: 0,
		finaleEntry: 0
	});
	return race;
}
function finish(race) {
	const m = race.marbles[0],
		bar = race.blocks.find((b) => b.id === 'finale-bar');
	while (race.time < 13.2 && !m.finished) {
		stepRace(race);
		assert.equal(bar.w, 448);
		assert.equal(bar.x, 160);
		assert.equal(bar.y, race.layout.finale.start + 480);
		for (const wall of race.finaleBlocks.filter((b) =>
			['finale-guide', 'finale-chute'].includes(b.deviceId)
		)) {
			const side = wall.id.endsWith('--1') ? -1 : 1,
				c = Math.cos(wall.angle),
				s = Math.sin(wall.angle),
				dx = m.x - wall.x,
				dy = m.y - wall.y;
			if (Math.abs(dx * c + dy * s) < (wall.w - wall.h) / 2)
				assert.ok(dx * (-side * s) + dy * (side * c) >= -wall.h / 2);
		}
	}
	assert.ok(m.finished, JSON.stringify({ time: race.time, x: m.x, y: m.y, vx: m.vx, vy: m.vy }));
	assert.equal(m.chuteEntered, true);
	assert.ok(m.x - m.r >= 340 && m.x + m.r <= 380);
	return race.time;
}
test('길이448 고정·새 경사와 회전축에서 마지막 구슬3456조합은1회전 이내 중앙으로 완주한다', (t) => {
	let maximum = 0;
	for (const x of [35, 100, 160, 220, 280, 340, 360, 380, 440, 500, 580, 685])
		for (const offset of [30, 100, 200])
			for (const vx of [-100, 0, 100])
				for (let phase = 0; phase < 32; phase++)
					maximum = Math.max(maximum, finish(solo(2, x, offset, vx, (phase * Math.PI) / 16)));
	t.diagnostic(JSON.stringify({ cases: 3456, maximum }));
});
test('1000개 경기 중 마지막1개도 위치5가지·각도16가지에서 길이를 바꾸지 않고 완주한다', (t) => {
	let maximum = 0;
	for (const x of [40, 160, 360, 580, 680])
		for (let phase = 0; phase < 16; phase++)
			maximum = Math.max(maximum, finish(solo(1000, x, 100, 0, (phase * Math.PI) / 8)));
	t.diagnostic(JSON.stringify({ cases: 80, maximum }));
});
test('새 배치의 마지막 구슬도0.25·1·2배속에서 같은 상태·이벤트이고 새 바는항상448이다', () => {
	const states = [];
	for (const speed of [0.25, 1, 2]) {
		const race = solo(2, 580, 30, 100, (13 * Math.PI) / 16),
			clock = createRaceClock();
		for (let i = 0; i < (120 * 10) / speed; i++)
			clock.advance(1 / 120, speed, () => stepRace(race));
		states.push({
			time: race.time,
			marbles: race.marbles,
			blocks: race.blocks,
			events: race.events
		});
		assert.equal(race.blocks.find((b) => b.id === 'finale-bar').w, 448);
	}
	assert.deepEqual(states[0], states[1]);
	assert.deepEqual(states[1], states[2]);
	assert.equal(createRace(['새 공', '공']).blocks.find((b) => b.id === 'finale-bar').w, 448);
});

for (const count of [2, 1000]) {
	test(`${count}개 경기의 마지막 구슬은 통로 전체 진입 뒤 바에 밀려 완전히 나와도 다시 중앙으로 골인한다`, (t) => {
		let ejected = 0,
			maximum = 0,
			maximumClearance = 0;
		for (let phase = 0; phase < 64; phase++) {
			const race = solo(count, 360, 100, 0, (phase * Math.PI) / 32);
			const m = race.marbles[0],
				bar = race.blocks.find((b) => b.id === 'finale-bar'),
				mouth = race.layout.finale.mouthY;
			m.vy = 150;
			let entered = false,
				touched = false,
				outside = false,
				reentered = false;
			while (race.time < 13.2 && !m.finished) {
				stepRace(race);
				assert.equal(bar.w, 448);
				if (m.chuteEntered && m.y - m.r >= mouth) {
					entered = true;
					if (outside) reentered = true;
				}
				if (entered && race.events.some((event) => event.blockId === bar.id && event.id === m.id))
					touched = true;
				// 중심만 올라온 상태는 제외한다. 구슬 아래쪽까지 입구 위로 나와야 한다.
				if (entered && touched && m.y + m.r < mouth) {
					outside = true;
					assert.equal(m.chuteEntered, false);
					assert.equal(m.finished, false);
					maximumClearance = Math.max(maximumClearance, mouth - m.y - m.r);
				}
			}
			assert.ok(m.finished, `회전각 ${phase}/64에서 반복 반동 없이 완주한다`);
			assert.equal(m.chuteEntered, true);
			assert.ok(m.x - m.r >= 340 && m.x + m.r <= 380);
			if (outside) {
				ejected++;
				assert.ok(reentered, '밀려난 뒤 통로에 다시 들어와야 골인한다');
			}
			maximum = Math.max(maximum, race.time);
		}
		assert.ok(ejected >= 16, '여러 회전각에서 통로 밖으로 완전히 밀어낸다');
		assert.ok(maximumClearance > 100, '통로 위로 충분히 되튕기는 장면을 유지한다');
		t.diagnostic(JSON.stringify({ count, phases: 64, ejected, maximum, maximumClearance }));
	});
}
