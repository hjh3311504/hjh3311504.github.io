import test from 'node:test';
import assert from 'node:assert/strict';
import { createRace, stepRace } from '../../src/lib/marble-race/physics.js';
import { createDrainMonitor, remainingDiagnostics } from './helpers/race-progress.js';

test('1,000개는600경기초 안에 배출 정체·중복 도착 없이 전원 완주한다', (t) => {
	const race = createRace(Array(1000).fill('완주'), 'keyboard', 47);
	const monitor = createDrainMonitor(race.layout);
	const started = performance.now();
	let progress;
	while (race.time < 600 && race.finished.length < 1000) {
		stepRace(race);
		progress = monitor.observe(race);
		if (progress.stalls.length) break;
	}
	const detail = JSON.stringify(remainingDiagnostics(race, progress));
	assert.deepEqual(progress.stalls, [], detail);
	assert.equal(race.finished.length, 1000, detail);
	assert.equal(new Set(race.finished.map((m) => m.id)).size, 1000);
	t.diagnostic(
		JSON.stringify({
			seed: 47,
			count: 1000,
			gameSeconds: race.time,
			cpuSeconds: (performance.now() - started) / 1000,
			lastArrival: progress.lastArrival,
			maxGap: progress.maxGap
		})
	);
});
