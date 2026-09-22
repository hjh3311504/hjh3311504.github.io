import { test, expect } from '@playwright/test';
import { observeRace } from './helpers/observe-race.js';
import { mkdir } from 'node:fs/promises';

for (const width of [1440, 390]) {
	test(`번개·바람의 실제 발동과 정지·재개를 ${width}px 화면에서 확인한다`, async ({ page }) => {
		const errors = [];
		page.on('pageerror', (error) => errors.push(error.message));
		await page.setViewportSize({ width, height: 1000 });
		await page.emulateMedia({ reducedMotion: width === 390 ? 'reduce' : 'no-preference' });
		await observeRace(page, 47);
		await page.goto('/marble-race');
		expect(await page.locator('main').ariaSnapshot()).toContain('번개');
		await page
			.getByLabel('참가자 이름')
			.fill(width === 390 ? '아주긴이름의구슬참가자입니다*30' : '공*30');
		await page.getByRole('button', { name: '♫ 소리 켜짐', exact: true }).click();
		await page.getByRole('button', { name: '구슬 굴리기 ▶', exact: true }).first().click();
		await expect(page.locator('.stage-state')).toHaveText('경기 중');
		await mkdir('.context', { recursive: true });
		for (const type of ['gust', 'lightning']) {
			await page.waitForFunction(
				(type) =>
					window.__raceState?.skillWaves?.some(
						(w) =>
							w.type === type && window.__raceState.time - w.time >= (type === 'gust' ? 0.25 : 0.04)
					),
				type,
				{ timeout: 12000, polling: 'raf' }
			);
			const wave = await page.evaluate(
				(type) => window.__raceState.skillWaves.find((w) => w.type === type),
				type
			);
			expect(wave.width).toBe(type === 'gust' ? 120 : 32);
			expect(await page.locator('.race-stage').ariaSnapshot()).toContain('경기 중');
			await page
				.locator('.race-stage')
				.screenshot({ path: `.context/marble-${type}-${width}.png` });
		}
		const held = await page.evaluate(() =>
			window.__raceState.marbles.filter((m) => m.held?.kind === 'lightning')
		);
		expect(held.length).toBeGreaterThan(0);
		for (const marble of held) expect([marble.vx, marble.vy]).toEqual([0, 0]);
		await page.getByRole('button', { name: '일시정지 Ⅱ', exact: true }).click();
		await expect(page.locator('.stage-state')).toHaveText('일시정지');
		const paused = await page.evaluate(() => structuredClone(window.__raceState));
		await page.waitForTimeout(250);
		expect(await page.evaluate(() => window.__raceState.time)).toBe(paused.time);
		await page.locator('#resume-race').click();
		// 해제 뒤 다시 맞을 수 있으므로 이전 고정의 만료를 확인한다.
		await page.waitForFunction(
			(previous) => {
				const state = window.__raceState;
				return previous.every(
					({ id, until }) =>
						state.time > until && state.marbles.find((m) => m.id === id)?.held?.until !== until
				);
			},
			held.map((m) => ({ id: m.id, until: m.held.until })),
			{ timeout: 5000 }
		);

		await page.getByRole('button', { name: '일시정지 Ⅱ', exact: true }).click();
		await page.getByRole('button', { name: '종료하고 설정 변경', exact: true }).click();
		const library = page.getByRole('region', { name: /^스킬/ });
		expect(await library.ariaSnapshot()).toContain('바람 소리 미리듣기');
		await library.screenshot({ path: `.context/marble-skills-library-${width}.png` });
		expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(
			true
		);
		expect(errors).toEqual([]);
	});
}
