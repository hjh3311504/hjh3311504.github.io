import { expect, test } from '@playwright/test';

test('홈·팀 메이커·404와 페이지 이동에서 외부 글꼴을 요청하지 않는다', async ({ page }) => {
	const externalRequests = [];
	page.on('request', (request) => {
		const url = new URL(request.url());
		if (url.protocol.startsWith('http') && !['localhost', '127.0.0.1'].includes(url.hostname)) {
			externalRequests.push(url.href);
		}
	});
	for (const route of ['/', '/team-maker', '/404']) {
		await page.goto(route);
		await expect(page.locator('.site-shell')).toBeVisible();
		await page.evaluate(() => document.fonts.ready);
		expect(await page.evaluate(() => document.fonts.check('16px SUIT', '팀 메이커'))).toBe(true);
	}
	await page.getByRole('link', { name: '홈으로 이동' }).click();
	await page.locator('a[href="/team-maker"]').first().click();
	await expect(page.locator('.team-maker-page')).toBeVisible();
	await page.locator('#person-name').fill('똠방각하,뷁쀍,가람,나래');
	await page.locator('#add-person-form button[type="submit"]').click();
	await expect(page.locator('#participant-list > li')).toHaveCount(4);
	await expect(page.locator('.team-maker-page')).toHaveClass(/team-maker-font-expanded/);
	await page.evaluate(() => document.fonts.ready);
	expect(await page.evaluate(() => document.fonts.check('16px "SUIT Full"', '똠방각하'))).toBe(
		true
	);
	await page.locator('a[href="/"]').first().click();
	await page.locator('footer .privacy-trigger').click();
	await expect(page.getByRole('dialog')).toContainText('GitHub Pages');
	await expect(page.getByRole('dialog')).not.toContainText('jsDelivr');
	expect(externalRequests).toEqual([]);
});

test('기존 테마 설정을 복원하고 잘못된 값과 저장 차단도 처리한다', async ({ page }) => {
	await page.goto('/');
	await page.evaluate(() => localStorage.setItem('juno.develog.theme', 'dark'));
	await page.reload();
	await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
	await expect(page.locator('.site-shell')).toHaveAttribute('data-theme', 'dark');
	await page.getByRole('button', { name: '테마 변경, 현재 어둡게' }).click();
	await expect(page.locator('html')).toHaveAttribute('data-theme', 'auto');
	expect(await page.evaluate(() => localStorage.getItem('juno.develog.theme'))).toBe('auto');
	await page.evaluate(() => localStorage.setItem('juno.develog.theme', 'invalid'));
	await page.reload();
	await expect(page.locator('.site-shell')).toHaveAttribute('data-theme', 'auto');
	await page.addInitScript(() => {
		Storage.prototype.getItem = () => {
			throw new Error('저장 차단');
		};
		Storage.prototype.setItem = () => {
			throw new Error('저장 차단');
		};
	});
	await page.reload();
	await expect(page.locator('.site-shell')).toHaveAttribute('data-theme', 'auto');
	await page.getByRole('button', { name: '테마 변경, 현재 자동' }).click();
	await expect(page.locator('.site-shell')).toHaveAttribute('data-theme', 'light');
});

test('정적 404는 JavaScript 없이도 안내와 홈 링크를 제공한다', async ({ browser, baseURL }) => {
	const context = await browser.newContext({ javaScriptEnabled: false, baseURL });
	try {
		const page = await context.newPage();
		await page.goto('/404');
		await expect(page.getByRole('heading', { name: '페이지를 찾을 수 없습니다' })).toBeVisible();
		await expect(page.getByRole('link', { name: '홈으로 이동' })).toHaveAttribute('href', '/');
		await expect(page.locator('meta[name="robots"]')).toHaveAttribute('content', 'noindex');
		await expect(page.locator('link[rel="canonical"]')).toHaveCount(0);
	} finally {
		await context.close();
	}
});
