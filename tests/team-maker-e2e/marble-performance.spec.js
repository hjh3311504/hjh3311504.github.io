import { test, expect } from '@playwright/test';
import { cpus, totalmem } from 'node:os';
import { installRequestDrivenWorker } from './helpers/marble-request-driven.js';
import { installMarbleDiagnostics } from './helpers/marble-diagnostics.js';

for (const [mobile, selectedSpeed] of [
	[false, 1],
	[true, 1],
	[false, 2],
	[true, 2]
]) {
	test(`1000개 실제 경기의 ${mobile ? '모바일 크기·CPU4배 감속' : '데스크톱'} ${selectedSpeed}배속 화면과 조작 응답`, async ({
		page
	}, testInfo) => {
		test.setTimeout(60000);
		const processors = cpus();
		console.log(
			'성능 검사 환경',
			JSON.stringify({
				platform: process.platform,
				architecture: process.arch,
				processor: processors[0]?.model,
				processorCount: processors.length,
				memoryBytes: totalmem(),
				browser: page.context().browser()?.version()
			})
		);
		const requestDriven = process.env.MARBLE_REQUEST_DRIVEN === '1';
		if (requestDriven) await installRequestDrivenWorker(page);
		const diagnostic = process.env.MARBLE_PROFILE === '1';
		const profileStages = diagnostic ? await installMarbleDiagnostics(page) : null;
		await page.setViewportSize(
			mobile ? { width: 390, height: 844 } : { width: 1440, height: 1000 }
		);
		await page.addInitScript(() => {
			window.__paintFrames = [];
			const fill = CanvasRenderingContext2D.prototype.fillRect;
			CanvasRenderingContext2D.prototype.fillRect = function (...args) {
				if (
					this.canvas.getAttribute('role') === 'button' &&
					args[0] === 0 &&
					args[1] === 0 &&
					this.fillStyle === '#101d2c'
				)
					window.__paintFrames.push(performance.now());
				return fill.apply(this, args);
			};
			const NativeWorker = window.Worker;
			window.Worker = class extends NativeWorker {
				constructor(...args) {
					super(...args);
					this.addEventListener('message', ({ data }) => {
						if (data.kind === 'frame') {
							window.__performanceRaceTime = data.state.time;
							window.__performanceCinematic = data.state.cinematic?.active;
						}
						if (data.unused != null) window.__performanceUnused = data.unused;
					});
				}
				postMessage(data) {
					return super.postMessage(data.kind === 'prepare' ? { ...data, seed: 47 } : data);
				}
			};
		});
		await page.goto('/marble-race');
		expect(await page.locator('main').ariaSnapshot()).toContain('레이스 시작');
		const start = page.getByRole('button', { name: '레이스 시작 ▶', exact: true }).first();
		await expect(start).toBeEnabled();
		await page.getByLabel('참가자 이름').fill('구슬*1000');
		await page.getByRole('button', { name: '♫ 소리 켜짐', exact: true }).click();
		const cdp = await page.context().newCDPSession(page);
		if (mobile) await cdp.send('Emulation.setCPUThrottlingRate', { rate: 4 });
		await start.click();
		await expect(page.locator('.stage-state')).toHaveText('경기 중');
		if (selectedSpeed === 2) {
			await page.getByRole('button', { name: '경기 배속 전환' }).click();
			await expect(page.getByRole('button', { name: '경기 배속 전환' })).toHaveText('2배속');
		}
		await expect(page.locator('.race-stats')).toContainText('/ 1000 도착');
		if (profileStages)
			expect(profileStages()).toEqual([
				'decode',
				'encode',
				'physics',
				'presentation',
				'render',
				'workerBatch'
			]);
		const samples = [];
		for (const phase of ['출발', '진행']) {
			const metrics = await page.evaluate(async () => {
				window.__paintFrames = [];
				window.__marbleCosts = {};
				const realStart = performance.now(),
					raceStart = window.__performanceRaceTime ?? 0;
				await new Promise((resolve) => setTimeout(resolve, 5000));
				const frames = window.__paintFrames,
					seconds = (performance.now() - realStart) / 1000;
				const intervals = frames
					.slice(1)
					.map((v, i) => v - frames[i])
					.sort((a, b) => a - b);
				return {
					costs: Object.fromEntries(
						Object.entries(window.__marbleCosts).map(([name, value]) => [
							name,
							{ ...value, meanMs: value.ms / value.count }
						])
					),
					fps: frames.length / seconds,
					cinematicActive: window.__performanceCinematic,
					unusedSeconds: window.__performanceUnused,
					p95FrameMs: intervals[Math.floor(intervals.length * 0.95)],
					raceSeconds: (window.__performanceRaceTime ?? 0) - raceStart,
					realSeconds: seconds
				};
			});
			const sample = {
				selectedSpeed,
				phase,
				...metrics,
				raceSpeed: metrics.raceSeconds / metrics.realSeconds
			};
			samples.push(sample);
			// 기준 미달로 중단되어도 실제 경기 배속과 그리기 수치를 남긴다.
			const report = { requestDriven, diagnostic, mobile, cpuSlowdown: mobile ? 4 : 1, ...sample };
			console.log('1000개 성능 표본', JSON.stringify(report));
			await testInfo.attach(`1000개 성능 ${phase}`, {
				body: JSON.stringify(report, null, 2),
				contentType: 'application/json'
			});
			expect.soft(metrics.fps).toBeGreaterThanOrEqual(30);
			if (selectedSpeed === 2) {
				expect.soft(metrics.cinematicActive).toBe(false);
				// 수신 시점의 차이는 허용하되 출발 구간의 지속적인 계산 지연은 검출한다.
				expect.soft(sample.raceSpeed).toBeGreaterThanOrEqual(1.9);
				expect.soft(sample.raceSpeed).toBeLessThanOrEqual(2.1);
				expect.soft(metrics.unusedSeconds).toBeLessThanOrEqual(0.1);
			}
		}
		const buttonMs = await page.evaluate(
			() =>
				new Promise((resolve) => {
					const start = performance.now();
					const observer = new MutationObserver(() => {
						if (document.querySelector('.stage-state').textContent === '일시정지') {
							observer.disconnect();
							resolve(performance.now() - start);
						}
					});
					observer.observe(document.querySelector('.stage-state'), {
						childList: true,
						subtree: true,
						characterData: true
					});
					[...document.querySelectorAll('button')]
						.find((b) => b.textContent.includes('일시정지'))
						.click();
				})
		);
		expect(buttonMs).toBeLessThanOrEqual(200);
		const report = { mobile, cpuSlowdown: mobile ? 4 : 1, samples, buttonMs };
		console.log('1000개 실제 그리기 성능', JSON.stringify(report));
		await testInfo.attach('1000개 성능', {
			body: JSON.stringify(report, null, 2),
			contentType: 'application/json'
		});
		await cdp.send('Emulation.setCPUThrottlingRate', { rate: 1 });
	});
}
