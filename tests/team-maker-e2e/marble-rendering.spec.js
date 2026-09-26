import { observeMarbleText } from './helpers/marble-paint.js';
import { test, expect } from '@playwright/test';
import { screenRace } from './helpers/marble-screen-state.js';
import { createRace } from '../../src/lib/marble-race/physics.js';

const start = (page) => page.getByRole('button', { name: '레이스 시작 ▶', exact: true }).first();

test('1000개 구슬 그림을 복사하는 동안 같은 그림 페이지를 다시 수정하지 않는다', async ({
	page
}) => {
	await page.addInitScript(() => {
		window.__sourceChanges = 0;
		window.__sourceReuses = 0;
		let seen = new Map();
		const text = CanvasRenderingContext2D.prototype.fillText;
		const fill = CanvasRenderingContext2D.prototype.fillRect;
		const draw = CanvasRenderingContext2D.prototype.drawImage;
		CanvasRenderingContext2D.prototype.fillText = function (...args) {
			this.canvas.__drawingRevision = (this.canvas.__drawingRevision ?? 0) + 1;
			return text.apply(this, args);
		};
		CanvasRenderingContext2D.prototype.fillRect = function (...args) {
			if (
				this.canvas.getAttribute('role') === 'button' &&
				args[0] === 0 &&
				args[1] === 0 &&
				this.fillStyle === '#101d2c'
			)
				seen = new Map();
			return fill.apply(this, args);
		};
		CanvasRenderingContext2D.prototype.drawImage = function (bitmap, ...args) {
			if (this.canvas.getAttribute('role') === 'button') {
				const revision = bitmap.__drawingRevision ?? 0;
				if (seen.has(bitmap)) {
					window.__sourceReuses++;
					if (seen.get(bitmap) !== revision) window.__sourceChanges++;
				}
				seen.set(bitmap, revision);
			}
			return draw.call(this, bitmap, ...args);
		};
	});
	await page.goto('/marble-race');
	expect(await page.locator('main').ariaSnapshot()).toContain('레이스 시작');
	await expect(start(page)).toBeEnabled();
	await page.getByLabel('참가자 이름').fill('공*1000');
	await page.getByRole('button', { name: '♫ 소리 켜짐', exact: true }).click();
	await start(page).click();
	await expect(page.locator('.stage-state')).toHaveText('경기 중');
	await expect.poll(() => page.evaluate(() => window.__sourceReuses)).toBeGreaterThan(100);
	expect(await page.evaluate(() => window.__sourceChanges)).toBe(0);
});

test('순위 열과 카드 높이가 바뀌어도 크기 알림이 반복되지 않는다', async ({ page }) => {
	const errors = [];
	page.on('pageerror', (error) => errors.push(error.message));
	await page.goto('/marble-race');
	expect(await page.locator('main').ariaSnapshot()).toContain('도착 순위');
	await expect(start(page)).toBeEnabled();
	const grid = page.getByRole('region', { name: '구슬 도착 순위', exact: true });
	for (const [width, count] of [
		[1440, 2],
		[390, 1000],
		[768, 2],
		[320, 1000]
	]) {
		await page.setViewportSize({ width, height: 1000 });
		await page.getByLabel('참가자 이름').fill(`공*${count}`);
		await expect(grid.locator('li').first()).toHaveAttribute('aria-setsize', String(count));
		await page.evaluate(
			() => new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)))
		);
	}
	expect(errors).toEqual([]);
});

