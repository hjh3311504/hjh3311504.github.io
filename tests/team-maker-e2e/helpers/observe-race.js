export async function observeRace(page, seed = 47) {
	await page.addInitScript(
		({ seed }) => {
			const NativeWorker = window.Worker;
			window.Worker = class extends NativeWorker {
				constructor(...args) {
					super(...args);
					this.addEventListener('message', ({ data }) => {
						if (data.kind === 'ready') {
							this.observed = structuredClone(data.state);
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
							window.__raceState = state;
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
