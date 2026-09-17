import { test, expect } from '@playwright/test';

test('복원한 핀52개와 참가자별 버터 안내를 준비 화면에 표시한다', async ({ page }) => {
	await page.goto('/marble-race');
	expect(await page.locator('main').ariaSnapshot()).toContain('특수 구간 안내');
	const guide = page.locator('[aria-labelledby="special-library-title"]');
	for (const [count, hits] of [
		[2, 1],
		[30, 5],
		[60, 7],
		[1000, 29]
	]) {
		await page.getByLabel('참가자 이름').fill(`토끼*${count}`);
		await expect(guide).toContainText(`이번 경기: ${hits}회 충돌하면 부서져요.`);
	}
	await expect(guide).toContainText('우회로');
	await expect(page.locator('.race-minimap rect[width="32"][rx="16"]')).toHaveCount(52);
});

test('0.3배속에서 후보를 크게 확대하고 미니맵과 같은 위치를 추적한다', async ({ page }) => {
	test.setTimeout(180000);
	await page.emulateMedia({ reducedMotion: 'no-preference' });
	await page.addInitScript(() => {
		const NativeWorker = window.Worker;
		window.Worker = class extends NativeWorker {
			constructor(...args) {
				super(...args);
				this.addEventListener('message', ({ data }) => {
					if (data.kind === 'frame') window.__latestPinsFrame = data.state;
				});
			}
		};
		crypto.getRandomValues = (array) => {
			array.fill(47);
			return array;
		};
	});
	await page.goto('/marble-race');
	expect(await page.locator('main').ariaSnapshot()).toContain('구슬 굴리기');
	await page.getByLabel('참가자 이름').fill('구슬*30');
	await page.getByRole('button', { name: '도각도각 키보드', exact: true }).click();
	// 이 검사는 음향 출력 준비와 독립적으로 배속·카메라 동작을 확인한다.
	await page.getByRole('button', { name: '♫ 소리 켜짐', exact: true }).click();
	await page.getByRole('button', { name: '구슬 굴리기 ▶', exact: true }).first().click();
	const speed = page.getByRole('button', { name: '경기 배속 전환', exact: true });
	await expect(speed).toBeEnabled();
	await speed.click();
	await expect(speed).toHaveText('0.3배속', { timeout: 120000 });
	await expect(
		page.getByText('당첨 확정까지0.3배속으로 진행합니다.', { exact: true })
	).toBeVisible();
	await page.waitForTimeout(1800);
	await page
		.locator('.race-stage')
		.screenshot({ path: 'output/playwright/pins-closeup-desktop.png' });
	await page.getByRole('button', { name: '잠시 멈춤 Ⅱ', exact: true }).click();
	const observed = await page.evaluate(() => {
		const canvas = document.querySelector('canvas'),
			t = canvas.getContext('2d').getTransform();
		const bounds = canvas.getBoundingClientRect(),
			base = Math.min(bounds.width / 720, bounds.height / 680);
		const state = window.__latestPinsFrame,
			m = state.marbles.find((m) => m.id === state.cinematic.focusId);
		const box = document.querySelector('.race-minimap svg > rect:last-child');
		return {
			zoom: t.a / (devicePixelRatio * base),
			focusX: t.a * m.x + t.e,
			focusY: t.d * m.y + t.f,
			width: canvas.width,
			height: canvas.height,
			left: Math.max(0, -t.e / t.a),
			miniLeft: Number(box.getAttribute('x')),
			time: state.time
		};
	});
	expect(observed.zoom).toBeGreaterThan(2);
	expect(observed.zoom).toBeLessThanOrEqual(2.41);
	expect(observed.focusX).toBeGreaterThan(0);
	expect(observed.focusX).toBeLessThan(observed.width);
	expect(observed.focusY).toBeGreaterThan(0);
	expect(observed.focusY).toBeLessThan(observed.height);
	expect(observed.miniLeft).toBeCloseTo(observed.left, 2);
	await expect(speed).toHaveText('0.3배속');
	await page.setViewportSize({ width: 390, height: 844 });
	await page.locator('canvas').scrollIntoViewIfNeeded();
	expect(await page.locator('.race-stage').ariaSnapshot()).toContain('0.3배속');
	await page.getByRole('button', { name: '계속하기 ▶', exact: true }).first().click();
	await expect(speed).toHaveText('0.3배속');
	await page.waitForTimeout(700);
	await page
		.locator('.race-stage')
		.screenshot({ path: 'output/playwright/pins-closeup-mobile.png' });
});
