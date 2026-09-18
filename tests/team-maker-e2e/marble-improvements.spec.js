import { test, expect } from '@playwright/test';
import { screenRace } from './helpers/marble-screen-state.js';
const start = (page) => page.getByRole('button', { name: '구슬 굴리기 ▶', exact: true }).first();
const frame = (page) => page.locator('.race-minimap svg > rect').last();
async function enter(page) {
	await page.goto('/marble-race');
	expect(await page.locator('main').ariaSnapshot()).toContain('블록 도감');
}

test('문구·간결한 맵 카드·실제 특수 블록 그림을 공통 도감에 표시한다', async ({ page }) => {
	await enter(page);
	await expect(page.locator('#names-help')).toHaveText(
		'토끼*10처럼 입력하면 같은 구슬을 여러 개 넣어요.'
	);
	await expect(page.getByRole('button', { name: '예시 명단 넣기' })).toHaveCount(0);
	await expect(page.locator('.storage-note')).toHaveCount(0);
	await expect(page.getByText('특수 구간 안내', { exact: true })).toHaveCount(0);
	await expect(page.getByText(/경기 중에는 미리듣기가 잠깁니다/)).toHaveCount(0);
	await expect(page.getByRole('button', { name: '첫번째', exact: true })).toBeVisible();
	await expect(page.getByRole('button', { name: '여러명', exact: true })).toBeVisible();
	await expect(page.locator('.map-option small')).toHaveCount(0);
	await page.getByRole('button', { name: '도각도각 키보드', exact: true }).click();
	await expect(page.locator('.map-caption')).toHaveCount(0);
	const library = page.locator('[aria-labelledby=block-library-title]');
	await expect(library).toHaveAttribute('data-variant', 'card');
	await expect(library).toHaveCSS('background-color', 'rgb(255, 255, 255)');
	await expect(page.getByRole('region', { name: /^기본 블록/ }).locator('.block-card')).toHaveCount(
		12
	);
	await expect(library.locator('.map-material')).toHaveCount(4);
	await expect(library.locator('.map-material').first()).toHaveText('포함');
	await expect(library.locator('.library-legend')).toContainText(
		'선택한 맵에 들어 있는 블록이에요.'
	);
	await expect
		.poll(() =>
			page.evaluate(() => {
				const option = document.querySelector('.map-option:not(.selected)');
				const card = document.querySelector('.library-item');
				return getComputedStyle(option).backgroundColor === getComputedStyle(card).backgroundColor;
			})
		)
		.toBe(true);
	await expect(library.locator('.map-material').first()).toHaveCSS('border-radius', '6px');
	for (const name of ['얼음 경사판', '크랙 왁스', '젤리 연못']) {
		const card = page
			.locator('.block-card')
			.filter({ has: page.getByRole('heading', { name, exact: true }) });
		await expect(
			page.getByRole('region', { name: /^특수 블록/ }).locator('.block-card')
		).toHaveCount(3);
		await expect(card.locator('img')).toHaveAttribute('src', /^data:image/);
		await expect(card.getByRole('button', { name: `${name} 소리 미리듣기` })).toBeEnabled();
	}
	for (const width of [1920, 1440, 390]) {
		await page.setViewportSize({ width, height: 900 });
		await expect(page.locator('.map-name strong').first()).toHaveCSS('white-space', 'nowrap');
		const cardWidths = await library
			.locator('.library-grid')
			.evaluateAll((grids) =>
				grids.map((grid) => grid.firstElementChild.getBoundingClientRect().width)
			);
		expect(Math.abs(cardWidths[0] - cardWidths[1])).toBeLessThan(1);
		for (const card of await library.locator('.block-card').all())
			await expect(card).toHaveCSS('display', 'grid');
		for (const description of await library.locator('.item-description').all()) {
			await expect(description).toHaveCSS('white-space', 'nowrap');
			expect(
				await description.evaluate(
					(node) => node.clientHeight <= parseFloat(getComputedStyle(node).lineHeight) + 1
				)
			).toBe(true);
		}
		expect(await library.locator('.block-card p').count()).toBe(15);
		for (const label of await library.locator('.map-material').all()) {
			const aligned = await label.evaluate((node) => {
				const name = node.previousElementSibling.getBoundingClientRect();
				const badge = node.getBoundingClientRect();
				return (
					badge.x >= name.right &&
					Math.abs(badge.top + badge.height / 2 - (name.top + name.height / 2)) < 1
				);
			});
			expect(aligned).toBe(true);
		}
		expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(
			true
		);
	}
});

