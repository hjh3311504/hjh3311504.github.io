import test from 'node:test';
import assert from 'node:assert/strict';
import { createRace, collision, hitBlock, stepRace } from '../../src/lib/marble-race/physics.js';

function groups() {
	const race = createRace(Array(6).fill('공'), 'keyboard', 47);
	race.time = 0.099;
	race.marbles.forEach((m, i) =>
		Object.assign(m, {
			x: (i < 3 ? 280 : 540) + (i % 3) * 18,
			y: race.layout.finale.start + 100,
			vx: 0,
			vy: 0
		})
	);
	return race;
}

test('회전바 접촉은 중복 없이 갱신하고 일반 벽 접촉은 추가 보정 대상으로 넣지 않는다', () => {
	const race = groups(),
		m = race.marbles[0];
	const bar = race.blocks.find((b) => b.id === 'finale-bar');
	bar.phase = -race.time * bar.angularSpeed * bar.direction;
	for (let i = 0; i < 2; i++) {
		Object.assign(m, { x: bar.x + 60, y: bar.y - 20, vx: 0, vy: 100 });
		hitBlock(race, m, bar, collision(m, bar, race.time));
	}
	assert.equal(race.finaleRotorContacts.size, 1);
	assert.equal(race.finaleRotorContacts.get(m), race.time);
	const other = race.marbles[3];
	const wall = race.blocks.find((b) => b.id === 'finale-guide-1');
	Object.assign(other, { x: wall.x, y: wall.y, vx: 0, vy: 0 });
	hitBlock(race, other, wall, collision(other, wall, race.time));
	assert.equal(race.finaleRotorContacts.has(other), false);
});

test('결승에서는 떨어진 두 무리의 겹침도 모두 풀고 도착 구슬은 제외한다', () => {
	const race = groups();
	const finished = race.marbles[5];
	finished.finished = true;
	const position = { x: finished.x, y: finished.y };
	stepRace(race, 0.001);
	for (let i = 0; i < race.marbles.length; i++)
		for (let j = i + 1; j < race.marbles.length; j++) {
			const a = race.marbles[i],
				b = race.marbles[j];
			if (a.finished || b.finished) continue;
			assert.ok(a.r + b.r - Math.hypot(a.x - b.x, a.y - b.y) <= 0.25);
		}
	assert.deepEqual({ x: finished.x, y: finished.y }, position);
	assert.equal(race.events.length, 0);
});

test('오래된 회전바 접촉은 새 압력으로 사용하지 않고 새 경기에서 초기화한다', () => {
	const race = groups();
	race.finaleRotorContacts.set(race.marbles[0], 0);
	stepRace(race, 0.001);
	assert.equal(race.finaleRotorContacts.size, 0);
	assert.equal(groups().finaleRotorContacts.size, 0);
});

for (const count of [3, 1000])
	test(`${count}개 경기에서 바에 밀리는 번개 구슬은 연결된 번개 구슬도 밀고 정지 시간은 유지한다`, () => {
		const race = createRace(Array(count).fill('공'), 'keyboard', 47),
			bar = race.blocks.find((b) => b.id === 'finale-bar');
		bar.phase = 0;
		const targets = race.marbles.slice(0, 3);
		targets.forEach((m, i) =>
			Object.assign(m, {
				x: 360,
				y: bar.y - 21 - i * 26,
				vx: 0,
				vy: 0,
				held: { kind: 'lightning', x: 360, y: bar.y - 21 - i * 26, until: 2 }
			})
		);
		const before = targets.map((m) => m.y);
		for (let i = 0; i < 12; i++) {
			stepRace(race);
			for (let j = 0; j < 3; j++) {
				const a = race.marbles[j];
				assert.equal(a.held.until, 2);
				assert.equal(a.held.x, a.x);
				assert.equal(a.held.y, a.y);
				assert.equal(a.vx, 0);
				assert.equal(a.vy, 0);
				for (let k = j + 1; k < 3; k++) {
					const b = race.marbles[k];
					assert.ok(a.r + b.r - Math.hypot(a.x - b.x, a.y - b.y) <= 1);
				}
			}
		}
		assert.ok(targets.every((m, i) => m.y < before[i] - 1));
	});

test('x160 회전축은 직전 배치보다 통로에 더 깊이 닿고 기존 비교 배치보다 점유 시간이 짧다', (t) => {
	const race = groups(),
		bar = race.blocks.find((b) => b.id === 'finale-bar');
	bar.phase = 0;
	const period = (Math.PI * 2) / bar.angularSpeed;
	const blockedSeconds = (candidate) => {
		let blocked = 0;
		for (let i = 0; i < 1760; i++) {
			for (let y = race.layout.finale.mouthY + 13; y < race.layout.finish.y; y += 4) {
				if (collision({ x: 360, y, r: 13 }, candidate, (i * period) / 1760)) {
					blocked++;
					break;
				}
			}
		}
		return (blocked / 1760) * period;
	};
	assert.equal(bar.x, 160);
	assert.equal(bar.y, race.layout.finale.start + 480);
	const before = blockedSeconds({ ...bar, x: 200, y: race.layout.finale.start + 500 });
	const previous = blockedSeconds({ ...bar, x: 145, y: race.layout.finale.start + 440 });
	const after = blockedSeconds(bar);
	// 직전 왼쪽 위 배치의30% 기준을 보존한다. 사용자가 통로 반동을 늘리도록
	// 요청한 현재 배치는 별도의 실제 진입→완전 이탈→재진입→완주 검사로 검증한다.
	assert.ok(previous < before);
	assert.ok(previous / period < 0.3);
	assert.ok(after > previous);
	assert.ok(after < before, `${before}초 → ${after}초`);
	t.diagnostic(JSON.stringify({ period, before, previous, after }));
});
