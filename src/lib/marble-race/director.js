import { raceOrder, winners, followedMarble } from './physics.js';
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
			let candidate;
			if (mode === 'first' || mode === 'last') {
				candidate = followedMarble(race, mode, '-1');
				// 기존 마지막 순위의 같은 높이에서는 큰 번호가 뒤에 온다.
				if (mode === 'last' && candidate)
					for (const marble of race.marbles)
						if (!marble.finished && marble.y === candidate.y && marble.id > candidate.id)
							candidate = marble;
			} else {
				const order = raceOrder(race);
				candidate =
					mode === 'nth' ? order[count - 1] : order[Math.max(startRank - 1, race.finished.length)];
			}
			if (candidate && !candidate.finished) {
				focus = candidate.id;
				if (!complete && candidate.y >= race.layout.finale.mouthY - 100) active = true;
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
