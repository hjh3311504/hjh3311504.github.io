import test from 'node:test';
import assert from 'node:assert/strict';
import { Worker } from 'node:worker_threads';
import {
	parseDrawRange,
	validateDraw,
	readSettings,
	SETTINGS_KEY,
	createSettingsWriter
} from '../../src/lib/marble-race/settings.js';
import { createRace, winners, stepRace, STEP } from '../../src/lib/marble-race/physics.js';
import { createDirector, FINALE_SPEED } from '../../src/lib/marble-race/director.js';

test('당첨 범위는 양 끝을 포함하고 잘못된 순위와 안전하지 않은 정수를 거부한다', () => {
	assert.deepEqual(parseDrawRange('4~6', 30), { start: 4, end: 6, count: 3, error: '' });
	assert.deepEqual(parseDrawRange(' 4 ~ 6 ', 6), { start: 4, end: 6, count: 3, error: '' });
	assert.deepEqual(parseDrawRange('6~6', 6), { start: 6, end: 6, count: 1, error: '' });
	assert.equal(parseDrawRange('1~1001', 1001).count, 1001);
	for (const input of [
		'',
		'4',
		'4~',
		'~6',
		'4-6',
		'4~6~8',
		'6~4',
		'0~2',
		'-1~2',
		'1.5~3',
		'1~7',
		'1~9007199254740992',
		'4e0~6',
		'1~Infinity'
	])
		assert.ok(parseDrawRange(input, 6).error, input);
	assert.equal(validateDraw('multiple', 3, 1, 6, 4), '');
	assert.ok(validateDraw('multiple', 4, 1, 6, 4));
	assert.equal(validateDraw('multiple', 1, 1, 6, 6), '');
});

test('이전 당첨 인원은1부터 시작하는 범위로 복구하고 새 범위는 저장 후 유지한다', () => {
	const values = new Map([
		[SETTINGS_KEY, JSON.stringify({ namesText: '공*10', mode: 'multiple', count: 5, volume: 22 })]
	]);
	const storage = {
		getItem: (key) => values.get(key),
		setItem: (key, value) => values.set(key, value)
	};
	const old = readSettings(storage);
	assert.equal(old.rangeText, '1~5');
	assert.equal(old.namesText, '공*10');
	assert.equal(old.volume, 22);
	const writer = createSettingsWriter(storage, assert.fail);
	writer.schedule({ ...old, rangeText: '4~6', count: 3 }, []);
	writer.flush();
	assert.equal(readSettings(storage).rangeText, '4~6');
	writer.destroy();
	values.set(SETTINGS_KEY, JSON.stringify({ mode: 'multiple', count: 5, rangeText: { start: 4 } }));
	assert.equal(readSettings(storage).rangeText, '1~5');
	values.set(SETTINGS_KEY, JSON.stringify({ mode: 'multiple', rangeText: '6~4' }));
	assert.ok(parseDrawRange(readSettings(storage).rangeText, 10).error);
});

test('4~6 당첨은 구슬 번호와 이름이 아니라 실제 도착 순위로 결정한다', () => {
	const race = createRace(Array(8).fill('같은이름'));
	const arrivalIds = [7, 3, 5, 1, 6, 0, 4, 2];
	for (const [rank, id] of arrivalIds.entries()) {
		race.marbles[id].finished = true;
		race.finished.push(race.marbles[id]);
		assert.deepEqual(
			winners(race, 'multiple', 3, 4).map((m) => m.id),
			arrivalIds.slice(3, Math.min(6, rank + 1))
		);
	}
	assert.deepEqual(
		winners(race, 'multiple', 1, 8).map((m) => m.id),
		[2]
	);
	assert.deepEqual(
		winners(race, 'multiple', 8, 1).map((m) => m.id),
		arrivalIds
	);
	assert.deepEqual(
		winners(race, 'first').map((m) => m.id),
		[7]
	);
	assert.deepEqual(
		winners(race, 'last').map((m) => m.id),
		[2]
	);
	assert.deepEqual(
		winners(race, 'nth', 4).map((m) => m.id),
		[1]
	);
	assert.deepEqual(winners(race, 'multiple', 3, 7), []);
});

