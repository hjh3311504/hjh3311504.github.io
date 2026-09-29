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
async function openAnalyticsSite(page, { blocked = false, path = '/', consent } = {}) {
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
	if (consent)
		await page.addInitScript(
			({ key, value }) => {
				if (localStorage.getItem(key) === null) localStorage.setItem(key, value);
			},
			{ key: consentKey, value: consent }
		);
	await page.goto(`${origin}${path}`);
	await expect(page.locator('main')).toBeVisible();
	const notice = page.getByRole('region', { name: '방문 통계 안내' });
	if (consent !== 'denied') {
		await expect(notice).toBeVisible();
		expect(await notice.ariaSnapshot()).toContain('쿠키 없이');
	} else await expect(notice).toHaveCount(0);
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

test('선택 전부터 내부 이동·뒤로·앞으로·새로고침을 쿠키 없이 집계한다', async ({ page }) => {
	const { notice, scripts, unexpected } = await openAnalyticsSite(page, {
		path: '/?name=비밀#입력'
	});
	await expect.poll(async () => (await views(page)).length).toBe(1);
	expect(scripts).toHaveLength(1);
	expect(await notice.ariaSnapshot()).toContain('쿠키 없이');
	const defaults = await page.evaluate(() => Array.from(window.dataLayer[0]));
	expect(defaults).toEqual([
		'consent',
		'default',
		{
			analytics_storage: 'denied',
			ad_storage: 'denied',
			ad_user_data: 'denied',
			ad_personalization: 'denied'
		}
	]);
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
	await openAnalyticsSite(page, { path: '/team-maker' });
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

test('기존 거부 방문자는 재접속해도 전송하지 않고 선택 버튼도 표시하지 않는다', async ({
	page
}) => {
	const { scripts } = await openAnalyticsSite(page, { consent: 'denied' });
	await page.reload();
	await page.locator('footer .privacy-trigger').click();
	const dialog = page.getByRole('dialog', { name: '개인정보처리방침', exact: true });
	expect(await dialog.ariaSnapshot()).toContain('기존 거부 설정에 따라 수집하지 않음');
	await expect(dialog.getByRole('button', { name: /^통계 (허용|거부)$/ })).toHaveCount(0);
	expect(scripts).toHaveLength(0);
	expect(await views(page)).toHaveLength(0);
	await dialog.getByRole('button', { name: '개인정보처리방침 닫기', exact: true }).click();
	await page.locator('a[href="/qr-code"]').first().click();
	await expect(page).toHaveURL(`${origin}/qr-code`);
	expect(await views(page)).toHaveLength(0);
	expect(await page.evaluate((key) => localStorage.getItem(key), consentKey)).toBe('denied');
});

test('Google 스크립트가 차단돼도 팀을 만들 수 있다', async ({ page }) => {
	const errors = [];
	page.on('pageerror', (error) => errors.push(error.message));
	await openAnalyticsSite(page, { blocked: true, path: '/team-maker' });
	await page.locator('#person-name').fill('가람,나래,다온,라온');
	await page.locator('#add-person-form button[type="submit"]').click();
	await expect(page.locator('#participant-list > li')).toHaveCount(4);
	expect(await views(page)).toEqual([]);
	expect(errors).toEqual([]);
});

test('QR·구슬 레이스 직접 접속도 쿠키 없이 각각1회 집계한다', async ({ page }) => {
	await openAnalyticsSite(page, { path: '/qr-code' });
	await expect.poll(async () => (await views(page)).length).toBe(1);
	expect((await views(page))[0].page_location).toBe(`${origin}/qr-code`);
	await page.goto(`${origin}/marble-race`);
	await expect.poll(async () => (await views(page)).length).toBe(1);
	expect((await views(page))[0].page_location).toBe(`${origin}/marble-race`);
});

for (const width of [390, 1440]) {
	test(`${width}px 화면에서 통계 안내와 긴 개인정보 안내가 잘리지 않는다`, async ({ page }) => {
		await page.setViewportSize({ width, height: 900 });
		const { notice } = await openAnalyticsSite(page);
		await expect(notice.getByRole('button')).toHaveCount(0);
		await expect(notice.getByRole('link', { name: 'Google 데이터 이용 안내' })).toBeInViewport();
		const menu = page.getByRole('button', { name: '메뉴 열기', exact: true });
		if (await menu.isVisible()) {
			const menuBox = await menu.boundingBox();
			const noticeBox = await notice.boundingBox();
			expect(noticeBox.y).toBeGreaterThanOrEqual(menuBox.y + menuBox.height);
		}
		expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(
			true
		);
		await page.locator('footer .privacy-trigger').click();
		const dialog = page.getByRole('dialog', { name: '개인정보처리방침', exact: true });
		expect(await dialog.ariaSnapshot()).toContain('방문 통계');
		expect(await dialog.evaluate((element) => element.scrollWidth <= element.clientWidth)).toBe(
			true
		);
		await expect(dialog.getByRole('button', { name: /^통계 (허용|거부)$/ })).toHaveCount(0);
	});
}

test('통계 안내도 공통 어두운 테마를 따른다', async ({ page }) => {
	await page.addInitScript(() => localStorage.setItem('juno.develog.theme', 'dark'));
	const { notice } = await openAnalyticsSite(page);
	expect(await notice.ariaSnapshot()).toContain('쿠키 없이');
	expect(
		await notice.evaluate((element) => {
			const color = getComputedStyle(element).backgroundColor.match(/\d+/g).slice(0, 3).map(Number);
			return Math.max(...color);
		})
	).toBeLessThan(100);
});

test('기존 허용 방문도 쿠키 없이 측정하고 이전 분석 쿠키를 삭제한다', async ({ page, context }) => {
	await context.addCookies([
		{ name: '_ga', value: 'legacy', url: origin },
		{ name: '_ga_TEST000001', value: 'legacy', url: origin }
	]);
	const { notice } = await openAnalyticsSite(page, { consent: 'allowed' });
	await expect.poll(async () => (await views(page)).length).toBe(1);
	const commands = await page.evaluate(() => window.dataLayer.map((a) => Array.from(a)));
	expect(commands[0][2].analytics_storage).toBe('denied');
	expect(JSON.stringify(commands)).not.toContain('granted');
	expect((await context.cookies(origin)).filter((c) => c.name.startsWith('_ga'))).toEqual([]);
	await expect(notice.getByRole('button')).toHaveCount(0);
	await page.locator('footer .privacy-trigger').click();
	const dialog = page.getByRole('dialog', { name: '개인정보처리방침', exact: true });
	expect(await dialog.ariaSnapshot()).toContain('쿠키 없이 측정 중');
	await expect(dialog.getByRole('button', { name: /^통계 (허용|거부)$/ })).toHaveCount(0);
});
