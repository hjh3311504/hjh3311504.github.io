import { test, expect } from '@playwright/test';

for (const mobile of [false, true]) {
	test(`1000개 실제 경기의 ${mobile ? '모바일 크기·CPU4배 감속' : '데스크톱'} 화면과 조작 응답`, async ({
		page
	}, testInfo) => {
		test.setTimeout(60000);
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
						if (data.kind === 'frame') window.__performanceRaceTime = data.state.time;
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
		await expect(page.locator('.race-stats')).toContainText('/ 1000 도착');
		const samples = [];
		for (const phase of ['출발', '진행']) {
			const metrics = await page.evaluate(async () => {
				window.__paintFrames = [];
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
					fps: frames.length / seconds,
					p95FrameMs: intervals[Math.floor(intervals.length * 0.95)],
					raceSeconds: (window.__performanceRaceTime ?? 0) - raceStart,
					realSeconds: seconds
				};
			});
			samples.push({ phase, ...metrics });
			expect(metrics.fps).toBeGreaterThanOrEqual(30);
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
