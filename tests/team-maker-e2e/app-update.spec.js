import { expect, test } from '@playwright/test';

const notice = '[data-app-update-notice]';

// 새 배포를 흉내 내려고 version.json 응답만 다른 버전으로 바꾼다.
// 광고 제외 경로(/privacy)는 원래 새 문서로 열리므로 이동 검사에는 /about과 /qr-code만 쓴다.
async function openWithNewDeploy(page, path) {
	await page.clock.install();
	await page.addInitScript(() => {
		window.__versionChecks = 0;
		const nativeFetch = window.fetch;
		window.fetch = (input, init) => {
			if (String(input).endsWith('/_app/version.json')) window.__versionChecks += 1;
			return nativeFetch(input, init);
		};
	});
	await page.route('**/_app/version.json', (route) =>
		route.fulfill({ json: { version: 'next-deploy' } })
	);
	await page.goto(path);
	await markDocument(page);
}

const markDocument = (page) => page.evaluate(() => (window.__previousDocument = true));
// 새로고침 중에는 확인할 문서가 없으므로 null을 돌려주고 다시 확인한다.
const isSameDocument = (page) =>
	page.evaluate(() => window.__previousDocument === true).catch(() => null);
const navLink = (page, name) => page.locator('.site-shell').getByRole('link', { name }).first();

async function showVisibleCheck(page) {
	await page.clock.fastForward('01:01');
	await page.evaluate(() => document.dispatchEvent(new Event('visibilitychange')));
	await expect(page.locator(notice)).toBeVisible();
}

test('5분 확인으로 새 배포를 찾으면 안내하고 다음 이동은 새 문서로 불러온다', async ({ page }) => {
	await openWithNewDeploy(page, '/about');
	await navLink(page, 'QR 코드').click();
	await page.waitForURL('**/qr-code');
	expect(await isSameDocument(page)).toBe(true);
	await expect(page.locator(notice)).toHaveCount(0);

	await page.clock.fastForward('05:01');
	await expect(page.getByRole('status').filter({ has: page.locator(notice) })).toContainText(
		'새 버전이 나왔어요'
	);

	await navLink(page, '소개·문의').click();
	await page.waitForURL('**/about');
	await expect.poll(() => isSameDocument(page)).toBe(false);
});

test('새 배포를 찾은 뒤 뒤로 가기는 도착한 페이지를 새 문서로 불러온다', async ({ page }) => {
	await openWithNewDeploy(page, '/about');
	await navLink(page, 'QR 코드').click();
	await page.waitForURL('**/qr-code');
	await showVisibleCheck(page);

	await page.goBack();
	await page.waitForURL('**/about');
	await expect.poll(() => isSameDocument(page)).toBe(false);
});

test('탭으로 돌아오면 1분에 한 번만 확인하고 닫은 안내는 다시 띄우지 않는다', async ({ page }) => {
	await openWithNewDeploy(page, '/qr-code');
	const versionChecks = () => page.evaluate(() => window.__versionChecks);

	// 1분 안에 다시 돌아온 탭은 확인하지 않는다.
	await page.clock.fastForward('00:30');
	await page.evaluate(() => document.dispatchEvent(new Event('visibilitychange')));
	expect(await versionChecks()).toBe(0);

	await page.clock.fastForward('00:31');
	await page.evaluate(() => document.dispatchEvent(new Event('visibilitychange')));
	await expect(page.locator(notice)).toBeVisible();
	expect(await versionChecks()).toBe(1);

	await page.getByRole('button', { name: '안내 닫기' }).click();
	await expect(page.locator(notice)).toHaveCount(0);
	expect(await isSameDocument(page)).toBe(true);

	await navLink(page, '소개·문의').click();
	await page.waitForURL('**/about');
	await expect.poll(() => isSameDocument(page)).toBe(false);
});

test('아수라장 검색 버튼이 있으면 안내를 그 위에 띄운다', async ({ page }) => {
	await page.setViewportSize({ width: 360, height: 760 });
	await openWithNewDeploy(page, '/aram-mayhem/teemo');
	await showVisibleCheck(page);

	const card = await page.locator(notice).boundingBox();
	const fab = await page.locator('.aram-search-fab').boundingBox();
	expect(card.y + card.height).toBeLessThanOrEqual(fab.y);
	await page.locator('.aram-search-fab').click();
	await expect(page.getByRole('dialog')).toBeVisible();
});

test('키보드로 안내를 닫으면 들어오기 전 위치로 focus를 돌려준다', async ({ page }) => {
	await openWithNewDeploy(page, '/qr-code');
	await showVisibleCheck(page);
	const address = page.getByRole('textbox', { name: '웹페이지 주소' });
	const close = page.getByRole('button', { name: '안내 닫기' });

	await address.focus();
	await close.focus();
	await page.keyboard.press('Enter');
	await expect(page.locator(notice)).toHaveCount(0);
	await expect(address).toBeFocused();
});

test('들어오기 전 위치가 사라졌으면 안내를 닫을 때 본문으로 focus를 보낸다', async ({ page }) => {
	await openWithNewDeploy(page, '/qr-code');
	await showVisibleCheck(page);
	await page.evaluate(() => {
		const button = document.createElement('button');
		button.id = 'temporary-focus';
		document.querySelector('main').append(button);
		button.focus();
	});

	await page.getByRole('button', { name: '안내 닫기' }).focus();
	await page.evaluate(() => document.getElementById('temporary-focus').remove());
	await page.keyboard.press('Enter');
	await expect(page.locator('main')).toBeFocused();
	await expect(page.locator('main')).toHaveCSS('outline-style', 'none');
});
