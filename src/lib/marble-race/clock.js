import { STEP } from './physics.js';

// 배속은 고정 간격 계산의 횟수만 바꾼다. 소리의 재생 속도는 바꾸지 않는다.
export function createRaceClock() {
	let accumulator = 0;
	return {
		reset() {
			accumulator = 0;
		},
		advance(seconds, speed, step) {
			accumulator +=
				Math.max(0, Math.min(0.08, seconds)) * ([0.25, 1, 2].includes(speed) ? speed : 1);
			while (accumulator + 1e-12 >= STEP) {
				accumulator = Math.max(0, accumulator - STEP);
				if (step() === false) {
					accumulator = 0;
					break;
				}
			}
		}
	};
}
