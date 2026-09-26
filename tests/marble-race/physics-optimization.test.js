import test from 'node:test';
import assert from 'node:assert/strict';
import {
	createRace,
	stepRace,
	createSpatialIndex,
	nearbyBlocks,
	makeBlock,
	collision
} from '../../src/lib/marble-race/physics.js';

// 200개 이상의 출발 이동 분할 변경은 사용자가 승인했다.
// 과거 경로 대신 같은 환경에서 캐시 없는 계산과 모든 단계의 상태·이벤트를 비교한다.
// 겹침·벽 통과·배속 재현성은 별도의 안전 검사로 확인한다.
function sampleRace(phase) {
	const race = createRace(Array(1000).fill('공'), 'keyboard', 47, { skillsEnabled: true });
	if (phase === 'finale') race.blocks = race.blocks.filter((b) => b.zoneId === 'finale');
	if (phase !== 'start')
		race.marbles.forEach((m, i) =>
			Object.assign(m, {
				x: 40 + (i % 20) * 33,
				y:
					(phase === 'finale' ? race.layout.finale.start : race.layout.connectors[1].specialStart) -
					30 -
					Math.floor(i / 20) * 30,
				vx: 0,
				vy: 150
			})
		);
	return race;
}
function state(race) {
	return {
		time: race.time,
		marbles: race.marbles,
		blocks: race.blocks,
		finished: race.finished.map((m) => m.id),
		skills: race.skills
	};
}
for (const phase of ['start', 'dense', 'finale']) {
	test(`1000개 ${phase}의720단계 상태·스킬·이벤트는 캐시 없는 계산과 정확히 같다`, () => {
		const reused = sampleRace(phase);
		let fresh = sampleRace(phase);
		for (let i = 0; i < 720; i++) {
			// Map·Set과 객체 간 참조를 보존한다. 새 객체에는 WeakMap 캐시가 없다.
			fresh = structuredClone(fresh);
			delete fresh.spatial;
			stepRace(reused);
			stepRace(fresh);
			assert.deepEqual(state(reused), state(fresh), `${i + 1}번째 물리 단계`);
			assert.deepEqual(reused.events, fresh.events, `${i + 1}번째 단계의 이벤트`);
			assert.deepEqual(reused.finaleRotorContacts, fresh.finaleRotorContacts);
		}
		if (phase === 'finale') assert.ok(reused.marbles.some((m) => m.finaleEntry != null));
	});
}

test('결승 진입 전에도199개는 이동 상한4,200개부터는8을 적용한다', () => {
	for (const [count, divisions] of [
		[199, 2],
		[200, 1],
		[1000, 1]
	]) {
		const race = createRace(Array(count).fill('공'), 'keyboard', 47);
		const marble = race.marbles[0];
		race.marbles.slice(1).forEach((m) => {
			m.finished = true;
		});
		race.blocks = [];
		Object.assign(marble, { x: 360, y: 100, vx: 0, vy: 0 });
		stepRace(race);
		const h = 1 / 120 / divisions;
		const distance = (420 * h * h * divisions * (divisions + 1)) / 2;
		assert.ok(Math.abs(marble.y - 100 - distance) < 1e-10, `${count}개의 이동 거리`);
		assert.equal(marble.finaleEntry, null);
	}
});

test('여러 격자에 걸친 블록은 한 번만 반환하고 다음 조회가 이전 결과를 덮어쓰지 않는다', () => {
	const blocks = [makeBlock('wall', 0, -60, { w: 160 }), makeBlock('wall', 60, 0, { w: 160 })];
	const index = createSpatialIndex(blocks);
	const first = nearbyBlocks(index, { x: 0, y: 0, r: 50 });
	assert.deepEqual(first, blocks);
	assert.deepEqual(nearbyBlocks(index, { x: 1000, y: 1000, r: 13 }), []);
	assert.deepEqual(first, blocks);
	assert.deepEqual(nearbyBlocks(index, { x: 0, y: 0, r: 50 }), blocks);
});

test('축에 평행한 블록의 빠른 제외는 경계·회전·크기 변경에서 정밀 충돌과 같다', () => {
	for (const type of ['wall', 'rubber', 'butter', 'rotor', 'seesaw']) {
		const block = makeBlock(type, 360, 300, { w: 32, h: 32, cornerRadius: 10 });
		for (const angle of [0, Math.PI / 4, Math.PI / 2]) {
			Object.assign(block, { angle, tilt: angle, phase: angle });
			for (const height of [32, 12.5]) {
				block.h = height;
				const corner = Math.min(block.cornerRadius, block.w / 2, block.h / 2);
				const geometry = {
					c: Math.cos(angle),
					s: Math.sin(angle),
					corner,
					halfW: block.w / 2 - corner,
					halfH: block.h / 2 - corner
				};
				for (const dx of [-40, -29 - 1e-10, -29, -28.999, 0, 28.999, 29, 29 + 1e-10, 40])
					for (const dy of [-40, -29, -10, 0, 10, 29, 40]) {
						const marble = { x: block.x + dx, y: block.y + dy, r: 13 };
						assert.deepEqual(collision(marble, block, 0), collision(marble, block, 0, geometry));
					}
			}
		}
	}
});

test('주변 블록이 없는 빠른 경로에서도 경기장 벽을 통과하지 않는다', () => {
	const race = createRace(['왼쪽', '오른쪽'], 'keyboard', 47);
	race.blocks = [];
	Object.assign(race.marbles[0], { x: 25, y: 100, vx: -600, vy: 0 });
	Object.assign(race.marbles[1], { x: 695, y: 100, vx: 600, vy: 0 });
	stepRace(race);
	assert.ok(race.marbles[0].x >= 25);
	assert.ok(race.marbles[0].vx > 0);
	assert.ok(race.marbles[1].x <= 695);
	assert.ok(race.marbles[1].vx < 0);
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

test('200개 경기의 출발·결승 계산 중 빠른 구슬은 얇은 장애물을 통과하지 않는다', () => {
	for (const finale of [false, true])
		for (const speed of [-650, 900]) {
			const race = createRace(Array(200).fill('공'), 'keyboard', 47);
			const marble = race.marbles[0];
			// 다른 구슬의 결승 진입으로 큰 경기의 내부 이동 분할을 사용한다.
			if (finale)
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
