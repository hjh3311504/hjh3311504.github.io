import { test, expect } from '@playwright/test';
import { isSkillVisible } from '../../src/lib/marble-race/skill-visibility.js';
import { observeRace } from './helpers/observe-race.js';

test('스킬은 준비 중에만 바꾸고 경기·일시정지 중에는 시작 설정을 유지한다', async ({ page }) => {
	await observeRace(page, 47);
	await page.goto('/marble-race');
	expect(await page.locator('main').ariaSnapshot()).toContain('스킬 사용');
	const toggle = page.getByRole('button', { name: '스킬 사용', exact: true });
	await expect(toggle).toHaveText('스킬 사용 ON');
	await expect(toggle).toHaveAttribute('aria-pressed', 'true');
	await toggle.click();
	await expect(toggle).toHaveText('스킬 사용 OFF');
	await expect
		.poll(() =>
			page.evaluate(() => JSON.parse(localStorage.getItem('lake.marble-race.v1'))?.skillsEnabled)
		)
		.toBe(false);
	await page.reload();
	await expect(toggle).toHaveText('스킬 사용 OFF');
	await toggle.focus();
	await page.keyboard.press('Space');
	await expect(toggle).toHaveText('스킬 사용 ON');
	await expect(toggle).toHaveAttribute('aria-pressed', 'true');
	await expect
		.poll(() =>
			page.evaluate(() => JSON.parse(localStorage.getItem('lake.marble-race.v1'))?.skillsEnabled)
		)
		.toBe(true);
	await page.reload();
	await expect(toggle).toHaveText('스킬 사용 ON');
	await page.getByLabel('참가자 이름').fill('토끼*30');
	await page.getByRole('button', { name: '♫ 소리 켜짐', exact: true }).click();
	await page.getByRole('button', { name: '레이스 시작 ▶', exact: true }).first().click();
	await expect(page.locator('.stage-state')).toHaveText('경기 중');
	await expect
		.poll(() => page.evaluate(() => window.__raceState?.skillWaves?.length ?? 0), {
			timeout: 18000
		})
		.toBeGreaterThan(0);
	await expect(page.getByRole('button', { name: '경기 배속 전환' })).toHaveText('1배속');
	await expect(toggle).toBeDisabled();
	await expect(toggle).toHaveText('스킬 사용 ON');
	await page.getByRole('button', { name: '일시정지 Ⅱ', exact: true }).click();
	await expect(toggle).toBeDisabled();
	await page.setViewportSize({ width: 360, height: 844 });
	await toggle.scrollIntoViewIfNeeded();
	await expect(toggle).toBeInViewport();
	expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
	await page.locator('#resume-race').click();
	await expect(page.locator('.stage-state')).toHaveText('경기 중');
	await expect(toggle).toBeDisabled();
	await page.getByRole('button', { name: '일시정지 Ⅱ', exact: true }).click();
	await page.getByRole('button', { name: '종료하고 설정 변경', exact: true }).click();
	await expect(toggle).toBeEnabled();
	await toggle.click();
	await expect(toggle).toHaveText('스킬 사용 OFF');
	await page.getByRole('button', { name: '레이스 시작 ▶', exact: true }).first().click();
	await expect(page.locator('.stage-state')).toHaveText('경기 중');
	await expect(toggle).toBeDisabled();
	await expect.poll(() => page.evaluate(() => window.__raceState?.time ?? 0)).toBeGreaterThan(3);
	expect(await page.evaluate(() => window.__raceState.skillWaves)).toEqual([]);
	await page.reload();
	await expect(toggle).toHaveText('스킬 사용 OFF');
});

