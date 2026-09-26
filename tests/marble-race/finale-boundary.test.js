import test from 'node:test';
import assert from 'node:assert/strict';
import { createRace as prepare, stepRace, collision } from '../../src/lib/marble-race/physics.js';
import { constrainFinaleMotion } from '../../src/lib/marble-race/finale-boundary.js';

function createRace(...args) {
	const race = prepare(...args);
	race.finaleBlocks = race.blocks.filter((b) => b.zoneId === 'finale');
	return race;
}

function normal(block) {
	const side = block.id.endsWith('--1') ? -1 : 1;
	return { x: -side * Math.sin(block.angle), y: side * Math.cos(block.angle) };
}

test('양쪽 경사와 통로 벽을 가로지르는 큰 보정은 벽 안쪽에 막히고 추가 반발은 없다', () => {
	const race = createRace(['공', '공'], 'keyboard', 47);
	for (const wall of race.finaleBlocks.filter((b) =>
		['finale-guide', 'finale-chute'].includes(b.deviceId)
	)) {
		const n = normal(wall),
			m = race.marbles[0];
		const x = wall.x + n.x * 25,
			y = wall.y + n.y * 25;
		Object.assign(m, {
			x: wall.x - n.x * 100,
			y: wall.y - n.y * 100,
			vx: -n.x * 100,
			vy: -n.y * 100
		});
		assert.equal(constrainFinaleMotion(race, m, x, y), true);
		assert.ok((m.x - wall.x) * n.x + (m.y - wall.y) * n.y >= m.r + wall.h / 2);
		assert.equal(collision(m, wall, 0), null);
		assert.ok(Math.hypot(m.vx, m.vy) < 1e-8);
	}
});

test('1000개 재현에서 왼쪽 벽을 뚫었던 보정 경로를 차단한다', () => {
	const race = createRace(Array(1000).fill('공'), 'keyboard', 47),
		m = race.marbles[112];
	// 이 저장 좌표는 이전30° 벽에서 얻었다. 해당 벽을 복원해 원래 회귀 사례를 보존한다.
	const wallBefore = race.blocks.find((b) => b.id === 'finale-guide--1');
	const mouth = race.layout.finale.mouthY,
		start = mouth - 328 * Math.tan(Math.PI / 6);
	const slope = 328 / (mouth - start),
		ox = 6 / Math.sqrt(1 + slope * slope),
		oy = -ox * slope;
	const x1 = 12 - ox,
		y1 = start + oy,
		x2 = 334,
		y2 = mouth + oy - (6 - ox) / slope;
	Object.assign(wallBefore, {
		x: (x1 + x2) / 2,
		y: (y1 + y2) / 2,
		w: Math.hypot(x2 - x1, y2 - y1) + 12,
		angle: Math.atan2(y2 - y1, x2 - x1)
	});
	race.layout.finale.guideStartY = start;
	Object.assign(m, { x: 25, y: race.layout.finale.start + 233.025349274718, vx: 0, vy: 0 });
	assert.equal(
		constrainFinaleMotion(race, m, 44.7968026556683, race.layout.finale.start + 204.159788002731),
		true
	);
	const wall = race.blocks.find((b) => b.id === 'finale-guide--1'),
		n = normal(wall);
	assert.ok((m.x - wall.x) * n.x + (m.y - wall.y) * n.y >= m.r + wall.h / 2);
});

test('중앙 입구를 거치지 않은 골인은 거부하고 정상 진입과 위쪽 반동을 기록한다', () => {
	const race = createRace(['공', '대기'], 'keyboard', 47);
	race.blocks = [];
	const m = race.marbles[0],
		mouth = race.layout.finale.mouthY;
	Object.assign(m, { x: 360, y: race.layout.finish.y - 1, vx: 0, vy: 400 });
	stepRace(race);
	assert.equal(m.finished, false);
	Object.assign(m, { x: 360, y: mouth - 1, vx: 0, vy: 400 });
	stepRace(race);
	assert.equal(m.chuteEntered, true);
	Object.assign(m, { x: 360, y: mouth + 1, vx: 0, vy: -400 });
	stepRace(race);
	assert.equal(m.chuteEntered, false);
	Object.assign(m, { x: 360, y: mouth - 1, vx: 0, vy: 400 });
	for (let i = 0; i < 180 && !m.finished; i++) stepRace(race);
	assert.equal(m.finished, true);
	assert.equal(race.finished.length, 1);
	assert.equal(createRace(['새 공', '대기']).marbles[0].chuteEntered, undefined);
});

for (const phase of [0, Math.PI / 2, Math.PI, Math.PI * 1.5]) {
	test(`1000개 밀집·회전각${phase}에서35경기초 동안 벽 반대편으로 나가지 않는다`, () => {
		const race = createRace(Array(1000).fill('공'), 'keyboard', 47, { skillsEnabled: true });
		// 전체 구슬을 배치할 빈 진입 공간을 둬 재질 블록 안에서 시작하지 않게 한다.
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
		const walls = race.finaleBlocks
			.filter((b) => ['finale-guide', 'finale-chute'].includes(b.deviceId))
			.map((b) => ({ b, n: normal(b), c: Math.cos(b.angle), s: Math.sin(b.angle) }));
		while (race.time < 35) {
			stepRace(race);
			for (const m of race.marbles) {
				if (m.finished) {
					assert.equal(m.chuteEntered, true);
					continue;
				}
				for (const { b, n, c, s } of walls) {
					const dx = m.x - b.x,
						dy = m.y - b.y,
						along = dx * c + dy * s;
					if (Math.abs(along) < (b.w - b.h) / 2)
						assert.ok(dx * n.x + dy * n.y >= -b.h / 2, `구슬${m.id} 시각${race.time} ${b.id}`);
				}
			}
		}
		assert.ok(race.finished.length > 0);
	});
}