test('모바일 맵은1열이며 내 맵 모달의 선택 상자와 이동 버튼이 중앙에 맞는다', async ({ page }) => {
	await enter(page);
	await page.getByRole('button', { name: /내 맵 만들기/ }).click();
	const dialog = page.getByRole('dialog', { name: '내 맵 만들기' });
	await expect(dialog).toBeVisible();
	await expect(dialog).toHaveClass(/ui-dialog/);
	for (const width of [1440, 390, 320]) {
		await page.setViewportSize({ width, height: 844 });
		if (width < 520) {
			const boxes = await page
				.locator('.map-option')
				.evaluateAll((elements) => elements.map((el) => el.getBoundingClientRect().toJSON()));
			for (let i = 1; i < boxes.length; i++) {
				expect(boxes[i].x).toBeCloseTo(boxes[0].x, 0);
				expect(boxes[i].y).toBeGreaterThanOrEqual(boxes[i - 1].bottom);
			}
		}
		for (const row of await dialog.locator('.layer-controls').all()) {
			const controls = await row.locator('select, button').evaluateAll((elements) =>
				elements.map((el) => {
					const box = el.getBoundingClientRect();
					return { height: box.height, center: box.y + box.height / 2 };
				})
			);
			for (const control of controls) {
				expect(control.height).toBe(44);
				expect(control.center).toBeCloseTo(controls[0].center, 0);
			}
		}
		const fits = await dialog.evaluate(
			(el) =>
				el.scrollWidth <= el.clientWidth && el.getBoundingClientRect().width <= innerWidth - 32
		);
		expect(fits).toBe(true);
	}
	await dialog.getByLabel('1구역', { exact: true }).selectOption('thock4');
	await dialog
		.locator('.layer-editor')
		.first()
		.getByRole('button', { name: '아래로', exact: true })
		.click();
	await expect(dialog.getByLabel('2구역', { exact: true })).toHaveValue('thock4');
	await dialog
		.locator('.layer-editor')
		.nth(1)
		.getByRole('button', { name: '위로', exact: true })
		.click();
	await expect(dialog.getByLabel('1구역', { exact: true })).toHaveValue('thock4');
	await dialog.getByLabel('맵 이름').fill('내 키보드 맵');
	await dialog.getByRole('button', { name: '저장하고 선택' }).click();
	await expect(dialog).not.toBeVisible();
	await expect(page.locator('.stage-title strong')).toHaveText('내 키보드 맵');
});

test('인원 미리보기·미니맵 호버와 키보드 탐색은 이탈하면 자동 복귀한다', async ({ page }) => {
	await enter(page);
	const map = page.locator('.minimap-control');
	await expect(page.locator('.race-minimap')).toHaveCSS('width', '100px');
	const heightBefore = await page.locator('.race-minimap svg').getAttribute('viewBox');
	await page.getByLabel('참가자 이름').fill('같은구슬*1000');
	await expect
		.poll(() => page.locator('.race-minimap svg').getAttribute('viewBox'))
		.not.toBe(heightBefore);
	const zone = page.locator('.race-minimap svg > rect').nth(1);
	await expect(zone).toHaveAttribute('height', String(69 * 34));
	await map.scrollIntoViewIfNeeded();
	const box = await map.boundingBox();
	await page.mouse.move(box.x + box.width / 2, box.y + box.height * 0.65);
	await expect.poll(async () => Number(await frame(page).getAttribute('y'))).toBeGreaterThan(5000);
	await page.mouse.move(box.x + box.width + 25, box.y);
	await expect.poll(async () => Number(await frame(page).getAttribute('y'))).toBeLessThan(10);
	await map.focus();
	await page.keyboard.press('End');
	await expect.poll(async () => Number(await frame(page).getAttribute('y'))).toBeGreaterThan(10000);
	await page.keyboard.press('Escape');
	await expect.poll(async () => Number(await frame(page).getAttribute('y'))).toBeLessThan(10);
	await map.press('ArrowDown');
	await expect.poll(async () => Number(await frame(page).getAttribute('y'))).toBeGreaterThan(20);
	await page.keyboard.press('Tab');
	await expect.poll(async () => Number(await frame(page).getAttribute('y'))).toBeLessThan(10);
	await expect(page.getByRole('button', { name: '경기 배속 전환' })).toHaveText('1배속');
});

