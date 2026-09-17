import { BLOCKS, SOUND_TYPES } from './catalog.js';

const soundVersion = {
	clicky: 'v5',
	typewriter: 'v5',
	slime: 'v3',
	sand: 'v5',
	waxball: 'v5',
	soap: 'v2'
};
export const SOUND_FILES = Object.fromEntries(
	SOUND_TYPES.map((type) => [
		type,
		[1, 2].map(
			(index) =>
				`/audio/marble-race/${type}${soundVersion[type] ? '-' + soundVersion[type] : ''}-${index}.wav`
		)
	])
);

// 선택한 음원 파일을 사용하고 비활성 왁뿌볼 A도 보존한다.
SOUND_FILES.clicky = ['/audio/marble-race/clicky-keyboard-press-ai-v1.wav'];
SOUND_FILES.wrap = ['/audio/marble-race/wrap-pop-ai-v1.wav'];
SOUND_FILES.asmr = ['/audio/marble-race/asmr-lava-ai-v1.wav'];
SOUND_FILES.cork = [1, 2].map((index) => `/audio/marble-race/cork-pop-b-ai-${index}.wav`);
SOUND_FILES.typewriter = ['/audio/marble-race/typewriter-8-ai-v1.wav'];
SOUND_FILES.frog = [1, 2].map((index) => `/audio/marble-race/frog-ai-v1-${index}.wav`);
SOUND_FILES.ember = [1, 2].map((index) => `/audio/marble-race/ember-ai-v2-${index}.wav`);
SOUND_FILES.duck = ['/audio/marble-race/duck-ai-v1-1.wav'];
SOUND_FILES.droplet = ['/audio/marble-race/droplet-ai-v1-1.wav'];
SOUND_FILES.waxball = ['/audio/marble-race/waxball-crack-A.wav'];
SOUND_FILES.butter = SOUND_FILES.waxball;
SOUND_FILES.pond = SOUND_FILES.asmr;
SOUND_FILES.fanfare = ['/audio/marble-race/fanfare-tada-v1.wav'];

// 한 번의 작은 스파이크만 큰 녹음이 다른 소리에 묻히지 않도록 몸통 음량을 맞춘다.
// 비누와 새 질감 파일은 이미 기준 이상이므로 그대로다. 원본 파일은 변경하지 않는다.
function bodyGain(buffer) {
	if (!buffer.getChannelData) return 1;
	const samples = buffer.getChannelData(0);
	let energy = 0;
	for (const sample of samples) energy += sample * sample;
	const rms = Math.sqrt(energy / Math.max(1, samples.length));
	return Math.min(2, Math.max(1, 0.047 / Math.max(rms, 0.0001)));
}

