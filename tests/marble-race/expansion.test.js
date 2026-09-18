import test from 'node:test';
import assert from 'node:assert/strict';
import { parseNames, resolveMap } from '../../src/lib/marble-race/catalog.js';
import {
	createRace,
	prepareRace,
	stepRace,
	collision,
	hitBlock,
	winners
} from '../../src/lib/marble-race/physics.js';
import { createDirector } from '../../src/lib/marble-race/director.js';
import {
	readSettings,
	createSettingsWriter,
	SETTINGS_KEY,
	CUSTOM_MAPS_KEY,
	validateCustomMaps,
	validateDraw
} from '../../src/lib/marble-race/settings.js';
import { SOUND_FILES } from '../../src/lib/marble-race/audio.js';
test('곱하기는 객체 생성 없이 안전한 정수 합계를 검사한다', () => {
	assert.equal(parseNames('토끼*1000000000,오리').count, 1000000001);
	assert.deepEqual(parseNames('토끼*2,오리').names, ['토끼', '토끼', '오리']);
	for (const invalid of ['토끼*0', '토끼*-2', '토끼*1.5', '토끼*9007199254740992', '토끼*2*3'])
		assert.ok(parseNames(invalid + ',오리').error, invalid);
	assert.ok(parseNames('토끼*9007199254740991,오리').error);
	assert.equal(validateDraw('nth', 1, 1001, 1001), '');
	assert.ok(validateDraw('multiple', 1002, 1, 1001));
});
test('저장 입력·이전 맵·중복 재질 내 맵을 복구하고 손상된 맵은 기본값으로 돌린다', () => {
	const map = { id: 'custom-test', name: '반복', layers: ['wood', 'wood', 'wood', 'popit'] };
	const store = new Map([
		[
			SETTINGS_KEY,
			JSON.stringify({ namesText: '토끼*1001', mapId: map.id, mode: 'nth', nth: 1001, volume: 23 })
		],
		[CUSTOM_MAPS_KEY, JSON.stringify([map])]
	]);
	const storage = { getItem: (k) => store.get(k) };
	const read = readSettings(storage);
	assert.equal(read.namesText, '토끼*1001');
	assert.equal(read.nth, 1001);
	assert.equal(read.mapId, map.id);
	assert.deepEqual(resolveMap(read.mapId, read.customMaps).layers, map.layers);
	store.delete(CUSTOM_MAPS_KEY);
	assert.equal(readSettings(storage).mapId, 'keyboard');
	store.set(SETTINGS_KEY, JSON.stringify({ mapId: 'workshop', namesText: '보존' }));
	assert.equal(readSettings(storage).mapId, 'keyboard');
	assert.equal(readSettings(storage).namesText, '보존');
	assert.equal(validateCustomMaps([{ ...map, layers: ['gel', 'wood', 'wood', 'wood'] }]).length, 0);
});
test('설정을200ms로 묶고 종료 시 저장하며 저장 실패를 알린다', async () => {
	const writes = [];
	const writer = createSettingsWriter({ setItem: (...args) => writes.push(args) }, assert.fail);
	writer.schedule({ volume: 20 }, []);
	writer.schedule({ volume: 30 }, []);
	assert.equal(writes.length, 0);
	await new Promise((r) => setTimeout(r, 230));
	assert.equal(writes.length, 2);
	assert.equal(JSON.parse(writes[0][1]).volume, 30);
	writer.schedule({ volume: 40 }, []);
	writer.destroy();
	assert.equal(writes.length, 4);
	let error = '';
	const failure = createSettingsWriter(
		{
			setItem() {
				throw Error();
			}
		},
		(v) => (error = v)
	);
	failure.schedule({}, []);
	failure.flush();
	assert.match(error, /저장하지 못/);
});
test('1,001개 준비는 여러 번 나뉘며 출발 구슬끼리 겹치지 않는다', () => {
	const iterator = prepareRace(parseNames('구슬*1001'), 'keyboard', 47);
	let chunks = 0,
		result;
	do {
		result = iterator.next();
		chunks++;
	} while (!result.done);
	assert.ok(chunks > 12);
	const race = result.value;
	assert.equal(race.marbles.length, 1001);
	assert.ok(race.zones[0].start > 1500);
	const cells = new Map();
	for (const m of race.marbles) {
		const x = Math.floor(m.x / 26),
			y = Math.floor(m.y / 26);
		for (let dx = -1; dx <= 1; dx++)
			for (let dy = -1; dy <= 1; dy++)
				for (const b of cells.get(`${x + dx},${y + dy}`) ?? [])
					assert.ok(Math.hypot(m.x - b.x, m.y - b.y) >= 26);
		const key = `${x},${y}`;
		if (!cells.has(key)) cells.set(key, []);
		cells.get(key).push(m);
	}
});
test('크랙 왁스는 독립 접촉마다 한 번 소리 나고5회에 파괴되며3초 뒤 복구한다', () => {
	const race = createRace(Array(30).fill('가'));
	const block = race.blocks.find((b) => b.type === 'butter');
	race.blocks = [block];
	race.marbles.slice(1).forEach((m) => (m.finished = true));
	const m = race.marbles[0];
	for (let i = 0; i < 5; i++) {
		m.specialContacts.clear();
		Object.assign(m, { x: block.x, y: block.y - block.h / 2 - 12, vx: 0, vy: 170 });
		const hit = collision(m, block, race.time);
		hitBlock(race, m, block, hit);
		const hp = block.hp;
		hitBlock(race, m, block, hit);
		assert.equal(block.hp, hp);
		assert.equal(race.events.length, i + 1, '지속 접촉과 마지막 파괴음은 중복되지 않는다');
		assert.equal(race.events[i].soundType, 'butter');
		assert.equal(race.events[i].broken, i === 4);
		assert.ok(race.events[i].y > m.y, '충돌면 위치로 소리 범위를 판정한다');
		assert.equal(hp, 4 - i);
		if (i < 4) assert.ok(block.h < 64);
	}
	assert.equal(block.alive, false);
	assert.equal(block.respawnAt, 3);
	Object.assign(m, { x: block.x, y: block.y - 28, vx: 0, vy: 0 });
	race.time = 3;
	stepRace(race);
	assert.equal(block.alive, false, '복구된 전체 크기의 겹침도 기다린다');
	m.x = 30;
	stepRace(race);
	assert.equal(block.alive, true);
	assert.equal(block.h, 64);
	assert.equal(block.hp, 5);
});
test('크랙 왁스의 약한 재접촉도 소리 나지만 내구도와 겹침 보정은 별도로 처리한다', () => {
	const race = createRace(Array(30).fill('가'));
	const block = race.blocks.find((b) => b.type === 'butter');
	const m = race.marbles[0];
	for (const dt of [0, 1 / 120, 1 / 120]) {
		Object.assign(m, { x: block.x, y: block.y - block.h / 2 - 12, vx: 0, vy: 3 });
		hitBlock(race, m, block, collision(m, block, race.time), dt);
	}
	assert.equal(block.hp, block.maxHp);
	assert.equal(race.events.length, 1);
	m.y = block.y - 200;
	stepRace(race);
	assert.equal(m.specialContacts.has(block.id), false);
	Object.assign(m, { x: block.x, y: block.y - block.h / 2 - 12, vx: 0, vy: 3 });
	hitBlock(race, m, block, collision(m, block, race.time));
	assert.equal(race.events.filter((e) => e.type === 'butter').length, 1);
	assert.equal(block.hp, block.maxHp);
});
test('연못은 반동 없이 힘으로 감속하며 진입음은 한 번, 밖으로 빠져나온다', () => {
	const race = createRace(['가', '나']);
	const block = race.blocks.find((b) => b.type === 'pond');
	race.blocks = [block];
	race.marbles[1].finished = true;
	const m = race.marbles[0];
	Object.assign(m, { x: block.x, y: block.y - block.h / 2 - 10, vx: 0, vy: 430 });
	let sounds = 0,
		minSpeed = 430;
	while (race.time < 5 && m.y < block.y + block.h / 2 + 15) {
		for (const e of stepRace(race)) if (e.type === 'pond') sounds++;
		minSpeed = Math.min(minSpeed, m.vy);
		assert.ok(m.vy > 0);
	}
	assert.equal(sounds, 1);
	assert.ok(minSpeed > 60 && minSpeed < 100);
	assert.ok(m.y > block.y + block.h / 2 + 13);
	assert.deepEqual(SOUND_FILES.pond, SOUND_FILES.asmr);
	assert.notDeepEqual(SOUND_FILES.butter, SOUND_FILES.waxball);
});
test('n번째와 마지막 당첨·슬로모션·중복 축하 방지', () => {
	for (const mode of ['first', 'last', 'multiple', 'nth']) {
		const race = createRace(['가', '가', '다']);
		const count = mode === 'first' || mode === 'last' ? 1 : 2;
		const d = createDirector(mode, count);
		race.marbles.forEach((m, i) => (m.y = race.layout.finale.rotor.y - i * 30));
		assert.equal(d.update(race).active, true);
		const expectedWinners = {
			first: [[1], [], []],
			last: [[], [2], []],
			multiple: [[1], [0], []],
			nth: [[], [0], []]
		};
		for (const [index, id] of [1, 0, 2].entries()) {
			const m = race.marbles[id];
			m.finished = true;
			m.finishTime = ++race.time;
			race.finished.push(m);
			const state = d.update(race);
			assert.deepEqual(
				state.newWinners.map((m) => m.id),
				expectedWinners[mode][index]
			);
			assert.equal(d.update(race).newWinners.length, 0);
		}
		const state = d.update(race);
		assert.equal(state.active, false);
		assert.equal(state.complete, true);
		assert.deepEqual(
			winners(race, 'nth', 2).map((m) => m.id),
			[0]
		);
	}
});

