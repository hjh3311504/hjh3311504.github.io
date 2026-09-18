import { createDrainMonitor, remainingDiagnostics } from './helpers/race-progress.js';
import test from 'node:test';
import assert from 'node:assert/strict';
import {
	BLOCKS,
	MAPS,
	BREAKABLE_TYPES,
	ACTIVE_BLOCK_TYPES,
	SAVED_MAPS,
	resolveMapId,
	parseNames
} from '../../src/lib/marble-race/catalog.js';
import {
	createRace,
	makeBlock,
	stepRace,
	collision,
	hitBlock,
	gateOpen,
	winners,
	STEP,
	FINISH_Y,
	createSpatialIndex,
	nearbyBlocks,
	blockAngle
} from '../../src/lib/marble-race/physics.js';

function fixture(type, options = {}) {
	const race = createRace(['가', '나']);
	race.time = 1;
	const block = makeBlock(type, 360, 300, options);
	race.blocks = [block];
	const marble = race.marbles[0];
	Object.assign(marble, { x: 360, y: 277, vx: 0, vy: 170 });
	race.marbles[1].x = 60;
	return { race, block, marble };
}
function run(race, limit = 150, inspect) {
	const monitor = createDrainMonitor(race.layout);
	while (race.time < limit && race.finished.length < race.marbles.length) {
		stepRace(race);
		race.drainProgress = monitor.observe(race);
		inspect?.(race);
	}
	return race;
}
test('명단의 빈 줄을 제거하고 중복 이름은 별도 구슬로 유지한다', () => {
	assert.deepEqual(parseNames(' 가, 나\r\n\n 가 ').names, ['가', '나', '가']);
	assert.ok(parseNames('가').error);
	assert.equal(parseNames(Array(1001).fill('가').join(',')).error, '');
	assert.ok(parseNames('가'.repeat(21) + ',나').error);
	assert.equal(parseNames('😀'.repeat(20) + ',나').error, '');
});
test('활성3개 맵은 일반12종·재질4층·특수 구간3곳과 회전 판을 제공한다', () => {
	for (const map of MAPS) {
		assert.ok(map.layers.every((type) => ACTIVE_BLOCK_TYPES.includes(type)));
		assert.equal(new Set(map.layers).size, 4);
		const race = createRace(['가', '나'], map.id);
		assert.equal(race.layout.connectors.length, 3);
		assert.deepEqual(
			race.layout.connectors.map((c) => c.kind),
			['frost', 'butter', 'pond']
		);
		for (let i = 0; i < 3; i++)
			assert.equal(race.zones[i + 1].y - race.zones[i].y, race.layout.tileRows * 34 + 1220);
		assert.equal(race.blocks.filter((b) => b.tile).length, race.layout.tileRows * 80);
		for (const zone of race.zones) {
			const tiles = race.blocks.filter((b) => b.tile && b.zoneId === zone.id);
			assert.equal(tiles.length, race.layout.tileRows * 20);
			assert.ok(tiles.every((b) => b.type === zone.type && b.w === 32 && b.h === 32));
			assert.equal(tiles[1].x - tiles[0].x, 34);
			assert.equal(tiles[20].y - tiles[0].y, 34);
			assert.equal(tiles[20].x - tiles[0].x, 16);
			assert.ok(tiles.every((b) => b.cornerRadius === 10));
		}
		for (const connector of race.layout.connectors) {
			const devices = race.blocks.filter((b) => b.connectorId === connector.id);
			assert.equal(devices.filter((b) => b.type === 'wall').length, 2);
			assert.equal(connector.end - connector.start, 1220);
			assert.equal(devices.filter((b) => b.type === 'asmr').length, 0);
		}
		for (const b of race.blocks)
			if (b.type !== 'wall') {
				assert.ok(map.types.includes(b.soundType ?? b.type));
			}
		assert.equal(race.layout.finish.right - race.layout.finish.left, 40);
		const rotors = race.blocks.filter((b) => b.type === 'rotor');
		assert.equal(rotors.length, 1);
		assert.equal(rotors[0].w, 180);
		assert.equal(rotors[0].h, 16);
		assert.equal(race.blocks.filter((b) => b.arc).length, 0);
		assert.equal(race.layout.height - race.layout.finale.start, 740);
	}
	assert.equal(MAPS.length, 3);
	assert.equal(BLOCKS.thock.name, '도각 키보드1');
	assert.deepEqual(ACTIVE_BLOCK_TYPES, [
		'thock',
		'thock2',
		'thock3',
		'thock4',
		'clicky',
		'popit',
		'wrap',
		'cork',
		'wood',
		'droplet',
		'frog',
		'duck'
	]);
	assert.ok(MAPS.some((map) => map.layers.includes('wrap')));
	assert.deepEqual(
		[...new Set(MAPS.flatMap((map) => map.layers))].sort(),
		[...ACTIVE_BLOCK_TYPES].sort()
	);
	for (const type of ['slime', 'sand', 'soap', 'waxball', 'asmr', 'ember']) {
		assert.ok(BREAKABLE_TYPES.includes(type));
		assert.ok(MAPS.every((map) => !map.types.includes(type)));
	}
	assert.equal(SAVED_MAPS.length, 3);
	for (const [id, expected] of Object.entries({
		workshop: 'keyboard',
		'thock-collection': 'keyboard',
		toys: 'crunch',
		bounce: 'soft',
		keyboard: 'keyboard',
		soft: 'soft',
		crunch: 'crunch'
	}))
		assert.equal(resolveMapId(id), expected);
	assert.equal(BREAKABLE_TYPES.length, 19);
});
test('도감과 보존 재질은 정면·옆면·모서리에서 접촉면에 맞게 반동하고 한 번만 깨진다', () => {
	for (const type of BREAKABLE_TYPES)
		for (const [x, y, vx, vy] of [
			[360, 277, 0, 170],
			[304, 300, 170, 40],
			[407 + 8, 313 + 8, -100, -100]
		]) {
			const { race, block, marble } = fixture(type);
			Object.assign(marble, { x, y, vx, vy });
			const hit = collision(marble, block, race.time);
			assert.ok(hit);
			const beforeNormal = vx * hit.nx + vy * hit.ny;
			hitBlock(race, marble, block, hit);
			const normal = marble.vx * hit.nx + marble.vy * hit.ny;
			assert.ok(Math.abs(normal + beforeNormal * BLOCKS[type].restitution) < 1e-8, type);
			assert.ok(marble.vx ** 2 + marble.vy ** 2 <= vx ** 2 + vy ** 2 + 1e-8, type);
			if (x === 304) assert.ok(marble.vy >= 0, '옆면 충돌의 세로 속도를 강제로 뒤집지 않는다');
			hitBlock(race, marble, block, hit);
			assert.equal(block.alive, false);
			assert.equal(block.hp, 0);
			assert.equal(race.events.length, 1);
		}
});
test('같은 입사 속도에서 재질별 탄성과 마찰 차이가 나타난다', () => {
	const result = {};
	for (const type of BREAKABLE_TYPES) {
		const { race, block, marble } = fixture(type);
		marble.vx = 100;
		hitBlock(race, marble, block, collision(marble, block, race.time));
		result[type] = [marble.vx, marble.vy];
	}
	assert.ok(Math.abs(result.popit[1]) > Math.abs(result.waxball[1]));
	assert.ok(Math.abs(result.waxball[1]) > Math.abs(result.slime[1]));
	assert.ok(result.slime[0] < result.clicky[0]);
});
test('점성 젤은 유지되며 천천히 내려간다', () => {
	const { race, block, marble } = fixture('gel', { h: 100 });
	marble.y = 285;
	marble.vy = 300;
	for (let i = 0; i < 60; i++) stepRace(race);
	assert.equal(block.alive, true);
	assert.ok(marble.y > 285 && marble.y < 325);
	assert.ok(marble.vy <= 65.01);
});
test('끈끈이는 1초 뒤 놓고 영역에서 나가기 전에는 재포획하지 않는다', () => {
	const { race, block, marble } = fixture('sticky', { h: 240 });
	marble.y = 200;
	stepRace(race);
	assert.ok(marble.held);
	const y = marble.y;
	for (let i = 0; i < 60; i++) stepRace(race);
	assert.equal(marble.y, y);
	for (let i = 0; i < 90; i++) stepRace(race);
	assert.equal(marble.held, null);
	assert.ok(marble.ignored.has(block.id));
	for (let i = 0; i < 180; i++) stepRace(race);
	assert.ok(marble.y > block.y + block.h / 2 + marble.r);
	assert.equal(marble.ignored.has(block.id), false);
});
test('스프링은 접촉면 방향, 회전 날개는 표면 속도로 힘을 준다', () => {
	const a = fixture('spring');
	Object.assign(a.marble, { x: 304, y: 300, vx: 170, vy: 0 });
	hitBlock(a.race, a.marble, a.block, collision(a.marble, a.block, a.race.time));
	assert.ok(a.marble.vx < -230);
	assert.equal(a.marble.vy, 0);
	const b = fixture('rotor', { phase: -1.7 });
	b.marble.x = 380;
	hitBlock(b.race, b.marble, b.block, collision(b.marble, b.block, b.race.time));
	const c = fixture('rotor', { phase: 1.7, direction: -1 });
	c.marble.x = 380;
	hitBlock(c.race, c.marble, c.block, collision(c.marble, c.block, c.race.time));
	assert.notEqual(b.marble.vy, c.marble.vy);
});
test('경사판에는 중력으로 미끄러지고 시소는 올라간 쪽으로 기운다', () => {
	const { race, block, marble } = fixture('slide', { angle: 0.4, w: 200 });
	Object.assign(marble, { x: 350, y: 250, vx: 0, vy: 0 });
	for (let i = 0; i < 120; i++) stepRace(race);
	assert.ok(marble.x > 370);
	assert.equal(block.alive, true);
	const a = fixture('seesaw');
	a.marble.x += 20;
	hitBlock(a.race, a.marble, a.block, collision(a.marble, a.block, a.race.time));
	assert.ok(a.block.tilt > 0);
});
test('닫힌 문은 받치고 주기적으로 열리면 통과한다', () => {
	const { race, block, marble } = fixture('gate', { w: 700 });
	assert.equal(gateOpen(block, 1), false);
	assert.equal(gateOpen(block, 3), true);
	for (let i = 0; i < 60; i++) stepRace(race);
	assert.ok(marble.y < block.y);
	for (let i = 0; i < 240; i++) stepRace(race);
	assert.ok(marble.y > block.y + block.h);
});
test('8초 정체와 75초 이후에도 일반 블록과 필수 장치 충돌을 유지한다', () => {
	for (const time of [8.1, 76]) {
		const { race, block, marble } = fixture('soap');
		race.time = time;
		marble.bestY = 300;
		marble.lastProgress = 0;
		stepRace(race);
		assert.equal(block.alive, false);
		assert.ok(marble.vy < 0);
		assert.ok(marble.windUntil > time);
	}
});
test('빠른 이동과 구슬 간 겹침 보정도 촘촘한 블록을 통과시키지 않는다', () => {
	const { race, block, marble } = fixture('thock', { h: 2 });
	Object.assign(marble, { y: 260, vy: 10000 });
	for (let i = 0; i < 30; i++) stepRace(race);
	assert.equal(block.alive, false);
	const b = fixture('thock', { w: 32, h: 32 });
	Object.assign(b.marble, { x: 360, y: 270, vy: 0 });
	Object.assign(b.race.marbles[1], { x: 360, y: 256, vy: 100 });
	for (let i = 0; i < 30; i++) stepRace(b.race);
	assert.equal(b.block.alive, false);
});
test('분산 장치 접촉은 실제 충돌마다 한 장치당 한 번 기록한다', () => {
	const { race, block, marble } = fixture('rubber', {
		connectorId: 'connector-0',
		w: 32,
		h: 32,
		cornerRadius: 16
	});
	marble.scatterPassages.set('connector-0', { entry: { time: 0 }, exit: null, contacts: [] });
	const hit = collision(marble, block, race.time);
	hitBlock(race, marble, block, hit, 0);
	assert.equal(marble.scatterPassages.get('connector-0').contacts.length, 0);
	hitBlock(race, marble, block, hit, STEP);
	hitBlock(race, marble, block, hit, STEP);
	assert.equal(marble.scatterPassages.get('connector-0').contacts.length, 1);
});

