import test from 'node:test';
import assert from 'node:assert/strict';
import { createRace } from '../../src/lib/marble-race/physics.js';
const positions = (race) => race.marbles.map(({ id, x, y }) => ({ id, x, y }));

test('한 줄에26개까지 배치하고 나머지도 최소한의 줄로 겹치지 않게 놓는다', () => {
	for (const count of [2, 10, 26, 27, 30, 60]) {
		const race = createRace(Array(count).fill('구슬'), 'keyboard', 47);
		const rows = new Map();
		for (const marble of race.marbles) {
			if (!rows.has(marble.y)) rows.set(marble.y, []);
			rows.get(marble.y).push(marble);
			assert.ok(marble.x >= 25 && marble.x <= 695);
			assert.ok(marble.y + marble.r < race.zones[0].start);
		}
		assert.equal(rows.size, Math.ceil(count / 26));
		for (const [y, row] of [...rows].sort(([a], [b]) => a - b)) {
			const rowIndex = (y - 70) / 40;
			assert.equal(row.length, Math.min(26, count - rowIndex * 26));
		}
		for (const [i, a] of race.marbles.entries())
			for (const b of race.marbles.slice(i + 1))
				assert.ok(Math.hypot(a.x - b.x, a.y - b.y) >= a.r + b.r);
		assert.ok(race.marbles.every((m) => m.vx === 0 && m.vy === 0));
	}
});

test('자리 난수가 같으면 미리보기·실제 경기의 위치가 같고 다시 섞어도 명단은 유지한다', () => {
	for (const count of [10, 60, 300]) {
		const names = Array.from({ length: count }, (_, i) => `구슬${i}`);
		const full = createRace(names, 'keyboard', 47);
		const preview = createRace(names.slice(0, 60), 'keyboard', 47, {
			layoutCount: count,
			preview: true
		});
		assert.deepEqual(positions(preview), positions(full).slice(0, 60));
		const shuffled = createRace(names, 'keyboard', 999);
		assert.notDeepEqual(positions(shuffled), positions(full));
		assert.deepEqual(
			shuffled.marbles.map((m) => m.name),
			names
		);
		assert.deepEqual(positions(createRace(names, 'keyboard', 47)), positions(full));
	}
});