test('범위 시작 후보부터 추적하고4·5·6번째만 축하하며 마지막 당첨 뒤 슬로모션을 해제한다', () => {
	const race = createRace(Array(8).fill('같은이름'));
	const director = createDirector('multiple', 3, 4);
	const threshold = race.layout.finale.rotor.y - 100;
	race.marbles.forEach((m, i) => {
		m.y = threshold + 50 - i * 25;
	});
	let state = director.update(race);
	assert.equal(state.focusId, 3);
	assert.equal(state.active, false);
	race.marbles[3].y = threshold;
	assert.equal(director.update(race).active, true);
	for (let i = 0; i < 8; i++) {
		const marble = race.marbles[i];
		marble.finished = true;
		race.finished.push(marble);
		state = director.update(race);
		assert.deepEqual(
			state.newWinners.map((m) => m.id),
			i >= 3 && i <= 5 ? [i] : []
		);
		assert.equal(state.complete, i >= 5);
		assert.equal(state.active, i < 5);
		assert.equal(state.finishedCelebration, i === 5);
		if (i < 5) assert.equal(state.focusId, Math.max(3, i + 1));
		assert.deepEqual(director.update(race).newWinners, []);
	}
});

test('같은 계산에 여러 순위가 도착해도 범위 안의 당첨만 한 번 발표한다', () => {
	const race = createRace(Array(8).fill('공'));
	const director = createDirector('multiple', 3, 4);
	race.finished = race.marbles.slice(0, 7);
	race.finished.forEach((m) => {
		m.finished = true;
	});
	const state = director.update(race);
	assert.deepEqual(
		state.newWinners.map((m) => m.id),
		[3, 4, 5]
	);
	assert.equal(state.complete, true);
	assert.deepEqual(director.update(race).newWinners, []);
});

test('실제 Worker는 당첨 확정 프레임부터 선택한2배속을 복구하고 직접 계산과 일치한다', async () => {
	const module = new URL('../../src/lib/marble-race/race-worker.js', import.meta.url).href;
	const worker = new Worker(
		`const {parentPort}=require('node:worker_threads');global.self={postMessage:data=>parentPort.postMessage(data)};import(${JSON.stringify(module)}).then(()=>parentPort.on('message',data=>self.onmessage({data})));`,
		{ eval: true }
	);
	const request = (data) =>
		new Promise((resolve, reject) => {
			const receive = (result) => {
				if (result.kind === 'progress') return;
				worker.off('message', receive);
				worker.off('error', reject);
				result.kind === 'error' ? reject(Error(result.message)) : resolve(result);
			};
			worker.on('message', receive);
			worker.once('error', reject);
			worker.postMessage(data);
		});
	try {
		await request({
			kind: 'prepare',
			participants: { entries: [{ name: '공', count: 8 }], count: 8 },
			map: 'keyboard',
			seed: 47,
			mode: 'multiple',
			count: 3,
			startRank: 4
		});
		const direct = createRace(Array(8).fill('공'), 'keyboard', 47);
		const director = createDirector('multiple', 3, 4);
		let expected = director.update(direct),
			state,
			sawRestoredSpeed = false;
		const speed = 2;
		const announced = [];
		for (let frame = 0; frame < 4000; frame++) {
			({ state } = await request({ kind: 'advance', seconds: 0.08, speed }));
			const expectedWinners = [];
			let remaining = 0.08;
			while (remaining >= STEP / 2 && direct.finished.length < direct.marbles.length) {
				const effectiveSpeed = expected.active ? FINALE_SPEED : speed;
				if (remaining + 1e-12 < STEP / effectiveSpeed) break;
				remaining -= STEP / effectiveSpeed;
				stepRace(direct);
				expected = director.update(direct);
				expectedWinners.push(...expected.newWinners.map((m) => m.id));
			}
			assert.equal(state.time, direct.time, '결승 연출 전후에도 같은 실제 시간만큼 계산한다');
			assert.deepEqual(
				state.cinematic.newWinners.map((m) => m.id),
				expectedWinners
			);
			assert.equal(state.cinematic.focusId, expected.focusId);
			assert.equal(state.cinematic.active, expected.active);
			announced.push(...state.cinematic.newWinners.map((m) => m.id));
			if (state.cinematic.finishedCelebration) sawRestoredSpeed = true;
			if (state.finished.length === 8) break;
		}
		assert.ok(sawRestoredSpeed, '결승 슬로모션이 종료되는 프레임을 검사한다');
		assert.equal(state.finished.length, 8);
		assert.deepEqual(announced, state.finished.slice(3, 6));
		assert.equal(new Set(announced).size, 3);
	} finally {
		await worker.terminate();
	}
});
