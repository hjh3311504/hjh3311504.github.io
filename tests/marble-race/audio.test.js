import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { BREAKABLE_TYPES, SOUND_TYPES } from '../../src/lib/marble-race/catalog.js';
import { SOUND_FILES, createAudio } from '../../src/lib/marble-race/audio.js';

function fixture(fetchFile, options = {}) {
	const sources = [],
		requests = [];
	const parameter = () => ({
		value: 0,
		setTargetAtTime(value) {
			this.value = value;
		}
	});
	const node = () => ({
		gain: parameter(),
		pan: parameter(),
		connect(other) {
			return other;
		},
		disconnect() {}
	});
	const context = {
		state: 'running',
		currentTime: 0,
		destination: node(),
		createGain: node,
		createStereoPanner: node,
		createDynamicsCompressor: () => ({
			...node(),
			threshold: parameter(),
			knee: parameter(),
			ratio: parameter(),
			attack: parameter(),
			release: parameter()
		}),
		createBufferSource() {
			const source = {
				...node(),
				started: false,
				stopped: false,
				start() {
					this.started = true;
				},
				stop() {
					this.stopped = true;
					this.onended?.();
				}
			};
			sources.push(source);
			return source;
		},
		async decodeAudioData(data) {
			if (data === 'invalid') throw new Error('디코딩 실패');
			return data;
		},
		async resume() {
			this.state = 'running';
		},
		async close() {
			this.state = 'closed';
		}
	};
	const audio = createAudio({
		contextFactory: () => context,
		wait: async () => {
			context.currentTime += 0.0001;
		},
		...options,
		fetchFile: async (url, options) => {
			requests.push(url);
			return fetchFile ? fetchFile(url, options) : { ok: true, arrayBuffer: async () => url };
		}
	});
	return { audio, context, sources, requests };
}

