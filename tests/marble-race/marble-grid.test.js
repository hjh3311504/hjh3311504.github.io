import test from 'node:test';
import assert from 'node:assert/strict';
import { createMarbleGrid } from '../../src/lib/marble-race/marble-grid.js';

const point = (id, x, y) => ({ id, x, y, finished: false });
function check(grid, marbles) {
	for (const m of marbles) {
		if (m.finished) continue;
		const expected = marbles
			.filter(
				(other) =>
					!other.finished &&
					Math.abs(Math.floor(other.x / 32) - Math.floor(m.x / 32)) <= 1 &&
					Math.abs(Math.floor(other.y / 32) - Math.floor(m.y / 32)) <= 1
			)
			.map((other) => other.id)
			.sort((a, b) => a - b);
		assert.deepEqual(grid.nearby(m), expected, `${m.id}번의 이웃`);
	}
}

test('같은 칸의 이동은 이웃 목록을 재사용하고 칸 이동·도착은 주변 목록을 갱신한다', () => {
	const grid = createMarbleGrid();
	const marbles = [point(0, 100, 100), point(1, 120, 120), point(2, 300, 100)];
	assert.ok(grid.prepare(marbles));
	check(grid, marbles);
	const neighbors = grid.nearby(marbles[0]);
	marbles[0].x++;
	grid.prepare(marbles);
	assert.equal(grid.nearby(marbles[0]), neighbors);
	marbles[2].x = 125;
	grid.update(marbles[2]);
	check(grid, marbles);
	marbles[1].finished = true;
	grid.update(marbles[1]);
	check(grid, marbles);
	marbles[2].x = 400;
	grid.update(marbles[2]);
	check(grid, marbles);
});

test('음수 높이·격자 범위 밖 이동·범위 확대·배열 변경·새 구슬을 반영한다', () => {
	const grid = createMarbleGrid();
	let marbles = [point(0, 100, -100), point(1, 110, -110), point(2, 105, -500)];
	grid.prepare(marbles);
	check(grid, marbles);
	marbles[0].y = -100000;
	grid.update(marbles[0]);
	marbles[1].y = -100010;
	grid.update(marbles[1]);
	check(grid, marbles);
	grid.prepare(marbles);
	check(grid, marbles);
	marbles.reverse();
	grid.prepare(marbles);
	check(grid, marbles);
	marbles = marbles.map((m) => ({ ...m, y: m.y + 200000 }));
	grid.prepare(marbles);
	check(grid, marbles);
	marbles.pop();
	grid.prepare(marbles);
	check(grid, marbles);
	for (const m of marbles) m.finished = true;
	assert.equal(grid.prepare(marbles), false);
	marbles[0].finished = false;
	grid.prepare(marbles);
	check(grid, marbles);
});

test('1000개가 격자 경계를 오가도 매 단계 전수 탐색과 번호순 후보가 같다', () => {
	const grid = createMarbleGrid();
	const marbles = Array.from({ length: 1000 }, (_, id) =>
		point(id, 25 + (id % 24) * 28, -100 + Math.floor(id / 24) * 28)
	);
	for (let step = 0; step < 10; step++) {
		grid.prepare(marbles);
		for (const m of marbles) {
			m.x += ((m.id + step) % 3) - 1;
			m.y += ((m.id + step) % 7) - 3;
			if (step === 5 && m.id % 17 === 0) m.finished = true;
			grid.update(m);
		}
		check(grid, marbles);
	}
});
