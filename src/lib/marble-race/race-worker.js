import { prepareRace, stepRace, STEP } from './physics.js';
import { createDirector, FINALE_SPEED } from './director.js';
import { createSnapshotEncoder } from './transport.js';
import { createFrameBatch } from './frame-batch.js';
const frames = createFrameBatch();
let encode = createSnapshotEncoder();
const ADVANCE_BUDGET_MS = 12;
// 2배속의4단계는 실제16.7ms뿐이다. 모바일 화면 작업으로 응답이 늦어져도
// 12ms 계산 예산 안에서8단계까지 처리해 밀린 시간을 따라잡을 여유를 둔다.
const MAX_ADVANCE_STEPS = 8;
const CATCH_UP_BUDGET_MS = 48;
const MAX_CATCH_UP_STEPS = 32;
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
				skillsEnabled: data.skillsEnabled,
				preview: Boolean(data.preview)
			});
			let result = iterator.next();
			while (!result.done) {
				self.postMessage({ kind: 'progress', ...result.value });
				await new Promise((resolve) => setTimeout(resolve, 0));
				if (current !== token) return;
				result = iterator.next();
			}
			race = result.value;
			director = data.preview ? null : createDirector(data.mode, data.count, data.startRank);
			cinematic = director?.update(race) ?? null;
			frames.reset(performance.now());
			self.postMessage({ kind: 'ready', state: encode(race, [], cinematic, true) });
		} else if (data.kind === 'snapshot' && race && !race.preview) {
			const snapshot = encode(race, frames.take(performance.now()), {
				...cinematic,
				newWinners: [],
				finishedCelebration: false
			});
			self.postMessage({ kind: 'frame', state: snapshot }, [snapshot.marbleValues.buffer]);
		} else if (data.kind === 'advance' && race && !race.preview) {
			const events = [],
				newWinners = [];
			// 남은 시간은 호출자에게 돌려준다. 긴 계산 때문에 다음 위치 전달까지 늦추지 않는다.
			const wasActive = cinematic.active;
			let remaining = Number.isFinite(data.seconds) ? Math.max(0, data.seconds) : 0;
			const catchingUp = remaining > 1 / 30;
			const budget = catchingUp ? CATCH_UP_BUDGET_MS : ADVANCE_BUDGET_MS;
			const maximumSteps = catchingUp ? MAX_CATCH_UP_STEPS : MAX_ADVANCE_STEPS;
			const started = performance.now();
			let steps = 0;
			// 한 요청 안에서도 연출이 끝나면 사용자가 선택한 배속으로 돌아간다.
			let endedSlow = false,
				advanced = false;
			while (remaining + 1e-12 >= STEP / 2 && race.finished.length < race.marbles.length) {
				const speed = cinematic.active ? FINALE_SPEED : data.speed;
				if (remaining + 1e-12 < STEP / speed) break;
				events.push(...stepRace(race));
				advanced = true;
				remaining = Math.max(0, remaining - STEP / speed);
				cinematic = director.update(race);
				newWinners.push(...cinematic.newWinners);
				if (cinematic.finishedCelebration) endedSlow = true;
				// 따라잡는 중에도 필수 감속과 당첨 전환은 다음 상태까지 미루지 않는다.
				if (wasActive !== cinematic.active || newWinners.length > 0 || endedSlow) break;
				if (++steps >= maximumSteps || performance.now() - started >= budget) break;
			}
			if (!advanced) {
				self.postMessage({ kind: 'idle', unused: remaining });
				return;
			}
			frames.add(events);
			const now = performance.now();
			const urgent =
				data.flushState ||
				wasActive !== cinematic.active ||
				newWinners.length > 0 ||
				endedSlow ||
				race.finished.length === race.marbles.length;
			if (!frames.ready(now, urgent)) {
				self.postMessage({ kind: 'advanced', unused: remaining });
				return;
			}
			const snapshot = encode(race, frames.take(now), cinematic);
			self.postMessage(
				{
					kind: 'frame',
					state: {
						...snapshot,
						cinematic: { ...cinematic, newWinners, finishedCelebration: endedSlow }
					},
					unused: remaining
				},
				[snapshot.marbleValues.buffer]
			);
		}
	} catch (error) {
		self.postMessage({
			kind: 'error',
			message: error instanceof Error ? error.message : '경기를 계산하지 못했어요.'
		});
	}
};
