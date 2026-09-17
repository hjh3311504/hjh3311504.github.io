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
	assert.equal(readSettings(storage).mapId, 'crunch');
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
test('버터는 독립 접촉5회에만 파괴되고3초 뒤 원래 모양으로 복구한다', () => {
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
test('연못은 반동 없이 힘으로 감속하며 진입음은 한 번, 밖으로 빠져나온다', () => {
	const race = createRace(['가', '나']);
	const block = race.blocks.find((b) => b.type === 'pond');
	race.blocks = [block];
	race.marbles[1].finished = true;
	const m = race.marbles[0];
	Object.assign(m, { x: 360, y: block.y - block.h / 2 - 10, vx: 0, vy: 430 });
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
	assert.deepEqual(SOUND_FILES.butter, SOUND_FILES.waxball);
});
test('n번째와 마지막 당첨·슬로모션·중복 축하 방지', () => {
	for (const mode of ['first', 'last', 'multiple', 'nth']) {
		const race = createRace(['가', '가', '다']);
		const count = mode === 'first' || mode === 'last' ? 1 : 2;
		const d = createDirector(mode, count);
		race.marbles.forEach((m, i) => (m.y = race.layout.finale.start + 100 - i * 30));
		assert.equal(d.update(race).active, true);
		for (const id of [1, 0, 2]) {
			const m = race.marbles[id];
			m.finished = true;
			m.finishTime = ++race.time;
			race.finished.push(m);
			const state = d.update(race);
			assert.deepEqual(
				state.newWinners.map((m) => m.id),
				winners(race, mode, count)
					.filter((m) => m.id === id)
					.map((m) => m.id)
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
