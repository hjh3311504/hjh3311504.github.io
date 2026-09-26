import { createSnapshotDecoder } from '../../src/lib/marble-race/transport.js';
import test from 'node:test';
import assert from 'node:assert/strict';
import { Worker } from 'node:worker_threads';
import { createRace, stepRace, STEP } from '../../src/lib/marble-race/physics.js';
test('스킬 시작 설정을 유지하며 Worker와 직접 계산은0.25·1·2배속에서 동일하다', async () => {
	const module = new URL('../../src/lib/marble-race/race-worker.js', import.meta.url).href;
	for (const [speed, skillsEnabled] of [
		[0.25, false],
		[1, false],
		[2, false],
		[0.25, true],
		[1, true],
		[2, true]
	]) {
		const worker = new Worker(
			`const {parentPort}=require('node:worker_threads');global.self={postMessage:data=>parentPort.postMessage(data)};import(${JSON.stringify(module)}).then(()=>parentPort.on('message',data=>self.onmessage({data})));`,
			{ eval: true }
		);
		const decode = createSnapshotDecoder();
		const request = (data) =>
			new Promise((resolve, reject) => {
				const receive = (result) => {
					if (result.kind === 'progress') return;
					worker.off('message', receive);
					worker.off('error', reject);
					result.kind === 'error'
						? reject(Error(result.message))
						: resolve({ ...result, state: decode(result.state) });
				};
				worker.on('message', receive);
				worker.once('error', reject);
				worker.postMessage(data.kind === 'advance' ? { ...data, flushState: true } : data);
			});
		try {
			await request({
				kind: 'prepare',
				skillsEnabled,
				participants: { entries: [{ name: '가', count: 30 }], count: 30 },
				map: 'keyboard',
				seed: 47,
				mode: 'nth',
				count: 12
			});
			const direct = createRace(Array(30).fill('가'), 'keyboard', 47, { skillsEnabled });
			let result;
			let sawFrozen = false;
			for (let i = 0; i < 1440; i++) {
				stepRace(direct);
				result = await request({
					kind: 'advance',
					seconds: STEP / speed,
					speed,
					skillsEnabled: !skillsEnabled
				});
				assert.deepEqual(result.state.skillWaves, direct.skills.waves);
				assert.deepEqual(
					result.state.marbles.map((m) => m.held),
					direct.marbles.map((m) => m.held)
				);
				if (!sawFrozen && result.state.marbles.some((m) => m.held?.kind === 'frost')) {
					sawFrozen = true;
					const paused = await request({ kind: 'advance', seconds: 0, speed });
					assert.equal(paused.state.time, result.state.time);
					assert.deepEqual(paused.state.marbles, result.state.marbles);
					assert.deepEqual(paused.state.skillWaves, result.state.skillWaves);
				}
			}
			assert.ok(sawFrozen, 'Worker가 동결 상태를 화면에 전달한다');
			assert.equal(result.state.time, direct.time);
			assert.deepEqual(
				result.state.marbles.map((m) => [m.x, m.y, m.vx, m.vy, m.finished]),
				direct.marbles.map((m) => [m.x, m.y, m.vx, m.vy, m.finished])
			);
			assert.deepEqual(
				result.state.finished,
				direct.finished.map((m) => m.id)
			);
		} finally {
			await worker.terminate();
		}
	}
});

test('Worker의 전체 미리보기는1000개를 전달하고 실제 경기 재준비에서 미리보기 상태를 지운다', async () => {
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
				result.kind === 'error' ? reject(Error(result.message)) : resolve(result.state);
			};
			worker.on('message', receive);
			worker.postMessage(data.kind === 'advance' ? { ...data, flushState: true } : data);
		});
	try {
		const prepare = {
			kind: 'prepare',
			participants: { entries: [{ name: '공', count: 1000 }], count: 1000 },
			map: 'keyboard',
			seed: 47,
			mode: 'first',
			count: 1
		};
		const preview = await request({ ...prepare, preview: true });
		assert.equal(preview.preview, true);
		assert.equal(preview.marbles.length, 1000);
		assert.equal(preview.cinematic, null);
		const full = await request(prepare);
		assert.equal(full.preview, false);
		assert.ok(full.blocks.length > preview.blocks.length);
		const positions = (state) => state.marbles.map(({ id, x, y, color }) => ({ id, x, y, color }));
		assert.deepEqual(positions(preview), positions(full));
	} finally {
		await worker.terminate();
	}
});

