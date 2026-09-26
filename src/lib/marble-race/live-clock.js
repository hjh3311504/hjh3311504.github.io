import { STEP } from './physics.js';

// 배속 전환 전에 쌓인 시간은 그때의 배속으로 처리한다. 정지해도 잔여 시간을 버리지 않는다.
export function createLiveClock() {
	let running = false,
		speed = 1,
		last = 0;
	const segments = [];
	function accrue(now) {
		if (!running) return;
		const seconds = Math.max(0, (now - last) / 1000);
		last = Math.max(last, now);
		if (!seconds) return;
		const tail = segments.at(-1);
		if (tail?.speed === speed) tail.seconds += seconds;
		else segments.push({ seconds, speed });
	}
	function available(slow) {
		return segments.reduce((sum, part) => sum + part.seconds * (slow ? 0.25 : part.speed), 0);
	}
	return {
		accrue,
		start(now, nextSpeed) {
			last = now;
			speed = nextSpeed;
			running = true;
		},
		pause(now) {
			accrue(now);
			running = false;
		},
		setSpeed(now, nextSpeed) {
			accrue(now);
			speed = nextSpeed;
		},
		takeStep(slow) {
			if (available(slow) + 1e-12 < STEP) return false;
			let needed = STEP;
			while (needed > 1e-12 && segments.length) {
				const part = segments[0],
					rate = slow ? 0.25 : part.speed;
				const used = Math.min(part.seconds, needed / rate);
				part.seconds -= used;
				needed -= used * rate;
				if (part.seconds < 1e-12) segments.shift();
			}
			return true;
		},
		waitMs(slow) {
			return Math.max(0, ((STEP - available(slow)) / (slow ? 0.25 : speed)) * 1000);
		},
		get running() {
			return running;
		},
		get unused() {
			return segments.reduce((sum, part) => sum + part.seconds, 0);
		}
	};
}