test('종료 뒤 기본·커스텀 맵 변경은 결과와 카메라를 초기화한다', async ({ page }) => {
	await screenRace(page);
	await enter(page);
	await page.getByLabel('참가자 이름').fill('토끼\n고양이');
	await page.getByRole('button', { name: '♫ 소리 켜짐', exact: true }).click();
	await start(page).click();
	await page.evaluate(() => {
		window.__racePhase = 'finished';
	});
	await expect(page.locator('.stage-state')).toHaveText('경기 종료');
	await expect(page.locator('.winner-names')).toHaveCSS('margin-top', '16px');
	await page.getByRole('button', { name: '뽁뽁 물놀이', exact: true }).click();
	await expect(page.locator('.stage-state')).toHaveText('출발 준비');
	await expect(page.locator('.stage-title strong')).toHaveText('뽁뽁 물놀이');
	await expect(page.locator('.winner-panel')).toHaveCount(0);
	await expect(page.locator('.winner-celebration')).toHaveCount(0);
	await expect(frame(page)).toHaveAttribute('y', '0');
	await expect(page.getByLabel('참가자 이름')).toHaveValue('토끼\n고양이');
	await page.evaluate(() => {
		window.__racePhase = 'running';
	});
	await start(page).click();
	await page.evaluate(() => {
		window.__racePhase = 'finished';
	});
	await expect(page.locator('.stage-state')).toHaveText('경기 종료');
	await page.getByRole('button', { name: /내 맵 만들기/ }).click();
	const dialog = page.getByRole('dialog', { name: '내 맵 만들기' });
	await dialog.getByLabel('맵 이름').fill('아주 긴 이름도 한 줄로 확인하는 커스텀 맵');
	await dialog.getByRole('button', { name: '저장하고 선택' }).click();
	await expect(page.locator('.stage-state')).toHaveText('출발 준비');
	await expect(page.locator('.stage-title strong')).toContainText('아주 긴 이름');
	for (const action of ['수정', '삭제']) {
		await page.evaluate(() => {
			window.__racePhase = 'running';
		});
		await start(page).click();
		await page.evaluate(() => {
			window.__racePhase = 'finished';
		});
		await expect(page.locator('.stage-state')).toHaveText('경기 종료');
		await page
			.locator('.custom-map-row')
			.getByRole('button', { name: action, exact: true })
			.click();
		if (action === '수정') {
			await dialog.getByLabel('맵 이름').fill('수정한 맵');
			await dialog.getByRole('combobox').first().selectOption('popit');
			await dialog.getByRole('button', { name: '저장하고 선택' }).click();
		}
		await expect(page.locator('.stage-state')).toHaveText('출발 준비');
		await expect(page.locator('.winner-panel')).toHaveCount(0);
		await expect(page.locator('.stage-title strong')).toHaveText(
			action === '수정' ? '수정한 맵' : '톡톡 나무공방'
		);
	}
});

test('1,000개 순위는 카드 행만 렌더링하고 검색·열 변경·추적을 지원한다', async ({ page }) => {
	await screenRace(page);
	await enter(page);
	await page.getByLabel('참가자 이름').fill('이름이같은구슬*1000');
	await page.getByRole('button', { name: '♫ 소리 켜짐', exact: true }).click();
	await start(page).click();
	const grid = page.getByRole('region', { name: '구슬 도착 순위', exact: true });
	await expect(grid.locator('li').first()).toHaveAttribute('aria-setsize', '1000');
	expect(await grid.locator('li').count()).toBeLessThan(30);
	await grid.scrollIntoViewIfNeeded();
	await grid.evaluate((el) => {
		el.scrollTop = el.scrollHeight;
	});
	await expect(grid.locator('li').last()).toHaveAttribute('aria-posinset', '1000');
	await page.getByLabel('구슬 찾기').fill('1000');
	await expect(grid.locator('li')).toHaveCount(1);
	await grid.getByRole('button').click();
	await expect(grid.getByRole('button')).toHaveAttribute('aria-pressed', 'true');
	await page.getByLabel('구슬 찾기').fill('');
	await page.setViewportSize({ width: 390, height: 844 });
	await expect.poll(() => grid.evaluate((el) => el.scrollTop)).toBe(0);
	await expect(grid.locator('li').first()).toHaveAttribute('aria-posinset', '1');
	await grid.scrollIntoViewIfNeeded();
	await page.screenshot({ path: 'output/playwright/marble-rank-mobile.png' });
	await page.setViewportSize({ width: 1440, height: 1000 });
	await grid.scrollIntoViewIfNeeded();
	await page.screenshot({ path: 'output/playwright/marble-rank-desktop.png' });
	await page.evaluate(() => {
		Object.defineProperty(navigator, 'clipboard', {
			value: {
				writeText: async (text) => {
					window.__copied = text;
				}
			},
			configurable: true
		});
		window.__racePhase = 'finished';
	});
	await expect(page.locator('.stage-state')).toHaveText('경기 종료');
	await page.getByRole('button', { name: '결과 복사', exact: true }).first().click();
	await expect.poll(() => page.evaluate(() => window.__copied?.includes('1000등'))).toBe(true);
});