test('Worker는 긴 계산을 나눠 전달하고 남은 시간을 모두 처리해도 배속별 결과가 같다', async () => {
	const module = new URL('../../src/lib/marble-race/race-worker.js', import.meta.url).href;
	for (const clockIncrement of [0, 8, 16]) {
		const worker = new Worker(
			`const {parentPort}=require('node:worker_threads');let clock=0;global.performance={now:()=>clock+=${clockIncrement}};global.self={postMessage:data=>parentPort.postMessage(data)};import(${JSON.stringify(module)}).then(()=>parentPort.on('message',data=>self.onmessage({data})));`,
			{ eval: true }
		);
		let decode;
		const request = (data) =>
			new Promise((resolve, reject) => {
				const receive = (result) => {
					if (result.kind === 'progress') return;
					worker.off('message', receive);
					worker.off('error', reject);
					if (result.kind === 'error') reject(Error(result.message));
					else resolve({ ...result, state: decode(result.state) });
				};
				worker.on('message', receive);
				worker.once('error', reject);
				worker.postMessage(data.kind === 'advance' ? { ...data, flushState: true } : data);
			});
		try {
			for (const speed of [0.25, 1, 2]) {
				decode = createSnapshotDecoder();
				await request({
					kind: 'prepare',
					participants: { entries: [{ name: '공', count: 10 }], count: 10 },
					map: 'keyboard',
					seed: 47,
					mode: 'first',
					count: 1,
					skillsEnabled: true
				});
				const direct = createRace(Array(10).fill('공'), 'keyboard', 47, { skillsEnabled: true });
				let remaining = 0.2,
					result,
					requests = 0;
				while (remaining + 1e-12 >= STEP / speed) {
					result = await request({ kind: 'advance', seconds: remaining, speed });
					assert.equal(result.kind, 'frame');
					assert.ok(result.unused < remaining);
					remaining = result.unused;
					if (++requests === 1) {
						const expectedSteps = Math.min(
							{ 0: 32, 8: 6, 16: 3 }[clockIncrement],
							Math.round((0.2 * speed) / STEP)
						);
						assert.ok(Math.abs(result.state.time - expectedSteps * STEP) < 1e-12);
					}
					assert.ok(requests < 100);
				}
				for (let i = 0; i < Math.round((0.2 * speed) / STEP); i++) stepRace(direct);
				assert.equal(result.state.time, direct.time);
				assert.deepEqual(
					result.state.marbles.map((m) => [m.x, m.y, m.vx, m.vy, m.finished]),
					direct.marbles.map((m) => [m.x, m.y, m.vx, m.vy, m.finished])
				);
				const idle = await request({ kind: 'advance', seconds: remaining, speed });
				assert.equal(idle.kind, 'idle');
				assert.equal(idle.unused, remaining);
				assert.equal(idle.state.time, result.state.time);
			}
		} finally {
			await worker.terminate();
		}
	}
});

test('밀린 계산 중에도 필수 감속 시작과 당첨을 해당 물리 단계에서 즉시 전달한다', async () => {
	const { createDirector } = await import('../../src/lib/marble-race/director.js');
	const module = new URL('../../src/lib/marble-race/race-worker.js', import.meta.url).href;
	const worker = new Worker(
		`const {parentPort}=require('node:worker_threads');global.performance={now:()=>0};global.self={postMessage:data=>parentPort.postMessage(data)};import(${JSON.stringify(module)}).then(()=>parentPort.on('message',data=>self.onmessage({data})));`,
		{ eval: true }
	);
	const request = (data) =>
		new Promise((resolve, reject) => {
			const receive = (result) => {
				if (result.kind === 'progress') return;
				worker.off('message', receive);
				result.kind === 'error' ? reject(Error(result.message)) : resolve(result);
			};
			worker.on('message', receive);
			worker.postMessage(data);
		});
	try {
		await request({
			kind: 'prepare',
			participants: { entries: [{ name: '공', count: 2 }], count: 2 },
			map: 'keyboard',
			seed: 47,
			mode: 'first',
			count: 1,
			skillsEnabled: false
		});
		const race = createRace(['공', '공'], 'keyboard', 47),
			director = createDirector();
		const checkpoints = [];
		let previous = director.update(race);
		for (let step = 0; step < 120 * 180 && !previous.complete; step++) {
			stepRace(race);
			const current = director.update(race);
			if (current.active !== previous.active || current.newWinners.length)
				checkpoints.push({
					time: race.time,
					active: current.active,
					winners: current.newWinners.map((m) => m.id)
				});
			previous = current;
		}
		assert.equal(checkpoints.length, 2);
		const received = [];
		for (let i = 0; i < 2000 && received.length < checkpoints.length; i++) {
			const result = await request({ kind: 'advance', seconds: 1, speed: 2 });
			// 검사 시계를 고정해 일반 상태를 묶는다. 중요한 전환만 즉시 나온다.
			if (result.kind === 'frame')
				received.push({
					time: result.state.time,
					active: result.state.cinematic.active,
					winners: result.state.cinematic.newWinners.map((m) => m.id)
				});
		}
		assert.deepEqual(received, checkpoints);
	} finally {
		await worker.terminate();
	}
});