test('선택한 음원과 보존 음원은 유효한 WAV이며 무음이 아니다', () => {
	assert.equal(BREAKABLE_TYPES.length, 16);
	assert.equal(SOUND_TYPES.length, 20);
	const hashes = new Set();
	for (const files of Object.values(SOUND_FILES)) {
		assert.ok(files.length === 1 || files.length === 2);
		const pair = [];
		for (const file of files) {
			const data = readFileSync(new URL('../../static' + file, import.meta.url));
			assert.equal(data.toString('ascii', 0, 4), 'RIFF');
			assert.equal(data.toString('ascii', 8, 12), 'WAVE');
			assert.equal(
				data.readUInt32LE(24),
				file.includes('-v5-') ||
					file.includes('-ai-') ||
					file.includes('crack-A') ||
					file.includes('fanfare-tada')
					? 48000
					: 24000
			);
			let peak = 0;
			for (let i = 44; i < data.length; i += 2)
				peak = Math.max(peak, Math.abs(data.readInt16LE(i)));
			assert.ok(peak > 300 && peak < 30000, file);
			assert.equal(data.readInt16LE(44), 0);
			assert.equal(data.readInt16LE(data.length - 2), 0);
			pair.push(createHash('sha256').update(data).digest('hex'));
		}
		if (pair.length === 2) assert.notEqual(pair[0], pair[1]);
		hashes.add(pair.join(','));
	}
	assert.equal(hashes.size, 18);
});
test('선택한 재질만 불러오고 동시 요청과 재시작에서 캐시를 공유한다', async () => {
	const { audio, requests } = fixture();
	assert.deepEqual(
		await Promise.all([audio.prepare(['thock', 'clicky']), audio.prepare(['thock'])]),
		[true, true]
	);
	assert.equal(requests.length, 3);
	await audio.prepare(['clicky']);
	assert.equal(requests.length, 3);
	audio.destroy();
});
test('화면 범위의 충돌음을 재생하고 경계 전환만으로 잔향을 끊지 않는다', async () => {
	const { audio, context, sources } = fixture();
	await audio.prepare(['thock', 'rubber']);
	audio.setView({ top: 0, bottom: 500 });
	assert.equal(audio.playCollision({ type: 'thock', zoneId: 'layer-0', x: 100, y: 405 }), true);
	audio.setView({ top: 400, bottom: 900 });
	assert.equal(sources[0].stopped, false);
	context.currentTime += 0.1;
	assert.equal(audio.playCollision({ type: 'thock', x: 100, y: 374 }), true);
	context.currentTime += 0.1;
	assert.equal(audio.playCollision({ type: 'thock', x: 100, y: 347 }), false);
	assert.equal(
		audio.playCollision({ type: 'wall', soundType: 'rubber', impact: 80, x: 360, y: 800 }),
		true
	);
	audio.stop();
	assert.ok(sources.every((s) => s.stopped));
	audio.destroy();
});
test('실패한 다운로드와 디코딩은 재시도할 수 있다', async () => {
	let failing = true;
	const { audio } = fixture(async () => ({
		ok: true,
		arrayBuffer: async () => (failing ? 'invalid' : new ArrayBuffer(4))
	}));
	assert.equal(await audio.prepare(['thock']), false);
	failing = false;
	assert.equal(await audio.prepare(['thock']), true);
	audio.destroy();
});
test('미리듣기도 같은 녹음을 교대하고 음소거·정지·종료 시 소리를 정리한다', async () => {
	const { audio, sources, context } = fixture();
	await audio.prepare(['thock']);
	audio.play('thock', 360, true);
	audio.play('thock', 360, true);
	assert.notEqual(sources[0].buffer, sources[1].buffer);
	audio.setOptions(false, 0.5);
	assert.ok(sources.every((s) => s.stopped));
	assert.equal(audio.play('thock', 360, true), false);
	audio.setOptions(true, 0.5);
	audio.play('thock', 360, true);
	audio.stop();
	assert.ok(sources.every((s) => s.stopped));
	audio.destroy();
	assert.equal(context.state, 'closed');
	assert.equal(await audio.prepare(['thock']), false);
});
test('종료하면 진행 중인 다운로드도 취소한다', async () => {
	let signal;
	const { audio } = fixture(async (_url, options) => {
		signal = options.signal;
		return new Promise((_resolve, reject) =>
			signal.addEventListener('abort', () => reject(new Error('취소')))
		);
	});
	const loading = audio.prepare(['thock']);
	await new Promise((resolve) => setImmediate(resolve));
	audio.destroy();
	assert.equal(signal.aborted, true);
	assert.equal(await loading, false);
});
test('동시에 12개를 넘게 재생하지 않는다', async () => {
	const { audio, sources } = fixture();
	await audio.prepare(['thock']);
	for (let i = 0; i < 20; i++) audio.play('thock', 360, true);
	assert.equal(sources.length, 12);
	audio.destroy();
});

