import { expect, test } from '@playwright/test';
import { readFileSync, readdirSync } from 'node:fs';

const origin = 'https://analytics.example';
const consentKey = 'juno.develog.analytics-consent:v1';
const fixtureConfigured = readdirSync('build/_app/immutable', { recursive: true })
	.filter((file) => file.endsWith('.js'))
	.some((file) => {
		const source = readFileSync(`build/_app/immutable/${file}`, 'utf8');
		return source.includes('G-TEST000001') && source.includes(origin);
	});

// 예약 도메인의 정적 파일만 로컬 서버로 연결한다. Google 요청은 항상 가로챈다.
async function openAnalyticsSite(page, { blocked = false, path = '/' } = {}) {
	if (process.env.CI) expect(fixtureConfigured, 'PR build의 가짜 GA4 설정').toBe(true);
	test.skip(!fixtureConfigured, 'README의 가짜 GA4 설정으로 build하면 활성화 경로를 검사합니다.');
	const scripts = [];
	const unexpected = [];
	await page.route('**/*', async (route) => {
		const url = new URL(route.request().url());
		if (url.origin === origin) {
			const response = await route.fetch({
				url: `http://127.0.0.1:4174${url.pathname}${url.search}`
			});
			await route.fulfill({ response });
		} else if (url.hostname === 'www.googletagmanager.com') {
			scripts.push(url.href);
			if (blocked) await route.abort('blockedbyclient');
			else
				await route.fulfill({
					contentType: 'application/javascript',
					body: '/* 외부 전송 없는 시험용 태그 */'
				});
		} else {
			unexpected.push(url.href);
			await route.abort();
		}
	});
	await page.goto(`${origin}${path}`);
	await expect(page.locator('main')).toBeVisible();
	const notice = page.getByRole('region', { name: '방문 통계 선택' });
	await expect(notice).toBeVisible();
	expect(await notice.ariaSnapshot()).toContain('통계 거부');
	return { scripts, unexpected, notice };
}

async function views(page) {
	return page.evaluate(() =>
		(window.dataLayer ?? []).filter((args) => args[0] === 'event').map((args) => args[2])
	);
}

test('로컬 preview에서는 동의를 저장해도 통계를 요청하지 않는다', async ({ page }) => {
	const external = [];
	await page.route(
		/https:\/\/(?:[^/]+\.)?(?:google-analytics|googletagmanager)\.com\//,
		(route) => {
			external.push(route.request().url());
			return route.abort();
		}
	);
	await page.addInitScript((key) => localStorage.setItem(key, 'allowed'), consentKey);
	await page.goto('/');
	await expect(page.locator('main')).toBeVisible();
	await page.locator('a[href="/team-maker"]').first().click();
	await expect(page.locator('#person-name')).toBeVisible();
	expect(await views(page)).toEqual([]);
	expect(external).toEqual([]);
});

test('동의 전에는 전송하지 않고 허용 후 내부 이동·뒤로·앞으로·새로고침을 집계한다', async ({
	page
}) => {
	const { notice, scripts, unexpected } = await openAnalyticsSite(page, {
		path: '/?name=비밀#입력'
	});
	expect(scripts).toEqual([]);
	await notice.getByRole('button', { name: '통계 허용', exact: true }).click();
	await expect.poll(async () => (await views(page)).length).toBe(1);
	await page.locator('a[href="/team-maker"]').first().click();
	await expect.poll(async () => (await views(page)).length).toBe(2);
	await page.goBack();
	await expect.poll(async () => (await views(page)).length).toBe(3);
	await page.goForward();
	await expect.poll(async () => (await views(page)).length).toBe(4);
	const events = await views(page);
	expect(events.map((event) => event.page_location)).toEqual(
		['/', '/team-maker', '/', '/team-maker'].map((path) => origin + path)
	);
	expect(JSON.stringify(events)).not.toContain('비밀');
	expect(scripts).toHaveLength(1);
	await page.reload();
	await expect.poll(async () => (await views(page)).length).toBe(1);
	expect(scripts).toHaveLength(2);
	expect(unexpected).toEqual([]);
});

test('입력과 query·hash 변경은 추가 방문이나 입력 내용으로 전송하지 않는다', async ({ page }) => {
	const { notice } = await openAnalyticsSite(page, { path: '/team-maker' });
	await notice.getByRole('button', { name: '통계 허용', exact: true }).click();
	await expect.poll(async () => (await views(page)).length).toBe(1);
	await page.locator('#person-name').fill('비밀이름,두번째이름');
	await page.locator('#add-person-form button[type="submit"]').click();
	await expect(page.locator('#participant-list > li')).toHaveCount(2);
	await page.evaluate(() => {
		history.pushState({}, '', '/team-maker?name=비밀이름#이름');
		window.dispatchEvent(new PopStateEvent('popstate'));
	});
	await expect(page).toHaveURL(/name=/);
	expect(await views(page)).toHaveLength(1);
	expect(JSON.stringify(await views(page))).not.toContain('비밀');
});

