import test from 'node:test';
import assert from 'node:assert/strict';
import {
	createRace,
	collision,
	hitBlock,
	stepRace,
	butterHitCount
} from '../../src/lib/marble-race/physics.js';
import { createRaceClock } from '../../src/lib/marble-race/clock.js';
import { FINALE_SPEED } from '../../src/lib/marble-race/director.js';

test('기존 특수 장치를 보존하고 늘린 구간과 깔때기 앞에 핀52개를 배치한다', () => {
	const race = createRace(Array(30).fill('공'));
	assert.equal(race.blocks.filter((b) => b.pin).length, 52);
	assert.equal(race.blocks.filter((b) => b.tile).length, 960);
	assert.equal(race.blocks.filter((b) => b.type === 'butter').length, 5);
	assert.equal(race.blocks.filter((b) => b.type === 'pond').length, 1);
	assert.equal(race.blocks.filter((b) => b.connectorId && b.type === 'wall').length, 6);
	for (const section of [...race.layout.connectors, race.layout.finalApproach]) {
		const pins = race.blocks.filter((b) => b.pin && b.connectorId === section.id);
		assert.equal(pins.length, 13);
		assert.ok(pins.every((b) => b.y - b.h / 2 > section.pinStart && b.y + b.h / 2 < section.end));
		const devices = race.blocks.filter((b) => b.special && b.connectorId === section.id);
		assert.ok(devices.every((b) => b.y + b.h / 2 < section.pinStart));
		for (let i = 0; i < pins.length; i++)
			for (let j = 0; j < i; j++)
				assert.ok(Math.hypot(pins[i].x - pins[j].x, pins[i].y - pins[j].y) - 32 > 26);
	}
	assert.equal(race.layout.finale.start, race.layout.finalApproach.end);
	assert.equal(race.layout.finish.y - race.layout.finale.mouthY, 310);
	const pin = race.blocks.find((b) => b.pin),
		m = race.marbles[0];
	Object.assign(m, { x: pin.x + 12, y: pin.y - 24, vx: 0, vy: 200 });
	hitBlock(race, m, pin, collision(m, pin, 0));
	assert.ok(m.vx > 0, '핀의 둥근 면이 구슬을 옆으로 튕긴다');
	assert.equal(pin.alive, true);
});

test('젤리 우회로는 실제로 저항과 진입음을 피하며 양쪽 배치가 나온다', () => {
	const sides = new Set();
	for (const seed of [1, 7, 3, 5, 17, 47]) {
		const r = createRace(['가', '나'], 'keyboard', seed);
		const section = r.layout.connectors.find((c) => c.kind === 'pond');
		const pond = r.blocks.find((b) => b.type === 'pond');
		sides.add(section.bypass.left);
		r.blocks = [pond];
		Object.assign(r.marbles[0], { x: pond.x, y: pond.y - 90, vx: 0, vy: 300 });
		Object.assign(r.marbles[1], {
			x: (section.bypass.left + section.bypass.right) / 2,
			y: pond.y - 90,
			vx: 0,
			vy: 300
		});
		const events = [];
		for (let i = 0; i < 120; i++) events.push(...stepRace(r));
		assert.ok(r.marbles[1].y > pond.y + pond.h / 2 + 13);
		assert.ok(r.marbles[1].vy > r.marbles[0].vy);
		assert.ok(r.marbles[0].specialContacts.has(pond.id));
		assert.ok(!r.marbles[1].specialContacts.has(pond.id));
		assert.equal(events.filter((e) => e.type === 'pond').length, 1);
	}
	assert.equal(sides.size, 2);
});

test('참가 구슬 수에 맞춰 버터 파괴 횟수와 복구 후 내구도를 유지한다', () => {
	for (const [count, hits] of [
		[2, 1],
		[30, 5],
		[60, 7],
		[1000, 29]
	]) {
		assert.equal(butterHitCount(count), hits);
		const r = createRace(Array(count).fill('공'));
		const b = r.blocks.find((b) => b.type === 'butter');
		r.blocks = [b];
		r.marbles.slice(1).forEach((m) => (m.finished = true));
		const m = r.marbles[0];
		for (let i = 0; i < hits; i++) {
			m.specialContacts.clear();
			Object.assign(m, { x: b.x, y: b.y - b.h / 2 - 12, vx: 0, vy: 200 });
			const hit = collision(m, b, r.time);
			hitBlock(r, m, b, hit);
			const hp = b.hp;
			hitBlock(r, m, b, hit);
			assert.equal(b.hp, hp);
			assert.equal(b.hp, hits - i - 1);
		}
		assert.equal(b.alive, false);
		m.x = 30;
		r.time = 3;
		stepRace(r);
		assert.equal(b.alive, true);
		assert.equal(b.hp, hits);
		assert.equal(b.h, 64);
	}
});

test('0.3배속은 같은 물리 간격으로 실제1초에 경기0.3초를 진행한다', () => {
	assert.equal(FINALE_SPEED, 0.3);
	const clock = createRaceClock();
	let count = 0;
	for (let i = 0; i < 60; i++) clock.advance(1 / 60, FINALE_SPEED, () => count++);
	assert.equal(count, 36);
});

test('실제30개 경기에서 연못과 우회로가 모두 사용된다', () => {
	const race = createRace(Array(30).fill('공'), 'keyboard', 47);
	while (race.time < 120 && race.marbles.some((m) => !m.scatterPassages.get('connector-2')?.exit))
		stepRace(race);
	assert.ok(race.marbles.every((m) => m.scatterPassages.get('connector-2')?.exit));
	const wet = race.marbles.filter((m) =>
		m.scatterPassages.get('connector-2').contacts.some((c) => c.blockId === 'connector-2-pond')
	).length;
	assert.ok(wet > 0 && wet < 30, `연못 ${wet}개, 우회 ${30 - wet}개`);
});
