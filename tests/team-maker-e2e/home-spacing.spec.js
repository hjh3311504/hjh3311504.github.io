import { test, expect } from '@playwright/test';

for (const width of [320, 390, 820, 1440]) {
	test(`홈과 오류 화면은 ${width}px에서도 여백 단위와 카드 경계를 지킨다`, async ({ page }) => {
		await page.setViewportSize({ width, height: 1000 });
		for (const [route, stage, card, footerSelector] of [
			['/', '.home-stage', '.home-card', '.home-footer'],
			['/404.html', '.error-stage', '.error-card', '.error-card footer']
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
					.locator(`${stage}, ${card}, ${footerSelector}`)
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
					// 홈 footer는 카드 밖에서 둘러보기 카드와 같은 폭으로 이어진다.
					const footer = await page.locator(footerSelector).boundingBox();
					expect(Math.abs(footer.x - bounds.x)).toBeLessThan(1);
					expect(Math.abs(footer.x + footer.width - bounds.x - bounds.width)).toBeLessThan(1);
					// 둘러보기 카드는 바깥 카드가 넘친 부분을 잘라 가로 넘침으로 드러나지 않으므로 직접 확인한다.
					const overflow = await page.locator('.browse ul').evaluate((list) => {
						const right = list.getBoundingClientRect().right;
						return [...list.querySelectorAll('.project-card')].filter(
							(item) => item.getBoundingClientRect().right > right + 0.5
						).length;
					});
					expect(overflow).toBe(0);
				}
			}
		}
	});
}

test('홈 본문이 짧아도 footer는 첫 화면 아래쪽에 머문다', async ({ page }) => {
	await page.setViewportSize({ width: 1440, height: 4000 });
	await page.goto('/');
	await page.evaluate(() => document.fonts.ready);
	const gap = await page.evaluate(() => {
		const stage = document.querySelector('.home-stage');
		const footer = document.querySelector('.home-footer').getBoundingClientRect();
		return (
			stage.getBoundingClientRect().bottom -
			parseFloat(getComputedStyle(stage).paddingBottom) -
			footer.bottom
		);
	});
	expect(Math.abs(gap)).toBeLessThan(1);
});
