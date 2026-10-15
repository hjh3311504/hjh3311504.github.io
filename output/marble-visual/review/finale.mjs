import { chromium } from '@playwright/test';
const browser = await chromium.launch();
for (const theme of ['light', 'dark']) {
	const page = await browser.newPage({ viewport: { width: 1280, height: 900 }, deviceScaleFactor: 1 });
	await page.addInitScript((t) => localStorage.setItem('juno.develog.theme', t), theme);
	await page.goto('http://localhost:5299/marble-race');
	await page.waitForTimeout(1200);
	await page.getByRole('button', { name: /^미니맵/ }).click();
	await page.locator('.race-stage').scrollIntoViewIfNeeded();
	const map = page.locator('.race-minimap button, .race-minimap [role="img"]').first();
	const box = await map.boundingBox();
	await page.mouse.move(box.x + box.width / 2, box.y + box.height - 6);
	await page.waitForTimeout(800);
	await page.locator('.race-stage').screenshot({ path: `output/marble-visual/review/finale-${theme}.png` });
	await page.close();
}
await browser.close();
