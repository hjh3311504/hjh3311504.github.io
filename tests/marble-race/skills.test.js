import test from 'node:test';
import assert from 'node:assert/strict';
import {
	createSkills,
	firePulse,
	updateSkills,
	PULSE_RADIUS,
	SKILL_COOLDOWN
} from '../../src/lib/marble-race/skills.js';
import { createRace, stepRace, makeBlock, STEP } from '../../src/lib/marble-race/physics.js';
import { createRaceClock } from '../../src/lib/marble-race/clock.js';
import {
	createSnapshotEncoder,
	createSnapshotDecoder
} from '../../src/lib/marble-race/transport.js';

const marble = (id, x = 360, y = 100) => ({
	id,
	x,
	y,
	vx: 0,
	vy: 0,
	finished: false,
	held: null,
	color: '#369'
});

test('파동은 범위 안 구슬만 바깥으로 밀고 위치·발사자·동결·도착 상태는 유지한다', () => {
	const skills = createSkills(47, true);
	const source = marble(0);
	const marbles = [
		source,
		marble(1, 390),
		marble(2, 330),
		marble(3, 360, 130),
		marble(4, 360, 70),
		marble(5, 360 + PULSE_RADIUS),
		{ ...marble(6, 370), finished: true },
		{ ...marble(7, 370), held: { until: 10 } },
		marble(8, 450)
	];
	const positions = marbles.map((m) => [m.x, m.y]);
	firePulse(skills, source, marbles, 2);
	assert.deepEqual(
		marbles.map((m) => [m.x, m.y]),
		positions
	);
	assert.ok(marbles[1].vx > 0 && marbles[2].vx < 0 && marbles[3].vy > 0 && marbles[4].vy < 0);
	assert.ok(marbles[1].vx > marbles[8].vx);
	for (const i of [0, 5, 6, 7]) assert.equal(Math.hypot(marbles[i].vx, marbles[i].vy), 0);
	assert.equal(skills.waves.length, 1);
	assert.equal(skills.cooldowns.get(0), 2 + SKILL_COOLDOWN);
});

test('확률 발동은 난수로 재현하고 구슬별8초 대기와 OFF를 지킨다', () => {
	const a = createSkills(47, true),
		b = createSkills(47, true);
	const marbles = Array.from({ length: 30 }, (_, i) => marble(i, i * 150));
	const copy = structuredClone(marbles);
	const last = new Map();
	let serial = 0;
	for (let i = 0; i < 120 * 60; i++) {
		updateSkills(a, marbles, i * STEP, STEP);
		updateSkills(b, copy, i * STEP, STEP);
		for (const wave of a.waves.filter((w) => w.id > serial)) {
			assert.ok(wave.time >= 2);
			assert.ok(wave.time - (last.get(wave.sourceId) ?? -100) >= SKILL_COOLDOWN);
			last.set(wave.sourceId, wave.time);
			serial = wave.id;
		}
	}
	assert.ok(serial > 0 && serial < 40, `60초 발동 횟수: ${serial}`);
	assert.deepEqual(a, b);
	a.enabled = false;
	const velocities = marbles.map((m) => [m.vx, m.vy]);
	updateSkills(a, marbles, 61, STEP);
	assert.equal(a.waves.length, 0);
	assert.equal(a.serial, serial);
	assert.deepEqual(
		marbles.map((m) => [m.vx, m.vy]),
		velocities
	);
});

test('OFF·준비 시간·동결·도착 구슬은 발동하지 않고 새 경기는 효과를 초기화한다', () => {
	const race = createRace(['가', '나']);
	assert.equal(race.skills.enabled, false);
	for (const enabled of [false, true]) {
		const skills = createSkills(47, enabled);
		const marbles = [
			{ ...marble(0), finished: true },
			{ ...marble(1), held: { until: 100 } }
		];
		for (let i = 0; i < 120 * 10; i++) updateSkills(skills, marbles, i * STEP, STEP);
		assert.equal(skills.serial, 0);
	}
	const ready = createSkills(47, true);
	for (let i = 0; i < 120 * 2; i++) updateSkills(ready, [marble(0)], i * STEP, STEP);
	assert.equal(ready.serial, 0);
	const off = createSkills(47);
	for (let i = 0; i < 120 * 30; i++) updateSkills(off, [marble(0)], i * STEP, STEP);
	assert.equal(off.serial, 0);
	assert.equal(race.skills.waves.length, 0);
	assert.equal(race.skills.cooldowns.size, 0);
});

