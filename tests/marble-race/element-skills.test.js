import test from 'node:test';
import assert from 'node:assert/strict';
import {
	createSkills,
	fireLightning,
	fireGust,
	applyGusts,
	updateSkills,
	GUST_SPEED,
	SKILL_COOLDOWN
} from '../../src/lib/marble-race/skills.js';
import { createRace, stepRace, makeBlock, STEP } from '../../src/lib/marble-race/physics.js';
import {
	createSnapshotEncoder,
	createSnapshotDecoder
} from '../../src/lib/marble-race/transport.js';
const marble = (id, x, y = 600) => ({
	id,
	x,
	y,
	r: 13,
	vx: 30,
	vy: 100,
	held: null,
	finished: false
});

test('번개는 가까운 상대를 고르고 세로 경로와 공의 반지름으로 피격을 판정한다', () => {
	const skills = createSkills(47, true);
	const source = marble(0, 360);
	const target = marble(1, 410);
	const edge = marble(2, 439, 300);
	const outside = marble(3, 439.01, 300);
	const below = marble(4, 410, 614);
	const held = { ...marble(5, 410, 400), held: { kind: 'frost', until: 10 } };
	const finished = { ...marble(6, 410, 450), finished: true };
	const marbles = [source, target, edge, outside, below, held, finished];
	const positions = marbles.map((m) => [m.x, m.y]);
	const wave = fireLightning(skills, source, marbles, 2);
	assert.equal(wave.targetId, 1);
	for (const m of [target, edge]) {
		assert.equal(m.held.kind, 'lightning');
		assert.equal(m.held.until, 4);
		assert.equal(m.vx, 0);
		assert.equal(m.vy, 0);
	}
	for (const m of [source, outside, below, finished]) assert.equal(m.held, null);
	assert.equal(held.held.kind, 'frost');
	assert.deepEqual(
		marbles.map((m) => [m.x, m.y]),
		positions
	);
	assert.equal(skills.cooldowns.get(source.id), 2 + SKILL_COOLDOWN);
});

test('근처 상대가 없으면 전체 상대 중 무작위로 고르며 같은 난수로 재현한다', () => {
	const choices = new Set();
	for (let seed = 0; seed < 24; seed++) {
		const a = createSkills(seed, true),
			b = createSkills(seed, true);
		const source = marble(0, 30, 200);
		const others = [
			source,
			marble(1, 400, 1000),
			marble(2, 600, 3000),
			{ ...marble(3, 350, 900), finished: true },
			{ ...marble(4, 300, 800), held: { until: 10 } }
		];
		const copy = structuredClone(others);
		const first = fireLightning(a, source, others, 2);
		const second = fireLightning(b, copy[0], copy, 2);
		assert.deepEqual(first, second);
		assert.ok([1, 2].includes(first.targetId));
		choices.add(first.targetId);
	}
	assert.deepEqual(choices, new Set([1, 2]));
});

test('경기 전체에 유효한 상대가 없으면 번개와 대기 시간을 만들지 않는다', () => {
	const skills = createSkills(1, true),
		source = marble(0, 360);
	assert.equal(
		fireLightning(
			skills,
			source,
			[source, { ...marble(1, 370), finished: true }, { ...marble(2, 390), held: { until: 9 } }],
			2
		),
		null
	);
	assert.equal(skills.serial, 0);
	assert.equal(skills.cooldowns.size, 0);
});

test('번개 고정은 충돌과 정체 바람에도2초간 움직이지 않고 해제 뒤 중력으로 떨어진다', () => {
	const race = createRace(['시전자', '대상', '충돌 상대']);
	race.blocks = [];
	race.time = 10;
	const [source, target, collision] = race.marbles;
	Object.assign(source, { x: 220, y: 1000 });
	Object.assign(target, { x: 360, y: 1000, vx: 300, vy: 300, lastProgress: 0 });
	Object.assign(collision, { x: 500, y: 1010, vx: -500, vy: 0 });
	fireLightning(race.skills, source, race.marbles, race.time);
	source.finished = true;
	for (let i = 0; i < 239; i++) {
		stepRace(race);
		assert.deepEqual([target.x, target.y, target.vx, target.vy], [360, 1000, 0, 0]);
	}
	for (let i = 0; i < 8; i++) stepRace(race);
	assert.equal(target.held, null);
	assert.ok(target.y > 1000);
	assert.ok(target.vy > 0);
	assert.equal(target.windUntil, 0);
});

