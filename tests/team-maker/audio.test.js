import assert from 'node:assert/strict';
import test from 'node:test';
import { createAudio } from '../../src/lib/team-maker/audio.js';
import { calculateWheelSoundTimes } from '../../src/lib/team-maker/wheel-sound.js';

function setup(t, { delayed = false } = {}) {
	const sources = [];
	const fetchedUrls = [];
	const button = new EventTarget();
	button.setAttribute = () => {};
	const document = new EventTarget();
	document.hidden = false;
	const state = { soundEnabled: true };
	let finishLoad;
	const loaded = delayed
		? new Promise((resolve) => {
				finishLoad = resolve;
			})
		: Promise.resolve();
	class Context {
		state = 'running';
		currentTime = 100;
		destination = {};
		resume() {
			return Promise.resolve();
		}
		close() {
			this.state = 'closed';
			return Promise.resolve();
		}
		decodeAudioData() {
			return loaded.then(() => ({}));
		}
		createGain() {
			return { gain: {}, connect: () => {}, disconnect() {} };
		}
		createBufferSource() {
			const source = new EventTarget();
			source.connect = (target) => target;
			source.disconnect = () => {};
			source.start = (time) => {
				source.time = time;
			};
			source.stop = () => {
				source.stopped = true;
			};
			sources.push(source);
			return source;
		}
	}
	for (const [key, value] of Object.entries({
		window: { AudioContext: Context },
		document,
		fetch: async (url) => {
			fetchedUrls.push(url);
			return { ok: true, arrayBuffer: async () => new ArrayBuffer(0) };
		}
	})) {
		const descriptor = Object.getOwnPropertyDescriptor(globalThis, key);
		Object.defineProperty(globalThis, key, { value, configurable: true });
		t.after(() => {
			if (descriptor) Object.defineProperty(globalThis, key, descriptor);
			else delete globalThis[key];
		});
	}
	const audio = createAudio({ getState: () => state, $: () => button, persist() {} });
	audio.connect();
	t.after(() => audio.destroy());
	const animation = {
		currentTime: 1000,
		playState: 'running',
		ready: Promise.resolve(),
		finished: new Promise(() => {}),
		effect: { getTiming: () => ({ duration: 6500 }) }
	};
	const flush = () => new Promise((resolve) => setImmediate(resolve));
	return { audio, animation, button, document, sources, fetchedUrls, finishLoad, flush };
}

test('짧은 툭 음원을 한 번 불러와 빠른 구간의 핀 소리를 줄인다', async (t) => {
	const env = setup(t);
	env.animation.currentTime = 0;
	env.audio.prepareWheelSound();
	env.audio.playWheelSpin(env.animation, 0, 3000);
	await env.flush();
	assert.equal(env.fetchedUrls.length, 1);
	assert.ok(env.fetchedUrls[0].endsWith('/sounds/wheel-pin-tuk.wav'));
	const times = calculateWheelSoundTimes(0, 3000, 6500);
	assert.equal(env.sources.length, times.length);
	assert.ok(env.sources.length < 90);
	for (const [index, source] of env.sources.entries()) {
		assert.equal(source.buffer, env.sources[0].buffer);
		assert.equal(source.time, 100 + times[index] / 1000);
	}
});

test('음소거는 예약된 핀 소리도 중지하고 다시 켜면 남은 핀만 재생한다', async (t) => {
	const env = setup(t);
	env.audio.playWheelSpin(env.animation, 0, 3000);
	await env.flush();
	const initial = [...env.sources];
	assert.ok(initial.length > 0);
	assert.ok(initial.every((source) => source.time >= 100));
	env.button.dispatchEvent(new Event('click'));
	assert.ok(initial.every((source) => source.stopped));
	env.animation.currentTime = 4000;
	env.button.dispatchEvent(new Event('click'));
	await env.flush();
	const resumed = env.sources.slice(initial.length);
	assert.ok(resumed.length > 0 && resumed.length < initial.length);
	assert.ok(resumed.every((source) => source.time >= 100 && source.time <= 102.5));
	env.audio.stopSounds();
	assert.ok(env.sources.every((source) => source.stopped));
});

test('로딩 도중 바로 뽑기·음소거·화면 종료가 일어나도 뒤늦게 울리지 않는다', async (t) => {
	for (const action of ['stopSounds', 'mute', 'destroy']) {
		await t.test(action, async (t) => {
			const env = setup(t, { delayed: true });
			env.audio.playWheelSpin(env.animation, 0, 3000);
			if (action === 'mute') env.button.dispatchEvent(new Event('click'));
			else env.audio[action]();
			env.finishLoad();
			await env.flush();
			assert.equal(env.sources.length, 0);
		});
	}
});

test('숨긴 탭에서는 멈추고 돌아오면 지나간 핀을 건너뛴다', async (t) => {
	const env = setup(t);
	env.audio.playWheelSpin(env.animation, 0, 3000);
	await env.flush();
	const count = env.sources.length;
	env.document.hidden = true;
	env.document.dispatchEvent(new Event('visibilitychange'));
	assert.ok(env.sources.every((source) => source.stopped));
	env.animation.currentTime = 6000;
	env.document.hidden = false;
	env.document.dispatchEvent(new Event('visibilitychange'));
	await env.flush();
	assert.ok(env.sources.length - count < count);
	assert.ok(env.sources.slice(count).every((source) => source.time <= 100.5));
});