test('도감의3종 스킬과 실제 발동에서 같은 효과음을 재생한다', async ({ page }) => {
	await observeRace(page, 47);
	await page.goto('/marble-race');
	expect(await page.locator('main').ariaSnapshot()).toContain('도감');
	await expect(
		page.getByRole('button', { name: '레이스 시작 ▶', exact: true }).first()
	).toBeEnabled();
	await expect(page.getByRole('heading', { name: '도감', exact: true })).toBeVisible();
	await expect(page.getByRole('heading', { name: '블록 도감', exact: true })).toHaveCount(0);
	const skill = page.getByRole('region', { name: /^스킬/ });
	await expect(skill.locator('.skill-card')).toHaveCount(3);
	for (const image of await skill.locator('img').all())
		await expect(image).toHaveAttribute('src', /^data:image/);
	await page.locator('canvas[role="button"]').evaluate((canvas) => {
		window.__skillSounds = [];
		canvas.setAttribute('data-audio-diagnostics', '');
		canvas.addEventListener('marble-audio', ({ detail }) => {
			if (detail.kind === 'played' && ['pulse', 'lightning', 'gust'].includes(detail.type))
				window.__skillSounds.push(detail);
		});
	});
	const preview = skill.getByRole('button', { name: '원형 파동 소리 미리듣기' });
	for (const [index, name] of ['원형 파동', '번개', '바람'].entries()) {
		const button = skill.getByRole('button', { name: `${name} 소리 미리듣기` });
		await button.click();
		await expect.poll(() => page.evaluate(() => window.__skillSounds.length)).toBe(index + 1);
	}
	const previewFiles = await page.evaluate(() =>
		Object.fromEntries(window.__skillSounds.map((e) => [e.type, e.file]))
	);
	expect(previewFiles).toEqual({
		pulse: '/audio/marble-race/pulse-whoosh-deep-v2.wav',
		lightning: '/audio/marble-race/lightning-v1.wav',
		gust: '/audio/marble-race/gust-v1.wav'
	});
	await page.getByLabel('참가자 이름').fill('토끼*30');
	await expect(page.getByRole('button', { name: '스킬 사용', exact: true })).toHaveAttribute(
		'aria-pressed',
		'true'
	);
	await page.getByRole('button', { name: '레이스 시작 ▶', exact: true }).first().click();
	await expect(preview).toBeDisabled();
	await expect
		.poll(() => page.evaluate(() => window.__skillSounds.some((e) => e.event?.kind === 'skill')), {
			timeout: 18000
		})
		.toBe(true);
	const played = await page.evaluate(() =>
		window.__skillSounds.filter((e) => e.event?.kind === 'skill')
	);
	for (const event of played) expect(event.file).toBe(previewFiles[event.type]);
	await page.getByRole('button', { name: '일시정지 Ⅱ', exact: true }).click();
	for (const width of [1440, 390]) {
		await page.setViewportSize({ width, height: 1000 });
		await skill.scrollIntoViewIfNeeded();
		expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(
			true
		);
		const widths = await page
			.locator('.library-grid')
			.evaluateAll((grids) => grids.map((g) => g.firstElementChild.getBoundingClientRect().width));
		expect(Math.abs(widths[0] - widths[2])).toBeLessThan(1);
	}
});

for (const width of [1440, 390]) {
	test(`${width}px 화면에 보이는 스킬음은 모두 재생하고 화면 밖 발동은 생략한다`, async ({
		page
	}) => {
		await page.setViewportSize({ width, height: 1000 });
		await observeRace(page, 47);
		await page.goto('/marble-race');
		expect(await page.locator('main').ariaSnapshot()).toContain('스킬 사용');
		await page.locator('canvas[role="button"]').evaluate((canvas) => {
			window.__skillAudioLog = [];
			canvas.setAttribute('data-audio-diagnostics', '');
			canvas.addEventListener('marble-audio', ({ detail }) => {
				if (detail.event?.kind === 'skill') window.__skillAudioLog.push(detail);
			});
		});
		await page.getByLabel('참가자 이름').fill('구슬*60');
		await page.getByRole('button', { name: '레이스 시작 ▶', exact: true }).first().click();
		await expect(page.locator('.stage-state')).toHaveText('경기 중');
		await expect
			.poll(() => page.evaluate(() => window.__raceState?.time ?? 0), { timeout: 12000 })
			.toBeGreaterThan(7);
		await page.getByRole('button', { name: '일시정지 Ⅱ', exact: true }).click();
		const log = await page.evaluate(() => window.__skillAudioLog);
		const fired = log.filter((e) => e.kind === 'collision');
		const played = log.filter((e) => e.kind === 'played');
		expect(played.length).toBeGreaterThan(1);
		for (const { event, view } of fired) {
			const output = log.filter(
				(e) => e.kind !== 'collision' && e.event.deviceId === event.deviceId
			);
			expect(output).toHaveLength(1);
			if (isSkillVisible(event, view)) expect(output[0].kind).toBe('played');
			else expect(output[0].reason).toBe('outside-view');
		}
		// 길이가1.75초 이상인 스킬음도 서로 끝나기를 기다리지 않는다.
		expect(played.some((e, i) => i > 0 && e.audioTime - played[i - 1].audioTime < 1.75)).toBe(true);
		expect(await page.locator('.race-stage').ariaSnapshot()).toContain('일시정지');
	});
}
