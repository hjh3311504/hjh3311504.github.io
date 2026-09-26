import test from 'node:test';
import assert from 'node:assert/strict';
import { Worker } from 'node:worker_threads';
import { createFrameBatch } from '../../src/lib/marble-race/frame-batch.js';
import { createRace, stepRace, STEP } from '../../src/lib/marble-race/physics.js';
import { createSnapshotDecoder } from '../../src/lib/marble-race/transport.js';

test('일반 상태는60회/초로 묶고 중요 전환은 즉시 전달하며 이벤트는 한 번만 보낸다', () => {
	const batch = createFrameBatch();
	batch.reset(0);
	batch.add([{ id: 1 }]);
	batch.add([{ id: 2 }]);
	assert.equal(batch.ready(16), false);
	assert.equal(batch.ready(1000 / 60), true);
	assert.deepEqual(batch.take(1000 / 60), [{ id: 1 }, { id: 2 }]);
	assert.equal(batch.ready(17), false);
	assert.equal(batch.ready(17, true), true);
	assert.deepEqual(batch.take(17), []);
	batch.add([{ id: 3 }]);
	batch.reset(20);
	assert.deepEqual(batch.take(21), []);
});

test('Worker 상태를 묶어도 계산·이벤트가 보존되고 정지 시 최신 상태를 별도로 가져온다', async () => {
	const module = new URL('../../src/lib/marble-race/race-worker.js', import.meta.url).href;
	const worker = new Worker(
		`const {parentPort}=require('node:worker_threads');let clock=0;global.performance={now:()=>clock};global.self={postMessage:data=>parentPort.postMessage(data)};import(${JSON.stringify(module)}).then(()=>parentPort.on('message',data=>{clock=data.testNow??clock;self.onmessage({data});}));`,
		{ eval: true }
	);
	const request = (data) =>
		new Promise((resolve, reject) => {
			const receive = (result) => {
				if (result.kind === 'progress') return;
				worker.off('message', receive);
				worker.off('error', reject);
				if (result.kind === 'error') reject(Error(result.message));
				else resolve(result);
			};
			worker.on('message', receive);
			worker.once('error', reject);
			worker.postMessage(data);
		});
	try {
		const prepare = {
			kind: 'prepare',
			participants: { entries: [{ name: '공', count: 30 }], count: 30 },
			map: 'keyboard',
			seed: 47,
			mode: 'last',
			count: 1,
			skillsEnabled: true,
			testNow: 0
		};
		const decode = createSnapshotDecoder();
		decode((await request(prepare)).state);
		const direct = createRace(Array(30).fill('공'), 'keyboard', 47, { skillsEnabled: true });
		const expected = [],
			received = [];
		let frames = 0,
			light = 0;
		for (let i = 1; i <= 600; i++) {
			expected.push(...stepRace(direct));
			const result = await request({
				kind: 'advance',
				seconds: STEP / 2,
				speed: 2,
				testNow: i * 4
			});
			if (result.kind === 'advanced') {
				light++;
				assert.equal(result.state, undefined);
			} else {
				frames++;
				received.push(...result.state.events);
				decode(result.state);
			}
		}
		assert.ok(light > frames && frames <= 150);
		const latest = await request({ kind: 'snapshot', testNow: 2401 });
		received.push(...latest.state.events);
		const state = decode(latest.state);
		assert.equal(state.time, direct.time);
		assert.deepEqual(
			state.marbles.map((m) => [m.x, m.y, m.vx, m.vy]),
			direct.marbles.map((m) => [m.x, m.y, m.vx, m.vy])
		);
		assert.ok(expected.length > 0);
		assert.deepEqual(received, expected);
		assert.deepEqual((await request({ kind: 'snapshot' })).state.events, []);
		await request({ kind: 'advance', seconds: STEP, speed: 1 });
		await request(prepare);
		const fresh = await request({ kind: 'snapshot' });
		assert.equal(fresh.state.time, 0);
		assert.deepEqual(fresh.state.events, []);
		// 늘어난 요청 상한까지 묶어 계산해도 스킬·충돌 이벤트와 상태가 빠지지 않는다.
		const restarted = createRace(Array(30).fill('공'), 'keyboard', 47, { skillsEnabled: true });
		const groupedEvents = [];
		for (let i = 0; i < 100; i++) {
			for (let step = 0; step < 8; step++) groupedEvents.push(...stepRace(restarted));
			const grouped = await request({ kind: 'advance', seconds: (8 * STEP) / 2, speed: 2 });
			assert.equal(grouped.kind, 'advanced');
			assert.ok(grouped.unused < 1e-12);
		}
		const grouped = (await request({ kind: 'snapshot' })).state;
		assert.equal(grouped.time, restarted.time);
		assert.deepEqual(grouped.events, groupedEvents);
		assert.deepEqual(grouped.skillWaves, restarted.skills.waves);
		assert.deepEqual(
			[...grouped.marbleValues],
			restarted.marbles.flatMap((m) => [
				m.x,
				m.y,
				m.vx,
				m.vy,
				Number(m.finished),
				m.finishTime ?? NaN,
				m.windUntil,
				m.windDirection
			])
		);
		assert.deepEqual((await request({ kind: 'snapshot' })).state.events, []);
	} finally {
		await worker.terminate();
	}
});
