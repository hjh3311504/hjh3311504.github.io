import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import {
	ACTIVE_BLOCK_TYPES,
	MAPS,
	BREAKABLE_TYPES,
	SOUND_TYPES
} from '../../src/lib/marble-race/catalog.js';
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
				start(time) {
					this.startTime = time;
					this.started = true;
				},
				stop(time) {
					this.stopTime = time;
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
	assert.equal(BREAKABLE_TYPES.length, 19);
	assert.equal(SOUND_TYPES.length, 27);
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
					file.includes('clicky-v6-') ||
					/thock[234]-v[1-6]/.test(file) ||
					file.includes('-ai-') ||
					file.includes('crack-A') ||
					file.includes('wax-crack-v1-') ||
					file.includes('frost-freeze-v1') ||
					file.includes('fanfare-tada') ||
					file.includes('pulse-whoosh-deep') ||
					file.includes('lightning-v1') ||
					file.includes('gust-v1')
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
	assert.deepEqual(SOUND_FILES.rubber, SOUND_FILES.popit);
	assert.equal(hashes.size, 25);
});
test('크랙 왁스는 파괴 전 충돌부터 두 음원을 교대하며 장치음과 함께 왁스3개까지 재생한다', async () => {
	const { audio, context, sources, requests } = fixture();
	await audio.prepare(['butter', 'rubber']);
	assert.deepEqual(SOUND_FILES.butter, [
		'/audio/marble-race/wax-crack-v1-1.wav',
		'/audio/marble-race/wax-crack-v1-2.wav'
	]);
	assert.ok(SOUND_FILES.butter.every((file) => requests.includes(file)));
	assert.equal(audio.playCollision({ type: 'rubber', x: 360, y: 100 }), true);
	const event = { type: 'butter', soundType: 'butter', x: 360, y: 100, broken: false };
	context.currentTime += 0.03;
	assert.equal(audio.playCollisions([event]), true);
	context.currentTime += 0.03;
	assert.equal(audio.playCollisions([event]), true);
	assert.deepEqual(
		sources.slice(1).map((source) => source.buffer),
		SOUND_FILES.butter
	);
	context.currentTime += 0.03;
	assert.equal(audio.playCollisions([{ ...event, broken: true }]), true);
	context.currentTime += 0.03;
	assert.equal(audio.playCollisions([event]), false);
	sources[1].onended();
	assert.equal(audio.playCollisions([{ ...event, broken: true }]), true);
	assert.equal(sources.at(-1).buffer, SOUND_FILES.butter[1]);
	audio.stop();
});
test('장치 충돌은 팝잇 두 소리를 번갈아 쓰며 장치3개·100ms 제한을 유지한다', async () => {
	const { audio, sources, requests, context } = fixture();
	await audio.prepare(['rubber', 'popit']);
	assert.deepEqual(requests, SOUND_FILES.popit, '같은 파일은 한 번만 불러온다');
	const event = { type: 'wall', soundType: 'rubber', x: 360, y: 100, impact: 200 };
	assert.equal(audio.playCollisions([event]), true);
	assert.equal(sources[0].buffer, SOUND_FILES.popit[0]);
	context.currentTime += 0.2;
	assert.equal(audio.playCollisions([{ ...event, type: 'rubber' }]), true);
	assert.equal(sources[1].buffer, SOUND_FILES.popit[1]);
	context.currentTime += 0.2;
	assert.equal(audio.playCollisions([{ ...event, type: 'rotor' }]), true);
	assert.equal(sources[2].buffer, SOUND_FILES.popit[0]);
	context.currentTime += 0.2;
	assert.equal(audio.playCollisions([event]), false, '장치의4번째 소리는 생략한다');
	sources[0].onended();
	assert.equal(audio.playCollisions([event]), true);
	assert.equal(sources[3].buffer, SOUND_FILES.popit[1]);
	sources[1].onended();
	context.currentTime += 0.05;
	assert.equal(audio.playCollisions([event]), false, '100ms 안에 다시 시작하지 않는다');
	context.currentTime += 0.06;
	assert.equal(audio.playCollisions([event]), true);
	assert.equal(sources[4].buffer, SOUND_FILES.popit[0]);
	audio.destroy();
});
test('무음 골인 통로 벽은 소리 후보나 동시 재생 자리를 차지하지 않는다', async () => {
	const { audio, sources } = fixture();
	await audio.prepare(['rubber', 'butter']);
	const pin = { type: 'rubber', soundType: 'rubber', x: 360, y: 100, silent: true, impact: 1000 };
	assert.equal(audio.playCollision(pin), false);
	assert.equal(audio.playCollisions([pin]), false);
	assert.equal(sources.length, 0);
	assert.equal(
		audio.playCollisions([pin, { ...pin, type: 'butter', soundType: 'butter', silent: false }]),
		true
	);
	assert.equal(sources.length, 1);
	assert.equal(sources[0].buffer, SOUND_FILES.butter[0]);
	audio.destroy();
});
test('선택한 재질만 불러오고 동시 요청과 재시작에서 캐시를 공유한다', async () => {
	const { audio, requests } = fixture();
	assert.deepEqual(
		await Promise.all([audio.prepare(['thock', 'clicky']), audio.prepare(['thock'])]),
		[true, true]
	);
	assert.deepEqual(requests, [...SOUND_FILES.thock, ...SOUND_FILES.clicky]);
	await audio.prepare(['clicky']);
	assert.deepEqual(requests, [...SOUND_FILES.thock, ...SOUND_FILES.clicky]);
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
test('미리듣기도 동시에3개를 넘게 재생하지 않는다', async () => {
	const { audio, sources } = fixture();
	await audio.prepare(['thock']);
	for (let i = 0; i < 20; i++) audio.play('thock', 360, true);
	assert.equal(sources.length, 3);
	audio.destroy();
});

test('모든 활성 일반 블록은 재질당3개와28ms 간격을 따른다', async () => {
	assert.equal(ACTIVE_BLOCK_TYPES.length, 12);
	for (const type of ACTIVE_BLOCK_TYPES) {
		const limit = 3;
		const { audio, context, sources } = fixture();
		await audio.prepare([type]);
		for (let i = 0; i < limit; i++) {
			context.currentTime = i * 0.03;
			assert.equal(audio.play(type), true, `${type}: 28ms 뒤 재생`);
			context.currentTime += 0.02;
			assert.equal(audio.play(type), false, `${type}: 28ms 이내 생략`);
		}
		context.currentTime = 1;
		assert.equal(audio.play(type), false, `${type}: ${limit + 1}번째 동시 재생 생략`);
		assert.equal(sources.length, limit);
		assert.ok(sources.every((source) => !source.stopped));
		sources[0].onended();
		assert.equal(audio.play(type), true, `${type}: 완료된 소리의 자리를 재사용`);
		audio.stop();
		assert.equal(audio.play(type), true, `${type}: 정지 후 제한 기록 초기화`);
		audio.destroy();
	}
});
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
	assert.equal(audio.play('thock'), false);
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
		assert.equal(audio.play(type), true, '질감과 장치 모두 겹쳐 재생한다');
		context.currentTime += 1;
		assert.equal(audio.play(type), true, '질감과 장치는3개까지 겹친다');
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
		sources.at(-1).onended();
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
	for (let i = 0; i < 3; i++) {
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
	assert.deepEqual(SOUND_FILES.clicky, [
		'/audio/marble-race/clicky-v6-1.wav',
		'/audio/marble-race/clicky-v6-2.wav'
	]);
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

test('찰칵 키보드는 C의 독립된 두 타건과 눌림·복귀 구간을 유지한다', () => {
	const hashes = [
		'4c710fe46206817e0d2b5bba0ddf359e294f1d44ae55d0976e014bdbf83d1dc8',
		'81ec902b54a8f846a7a901f22fb6cc3b55cd3615743d3d3c1fb8a138e30ea245'
	];
	const levels = SOUND_FILES.clicky.map((file, index) => {
		const data = readFileSync(new URL('../../static' + file, import.meta.url));
		assert.equal(createHash('sha256').update(data).digest('hex'), hashes[index]);
		assert.equal(data.readUInt16LE(22), 1);
		const samples = Array.from(
			{ length: (data.length - 44) / 2 },
			(_, i) => data.readInt16LE(44 + i * 2) / 32768
		);
		assert.ok(Math.abs(samples.length / 48000 - [0.237, 0.251][index]) < 2 / 48000);
		const rms = (values) =>
			Math.sqrt(values.reduce((sum, value) => sum + value ** 2, 0) / values.length);
		// 각 파일에 눌림과 복귀가 함께 남아야 한다.
		assert.ok(rms(samples.slice(0, 2400)) > 0.02);
		assert.ok(rms(samples.slice(3360, 5760)) > 0.02);
		return rms(samples);
	});
	assert.ok(Math.abs(20 * Math.log10(levels[0] / levels[1])) < 2);
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

test('불씨 음원은 기존 길이와 타닥이는 꼬리를 유지한다', () => {
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

test('도각2는 교환한 도각3의 두 파일을 음량 차이 없이 사용한다', () => {
	for (const [type, source, version] of [['thock2', 'thock3', 'v3']]) {
		assert.deepEqual(
			SOUND_FILES[type],
			[1, 2].map((i) => `/audio/marble-race/${source}-${version}-${i}.wav`)
		);
		const levels = [];
		const hashes = [];
		for (const file of SOUND_FILES[type]) {
			const data = readFileSync(new URL('../../static' + file, import.meta.url));
			hashes.push(createHash('sha256').update(data).digest('hex'));
			let energy = 0;
			for (let i = 44; i < data.length; i += 2) energy += (data.readInt16LE(i) / 32768) ** 2;
			levels.push(Math.sqrt(energy / ((data.length - 44) / 2)));
			assert.ok((data.length - 44) / 2 / 48000 >= 0.13, '짧은 타격 조각만 남기지 않는다');
		}
		assert.notEqual(hashes[0], hashes[1]);
		assert.ok(Math.abs(20 * Math.log10(levels[0] / levels[1])) < 2, '변형 간 음량 차이2dB 미만');
	}
});

test('보존한 이전 도각3 파일은 두 타격 사이에 큰 배경음이 남지 않는다', () => {
	const data = readFileSync(
		new URL('../../static/audio/marble-race/thock3-v2.wav', import.meta.url)
	);
	const rate = data.readUInt32LE(24);
	const rms = (start, end) => {
		let sum = 0;
		const first = Math.round(start * rate);
		const last = Math.round(end * rate);
		for (let i = first; i < last; i++) sum += (data.readInt16LE(44 + i * 2) / 32768) ** 2;
		return Math.sqrt(sum / (last - first));
	};
	const press = rms(0.006, 0.021);
	const release = rms(0.127, 0.144);
	assert.ok(press > 0.05 && release > 0.05, '누름과 키 복귀 타격음을 유지한다');
	assert.ok(rms(0.045, 0.105) < Math.min(press, release) * 0.03, '타격 사이 잡음이 작아야 한다');
});

for (const type of ['thock2', 'thock3', 'thock4']) {
	test(`${type}는 선택 파일 순서와 미리듣기·충돌의재질당3개 제한을 공유한다`, async () => {
		const { audio, requests, context, sources } = fixture();
		await audio.prepare([type]);
		const files = SOUND_FILES[type];
		assert.deepEqual(requests, files);
		assert.equal(audio.play(type, 360, true), true);
		for (let i = 1; i < 3; i++) {
			context.currentTime += 0.03;
			assert.equal(audio.playCollision({ type, x: 360, y: 300 }), true);
			context.currentTime += 0.01;
			assert.equal(audio.playCollision({ type, x: 360, y: 300 }), false);
		}
		assert.deepEqual(
			sources.map((source) => source.buffer),
			Array.from({ length: 3 }, (_, i) => files[i % files.length])
		);
		context.currentTime += 0.03;
		assert.equal(audio.playCollision({ type, x: 360, y: 300 }), false);
		sources[0].onended();
		assert.equal(audio.playCollision({ type, x: 360, y: 300 }), true);
		assert.equal(
			sources.at(-1).buffer,
			files[3 % files.length],
			'생략된 충돌은 타격 순서를 건너뛰지 않는다'
		);
		audio.stop();
		assert.equal(audio.play(type, 360, true), true);
		assert.equal(
			sources.at(-1).buffer,
			files[4 % files.length],
			'정지 뒤에도 다음 타격 순서를 이어간다'
		);
		audio.destroy();
	});
}

test('보존한 도각4 v5는 같은 타건 길이와 타격을 유지하며 배경음을 줄인다', () => {
	const rms = (data, start, end) => {
		const rate = data.readUInt32LE(24);
		let sum = 0;
		const first = Math.round(start * rate),
			last = Math.round(end * rate);
		for (let i = first; i < last; i++) sum += (data.readInt16LE(44 + i * 2) / 32768) ** 2;
		return Math.sqrt(sum / (last - first));
	};
	for (const [i, duration, quiet, active] of [
		[1, 0.28, [0.155, 0.26], [0.02, 0.095]],
		[2, 0.25, [0.135, 0.235], [0.02, 0.1]]
	]) {
		const old = readFileSync(
			new URL(`../../static/audio/marble-race/thock4-v4-${i}.wav`, import.meta.url)
		);
		const current = readFileSync(
			new URL(`../../static/audio/marble-race/thock4-v5-${i}.wav`, import.meta.url)
		);
		assert.equal(current.length, old.length, '눌림과 복귀 구간을 잘라내지 않는다');
		const oldGain = Math.min(2, Math.max(1, 0.047 / rms(old, 0, duration)));
		const newGain = Math.min(2, Math.max(1, 0.047 / rms(current, 0, duration)));
		const quietDb =
			20 * Math.log10((rms(current, ...quiet) * newGain) / (rms(old, ...quiet) * oldGain));
		const activeDb =
			20 * Math.log10((rms(current, ...active) * newGain) / (rms(old, ...active) * oldGain));
		assert.ok(quietDb < -8, '게임 음량 보정 뒤에도 배경음이8dB 이상 감소한다');
		assert.ok(Math.abs(activeDb) < 1, '타격 구간의 게임 음량은1dB 이내로 유지한다');
	}
});

test('도각3은 이전 도각2, 도각4는 이전 도각3 단음을 그대로 사용한다', () => {
	for (const [type, file, hash] of [
		['thock3', 'thock2-v1.wav', '29fe13811919a4097ca824dda41ab429dce2d6bda24ba9e96c1676b0c7ea2b4b'],
		['thock4', 'thock3-v2.wav', '7f5cfb696c91e8bd918bbb70ec0d92abf858dda23b5e05c72f455e7f3365cce6']
	]) {
		assert.deepEqual(SOUND_FILES[type], [`/audio/marble-race/${file}`]);
		const data = readFileSync(new URL(`../../static/audio/marble-race/${file}`, import.meta.url));
		assert.equal(
			createHash('sha256').update(data).digest('hex'),
			hash,
			'이전 단음을 재편집하지 않는다'
		);
	}
});

test('서로 다른 재질·장치·미리듣기가 전체6개를 공유하고 팡파레도 자리를 교체한다', async () => {
	const diagnostic = [];
	const { audio, context, sources } = fixture(undefined, {
		onDiagnostic: (event) => diagnostic.push(event)
	});
	await audio.prepare(['thock', 'clicky', 'popit', 'rubber', 'fanfare']);
	for (const type of ['thock', 'thock', 'thock', 'clicky', 'clicky', 'rubber']) {
		context.currentTime += 0.1;
		assert.equal(audio.play(type, 360, type === 'clicky'), true);
	}
	context.currentTime += 0.1;
	assert.equal(audio.play('thock'), false);
	assert.equal(diagnostic.at(-1).reason, 'global-voices');
	assert.equal(audio.play('popit', 360, true), false);
	assert.equal(audio.celebrate(), true);
	assert.equal(sources[0].stopped, true);
	assert.equal(sources.filter((source) => !source.stopped).length, 6);
	assert.equal(sources.at(-1).buffer, SOUND_FILES.fanfare[0]);
	assert.ok(
		sources.at(-1).startTime >= sources[0].stopTime,
		'사라지는 소리가 끝난 뒤 팡파레를 시작한다'
	);
	audio.destroy();
});

test('얼음 경사판은 선택 동결음을 선행 로딩하고 미리듣기와 경기에서 공유한다', async () => {
	const { audio, context, sources, requests } = fixture();
	const [file] = SOUND_FILES.frost;
	assert.equal(file, '/audio/marble-race/frost-freeze-v1.wav');
	for (const map of MAPS) {
		assert.ok(map.types.includes('frost'));
		assert.equal(await audio.prepare(map.types), true);
	}
	assert.equal(requests.filter((url) => url === file).length, 1);
	assert.equal(audio.play('frost', 360, true), true);
	assert.equal(sources.at(-1).buffer, file);
	audio.stop();
	const event = {
		type: 'frost',
		soundType: 'frost',
		zoneId: 'connector-0',
		deviceId: 'ice-1',
		x: 360,
		y: 500,
		impact: 200
	};
	assert.equal(audio.playCollision(event), true);
	assert.equal(sources.at(-1).buffer, file);
	context.currentTime += 0.2;
	assert.equal(
		audio.playCollision({ ...event, deviceId: 'ice-2' }),
		true,
		'다른 구슬의 동결음을 함께 재생한다'
	);
	assert.equal(sources.at(-1).stopped, false, '기존 균열음의 꼬리는 새 충돌 때문에 끊지 않는다');
	context.currentTime += 0.2;
	assert.equal(audio.playCollision({ ...event, deviceId: 'ice-3' }), true);
	context.currentTime += 0.2;
	assert.equal(audio.playCollision({ ...event, deviceId: 'ice-4' }), false);
	const endedSource = sources.at(-1);
	endedSource.onended();
	assert.equal(audio.playCollision({ ...event, deviceId: 'ice-4' }), true);
	audio.stop();
	assert.ok(sources.filter((source) => source !== endedSource).every((source) => source.stopped));
	assert.equal(audio.playCollision(event), true);
	audio.setOptions(false, 0.45);
	assert.equal(audio.playCollision(event), false);
	audio.destroy();
});

test('선택 동결음은 전체 균열과 잔향을 보존하고 피크에 여유를 둔다', () => {
	const data = readFileSync(new URL('../../static' + SOUND_FILES.frost[0], import.meta.url));
	assert.equal(
		createHash('sha256').update(data).digest('hex'),
		'c75eed548e93808114f411e995243ea6bfc0350a24608e3d4426bfa18ca5e491'
	);
	const rate = data.readUInt32LE(24);
	assert.equal(rate, 48000);
	assert.equal(data.readUInt16LE(22), 1);
	assert.ok(Math.abs((data.length - 44) / 2 / rate - 1.60752) < 1 / rate);
	const rms = (start, end) => {
		let sum = 0,
			count = 0;
		for (let i = Math.floor(start * rate); i < Math.floor(end * rate); i++) {
			sum += (data.readInt16LE(44 + i * 2) / 32768) ** 2;
			count++;
		}
		return Math.sqrt(sum / count);
	};
	assert.ok(rms(0, 0.05) > 0.1, '첫 균열의 시작을 보존한다');
	assert.ok(rms(0.5, 0.9) > 0.04, '연속 균열을 보존한다');
	assert.ok(rms(1, 1.4) > 0.003, '뒤따르는 잔향을 남긴다');
});

test('모든 배속에서 장치3개와 일반음3개를 함께 재생하고 공유 한도를 지킨다', async () => {
	for (const speed of [0.25, 1, 2]) {
		const { audio, context, sources } = fixture();
		await audio.prepare(['thock', 'frost', 'pond', 'rubber']);
		for (const [i, type] of ['frost', 'pond', 'rubber'].entries()) {
			context.currentTime += 0.11;
			assert.equal(audio.playCollision({ type, x: 360, y: 100, time: i * speed }), true);
		}
		context.currentTime += 0.11;
		for (const type of ['frost', 'pond', 'rubber'])
			assert.equal(audio.play(type), false, '종류가 달라도 장치 합계4개는 차단한다');
		for (let i = 0; i < 3; i++) {
			context.currentTime += 0.11;
			assert.equal(audio.playCollision({ type: 'thock', x: 360, y: 100, time: i * speed }), true);
		}
		assert.equal(sources.length, 6);
		context.currentTime += 0.11;
		assert.equal(audio.play('pond'), false, '전체7번째 소리는 생략한다');
		sources[0].onended();
		assert.equal(audio.play('pond'), true, '재생이 끝나면 장치 자리를 다시 사용한다');
		audio.stop();
		assert.equal(audio.play('frost'), true);
		audio.destroy();
	}
});

test('스킬음은 미리듣기와 경기에서 절반 크기로 재생하며 동시 발동과 파일 공유를 유지한다', async () => {
	const log = [];
	const { audio, sources, requests, context } = fixture(undefined, {
		onDiagnostic: (event) => log.push(event)
	});
	await audio.prepare(['pulse', 'lightning', 'gust']);
	audio.setView({ left: 0, right: 720, top: 0, bottom: 800 });
	const types = ['pulse', 'lightning', 'gust'];
	for (const type of types) {
		assert.ok(requests.includes(SOUND_FILES[type][0]));
		assert.equal(audio.play(type, 360, true), true);
	}
	const events = Array.from({ length: 12 }, (_, id) => ({
		kind: 'skill',
		type: types[id % 3],
		deviceId: `skill-${id}`,
		x: 360,
		y: 200
	}));
	assert.equal(audio.playCollisions(events), true);
	assert.equal(sources.length, 15);
	assert.ok(
		log
			.filter((event) => event.kind === 'played')
			.every((event) => Math.abs(event.level - 0.28) < 1e-9)
	);
	assert.deepEqual(
		sources.slice(3).map((s) => s.buffer),
		events.map((e) => SOUND_FILES[e.type][0])
	);
	assert.ok(sources.every((s) => s.startTime === context.currentTime));
	context.currentTime += 0.001;
	assert.equal(audio.playCollisions(events), true, '200ms나 음원 종료를 기다리지 않는다');
	assert.equal(sources.length, 27);
	audio.setOptions(false, 0.45);
	assert.ok(sources.every((s) => s.stopped));
	assert.equal(audio.playCollisions(events), false);
	audio.setOptions(true, 0.45);
	assert.equal(audio.playCollisions(events), true);
	audio.stop();
	assert.ok(sources.every((s) => s.stopped));
	audio.destroy();
});

test('스킬은 일반음6개와28ms 제한을 공유하지 않으며 축하음도 스킬을 끊지 않는다', async () => {
	const { audio, context, sources } = fixture();
	await audio.prepare(['pulse', 'thock', 'popit', 'fanfare']);
	const pulse = { kind: 'skill', type: 'pulse', x: 360, y: 200 };
	assert.equal(audio.playCollisions([pulse]), true);
	for (const type of ['thock', 'thock', 'thock', 'popit', 'popit', 'popit']) {
		context.currentTime += 0.04;
		assert.equal(audio.play(type), true);
	}
	context.currentTime += 0.001;
	assert.equal(audio.playCollisions(Array.from({ length: 8 }, () => pulse)), true);
	assert.ok(sources.every((s) => !s.stopped));
	assert.equal(sources.length, 15);
	assert.equal(sources.at(-1).startTime, context.currentTime);
	assert.equal(audio.play('thock'), false, '일반음은 여전히6개 한도를 따른다');
	assert.equal(audio.celebrate(), true);
	assert.equal(sources[0].stopped, false, '먼저 재생된 스킬도 축하음 때문에 끊지 않는다');
	assert.equal(sources[1].stopped, true, '일반음 한 자리만 교체한다');
	assert.equal(sources.filter((s) => !s.stopped).length, 15);
	audio.stop();
	assert.ok(sources.every((s) => s.stopped));
	audio.destroy();
});

test('한 프레임의 여러 스킬과 일반 충돌음은 서로 생략시키지 않는다', async () => {
	const { audio, context, sources } = fixture();
	await audio.prepare(['pulse', 'gust', 'thock']);
	const events = ['thock', 'pulse', 'pulse', 'gust'].map((type) => ({ type, x: 360, y: 200 }));
	assert.equal(audio.playCollisions(events), true);
	assert.equal(sources.length, 4);
	assert.ok(sources.every((s) => s.startTime === context.currentTime));
	assert.equal(audio.playCollisions(events), true);
	assert.equal(sources.length, 7, '일반 충돌만28ms 제한에 걸린다');
	audio.destroy();
});

test('스킬은 실제 화면과 겹치는 효과만 재생하며800높이와 바깥52 감쇠를 적용하지 않는다', async () => {
	const log = [];
	const { audio, context, sources } = fixture(undefined, { onDiagnostic: (e) => log.push(e) });
	await audio.prepare(['pulse', 'lightning', 'gust', 'thock']);
	audio.setView({
		left: 100,
		right: 500,
		top: 400,
		bottom: 1600,
		audioTop: 400,
		audioBottom: 1200
	});
	const cases = [
		['pulse', 300, 1500, true], // 기존800높이 바깥도 실제 화면이면 재생
		['pulse', 300, 1779, true],
		['pulse', 300, 1780, false],
		['pulse', -60, 300, false], // 원의 사각 모서리만 겹치는 경우 제외
		['pulse', -79, 600, true],
		['pulse', -80, 600, false],
		['lightning', 300, 2200, true], // 낙뢰 끝이 밖이어도 번개 줄기가 보임
		['lightning', 300, 400, false],
		['lightning', 515, 900, true],
		['lightning', 516, 900, false],
		['gust', 300, 1839, true], // 바람 뿌리가 밖이어도 위쪽이 보임
		['gust', 300, 1840, false],
		['gust', 559, 900, true],
		['gust', 560, 900, false]
	];
	for (const [type, x, y, visible] of cases) {
		assert.equal(
			audio.playCollisions([{ kind: 'skill', type, x, y }]),
			visible,
			`${type} ${x},${y}`
		);
		if (!visible) assert.equal(log.at(-1).reason, 'outside-view');
	}
	assert.equal(sources.length, cases.filter((c) => c[3]).length);
	assert.equal(new Set(log.filter((e) => e.kind === 'played').map((e) => e.level)).size, 1);
	assert.equal(
		audio.playCollision({ type: 'thock', x: 300, y: 1500 }),
		false,
		'일반음은 기존 음향 범위를 유지한다'
	);
	assert.equal(audio.playCollision({ type: 'thock', x: 300, y: 1226 }), true);
	context.currentTime += 0.03;
	assert.equal(audio.playCollision({ type: 'thock', x: 300, y: 1252 }), false);
	audio.destroy();
});

test('카메라 밖으로 벗어난 스킬음은 줄여 끄며 다시 보여도 지난 발동을 재생하지 않는다', async () => {
	const { audio, context, sources } = fixture();
	await audio.prepare(['pulse', 'gust', 'thock']);
	const firstView = { top: 0, bottom: 800, left: 0, right: 720 };
	audio.setView(firstView);
	audio.playCollisions([{ kind: 'skill', type: 'gust', x: 360, y: 600 }]);
	audio.play('pulse', 360, true);
	audio.setView({ ...firstView, top: 700, bottom: 1500 });
	assert.equal(sources[0].stopped, true);
	assert.equal(sources[0].stopTime, context.currentTime + 0.012);
	assert.equal(sources[1].stopped, false, '도감 미리듣기는 카메라 위치와 무관하다');
	assert.equal(audio.playCollision({ type: 'thock', x: 360, y: 900 }), true);
	assert.equal(
		sources.at(-1).startTime,
		context.currentTime,
		'스킬 잔향 정리가 일반음을 지연시키지 않는다'
	);
	audio.setView(firstView);
	assert.equal(audio.playCollisions([]), false);
	assert.equal(sources.length, 3);
	audio.destroy();
});