test('미니맵은 결승·일시정지·전체화면에서도 탐색하고 현재 후보로 복귀한다', async ({ page }) => {
	await screenRace(page);
	await enter(page);
	await page.getByLabel('참가자 이름').fill('앞\n뒤');
	await page.getByRole('button', { name: '♫ 소리 켜짐', exact: true }).click();
	await start(page).click();
	await page.evaluate(() => {
		window.__racePhase = 'finale';
	});
	const speed = page.getByRole('button', { name: '경기 배속 전환' });
	await expect(speed).toHaveText('0.25배속');
	const map = page.locator('.minimap-control');
	await expect.poll(async () => Number(await frame(page).getAttribute('y'))).toBeGreaterThan(4000);
	await map.focus();
	await map.press('Home');
	await expect.poll(async () => Number(await frame(page).getAttribute('y'))).toBeLessThan(2);
	await expect(speed).toHaveText('0.25배속');
	await map.press('Escape');
	await expect.poll(async () => Number(await frame(page).getAttribute('y'))).toBeGreaterThan(4000);
	await page.getByRole('button', { name: '일시정지 Ⅱ', exact: true }).click();
	await expect(page.locator('.stage-state')).toHaveText('일시정지');
	await page.getByRole('button', { name: '전체 맵', exact: true }).click();
	await map.focus();
	await map.press('Home');
	await expect(page.getByRole('button', { name: '전체 맵', exact: true })).toBeVisible();
	await expect.poll(async () => Number(await frame(page).getAttribute('y'))).toBeLessThan(2);
	await page.getByRole('button', { name: '경기장 전체화면', exact: true }).click();
	await expect(page.getByRole('button', { name: '전체화면 닫기' })).toBeVisible();
	await map.focus();
	await map.press('End');
	await expect.poll(async () => Number(await frame(page).getAttribute('y'))).toBeGreaterThan(4000);
	await map.press('Home');
	await expect.poll(async () => Number(await frame(page).getAttribute('y'))).toBeLessThan(2);
	await map.press('Escape');
	await expect.poll(async () => Number(await frame(page).getAttribute('y'))).toBeGreaterThan(4000);
	await expect(page.locator('.stage-state')).toHaveText('일시정지');
});

test('모바일 미니맵은 터치 이동·해제·취소를 처리하며 어두운 화면에도 표시한다', async ({
	page
}) => {
	await page.setViewportSize({ width: 390, height: 844 });
	await page.emulateMedia({ colorScheme: 'dark' });
	await enter(page);
	const map = page.locator('.minimap-control');
	await map.scrollIntoViewIfNeeded();
	await expect(page.locator('.race-minimap')).toHaveCSS('width', '64px');
	const box = await map.boundingBox();
	const client = await page.context().newCDPSession(page);
	const touch = async (type, fraction) =>
		client.send('Input.dispatchTouchEvent', {
			type,
			touchPoints:
				fraction == null ? [] : [{ x: box.x + box.width / 2, y: box.y + box.height * fraction }]
		});
	await touch('touchStart', 0.7);
	await expect.poll(async () => Number(await frame(page).getAttribute('y'))).toBeGreaterThan(3000);
	await touch('touchMove', 0.3);
	await expect.poll(async () => Number(await frame(page).getAttribute('y'))).toBeLessThan(2000);
	await touch('touchEnd');
	await expect.poll(async () => Number(await frame(page).getAttribute('y'))).toBeLessThan(2);
	await touch('touchStart', 0.7);
	await expect.poll(async () => Number(await frame(page).getAttribute('y'))).toBeGreaterThan(3000);
	await touch('touchCancel');
	await expect.poll(async () => Number(await frame(page).getAttribute('y'))).toBeLessThan(2);
	await expect(page.getByRole('button', { name: '경기 배속 전환' })).toHaveText('1배속');
	const frost = page
		.locator('.block-card')
		.filter({ has: page.getByRole('heading', { name: '얼음 경사판', exact: true }) });
	await frost.scrollIntoViewIfNeeded();
	await page.screenshot({ path: 'output/playwright/marble-special-dark-mobile.png' });
});

