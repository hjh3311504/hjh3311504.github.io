import { test, expect } from '@playwright/test';
import { screenRace } from './helpers/marble-screen-state.js';

for (const width of [1440, 390]) {
	test(`${width}px 종료 뒤 참가자·방식·순번·범위를 바꾸면 새 출발 화면으로 돌아간다`, async ({
		page
	}) => {
		await page.setViewportSize({ width, height: 1000 });
		await screenRace(page);
		await page.goto('/marble-race');
		expect(await page.locator('main').ariaSnapshot()).toContain('레이스 시작');
		await page.getByLabel('참가자 이름').fill('첫째\n둘째\n셋째');
		await page.getByRole('button', { name: '♫ 소리 켜짐', exact: true }).click();
		const start = page.getByRole('button', { name: '레이스 시작 ▶', exact: true }).first();
		const finish = async () => {
			await page.evaluate(() => {
				window.__racePhase = 'running';
			});
			await start.click();
			await expect(page.locator('.stage-state')).toHaveText('경기 중');
			await page.evaluate(() => {
				window.__racePhase = 'finished';
			});
			await expect(page.locator('.stage-state')).toHaveText('경기 종료');
			await expect(
				page.getByRole('button', { name: '한 번 더 굴리기 ↻', exact: true })
			).toBeVisible();
			// 경기 종료만으로 결과를 지우거나 음량 변경을 새 경기로 취급하지 않는다.
			await page.getByRole('slider', { name: '소리 크기', exact: true }).fill('30');
			await expect(page.locator('.stage-state')).toHaveText('경기 종료');
		};
		const ready = async () => {
			await expect(page.locator('.stage-state')).toHaveText('출발 준비');
			await expect(start).toBeVisible();
			await expect(
				page.getByRole('button', { name: '한 번 더 굴리기 ↻', exact: true })
			).toHaveCount(0);
			await expect(page.locator('.winner-panel')).toHaveCount(0);
			await expect(page.locator('.winner-celebration')).toHaveCount(0);
			await expect(page.locator('.race-minimap svg > rect').last()).toHaveAttribute('y', '0');
			await expect(page.getByRole('button', { name: '경기 배속 전환' })).toHaveText('1배속');
			await expect(page.getByRole('slider', { name: '소리 크기', exact: true })).toHaveValue('30');
		};
		await finish();
		await page.getByLabel('참가자 이름').fill('수정된 첫째\n둘째\n셋째');
		await ready();
		await expect(page.getByLabel('참가자 이름')).toHaveValue('수정된 첫째\n둘째\n셋째');
		for (const mode of ['마지막', 'n번째', '여러명']) {
			await finish();
			await page.getByRole('button', { name: mode, exact: true }).click();
			await ready();
			await expect(page.getByRole('button', { name: mode, exact: true })).toHaveAttribute(
				'aria-pressed',
				'true'
			);
		}
		for (const label of ['시작 순위', '끝 순위']) {
			await finish();
			await page.getByLabel(label, { exact: true }).fill('2');
			await ready();
		}
		await page.getByRole('button', { name: 'n번째', exact: true }).click();
		await finish();
		await page.getByLabel('당첨 순번', { exact: true }).fill('2');
		await ready();
		await finish();
		await page.getByLabel('참가자 이름').fill('');
		await expect(page.locator('.stage-state')).toHaveText('출발 준비');
		await expect(start).toBeDisabled();
		await expect(page.locator('.winner-panel')).toHaveCount(0);
		await page.getByLabel('참가자 이름').fill('새 공*2');
		await ready();
		expect(await page.locator('main').ariaSnapshot()).toContain('새 공');
	});
}
