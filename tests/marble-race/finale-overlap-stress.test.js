import test from 'node:test';
import assert from 'node:assert/strict';
import { createRace, stepRace } from '../../src/lib/marble-race/physics.js';
import { createPresentation } from '../../src/lib/marble-race/presentation.js';

function maximumOverlap(race) {
	const cells = new Map();
	let maximum = 0;
	const inFinale = (m) => m.finaleEntry != null || m.y + m.r >= race.layout.finale.start;
	for (const a of race.marbles) {
		if (a.finished) continue;
		const cx = Math.floor(a.x / 32),
			cy = Math.floor(a.y / 32);
		for (let y = cy - 1; y <= cy + 1; y++)
			for (let x = cx - 1; x <= cx + 1; x++)
				for (const b of cells.get(y * 32 + x) ?? []) {
					if (!inFinale(a) && !inFinale(b)) continue;
					maximum = Math.max(maximum, a.r + b.r - Math.hypot(a.x - b.x, a.y - b.y));
				}
		const key = cy * 32 + cx;
		if (!cells.has(key)) cells.set(key, []);
		cells.get(key).push(a);
	}
	return maximum;
}

for (const phase of [0, Math.PI * 1.5]) {
	test(`1000개 밀집·스킬ON·회전각${phase}에서 실제 위치와 보간의 결승 겹침은1 이하이다`, (t) => {
		const race = createRace(Array(1000).fill('공'), 'keyboard', 47, { skillsEnabled: true });
		// 구슬을 재질 블록 안에 생성하지 않도록 결승 앞에 빈 진입 공간을 만든다.
		// 결승의 회전바·양쪽 벽·폭40 통로는 실제 경기와 같다.
		race.blocks = race.blocks.filter((b) => b.zoneId === 'finale');
		race.blocks.find((b) => b.id === 'finale-bar').phase = phase;
		race.marbles.forEach((m, i) =>
			Object.assign(m, {
				x: 45 + (i % 20) * 33,
				y: race.layout.finale.start - 30 - Math.floor(i / 20) * 30,
				vx: 0,
				vy: 150
			})
		);
		const display = createPresentation();
		display.push(race, 0);
		let maximum = 0,
			shownMaximum = 0;
		for (let step = 0; step < 12 * 120; step++) {
			stepRace(race);
			maximum = Math.max(maximum, maximumOverlap(race));
			assert.ok(maximum <= 1, `경기 시각${race.time}, 실제 겹침${maximum}`);
			// 2배속에서 약60회/초 전달되는 실제4단계 간격의 중간 화면을 확인한다.
			if (step % 4 === 3) {
				const now = race.time * 500;
				display.push(race, now);
				const physical = race.marbles.map((m) => [
					m.x,
					m.y,
					m.vx,
					m.vy,
					m.held ? { ...m.held } : null
				]);
				const frame = display.sample(race, now + 1000 / 120);
				shownMaximum = Math.max(shownMaximum, maximumOverlap(frame));
				assert.ok(shownMaximum <= 1, `경기 시각${race.time}, 표시 겹침${shownMaximum}`);
				assert.deepEqual(
					race.marbles.map((m) => [m.x, m.y, m.vx, m.vy, m.held ? { ...m.held } : null]),
					physical
				);
			}
		}
		assert.ok(race.finished.length > 0);
		assert.ok(race.skills.serial > 0);
		assert.ok(race.finished.every((m) => m.chuteEntered));
		t.diagnostic(JSON.stringify({ maximum, shownMaximum, finished: race.finished.length }));
	});
}