test('결승 추적 후보는 경기 시간 대기 없이 현재 순위로 즉시 바뀐다', () => {
	for (const [mode, count, expected] of [
		['first', 1, [0, 1, 0]],
		['multiple', 2, [0, 1, 0]],
		['last', 1, [2, 0, 2]],
		['nth', 2, [1, 2, 1]]
	]) {
		const race = createRace(['가', '나', '다']);
		const director = createDirector(mode, count);
		for (const [index, positions] of [
			[300, 200, 100],
			[100, 300, 200],
			[300, 200, 100]
		].entries()) {
			race.marbles.forEach((m, i) => {
				m.y = race.layout.finale.rotor.y + positions[i] - 100;
			});
			const state = director.update(race);
			assert.equal(state.active, true);
			assert.equal(state.focusId, expected[index], mode);
			assert.equal(state.newWinners.length, 0);
			assert.equal(race.time, 0, '후보 갱신에 시간 경과가 필요하지 않다');
		}
	}
});

test('결승 확대와 슬로모션은 회전문100위에 도착할 때 시작하며 반동으로 취소되지 않는다', () => {
	for (const mode of ['first', 'last', 'multiple', 'nth']) {
		const race = createRace(['가', '나', '다']);
		const director = createDirector(mode, mode === 'multiple' || mode === 'nth' ? 2 : 1);
		const trigger = race.layout.finale.rotor.y - 100;
		for (const y of [race.layout.finale.start, trigger - 1]) {
			race.marbles.forEach((m) => (m.y = y));
			assert.equal(director.update(race).active, false, `${mode}: 회전문 접근 전에는 일반 배속`);
		}
		race.marbles.forEach((m) => (m.y = trigger));
		assert.equal(director.update(race).active, true, `${mode}: 기준 높이에 도착하면 연출 시작`);
		race.marbles.forEach((m) => (m.y = trigger - 150));
		assert.equal(director.update(race).active, true, `${mode}: 시작 뒤 상승 반동에도 유지`);
	}
});