test('거부한 방문자는 재접속해도 전송하지 않고 개인정보처리방침에서 선택을 바꾼다', async ({
	page,
	context
}) => {
	const { notice, scripts } = await openAnalyticsSite(page);
	await notice.getByRole('button', { name: '통계 거부', exact: true }).click();
	await page.reload();
	await page.locator('footer .privacy-trigger').click();
	const dialog = page.getByRole('dialog', { name: '개인정보처리방침', exact: true });
	expect(await dialog.ariaSnapshot()).toContain('방문 통계 거부');
	expect(scripts).toHaveLength(0);
	await dialog.getByRole('button', { name: '통계 허용', exact: true }).click();
	await expect.poll(async () => (await views(page)).length).toBe(1);
	await context.addCookies([
		{ name: '_ga', value: 'test-cookie', url: origin },
		{ name: '_ga_TEST000001', value: 'test-cookie', url: origin }
	]);
	await dialog.getByRole('button', { name: '통계 거부', exact: true }).click();
	expect((await context.cookies(origin)).filter((cookie) => cookie.name.startsWith('_ga'))).toEqual(
		[]
	);
	await dialog.getByRole('button', { name: '개인정보처리방침 닫기', exact: true }).click();
	await page.locator('a[href="/qr-code"]').first().click();
	await expect(page).toHaveURL(`${origin}/qr-code`);
	expect(await views(page)).toHaveLength(1);
	expect(await page.evaluate(() => window['ga-disable-G-TEST000001'])).toBe(true);
});

test('Google 스크립트가 차단돼도 팀을 만들 수 있다', async ({ page }) => {
	const errors = [];
	page.on('pageerror', (error) => errors.push(error.message));
	const { notice } = await openAnalyticsSite(page, { blocked: true, path: '/team-maker' });
	await notice.getByRole('button', { name: '통계 허용', exact: true }).click();
	await page.locator('#person-name').fill('가람,나래,다온,라온');
	await page.locator('#add-person-form button[type="submit"]').click();
	await expect(page.locator('#participant-list > li')).toHaveCount(4);
	expect(await views(page)).toEqual([]);
	expect(errors).toEqual([]);
});

test('QR·구슬 레이스 직접 접속도 허용 후 각각1회 집계한다', async ({ page }) => {
	const { notice } = await openAnalyticsSite(page, { path: '/qr-code' });
	await notice.getByRole('button', { name: '통계 허용', exact: true }).click();
	await expect.poll(async () => (await views(page)).length).toBe(1);
	expect((await views(page))[0].page_location).toBe(`${origin}/qr-code`);
	await page.goto(`${origin}/marble-race`);
	await expect.poll(async () => (await views(page)).length).toBe(1);
	expect((await views(page))[0].page_location).toBe(`${origin}/marble-race`);
});

for (const width of [390, 1440]) {
	test(`${width}px 화면에서 동의 안내와 긴 개인정보 안내가 잘리지 않는다`, async ({ page }) => {
		await page.setViewportSize({ width, height: 900 });
		const { notice } = await openAnalyticsSite(page);
		for (const label of ['통계 거부', '통계 허용'])
			await expect(notice.getByRole('button', { name: label, exact: true })).toBeInViewport();
		const menu = page.getByRole('button', { name: '메뉴 열기', exact: true });
		if (await menu.isVisible()) {
			const menuBox = await menu.boundingBox();
			const noticeBox = await notice.boundingBox();
			expect(noticeBox.y).toBeGreaterThanOrEqual(menuBox.y + menuBox.height);
		}
		expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(
			true
		);
		await notice.getByRole('button', { name: '통계 거부', exact: true }).click();
		await page.locator('footer .privacy-trigger').click();
		const dialog = page.getByRole('dialog', { name: '개인정보처리방침', exact: true });
		expect(await dialog.ariaSnapshot()).toContain('방문 통계와 선택 변경');
		expect(await dialog.evaluate((element) => element.scrollWidth <= element.clientWidth)).toBe(
			true
		);
		await expect(dialog.getByRole('button', { name: '통계 허용', exact: true })).toBeEnabled();
	});
}

test('동의 안내도 공통 어두운 테마를 따른다', async ({ page }) => {
	await page.addInitScript(() => localStorage.setItem('juno.develog.theme', 'dark'));
	const { notice } = await openAnalyticsSite(page);
	expect(await notice.ariaSnapshot()).toContain('통계 허용');
	expect(
		await notice.evaluate((element) => {
			const color = getComputedStyle(element).backgroundColor.match(/\d+/g).slice(0, 3).map(Number);
			return Math.max(...color);
		})
	).toBeLessThan(100);
});
