import { collision } from '../../../src/lib/marble-race/physics.js';

// 브라우저에서도 같은 함수를 주입한다. 경기의 힘·속도·배치를 변경하지 않는다.
export function createDrainMonitor(layout) {
	let since = null,
		arrived = 0,
		lastArrival = null,
		maxGap = 0;
	const stalls = [],
		arrivals = [];
	let reported = false;
	return {
		observe(state) {
			const waiting = state.marbles.some(
				(m) => !m.finished && m.y >= layout.finale.mouthY - 100 && m.y <= layout.finale.mouthY + 30
			);
			if (state.finished.length > arrived) {
				if (since !== null) maxGap = Math.max(maxGap, state.time - since);
				lastArrival = state.time;
				arrivals.push({ time: state.time, count: state.finished.length });
				if (arrivals.length > 20) arrivals.shift();
				arrived = state.finished.length;
				since = waiting ? state.time : null;
				reported = false;
			} else if (!waiting) {
				since = null;
				reported = false;
			} else {
				since ??= state.time;
				maxGap = Math.max(maxGap, state.time - since);
				if (!reported && state.time - since > 8.8 + 1e-6) {
					stalls.push({ time: state.time, arrived, waitingSeconds: state.time - since });
					reported = true;
				}
			}
			return { time: state.time, arrived, lastArrival, maxGap, stalls, arrivals };
		}
	};
}

export function remainingDiagnostics(race, progress) {
	return {
		seed: race.seed,
		map: race.map.id,
		...progress,
		remaining: race.marbles
			.filter((m) => !m.finished)
			.map((m) => ({
				id: m.id,
				x: m.x,
				y: m.y,
				vx: m.vx,
				vy: m.vy,
				contacts: race.blocks.filter((b) => b.alive && collision(m, b, race.time)).map((b) => b.id)
			}))
	};
}
