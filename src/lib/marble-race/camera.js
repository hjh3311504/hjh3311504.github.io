import { WIDTH, followedMarble } from './physics.js';
export function createCamera() {
	let oldRace,
		top = 0,
		goal = 0,
		lastFocus = '-1',
		scale = 0,
		viewportWidth = 0,
		viewportHeight = 0,
		centerX = WIDTH / 2,
		finale = false;
	let view = {
		top: 0,
		bottom: 680,
		left: 0,
		right: 720,
		scale: 1,
		finale: false,
		audioTop: 0,
		audioBottom: 680
	};
	return {
		update(
			race,
			{
				width,
				height,
				seconds = 0,
				mode = 'first',
				focusId = '-1',
				cinematic = null,
				reduced = false
			}
		) {
			if (oldRace !== (race.identity ?? race)) {
				oldRace = race.identity ?? race;
				top = 0;
				goal = 0;
				scale = 0;
				centerX = WIDTH / 2;
				finale = false;
				lastFocus = String(focusId);
			}
			const base = Math.min(width / WIDTH, height / 680);
			if (!(base > 0)) return view;
			const selected = cinematic?.active
				? race.marbles[cinematic.focusId]
				: followedMarble(race, mode, focusId);
			const target = selected?.y ?? race.layout.finish.y;
			const closeup = cinematic?.active && !reduced;
			const desiredScale = closeup ? base * 2.4 : base;
			const resized = width !== viewportWidth || height !== viewportHeight;
			viewportWidth = width;
			viewportHeight = height;
			const factor = 1 - Math.exp(-Math.min(0.05, Math.max(0, seconds)) * 5);
			scale = scale && !resized ? scale + (desiredScale - scale) * factor : desiredScale;
			// 결승선 아래에 화면 여백을 남겨 하단 조작부와 떨어뜨린다.
			const finishPadding = Math.min(120, height * 0.25) / scale;
			const span = height / scale,
				maxTop = Math.max(
					0,
					race.layout.height - span,
					race.layout.finish.y + finishPadding - span
				),
				changed = lastFocus !== String(focusId);
			if (changed) {
				lastFocus = String(focusId);
				finale = false;
				goal = Math.max(0, Math.min(maxTop, target - span * 0.48));
			}
			if (cinematic?.active || target >= race.layout.finale.start) finale = true;
			if (closeup) goal = Math.max(0, Math.min(maxTop, target - span * 0.48));
			else if (finale) goal = maxTop;
			else if (target > top + span * 0.65)
				goal = Math.max(goal, Math.min(maxTop, target - span * 0.48));
			const next = top + (goal - top) * factor;
			top = Math.max(
				0,
				Math.min(
					maxTop,
					changed || (resized && finale) ? goal : closeup ? next : Math.max(top, next)
				)
			);
			const horizontal = width / scale;
			const desiredCenter =
				closeup && horizontal < WIDTH
					? Math.max(horizontal / 2, Math.min(WIDTH - horizontal / 2, selected?.x ?? WIDTH / 2))
					: WIDTH / 2;
			centerX = resized || changed ? desiredCenter : centerX + (desiredCenter - centerX) * factor;
			const left = centerX - horizontal / 2;
			const audioSpan = Math.min(800, span),
				audioCenter = Math.max(top + audioSpan / 2, Math.min(top + span - audioSpan / 2, target));
			view = {
				top,
				bottom: top + span,
				left,
				right: left + horizontal,
				scale,
				finale,
				audioTop: audioCenter - audioSpan / 2,
				audioBottom: audioCenter + audioSpan / 2
			};
			return view;
		},
		getView() {
			return view;
		}
	};
}