for (const width of [320, 390, 768, 1440]) {
	test(`${width}px 준비 순위는 전체1000명과 번호 구슬·진행률을 표시한다`, async ({ page }) => {
		await page.setViewportSize({ width, height: 1000 });
		await page.goto('/marble-race');
		expect(await page.locator('main').ariaSnapshot()).toContain('도착 순위');
		await expect(start(page)).toBeEnabled();
		await page.getByLabel('참가자 이름').fill('아주긴이름의참가자구슬입니다*1000');
		const grid = page.getByRole('region', { name: '구슬 도착 순위', exact: true });
		await expect(grid.locator('li').first()).toHaveAttribute('aria-setsize', '1000');
		const geometry = await grid.evaluate((el) => {
			const items = [...el.querySelectorAll('li')];
			return {
				width: el.clientWidth,
				columns: items.filter((item) => item.style.top === '0px').length,
				overflow: items.some((item) => item.scrollWidth > item.clientWidth)
			};
		});
		expect(geometry.columns).toBe(
			2 * Math.max(1, Math.min(3, Math.floor((geometry.width + 12) / 212)))
		);
		expect(geometry.overflow).toBe(false);
		await grid.evaluate((el) => {
			el.scrollTop = el.scrollHeight;
		});
		await expect(grid.locator('li').last()).toHaveAttribute('aria-posinset', '1000');
		await page.getByLabel('구슬 찾기').fill('1000');
		await expect(grid.locator('li')).toHaveCount(1);
		await expect(grid.locator('.marble-icon')).toHaveCount(1);
		await expect(grid.locator('small')).toHaveCount(0);
		await expect(grid.locator('.rank-card-name')).toHaveText('아주긴이름의참가...');
		await expect(grid.getByRole('button')).toHaveAttribute('title', '아주긴이름의참가자구슬입니다');
		const layout = await grid.getByRole('button').evaluate((el) => {
			const head = el.querySelector('.rank-card-head').getBoundingClientRect();
			const status = el.querySelector('.rank-card-status').getBoundingClientRect();
			const body = el.querySelector('.rank-card-body').getBoundingClientRect();
			const progress = el.querySelector('.rank-card-progress').getBoundingClientRect();
			const badge = el.querySelector('canvas').getBoundingClientRect();
			const name = el.querySelector('.rank-card-name').getBoundingClientRect();
			return {
				statusInset: head.right - status.right,
				headHeight: head.height,
				bodyStart: body.top - head.bottom,
				bodyEnd: progress.top - body.bottom,
				centerDifference: (badge.top + name.bottom - body.top - body.bottom) / 2,
				horizontalDifference: (badge.left + badge.right - body.left - body.right) / 2,
				nameHeight: name.height,
				cardHeight: el.getBoundingClientRect().height
			};
		});
		expect(layout.statusInset).toBeCloseTo(12, 0);
		expect(layout.headHeight).toBe(36);
		expect(Math.abs(layout.centerDifference)).toBeLessThanOrEqual(1);
		expect(Math.abs(layout.horizontalDifference)).toBeLessThanOrEqual(1);
		expect(layout.nameHeight).toBeLessThanOrEqual(40);
		expect(layout.cardHeight).toBe(192);
		expect(layout.bodyStart).toBe(0);
		expect(layout.bodyEnd).toBe(0);
		await grid.getByRole('button').click();
		await expect(grid.getByRole('button')).toHaveAttribute('aria-pressed', 'true');
		await page.getByLabel('구슬 찾기').fill('');
		await expect(grid.getByRole('button').first()).toHaveAttribute('aria-pressed', 'true');
		await expect(grid.getByRole('button').first()).toHaveAccessibleName(/^1000등 .*1000번/);
		await grid.scrollIntoViewIfNeeded();
		await grid.screenshot({ path: `.context/marble-dense-ranking-${width}.png` });
		expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(
			true
		);
	});
}

