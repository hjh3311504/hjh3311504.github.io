import { test, expect } from '@playwright/test';

for (const width of [320, 390, 820, 1440]) {
	test(`홈과 오류 화면은 ${width}px에서도 여백 단위와 카드 경계를 지킨다`, async ({ page }) => {
		await page.setViewportSize({ width, height: 1000 });
		for (const [route, stage, card] of [
			['/', '.home-stage', '.home-card'],
			['/404.html', '.error-stage', '.error-card']
		]) {
			await page.goto(route);
			expect(await page.locator('main').ariaSnapshot()).toContain('heading');
			await page.evaluate(() => document.fonts.ready);
			for (const theme of ['light', 'dark']) {
				await page.evaluate((theme) => {
					document.documentElement.dataset.theme = theme;
					document.querySelector('.site-shell').dataset.theme = theme;
				}, theme);
				const spacing = await page
					.locator(`${stage}, ${card}, ${card} footer`)
					.evaluateAll((elements) =>
						elements.flatMap((element) => {
							const style = getComputedStyle(element);
							return [
								'paddingTop',
								'paddingRight',
								'paddingBottom',
								'paddingLeft',
								'marginRight',
								'marginBottom',
								'marginLeft'
							].map((property) => ({
								element: element.className || element.tagName,
								property,
								value: style[property]
							}));
						})
					);
				expect(
					spacing.filter(({ value }) => value !== 'auto' && parseFloat(value) % 4 !== 0)
				).toEqual([]);
				expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(
					true
				);
				const bounds = await page.locator(card).boundingBox();
				expect(bounds.x).toBeGreaterThanOrEqual(0);
				expect(bounds.x + bounds.width).toBeLessThanOrEqual(width);
				if (route === '/') {
					const footer = await page.locator(`${card} footer`).boundingBox();
					// 음수 여백은 카드의 내부 여백과 상쇄되어 테두리 안쪽까지 이어져야 한다.
					expect(Math.abs(footer.x - bounds.x - 1)).toBeLessThan(1);
					expect(Math.abs(footer.x + footer.width - bounds.x - bounds.width + 1)).toBeLessThan(1);
				}
			}
		}
	});
}