test('도각 키보드·팝잇·뽁뽁이·코르크는 실제 시간28ms 간격과 전체12개만 제한한다', async () => {
	for (const type of ['thock', 'popit', 'wrap', 'cork', 'wood', 'droplet']) {
		const { audio, context, sources } = fixture();
		await audio.prepare([type]);
		for (let i = 0; i < 12; i++) {
			context.currentTime = i * 0.03;
			assert.equal(audio.play(type), true);
			context.currentTime += 0.02;
			assert.equal(audio.play(type), false);
		}
		context.currentTime = 1;
		assert.equal(audio.play(type), false);
		assert.equal(sources.length, 12);
		audio.destroy();
	}
});
for (const type of ['clicky', 'typewriter']) {
	test(`${type}: 동시3개·60ms로 제한하고 기존 소리는 끝까지 재생한다`, async () => {
		const { audio, context, sources } = fixture();
		await audio.prepare([type]);
		for (let i = 0; i < 3; i++) {
			context.currentTime = i * 0.061;
			assert.equal(audio.play(type), true);
			context.currentTime += 0.04;
			assert.equal(audio.play(type), false);
		}
		context.currentTime = 1;
		assert.equal(audio.play(type), false);
		assert.equal(sources.length, 3);
		assert.ok(sources.every((source) => !source.stopped));
		sources[0].onended();
		assert.equal(audio.play(type), true);
		audio.stop();
		assert.equal(audio.play(type), true);
		audio.destroy();
	});
}
test('긴 질감 소리는 재질당3개·전체6개이며 기존 소리를 끊지 않는다', async () => {
	const { audio, context, sources } = fixture();
	await audio.prepare(['sand', 'soap', 'slime', 'waxball', 'thock']);
	assert.equal(audio.play('sand'), true);
	context.currentTime = 0.15;
	assert.equal(audio.play('sand'), true);
	context.currentTime = 0.3;
	assert.equal(audio.play('sand'), true);
	context.currentTime = 0.4;
	assert.equal(audio.play('sand'), false);
	assert.equal(audio.play('soap'), true);
	context.currentTime = 0.45;
	assert.equal(audio.play('slime'), true);
	context.currentTime = 0.6;
	assert.equal(audio.play('waxball'), true);
	context.currentTime = 0.7;
	assert.equal(audio.play('soap'), false);
	assert.equal(audio.play('thock'), true);
	assert.ok(sources.every((s) => !s.stopped));
	sources[0].onended();
	context.currentTime = 0.75;
	assert.equal(audio.play('waxball'), true);
	assert.ok(sources.every((s) => !s.stopped));
	audio.destroy();
});
test('질감·장치의 재생 간격은 경기 배속과 별개인 오디오 시계를 따른다', async () => {
	for (const [type, interval] of [
		['sand', 0.06],
		['soap', 0.09],
		['slime', 0.08],
		['waxball', 0.15],
		['rubber', 0.1]
	]) {
		const { audio, context, sources } = fixture();
		await audio.prepare([type]);
		assert.equal(audio.play(type), true);
		sources[0].onended();
		context.currentTime = interval - 0.001;
		assert.equal(audio.play(type), false);
		context.currentTime = interval + 0.001;
		assert.equal(audio.play(type), true);
		context.currentTime += 1;
		assert.equal(audio.play(type), type !== 'rubber', '질감은 겹치고 장치는1개를 유지한다');
		context.currentTime += 1;
		assert.equal(audio.play(type), type !== 'rubber', '질감은3개까지 겹친다');
		context.currentTime += 1;
		assert.equal(audio.play(type), false, '재질별 동시 재생 한도를 넘지 않는다');
		audio.stop();
		assert.equal(audio.play(type), true, '정지하면 간격 기록도 정리한다');
		audio.destroy();
	}
});
test('같은 프레임의 재질을 순환하고 생략된 충돌을 나중에 몰아서 재생하지 않는다', async () => {
	const { audio, context, sources } = fixture();
	await audio.prepare(['thock', 'clicky', 'typewriter', 'popit']);
	const events = ['popit', 'thock', 'clicky'].flatMap((type) =>
		Array.from({ length: 20 }, () => ({ type, x: 360, y: 400, impact: 100 }))
	);
	for (let i = 0; i < 6; i++) {
		context.currentTime = i * 0.03;
		assert.equal(audio.playCollisions(events), true);
	}
	assert.deepEqual(
		sources.map((s) => s.buffer.split('/').pop().split('-')[0]),
		['thock', 'clicky', 'popit', 'thock', 'clicky', 'popit']
	);
	context.currentTime = 1;
	assert.equal(audio.playCollisions([]), false);
	audio.setView({ top: 0, bottom: 100 });
	assert.equal(audio.playCollisions(events), false);
	assert.equal(sources.length, 6);
	audio.destroy();
});