test('추적 카드는 첫 칸을 유지하고 검색·교체·해제 시 실제 순위를 보존한다', async ({ page }) => {
	await screenRace(page, { ranking: true });
	await page.goto('/marble-race');
	expect(await page.locator('main').ariaSnapshot()).toContain('도착 순위');
	await expect(start(page)).toBeEnabled();
	await page.getByLabel('참가자 이름').fill('같은이름*1000');
	await page.getByRole('button', { name: '♫ 소리 켜짐', exact: true }).click();
	await start(page).click();
	await expect(page.locator('.stage-state')).toHaveText('경기 중');
	const grid = page.getByRole('region', { name: '구슬 도착 순위', exact: true });
	const cards = grid.getByRole('button');
	const search = page.getByLabel('구슬 찾기');
	await expect(grid.locator('li').first()).toHaveAttribute('aria-setsize', '1000');
	await grid.evaluate((element) => {
		element.scrollTop = element.scrollHeight;
	});
	await expect(grid.locator('li').last()).toHaveAttribute('aria-posinset', '1000');
	const lastMarble = grid.getByRole('button', { name: /^1000등 .*1000번/ });
	await lastMarble.focus();
	await lastMarble.press('Enter');
	await expect(cards.first()).toHaveAccessibleName(/^1000등 .*1000번/);
	await expect(cards.first()).toHaveAttribute('aria-pressed', 'true');
	await expect(cards.first()).toBeFocused();
	await expect.poll(() => grid.evaluate((element) => element.scrollTop)).toBe(0);
	await expect(cards.nth(1)).toHaveAccessibleName(/^1등 .*1번/);
	await cards.first().press('Enter');
	await expect(grid.locator('[aria-pressed="true"]')).toHaveCount(0);
	await expect(cards.first()).toHaveAccessibleName(/^1등 .*1번/);
	await expect(grid).toBeFocused();
	await grid.evaluate((element) => {
		element.scrollTop = element.scrollHeight;
	});
	await expect(grid.locator('li').last()).toHaveAttribute('aria-posinset', '1000');
	await lastMarble.press('Space');
	await expect(cards.first()).toHaveAccessibleName(/^1000등 .*1000번/);
	await expect(cards.first()).toHaveAttribute('aria-pressed', 'true');
	await search.fill('500');
	await expect(cards).toHaveCount(2);
	await expect(cards.first()).toHaveAccessibleName(/^1000등 .*1000번/);
	await cards.nth(1).click();
	await expect(cards).toHaveCount(1);
	await expect(cards.first()).toHaveAccessibleName(/^500등 .*500번/);
	await search.fill('');
	await expect(cards.first()).toHaveAttribute('aria-pressed', 'true');
	await expect(cards.nth(1)).toHaveAccessibleName(/^1등 .*1번/);
	await page.evaluate(() => {
		window.__raceRankingSwap = true;
	});
	await expect(cards.first()).toHaveAccessibleName(/^501등 .*500번/);
	await expect(cards.first()).toHaveAttribute('aria-pressed', 'true');
	await page.evaluate(() => {
		window.__raceRankingSwap = false;
		window.__racePhase = 'finished';
		Object.defineProperty(navigator, 'clipboard', {
			value: {
				writeText: async (text) => {
					window.__copied = text;
				}
			},
			configurable: true
		});
	});
	await expect(page.locator('.stage-state')).toHaveText('경기 종료');
	await expect(cards.first()).toHaveAccessibleName(/^500등 .*500번, 도착/);
	await page.getByRole('button', { name: '결과 복사', exact: true }).first().click();
	await expect
		.poll(() => page.evaluate(() => window.__copied?.split('전체 도착 순위\n')[1]?.split('\n')[0]))
		.toBe('1등: 같은이름 (1번)');
	await expect
		.poll(() => page.evaluate(() => window.__copied?.includes('1000등: 같은이름 (1000번)')))
		.toBe(true);
	await page.getByRole('button', { name: '자동으로 따라가기', exact: true }).click();
	await expect(cards.first()).toHaveAccessibleName(/^1등 .*1번/);
	await expect(grid.locator('[aria-pressed="true"]')).toHaveCount(0);
});

test('티켓 이름은8자 뒤에 점3개를 붙이고 전체 이름과 결합 이모지를 보존한다', async ({ page }) => {
	await screenRace(page);
	await page.goto('/marble-race');
	expect(await page.locator('main').ariaSnapshot()).toContain('도착 순위');
	await expect(start(page)).toBeEnabled();
	const names = ['가나다라마바사아', '가나다라마바사아자', '👩‍💻가나다라마바사아'];
	await page.getByLabel('참가자 이름').fill(names.join('\n'));
	const grid = page.getByRole('region', { name: '구슬 도착 순위', exact: true });
	await expect(grid.locator('li')).toHaveCount(3);
	for (const [index, text] of [
		'가나다라마바사아',
		'가나다라마바사아...',
		'👩‍💻가나다라마바사...'
	].entries()) {
		const card = grid.getByRole('button').nth(index);
		await expect(card.locator('.rank-card-name')).toHaveText(text);
		await expect(card).toHaveAttribute('title', names[index]);
		await expect(card).toHaveAccessibleName(new RegExp(names[index]));
	}
	await page.getByLabel('구슬 찾기').fill('아자');
	await expect(grid.getByRole('button')).toHaveCount(1);
	await expect(grid.getByRole('button')).toHaveAttribute('title', names[1]);
	await page.getByLabel('구슬 찾기').fill('');
	await page.getByRole('button', { name: '♫ 소리 켜짐', exact: true }).click();
	await page.evaluate(() => {
		window.__racePhase = 'finished';
		Object.defineProperty(navigator, 'clipboard', {
			value: {
				writeText: async (text) => {
					window.__ticketCopied = text;
				}
			},
			configurable: true
		});
	});
	await start(page).click();
	await expect(page.locator('.stage-state')).toHaveText('경기 종료');
	await expect(grid.locator('.rank-card-status')).toHaveText(['✓ 도착', '✓ 도착', '✓ 도착']);
	await page.getByRole('button', { name: '결과 복사', exact: true }).first().click();
	for (const name of names)
		await expect.poll(() => page.evaluate(() => window.__ticketCopied)).toContain(name);
});