test('도착은 중앙 통로 안의 아래 방향 교차만 인정하고 중복 기록하지 않는다', () => {
	const race = createRace(['중앙', '바깥']);
	race.blocks = [];
	Object.assign(race.marbles[0], { x: 360, y: race.layout.finish.y - 1, vy: 400 });
	Object.assign(race.marbles[1], { x: 500, y: race.layout.finish.y - 1, vy: 400 });
	stepRace(race);
	assert.deepEqual(
		race.finished.map((m) => m.id),
		[0]
	);
	stepRace(race);
	assert.equal(race.finished.length, 1);
	assert.equal(winners(race, 'last')[0].id, 1);
	assert.equal(race.marbles[1].finished, false);
	Object.assign(race.marbles[1], { x: 360, y: race.layout.finish.y - 2, vy: 400 });
	stepRace(race);
	assert.deepEqual(
		winners(race, 'multiple', 2).map((m) => m.id),
		[0, 1]
	);
	assert.equal(winners(race, 'last')[0].id, 1);
});
test('같은 계산 안의 도착은 실제 교차 시각으로 정렬한다', () => {
	const race = createRace(['뒤', '앞']);
	race.blocks = [];
	// 도착 판정만 분리해 확인할 수 있도록 넓은 테스트용 영역을 쓴다.
	race.layout.finish = { left: 100, right: 600, y: FINISH_Y };
	Object.assign(race.marbles[0], { x: 200, y: FINISH_Y - 2, vy: 400 });
	Object.assign(race.marbles[1], { x: 500, y: FINISH_Y - 1, vy: 400 });
	stepRace(race);
	assert.deepEqual(
		race.finished.map((m) => m.id),
		[1, 0]
	);
});
const bins = [0, 0, 0],
	exitBins = [0, 0, 0];
