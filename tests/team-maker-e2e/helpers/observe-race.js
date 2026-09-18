import {
	createDrainMonitor,
	remainingDiagnostics
} from '../../marble-race/helpers/race-progress.js';

export async function observeRace(page, seed = 47) {
	await page.addInitScript(`window.__createDrainMonitor = ${createDrainMonitor.toString()};`);
	await page.addInitScript(
		({ seed }) => {
			const NativeWorker = window.Worker;
			window.Worker = class extends NativeWorker {
				constructor(...args) {
					super(...args);
					this.addEventListener('message', ({ data }) => {
						if (data.kind === 'ready') {
							this.observed = structuredClone(data.state);
							this.monitor = window.__createDrainMonitor(data.state.layout);
							this.started = performance.now();
							window.__at270 = null;
						} else if (data.kind === 'frame' && this.observed) {
							const state = this.observed;
							for (const m of data.state.marbles) Object.assign(state.marbles[m.id], m);
							for (const patch of data.state.blockChanges)
								Object.assign(state.blocks[patch.index], patch.changes);
							Object.assign(state, {
								time: data.state.time,
								finished: data.state.finished,
								cinematic: data.state.cinematic
							});
							window.__drain = this.monitor.observe(state);
							window.__raceState = state;
							window.__raceWall = (performance.now() - this.started) / 1000;
							if (!window.__at270 && window.__raceWall >= 270)
								window.__at270 = {
									time: state.time,
									arrived: state.finished.length,
									wall: window.__raceWall
								};
						}
					});
				}
				postMessage(data) {
					if (data.kind === 'prepare') data = { ...data, seed };
					return super.postMessage(data);
				}
			};
		},
		{ seed }
	);
}

export async function attachRaceProgress(page, info) {
	const result = await page.evaluate(() => ({
		state: window.__raceState,
		progress: window.__drain,
		wallSeconds: window.__raceWall,
		at270: window.__at270
	}));
	if (!result.state) return null;
	const detail = {
		...remainingDiagnostics(
			{ ...result.state, seed: 47, map: { id: 'keyboard' } },
			result.progress
		),
		wallSeconds: result.wallSeconds,
		at270: result.at270
	};
	await info.attach('완주와 배출 정체 기록', {
		body: JSON.stringify(detail),
		contentType: 'application/json'
	});
	return detail;
}