for (const width of [1440, 390]) {
	test(`${width}px 마지막 구슬은 결승 진입부터 보이고 슬로모션 위치가 보간된다`, async ({
		page
	}) => {
		await page.setViewportSize({ width, height: 1000 });
		await page.emulateMedia({ reducedMotion: 'no-preference' });
		await screenRace(page);
		await observeMarbleText(page);
		const race = createRace(Array(30).fill('공'), 'keyboard', 47);
		const sample = {
			time: 30,
			phase: 0,
			cinematic: { active: false, focusId: 29, newWinners: [] },
			marbles: race.marbles.map((m) => ({
				x: 360,
				y: race.layout.finale.start + (m.id === 29 ? 15 : 350),
				vx: 0,
				vy: 0
			}))
		};
		await page.addInitScript((sample) => {
			window.__raceDisplayFrame = sample;
			window.__onMarbleText = function (ctx, text, x, y) {
				if (text === '30' && ctx.canvas.getAttribute('role') === 'button') {
					const t = ctx.getTransform();
					window.__lastMarble = {
						x: (t.a * x + t.e) / devicePixelRatio,
						y: (t.d * (y - 4) + t.f) / devicePixelRatio,
						worldY: y - 4,
						now: performance.now(),
						width: ctx.canvas.clientWidth,
						height: ctx.canvas.clientHeight
					};
					if (window.__fallSamples) window.__fallSamples.push(y - 4);
				}
			};
		}, sample);
		await page.goto('/marble-race');
		expect(await page.locator('main').ariaSnapshot()).toContain('마지막');
		await expect(start(page)).toBeEnabled();
		await page.getByLabel('참가자 이름').fill('공*30');
		await page.getByRole('button', { name: '마지막', exact: true }).click();
		await page.getByRole('button', { name: '♫ 소리 켜짐', exact: true }).click();
		await start(page).click();
		const visible = () =>
			page.evaluate(() => {
				const m = window.__lastMarble;
				return Boolean(
					m &&
					performance.now() - m.now < 250 &&
					Math.abs(m.worldY - window.__raceDisplayFrame.marbles[29].y) < 2.1 &&
					m.x > 0 &&
					m.x < m.width &&
					m.y > 13 &&
					m.y < m.height - 13
				);
			});
		await expect.poll(visible).toBe(true);
		await expect(page.getByRole('button', { name: '경기 배속 전환' })).toHaveText('1배속');
		await page
			.locator('.race-stage')
			.screenshot({ path: `.context/marble-last-entry-${width}.png` });
		await page.evaluate((startY) => {
			const frame = window.__raceDisplayFrame;
			frame.time = 31;
			frame.cinematic.active = true;
			frame.marbles[29].y = startY;
		}, race.layout.finish.y - 200);
		await expect(page.getByRole('button', { name: '경기 배속 전환' })).toHaveText('0.25배속');
		await expect.poll(visible).toBe(true);
		await page.evaluate(() => {
			window.__fallSamples = [];
			let ticks = 0;
			const timer = setInterval(() => {
				window.__raceDisplayFrame.time += 1 / 120;
				window.__raceDisplayFrame.marbles[29].y += 2;
				if (++ticks === 30) clearInterval(timer);
			}, 1000 / 30);
		});
		await page.waitForTimeout(1200);
		const samples = await page.evaluate(() => window.__fallSamples);
		expect(samples.some((y) => Math.abs(y - Math.round(y)) > 0.05)).toBe(true);
		await expect.poll(visible).toBe(true);
	});
}

test('1000개 전체 맵에서 번호 캐시가 잘리지 않고 화면 크기에 맞는 비트맵을 사용한다', async ({
	page
}) => {
	await observeMarbleText(page);
	await page.addInitScript(() => {
		window.__glyphChecks = [];
		window.__onMarbleText = (ctx, text, x, y, bitmap) => {
			if (/^\d+$/.test(text) && bitmap) window.__glyphChecks.push(bitmap);
		};
	});
	await page.goto('/marble-race');
	expect(await page.locator('main').ariaSnapshot()).toContain('전체 맵');
	await expect(start(page)).toBeEnabled();
	await page.getByLabel('참가자 이름').fill('공*1000');
	await expect(
		page.getByRole('region', { name: '구슬 도착 순위', exact: true }).locator('li').first()
	).toHaveAttribute('aria-setsize', '1000');
	await page.getByLabel('구슬 찾기').fill('1000');
	await page
		.getByRole('region', { name: '구슬 도착 순위', exact: true })
		.getByRole('button')
		.click();
	await page.getByRole('button', { name: '전체 맵', exact: true }).click();
	await page.evaluate(() => {
		window.__glyphChecks = [];
	});
	await expect.poll(() => page.evaluate(() => window.__glyphChecks.length)).toBeGreaterThan(0);
	const checks = await page.evaluate(() => window.__glyphChecks);
	for (const bitmap of checks) {
		expect(bitmap.top).toBeGreaterThanOrEqual(0);
		expect(bitmap.bottom).toBeLessThanOrEqual(bitmap.height);
		expect(bitmap.width).toBeLessThan(128);
		expect(bitmap.height).toBeLessThan(128);
	}
});