test('디코딩 중 중단된 오디오를 다시 실행하고 출력 시계까지 기다린다', async () => {
	const { audio, context } = fixture();
	let resumed = 0;
	context.decodeAudioData = async (data) => {
		context.state = 'suspended';
		return data;
	};
	context.resume = async () => {
		resumed++;
		context.state = 'running';
	};
	assert.equal(await audio.prepare(['typewriter']), true);
	assert.equal(resumed, 1);
	assert.equal(audio.isReady(), true);
	audio.destroy();
});
test('실행 상태여도 출력 시계가 멈춰 있으면 준비 실패로 처리한다', async () => {
	const { audio } = fixture(undefined, { wait: async () => {} });
	assert.equal(await audio.prepare(['thock']), false);
	audio.destroy();
});
test('첫 화면 충돌의 재생과 생략 사유를 기록하고 재시작 제한을 지운다', async () => {
	const log = [];
	const { audio } = fixture(undefined, { onDiagnostic: (event) => log.push(event) });
	await audio.prepare(['typewriter']);
	audio.setView({ top: 0, bottom: 700 });
	const event = { type: 'typewriter', x: 360, y: 300, broken: true };
	assert.equal(audio.playCollisions([event]), true);
	assert.equal(log.find((item) => item.kind === 'played').event, event);
	assert.equal(audio.playCollisions([event]), false);
	assert.ok(log.some((item) => item.reason === 'global-interval'));
	audio.stop();
	assert.equal(audio.playCollisions([event]), true);
	audio.destroy();
});
test('기존 편집 음원은 길이와 시작 무음, 변형 사이2dB 차이 기준을 지킨다', () => {
	const ranges = {
		slime: [0.5, 0.65],
		sand: [0.3, 0.45],
		soap: [0.2, 0.35]
	};
	for (const [type, [min, max]] of Object.entries(ranges)) {
		const rms = SOUND_FILES[type].map((file) => {
			const data = readFileSync(new URL('../../static' + file, import.meta.url));
			const values = Array.from(
				{ length: (data.length - 44) / 2 },
				(_, i) => data.readInt16LE(44 + i * 2) / 32768
			);
			const rate = data.readUInt32LE(24);
			const channels = data.readUInt16LE(22);
			const sampleRate = rate * channels;
			const chunkSize = sampleRate / 100;
			assert.ok(values.length / sampleRate >= min && values.length / sampleRate <= max);
			assert.ok(values.findIndex((v) => Math.abs(v) > 0.005) / sampleRate < 0.025, file);
			const chunks = [];
			for (let i = 0; i < values.length; i += chunkSize) {
				const chunk = values.slice(i, i + chunkSize);
				chunks.push(Math.sqrt(chunk.reduce((sum, v) => sum + v * v, 0) / chunk.length));
			}
			const active = chunks.filter((v) => v > Math.max(...chunks) * 0.1);
			return 20 * Math.log10(Math.sqrt(active.reduce((sum, v) => sum + v * v, 0) / active.length));
		});
		assert.ok(Math.max(...rms) - Math.min(...rms) <= 2, type + ': ' + rms);
	}
});

test('연속 충돌의 다음 타격만 점점 작아지지 않는다', async () => {
	const log = [];
	const { audio, context } = fixture(undefined, { onDiagnostic: (e) => log.push(e) });
	await audio.prepare(['thock']);
	for (let i = 0; i < 6; i++) {
		context.currentTime += 0.03;
		assert.equal(audio.play('thock'), true);
	}
	assert.equal(new Set(log.filter((e) => e.kind === 'played').map((e) => e.level)).size, 1);
	audio.destroy();
});
test('유지한 슬라임은 대부분의 구간에 눌림 질감이 이어진다', () => {
	for (const type of ['slime'])
		for (const file of SOUND_FILES[type]) {
			const data = readFileSync(new URL('../../static' + file, import.meta.url));
			const levels = [];
			for (let i = 44; i < data.length; i += 480) {
				let energy = 0,
					count = 0;
				for (let j = i; j < Math.min(data.length, i + 480); j += 2) {
					energy += (data.readInt16LE(j) / 32768) ** 2;
					count++;
				}
				levels.push(Math.sqrt(energy / count));
			}
			assert.ok(levels.filter((rms) => rms > 0.02).length / levels.length >= 0.75, file);
		}
});

