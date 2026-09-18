import { test, expect } from '@playwright/test';

test('유도 바 아래 핀52개와 연못3개·크랙 왁스 안내를 표시한다', async ({ page }) => {
	await page.goto('/marble-race');
	expect(await page.locator('main').ariaSnapshot()).toContain('블록 도감');
	const guide = page.locator('[aria-labelledby="block-library-title"]');
	await expect(guide.getByRole('heading', { name: '크랙 왁스', exact: true })).toBeVisible();
	await expect(guide.getByRole('button', { name: '크랙 왁스 소리 미리듣기' })).toBeVisible();
	for (const [count, hits] of [
		[2, 1],
		[30, 5],
		[60, 7],
		[1000, 29]
	]) {
		await page.getByLabel('참가자 이름').fill(`토끼*${count}`);
		await expect(guide).toContainText(`${hits}번 닿으면 바삭 깨져요.`);
	}
	await expect(guide).toContainText('풍덩 가라앉거나 우회해요.');
	await expect(page.locator('.race-minimap rect[width="32"][rx="16"]')).toHaveCount(52);
	for (const viewport of [
		{ width: 1440, height: 1000 },
		{ width: 390, height: 844 }
	]) {
		await page.setViewportSize(viewport);
		await expect(guide).toContainText('젤리 연못');
		const ponds = page.locator('.race-minimap rect[width="152"][height="140"]');
		await expect(ponds).toHaveCount(3);
		const geometry = await page.locator('.race-minimap').evaluate((root) => {
			const read = (selector) =>
				[...root.querySelectorAll(selector)].map((r) => ({
					x: Number(r.getAttribute('x')),
					y: Number(r.getAttribute('y')),
					h: Number(r.getAttribute('height'))
				}));
			return {
				pins: read('rect[width="32"][rx="16"]'),
				guideBottoms: [...root.querySelectorAll('rect[height="14"][rx="7"]')].map((r) => {
					const w = Number(r.getAttribute('width')),
						h = Number(r.getAttribute('height'));
					const y = Number(r.getAttribute('y')) + h / 2;
					const matrix = r.transform.baseVal.consolidate().matrix;
					return y + (Math.abs(matrix.b) * w) / 2 + (Math.abs(matrix.d) * h) / 2;
				}),
				butter: read('rect[width="120"][height="64"]'),
				ponds: read('rect[width="152"][height="140"]')
			};
		});
		expect(geometry.ponds.map((p) => p.x)).toEqual([12, 284, 556]);
		expect(geometry.guideBottoms).toHaveLength(6);
		for (let section = 0; section < 3; section++) {
			const firstPin = Math.min(
				...geometry.pins.slice(section * 13, (section + 1) * 13).map((p) => p.y)
			);
			expect(firstPin).toBeGreaterThan(
				Math.max(...geometry.guideBottoms.slice(section * 2, section * 2 + 2)) + 125
			);
		}
		expect(new Set(geometry.ponds.map((p) => p.y)).size).toBe(1);
		expect(Math.max(...geometry.pins.slice(13, 26).map((p) => p.y + p.h))).toBeLessThan(
			Math.min(...geometry.butter.map((b) => b.y))
		);
		expect(Math.max(...geometry.pins.slice(26, 39).map((p) => p.y + p.h))).toBeLessThan(
			geometry.ponds[0].y
		);
	}
});

test('0.25배속에서 후보를 크게 확대하고 미니맵과 같은 위치를 추적한다', async ({ page }) => {
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
	await expect(speed).toHaveText('0.25배속', { timeout: 120000 });
	await expect(page.getByText(/당첨 확정까지.*배속으로 진행합니다/)).toHaveCount(0);
	await page.waitForTimeout(1800);
	await page
		.locator('.race-stage')
		.screenshot({ path: 'output/playwright/pins-closeup-desktop.png' });
	await page.getByRole('button', { name: '일시정지 Ⅱ', exact: true }).click();
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
	await expect(speed).toHaveText('0.25배속');
	await page.setViewportSize({ width: 390, height: 844 });
	await page.locator('canvas').scrollIntoViewIfNeeded();
	expect(await page.locator('.race-stage').ariaSnapshot()).toContain('0.25배속');
	await page.getByRole('button', { name: '계속하기 ▶', exact: true }).first().click();
	await expect(speed).toHaveText('0.25배속');
	await page.waitForTimeout(700);
	await page
		.locator('.race-stage')
		.screenshot({ path: 'output/playwright/pins-closeup-mobile.png' });
});
