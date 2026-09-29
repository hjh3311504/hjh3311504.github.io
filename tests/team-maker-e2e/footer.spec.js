import { test, expect } from '@playwright/test';

for (const route of [
	'/',
	'/team-maker',
	'/qr-code',
	'/marble-race',
	'/blog',
	'/blog/team-maker-introduction'
]) {
	test(`${route} footer는 개인정보처리방침 다음에 저작권을 표시한다`, async ({ page }) => {
		await page.goto(route);
		expect(await page.locator('main').ariaSnapshot()).toContain('개인정보처리방침');
		const footer = page.locator('footer');
		const trigger = footer.getByRole('button', { name: '개인정보처리방침', exact: true });
		const copyright = footer.getByText("© 2026 Lake's develog", { exact: true });
		if (route !== '/') {
			await expect(footer.getByRole('link', { name: '라이선스', exact: true })).toHaveCount(0);
			await expect(footer.getByRole('link', { name: 'RSS 구독' })).toHaveCount(
				route.startsWith('/blog') ? 1 : 0
			);
			if (route.startsWith('/blog'))
				await expect(footer.getByRole('link', { name: 'RSS 구독' })).toHaveAttribute(
					'href',
					'/rss.xml'
				);
		}
		for (const width of [1440, 320]) {
			await page.setViewportSize({ width, height: 1000 });
			await footer.scrollIntoViewIfNeeded();
			await expect(trigger).toBeVisible();
			await expect(copyright).toBeVisible();
			if (route !== '/') {
				await expect(trigger).toHaveCSS('font-size', '12px');
				await expect(copyright).toHaveCSS('font-size', '12px');
				await expect(footer).toHaveCSS('border-top-width', '0px');
				const gap = await footer.evaluate((element) => {
					const parent = element.parentElement;
					const previous = element.previousElementSibling ?? parent.previousElementSibling;
					return element.getBoundingClientRect().top - previous.getBoundingClientRect().bottom;
				});
				expect(gap).toBeCloseTo(32, 0);
			}
			const first = await trigger.boundingBox();
			const second = await copyright.boundingBox();
			expect(
				first.y <= second.y + second.height &&
					(first.x < second.x || first.y + first.height <= second.y + 1)
			).toBe(true);
			expect(second.x + second.width).toBeLessThanOrEqual(width);
		}
		await trigger.click();
		const dialog = page.getByRole('dialog', { name: '개인정보처리방침', exact: true });
		await expect(dialog).toBeVisible();
		await dialog.getByRole('button', { name: '개인정보처리방침 닫기', exact: true }).click();
		await expect(dialog).not.toBeVisible();
		await expect(trigger).toBeFocused();
	});
}
