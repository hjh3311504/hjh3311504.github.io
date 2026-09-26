import test from 'node:test';
import assert from 'node:assert/strict';
import { createWorkerClient } from '../../src/lib/marble-race/worker-client.js';
import { createRace, stepRace } from '../../src/lib/marble-race/physics.js';
import { createSnapshotEncoder } from '../../src/lib/marble-race/transport.js';

test('연속 상태를 받으며 정지 요청의 응답만 완료하고 이전 Worker의 늦은 상태는 무시한다', async () => {
	const NativeWorker = globalThis.Worker,
		workers = [];
	const race = createRace(['공', '공'], 'keyboard', 47),
		encode = createSnapshotEncoder();
	globalThis.Worker = class {
		constructor() {
			this.sent = [];
			workers.push(this);
		}
		postMessage(data) {
			this.sent.push(data);
			if (data.kind === 'prepare')
				queueMicrotask(() =>
					this.onmessage({ data: { kind: 'ready', state: encode(race, [], null, true) } })
				);
		}
		terminate() {
			this.terminated = true;
		}
	};
	const states = [],
		errors = [];
	const client = createWorkerClient(
		(s) => states.push(s.time),
		(e) => errors.push(e)
	);
	const prepare = () =>
		client.prepare({ entries: [{ name: '공', count: 2 }], count: 2 }, 'keyboard', 47, 'last', 1);
	try {
		await prepare();
		client.run(2);
		const first = workers[0];
		const frame = (worker, serial, reply) => {
			stepRace(race);
			worker.onmessage({
				data: { kind: 'frame', stream: true, serial, reply, state: encode(race, [], null) }
			});
		};
		frame(first, 1);
		assert.equal(states.length, 1);
		assert.equal(errors.length, 0);
		assert.deepEqual(first.sent.at(-1), { kind: 'ack', serial: 1 });
		let resolved = false;
		const paused = client.pause().then(() => {
			resolved = true;
		});
		const requestId = first.sent.at(-1).requestId;
		frame(first, 2);
		await Promise.resolve();
		assert.equal(resolved, false);
		frame(first, 3, requestId);
		await paused;
		assert.equal(resolved, true);
		await prepare();
		assert.equal(first.terminated, true);
		const count = states.length;
		frame(first, 4);
		assert.equal(states.length, count);
		assert.equal(errors.length, 0);
	} finally {
		client.stop();
		globalThis.Worker = NativeWorker;
	}
});
