import test from 'node:test';
import assert from 'node:assert/strict';
import { createRace, stepRace } from '../../src/lib/marble-race/physics.js';
import {
	createSnapshotEncoder,
	createSnapshotDecoder
} from '../../src/lib/marble-race/transport.js';
import { createDrainMonitor } from './helpers/race-progress.js';

test('증분 전송은 파괴·압축·복구와 구슬 상태를 원래 값 그대로 복원한다', () => {
	const race = createRace(Array(30).fill('이름'), 'keyboard', 47);
	const encode = createSnapshotEncoder(),
		decode = createSnapshotDecoder();
	decode(structuredClone(encode(race, [], null, true)));
	let state;
	const block = race.blocks.find((b) => b.type === 'butter');
	for (const change of [
		{ h: 38, hp: 2, flash: 1 },
		{ alive: false, respawnAt: 4, breakCycle: 1 },
		{ alive: true, h: 64, hp: 5, respawnAt: null }
	]) {
		Object.assign(block, change);
		const wire = structuredClone(encode(race));
		assert.equal(wire.blockChanges.length, 1);
		assert.equal(wire.blocks, undefined);
		assert.equal(wire.layout, undefined);
		assert.equal(wire.zones, undefined);
		assert.equal(wire.marbles, undefined);
		assert.ok(wire.marbleValues instanceof Float64Array);
		state = decode(wire);
		assert.deepEqual(state.blocks, race.blocks);
	}
	for (let i = 0; i < 600; i++) {
		stepRace(race);
		state = decode(structuredClone(encode(race, race.events)));
		assert.deepEqual(state.blocks, race.blocks);
		assert.equal(state.marbles[0].name, '이름');
		assert.deepEqual(
			state.marbles.map((m) => [m.x, m.y, m.held, m.finished]),
			race.marbles.map((m) => [m.x, m.y, m.held, m.finished])
		);
	}
	assert.deepEqual(encode(race).blockChanges, []);
	const next = createRace(['새 이름', '다른 이름'], 'soft', 2);
	state = decode(structuredClone(encode(next, [], null, true)));
	assert.equal(state.marbles.length, 2);
	assert.equal(state.marbles[0].name, '새 이름');
	assert.deepEqual(state.blocks, next.blocks);
});

test('1,000개 경기의 정지 프레임은 전체 스냅샷보다 전송량이 작다', (t) => {
	const race = createRace(Array(1000).fill('참가자'), 'keyboard', 47);
	const encode = createSnapshotEncoder();
	const full = encode(race, [], null, true);
	const delta = encode(race);
	const bytes = (value) => Buffer.byteLength(JSON.stringify(value));
	assert.ok(bytes(delta) < bytes(full) * 0.3);
	assert.equal(delta.blockChanges.length, 0);
	t.diagnostic(`전체 ${bytes(full)}바이트 → 변경 프레임 ${bytes(delta)}바이트`);
});

test('배출 감시는 대기8.8초·추가 도착·대기 해소·최근 도착 기록을 구분한다', () => {
	const monitor = createDrainMonitor({ finale: { mouthY: 400 } });
	const state = { time: 0, finished: [], marbles: [{ y: 350, finished: false }] };
	monitor.observe(state);
	state.time = 8.8;
	assert.equal(monitor.observe(state).stalls.length, 0);
	state.time = 8.81;
	assert.equal(monitor.observe(state).stalls.length, 1);
	state.time = 10;
	state.finished.push(0);
	assert.equal(monitor.observe(state).lastArrival, 10);
	state.time = 15;
	assert.equal(monitor.observe(state).stalls.length, 1);
	state.marbles[0].y = 100;
	monitor.observe(state);
	state.time = 30;
	state.marbles[0].y = 350;
	assert.equal(monitor.observe(state).stalls.length, 1);
});

test('재시작 뒤 이전 Worker 응답은 새 경기 준비와 프레임을 건드리지 않는다', async () => {
	const { createWorkerClient } = await import('../../src/lib/marble-race/worker-client.js');
	const NativeWorker = globalThis.Worker;
	const workers = [];
	globalThis.Worker = class {
		constructor() {
			workers.push(this);
		}
		postMessage() {}
		terminate() {}
		emit(data) {
			this.onmessage({ data });
		}
	};
	const client = createWorkerClient();
	try {
		const names = { entries: [{ name: '공', count: 2 }], count: 2 };
		const first = client.prepare(names, 'keyboard', 1, 'first', 1);
		const cancelled = assert.rejects(first, /준비를 취소/);
		const second = client.prepare(names, 'soft', 2, 'first', 1);
		const oldEncoder = createSnapshotEncoder(),
			encoder = createSnapshotEncoder();
		const old = createRace(['이전', '이전'], 'keyboard', 1),
			race = createRace(['새', '새'], 'soft', 2);
		workers[0].emit({ kind: 'ready', state: oldEncoder(old, [], null, true) });
		workers[1].emit({ kind: 'ready', state: structuredClone(encoder(race, [], null, true)) });
		assert.equal((await second).marbles[0].name, '새');
		await cancelled;
		const frame = client.advance(0.01, 1);
		workers[0].emit({ kind: 'frame', state: oldEncoder(old) });
		stepRace(race);
		workers[1].emit({ kind: 'frame', state: structuredClone(encoder(race)) });
		assert.equal((await frame).state.time, race.time);
	} finally {
		client.stop();
		globalThis.Worker = NativeWorker;
	}
});

test('빠른 블록 변경 비교는 모든 전송 항목과 특수 값·항목이 적은 블록을 보존한다', () => {
	const keys = ['x', 'y', 'h', 'hp', 'alive', 'flash', 'respawnAt', 'breakCycle', 'tilt'];
	for (const partial of [false, true]) {
		const race = createRace(['가', '나'], 'keyboard', 47);
		race.blocks = [partial ? { id: '부분', x: 10, alive: true } : race.blocks[0]];
		const encode = createSnapshotEncoder(),
			decode = createSnapshotDecoder();
		decode(structuredClone(encode(race, [], null, true)));
		for (const key of keys) {
			if (!(key in race.blocks[0])) continue;
			for (const value of [1, -0, NaN, undefined, null]) {
				race.blocks[0][key] = value;
				assert.deepEqual(decode(structuredClone(encode(race))).blocks, race.blocks);
				assert.deepEqual(encode(race).blockChanges, []);
			}
		}
		if (partial) {
			race.blocks[0].h = 25;
			assert.deepEqual(encode(race).blockChanges, []);
		}
	}
});