for (const width of [1440, 390]) {
	test(`${width}px 순위 패널은 재클릭과 키보드로 추적을 해제한다`, async ({ page }) => {
		await page.setViewportSize({ width, height: 900 });
		await screenRace(page);
		await page.goto('/marble-race');
		expect(await page.locator('main').ariaSnapshot()).toContain('도착 순위');
		await expect(start(page)).toBeEnabled();
		await page.getByLabel('참가자 이름').fill('첫구슬\n둘째구슬\n셋째구슬');
		const grid = page.getByRole('region', { name: '구슬 도착 순위', exact: true });
		const selected = grid.locator('[aria-pressed="true"]');
		const second = grid.getByRole('button', { name: /둘째구슬, 2번/ });
		for (const state of ['출발 준비', '경기 중', '경기 종료']) {
			if (state === '경기 중') {
				await page.getByRole('button', { name: '♫ 소리 켜짐', exact: true }).click();
				await start(page).click();
			} else if (state === '경기 종료') {
				await page.evaluate(() => {
					window.__racePhase = 'finished';
				});
			}
			await expect(page.locator('.stage-state')).toHaveText(state);
			await expect(second).toBeVisible();
			await second.click();
			await expect(selected).toHaveCount(1);
			await expect(second).toHaveAccessibleName(/구슬 추적 해제$/);
			await expect(grid.locator('.rank-card-tracking')).toHaveCount(1);
			await second.click();
			await expect(selected).toHaveCount(0);
			await expect(grid.locator('.rank-card-tracking')).toHaveCount(0);
			await expect(second).toBeFocused();
			await expect(second).toHaveAccessibleName(/구슬 따라가기$/);
			await second.press('Enter');
			await expect(second).toHaveAttribute('aria-pressed', 'true');
			await second.press('Space');
			await expect(selected).toHaveCount(0);
			await expect(second).toBeFocused();
		}
	});
}

test('화면 밖 순위의 구슬 그림은 멈추고 스크롤로 보이면 최신 번호를 그린다', async ({ page }) => {
	await page.setViewportSize({ width: 390, height: 844 });
	await page.addInitScript(() => {
		window.__rankPaints = 0;
		const fill = CanvasRenderingContext2D.prototype.fillText;
		CanvasRenderingContext2D.prototype.fillText = function (...args) {
			this.canvas.dataset.paintedNumber = String(args[0]);
			return fill.apply(this, args);
		};
		const draw = CanvasRenderingContext2D.prototype.drawImage;
		CanvasRenderingContext2D.prototype.drawImage = function (image, ...args) {
			if (this.canvas.classList.contains('marble-icon')) {
				window.__rankPaints++;
				this.canvas.dataset.paintedNumber = image.dataset.paintedNumber;
			}
			return draw.call(this, image, ...args);
		};
	});
	await page.goto('/marble-race');
	expect(await page.locator('main').ariaSnapshot()).toContain('도착 순위');
	await expect(start(page)).toBeEnabled();
	await page.getByLabel('참가자 이름').fill('공*1000');
	await page.getByRole('button', { name: '♫ 소리 켜짐', exact: true }).click();
	await start(page).click();
	await expect(page.locator('.stage-state')).toHaveText('경기 중');
	const grid = page.getByRole('region', { name: '구슬 도착 순위', exact: true });
	await page.evaluate(() => window.scrollTo(0, 0));
	await expect.poll(async () => (await grid.boundingBox()).y).toBeGreaterThan(844);
	await page.waitForTimeout(100);
	await page.evaluate(() => (window.__rankPaints = 0));
	await page.waitForTimeout(500);
	expect(await page.evaluate(() => window.__rankPaints)).toBe(0);
	await grid.scrollIntoViewIfNeeded();
	await expect.poll(() => page.evaluate(() => window.__rankPaints)).toBeGreaterThan(0);
	await expect
		.poll(() =>
			grid.evaluate((root) =>
				[...root.querySelectorAll('.rank-card')].every((card) => {
					const number = card.getAttribute('aria-label').match(/, (\d+)번/)[1];
					return card.querySelector('canvas').dataset.paintedNumber === number;
				})
			)
		)
		.toBe(true);
});
