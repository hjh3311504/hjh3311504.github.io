import { chromium } from '@playwright/test';
const [base, dir] = process.argv.slice(2);
const browser = await chromium.launch();
async function open(theme, viewport) {
	const page = await browser.newPage({ viewport, colorScheme: theme });
	await page.addInitScript((t) => localStorage.setItem('juno.develog.theme', t), theme);
	await page.goto(`${base}/marble-race`);
	await page.locator('.race-stage').scrollIntoViewIfNeeded();
	return page;
}
const start = (page) => page.locator('.race-stage button', { hasText: '레이스 시작' }).first().click();
// 1. 모바일 + 미니맵, 어두운/밝은 테마
for (const theme of ['light', 'dark']) {
	const page = await open(theme, { width: 390, height: 844 });
	await page.getByRole('button', { name: '미니맵', exact: true }).click();
	await start(page);
	await page.waitForTimeout(6000);
	await page.locator('.race-stage').screenshot({ path: `${dir}/mobile-${theme}.png` });
	await page.close();
}
// 2. 300개 경기(Worker 그림 경로) + 경기 중 테마 전환
{
	const page = await open('light', { width: 1280, height: 900 });
	await page.getByLabel('참가자 이름').fill('토끼*150\n고양이*150');
	await page.waitForTimeout(1500);
	await start(page);
	await page.waitForTimeout(7000);
	await page.locator('.race-stage').screenshot({ path: `${dir}/many-light.png` });
	await page.evaluate(() => (document.documentElement.dataset.theme = 'dark'));
	await page.waitForTimeout(800);
	await page.locator('.race-stage').screenshot({ path: `${dir}/many-switched-dark.png` });
	await page.close();
}
// 3. 도감
{
	const page = await open('light', { width: 1280, height: 900 });
	await page.getByText('도감', { exact: true }).first().click();
	await page.waitForTimeout(800);
	await page.locator('.library-panel').screenshot({ path: `${dir}/library.png` });
	await page.close();
}
await browser.close();
