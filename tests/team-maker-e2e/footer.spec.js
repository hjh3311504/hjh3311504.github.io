import { test, expect } from '@playwright/test';

for (const route of [
	'/',
	'/team-maker',
	'/qr-code',
	'/marble-race',
	'/blog',
	'/blog/team-maker-introduction',
	'/about',
	'/privacy'
]) {
	test(`${route} footer는 소개·개인정보처리방침 다음에 저작권을 표시한다`, async ({ page }) => {
		await page.goto(route);
		const footer = page.locator('footer');
		const about = footer.getByRole('link', { name: '소개·문의', exact: true });
		const privacy = footer.getByRole('link', { name: '개인정보처리방침', exact: true });
		const copyright = footer.getByText("© 2026 Lake's develog", { exact: true });
		await expect(about).toHaveAttribute('href', '/about');
		await expect(privacy).toHaveAttribute('href', '/privacy');
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
			await expect(privacy).toBeVisible();
			await expect(copyright).toBeVisible();
			if (route !== '/') {
				await expect(privacy).toHaveCSS('font-size', '12px');
				await expect(copyright).toHaveCSS('font-size', '12px');
				await expect(footer).toHaveCSS('border-top-width', '0px');
				const gap = await footer.evaluate((element) => {
					const parent = element.parentElement;
					const previous = element.previousElementSibling ?? parent.previousElementSibling;
					return element.getBoundingClientRect().top - previous.getBoundingClientRect().bottom;
				});
				expect(gap).toBeCloseTo(32, 0);
			}
			const first = await privacy.boundingBox();
			const second = await copyright.boundingBox();
			expect(
				first.y <= second.y + second.height &&
					(first.x < second.x || first.y + first.height <= second.y + 1)
			).toBe(true);
			expect(second.x + second.width).toBeLessThanOrEqual(width);
		}
		if (route === '/privacy') return;
		await privacy.click();
		await expect(page).toHaveURL(/\/privacy$/);
		await expect(page.getByRole('heading', { name: '개인정보처리방침', level: 1 })).toBeVisible();
		await expect(page.locator('main')).toContainText('광고와 쿠키');
	});
}

test('소개 페이지는 메뉴에서 열리고 이메일 문의를 안내한다', async ({ page }) => {
	await page.goto('/blog');
	await page
		.getByRole('complementary')
		.getByRole('link', { name: '소개·문의', exact: true })
		.click();
	await expect(page).toHaveURL(/\/about$/);
	await expect(page.getByRole('heading', { name: '소개와 문의', level: 1 })).toBeVisible();
	await expect(page.getByRole('link', { name: 'hjh3311504@gmail.com' })).toHaveAttribute(
		'href',
		'mailto:hjh3311504@gmail.com'
	);
	for (const width of [320, 390, 1440]) {
		await page.setViewportSize({ width, height: 900 });
		expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(
			true
		);
	}
});

test('광고 코드가 실행된 화면에서 개인정보처리방침으로 가면 문서를 새로 불러온다', async ({
	page
}) => {
	await page.goto('/about');
	await expect(page.locator('script[src*="adsbygoogle.js"]')).toHaveCount(1);
	await page.evaluate(() => (window.__beforePrivacy = true));
	await page.locator('footer').getByRole('link', { name: '개인정보처리방침', exact: true }).click();
	await expect(page).toHaveURL(/\/privacy$/);
	await expect(page.getByRole('heading', { name: '개인정보처리방침', level: 1 })).toBeVisible();
	expect(await page.evaluate(() => window.__beforePrivacy)).toBeUndefined();
	await expect(page.locator('script[src*="adsbygoogle.js"]')).toHaveCount(0);

	await page.getByRole('link', { name: '소개·문의', exact: true }).first().click();
	await expect(page).toHaveURL(/\/about$/);
	await page.evaluate(() => (window.__beforePrivacy = true));
	await page.goBack();
	await expect(page).toHaveURL(/\/privacy$/);
	await expect.poll(() => page.evaluate(() => window.__beforePrivacy)).toBeUndefined();
});
