import { test, expect } from '@playwright/test';
import { createFinaleDuel } from '../marble-race/helpers/finale-duel.js';
import { stepRace } from '../../src/lib/marble-race/physics.js';
import { fireLightning } from '../../src/lib/marble-race/skills.js';
import { createDirector } from '../../src/lib/marble-race/director.js';
import { screenRace } from './helpers/marble-screen-state.js';

for (const width of [1440, 390]) {
	for (const lightning of [false, true]) {
		test(`${width}px 화면에서 결승 바와 ${lightning ? '번개 정지 중 밀린' : '되튕긴'} 구슬을 실제 계산 위치로 표시한다`, async ({
			page
		}) => {
			const race = createFinaleDuel({ currentGuide: true, side: 1, phase: 0 });
			const director = createDirector();
			let frame;
			while (race.time < 20 && race.finished.length === 0) {
				stepRace(race);
				let cinematic = director.update(race);
				const [leader, chaser] = race.marbles;
				// 왼쪽 위로 옮긴 회전바가 선두를 밀어 올리는 실제 장면을 사용한다.
				if (leader.vy < -100 && leader.y > chaser.y) {
					if (lightning) {
						fireLightning(race.skills, chaser, race.marbles, race.time);
						const frozenY = leader.y;
						for (let i = 0; i < 24; i++) {
							stepRace(race);
							cinematic = director.update(race);
						}
						expect(leader.held?.kind).toBe('lightning');
						expect(leader.y).toBeLessThan(frozenY - 1);
					}
					frame = {
						time: race.time,
						cinematic,
						phase: race.blocks.find((b) => b.id === 'finale-bar').phase,
						marbles: race.marbles.map(({ x, y, vx, vy, held }) => ({ x, y, vx, vy, held }))
					};
					break;
				}
			}
			expect(frame).toBeDefined();
			await page.setViewportSize({ width, height: 1000 });
			await page.emulateMedia({ reducedMotion: 'no-preference' });
			await screenRace(page);
			await page.addInitScript((sample) => {
				window.__raceDisplayFrame = sample;
			}, frame);
			await page.goto('/marble-race');
			expect(await page.locator('main').ariaSnapshot()).toContain('레이스 시작');
			await expect(
				page.getByRole('button', { name: '레이스 시작 ▶', exact: true }).first()
			).toBeEnabled();
			await page.getByLabel('참가자 이름').fill('선두\n추격');
			await page.getByRole('button', { name: '♫ 소리 켜짐', exact: true }).click();
			await page.getByRole('button', { name: '레이스 시작 ▶', exact: true }).first().click();
			await expect(page.getByRole('button', { name: '경기 배속 전환' })).toHaveText('0.25배속');
			const plate = page.locator('.race-minimap rect[fill="#00e5ed"]');
			await expect(plate).toHaveCount(1);
			await expect(plate).toHaveAttribute('width', '448');
			await expect(plate).toHaveAttribute('x', String(race.layout.finale.rotor.x - 224));
			await expect(plate).toHaveAttribute('y', String(race.layout.finale.rotor.y - 8));
			// 카메라의 부드러운 확대가 끝난 뒤 실제 계산 프레임을 확인한다.
			const view = page.locator('.race-minimap svg > rect').last();
			const bounds = await page.locator('canvas[role="button"]').boundingBox();
			const settledWidth = bounds.width / (Math.min(bounds.width / 720, bounds.height / 680) * 2.4);
			await expect
				.poll(async () => Number(await view.getAttribute('width')))
				.toBeLessThan(settledWidth + 5);
			// 기본 배율에서도 바 전체와 결승 통로가 함께 보이는지 확인한다.
			await page.emulateMedia({ reducedMotion: 'reduce' });
			await expect.poll(async () => Number(await view.getAttribute('width'))).toBeGreaterThan(700);
			expect(await page.locator('.race-stage').ariaSnapshot()).toContain('경기 중');
			await page.locator('.race-stage').screenshot({
				path: `.context/marble-finale-rebound-${lightning ? 'lightning-' : ''}${width}.png`
			});
		});
	}
}
