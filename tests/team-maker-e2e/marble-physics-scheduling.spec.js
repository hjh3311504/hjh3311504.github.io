import { test, expect } from '@playwright/test';
import { observeRace } from './helpers/observe-race.js';

for (const width of [1440, 390]) {
	const count = width === 1440 ? 1000 : 100;
	test(`${width}px·${count}개에서 화면10fps여도2배속 계산·최대60회 상태 전달을 유지하고 정지·재개·초기화를 지킨다`, async ({
		page
	}) => {
		await page.setViewportSize({ width, height: 1000 });
		await observeRace(page);
		await page.addInitScript((count) => {
			window.__frameCounts = { frames: 0, acknowledgements: 0 };
			const NativeWorker = window.Worker;
			window.Worker = class extends NativeWorker {
				constructor(...args) {
					super(...args);
					this.addEventListener('message', ({ data }) => {
						if (data.kind === 'frame') window.__frameCounts.frames++;
						if (data.kind === 'advanced') window.__frameCounts.acknowledgements++;
					});
				}
			};
			// 화면 갱신과 물리 계산 요청이 묶여 있으면 최대0.33배속에 그친다.
			window.requestAnimationFrame = (callback) =>
				setTimeout(() => callback(performance.now()), 100);
			window.cancelAnimationFrame = clearTimeout;
			localStorage.setItem(
				'lake.marble-race.v1',
				JSON.stringify({
					namesText: `공*${count}`,
					mapId: 'keyboard',
					mode: 'last',
					soundEnabled: false,
					skillsEnabled: true
				})
			);
		}, count);
		await page.goto('/marble-race');
		expect(await page.locator('main').ariaSnapshot()).toContain('레이스 시작');
		const start = page.getByRole('button', { name: '레이스 시작 ▶', exact: true }).first();
		await start.click();
		await expect(page.locator('.stage-state')).toHaveText('경기 중');
		await page.getByRole('button', { name: '경기 배속 전환' }).click();
		const measure = () =>
			page.evaluate(async () => {
				const began = performance.now(),
					time = window.__raceState?.time ?? 0;
				window.__frameCounts = { frames: 0, acknowledgements: 0 };
				await new Promise((resolve) => setTimeout(resolve, 2000));
				const seconds = (performance.now() - began) / 1000;
				return {
					speed: (window.__raceState.time - time) / seconds,
					frameHz: window.__frameCounts.frames / seconds,
					acknowledgements: window.__frameCounts.acknowledgements
				};
			});
		const initial = await measure();
		expect(initial.speed).toBeGreaterThan(1.8);
		expect(initial.frameHz).toBeLessThanOrEqual(61);
		// 계산이16.7ms 이상 걸리면 모든 응답이 상태를 담아도 정상이다.
		// 생략 응답의 발생·이벤트 보존은 frame-batch.test.js의 고정 시계로 검사한다.
		expect(initial.frameHz).toBeGreaterThan(0);
		await page.getByRole('button', { name: '일시정지 Ⅱ', exact: true }).click();
		await expect(page.locator('.stage-state')).toHaveText('일시정지');
		// 정지 직전에 보낸 응답 한 개가 도착한 뒤에는 계산이 더 진행되지 않는다.
		await page.waitForTimeout(150);
		const paused = await page.evaluate(() => window.__raceState.time);
		await page.waitForTimeout(500);
		expect(await page.evaluate(() => window.__raceState.time)).toBe(paused);
		await page
			.getByRole('region', { name: '일시정지', exact: true })
			.getByRole('button', { name: '계속하기 ▶', exact: true })
			.click();
		const resumed = await measure();
		expect(resumed.speed).toBeGreaterThan(1.8);
		expect(resumed.frameHz).toBeLessThanOrEqual(61);
		await page.getByRole('button', { name: '일시정지 Ⅱ', exact: true }).click();
		await page.getByRole('button', { name: '종료하고 설정 변경', exact: true }).click();
		await expect(page.locator('.stage-state')).toHaveText('출발 준비');
		await start.click();
		await expect.poll(() => page.evaluate(() => window.__raceState.time)).toBeLessThan(1);
		await expect(page.getByRole('button', { name: '경기 배속 전환' })).toHaveText('1배속');
	});
}

test('긴 화면 작업의500ms도 버리지 않고 실제2배속으로 따라잡는다', async ({ page }) => {
	await observeRace(page, 47);
	await page.goto('/marble-race');
	expect(await page.locator('main').ariaSnapshot()).toContain('레이스 시작');
	const start = page.getByRole('button', { name: '레이스 시작 ▶', exact: true }).first();
	await expect(start).toBeEnabled();
	await page.getByLabel('참가자 이름').fill('공*1000');
	await page.getByRole('button', { name: '마지막', exact: true }).click();
	await page.getByRole('button', { name: '♫ 소리 켜짐', exact: true }).click();
	await start.click();
	await page.getByRole('button', { name: '경기 배속 전환' }).click();
	await expect(page.getByRole('button', { name: '경기 배속 전환' })).toHaveText('2배속');
	const actual = await page.evaluate(async () => {
		const start = performance.now(),
			time = window.__raceState.time;
		setTimeout(() => {
			const until = performance.now() + 500;
			while (performance.now() < until) {
				/* 긴 화면 작업 재현 */
			}
		}, 100);
		await new Promise((resolve) => setTimeout(resolve, 3000));
		return (window.__raceState.time - time) / ((performance.now() - start) / 1000);
	});
	expect(actual).toBeGreaterThanOrEqual(1.9);
	expect(actual).toBeLessThanOrEqual(2.1);
});
