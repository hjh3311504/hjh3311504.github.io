import { test, expect } from '@playwright/test';
import { observeRace } from './helpers/observe-race.js';

test('마지막 방식은1개만 남을 때 당첨·팡파레를 실행하고 실제 골인 때 반복하지 않는다', async ({
	page
}) => {
	test.setTimeout(90000);
	await observeRace(page, 47);
	await page.goto('/marble-race');
	expect(await page.locator('main').ariaSnapshot()).toContain('골인하지 않은 구슬이 1개만 남으면');
	await page.locator('canvas').evaluate((canvas) => {
		window.__fanfares = [];
		canvas.setAttribute('data-audio-diagnostics', '');
		canvas.addEventListener('marble-audio', ({ detail }) => {
			if (detail.kind === 'played' && detail.type === 'fanfare') {
				const state = window.__raceState;
				window.__fanfares.push({
					arrived: state.finished.length,
					remaining: state.marbles.filter((m) => !m.finished).map((m) => m.id),
					winners: state.cinematic.newWinners.map((m) => m.id),
					active: state.cinematic.active
				});
			}
		});
	});
	await page.getByLabel('참가자 이름').fill('토끼\n고양이');
	await page.getByRole('button', { name: '도각도각 키보드', exact: true }).click();
	await page.getByRole('button', { name: '마지막', exact: true }).click();
	await page.getByRole('button', { name: '구슬 굴리기 ▶', exact: true }).first().click();
	await expect(page.locator('.stage-state')).toHaveText('경기 중');
	await page.getByRole('button', { name: '경기 배속 전환', exact: true }).click();
	await expect(page.locator('.winner-panel')).toBeVisible({ timeout: 75000 });
	await expect(page.locator('.winner-celebration')).toBeVisible();
	const records = await page.evaluate(() => window.__fanfares);
	expect(records).toHaveLength(1);
	expect(records[0].arrived).toBe(1);
	expect(records[0].remaining).toHaveLength(1);
	expect(records[0].winners).toEqual(records[0].remaining);
	expect(records[0].active).toBe(false);
	await expect(page.getByRole('button', { name: '경기 배속 전환', exact: true })).toHaveText(
		'2배속'
	);
	const selected = await page.locator('.winner-panel').innerText();
	await expect(page.locator('.stage-state')).toHaveText('경기 종료', { timeout: 15000 });
	await expect(page.locator('.winner-panel')).toHaveText(selected, { useInnerText: true });
	expect(await page.evaluate(() => window.__fanfares.length)).toBe(1);
});
