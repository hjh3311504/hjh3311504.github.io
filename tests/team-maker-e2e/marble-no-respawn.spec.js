import { test, expect } from '@playwright/test';
import { observeRace } from './helpers/observe-race.js';

test('깨진 블록은3초 이후와 일시정지 재개 후에도 빈자리로 남는다', async ({ page }) => {
	await observeRace(page);
	await page.goto('/marble-race');
	expect(await page.locator('main').ariaSnapshot()).toContain('레이스 시작');
	await page.getByRole('button', { name: '♫ 소리 켜짐', exact: true }).click();
	await page.getByRole('button', { name: '레이스 시작 ▶', exact: true }).first().click();
	await expect
		.poll(() =>
			page.evaluate(() => window.__raceState?.blocks.some((b) => b.tile && !b.alive) ?? false)
		)
		.toBe(true);
	const broken = await page.evaluate(() => ({
		time: window.__raceState.time,
		ids: window.__raceState.blocks.filter((b) => b.tile && !b.alive).map((b) => b.id)
	}));
	await expect
		.poll(() => page.evaluate(() => window.__raceState.time), { timeout: 10000 })
		.toBeGreaterThan(broken.time + 4);
	const checkBroken = () =>
		page.evaluate(
			(ids) =>
				window.__raceState.blocks
					.filter((b) => ids.includes(b.id))
					.every((b) => !b.alive && b.respawnAt === null && b.breakCycle === 1),
			broken.ids
		);
	expect(await checkBroken()).toBe(true);
	await page.getByRole('button', { name: '일시정지 Ⅱ', exact: true }).click();
	await page.locator('#resume-race').click();
	await expect(page.locator('.stage-state')).toHaveText('경기 중');
	expect(await checkBroken()).toBe(true);
});
