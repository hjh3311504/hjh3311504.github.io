import { test, expect } from '@playwright/test';
const start = (page) => page.getByRole('button', { name: '레이스 시작 ▶', exact: true }).first();
async function observe(page) {
	await page.addInitScript(() => {
		window.__previews = [];
		const Native = window.Worker;
		window.Worker = class extends Native {
			constructor(...args) {
				super(...args);
				this.addEventListener('message', ({ data }) => {
					if (data.kind !== 'ready') return;
					const positions = data.state.marbles.map(({ id, x, y, color }) => ({ id, x, y, color }));
					if (data.state.preview)
						window.__previews.push({ positions, names: data.state.marbles.map((m) => m.name) });
					else window.__actualStart = positions;
				});
			}
		};
	});
}

test('준비 화면에1000개 전부 생성하고 같은 번호·색·위치로 출발한다', async ({ page }) => {
	await observe(page);
	await page.goto('/marble-race');
	expect(await page.locator('main').ariaSnapshot()).toContain('레이스 시작');
	await expect(start(page)).toBeEnabled();
	await page.getByLabel('참가자 이름').fill('구슬*1000');
	await expect
		.poll(() => page.evaluate(() => window.__previews.at(-1)?.positions.length))
		.toBe(1000);
	await expect(page.getByText('준비 화면은 구슬 일부만 표시합니다.')).toHaveCount(0);
	const before = await page.evaluate(() => window.__previews.at(-1).positions);
	await page.getByRole('button', { name: '♫ 소리 켜짐', exact: true }).click();
	await start(page).click();
	await expect(page.locator('.stage-state')).toHaveText('경기 중');
	expect(await page.evaluate(() => window.__actualStart)).toEqual(before);
});

test('큰 미리보기 도중 명단을 바꾸면 최신 전체 구슬만 표시하고 바로 시작할 수 있다', async ({
	page
}) => {
	await observe(page);
	await page.goto('/marble-race');
	expect(await page.locator('main').ariaSnapshot()).toContain('레이스 시작');
	await expect(start(page)).toBeEnabled();
	const names = page.getByLabel('참가자 이름');
	await names.fill('이전*1000000');
	await page.waitForTimeout(300);
	await names.fill('새 구슬*1000');
	await expect.poll(() => page.evaluate(() => window.__previews.at(-1)?.names[0])).toBe('새 구슬');
	await expect
		.poll(() => page.evaluate(() => window.__previews.at(-1)?.positions.length))
		.toBe(1000);
	await page.getByRole('button', { name: '자리섞기', exact: true }).click();
	await page.getByRole('button', { name: '♫ 소리 켜짐', exact: true }).click();
	await start(page).click();
	await expect(page.locator('.stage-state')).toHaveText('경기 중');
	await expect(page.locator('.race-stats')).toContainText('/ 1000 도착');
	await page.waitForTimeout(500);
	await expect(page.locator('.stage-state')).toHaveText('경기 중');
});