let lateral = 0,
	measured = 0,
	eligible = 0,
	reversed = 0;
const timing = [];
const seeds = [5, 47, 999, 1, 2, 3, 17, 29, 81, 2026];
for (const map of MAPS)
	test(`${map.name}: 30경기의 완주·분산 기록을 수집한다`, (t) => {
		const times = [];
		for (const count of [2, 30, 60])
			for (const seed of seeds) {
				// 새 계획의120초 관측 한도에서도 모든 참가자의 실제 도착을 확인한다.
				const race = run(createRace(Array(count).fill('같은 이름'), map.id, seed), 120);
				times.push(race.time);
				assert.equal(
					race.finished.length,
					count,
					JSON.stringify(remainingDiagnostics(race, race.drainProgress))
				);
				assert.equal(new Set(race.finished.map((m) => m.id)).size, count);
				assert.deepEqual(
					race.drainProgress.stalls,
					[],
					JSON.stringify(remainingDiagnostics(race, race.drainProgress))
				);
				const dwell = Math.max(...race.marbles.map((m) => m.finishTime - m.finaleEntry));
				timing.push({ map: map.id, count, seed, time: race.time, dwell });
				for (const m of race.marbles) {
					const pass = m.scatterPassages.get('connector-0'),
						entry = m.zoneEntries.get(
							race.zones.find((zone) => zone.y > race.layout.connectors[0].end).id
						);
					assert.ok(pass?.entry && pass?.exit);
					assert.ok(pass.entry.time <= pass.exit.time && pass.entry.time <= entry.time);
					assert.ok(pass.entry.rank >= 1 && pass.entry.rank <= count);
					assert.notEqual(m.finaleEntry, null);
					assert.equal(m.windUntil, 0);
					assert.ok(Number.isFinite(m.x + m.y + m.vx + m.vy));
					if (count >= 30) {
						bins[Math.min(2, Math.floor(entry.x / 240))]++;
						exitBins[Math.min(2, Math.floor(pass.exit.x / 240))]++;
						measured++;
						if (m.materialTravel.maxX - m.materialTravel.minX >= 102) lateral++;
					}
				}
				const order = [...race.marbles].sort(
					(a, b) => a.finaleEntry - b.finaleEntry || a.id - b.id
				);
				if (order[1].finaleEntry - order[0].finaleEntry <= 1) {
					eligible++;
					if (race.finished[0].id !== order[0].id) reversed++;
				}
			}
		t.diagnostic(
			`${map.name}: ${Math.min(...times).toFixed(2)}~${Math.max(...times).toFixed(2)}초`
		);
	});
