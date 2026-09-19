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
				worker.postMessage(data);
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
