import { WHEEL_SPIN_EASING } from './core.js';

// 참가자 수와 관계없이 원 둘레에 같은 간격으로 놓인 가상의 핀이다.
export const WHEEL_PIN_COUNT = 24;
// 빠른 구간에도 타건음 사이에 여백을 둔다(초당 최대24회).
export const WHEEL_SOUND_MIN_INTERVAL_MS = 1000 / 24;

function bezier(t, first, second) {
	return 3 * (1 - t) ** 2 * t * first + 3 * (1 - t) * t ** 2 * second + t ** 3;
}

export function calculateWheelPinTimes(fromRotation, toRotation, duration) {
	if (toRotation <= fromRotation || duration <= 0) return [];
	const spacing = 360 / WHEEL_PIN_COUNT;
	const [x1, y1, x2, y2] = WHEEL_SPIN_EASING;
	const times = [];
	for (let pin = Math.floor(fromRotation / spacing) + 1; pin * spacing <= toRotation; pin++) {
		const progress = (pin * spacing - fromRotation) / (toRotation - fromRotation);
		// CSS 감속 곡선의 회전량(y)을 먼저 역산한 뒤 재생 시각(x)을 구한다.
		let low = 0;
		let high = 1;
		for (let iteration = 0; iteration < 40; iteration++) {
			const mid = (low + high) / 2;
			if (bezier(mid, y1, y2) < progress) low = mid;
			else high = mid;
		}
		times.push(bezier((low + high) / 2, x1, x2) * duration);
	}
	return times;
}

export function calculateWheelSoundTimes(fromRotation, toRotation, duration) {
	const pins = calculateWheelPinTimes(fromRotation, toRotation, duration);
	if (pins.length < 2) return pins;
	const times = [];
	let interval = WHEEL_SOUND_MIN_INTERVAL_MS;
	for (const time of pins) {
		if (!times.length) {
			times.push(time);
			continue;
		}
		const gap = time - times.at(-1);
		// 핀을 건너뛰는 개수가 줄어도 재생 간격은 다시 짧아지지 않게 한다.
		if (gap >= interval) {
			times.push(time);
			interval = gap;
		}
	}
	const lastPin = pins.at(-1);
	if (times.at(-1) !== lastPin) {
		// 마지막 핀을 넣을 여백이 없으면 앞 소리를 덜어내 감속을 유지한다.
		while (times.length) {
			const previousGap = times.length > 1 ? times.at(-1) - times.at(-2) : 0;
			if (lastPin - times.at(-1) >= Math.max(WHEEL_SOUND_MIN_INTERVAL_MS, previousGap)) break;
			times.pop();
		}
		times.push(lastPin);
	}
	return times;
}