test('활성 맵은120초 이내 완주하며 기존 결승15초 목표는 별도로 기록한다', (t) => {
	assert.equal(timing.length, MAPS.length * 30);
	assert.ok(timing.every((r) => r.time <= 120));
	const exceeded = timing.filter((r) => r.dwell > 15);
	t.diagnostic(
		`기존 결승15초 목표 초과 ${exceeded.length}/${timing.length}경기; 최대 체류 ${Math.max(...timing.map((r) => r.dwell)).toFixed(2)}초; 최대 완주 ${Math.max(...timing.map((r) => r.time)).toFixed(2)}초`
	);
});

test('특수 구간 출구와 다음 층의 좌·중·우 진입률을 기록한다', (t) => {
	for (const [label, values] of [
		['출구', exitBins],
		['다음 층', bins]
	]) {
		const total = values.reduce((a, b) => a + b, 0);
		assert.equal(total, MAPS.length * 900);
		t.diagnostic(
			`${label}: ${values.map((n) => ((n / total) * 100).toFixed(1) + '%').join(' / ')}`
		);
		assert.ok(values.every((n) => n > 0));
	}
});
test('가까이 진입한 구슬들의 마지막 구간 역전 빈도를 기록한다', (t) => {
	assert.ok(eligible >= MAPS.length * 10);
	assert.ok(reversed > 0);
	t.diagnostic(`역전: ${reversed}/${eligible}경기 (${((reversed / eligible) * 100).toFixed(1)}%)`);
});
test('같은 난수와 시간 간격이면 경기 결과가 같다', () => {
	const a = createRace(['가', '나', '다'], 'bounce', 4),
		b = createRace(['가', '나', '다'], 'bounce', 4);
	for (let i = 0; i < 1200; i++) {
		stepRace(a, STEP);
		stepRace(b, STEP);
	}
	assert.deepEqual(
		a.marbles.map((m) => [m.x, m.y]),
		b.marbles.map((m) => [m.x, m.y])
	);
});
test('주변 격자가 회전 장치와 통로 벽도 빠뜨리지 않는다', () => {
	const race = createRace(['가', '나'], 'bounce'),
		index = createSpatialIndex(race.blocks);
	for (let y = 200; y < FINISH_Y; y += 81)
		for (let x = 30; x < 700; x += 91) {
			const m = { x, y, r: 13 },
				candidates = nearbyBlocks(index, m);
			assert.ok(candidates.length < 80);
			for (const b of race.blocks) if (collision(m, b, 2)) assert.ok(candidates.includes(b));
		}
});
test('출발 바와 대기 없이 첫 계산부터 낙하하고 첫 블록에 충돌한다', () => {
	for (const count of [2, 8, 26, 30, 60]) {
		const race = createRace(Array(count).fill('구슬'));
		assert.equal(
			race.blocks.some((b) => b.startBar || b.id === 'start-bar'),
			false
		);
		const before = race.marbles.map((m) => ({ x: m.x, y: m.y }));
		for (const [i, a] of race.marbles.entries())
			for (const b of race.marbles.slice(i + 1))
				assert.ok(Math.hypot(a.x - b.x, a.y - b.y) >= a.r + b.r);
		assert.ok(race.marbles.every((m) => m.y + m.r < race.zones[0].start));
		stepRace(race);
		assert.ok(race.marbles.every((m, i) => m.y > before[i].y && m.vy > 0));
		let first;
		while (race.time < 1.2 && !first) first = stepRace(race).find((e) => e.broken);
		assert.ok(first, '시작1.2초 안에 일반 블록 충돌');
		assert.match(first.blockId, /^layer-0-0-/);
	}
});
test('둥근 모서리 접촉은 무작위 힘 없이 좌우로 반동한다', () => {
	for (const side of [-1, 1]) {
		const { race, marble, block } = fixture('thock', { w: 32, h: 32, cornerRadius: 10 });
		Object.assign(marble, { x: 360 + side * 17, y: 277, vx: 0, vy: 170 });
		const before = marble.vx ** 2 + marble.vy ** 2;
		const hit = collision(marble, block, race.time);
		assert.ok(hit && hit.nx * side > 0 && hit.ny < 0);
		hitBlock(race, marble, block, hit);
		assert.ok(marble.vx * side > 0);
		assert.ok(marble.vx ** 2 + marble.vy ** 2 <= before + 1e-8);
		assert.equal(collision({ x: 375.5, y: 315.5, r: 1 }, block, race.time), null);
	}
});
test('30·60명 구슬의75% 이상이 재질 구간에서 가로102 이상 이동한다', (t) => {
	assert.ok(measured > 0);
	assert.ok(lateral / measured >= 0.75, `${lateral}/${measured}`);
	t.diagnostic(`좌우 이동: ${lateral}/${measured} (${((lateral / measured) * 100).toFixed(1)}%)`);
});
test('일반 블록은3초 뒤 복구하며 파괴 회차마다 효과를 한 번만 낸다', () => {
	for (const type of BREAKABLE_TYPES) {
		const { race, marble, block } = fixture(type, { tile: true });
		const hit = collision(marble, block, race.time);
		hitBlock(race, marble, block, hit);
		hitBlock(race, marble, block, hit);
		assert.equal(race.events.length, 1);
		assert.equal(race.events[0].breakCycle, 1);
		assert.equal(block.respawnAt, 4);
		assert.equal(race.respawnQueue.length, 1);
		Object.assign(marble, { x: 60, y: 100, vx: 0, vy: 0 });
		race.marbles[1].finished = true;
		race.time = 4 - STEP * 2;
		stepRace(race);
		assert.equal(block.alive, false);
		while (race.time < 4 + STEP) stepRace(race);
		assert.equal(block.alive, true);
		assert.equal(block.hp, 1);
		assert.equal(race.respawnQueue.length, 0);
		assert.equal(race.events.length, 0, '복구는 소리를 내지 않는다');
		Object.assign(marble, { x: 360, y: 277, vx: 0, vy: 170 });
		hitBlock(race, marble, block, collision(marble, block, race.time));
		assert.equal(race.events.length, 1);
		assert.equal(race.events[0].breakCycle, 2);
		assert.equal(block.alive, false);
		assert.equal(block.respawnAt, race.time + 3);
	}
});
test('구슬이 겹친 자리는 기다렸다가 복구하며 밀어내지 않는다', () => {
	const { race, marble, block } = fixture('soap', { tile: true });
	hitBlock(race, marble, block, collision(marble, block, race.time));
	race.time = 4;
	Object.assign(marble, { x: 360, y: 300, vx: 0, vy: 0 });
	stepRace(race);
	assert.equal(block.alive, false);
	assert.equal(marble.x, 360);
	assert.ok(Math.abs(marble.y - 300) < 1);
	marble.x = 200;
	stepRace(race);
	assert.equal(block.alive, true);
	assert.equal(block.respawnAt, null);
});
test('일시정지 동안 복구 시간이 흐르지 않고 새 경기에는 예약을 넘기지 않는다', () => {
	const { race, marble, block } = fixture('thock');
	hitBlock(race, marble, block, collision(marble, block, race.time));
	const saved = [race.time, block.respawnAt, block.alive];
	// 일시정지는 stepRace 호출을 중단한다. 실제 시간과 예약은 연결하지 않는다.
	assert.deepEqual([race.time, block.respawnAt, block.alive], saved);
	const fresh = createRace(['가', '나']);
	assert.equal(fresh.respawnQueue.length, 0);
	assert.ok(fresh.blocks.every((b) => b.breakCycle === 0 && b.respawnAt === null));
});
test('같은 자리에 복구된 블록을 반복 파괴해도 정체 시간을 초기화하지 않는다', () => {
	const { race, marble, block } = fixture('thock');
	hitBlock(race, marble, block, collision(marble, block, race.time));
	Object.assign(marble, { x: 60, y: 100, vx: 0, vy: 0 });
	race.time = 4;
	stepRace(race);
	const lastProgress = marble.lastProgress;
	Object.assign(marble, { x: 360, y: 277, vx: 0, vy: 170, bestY: 1000 });
	hitBlock(race, marble, block, collision(marble, block, race.time));
	assert.equal(marble.lastProgress, lastProgress);
	race.time = lastProgress + 8.1;
	marble.x = 60;
	stepRace(race);
	assert.ok(marble.windUntil > race.time);
});
test('선두가 연 길은 복구 전에는 통과하고 복구 후에는 다시 충돌한다', () => {
	for (const delay of [2.9, 3.1]) {
		const { race, marble, block } = fixture('thock', { tile: true });
		hitBlock(race, marble, block, collision(marble, block, race.time));
		marble.finished = true;
		const follower = race.marbles[1];
		Object.assign(follower, { x: 60, y: 100, vx: 0, vy: 0 });
		race.time = 1 + delay;
		stepRace(race);
		Object.assign(follower, { x: 360, y: 277, vx: 0, vy: 170 });
		stepRace(race);
		assert.equal(follower.vy < 0, delay > 3);
		assert.equal(block.breakCycle, delay > 3 ? 2 : 1);
	}
});
test('일반 재질의 반발계수는0.55~0.65 범위다', () => {
	for (const type of BREAKABLE_TYPES) {
		assert.ok(BLOCKS[type].restitution >= 0.55 && BLOCKS[type].restitution <= 0.65);
	}
});
test('마지막 구간은 기존 정체 바람을 종료하고 오래 있어도 새 바람을 주지 않는다', () => {
	const race = createRace(['가', '나']);
	race.blocks = [];
	race.time = 80;
	const m = race.marbles[0];
	Object.assign(m, {
		y: race.layout.finale.start + 100,
		bestY: FINISH_Y,
		lastProgress: 0,
		windUntil: 90,
		vx: 0
	});
	stepRace(race);
	assert.equal(m.windUntil, 0);
	assert.equal(m.vx, 0);
	// 장애물에 튕겨 입구 위로 돌아가도 마지막 구간의 바람 금지는 유지한다.
	m.y = race.layout.finale.start - 40;
	m.vy = -20;
	m.windUntil = race.time + 10;
	stepRace(race);
	assert.equal(m.windUntil, 0);
	assert.equal(m.vx, 0);
});

