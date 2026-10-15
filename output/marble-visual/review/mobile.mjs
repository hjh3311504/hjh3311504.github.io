import { chromium } from '@playwright/test';
const browser = await chromium.launch();
for (const [name, url] of [['current', process.argv[2]]]) {
	const page = await browser.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2 });
	await page.goto(url);
	await page.waitForTimeout(1500);
	await page.screenshot({ path: `output/marble-visual/review/${name}-top.png` });
	const info = await page.evaluate(() => {
		const r = (el) => el && (({ x, y, width, height }) => ({ x, y, width, height }))(el.getBoundingClientRect());
		const menu = [...document.querySelectorAll('button')].find((b) => /메뉴|menu/i.test(b.getAttribute('aria-label') || b.textContent));
		return {
			menu: r(menu), menuLabel: menu?.getAttribute('aria-label'),
			stage: r(document.querySelector('.race-stage')),
			title: r(document.querySelector('.stage-title')),
			toolbar: r(document.querySelector('.stage-toolbar')),
			h1: r(document.querySelector('h1')), h1text: document.querySelector('h1')?.textContent
		};
	});
	console.log(JSON.stringify(info, null, 1));
	await page.locator('.race-stage').scrollIntoViewIfNeeded();
	await page.waitForTimeout(500);
	await page.screenshot({ path: `output/marble-visual/review/${name}-stage.png` });
}
await browser.close();
