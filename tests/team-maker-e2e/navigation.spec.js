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

test('떠 있는 메뉴 버튼은 아래로 스크롤하면 숨고 위로 올리거나 초점을 받으면 다시 보인다', async ({
	page
}) => {
	await page.setViewportSize({ width: 390, height: 844 });
	await page.goto('/marble-race');
	const menu = page.locator('.floating-menu');
	const button = menu.getByRole('button', { name: '메뉴 열기' });
	const top = async () => (await menu.boundingBox()).y;
	await expect(button).toBeVisible();
	expect(await top()).toBeGreaterThanOrEqual(0);

	await page.mouse.wheel(0, 600);
	await expect.poll(top).toBeLessThan(-40);

	await page.mouse.wheel(0, -200);
	await expect.poll(top).toBeGreaterThanOrEqual(0);

	await page.mouse.wheel(0, 600);
	await expect.poll(top).toBeLessThan(-40);
	await button.focus();
	await expect.poll(top).toBeGreaterThanOrEqual(0);
	await button.click();
	await expect(page.locator('#site-drawer')).toBeVisible();
	await page.keyboard.press('Escape');
	await expect(button).toBeFocused();
	await expect.poll(top).toBeGreaterThanOrEqual(0);
});

test('맨 아래에서 바운스로 되돌아와도 숨긴 메뉴 버튼을 다시 보여 주지 않는다', async ({ page }) => {
	await page.setViewportSize({ width: 390, height: 844 });
	await page.goto('/marble-race');
	const menu = page.locator('.floating-menu');
	const top = async () => (await menu.boundingBox()).y;
	await page.evaluate(() => scrollTo(0, document.documentElement.scrollHeight));
	await expect.poll(top).toBeLessThan(-40);
	// iOS의 하단 바운스처럼 최대 위치를 넘었다가 돌아오는 값을 차례로 보낸다.
	await page.evaluate(async () => {
		const max = document.documentElement.scrollHeight - innerHeight;
		for (const y of [max + 50, max + 70, max + 20, max]) {
			Object.defineProperty(window, 'scrollY', { configurable: true, get: () => y });
			dispatchEvent(new Event('scroll'));
			await new Promise((resolve) => requestAnimationFrame(resolve));
		}
		delete window.scrollY;
	});
	await page.waitForTimeout(300);
	expect(await top()).toBeLessThan(-40);
});