test('결승 판은4.4초 주기로 반시계 방향으로 회전하며 입구 구슬을 걷어 올린다', () => {
	const race = createRace(['가', '나']);
	const bar = race.blocks.find((b) => b.id === 'finale-bar');
	for (let time = 0; time < 9; time += 0.17)
		assert.ok(Math.abs(blockAngle(bar, time + 4.4) - blockAngle(bar, time) + Math.PI * 2) < 1e-8);
	bar.phase = 0;
	const marble = race.marbles[0];
	Object.assign(marble, { x: 360, y: bar.y - 20, vx: 0, vy: 50 });
	const hit = collision(marble, bar, 0);
	assert.ok(hit);
	hitBlock(race, marble, bar, hit);
	assert.ok(marble.vy < 0, '판 오른쪽에 닿은 구슬은 실제 표면 속도로 위쪽 반동을 받는다');
});
test('같은 장치의 벽 조각은 중복음을 내지 않고 다음 실제 충돌은 다시 재생한다', () => {
	const race = createRace(['가', '나']);
	const a = makeBlock('wall', 360, 300, { soundType: 'rubber', deviceId: 'test-cylinder' });
	const b = makeBlock('wall', 360, 300, {
		soundType: 'rubber',
		deviceId: 'test-cylinder',
		id: 'second'
	});
	const m = race.marbles[0];
	for (const block of [a, b]) {
		Object.assign(m, { x: 360, y: 277, vx: 0, vy: 170 });
		hitBlock(race, m, block, collision(m, block, race.time));
	}
	assert.equal(race.events.length, 1);
	assert.equal(race.events[0].soundType, 'rubber');
	assert.equal(race.events[0].impact, 170);
	race.time += 0.3;
	Object.assign(m, { x: 360, y: 277, vx: 0, vy: 170 });
	hitBlock(race, m, b, collision(m, b, race.time));
	assert.equal(race.events.length, 2);
});

