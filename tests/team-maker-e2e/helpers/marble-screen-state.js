export async function screenRace(page) {
	await page.addInitScript(() => {
		window.__racePhase = 'running';
		const NativeWorker = window.Worker;
		window.Worker = class extends NativeWorker {
			constructor(...args) {
				super(...args);
				this.addEventListener('message', ({ data }) => {
					if (data.kind === 'ready') {
						this.initialState = structuredClone(data.state);
						this.announced = new Set();
						this.wasActive = false;
					}
				});
			}
			postMessage(data) {
				if (data.kind === 'prepare') {
					this.settings = { mode: data.mode, count: data.count, startRank: data.startRank ?? 1 };
					window.__raceDrawSettings = this.settings;
				}
				if (data.kind !== 'advance' || !this.initialState) return super.postMessage(data);
				window.__raceRequestedSpeed = data.speed;
				const state = structuredClone(this.initialState);
				state.initial = false;
				state.blockChanges = [];
				state.time = 30;
				state.events = [];
				const count =
					window.__racePhase === 'finished'
						? state.marbles.length
						: (window.__raceFinishedCount ?? 0);
				state.finished = state.marbles.slice(0, count).map((m) => m.id);
				for (const m of state.marbles) {
					m.finished = m.id < count;
					m.y = state.layout.finish.y - 100;
				}
				const { mode, count: drawCount, startRank } = this.settings;
				const arrived = state.marbles.slice(0, count);
				const selected =
					mode === 'multiple'
						? arrived.slice(startRank - 1, startRank - 1 + drawCount)
						: mode === 'nth'
							? arrived.slice(drawCount - 1, drawCount)
							: mode === 'last'
								? count === state.marbles.length
									? arrived.slice(-1)
									: []
								: arrived.slice(0, 1);
				const complete = selected.length >= (mode === 'multiple' ? drawCount : 1);
				const active = window.__racePhase === 'finale' && !complete;
				state.cinematic = {
					active,
					complete,
					focusId: mode === 'multiple' ? Math.max(startRank - 1, count) : 0,
					newWinners: selected.filter((m) => !this.announced.has(m.id)),
					finishedCelebration: this.wasActive && !active
				};
				selected.forEach((m) => this.announced.add(m.id));
				this.wasActive = active;
				queueMicrotask(() =>
					this.dispatchEvent(
						new MessageEvent('message', { data: { kind: 'frame', state, unused: 0 } })
					)
				);
			}
		};
	});
}