test('결과 복사 토스트는 레이아웃을 밀지 않고 사라지며 전체화면에서도 보인다', async ({ page }) => {
	await screenRace(page);
	await enter(page);
	await page.getByLabel('참가자 이름').fill('토끼\n고양이');
	await page.getByRole('button', { name: '♫ 소리 켜짐', exact: true }).click();
	await page.evaluate(() => {
		Object.defineProperty(navigator, 'clipboard', {
			configurable: true,
			value: {
				writeText: async () => {
					if (window.__copyFails) throw new Error('복사 차단');
				}
			}
		});
	});
	await start(page).click();
	await page.evaluate(() => {
		window.__racePhase = 'finished';
	});
	await expect(page.locator('.stage-state')).toHaveText('경기 종료');
	const copy = page.getByRole('button', { name: '결과 복사', exact: true }).first();
	await copy.scrollIntoViewIfNeeded();
	const layout = () =>
		page.evaluate(() => ({
			height: document.documentElement.scrollHeight,
			rankTop: document.querySelector('.ranking-grid').getBoundingClientRect().top + scrollY
		}));
	const before = await layout();
	await copy.click();
	const toast = page.locator('.ui-toast');
	await expect(toast).toHaveText('결과를 복사했어요.');
	await expect(toast).toHaveCSS('position', 'fixed');
	await expect(toast).toHaveCSS('pointer-events', 'none');
	expect(await layout()).toEqual(before);
	await expect(page.locator('.race-message')).toHaveCount(0);
	await expect(toast).toBeEmpty({ timeout: 5000 });
	await copy.click();
	await expect(toast).toHaveText('결과를 복사했어요.');
	await page.evaluate(() => {
		window.__copyFails = true;
	});
	await copy.click();
	await expect(toast).toHaveText('결과를 복사하지 못했어요.');
	expect(await layout()).toEqual(before);
	await page.setViewportSize({ width: 390, height: 844 });
	await page.getByRole('button', { name: '경기장 전체화면', exact: true }).click();
	await expect(page.getByRole('button', { name: '전체화면 닫기' })).toBeVisible();
	await copy.click();
	await expect(toast.locator('span')).toBeInViewport();
	await page.screenshot({ path: 'output/playwright/marble-copy-toast-mobile.png' });
	await page.getByRole('button', { name: '전체화면 닫기' }).click();
	await page.getByRole('button', { name: '도각도각 키보드', exact: true }).click();
	await expect(toast).toBeEmpty();
});

test('ASMR 검색 정보·공용 가이드와 화면에 보이지 않는 경기 안내를 제공한다', async ({ page }) => {
	await page.goto('/marble-race');
	expect(await page.locator('main').ariaSnapshot()).toContain('ASMR 구슬 추첨기 사용법');
	await expect(page).toHaveTitle('ASMR 구슬 레이스 | 무료 구슬 추첨기·랜덤 뽑기');
	await expect(page.getByRole('heading', { level: 1 })).toHaveText('ASMR 구슬 레이스');
	await expect(page.locator('meta[property="og:image"]')).toHaveAttribute(
		'content',
		/marble-race-open-graph-1200x630.png$/
	);
	const guide = page.getByTestId('marble-race-guide');
	await expect(guide.locator('details[open]')).toHaveCount(4);
	await guide.getByText('자주 묻는 질문', { exact: true }).click();
	await expect(
		guide.getByRole('heading', { name: '무료로 쓸 수 있나요? 설치나 로그인이 필요한가요?' })
	).toBeHidden();
	await guide.getByText('자주 묻는 질문', { exact: true }).click();
	await expect(
		guide.getByRole('heading', { name: '무료로 쓸 수 있나요? 설치나 로그인이 필요한가요?' })
	).toBeVisible();
	await page.getByRole('button', { name: '♫ 소리 켜짐', exact: true }).click();
	await start(page).click();
	const announcement = page.locator('.race-stage [data-race-announcement]');
	await expect(announcement).toContainText('개의 구슬로 경기를 시작합니다.');
	await expect(announcement).toHaveCSS('position', 'absolute');
	await expect(announcement).toHaveCSS('width', '1px');
	await expect(announcement).toHaveCSS('height', '1px');
	await expect(announcement).toHaveCSS('clip', 'rect(0px, 0px, 0px, 0px)');
	await page.getByRole('button', { name: '일시정지 Ⅱ', exact: true }).click();
	await expect(page.getByRole('region', { name: '일시정지', exact: true })).toBeVisible();
	await expect(page.locator('.stage-state')).toHaveText('일시정지');
	await page.setViewportSize({ width: 390, height: 844 });
	await page.emulateMedia({ colorScheme: 'dark' });
	await guide.scrollIntoViewIfNeeded();
	await expect(guide).toBeVisible();
	expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(
		true
	);
});