test('바람은 시전 위치에 남고 다른 공만 한 번 올리며 나중에 들어온 공도 올린다', () => {
	const skills = createSkills(1, true),
		source = marble(0, 360);
	const target = marble(1, 390, 550),
		late = marble(2, 500, 550);
	const held = { ...marble(3, 340, 550), held: { kind: 'frost', until: 9 } };
	const finished = { ...marble(4, 340, 550), finished: true };
	const below = marble(5, 360, 650);
	const marbles = [source, target, late, held, finished, below];
	const wave = fireGust(skills, source, marbles, 2);
	assert.equal(target.vy, -GUST_SPEED);
	for (const m of [source, late, held, finished, below]) assert.equal(m.vy, 100);
	source.x = 650;
	target.vy = -120;
	late.x = 400;
	applyGusts(skills, marbles, 2.5);
	assert.equal(wave.x, 360);
	assert.equal(target.vy, -120);
	assert.equal(late.vy, -GUST_SPEED);
	target.x = 600;
	applyGusts(skills, marbles, 2.6);
	target.x = 390;
	applyGusts(skills, marbles, 2.7);
	assert.equal(target.vy, -120);
	const expiredTarget = marble(6, 350, 550);
	applyGusts(skills, [expiredTarget], 3);
	assert.equal(expiredTarget.vy, 100);
	updateSkills(skills, [], 3, STEP);
	assert.equal(skills.gustHits.size, 0);
});

test('바람으로 솟아오른 공은 얇은 천장과 충돌하며 순간이동하지 않는다', () => {
	const race = createRace(['가', '나']);
	const ceiling = makeBlock('wall', 360, 920, { w: 500, h: 10, cornerRadius: 0 });
	race.blocks = [ceiling];
	const [source, target] = race.marbles;
	Object.assign(source, { x: 310, y: 1100 });
	Object.assign(target, { x: 360, y: 1000, vx: 0, vy: 0 });
	fireGust(race.skills, source, race.marbles, race.time);
	source.finished = true;
	let bounced = false;
	for (let i = 0; i < 90; i++) {
		stepRace(race);
		assert.ok(target.y - target.r >= 925 - 0.001);
		if (target.vy > 0) bounced = true;
	}
	assert.ok(bounced);
});

test('번개·바람과 고정 상태를 전달하고 만료·새 경기에서 제거한다', () => {
	const race = createRace(['가', '나'], 'keyboard', 47, { skillsEnabled: true });
	race.blocks = [];
	Object.assign(race.marbles[0], { x: 200, y: 600 });
	Object.assign(race.marbles[1], { x: 360, y: 600 });
	const encode = createSnapshotEncoder(),
		decode = createSnapshotDecoder();
	decode(structuredClone(encode(race, [], null, true)));
	fireGust(race.skills, race.marbles[0], race.marbles, 0);
	fireLightning(race.skills, race.marbles[0], race.marbles, 0);
	const state = decode(structuredClone(encode(race)));
	assert.deepEqual(
		state.skillWaves.map((w) => w.type),
		['gust', 'lightning']
	);
	assert.equal(state.marbles[1].held.kind, 'lightning');
	race.skills.enabled = false;
	updateSkills(race.skills, race.marbles, 1, STEP);
	assert.equal(decode(structuredClone(encode(race))).skillWaves.length, 0);
	assert.equal(race.skills.gustHits.size, 0);
	const reset = decode(structuredClone(encode(createRace(['다', '라']), [], null, true)));
	assert.deepEqual(reset.skillWaves, []);
	assert.ok(reset.marbles.every((m) => m.held === null));
});

test('확률 발동은3종을 모두 사용하고 효과음 이벤트는 발동마다 한 번이다', () => {
	const race = createRace(Array(60).fill('가'), 'keyboard', 47, { skillsEnabled: true });
	const events = [];
	for (let i = 0; i < 120 * 30; i++)
		events.push(...stepRace(race).filter((e) => e.kind === 'skill'));
	assert.deepEqual(new Set(events.map((e) => e.type)), new Set(['pulse', 'lightning', 'gust']));
	assert.equal(events.length, race.skills.serial);
	assert.equal(new Set(events.map((e) => e.deviceId)).size, events.length);
});
