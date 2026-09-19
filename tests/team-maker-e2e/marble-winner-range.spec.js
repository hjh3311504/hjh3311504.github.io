import { test, expect } from '@playwright/test';
import { screenRace } from './helpers/marble-screen-state.js';
const start = (page) => page.getByRole('button', { name: '구슬 굴리기 ▶', exact: true }).first();

test('여러명 범위 입력을 검사하고 저장·새로고침·모바일에서 유지한다', async ({ page }) => {
	await page.goto('/marble-race');
	expect(await page.locator('main').ariaSnapshot()).toContain('여러명');
	await page.getByLabel('참가자 이름').fill('구슬*8');
	await page.getByRole('button', { name: '여러명', exact: true }).click();
	const from = page.getByRole('spinbutton', { name: '시작 순위' });
	const to = page.getByRole('spinbutton', { name: '끝 순위' });
	const fillRange = async (value) => {
		const [left, right] = value.split('~');
		await from.fill(left);
		await to.fill(right);
	};
	await expect(from).toHaveValue('1');
	await expect(to).toHaveValue('3');
	for (const input of ['6~4', '0~3', '4~9', '4~', '1.5~4']) {
		await fillRange(input);
		await expect(from).toHaveAttribute('aria-invalid', 'true');
		await expect(to).toHaveAttribute('aria-invalid', 'true');
		await expect(start(page)).toBeDisabled();
	}
	await fillRange('4~6');
	await expect(
		page.getByText('4~6번째로 도착한 구슬 3개가 당첨됩니다.', { exact: true })
	).toBeVisible();
	await expect(start(page)).toBeEnabled();
	await expect
		.poll(() =>
			page.evaluate(() => JSON.parse(localStorage.getItem('lake.marble-race.v1'))?.rangeText)
		)
		.toBe('4~6');
	await page.reload();
	await expect(from).toHaveValue('4');
	await expect(to).toHaveValue('6');
	await page.setViewportSize({ width: 390, height: 844 });
	await expect(from).toBeVisible();
	await expect(to).toBeVisible();
	await from.focus();
	await page.keyboard.press('Tab');
	await expect(to).toBeFocused();
	expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
	await fillRange('8~8');
	await expect(
		page.getByText('8~8번째로 도착한 구슬 1개가 당첨됩니다.', { exact: true })
	).toBeVisible();
	await page.getByLabel('참가자 이름').fill('구슬*7');
	await expect(start(page)).toBeDisabled();
	await page.getByRole('button', { name: '첫번째', exact: true }).click();
	await expect(start(page)).toBeEnabled();
});

for (const selectedSpeed of [1, 2]) {
	test(`${selectedSpeed}배속 경기에서4~6번째만 당첨되고 연출 후 선택 배속을 복구한다`, async ({
		page
	}) => {
		await screenRace(page);
		await page.goto('/marble-race');
		expect(await page.locator('main').ariaSnapshot()).toContain('도감');
		await page.getByLabel('참가자 이름').fill('하나\n둘\n셋\n넷\n다섯\n여섯\n일곱\n여덟');
		await page.getByRole('button', { name: '여러명', exact: true }).click();
		await page.getByLabel('시작 순위').fill('4');
		await page.getByLabel('끝 순위').fill('6');
		await page.getByRole('button', { name: '♫ 소리 켜짐', exact: true }).click();
		await start(page).click();
		await expect
			.poll(() => page.evaluate(() => window.__raceDrawSettings))
			.toEqual({ mode: 'multiple', count: 3, startRank: 4 });
		await expect(page.getByLabel('시작 순위')).toBeDisabled();
		await expect(page.getByLabel('끝 순위')).toBeDisabled();
		const speed = page.getByRole('button', { name: '경기 배속 전환' });
		if (selectedSpeed === 2) await speed.click();
		await expect(speed).toHaveText(`${selectedSpeed}배속`);
		await page.evaluate(() => {
			window.__racePhase = 'finale';
			window.__raceFinishedCount = 3;
		});
		await expect(speed).toHaveText('0.25배속');
		await expect(speed).toBeDisabled();
		await page.getByRole('button', { name: '일시정지 Ⅱ', exact: true }).click();
		await page
			.getByRole('region', { name: '일시정지', exact: true })
			.getByRole('button', { name: '계속하기 ▶', exact: true })
			.click();
		await expect(speed).toHaveText('0.25배속');
		await expect(page.locator('.race-stats')).toContainText('3 / 8');
		await expect(page.locator('.winner-panel')).toHaveCount(0);
		await expect(page.locator('.winner-celebration')).toHaveCount(0);
		await page.evaluate(() => {
			window.__raceFinishedCount = 4;
		});
		await expect(page.getByRole('complementary', { name: '확정 당첨자' })).toContainText('넷');
		await expect(page.locator('.winner-celebration')).toContainText('넷');
		await expect(speed).toHaveText('0.25배속');
		await page.evaluate(() => {
			window.__raceFinishedCount = 6;
		});
		await expect(speed).toHaveText(`${selectedSpeed}배속`);
		await expect.poll(() => page.evaluate(() => window.__raceRequestedSpeed)).toBe(selectedSpeed);
		const panel = page.getByRole('complementary', { name: '확정 당첨자' });
		await expect(panel).toContainText('당첨 3명');
		for (const name of ['넷', '다섯', '여섯']) await expect(panel).toContainText(name);
		for (const name of ['하나', '둘', '셋', '일곱', '여덟'])
			await expect(panel).not.toContainText(name);
		await page.evaluate(() => {
			window.__racePhase = 'finished';
			Object.defineProperty(navigator, 'clipboard', {
				configurable: true,
				value: {
					writeText: async (text) => {
						window.__copied = text;
					}
				}
			});
		});
		await expect(page.locator('.stage-state')).toHaveText('경기 종료');
		await page.getByRole('button', { name: '결과 복사', exact: true }).first().click();
		await expect
			.poll(() => page.evaluate(() => window.__copied?.split('\n\n')[0]))
			.toBe('4~6번째 도착 당첨자\n4번 넷\n5번 다섯\n6번 여섯');
		await expect
			.poll(() => page.evaluate(() => window.__copied?.includes('8등: 여덟 (8번)')))
			.toBe(true);
		await page.evaluate(() => {
			window.__racePhase = 'running';
			window.__raceFinishedCount = 0;
		});
		await page.getByRole('button', { name: '한 번 더 굴리기 ↻', exact: true }).click();
		await expect(speed).toHaveText('1배속');
		await expect.poll(() => page.evaluate(() => window.__raceRequestedSpeed)).toBe(1);
		await expect
			.poll(() => page.evaluate(() => window.__raceDrawSettings))
			.toEqual({ mode: 'multiple', count: 3, startRank: 4 });
	});
}
