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

test('특수 구간은 유도 바·핀·특수 블록 순서이며 핀52개를 유지한다', () => {
	const race = createRace(Array(30).fill('공'));
	assert.equal(race.blocks.filter((b) => b.pin).length, 52);
	assert.equal(race.blocks.filter((b) => b.tile).length, 960);
	assert.equal(race.blocks.filter((b) => b.type === 'butter').length, 5);
	assert.equal(race.blocks.filter((b) => b.type === 'pond').length, 3);
	assert.equal(race.blocks.filter((b) => b.connectorId && b.type === 'wall').length, 6);
	for (const section of [...race.layout.connectors, race.layout.finalApproach]) {
		const pins = race.blocks.filter((b) => b.pin && b.connectorId === section.id);
		assert.equal(pins.length, 13);
		assert.ok(pins.every((b) => b.y - b.h / 2 > section.pinStart && b.y + b.h / 2 < section.end));
		const devices = race.blocks.filter((b) => b.special && b.connectorId === section.id);
		assert.ok(
			devices.every((b) => b.y - b.h / 2 > Math.max(...pins.map((pin) => pin.y + pin.h / 2)))
		);
		if (section.specialStart) {
			assert.equal(section.pinStart, section.specialStart + 238);
			assert.equal(section.specialStart - section.start, 260);
			assert.deepEqual([...new Set(pins.map((b) => b.y - section.start))], [556, 606, 656]);
			const guides = race.blocks.filter((b) => b.type === 'wall' && b.connectorId === section.id);
			const bottom = Math.max(
				...guides.map(
					(b) =>
						b.y + (Math.abs(Math.sin(b.angle)) * b.w) / 2 + (Math.abs(Math.cos(b.angle)) * b.h) / 2
				)
			);
			assert.ok(
				Math.min(...pins.map((b) => b.y - b.h / 2)) - bottom > 125,
				'유도 바 아래의 틈을125보다 넓게 유지한다'
			);
			assert.ok(
				devices.every((b) => b.y - b.h / 2 - Math.max(...pins.map((pin) => pin.y + pin.h / 2)) > 26)
			);
			assert.ok(devices.every((b) => b.y + b.h / 2 < section.end));
			if (section.kind === 'butter')
				assert.deepEqual(
					devices.map((b) => b.y - section.start),
					[740, 740, 740, 960, 960]
				);
			if (section.kind === 'pond')
				assert.deepEqual(
					devices.map((b) => b.y - section.start),
					[890, 890, 890]
				);
		}
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
	assert.equal(race.events.at(-1).silent, false);
});

test('유도 바·분산 핀·회전 바는 장치 충돌음을 내고 골인 통로 벽은 무음이다', () => {
	const race = createRace(['가', '나']);
	const devices = race.blocks.filter(
		(b) => b.pin || b.id.includes('-guide-') || b.id === 'finale-bar'
	);
	assert.equal(devices.length, 61);
	assert.ok(devices.every((b) => !b.silent && b.soundType === 'rubber'));
	const chute = race.blocks.filter((b) => b.id.startsWith('chute-'));
	assert.equal(chute.length, 2);
	assert.ok(chute.every((b) => b.silent));
	assert.ok(race.blocks.filter((b) => b.special || b.tile).every((b) => !b.silent));
});

test('좌·중앙·우 연못3개는 감속·진입음을 내고 두 우회로는 이를 피한다', () => {
	for (const seed of [1, 7, 47]) {
		const r = createRace(Array(5).fill('구슬'), 'keyboard', seed);
		const section = r.layout.connectors.find((c) => c.kind === 'pond');
		const ponds = r.blocks.filter((b) => b.type === 'pond');
		assert.deepEqual(
			ponds.map((b) => b.x),
			[88, 360, 632]
		);
		assert.equal(new Set(ponds.map((b) => b.deviceId)).size, 3);
		assert.ok(ponds.every((b) => b.w === 152 && b.h === 140 && b.y === ponds[0].y));
		for (const [i, gap] of section.bypasses.entries()) {
			assert.equal(gap.left, ponds[i].x + ponds[i].w / 2);
			assert.equal(gap.right, ponds[i + 1].x - ponds[i + 1].w / 2);
			assert.equal(gap.right - gap.left, 120);
		}
		r.blocks = ponds;
		const xs = [
			...ponds.map((b) => b.x),
			...section.bypasses.map((gap) => (gap.left + gap.right) / 2)
		];
		r.marbles.forEach((m, i) => Object.assign(m, { x: xs[i], y: ponds[0].y - 90, vx: 0, vy: 300 }));
		const events = [];
		for (let i = 0; i < 120; i++) events.push(...stepRace(r));
		for (const [i, pond] of ponds.entries()) {
			assert.ok(r.marbles[i].specialContacts.has(pond.id));
			assert.equal(events.filter((e) => e.type === 'pond' && e.blockId === pond.id).length, 1);
		}
		for (const m of r.marbles.slice(3)) {
			assert.ok(m.y > ponds[0].y + 83);
			assert.ok(m.vy > r.marbles[0].vy);
			assert.equal(m.specialContacts.size, 0);
		}
		for (let i = 0; i < 360; i++) events.push(...stepRace(r));
		assert.ok(r.marbles.every((m) => m.y > ponds[0].y + 83));
		assert.equal(events.filter((e) => e.type === 'pond').length, 3);
	}
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

test('0.25배속은 같은 물리 간격으로 실제1초에 경기0.25초를 진행한다', () => {
	assert.equal(FINALE_SPEED, 0.25);
	const clock = createRaceClock();
	let count = 0;
	for (let i = 0; i < 60; i++) clock.advance(1 / 60, FINALE_SPEED, () => count++);
	assert.equal(count, 30);
});

test('실제30개 경기에서 연못과 우회로가 모두 사용된다', () => {
	const race = createRace(Array(30).fill('공'), 'keyboard', 47);
	while (race.time < 120 && race.marbles.some((m) => !m.scatterPassages.get('connector-2')?.exit))
		stepRace(race);
	assert.ok(race.marbles.every((m) => m.scatterPassages.get('connector-2')?.exit));
	const wet = race.marbles.filter((m) =>
		m.scatterPassages
			.get('connector-2')
			.contacts.some((c) => c.blockId.startsWith('connector-2-pond-'))
	).length;
	assert.ok(wet > 0 && wet < 30, `연못 ${wet}개, 우회 ${30 - wet}개`);
});
