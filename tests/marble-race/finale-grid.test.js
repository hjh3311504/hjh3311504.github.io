import test from 'node:test';
import assert from 'node:assert/strict';
import { createRace, settleFinaleContacts } from '../../src/lib/marble-race/physics.js';

function separated(a, b) {
	assert.ok(a.r + b.r - Math.hypot(a.x - b.x, a.y - b.y) <= 0.25);
}

test('결승 격자는 음수 높이의 무리를 보존하고 높이 범위·도착·구슬 순서 변경을 반영한다', () => {
	const race = createRace(Array(5).fill('공'), 'keyboard', 47);
	race.finaleBlocks = [];
	const [upperA, upperB, lowerA, lowerB, finished] = race.marbles;
	const y = race.layout.finale.start + 100;
	Object.assign(upperA, { x: 100, y: -100 });
	Object.assign(upperB, { x: 110, y: -100 });
	Object.assign(lowerA, { x: 300, y });
	Object.assign(lowerB, { x: 310, y });
	Object.assign(finished, { x: 300, y, finished: true });
	settleFinaleContacts(race);
	separated(lowerA, lowerB);
	assert.deepEqual([upperA.x, upperA.y, upperB.x, upperB.y], [100, -100, 110, -100]);
	assert.deepEqual([finished.x, finished.y], [300, y]);

	// 같은 경기의 재사용 배열보다 훨씬 넓은 범위가 필요해진 경우다.
	Object.assign(upperA, { x: 100, y: y + 100000 });
	Object.assign(upperB, { x: 110, y: y + 100000 });
	settleFinaleContacts(race);
	separated(upperA, upperB);
	separated(lowerA, lowerB);

	upperA.finished = true;
	Object.assign(lowerA, { x: 300, y });
	Object.assign(lowerB, { x: 310, y });
	race.marbles.reverse();
	settleFinaleContacts(race);
	separated(lowerA, lowerB);
	assert.deepEqual([finished.x, finished.y], [300, y]);
});

test('결승 밖 구슬도 결승 구슬과 새로 연결되면 보정 대상에 포함한다', () => {
	const race = createRace(['위', '아래'], 'keyboard', 47);
	race.finaleBlocks = [];
	const [upper, lower] = race.marbles;
	const y = race.layout.finale.start;
	Object.assign(upper, { x: 300, y: y - 30 });
	Object.assign(lower, { x: 500, y: y - 10 });
	settleFinaleContacts(race);
	assert.equal(upper.y, y - 30);
	lower.x = 300;
	settleFinaleContacts(race);
	separated(upper, lower);
	assert.ok(upper.y < y - 30);
});

test('큰 무리의 초기 위쪽 분리는64개 이하·표시·고정 구슬의 보정을 바꾸지 않는다', () => {
	const prepare = (count, held = false) => {
		const race = createRace(Array(count).fill('공'), 'keyboard', 47);
		race.finaleBlocks = [];
		const y = race.layout.finale.start + 60;
		Object.assign(race.marbles[0], { x: 300, y, vx: 0, vy: 0 });
		Object.assign(race.marbles[1], { x: 300, y: y - 20, vx: 0, vy: 0 });
		if (held) race.marbles[1].held = { kind: 'frost', until: 2, x: 300, y: y - 20 };
		return race;
	};
	const crowd = prepare(65),
		bottom = crowd.marbles[0].y;
	settleFinaleContacts(crowd);
	separated(...crowd.marbles.slice(0, 2));
	assert.equal(crowd.marbles[0].y, bottom);
	for (const [count, display] of [
		[64, false],
		[65, true]
	]) {
		const race = prepare(count);
		settleFinaleContacts(race, display);
		assert.ok(race.marbles[0].y > bottom);
		separated(...race.marbles.slice(0, 2));
	}
	const held = prepare(65, true),
		y = held.marbles[1].y;
	settleFinaleContacts(held);
	assert.equal(held.marbles[1].y, y);
	separated(...held.marbles.slice(0, 2));
});
