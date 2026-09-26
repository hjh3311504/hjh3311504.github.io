import { test, expect } from '@playwright/test';

for (const route of ['/', '/team-maker', '/qr-code', '/marble-race']) {
	for (const width of [320, 390, 1440]) {
		test(`${route} ${width}px에서 공통 글자·여백·모달 기준을 지킨다`, async ({ page }) => {
			await page.setViewportSize({ width, height: 1000 });
			const errors = [];
			page.on('pageerror', (error) => errors.push(error.message));
			await page.goto(route);
			expect(await page.locator('main').ariaSnapshot()).toContain('heading');
			await page.evaluate(() => document.fonts.ready);
			if (route === '/marble-race')
				await expect(
					page.getByRole('button', { name: '레이스 시작 ▶', exact: true }).first()
				).toBeEnabled();
			for (const theme of ['light', 'dark']) {
				await page.evaluate((theme) => {
					document.documentElement.dataset.theme = theme;
					document.querySelector('.site-shell').dataset.theme = theme;
				}, theme);
				const invalidSizes = await page.locator('main').evaluate((main) =>
					[...main.querySelectorAll('*')]
						.filter((element) => {
							if (element.closest('svg, canvas, .qr-caption-space') || !element.checkVisibility())
								return false;
							return (
								[...element.childNodes].some(
									(node) => node.nodeType === 3 && node.textContent.trim()
								) && parseFloat(getComputedStyle(element).fontSize) % 2 !== 0
							);
						})
						.map((element) => ({
							tag: element.tagName,
							class: element.className,
							size: getComputedStyle(element).fontSize
						}))
				);
				expect(invalidSizes).toEqual([]);
				expect(
					await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)
				).toBe(true);
				const badges = page.locator('.ui-step-number');
				for (const badge of await badges.all()) {
					await expect(badge).toHaveCSS('width', '26px');
					await expect(badge).toHaveCSS('font-size', '14px');
					await expect(badge.locator('..')).toHaveCSS('gap', '12px');
				}
				const trigger = page
					.locator('footer')
					.getByRole('button', { name: '개인정보처리방침', exact: true });
				await trigger.click();
				const dialog = page.getByRole('dialog', { name: '개인정보처리방침', exact: true });
				expect(await dialog.ariaSnapshot()).toContain('브라우저에 저장하는 정보');
				await expect(dialog).toHaveCSS('padding', width <= 760 ? '16px' : '24px');
				await expect(dialog).toHaveCSS('gap', '16px');
				await expect(dialog.getByRole('heading', { level: 2 })).toHaveCSS('font-size', '22px');
				const bounds = await dialog.boundingBox();
				expect(bounds.x).toBeGreaterThanOrEqual(0);
				expect(bounds.x + bounds.width).toBeLessThanOrEqual(width);
				await page.keyboard.press('Tab');
				expect(await dialog.evaluate((element) => element.contains(document.activeElement))).toBe(
					true
				);
				await page.keyboard.press('Escape');
				await expect(dialog).not.toBeVisible();
				await expect(trigger).toBeFocused();
			}
			expect(errors).toEqual([]);
		});
	}
}

test('QR 입력·북마크·이미지 저장·인쇄 모달은 분리 후에도 연결된다', async ({ page }) => {
	await page.goto('/qr-code');
	expect(await page.locator('main').ariaSnapshot()).toContain('웹페이지 주소');
	await page.getByLabel('웹페이지 주소').fill('https://example.com/');
	await page.getByLabel('제목', { exact: true }).fill('한글제목열글자확인용');
	const download = page.getByRole('button', { name: 'PNG 저장', exact: true });
	await expect(download).toBeEnabled();
	const pending = page.waitForEvent('download');
	await download.click();
	expect((await pending).suggestedFilename()).toMatch(/\.png$/);
	await page.getByRole('button', { name: '북마크에 저장', exact: true }).click();
	await expect(page.locator('.bookmark-open')).toHaveCount(1);
	await page.getByLabel('웹페이지 주소').fill('https://example.org/');
	await page.locator('.bookmark-open').click();
	await expect(page.getByLabel('웹페이지 주소')).toHaveValue('https://example.com/');
	await page.getByRole('button', { name: '크게 보기', exact: true }).click();
	const expanded = page.getByRole('dialog', { name: 'QR 코드 크게 보기' });
	expect(await expanded.ariaSnapshot()).toContain('QR 코드 크게 보기');
	await expect(expanded).toBeVisible();
	await page.keyboard.press('Escape');
	await page.getByRole('button', { name: '인쇄', exact: true }).click();
	const print = page.getByRole('dialog', { name: 'QR 코드 인쇄', exact: true });
	expect(await print.ariaSnapshot()).toContain('인쇄 배열');
	await print.getByLabel('3열×4행 — 12개').check();
	await print.getByRole('button', { name: '취소', exact: true }).click();
	await expect(print).not.toBeVisible();
	await expect(page.getByRole('button', { name: '인쇄', exact: true })).toBeFocused();
});
