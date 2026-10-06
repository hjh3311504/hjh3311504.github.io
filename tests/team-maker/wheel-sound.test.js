import assert from 'node:assert/strict';
import test from 'node:test';
import {
	calculateWheelPinTimes,
	calculateWheelSoundTimes,
	WHEEL_PIN_COUNT,
	WHEEL_SOUND_MIN_INTERVAL_MS
} from '../../src/lib/team-maker/wheel-sound.js';

test('24개 핀이 상단을 지날 때마다 한 번 울리고 출발점의 핀은 제외한다', () => {
	assert.equal(WHEEL_PIN_COUNT, 24);
	assert.equal(calculateWheelPinTimes(0, 360, 6500).length, 24);
	assert.equal(calculateWheelPinTimes(15, 375, 6500).length, 24);
	assert.equal(calculateWheelPinTimes(14, 16, 6500).length, 1);
	assert.deepEqual(calculateWheelPinTimes(16, 29, 6500), []);
	assert.deepEqual(calculateWheelPinTimes(360, 360, 6500), []);
});

test('초당 최대24회로 시작해 간격이 줄어들지 않고 마지막 핀에서 끝난다', () => {
	for (const [from, to] of [
		[0, 3060],
		[3060, 6210],
		[6210, 9360]
	]) {
		const pins = calculateWheelPinTimes(from, to, 6500);
		const sounds = calculateWheelSoundTimes(from, to, 6500);
		assert.equal(WHEEL_SOUND_MIN_INTERVAL_MS, 1000 / 24);
		assert.ok(sounds.every((time) => pins.includes(time)));
		assert.ok(sounds.every((time, index) => !index || time - sounds[index - 1] >= 1000 / 24));
		assert.ok(sounds.filter((time) => time < 1000).length <= 24);
		assert.ok(sounds.length < pins.length / 2);
		const gaps = sounds.slice(1).map((time, index) => time - sounds[index]);
		assert.ok(gaps.every((gap, index) => !index || gap >= gaps[index - 1]));
		assert.equal(sounds[0], pins[0]);
		assert.equal(sounds.at(-1), pins.at(-1));
	}
	assert.deepEqual(calculateWheelSoundTimes(0, 0, 6500), []);
});

test('시작 각도·회전량·길이가 달라도 마지막 핀 추가로 재생이 빨라지지 않는다', () => {
	for (const from of [0, 7.5, 15, 3060]) {
		for (const rotation of [0, 14, 30, 360, 2887, 2999, 3240]) {
			for (const duration of [20, 300, 6500]) {
				const pins = calculateWheelPinTimes(from, from + rotation, duration);
				const sounds = calculateWheelSoundTimes(from, from + rotation, duration);
				assert.ok(sounds.every((time) => pins.includes(time)));
				assert.equal(sounds.at(-1), pins.at(-1));
				let previousGap = 1000 / 24;
				for (let index = 1; index < sounds.length; index++) {
					const gap = sounds[index] - sounds[index - 1];
					assert.ok(gap >= previousGap);
					previousGap = gap;
				}
			}
		}
	}
});

test('회전량과 상관없이 핀 간격이 같고 실제 CSS 감속 곡선에서 통과 시각을 계산한다', () => {
	for (const [from, to] of [
		[0, 3060],
		[3060, 6210],
		[6210, 9360]
	]) {
		const times = calculateWheelPinTimes(from, to, 6500);
		assert.equal(times.length, Math.floor(to / 15) - Math.floor(from / 15));
		for (const [index, time] of times.entries()) {
			// x(t)를 독립적으로 풀고 y(t)로 얻은 회전각이 핀 위치인지 확인한다.
			let low = 0;
			let high = 1;
			for (let n = 0; n < 50; n++) {
				const t = (low + high) / 2;
				const x = 0.3 * t * (1 - t) ** 2 + 0.18 * t ** 2 * (1 - t) + t ** 3;
				if (x < time / 6500) low = t;
				else high = t;
			}
			const t = (low + high) / 2;
			const y = 2.16 * t * (1 - t) ** 2 + 3 * t ** 2 * (1 - t) + t ** 3;
			const angle = from + y * (to - from);
			assert.ok(Math.abs(angle - (Math.floor(from / 15) + index + 1) * 15) < 0.0001);
			if (index) assert.ok(time > times[index - 1]);
		}
		assert.ok(times.at(-1) - times.at(-2) > times[1] - times[0]);
	}
});