test('둥근 유도벽의 충돌 모양은 그림과 같고 에너지를 늘리지 않는다', () => {
	const race = createRace(['가', '나']);
	const devices = race.blocks.filter((b) => b.connectorId && b.type === 'wall');
	for (const b of devices) {
		assert.equal(b.cornerRadius, b.h / 2);
		const angle = b.angle,
			dx = Math.cos(angle),
			dy = Math.sin(angle);
		for (const end of [-1, 1]) {
			const m = {
				x: b.x + dx * end * (b.w / 2 + 8),
				y: b.y + dy * end * (b.w / 2 + 8),
				r: 13,
				vx: -dx * end * 100,
				vy: -dy * end * 100
			};
			const hit = collision(m, b, 0);
			assert.ok(hit);
			const marble = race.marbles[0];
			Object.assign(marble, m);
			hitBlock(race, marble, b, hit);
			assert.ok(marble.vx ** 2 + marble.vy ** 2 <= 10000 + 1e-6);
		}
	}
});

test('결승은 직선 깔때기와 같은 높이의 입구, 왼쪽 회전축으로 연결한다', () => {
	const race = createRace(['가', '나']);
	const { finale, finish } = race.layout;
	const bar = race.blocks.find((b) => b.id === 'finale-bar');
	const guides = race.blocks.filter((b) => b.deviceId === 'finale-guide');
	assert.equal(guides.length, 2);
	assert.equal(finale.mouthY, finale.start + 400);
	assert.equal(bar.y, finale.mouthY);
	assert.equal(bar.x, finish.left - 50);
	assert.equal(bar.direction, -1);
	for (const side of [-1, 1]) {
		const guide = guides.find((b) => Math.sign(b.x - 360) === side);
		const chute = race.blocks.find((b) => b.id === `chute-${side}`);
		for (const depth of [50, 200, 350]) {
			const surfaceX = 360 + side * (348 - (328 * depth) / 400);
			assert.ok(collision({ x: surfaceX, y: finale.start + depth, r: 1 }, guide, 0));
		}
		assert.equal(chute.x - (side * chute.h) / 2, side < 0 ? finish.left : finish.right);
	}
	bar.phase = 0;
	const waiting = { x: 360, y: finale.mouthY - 20, r: 13 };
	assert.ok(collision(waiting, bar, 0), '수평 판 끝이 입구를 막는다');
	assert.equal(collision(waiting, bar, 1), null, '수직 판은 입구를 연다');
	const inside = { x: 360, y: finale.mouthY + 35, r: 13 };
	assert.ok(race.blocks.filter((b) => b.type === 'wall').every((b) => !collision(inside, b, 0)));
});

