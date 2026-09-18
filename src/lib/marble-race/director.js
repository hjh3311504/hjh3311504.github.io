import { raceOrder, winners } from './physics.js';
export const FINALE_SPEED = 0.25;
export function createDirector(mode = 'first', count = 1, startRank = 1) {
	let active = false,
		complete = false,
		focus = null;
	const announced = new Set();
	return {
		update(race) {
			const selected = winners(race, mode, count, startRank);
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
				mode === 'last'
					? alive.at(-1)
					: mode === 'nth'
						? order[count - 1]
						: mode === 'multiple'
							? order[Math.max(startRank - 1, race.finished.length)]
							: alive[0];
			if (candidate && !candidate.finished) {
				focus = candidate.id;
				if (!complete && candidate.y >= race.layout.finale.rotor.y - 100) active = true;
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
