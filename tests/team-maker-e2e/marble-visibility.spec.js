import { observeMarbleText } from './helpers/marble-paint.js';
import { test, expect } from '@playwright/test';
import { screenRace } from './helpers/marble-screen-state.js';

async function expectToolbarInside(page) {
	const toolbar = page.locator('.stage-actions');
	await expect(toolbar.locator('button')).toHaveCount(5);
	await toolbar.scrollIntoViewIfNeeded();
	const geometry = await toolbar.evaluate((node) => {
		const stage = node.closest('.race-stage').getBoundingClientRect();
		const bar = node.getBoundingClientRect();
		return [...node.querySelectorAll('button')].map((button) => {
			const r = button.getBoundingClientRect();
			return {
				text: button.textContent,
				inside:
					r.left >= Math.max(0, stage.left, bar.left) &&
					r.right <= Math.min(innerWidth, stage.right, bar.right) + 1 &&
					r.top >= bar.top &&
					r.bottom <= bar.bottom + 1,
				fits: button.scrollWidth <= button.clientWidth
			};
		});
	});
	for (const button of geometry) {
		expect(button.inside, button.text).toBe(true);
		expect(button.fits, button.text).toBe(true);
	}
}

for (const width of [320, 360, 390, 768, 1440]) {
	test(`너비${width}px에서 상단 버튼5개가 모든 경기 상태에서 잘리지 않는다`, async ({ page }) => {
		await page.setViewportSize({ width, height: 1000 });
		await screenRace(page);
		await page.goto('/marble-race');
		expect(await page.locator('main').ariaSnapshot()).toContain('스킬 사용');
		await expectToolbarInside(page);
		const skill = page.getByRole('button', { name: '스킬 사용', exact: true });
		await skill.click();
		await expect(skill).toHaveText('스킬 사용 OFF');
		await expectToolbarInside(page);
		await skill.click();
		await page.getByRole('button', { name: '♫ 소리 켜짐', exact: true }).click();
		await page.getByRole('button', { name: '레이스 시작 ▶', exact: true }).first().click();
		await expect(page.locator('.stage-state')).toHaveText('경기 중');
		await expectToolbarInside(page);
		await page.evaluate(() => {
			window.__racePhase = 'finale';
		});
		await expect(page.getByRole('button', { name: '경기 배속 전환' })).toHaveText('0.25배속');
		await expectToolbarInside(page);
		await page.getByRole('button', { name: '경기장 전체화면', exact: true }).click();
		await expect(page.locator('.race-stage')).toHaveJSProperty('clientWidth', width);
		await expect(page.getByRole('button', { name: '전체화면 닫기', exact: true })).toBeVisible();
		await expectToolbarInside(page);
		await page.getByRole('button', { name: '전체화면 닫기', exact: true }).click();
		await page.getByRole('button', { name: '일시정지 Ⅱ', exact: true }).click();
		await expect(page.locator('.stage-state')).toHaveText('일시정지');
		await expectToolbarInside(page);
	});
}

test('겹친 이름표보다 구슬을 앞에 그리고 추적 이름은 이름표 중 마지막에 표시한다', async ({
	page
}) => {
	await page.setViewportSize({ width: 390, height: 1000 });
	await page.emulateMedia({ reducedMotion: 'no-preference' });
	await screenRace(page);
	await observeMarbleText(page);
	await page.addInitScript(() => {
		window.__raceOverlapping = true;
		window.__racePhase = 'finale';
		const fillRect = CanvasRenderingContext2D.prototype.fillRect;
		CanvasRenderingContext2D.prototype.fillRect = function (...args) {
			if (this.canvas.isConnected && args[0] === 0 && args[1] === 0 && this.fillStyle === '#101d2c')
				window.__labelDraws = [];
			return fillRect.apply(this, args);
		};
		window.__onMarbleText = (ctx, text) => {
			if (/^(겹침|[123]$)/.test(String(text))) {
				window.__labelDraws ??= [];
				window.__labelDraws.push(String(text));
			}
		};
	});
	await page.goto('/marble-race');
	expect(await page.locator('main').ariaSnapshot()).toContain('레이스 시작');
	await expect(
		page.getByRole('button', { name: '레이스 시작 ▶', exact: true }).first()
	).toBeEnabled();
	await page.getByLabel('참가자 이름').fill('겹침하나\n겹침둘\n겹침셋');
	await page.getByRole('button', { name: '♫ 소리 켜짐', exact: true }).click();
	await page.getByRole('button', { name: '레이스 시작 ▶', exact: true }).first().click();
	await expect(page.getByRole('button', { name: '경기 배속 전환' })).toHaveText('0.25배속');
	await expect
		.poll(() => page.evaluate(() => window.__labelDraws))
		.toEqual(['겹침둘', '겹침셋', '겹침하나', '2', '3', '1']);
	await page.evaluate(() => {
		window.__raceFocusId = 1;
	});
	await expect
		.poll(() => page.evaluate(() => window.__labelDraws))
		.toEqual(['겹침하나', '겹침셋', '겹침둘', '1', '3', '2']);
	// 미니맵은 입구 회전판1개를 실제 물리 배치대로 표시한다.
	await expect(page.locator('.race-minimap rect[fill="#00e5ed"]')).toHaveCount(1);
	await page.locator('.race-stage').screenshot({ path: '.context/marble-mobile-labels.png' });
	await page.getByRole('button', { name: '전체 맵', exact: true }).click();
	await expect
		.poll(() => page.evaluate(() => window.__labelDraws?.filter((text) => text.startsWith('겹침'))))
		.toEqual(['겹침둘']);
});
