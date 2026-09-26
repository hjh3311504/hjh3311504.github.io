import { installMarbleWire } from './marble-wire.js';
export async function screenRace(page, { ranking = false } = {}) {
	await installMarbleWire(page);
	await page.addInitScript((ranking) => {
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
				state.time = 30 + (this.frames = (this.frames ?? 0) + 1) / 120;
				state.events = [];
				const count =
					window.__racePhase === 'finished'
						? state.marbles.length
						: (window.__raceFinishedCount ?? 0);
				state.finished = state.marbles.slice(0, count).map((m) => m.id);
				for (const m of state.marbles) {
					m.finished = m.id < count;
					m.y = state.layout.finish.y - 100;
					if (ranking) {
						// 순위 화면 검사는 결승의 좁은 통로에1000개를 강제로 겹쳐 놓지 않는다.
						const position =
							window.__raceRankingSwap && (m.id === 499 || m.id === 500) ? 999 - m.id : m.id;
						m.x = 25 + (position % 26) * 26;
						m.y =
							state.layout.finale.start -
							100 -
							Math.floor(position / 26) * 28 -
							(position % 26) * 0.01;
					} else if (window.__raceOverlapping) {
						m.x = 350 + m.id * 10;
						m.y = state.layout.finale.start + 300 + m.id * 10;
					}
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
					focusId:
						window.__raceFocusId ?? (mode === 'multiple' ? Math.max(startRank - 1, count) : 0),
					newWinners: selected.filter((m) => !this.announced.has(m.id)),
					finishedCelebration: this.wasActive && !active
				};
				selected.forEach((m) => this.announced.add(m.id));
				this.wasActive = active;
				if (window.__raceDisplayFrame) {
					const frame = window.__raceDisplayFrame;
					state.time = frame.time;
					state.marbles.forEach((marble, index) => Object.assign(marble, frame.marbles[index]));
					state.cinematic = { ...frame.cinematic };
					const index = state.blocks.findIndex((block) => block.id === 'finale-bar');
					state.blockChanges = [{ index, changes: { phase: frame.phase } }];
				}
				window.__packMarbleState(state);
				queueMicrotask(() =>
					this.dispatchEvent(
						new MessageEvent('message', { data: { kind: 'frame', state, unused: 0 } })
					)
				);
			}
		};
	}, ranking);
}
