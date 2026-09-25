import test from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import {
	createRace,
	stepRace,
	createSpatialIndex,
	nearbyBlocks,
	makeBlock,
	collision
} from '../../src/lib/marble-race/physics.js';

// 2026-09-24 사용자 요청의100개 블록 상한과40°/30° 경사·x160/높이+480 회전축 기준이다.
// 1000개 일반층이69줄에서22줄로 바뀌어 높이·블록·난수 소비와 궤적도 달라진다.
// 2026-09-25에는 사용자 요청에 따라 바 길이448을 적용했다.440 재현으로 기존 해시도 확인했다.
// 매 단계 이벤트와 매 경기초 전체 상태를 기록해 이후 의도하지 않은 변경을 잡는다.
// 겹침·벽 통과·배속 재현성은 별도의 안전 검사로 확인한다.
// 실제 벽 통과 여부는 finale-boundary.test.js에서 별도로 검증한다.
const references = {
	start: 'f8d631ec0a76e066cd5fca3dbb19511e3346c3757a774e3dd2ab5a58ded80328',
	dense: 'c87e5d5d40def1294586e9a776ef5bc4e4aff794e56f54e24ae1eb1873c671ac',
	finale: '5ecbb0b07c2e2b414ab4c6efda70b421bbb618aed594b9b778a0803c43269738'
};
for (const [phase, reference] of Object.entries(references)) {
	test(`1000개 ${phase}의6경기초 상태·스킬·이벤트는 기록한 기준과 같다`, () => {
		const race = createRace(Array(1000).fill('공'), 'keyboard', 47, { skillsEnabled: true });
		if (phase === 'finale') race.blocks = race.blocks.filter((b) => b.zoneId === 'finale');
		if (phase !== 'start')
			race.marbles.forEach((m, i) =>
				Object.assign(m, {
					x: 40 + (i % 20) * 33,
					y:
						(phase === 'finale'
							? race.layout.finale.start
							: race.layout.connectors[1].specialStart) -
						30 -
						Math.floor(i / 20) * 30,
					vx: 0,
					vy: 150
				})
			);
		const hash = createHash('sha256');
		for (let i = 0; i < 720; i++) {
			stepRace(race);
			hash.update(JSON.stringify(race.events));
			if (i % 120 === 119)
				hash.update(
					JSON.stringify(
						{
							time: race.time,
							marbles: race.marbles,
							blocks: race.blocks,
							finished: race.finished.map((m) => m.id),
							skills: race.skills
						},
						(key, value) => (value instanceof Map || value instanceof Set ? [...value] : value)
					)
				);
		}
		assert.equal(hash.digest('hex'), reference);
	});
}

test('여러 격자에 걸친 블록은 한 번만 반환하고 다음 조회가 이전 결과를 덮어쓰지 않는다', () => {
	const blocks = [makeBlock('wall', 0, -60, { w: 160 }), makeBlock('wall', 60, 0, { w: 160 })];
	const index = createSpatialIndex(blocks);
	const first = nearbyBlocks(index, { x: 0, y: 0, r: 50 });
	assert.deepEqual(first, blocks);
	assert.deepEqual(nearbyBlocks(index, { x: 1000, y: 1000, r: 13 }), []);
	assert.deepEqual(first, blocks);
	assert.deepEqual(nearbyBlocks(index, { x: 0, y: 0, r: 50 }), blocks);
});

test('충돌 모양 재사용 중에도 회전·크기·둥근 모서리 변경을 즉시 반영한다', () => {
	const block = makeBlock('wall', 360, 300, { w: 100, h: 12 });
	const probe = { x: 400, y: 300, r: 2 };
	assert.ok(collision(probe, block, 0));
	block.angle = Math.PI / 2;
	assert.equal(collision(probe, block, 0), null);
	Object.assign(block, { angle: 0, w: 20 });
	assert.equal(collision(probe, block, 0), null);
	Object.assign(block, { w: 100, h: 100 });
	Object.assign(probe, { x: 409, y: 349 });
	assert.ok(collision(probe, block, 0));
	block.cornerRadius = 50;
	assert.equal(collision(probe, block, 0), null);
	Object.assign(block, {
		type: 'rotor',
		w: 100,
		h: 12,
		cornerRadius: 0,
		angularSpeed: Math.PI / 2
	});
	Object.assign(probe, { x: 400, y: 300 });
	assert.ok(collision(probe, block, 0));
	assert.equal(collision(probe, block, 1), null);
});

test('주변 블록 재사용은 이동한 격자·죽은 블록·새 경기 블록을 구분한다', () => {
	const race = createRace(['공', '대기'], 'keyboard', 47);
	const marble = race.marbles[0];
	race.marbles[1].finished = true;
	const first = makeBlock('wall', 360, 300);
	const second = makeBlock('wall', 360, 600);
	race.blocks = [first, second];
	const drop = (y) => {
		Object.assign(marble, { x: 360, y, vx: 0, vy: 170 });
		stepRace(race);
		return marble.vy;
	};
	assert.ok(drop(277) < 0);
	assert.ok(drop(577) < 0);
	second.alive = false;
	assert.ok(drop(577) > 0);
	race.blocks = [makeBlock('wall', 360, 600)];
	assert.ok(drop(577) < 0);
});

test('200개 경기의 결승 계산 중에도 빠르게 움직이는 구슬은 얇은 장애물을 통과하지 않는다', () => {
	for (const speed of [-650, 900]) {
		const race = createRace(Array(200).fill('공'), 'keyboard', 47);
		const marble = race.marbles[0];
		// 다른 구슬의 결승 진입으로 큰 경기의 내부 이동 분할을 사용한다.
		Object.assign(race.marbles[1], { x: 60, y: race.layout.finale.start + 50, vx: 0, vy: 0 });
		const wall = makeBlock('wall', 360, 500, { w: 120, h: 2 });
		race.blocks = [wall];
		Object.assign(marble, {
			x: 360,
			y: 500 - Math.sign(speed) * 30,
			vx: 0,
			vy: speed,
			pulseBoostUntil: 1
		});
		let bounced = false;
		for (let step = 0; step < 12; step++) {
			stepRace(race);
			assert.ok((marble.y - wall.y) * Math.sign(speed) <= -marble.r - wall.h / 2 + 0.01);
			bounced ||= marble.vy * speed < 0;
		}
		assert.ok(bounced);
	}
});
