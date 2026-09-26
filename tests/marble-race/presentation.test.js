import test from 'node:test';
import assert from 'node:assert/strict';
import { createPresentation } from '../../src/lib/marble-race/presentation.js';
import { createPreviewOrder } from '../../src/lib/marble-race/preview-order.js';
import { createRace } from '../../src/lib/marble-race/physics.js';

test('0.25배속 수신 사이에도 표시 위치와 시각이 연속으로 움직이고 물리 상태를 바꾸지 않는다', () => {
	const race = createRace(['가', '나']);
	race.identity = Symbol();
	const display = createPresentation();
	display.push(race, 0);
	const before = race.marbles[0].y;
	race.time = 1 / 120;
	race.marbles[0].y += 4;
	display.push(race, 1000 / 30);
	assert.equal(display.sample(race, 1000 / 30).marbles[0].y, before);
	const middle = display.sample(race, 50);
	assert.ok(Math.abs(middle.marbles[0].y - before - 2) < 1e-9);
	assert.ok(Math.abs(middle.time - 1 / 240) < 1e-9);
	assert.equal(race.marbles[0].y, before + 4);
	assert.equal(display.sample(race, 500).marbles[0].y, before + 4);
	assert.equal(display.sample(race, 500).time, race.time);
});

test('중복 시각은 보간을 재시작하지 않고 고정·해제·골인·새 경기는 이전 위치를 남기지 않는다', () => {
	const race = createRace(['가', '나']);
	race.identity = Symbol();
	const p = createPresentation();
	p.push(race, 0);
	race.time = 0.01;
	race.marbles[0].y += 20;
	p.push(race, 40);
	p.push(race, 50);
	assert.equal(p.sample(race, 60).marbles[0].y, race.marbles[0].y - 10);
	for (const held of [{ kind: 'lightning', until: 2 }, null]) {
		race.time += 0.01;
		race.marbles[0].held = held;
		race.marbles[0].y += 30;
		p.push(race, 80);
		assert.equal(p.sample(race, 80).marbles[0].y, race.marbles[0].y);
	}
	race.time += 0.01;
	race.marbles[0].finished = true;
	p.push(race, 100);
	assert.equal(p.sample(race, 100).marbles[0].finished, true);
	assert.equal(p.sample(race, 100, false).time, race.time);
	const next = createRace(['새', '경기']);
	next.identity = Symbol();
	p.push(next, 120);
	assert.equal(p.sample(next, 120).marbles[0].y, next.marbles[0].y);
});

test('준비 순위는60개 제한 없이 백만 명의 마지막 행과 검색 결과만 만든다', () => {
	const entries = [{ name: '공', count: 1000000 }];
	const all = createPreviewOrder(entries);
	assert.equal(all.length, 1000000);
	assert.equal(all.slice(999999, 1000000)[0].id, 999999);
	assert.equal(createPreviewOrder(entries, '1000').slice(0, 1)[0].id, 999);
	assert.equal(createPreviewOrder(entries, '공').length, 1000000);
	assert.equal(createPreviewOrder(entries, '없음').length, 0);
});

test('전체 미리보기의1000개 위치·색·번호는 실제 출발과 같고 충돌 기록은 만들지 않는다', () => {
	const full = createRace(Array(1000).fill('공'), 'keyboard', 47);
	const preview = createRace(Array(1000).fill('공'), 'keyboard', 47, { preview: true });
	assert.equal(preview.marbles.length, 1000);
	assert.deepEqual(
		preview.marbles.map(({ id, x, y, color }) => ({ id, x, y, color })),
		full.marbles.map(({ id, x, y, color }) => ({ id, x, y, color }))
	);
	assert.ok(preview.marbles.every((m) => !('contacts' in m) && !('scatterPassages' in m)));
	assert.ok(preview.blocks.length < full.blocks.length);
});

test('같은 번개 정지 중 회전바에 밀린 이동은 표시 프레임 사이를 보간한다', () => {
	const race = createRace(['가', '나']);
	const m = race.marbles[0],
		p = createPresentation();
	m.held = { kind: 'lightning', until: 2, x: m.x, y: m.y };
	const y = m.y;
	p.push(race, 0);
	race.time = 1 / 120;
	m.y -= 4;
	m.held.y = m.y;
	p.push(race, 40);
	assert.equal(p.sample(race, 60).marbles[0].y, y - 2);
	assert.equal(m.y, y - 4, '실제 위치는 표시 보간으로 바꾸지 않는다');
	assert.equal(p.sample(race, 80).marbles[0].held.until, 2);
});

test('통로의 둥근 모서리를 보간해도 벽 속에 표시하지 않고 실제 상태와 끝점은 유지한다', async () => {
	const { collision } = await import('../../src/lib/marble-race/physics.js');
	const race = createRace(['가', '나'], 'keyboard', 47),
		p = createPresentation(),
		m = race.marbles[0];
	const wall = race.blocks.find((b) => b.id === 'finale-guide--1');
	const endX = wall.x + (Math.cos(wall.angle) * (wall.w - wall.h)) / 2;
	const endY = wall.y + (Math.sin(wall.angle) * (wall.w - wall.h)) / 2;
	const reach = m.r + wall.h / 2 + 0.001;
	m.x = endX + Math.sin(wall.angle) * reach;
	m.y = endY - Math.cos(wall.angle) * reach;
	const a = { x: m.x, y: m.y };
	p.push(race, 0);
	m.x = endX + reach;
	m.y = endY;
	race.time += 1 / 60;
	const b = { x: m.x, y: m.y };
	p.push(race, 20);
	assert.ok(
		collision({ x: (a.x + b.x) / 2, y: (a.y + b.y) / 2, r: m.r }, wall, 0),
		'단순 직선 보간은 벽을 가로지른다'
	);
	for (const t of [21, 25, 30, 35, 39]) {
		const shown = p.sample(race, t).marbles[0];
		for (const block of race.blocks.filter((b) =>
			['finale-guide', 'finale-chute'].includes(b.deviceId)
		))
			assert.equal(collision(shown, block, 0), null);
	}
	assert.equal(m.x, b.x);
	assert.equal(m.y, b.y);
	const end = p.sample(race, 40).marbles[0];
	assert.equal(end.x, b.x);
	assert.equal(end.y, b.y);
});

test('위치 기록을 줄여도 새 화면의 이름·색·속도·도착 정보와 고정 복사를 보존한다', () => {
	const race = createRace(['가', '나'], 'keyboard', 47),
		p = createPresentation(),
		m = race.marbles[0];
	p.push(race, 0);
	Object.assign(m, {
		name: '변경',
		color: '#abcdef',
		vx: 13,
		vy: 22,
		windUntil: 5,
		windDirection: -1,
		held: { kind: 'lightning', until: 2, x: m.x, y: m.y }
	});
	race.time = 0.01;
	p.push(race, 20);
	const shown = p.sample(race, 25).marbles[0];
	assert.deepEqual(shown, m);
	assert.notEqual(shown, m);
	assert.notEqual(shown.held, m.held);
	m.held.y += 100;
	assert.notEqual(shown.held.y, m.held.y);
	Object.assign(m, { finished: true, finishTime: 0.02, held: null });
	race.time = 0.02;
	p.push(race, 40);
	assert.deepEqual(p.sample(race, 40).marbles[0], m);
});