// 사용자가 고른 청축 B·타자기 A·샌드 A·왁뿌볼 B의 원본 후보 해시다.
test('이전 승인 후보8개 파일은 다시 활성화할 수 있도록 보존한다', () => {
	const approved = {
		clicky: [
			'7c1e10edd0576d9277f4a2f0ee7f02d1966d03dfcbca408966838619d80e972e',
			'67d52eaf3ee79b57f957b64ae773e2d6fe00efe5d7f49e7f39d392cee8db03ad'
		],
		typewriter: [
			'40814ea4848412f3aef4f2ef28fbf8931930a943bb0c928c596b0a6c905a904a',
			'7ee761b53cfa2d7e6f98a7527092db55320d83a33dceda3e2d4ebc85a68b6489'
		],
		sand: [
			'dee22ca39b366e37a1fce421318f0e94fc17b937e0153939f591af40879635d7',
			'7e17a2b115d2fb4ccdd2bf23d95f07c719c0e97674a08f6c7b200f70ad59b2b9'
		],
		waxball: [
			'0740826c9bd031c73990df04b851cc29a98ff7af25e5cac51d0c7767174c42de',
			'af3a6df9a2d4c09624b842592f1ed75541f035ba936c131c5931297d93a7efd7'
		]
	};
	for (const [type, hashes] of Object.entries(approved)) {
		assert.deepEqual(
			[1, 2]
				.map((index) => `/audio/marble-race/${type}-v5-${index}.wav`)
				.map((file) =>
					createHash('sha256')
						.update(readFileSync(new URL('../../static' + file, import.meta.url)))
						.digest('hex')
				),
			hashes
		);
	}
});

test('승인된 크랙 A 파일과 선택 키보드를 도감·경기에서 같은 경로로 불러온다', async () => {
	assert.deepEqual(SOUND_FILES.clicky, ['/audio/marble-race/clicky-keyboard-press-ai-v1.wav']);
	assert.deepEqual(SOUND_FILES.waxball, ['/audio/marble-race/waxball-crack-A.wav']);
	const bytes = readFileSync(new URL('../../static' + SOUND_FILES.waxball[0], import.meta.url));
	assert.equal(
		createHash('sha256').update(bytes).digest('hex'),
		'23f9dbd1f186201661edc7fa7261572d5b818ba244e72cf9489ab692f25d1594'
	);
	const { audio, requests } = fixture();
	await audio.prepare(['clicky', 'waxball', 'rubber']);
	assert.deepEqual(requests, [
		...SOUND_FILES.clicky,
		...SOUND_FILES.waxball,
		...SOUND_FILES.rubber
	]);
	audio.destroy();
});

test('청축은 선택 파일의 해시와 길이를 유지한다', () => {
	const data = readFileSync(new URL('../../static' + SOUND_FILES.clicky[0], import.meta.url));
	assert.equal(
		createHash('sha256').update(data).digest('hex'),
		'4ff115b4f699c02f058fb01c85b8935bff4b173b224944387d8f3f176b87cef8'
	);
	assert.equal(data.readUInt16LE(22), 1);
	const duration = (data.length - 44) / 2 / data.readUInt32LE(24);
	assert.ok(Math.abs(duration - 0.21810416666666665) < 1 / 48000);
});

test('타자기는 선택 파일을 공유하고 길이를 유지한다', async () => {
	assert.deepEqual(SOUND_FILES.typewriter, ['/audio/marble-race/typewriter-8-ai-v1.wav']);
	const data = readFileSync(new URL('../../static' + SOUND_FILES.typewriter[0], import.meta.url));
	assert.equal(
		createHash('sha256').update(data).digest('hex'),
		'0bb2016c92647d0d9665a1d9f7318f5d2191786b40f45d152ebf5e93293850b6'
	);
	assert.equal(data.readUInt16LE(22), 1);
	const duration = (data.length - 44) / 2 / data.readUInt32LE(24);
	assert.ok(Math.abs(duration - 0.5394791666666666) < 1 / 48000);
	const { audio, requests } = fixture();
	await audio.prepare(['typewriter']);
	assert.equal(audio.play('typewriter', 360, true), true);
	assert.deepEqual(requests, SOUND_FILES.typewriter);
	audio.destroy();
});