test('저장된 타자기 구역은 도각2로 바꾸고 도각3·중복 구역·명단을 보존한다', () => {
	const oldMap = {
		id: 'custom-old-keys',
		name: '내 키보드',
		layers: ['typewriter', 'thock3', 'typewriter', 'thock']
	};
	const storage = {
		getItem(key) {
			return JSON.stringify(
				key === CUSTOM_MAPS_KEY ? [oldMap] : { namesText: '토끼*30', mapId: oldMap.id, volume: 27 }
			);
		}
	};
	const loaded = readSettings(storage);
	assert.equal(loaded.namesText, '토끼*30');
	assert.equal(loaded.mapId, oldMap.id);
	assert.equal(loaded.volume, 27);
	assert.deepEqual(loaded.customMaps[0].layers, ['thock2', 'thock3', 'thock2', 'thock']);
	assert.deepEqual(resolveMap(oldMap).layers, loaded.customMaps[0].layers);
	assert.equal(oldMap.layers[0], 'typewriter', '입력 저장 객체는 직접 바꾸지 않는다');
	const race = createRace(['가', '나'], loaded.customMaps[0]);
	assert.deepEqual(
		race.zones.map((z) => z.type),
		loaded.customMaps[0].layers
	);
	for (const type of ['thock2', 'thock3']) {
		const b = race.blocks.find((b) => b.type === type),
			m = race.marbles[0];
		Object.assign(m, { x: b.x, y: b.y - 28, vx: 0, vy: 200 });
		hitBlock(race, m, b, collision(m, b, race.time));
		assert.equal(b.alive, false);
		assert.equal(b.respawnAt, 3);
	}
	race.marbles.forEach((m) => Object.assign(m, { x: 360, y: 50, vx: 0, vy: 0 }));
	race.time = 3;
	stepRace(race);
	for (const type of ['thock2', 'thock3'])
		assert.ok(race.blocks.filter((b) => b.type === type).every((b) => b.alive));
});

