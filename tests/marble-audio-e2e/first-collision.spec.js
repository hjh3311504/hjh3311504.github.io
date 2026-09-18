import { test, expect } from '@playwright/test';
import { readFileSync } from 'node:fs';
function singleHitRms(file, level) {
	const wav = readFileSync(new URL('../../static' + file, import.meta.url));
	const frames = Math.min((wav.length - 44) / 2, Math.floor(wav.readUInt32LE(24) * 0.08));
	let sum = 0;
	for (let i = 0; i < frames; i++) sum += (wav.readInt16LE(44 + i * 2) / 32768) ** 2;
	// 기본 볼륨45%, 스테레오에서 모노 분석기로 합칠 때의 최소 크기.
	return (Math.sqrt(sum / frames) * level * 0.45) / Math.SQRT2;
}

for (const [server, port] of [
	['정적 미리보기', 4179],
	['개발 서버', 5181]
])
	for (const map of ['도각도각 키보드', '톡톡 나무공방', '뽁뽁 물놀이']) {
		test(`${server} ${map}: 첫 충돌·재시작·미리듣기·재개·음소거 해제`, async ({ page }, info) => {
			await page.addInitScript(() => {
				window.__audioLog = [];
				window.__waves = [];
				window.__waveWindows = [];
				const create = AudioContext.prototype.createDynamicsCompressor;
				AudioContext.prototype.createDynamicsCompressor = function () {
					const compressor = create.call(this);
					window.__audioContext = this;
					const analyser = this.createAnalyser();
					analyser.fftSize = 256;
					compressor.connect(analyser);
					const samples = new Float32Array(256);
					setInterval(() => {
						analyser.getFloatTimeDomainData(samples);
						const peak = Math.max(...samples.map(Math.abs));
						const rms = Math.sqrt(samples.reduce((sum, v) => sum + v * v, 0) / samples.length);
						window.__waveWindows.push({ wallTime: performance.now(), rms, peak });
						if (peak > 0.001)
							window.__waves.push({
								wallTime: performance.now(),
								audioTime: this.currentTime,
								peak
							});
					}, 5);
					return compressor;
				};
			});
			await page.goto(`http://127.0.0.1:${port}/marble-race`);
			expect(await page.locator('main').ariaSnapshot()).toContain('구슬');
			await page.locator('canvas').evaluate((canvas) => {
				canvas.setAttribute('data-audio-diagnostics', '');
				canvas.addEventListener('marble-audio', (event) => window.__audioLog.push(event.detail));
			});
			await page.getByRole('button', { name: map, exact: true }).click();
			const reports = [];
			async function clear() {
				await page.evaluate(() => {
					window.__audioLog = [];
					window.__waves = [];
					window.__waveWindows = [];
				});
			}
			async function verify(label) {
				await page.waitForFunction(() =>
					window.__audioLog.some(
						(e) =>
							e.kind === 'played' &&
							e.event?.broken &&
							window.__waves.some((w) => w.wallTime >= e.wallTime) &&
							performance.now() > e.wallTime + 220
					)
				);
				const result = await page.evaluate(() => {
					const first = window.__audioLog.find(
						(e) =>
							e.kind === 'collision' &&
							e.audible &&
							e.event.broken &&
							e.event.y >= e.view.top &&
							e.event.y <= e.view.bottom
					);
					const played = window.__audioLog.find((e) => e.kind === 'played' && e.event?.broken);
					const wave = window.__waves.find((e) => e.wallTime >= played.wallTime);
					const early = window.__waveWindows.filter(
						(w) => w.wallTime >= wave.wallTime && w.wallTime < wave.wallTime + 80
					);
					const first80msRms = Math.sqrt(
						early.reduce((sum, w) => sum + w.rms * w.rms, 0) / early.length
					);
					return {
						first,
						first80msRms,
						played,
						wave,
						latency: window.__audioContext.baseLatency ?? 0,
						outputLatency: window.__audioContext.outputLatency ?? 0,
						skips: window.__audioLog.filter((e) => e.kind === 'skipped').slice(0, 20)
					};
				});
				expect(result.first).toBeTruthy();
				expect(result.wave).toBeTruthy();
				expect(result.played.wallTime - result.first.wallTime).toBeLessThan(60);
				expect(result.wave.wallTime - result.played.wallTime).toBeLessThan(
					200 + (result.latency + result.outputLatency) * 1000
				);
				if (['새 진입 1배속', '재시작 2배속', '미리듣기 후 시작'].includes(label)) {
					expect(result.first.event.blockId).toMatch(/^layer-0-0-/);
					expect(result.first.event.time).toBeLessThan(1.2);
					// 단일 도각의 예상 RMS도0.01보다 작다. 겹침 수 대신 해당 음원 대비 실제 출력을 검사한다.
					result.expectedSingleRms = singleHitRms(result.played.file, result.played.level);
					expect(result.first80msRms).toBeGreaterThan(result.expectedSingleRms * 0.25);
				}
				reports.push({ label, ...result });
			}
			async function start(speed = 1) {
				await clear();
				await page.getByRole('button', { name: '구슬 굴리기 ▶', exact: true }).first().click();
				await expect(page.locator('.stage-state')).toHaveText('경기 중');
				if (speed === 2)
					await page.getByRole('button', { name: '경기 배속 전환', exact: true }).click();
			}
			await start();
			await verify('새 진입 1배속');
			await page
				.getByRole('button', { name: '경기 종료하고 설정 변경', exact: true })
				.first()
				.click();
			await page.getByRole('button', { name: '종료하고 설정 변경', exact: true }).click();
			await start(2);
			await verify('재시작 2배속');
			await page
				.getByRole('button', { name: '경기 종료하고 설정 변경', exact: true })
				.first()
				.click();
			await page.getByRole('button', { name: '종료하고 설정 변경', exact: true }).click();
			for (const [type, name] of [
				['clicky', /찰칵 키보드 소리/],
				['thock2', /도각 키보드2 소리/],
				['wrap', /뽁뽁이 소리/]
			]) {
				await clear();
				await page.getByRole('button', { name }).click();
				await page.waitForFunction((type) => {
					const preview = window.__audioLog.find((e) => e.kind === 'played' && e.type === type);
					return preview && window.__waves.some((w) => w.wallTime >= preview.wallTime);
				}, type);
				await page.waitForTimeout(700);
			}
			await start();
			await verify('미리듣기 후 시작');
			await page.getByRole('button', { name: '일시정지 Ⅱ', exact: true }).click();
			await page.evaluate(async () => {
				await window.__audioContext.suspend();
				const original = window.__audioContext.resume.bind(window.__audioContext);
				window.__audioContext.resume = () =>
					new Promise((resolve) => {
						window.__releaseResume = async () => {
							await original();
							resolve();
						};
					});
			});
			const frozen = await page.locator('.race-stats').innerText();
			await page.getByRole('button', { name: '계속하기 ▶', exact: true }).last().click();
			await expect(page.locator('.stage-state')).toHaveText('소리 준비 중');
			await page.waitForTimeout(250);
			expect(await page.locator('.race-stats').innerText()).toBe(frozen);
			await clear();
			await page.evaluate(() => window.__releaseResume());
			await expect(page.locator('.stage-state')).toHaveText('경기 중');
			await verify('오디오 재개 대기');
			await page.getByRole('button', { name: '♫ 소리 켜짐', exact: true }).click();
			await page.waitForTimeout(200);
			await clear();
			await page.getByRole('button', { name: '♪ 소리 꺼짐', exact: true }).click();
			await verify('음소거 해제');
			await info.attach('첫 충돌과 실제 출력', {
				body: JSON.stringify(reports, null, 2),
				contentType: 'application/json'
			});
		});
	}