test('뽁뽁이는 시작 공백이 짧은 단일 팝 파일을 사용한다', () => {
	assert.deepEqual(SOUND_FILES.wrap, ['/audio/marble-race/wrap-pop-ai-v1.wav']);
	const data = readFileSync(new URL('../../static' + SOUND_FILES.wrap[0], import.meta.url));
	assert.equal(
		createHash('sha256').update(data).digest('hex'),
		'0a17a1117c08c2b1dbd71604a9e3e20301e311813254aac7c7f0ab737c6cd0aa'
	);
	const samples = Array.from(
		{ length: (data.length - 44) / 2 },
		(_, i) => data.readInt16LE(44 + i * 2) / 32768
	);
	const rate = data.readUInt32LE(24);
	assert.ok(samples.length / rate < 0.18);
	assert.ok(samples.findIndex((v) => Math.abs(v) > 0.005) / rate < 0.015);
	const peak = Math.max(...samples.map(Math.abs));
	const lastStrong = samples.findLastIndex((v) => Math.abs(v) > peak * 0.1);
	assert.ok(lastStrong / rate < 0.08, '주요 타격이 짧게 끝나야 한다');
});

test('물풍선은 승인 원음의 편집본을 준비하고 세 소리까지만 겹친다', async () => {
	const data = readFileSync(new URL('../../static' + SOUND_FILES.asmr[0], import.meta.url));
	const rate = data.readUInt32LE(24);
	let first = -1;
	for (let i = 44; i < data.length; i += 2)
		if (Math.abs(data.readInt16LE(i)) > 164) {
			first = (i - 44) / 2 / rate;
			break;
		}
	assert.ok(first >= 0 && first < 0.015, '충돌 직후 타격을 들을 수 있어야 한다');
	assert.ok((data.length - 44) / 2 / rate < 0.8);
	const { audio, requests, context } = fixture();
	await audio.prepare(['asmr']);
	assert.deepEqual(requests, ['/audio/marble-race/asmr-lava-ai-v1.wav']);
	assert.equal(audio.play('asmr'), true);
	context.currentTime += 0.05;
	assert.equal(audio.play('asmr'), false);
	for (let i = 0; i < 2; i++) {
		context.currentTime += 0.11;
		assert.equal(audio.play('asmr'), true);
	}
	context.currentTime += 0.11;
	assert.equal(audio.play('asmr'), false);
	audio.stop();
	assert.equal(audio.play('asmr', 360, true), true);
	audio.destroy();
});

test('개구리·오리는 울음을 끊지 않고3개·100ms로 제한한다', async () => {
	for (const type of ['frog', 'duck']) {
		const { audio, context, sources } = fixture();
		await audio.prepare([type]);
		for (let i = 0; i < 3; i++) {
			context.currentTime = 1 + i * 0.101;
			assert.equal(audio.play(type), true);
			context.currentTime += 0.05;
			assert.equal(audio.play(type), false);
		}
		context.currentTime = 1.4;
		assert.equal(audio.play(type), false);
		assert.equal(sources.length, 3);
		audio.destroy();
	}
});

test('새 자연음4종은 선택 파일의 출처·해시·길이를 확인한다', () => {
	const manifest = JSON.parse(
		readFileSync(
			new URL('../../static/audio/marble-race/nature-selection.json', import.meta.url),
			'utf8'
		)
	);
	for (const type of ['ember', 'droplet', 'frog', 'duck']) {
		assert.equal(manifest[type].length, SOUND_FILES[type].length);
		for (const edit of manifest[type]) {
			const bytes = readFileSync(
				new URL('../../static/audio/marble-race/' + edit.outputFile, import.meta.url)
			);
			assert.equal(createHash('sha256').update(bytes).digest('hex'), edit.outputSha256);
			assert.ok(edit.sourceUrl.startsWith('https://pixabay.com/sound-effects/'));
			assert.ok(
				type === 'ember'
					? edit.durationSeconds === 0.9
					: edit.durationSeconds >= 0.18 && edit.durationSeconds <= 0.36
			);
		}
	}
});

