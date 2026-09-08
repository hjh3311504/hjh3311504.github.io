import { expect, test } from '@playwright/test';

test('페이지를 떠나면 예약 삭제를 취소하고 재진입해도 입력을 한 번만 처리한다', async ({
	page
}) => {
	const errors = [];
	page.on('pageerror', (error) => errors.push(error.message));
	await page.goto('/team-maker');
	await page.locator('#person-name').fill('가람,나래,다온,라온');
	await page.locator('#add-person-form button[type="submit"]').click();
	await expect(page.locator('#participant-list > li')).toHaveCount(4);
	// 클라이언트 안에서 route를 이동했는지 확인할 표시입니다.
	await page.evaluate(() => {
		window.__teamMakerNavigation = true;
	});
	const home = page.locator('a[href="/"]').first();
	await home.hover();
	await page.clock.install();
	await page.clock.pauseAt(new Date());
	await page.evaluate(() => {
		document.querySelector('[data-participant-remove]').click();
		document.querySelector('a[href="/"]').click();
	});
	await page.clock.runFor(100);
	await expect(page).toHaveURL(/\/$/);
	await expect(page.locator('.team-maker-page')).toHaveCount(0);
	await page.clock.runFor(1000);
	const saved = await page.evaluate(() => JSON.parse(localStorage.getItem('team-maker:v1')));
	expect(saved.participants.map((participant) => participant.name)).toEqual([
		'가람',
		'나래',
		'다온',
		'라온'
	]);
	expect(await page.evaluate(() => window.__teamMakerNavigation)).toBe(true);

	for (let index = 0; index < 2; index++) {
		await page.locator('a[href="/team-maker"]').first().click();
		await page.clock.runFor(100);
		await expect(page.locator('#participant-list > li')).toHaveCount(4 + index);
		await page.locator('#person-name').fill(`추가${index}`);
		await page.locator('#add-person-form button[type="submit"]').click();
		await expect(page.locator('#participant-list > li')).toHaveCount(5 + index);
		await page.locator('a[href="/"]').first().click();
		await page.clock.runFor(100);
		await expect(page.locator('.team-maker-page')).toHaveCount(0);
	}
	expect(errors).toEqual([]);
});
