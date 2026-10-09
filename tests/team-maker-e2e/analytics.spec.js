import { expect, test } from '@playwright/test';
import { readFileSync, readdirSync } from 'node:fs';

const origin = 'https://analytics.example';
const token = '00000000000000000000000000000000';
const consentKey = 'juno.develog.analytics-consent:v1';
const beaconSelector = 'script[data-cf-beacon]';
const fixtureConfigured = readdirSync('build/_app/immutable', { recursive: true })
	.filter((file) => file.endsWith('.js'))
	.some((file) => {
		const source = readFileSync(`build/_app/immutable/${file}`, 'utf8');
		return source.includes(token) && source.includes(origin);
	});

// 외부 요청을 모두 가로챈다. 이 검사는 태그 연결 검증이며 Cloudflare 집계 검증이 아니다.
async function openAnalyticsSite(page, { blocked = false, path = '/', consent, beaconPath } = {}) {
	if (process.env.CI) expect(fixtureConfigured, 'PR build의 가짜 Cloudflare 설정').toBe(true);
	test.skip(
		!fixtureConfigured,
		'README의 가짜 Cloudflare 설정으로 build해야 활성화 경로를 검사합니다.'
	);
	const scripts = [];
	const unexpected = [];
	const beacons = [];
	await page.route('**/*', async (route) => {
		const url = new URL(route.request().url());
		if (url.origin === origin) {
			const response = await route.fetch({
				url: `http://127.0.0.1:4174${url.pathname}${url.search}`
			});
			await route.fulfill({ response });
		} else if (url.href === 'https://static.cloudflareinsights.com/beacon.min.js') {
			scripts.push(url.href);
			if (blocked) await route.abort('blockedbyclient');
			else
				await route.fulfill({
					contentType: 'application/javascript',
					headers: { 'access-control-allow-origin': '*' },
					...(beaconPath ? { path: beaconPath } : { body: '/* 외부 전송 없는 시험용 태그 */' })
				});
		} else if (beaconPath && url.href === 'https://cloudflareinsights.com/cdn-cgi/rum') {
			const body = route.request().postData();
			if (body) beacons.push(JSON.parse(body));
			await route.fulfill({
				status: 204,
				headers: {
					'access-control-allow-origin': origin,
					'access-control-allow-credentials': 'true',
					'access-control-allow-headers': 'content-type'
				}
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
	return {
		scripts,
		beacons,
		unexpected
	};
}

test('오류 페이지와 공개 페이지는 뒤로·앞으로 가기에도 문서를 공유하지 않는다', async ({
	page
}) => {
	// 지정하면 공식 태그도 실행하되 수집 요청은 위에서 차단한다.
	const beaconPath = process.env.CF_ANALYTICS_BEACON_PATH;
	const { beacons, unexpected } = await openAnalyticsSite(page, { path: '/404.html', beaconPath });
	await expect(page.getByRole('link', { name: '홈으로 이동' })).toBeVisible();
	await page.evaluate(() => (window.__errorDocumentMarker = true));
	await page.getByRole('link', { name: '홈으로 이동' }).click();
	await expect(page).toHaveURL(`${origin}/`);
	await expect(page.locator(beaconSelector)).toHaveCount(1);
	expect(await page.evaluate(() => window.__errorDocumentMarker)).toBeUndefined();
	if (beaconPath)
		await expect
			.poll(() => beacons.filter((event) => event.eventType === 1).length)
			.toBeGreaterThan(0);
	for (let round = 0; round < 2; round++) {
		await page.goBack();
		await expect(page).toHaveURL(`${origin}/404.html`);
		await expect(page.getByRole('link', { name: '홈으로 이동' })).toBeVisible();
		await expect(page.locator(beaconSelector)).toHaveCount(0);
		await page.goForward();
		await expect(page).toHaveURL(`${origin}/`);
		await expect(page.locator(beaconSelector)).toHaveCount(1);
	}
	if (beaconPath) {
		await page.goto('about:blank');
		const pageViews = beacons.filter((event) => event.eventType === 1);
		expect(pageViews.length).toBeGreaterThan(0);
		expect(pageViews.every((event) => event.location === `${origin}/`)).toBe(true);
	}
	expect(unexpected).toEqual([]);
});

test('로컬 preview에서는 외부 통계 태그를 요청하지 않는다', async ({ page }) => {
	const external = [];
	await page.route(
		/https:\/\/(?:[^/]+\.)?(?:google-analytics|googletagmanager|cloudflareinsights)\.com\//,
		(route) => {
			external.push(route.request().url());
			return route.abort();
		}
	);
	await page.goto('/');
	await page.locator('a[href="/team-maker"]').first().click();
	await expect(page.locator('#person-name')).toBeVisible();
	await expect(page.locator(beaconSelector)).toHaveCount(0);
	expect(external).toEqual([]);
});

test('동의 버튼 없이 공식 SPA 태그를 한 번만 연결하고 블로그까지 이동한다', async ({ page }) => {
	const { scripts, unexpected } = await openAnalyticsSite(page, { path: '/?name=비밀#입력' });
	await expect(page.locator(beaconSelector)).toHaveAttribute(
		'data-cf-beacon',
		JSON.stringify({ token, spa: true })
	);
	await expect(page.locator(beaconSelector)).toHaveAttribute('type', 'module');
	for (const path of ['/team-maker', '/blog']) {
		await page.locator(`a[href="${path}"]`).first().click();
		await expect(page).toHaveURL(origin + path);
	}
	const post = page.locator('main a[href^="/blog/"]').first();
	const postPath = await post.getAttribute('href');
	await post.click();
	await expect(page).toHaveURL(origin + postPath);
	await page.goBack();
	await expect(page).toHaveURL(`${origin}/blog`);
	await expect(page.locator(beaconSelector)).toHaveCount(1);
	expect(scripts).toHaveLength(1);
	expect(unexpected).toEqual([]);
	expect(await page.evaluate(() => window.dataLayer)).toBeUndefined();
	expect(await page.context().cookies(origin)).toEqual([]);
});

for (const path of ['/qr-code', '/marble-race', '/blog', '/blog/team-maker-introduction']) {
	test(`${path} 직접 진입과 새로고침마다 태그를 연결한다`, async ({ page }) => {
		const { scripts } = await openAnalyticsSite(page, { path });
		await expect.poll(() => scripts.length).toBe(1);
		await page.reload();
		await expect.poll(() => scripts.length).toBe(2);
		await expect(page.locator(beaconSelector)).toHaveCount(1);
	});
}

test('기존 거부 방문은 도구와 블로그에서 전송하지 않는다', async ({ page }) => {
	const { scripts } = await openAnalyticsSite(page, { consent: 'denied' });
	await page.locator('a[href="/blog"]').first().click();
	await page.locator('footer .privacy-trigger').click();
	const dialog = page.getByRole('dialog', { name: '개인정보처리방침', exact: true });
	await expect(dialog).toContainText('기존 거부 설정에 따라 수집하지 않음');
	await expect(dialog.getByRole('button', { name: /^통계 (허용|거부)$/ })).toHaveCount(0);
	expect(scripts).toHaveLength(0);
	await expect(page.locator(beaconSelector)).toHaveCount(0);
});

test('공개 페이지에서 없는 글로 이동하면 태그가 없는 오류 문서를 연다', async ({ page }) => {
	const { scripts } = await openAnalyticsSite(page);
	await expect.poll(() => scripts.length).toBe(1);
	await page.evaluate(() => {
		const link = document.createElement('a');
		link.href = '/blog/nonexistent-private-name';
		link.textContent = '없는 글';
		document.querySelector('main').append(link);
	});
	await page.getByRole('link', { name: '없는 글', exact: true }).click();
	await expect(page).toHaveURL(`${origin}/blog/nonexistent-private-name`);
	await expect(page.locator(beaconSelector)).toHaveCount(0);
	expect(scripts).toHaveLength(1);
});

test('태그가 차단돼도 참가자 입력과 오류 안내가 작동한다', async ({ page }) => {
	const errors = [];
	page.on('pageerror', (error) => errors.push(error.message));
	await openAnalyticsSite(page, { blocked: true, path: '/team-maker' });
	await page.locator('#person-name').fill('가람,나래,다온,라온');
	await page.locator('#add-person-form button[type="submit"]').click();
	await expect(page.locator('#participant-list > li')).toHaveCount(4);
	await page.locator('footer .privacy-trigger').click();
	await expect(page.getByRole('dialog')).toContainText('통계 스크립트를 불러오지 못함');
	expect(errors).toEqual([]);
});

for (const width of [390, 1200, 1201, 1440]) {
	test(`${width}px 상단 통계 안내 없이 개인정보 모달을 확인한다`, async ({ page }) => {
		await page.setViewportSize({ width, height: 900 });
		await openAnalyticsSite(page);
		await expect(
			page.getByRole('region', { name: '방문 통계 안내', includeHidden: true })
		).toHaveCount(0);
		expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(
			true
		);
		await page.locator('footer .privacy-trigger').click();
		const dialog = page.getByRole('dialog', { name: '개인정보처리방침', exact: true });
		await expect(dialog).toContainText('Cloudflare Web Analytics');
		await expect(dialog).toContainText('쿠키 없는 통계 태그 실행 중');
		expect(await dialog.evaluate((element) => element.scrollWidth <= element.clientWidth)).toBe(
			true
		);
		await expect(dialog.getByRole('button', { name: /^통계 (허용|거부)$/ })).toHaveCount(0);
	});
}

test('기존 허용 기록은 보존하고 GA 쿠키만 삭제한다', async ({ page, context }) => {
	await context.addCookies([
		{ name: '_ga', value: 'legacy', url: origin },
		{ name: '_ga_OLD123', value: 'legacy', url: origin }
	]);
	await openAnalyticsSite(page, { consent: 'allowed' });
	await expect(page.locator(beaconSelector)).toHaveCount(1);
	expect((await context.cookies(origin)).filter((cookie) => cookie.name.startsWith('_ga'))).toEqual(
		[]
	);
	expect(await page.evaluate((key) => localStorage.getItem(key), consentKey)).toBe('allowed');
});