test('불씨는 타닥이는 꼬리를 유지하고3개·120ms로 제한한다', async () => {
	const { audio, context, sources } = fixture();
	await audio.prepare(['ember']);
	for (let i = 0; i < 3; i++) {
		context.currentTime = 1 + i * 0.121;
		assert.equal(audio.play('ember'), true);
		context.currentTime += 0.09;
		assert.equal(audio.play('ember'), false);
	}
	context.currentTime = 1.5;
	assert.equal(audio.play('ember'), false);
	assert.equal(sources.length, 3);
	audio.destroy();
	const levels = [];
	for (const file of SOUND_FILES.ember) {
		const data = readFileSync(new URL('../../static' + file, import.meta.url));
		const rate = data.readUInt32LE(24);
		const values = Array.from(
			{ length: (data.length - 44) / 2 },
			(_, i) => data.readInt16LE(44 + i * 2) / 32768
		);
		const rms = (v) => Math.sqrt(v.reduce((sum, x) => sum + x * x, 0) / v.length);
		assert.equal(values.length / rate, 0.9);
		assert.ok(
			Math.max(...values.slice(Math.round(rate * 0.15), Math.round(rate * 0.8)).map(Math.abs)) >
				0.01,
			'첫 타격 이후에도 작은 타닥거림이 남아야 한다'
		);
		assert.ok(values.findIndex((v) => Math.abs(v) > 0.005) / rate < 0.03);
		assert.equal(values[0], 0);
		assert.equal(values.at(-1), 0);
		levels.push(20 * Math.log10(rms(values)));
	}
	assert.ok(Math.max(...levels) - Math.min(...levels) < 2);
});

test('범위를 벗어난 일반층만 종료하고 가까운 장치 소리는 유지한다', async () => {
	const { audio, context, sources } = fixture();
	await audio.prepare(['thock', 'pond']);
	audio.setView({ top: 0, bottom: 800 });
	audio.playCollision({ type: 'thock', zoneId: 'layer-0', x: 360, y: 400 });
	context.currentTime += 0.15;
	audio.playCollision({ type: 'pond', zoneId: 'connector-0', x: 360, y: 650 });
	audio.setView({ top: 1000, bottom: 1800 });
	assert.equal(sources[0].stopped, true);
	assert.equal(sources[1].stopped, false);
	audio.destroy();
});
test('당첨 팡파레는 이전 팡파레를 줄이며 음소거를 따른다', async () => {
	const { audio, sources } = fixture();
	await audio.prepare(['fanfare']);
	audio.celebrate();
	audio.celebrate();
	assert.equal(sources[0].stopped, true);
	assert.equal(sources[1].started, true);
	audio.setOptions(false, 0.45);
	audio.celebrate();
	assert.equal(sources.length, 2);
	assert.ok(sources.every((s) => s.stopped));
	audio.destroy();
});

test('확대 화면의 좌우 범위 밖 소리를 거르고 가장자리에서 감쇠한다', async () => {
	const diagnostic = [];
	const { audio, context, sources } = fixture(undefined, {
		onDiagnostic: (e) => diagnostic.push(e)
	});
	await audio.prepare(['thock']);
	audio.setView({ left: 200, right: 400, top: 0, bottom: 200 });
	const collision = { type: 'thock', soundType: 'thock', zoneId: 'layer-0', y: 100, broken: true };
	assert.equal(audio.playCollision({ ...collision, x: 100 }), false);
	assert.equal(audio.playCollision({ ...collision, x: 180 }), true);
	context.currentTime += 0.1;
	assert.equal(audio.playCollision({ ...collision, x: 300 }), true);
	const played = diagnostic.filter((e) => e.kind === 'played');
	assert.ok(played[0].level < played[1].level);
	audio.setView({ left: 500, right: 700, top: 0, bottom: 200 });
	assert.ok(sources.every((s) => s.stopped));
	audio.playCollisions([{ ...collision, x: 300 }]);
	assert.equal(sources.length, 2);
	audio.destroy();
});
