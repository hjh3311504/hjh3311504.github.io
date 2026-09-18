import { prepareRace, stepRace, STEP } from './physics.js';
import { createDirector, FINALE_SPEED } from './director.js';
import { createSnapshotEncoder } from './transport.js';
let encode = createSnapshotEncoder();
let race,
	director,
	cinematic,
	token = 0;
self.onmessage = async ({ data }) => {
	try {
		if (data.kind === 'prepare') {
			const current = ++token;
			race = null;
			encode = createSnapshotEncoder();
			const iterator = prepareRace(data.participants, data.map, data.seed, {
				skillsEnabled: data.skillsEnabled
			});
			let result = iterator.next();
			while (!result.done) {
				self.postMessage({ kind: 'progress', ...result.value });
				await new Promise((resolve) => setTimeout(resolve, 0));
				if (current !== token) return;
				result = iterator.next();
			}
			race = result.value;
			director = createDirector(data.mode, data.count, data.startRank);
			cinematic = director.update(race);
			self.postMessage({ kind: 'ready', state: encode(race, [], cinematic, true) });
		} else if (data.kind === 'advance' && race) {
			const events = [],
				newWinners = [];
			let remaining = Math.min(0.08, Math.max(0, data.seconds));
			// 한 요청 안에서도 연출이 끝나면 사용자가 선택한 배속으로 돌아간다.
			let endedSlow = false;
			while (remaining >= STEP / 2 && race.finished.length < race.marbles.length) {
				const speed = cinematic.active ? FINALE_SPEED : data.speed;
				if (remaining + 1e-12 < STEP / speed) break;
				events.push(...stepRace(race));
				remaining -= STEP / speed;
				cinematic = director.update(race);
				newWinners.push(...cinematic.newWinners);
				if (cinematic.finishedCelebration) endedSlow = true;
			}
			self.postMessage({
				kind: 'frame',
				state: {
					...encode(race, events, cinematic),
					cinematic: { ...cinematic, newWinners, finishedCelebration: endedSlow }
				},
				unused: remaining
			});
		}
	} catch (error) {
		self.postMessage({
			kind: 'error',
			message: error instanceof Error ? error.message : '경기를 계산하지 못했어요.'
		});
	}
};