test('도각 네 종류의 새 맵과 저장을 연결하고 도각4는 파괴·복구한다', () => {
	const map = resolveMap('keyboard');
	assert.equal(resolveMap('thock-collection').id, 'keyboard');
	assert.deepEqual(map.layers, ['thock', 'thock2', 'thock3', 'thock4']);
	const saved = readSettings({
		getItem: (key) =>
			key === SETTINGS_KEY
				? JSON.stringify({ mapId: 'thock-collection', namesText: '가,나' })
				: null
	});
	assert.equal(saved.mapId, map.id);
	const custom = validateCustomMaps([
		{ id: 'custom-four', name: '도각4 두 번', layers: ['thock4', 'thock', 'thock4', 'thock2'] }
	]);
	assert.deepEqual(custom[0].layers, ['thock4', 'thock', 'thock4', 'thock2']);
	const race = createRace(['가', '나'], map.id);
	assert.deepEqual(
		race.zones.map((z) => z.type),
		map.layers
	);
	const block = race.blocks.find((b) => b.type === 'thock4');
	const marble = race.marbles[0];
	Object.assign(marble, { x: block.x, y: block.y - 28, vx: 0, vy: 200 });
	hitBlock(race, marble, block, collision(marble, block, race.time));
	assert.equal(block.alive, false);
	assert.equal(block.respawnAt, 3);
	race.marbles.forEach((m) => Object.assign(m, { x: 360, y: 50, vx: 0, vy: 0 }));
	race.time = 3;
	stepRace(race);
	assert.equal(block.alive, true);
});

test('저장한 불씨 구역만 찰칵으로 바꾸고 맵 선택·명단·다른 구역을 보존한다', () => {
	const oldMap = {
		id: 'custom-ember',
		name: '내 나무공방',
		layers: ['wood', 'ember', 'cork', 'ember']
	};
	const loaded = readSettings({
		getItem: (key) =>
			JSON.stringify(
				key === CUSTOM_MAPS_KEY
					? [oldMap]
					: { namesText: '토끼*5,오리', mapId: oldMap.id, volume: 35 }
			)
	});
	assert.equal(loaded.namesText, '토끼*5,오리');
	assert.equal(loaded.mapId, oldMap.id);
	assert.equal(loaded.volume, 35);
	assert.equal(loaded.customMaps[0].name, oldMap.name);
	assert.deepEqual(loaded.customMaps[0].layers, ['wood', 'clicky', 'cork', 'clicky']);
	assert.deepEqual(resolveMap(oldMap).layers, loaded.customMaps[0].layers);
	assert.equal(oldMap.layers[1], 'ember');
	const race = createRace(['토끼', '오리'], loaded.customMaps[0]);
	assert.ok(race.blocks.every((block) => block.type !== 'ember'));
	assert.equal(resolveMap(oldMap).types.includes('ember'), false);
});