export function createAudio({
	contextFactory,
	fetchFile = (...args) => fetch(...args),
	onDiagnostic,
	wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms))
} = {}) {
	let context, master, compressor;
	let disposed = false,
		enabled = true,
		volume = 0.45,
		lastTime = -1,
		view = { top: 0, bottom: Infinity };
	const buffers = new Map(),
		levels = new Map(),
		pending = new Map(),
		voices = new Set(),
		controllers = new Set(),
		variants = new Map(),
		lastPlayed = new Map();
	let nextType = 0,
		zoneSwitchUntil = 0;
	async function initialize() {
		if (disposed) return false;
		try {
			if (!context) {
				const AudioContext =
					globalThis.window?.AudioContext || globalThis.window?.webkitAudioContext;
				if (!contextFactory && !AudioContext) return false;
				context = contextFactory ? contextFactory() : new AudioContext();
				master = context.createGain();
				compressor = context.createDynamicsCompressor();
				compressor.threshold.value = -16;
				compressor.knee.value = 12;
				compressor.ratio.value = 8;
				compressor.attack.value = 0.003;
				compressor.release.value = 0.16;
				master.gain.value = volume;
				master.connect(compressor).connect(context.destination);
			}
			if (context.state === 'suspended' || context.state === 'interrupted') await context.resume();
			return !disposed && context.state === 'running';
		} catch {
			return false;
		}
	}
	async function load(url) {
		if (buffers.has(url)) return;
		if (pending.has(url)) return pending.get(url);
		const controller = new AbortController();
		controllers.add(controller);
		const timer = setTimeout(() => controller.abort(), 12000);
		const promise = (async () => {
			try {
				const response = await fetchFile(url, { signal: controller.signal });
				if (!response.ok) throw new Error('음원 다운로드 실패');
				const buffer = await context.decodeAudioData(await response.arrayBuffer());
				if (disposed || controller.signal.aborted) throw new Error('음원 로딩 취소');
				buffers.set(url, buffer);
				levels.set(url, bodyGain(buffer));
			} finally {
				clearTimeout(timer);
				controllers.delete(controller);
				pending.delete(url);
			}
		})();
		pending.set(url, promise);
		return promise;
	}
	async function prepare(types = []) {
		if (disposed) return false;
		if (!enabled) return true;
		if (!(await initialize())) return false;
		const wanted = new Set(types);
		try {
			await Promise.all([...wanted].flatMap((type) => (SOUND_FILES[type] ?? []).map(load)));
			// 디코딩 중 출력 장치가 중단될 수 있다. 실행 상태와 오디오 시계가 모두 준비돼야 한다.
			if (!(await initialize())) return false;
			const before = context.currentTime;
			for (let attempt = 0; attempt < 25; attempt++) {
				await wait(20);
				if (disposed || context.state !== 'running') return false;
				if (context.currentTime > before) return true;
			}
			return false;
		} catch {
			return false;
		}
	}
	function stop() {
		for (const voice of voices) {
			try {
				voice.source.stop();
			} catch {
				/* 이미 끝난 소리 */
			}
		}
		voices.clear();
		lastTime = -1;
		lastPlayed.clear();
		nextType = 0;
		zoneSwitchUntil = 0;
	}
	function fadeVoice(voice) {
		if (!context) return;
		voice.gain.gain.setTargetAtTime(0, context.currentTime, 0.003);
		try {
			voice.source.stop(context.currentTime + 0.012);
		} catch {
			/* 이미 종료 */
		}
		voices.delete(voice);
	}
	function outsideView(event) {
		return Math.max(
			view.top - event.y,
			event.y - view.bottom,
			(view.left ?? 0) - event.x,
			event.x - (view.right ?? 720),
			0
		);
	}
	function setView(nextView) {
		view = nextView;
		for (const voice of voices)
			if (
				voice.zoneId?.startsWith('layer-') &&
				Number.isFinite(voice.y) &&
				outsideView(voice) >= 52
			)
				fadeVoice(voice);
	}
	function celebrate() {
		for (const voice of voices) if (voice.type === 'fanfare') fadeVoice(voice);
		if (voices.size >= 12) fadeVoice([...voices][0]);
		return play('fanfare', 360, true);
	}
	function setOptions(soundEnabled, level) {
		enabled = soundEnabled;
		volume = Math.max(0, Math.min(1, Number(level) || 0));
		if (master && context.state !== 'closed')
			master.gain.setTargetAtTime(volume, context.currentTime, 0.015);
		if (!enabled) stop();
	}
	function report(kind, detail) {
		onDiagnostic?.({
			kind,
			audioTime: context?.currentTime ?? null,
			wallTime: performance.now(),
			...detail
		});
	}
	function play(type, x = 360, preview = false, level = 1, event = null) {
		const skip = (reason) => {
			report('skipped', { type, reason, event });
			return false;
		};
		if (disposed) return skip('disposed');
		if (!enabled) return skip('muted');
		if (context?.state !== 'running') return skip('context-not-running');
		if (voices.size >= 12) return skip('global-voices');
		const time = context.currentTime;
		if (!preview && time - lastTime < 0.028) return skip('global-interval');
		const policy = BLOCKS[type]?.audio;
		if (!policy) return skip('unknown-type');
		const active = [...voices];
		if (active.filter((voice) => voice.type === type).length >= policy.maxVoices)
			return skip('material-voices');
		const groupLimit = policy.group === 'texture' ? 6 : policy.group === 'device' ? 1 : 12;
		if (active.filter((voice) => voice.group === policy.group).length >= groupLimit)
			return skip('group-voices');
		if (!preview && time - (lastPlayed.get(type) ?? -Infinity) < policy.interval)
			return skip('material-interval');
		const files = SOUND_FILES[type];
		if (!files) return skip('unknown-file');
		const index = variants.get(type) ?? 0;
		const buffer = buffers.get(files[index % files.length]);
		if (!buffer) return skip('buffer-not-ready');
		variants.set(type, index + 1);
		lastTime = time;
		lastPlayed.set(type, time);
		if (event?.zoneId?.startsWith('layer-')) {
			for (const old of [...voices])
				if (old.zoneId?.startsWith('layer-') && old.zoneId !== event.zoneId) {
					fadeVoice(old);
					zoneSwitchUntil = context.currentTime + 0.012;
				}
		}
		const source = context.createBufferSource();
		source.buffer = buffer;
		const panner = context.createStereoPanner();
		const relativeX = preview
			? 0.5
			: (x - (view.left ?? 0)) / Math.max(1, (view.right ?? 720) - (view.left ?? 0));
		panner.pan.value = Math.max(-0.7, Math.min(0.7, (relativeX - 0.5) * 1.4));
		const gain = context.createGain();
		// 동시 충돌 때 새 소리만 점점 작아지는 처리를 없앤다. 전체 압축기가 겹침을 제어한다.
		gain.gain.value = 0.7 * level * policy.level * (levels.get(files[index % files.length]) ?? 1);
		source.connect(gain).connect(panner).connect(master);
		const voice = {
			source,
			gain,
			type,
			group: policy.group,
			zoneId: event?.zoneId,
			x: event?.x,
			y: event?.y
		};
		voices.add(voice);
		source.onended = () => {
			voices.delete(voice);
			source.disconnect();
			gain.disconnect();
			panner.disconnect();
		};
		source.start(
			event?.zoneId?.startsWith('layer-')
				? Math.max(context.currentTime, zoneSwitchUntil)
				: context.currentTime
		);
		report('played', { type, event, file: files[index % files.length], level: gain.gain.value });
		return true;
	}
	function playCollision(event) {
		if (!Number.isFinite(event.y)) return false;
		const outside = outsideView(event);
		if (outside >= 52) {
			report('skipped', { event, reason: 'outside-view' });
			return false;
		}
		const strength =
			event.soundType === 'rubber' && !event.broken
				? Math.min(1, Math.max(0.2, (event.impact ?? 100) / 200))
				: 1;
		return play(
			event.soundType ?? event.type,
			event.x,
			false,
			(1 - outside / 52) * strength,
			event
		);
	}
	function playCollisions(events) {
		// 화면 갱신마다 재질을 순환한다. 밀린 소리를 다음 프레임에 예약하지 않는다.
		const candidates = new Map();
		for (const event of events) {
			report('collision', { event, view, audible: enabled && context?.state === 'running' });
			if (!Number.isFinite(event.y) || !Number.isFinite(event.x)) {
				report('skipped', { event, reason: 'invalid-position' });
				continue;
			}
			const outside = outsideView(event);
			if (outside >= 52) {
				report('skipped', { event, reason: 'outside-view' });
				continue;
			}
			const type = event.soundType ?? event.type;
			const prior = candidates.get(type);
			if (!prior || (event.impact ?? 100) > (prior.impact ?? 100)) {
				if (prior) report('skipped', { event: prior, reason: 'same-material-candidate' });
				candidates.set(type, event);
			} else report('skipped', { event, reason: 'same-material-candidate' });
		}
		for (let offset = 0; offset < SOUND_TYPES.length; offset++) {
			const index = (nextType + offset) % SOUND_TYPES.length;
			const event = candidates.get(SOUND_TYPES[index]);
			if (event) candidates.delete(SOUND_TYPES[index]);
			if (event && playCollision(event)) {
				for (const pending of candidates.values())
					report('skipped', { event: pending, reason: 'frame-start-interval' });
				nextType = (index + 1) % SOUND_TYPES.length;
				return true;
			}
		}
		return false;
	}
	function cancelPreparation() {
		stop();
		for (const controller of controllers) controller.abort();
	}
	function destroy() {
		disposed = true;
		stop();
		for (const controller of controllers) controller.abort();
		buffers.clear();
		levels.clear();
		pending.clear();
		if (context && context.state !== 'closed') void context.close().catch(() => {});
	}
	return {
		isReady: () => !disposed && (!enabled || context?.state === 'running'),
		prepare,
		play,
		playCollision,
		playCollisions,
		setView,
		celebrate,
		cancelPreparation,
		stop,
		setOptions,
		destroy
	};
}
