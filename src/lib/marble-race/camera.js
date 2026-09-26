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
		finale = false,
		wasInspecting = false,
		returning = false;
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
				reduced = false,
				inspectionY = null
			}
		) {
			if (oldRace !== (race.identity ?? race)) {
				oldRace = race.identity ?? race;
				top = 0;
				goal = 0;
				scale = 0;
				centerX = WIDTH / 2;
				finale = false;
				wasInspecting = false;
				returning = false;
				lastFocus = String(focusId);
			}
			const base = Math.min(width / WIDTH, height / 680);
			if (!(base > 0)) return view;
			const selected =
				cinematic?.active ||
				(mode === 'last' && String(focusId) === '-1' && cinematic?.focusId != null)
					? race.marbles[cinematic.focusId]
					: followedMarble(race, mode, focusId);
			const inspecting = Number.isFinite(inspectionY);
			const target = inspecting ? inspectionY : (selected?.y ?? race.layout.finish.y);
			if (wasInspecting && !inspecting) {
				returning = true;
				finale = Boolean(cinematic?.active || target >= race.layout.finale.start);
			}
			wasInspecting = inspecting;
			const lastTracking = !inspecting && mode === 'last';
			const closeup = !inspecting && cinematic?.active && !reduced;
			const desiredScale = closeup ? base * 2.4 : base;
			const resized = width !== viewportWidth || height !== viewportHeight;
			viewportWidth = width;
			viewportHeight = height;
			const realSeconds = Math.min(0.05, Math.max(0, seconds));
			const factor = 1 - Math.exp(-realSeconds * 5);
			// 결승 후보는 바로 갱신하되 위치는 실제 시간 약0.3초에95%까지 부드럽게 따라간다.
			const positionFactor = closeup ? 1 - Math.exp(-realSeconds * 10) : factor;
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
			if (!inspecting && (cinematic?.active || target >= race.layout.finale.start)) finale = true;
			if (inspecting) goal = Math.max(0, Math.min(maxTop, target - span / 2));
			else if (returning && !finale) goal = Math.max(0, Math.min(maxTop, target - span * 0.48));
			else if (closeup || lastTracking) goal = Math.max(0, Math.min(maxTop, target - span * 0.48));
			else if (finale) goal = maxTop;
			else if (target > top + span * 0.65)
				goal = Math.max(goal, Math.min(maxTop, target - span * 0.48));
			const next = top + (goal - top) * positionFactor;
			top = Math.max(
				0,
				Math.min(
					maxTop,
					(changed && !returning && !inspecting) || (resized && finale && !inspecting)
						? goal
						: closeup || lastTracking || inspecting || returning
							? next
							: Math.max(top, next)
				)
			);
			if (returning && Math.abs(top - goal) < 1) returning = false;
			const horizontal = width / scale;
			const desiredCenter =
				closeup && horizontal < WIDTH
					? Math.max(horizontal / 2, Math.min(WIDTH - horizontal / 2, selected?.x ?? WIDTH / 2))
					: WIDTH / 2;
			centerX =
				resized || changed ? desiredCenter : centerX + (desiredCenter - centerX) * positionFactor;
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
