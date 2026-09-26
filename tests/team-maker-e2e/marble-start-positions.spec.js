import { test, expect } from '@playwright/test';
import { createRace } from '../../src/lib/marble-race/physics.js';
import { DEFAULT_NAMES } from '../../src/lib/marble-race/settings.js';

test('배속 옆 자리섞기는 준비 배치만 바꾸고 실제 경기에서도 같은 자리로 출발한다', async ({
	page
}) => {
	await page.addInitScript(() => {
		window.__seatSeed = 47;
		const random = Crypto.prototype.getRandomValues;
		Crypto.prototype.getRandomValues = function (array) {
			if (array instanceof Uint32Array && array.length === 1) {
				array[0] = window.__seatSeed;
				return array;
			}
			return random.call(this, array);
		};
		const NativeWorker = window.Worker;
		window.Worker = class extends NativeWorker {
			constructor(...args) {
				super(...args);
				this.addEventListener('message', ({ data }) => {
					if (data.kind === 'ready')
						window.__startPositions = data.state.marbles.map(({ id, x, y }) => ({ id, x, y }));
				});
			}
		};
	});
	await page.goto('/marble-race');
	expect(await page.locator('main').ariaSnapshot()).toContain('자리섞기');
	const shuffle = page.getByRole('button', { name: '자리섞기', exact: true });
	await expect(shuffle).toBeEnabled();
	await expect(page.locator('.speed-toggle + button')).toHaveText('자리섞기');
	const canvas = page.locator('canvas[role="button"]');
	const before = await canvas.evaluate((el) => el.toDataURL());
	await page.evaluate(() => {
		window.__seatSeed = 999;
	});
	await shuffle.click();
	await expect.poll(() => canvas.evaluate((el) => el.toDataURL())).not.toBe(before);
	await expect(page.getByLabel('참가자 이름')).toHaveValue(DEFAULT_NAMES);
	await page.getByRole('button', { name: '♫ 소리 켜짐', exact: true }).click();
	await page.getByRole('button', { name: '레이스 시작 ▶', exact: true }).first().click();
	await expect(page.locator('.stage-state')).toHaveText('경기 중');
	await expect(shuffle).toBeDisabled();
	const expected = createRace(Array(10).fill('구슬'), 'keyboard', 999).marbles.map(
		({ id, x, y }) => ({ id, x, y })
	);
	expect(await page.evaluate(() => window.__startPositions)).toEqual(expected);
	await page.getByRole('button', { name: '일시정지 Ⅱ', exact: true }).click();
	await expect(shuffle).toBeDisabled();
	await page.setViewportSize({ width: 320, height: 844 });
	expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
});