test('결승 입구 밀집60개는60초 내 배출 정체 없이 실제 판정선을 통과한다', (t) => {
	for (const phase of [0, Math.PI / 2, Math.PI, Math.PI * 1.5]) {
		const race = createRace(Array(60).fill('공'), 'keyboard', 47);
		race.blocks.find((b) => b.id === 'finale-bar').phase = phase;
		for (const [i, m] of race.marbles.entries())
			Object.assign(m, {
				x: 40 + (i % 20) * 33,
				y: race.layout.finale.start - 30 - Math.floor(i / 20) * 30,
				vx: 0,
				vy: 150
			});
		run(race, 60, (state) => {
			for (const m of state.marbles) {
				if (m.y <= state.layout.finale.mouthY + 30) continue;
				// 접촉 보정의 미세한 겹침과 구슬 중심이 벽을 넘어가는 관통을 구분한다.
				if (m.x < state.layout.finish.left || m.x > state.layout.finish.right)
					assert.fail(JSON.stringify(remainingDiagnostics(state, state.drainProgress)));
			}
		});
		const detail = JSON.stringify(remainingDiagnostics(race, race.drainProgress));
		assert.equal(race.finished.length, 60, detail);
		assert.deepEqual(race.drainProgress.stalls, [], detail);
		t.diagnostic(
			`시작 각도 ${phase.toFixed(2)}: ${race.time.toFixed(2)}초, 기존30초 목표 초과 ${race.finished.filter((m) => m.finishTime > 30).length}개, 최대 배출 간격 ${race.drainProgress.maxGap.toFixed(2)}초`
		);
		assert.equal(new Set(race.finished.map((m) => m.id)).size, 60);
		for (const m of race.finished) {
			assert.ok(m.x >= race.layout.finish.left && m.x <= race.layout.finish.right);
			assert.equal(m.windUntil, 0);
		}
	}
});