test('파동으로 벽 쪽에 밀린 구슬도 충돌을 유지한다', () => {
	const race = createRace(['가', '나']);
	race.blocks = [];
	Object.assign(race.marbles[0], { x: 60, y: 200 });
	Object.assign(race.marbles[1], { x: 25, y: 200 });
	firePulse(race.skills, race.marbles[0], race.marbles, race.time);
	for (let i = 0; i < 60; i++) {
		stepRace(race);
		assert.ok(race.marbles.every((m) => m.x >= 25 && m.x <= 695));
	}
});

test('0.25·1·2배속은 같은 경기 시각의 파동과 위치가 같다', () => {
	const states = [];
	for (const speed of [0.25, 1, 2]) {
		const race = createRace(Array(30).fill('가'), 'keyboard', 47, { skillsEnabled: true });
		const clock = createRaceClock();
		for (let i = 0; i < (60 * 12) / speed; i++) clock.advance(1 / 60, speed, () => stepRace(race));
		states.push({ skills: race.skills, marbles: race.marbles, finished: race.finished });
	}
	assert.ok(states[0].skills.serial > 0);
	assert.deepEqual(states[0], states[1]);
	assert.deepEqual(states[1], states[2]);
});

test('Worker 프레임은 파동을 전송하고 만료·OFF·새 경기에서 제거한다', () => {
	const race = createRace(['가', '나']);
	const encode = createSnapshotEncoder(),
		decode = createSnapshotDecoder();
	decode(structuredClone(encode(race, [], null, true)));
	firePulse(race.skills, race.marbles[0], race.marbles, 2);
	assert.equal(decode(structuredClone(encode(race))).skillWaves.length, 1);
	updateSkills(race.skills, race.marbles, 3, STEP);
	assert.deepEqual(decode(structuredClone(encode(race))).skillWaves, []);
	assert.deepEqual(
		decode(structuredClone(encode(createRace(['다', '라']), [], null, true))).skillWaves,
		[]
	);
});

test('파동에 맞은 구슬은 빈 공간에서 이전보다2.5배 이상 멀리 날아간다', (t) => {
	const distances = [];
	for (const stronger of [false, true]) {
		const race = createRace(['가', '나']);
		race.blocks = [];
		Object.assign(race.marbles[0], { x: 140, y: 1000 });
		const target = race.marbles[1];
		Object.assign(target, { x: 170, y: 1000, vx: 0, vy: 0 });
		if (stronger) firePulse(race.skills, race.marbles[0], race.marbles, race.time);
		else target.vx = 340 * (1 - (0.65 * 30) / PULSE_RADIUS);
		race.marbles[0].finished = true;
		for (let i = 0; i < 72; i++) stepRace(race);
		distances.push(target.x - 170);
		if (stronger) {
			while (race.time < 0.7) stepRace(race);
			assert.ok(target.pulseBoostUntil < race.time);
		}
	}
	assert.ok(distances[1] > distances[0] * 2.5);
	t.diagnostic(
		`0.6초 가로 이동: 이전 ${distances[0].toFixed(1)} → 변경 ${distances[1].toFixed(1)}`
	);
});

test('강한 파동에 밀려도 얇은 장애물의 충돌면을 건너뛰지 않는다', () => {
	const race = createRace(['가', '나']);
	const wall = makeBlock('wall', 300, 1050, { w: 14, h: 500, cornerRadius: 7 });
	race.blocks = [wall];
	Object.assign(race.marbles[0], { x: 140, y: 1000 });
	const target = race.marbles[1];
	Object.assign(target, { x: 170, y: 1000, vx: 0, vy: 0 });
	firePulse(race.skills, race.marbles[0], race.marbles, race.time);
	race.marbles[0].finished = true;
	let bounced = false;
	for (let i = 0; i < 72; i++) {
		stepRace(race);
		assert.ok(target.x + target.r <= wall.x - wall.w / 2 + 0.001);
		if (target.vx < 0) bounced = true;
	}
	assert.ok(bounced);
});

test('파동 하나마다 효과음 이벤트는 한 번만 만들고 표시 중에는 반복하지 않는다', () => {
	const race = createRace(Array(30).fill('가'), 'keyboard', 47, { skillsEnabled: true });
	const events = [];
	for (let i = 0; i < 120 * 12; i++)
		events.push(...stepRace(race).filter((e) => e.kind === 'skill'));
	assert.ok(race.skills.serial > 0);
	assert.equal(events.length, race.skills.serial);
	assert.equal(new Set(events.map((event) => event.deviceId)).size, events.length);
	assert.ok(
		events.every(
			(event) => event.type === 'pulse' && Number.isFinite(event.x) && Number.isFinite(event.y)
		)
	);
});
