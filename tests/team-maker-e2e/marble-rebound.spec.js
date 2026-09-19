import { test, expect } from '@playwright/test';
import { createFinaleDuel } from '../marble-race/helpers/finale-duel.js';
import { stepRace } from '../../src/lib/marble-race/physics.js';
import { createDirector } from '../../src/lib/marble-race/director.js';
import { screenRace } from './helpers/marble-screen-state.js';

test('입구에서 되튕긴 선두와 먼저 통과한 추격 구슬을 실제 계산 위치로 표시한다', async ({
	page
}) => {
	const race = createFinaleDuel();
	const director = createDirector();
	let frame;
	while (race.time < 20 && race.finished.length === 0) {
		stepRace(race);
		const cinematic = director.update(race);
		const [leader, chaser] = race.marbles;
		if (
			leader.vy < 0 &&
			leader.y < race.layout.finale.mouthY - 20 &&
			chaser.y > race.layout.finale.mouthY + 20
		) {
			frame = {
				time: race.time,
				cinematic,
				phase: race.blocks.find((b) => b.id === 'finale-bar').phase,
				marbles: race.marbles.map(({ x, y, vx, vy }) => ({ x, y, vx, vy }))
			};
			break;
		}
	}
	expect(frame).toBeDefined();
	await page.setViewportSize({ width: 390, height: 1000 });
	await page.emulateMedia({ reducedMotion: 'no-preference' });
	await screenRace(page);
	await page.addInitScript((sample) => {
		window.__raceDisplayFrame = sample;
	}, frame);
	await page.goto('/marble-race');
	expect(await page.locator('main').ariaSnapshot()).toContain('구슬 굴리기');
	await page.getByLabel('참가자 이름').fill('선두\n추격');
	await page.getByRole('button', { name: '♫ 소리 켜짐', exact: true }).click();
	await page.getByRole('button', { name: '구슬 굴리기 ▶', exact: true }).first().click();
	await expect(page.getByRole('button', { name: '경기 배속 전환' })).toHaveText('0.25배속');
	const plate = page.locator('.race-minimap rect[fill="#00e5ed"]');
	await expect(plate).toHaveCount(1);
	await expect(plate).toHaveAttribute('width', '290');
	await expect(plate).toHaveAttribute('x', '75');
	await expect(plate).toHaveAttribute('y', String(race.layout.finale.start + 402));
	// 카메라의 부드러운 확대가 끝난 뒤 실제 계산 프레임을 확인한다.
	const view = page.locator('.race-minimap svg > rect').last();
	await expect.poll(async () => Number(await view.getAttribute('width'))).toBeLessThan(305);
	await page.locator('.race-stage').screenshot({ path: '.context/marble-finale-rebound.png' });
});
