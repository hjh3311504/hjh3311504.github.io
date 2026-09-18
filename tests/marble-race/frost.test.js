import test from 'node:test';
import assert from 'node:assert/strict';
import {
	createRace,
	collision,
	hitBlock,
	stepRace,
	STEP
} from '../../src/lib/marble-race/physics.js';
import { MAPS, SPECIAL_TYPES, resolveMap } from '../../src/lib/marble-race/catalog.js';
import { SOUND_FILES } from '../../src/lib/marble-race/audio.js';

function setup(direction = 1) {
	const race = createRace(['가', '나']);
	const block = race.blocks.find((b) => b.type === 'frost');
	block.angle = (direction * Math.PI) / 6;
	race.blocks = [block];
	race.marbles[1].finished = true;
	const marble = race.marbles[0];
	const normal = { x: Math.sin(block.angle), y: -Math.cos(block.angle) };
	Object.assign(marble, {
		x: block.x + normal.x * 26,
		y: block.y + normal.y * 26,
		vx: 0,
		vy: 200,
		bestY: block.y,
		lastProgress: 0
	});
	hitBlock(race, marble, block, collision(marble, block, race.time));
	return { race, block, marble };
}

test('첫 특수 구간에만 대각선 얼음판5개를 추가하고 핀·일반층·다른 장치는 유지한다', () => {
	for (const map of [...MAPS, { id: 'custom-test', layers: ['wood', 'wood', 'wood', 'wood'] }]) {
		const race = createRace(Array(30).fill('공'), map);
		const section = race.layout.connectors[0];
		const ice = race.blocks.filter((b) => b.type === 'frost');
		const pinBottom = Math.max(
			...race.blocks.filter((b) => b.connectorId === section.id && b.pin).map((b) => b.y + 16)
		);
		assert.equal(section.kind, 'frost');
		assert.equal(ice.length, 5);
		for (const block of ice) {
			assert.equal(block.connectorId, section.id);
			assert.equal(Math.abs(block.angle), Math.PI / 6);
			if (block.x !== 360) {
				assert.ok((360 - block.x) * Math.sin(block.angle) > 0, '낮은 끝은 중앙을 향한다');
			}
			const halfHeight =
				(Math.abs(Math.sin(block.angle)) * block.w + Math.cos(block.angle) * block.h) / 2;
			assert.ok(block.y - halfHeight > pinBottom + 26);
			assert.ok(block.y + halfHeight + 26 < section.end);
		}
		assert.equal(race.blocks.filter((b) => b.tile).length, 960);
		assert.equal(race.blocks.filter((b) => b.pin).length, 52);
		assert.equal(race.blocks.filter((b) => b.type === 'butter').length, 5);
		assert.equal(race.blocks.filter((b) => b.type === 'pond').length, 3);
		assert.ok(resolveMap(map).types.includes('frost'));
	}
	assert.ok(SPECIAL_TYPES.includes('frost'));
	assert.deepEqual(SOUND_FILES.frost, ['/audio/marble-race/frost-freeze-v1.wav']);
});

test('양방향 얼음판은1초 고정 후 표면을 통과하지 않고 중력으로 내려가며 접촉음은 한 번이다', () => {
	for (const direction of [-1, 1]) {
		const { race, block, marble } = setup(direction);
		const anchor = { x: marble.x, y: marble.y };
		assert.equal(marble.held.kind, 'frost');
		assert.equal(marble.held.until, 1);
		assert.equal(collision(marble, block, 0), null);
		const events = [...race.events];
		for (let i = 0; i < 119; i++) events.push(...stepRace(race));
		assert.deepEqual({ x: marble.x, y: marble.y }, anchor);
		assert.equal(marble.vx, 0);
		assert.equal(marble.vy, 0);
		for (let i = 0; i < 600; i++) {
			events.push(...stepRace(race));
			assert.equal(
				collision(marble, block, race.time),
				null,
				'해제 뒤에도 얼음 표면을 관통하지 않는다'
			);
		}
		assert.equal(marble.held, null);
		assert.ok((marble.x - anchor.x) * direction > 50);
		assert.ok(marble.y > block.y + 150);
		assert.equal(events.filter((e) => e.type === 'frost').length, 1);
		assert.equal(block.alive, true);
		assert.equal(race.respawnQueue.length, 0);
		assert.equal(
			race.events.some((e) => e.broken),
			false
		);
	}
});

test('떨어졌다가 다시 닿으면 다시 얼고 새 경기에는 동결 상태가 남지 않는다', () => {
	const { race, block, marble } = setup();
	for (let i = 0; i < 600; i++) stepRace(race);
	assert.ok(!marble.specialContacts.has(block.id));
	Object.assign(marble, { x: block.x + 13, y: block.y - Math.sqrt(3) * 13, vx: 0, vy: 200 });
	hitBlock(race, marble, block, collision(marble, block, race.time));
	assert.equal(marble.held.until, race.time + 1);
	assert.ok(createRace(['가', '나']).marbles.every((m) => m.held === null));
	const before = { ...marble.held };
	hitBlock(race, marble, block, collision(marble, block, race.time), 0);
	assert.deepEqual(marble.held, before);
});

test('2·30·60개 구슬이 핀과 얼음판을 통과하고 얼어붙은 구슬끼리 겹치지 않는다', () => {
	for (const count of [2, 30, 60]) {
		const race = createRace(Array(count).fill('공'), 'keyboard', 47);
		const section = race.layout.connectors[0];
		race.blocks = race.blocks.filter((b) => b.connectorId === section.id);
		race.marbles.forEach((m, i) =>
			Object.assign(m, {
				x: 40 + (i % 20) * 33,
				y: section.start + 30 - Math.floor(i / 20) * 40,
				vx: 0,
				vy: 200,
				bestY: section.start,
				lastProgress: 0
			})
		);
		let frozen = 0;
		while (race.time < 20 && race.marbles.some((m) => m.y < section.end)) {
			stepRace(race, STEP);
			const held = race.marbles.filter((m) => m.held);
			frozen += held.length;
			for (let i = 0; i < held.length; i++)
				for (let j = 0; j < i; j++)
					assert.ok(Math.hypot(held[i].x - held[j].x, held[i].y - held[j].y) >= 26 - 0.01);
		}
		assert.ok(frozen > 0);
		assert.ok(
			race.marbles.every((m) => m.y >= section.end),
			`${count}개 중 구간에 남은 구슬이 있다`
		);
	}
});
