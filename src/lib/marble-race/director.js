import { raceOrder, winners } from './physics.js';
export const FINALE_SPEED = 0.3;
export function createDirector(mode = 'first', count = 1) {
	let active = false,
		complete = false,
		focus = null,
		pending = null,
		since = 0;
	const announced = new Set();
	return {
		update(race) {
			const selected = winners(race, mode, count);
			const newWinners = selected.filter((m) => !announced.has(m.id));
			newWinners.forEach((m) => announced.add(m.id));
			const enough = selected.length >= (mode === 'multiple' ? count : 1);
			const wasActive = active;
			if (enough) {
				complete = true;
				active = false;
			}
			const order = raceOrder(race),
				alive = order.slice(race.finished.length);
			const candidate =
				mode === 'last' ? alive.at(-1) : mode === 'nth' ? order[count - 1] : alive[0];
			if (candidate && !candidate.finished) {
				if (focus === null) {
					focus = candidate.id;
				}
				if (candidate.id !== focus) {
					if (pending !== candidate.id) {
						pending = candidate.id;
						since = race.time;
					} else if (race.time - since >= 0.3) {
						focus = candidate.id;
						pending = null;
					}
				} else pending = null;
				if (!complete && candidate.y >= race.layout.finale.start) active = true;
			}
			return {
				active,
				complete,
				focusId: focus,
				newWinners,
				finishedCelebration: wasActive && !active
			};
		}
	};
}
