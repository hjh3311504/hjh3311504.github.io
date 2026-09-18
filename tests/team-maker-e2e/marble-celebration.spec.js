import { test, expect } from '@playwright/test';

async function prepareWinners(page) {
	await page.addInitScript(() => {
		window.__arrivals = [];
		const NativeWorker = window.Worker;
		// 실제 Worker의 준비 결과에 도착 이벤트만 공급해 화면 연출을 검증한다.
		window.Worker = class extends NativeWorker {
			constructor(...args) {
				super(...args);
				this.announced = new Set();
				this.addEventListener('message', ({ data }) => {
					if (data.kind === 'ready') this.initialState = data.state;
				});
			}
			postMessage(data) {
				if (data.kind !== 'advance' || !this.initialState) return super.postMessage(data);
				const state = structuredClone(this.initialState);
				state.initial = false;
				state.time = 30;
				state.events = [];
				state.finished = [...window.__arrivals];
				state.marbles.forEach((m) => {
					m.y = state.layout.finish.y - 100;
					m.finished = state.finished.includes(m.id);
				});
				const newWinners = state.finished.filter((id) => !this.announced.has(id));
				newWinners.forEach((id) => this.announced.add(id));
				state.cinematic = {
					active: false,
					focusId: 0,
					newWinners: newWinners.map((id) => state.marbles[id])
				};
				queueMicrotask(() =>
					this.dispatchEvent(
						new MessageEvent('message', {
							data: { kind: 'frame', state, unused: 0 }
						})
					)
				);
			}
		};
	});
	await page.goto('/marble-race');
	expect(await page.locator('main').ariaSnapshot()).toContain('구슬 굴리기');
	await page.getByLabel('참가자 이름').fill('첫당첨\n둘째당첨\n셋째당첨');
	await page.getByRole('button', { name: '여러명', exact: true }).click();
	await page.getByLabel('시작 순위').fill('1');
	await page.getByLabel('끝 순위').fill('3');
	await page.getByRole('button', { name: '♫ 소리 켜짐', exact: true }).click();
	await page.getByRole('button', { name: '구슬 굴리기 ▶', exact: true }).first().click();
	await expect(page.locator('.stage-state')).toHaveText('경기 중');
}

test('카드 종류별 배경·공통 테두리·파란 포커스·제목 간격을 데스크톱과 모바일에서 사용한다', async ({
	page
}) => {
	for (const viewport of [
		{ width: 1440, height: 1000 },
		{ width: 390, height: 844 }
	]) {
		await page.setViewportSize(viewport);
		await page.goto('/qr-code');
		const reference = await page
			.locator('.ui-surface[data-variant="card"]')
			.first()
			.evaluate((el) => {
				const s = getComputedStyle(el);
				return { background: s.backgroundColor, border: s.borderColor, radius: s.borderRadius };
			});
		await page.goto('/marble-race');
		expect(await page.locator('main').ariaSnapshot()).toContain('참가자');
		const header = await page.locator('.tool-page-header').boundingBox();
		const layout = await page.locator('.marble-layout').boundingBox();
		expect(layout.y - header.y - header.height).toBeCloseTo(32, 0);
		const field = page.getByLabel('참가자 이름');
		await field.focus();
		expect(await field.evaluate((el) => getComputedStyle(el).outlineColor)).toBe(
			'rgb(0, 117, 222)'
		);
		const cards = await page.locator('.race-panel, .library-panel').evaluateAll((elements) =>
			elements.map((el) => {
				const s = getComputedStyle(el);
				return { background: s.backgroundColor, border: s.borderColor, radius: s.borderRadius };
			})
		);
		expect(cards.length).toBeGreaterThan(0);
		for (const card of cards) expect(card).toEqual(reference);
		// 도감 안의 블록 카드만 미선택 맵 옵션과 같은 배경을 사용한다.
		const blockCards = page.locator('.library-panel .block-card');
		await expect(blockCards).toHaveCount(15);
		await expect
			.poll(() =>
				blockCards.evaluateAll((elements, reference) => {
					const option = document.querySelector('.map-option:not(.selected)');
					const background = getComputedStyle(option).backgroundColor;
					return elements.every((el) => {
						const style = getComputedStyle(el);
						return (
							style.backgroundColor === background &&
							style.borderColor === reference.border &&
							style.borderRadius === reference.radius
						);
					});
				}, reference)
			)
			.toBe(true);
		expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(
			true
		);
		await page.screenshot({ path: `output/playwright/marble-common-${viewport.width}.png` });
	}
});

test('당첨마다 효과를 새로 표시하고 전체화면·정지·초기화에서도 올바르게 정리한다', async ({
	page
}) => {
	await page.emulateMedia({ reducedMotion: 'no-preference' });
	await prepareWinners(page);
	await page.getByRole('button', { name: '경기장 전체화면', exact: true }).click();
	await page.evaluate(() => {
		window.__arrivals = [0];
	});
	const effect = page.locator('.winner-celebration');
	await expect(effect).toContainText('첫당첨');
	await expect(effect.locator('.confetti')).toHaveCount(36);
	await expect(effect).toHaveCSS('pointer-events', 'none');
	await expect(page.locator('.winner-panel')).toContainText('첫당첨');
	await expect(effect.locator('.winner-banner')).toHaveCSS('opacity', '1');
	await page.screenshot({ path: 'output/playwright/marble-winner-effect.png' });
	await expect(effect).toHaveCount(0, { timeout: 4000 });
	// 이미 당첨된 구슬은 다음 프레임에서도 효과를 반복하지 않는다.
	await page.waitForTimeout(300);
	await expect(effect).toHaveCount(0);
	await page.evaluate(() => {
		window.__arrivals = [0, 1];
	});
	await expect(effect).toContainText('둘째당첨');
	await page.getByRole('button', { name: '일시정지 Ⅱ', exact: true }).click();
	await expect(effect).toHaveCount(0);
	await page.getByRole('button', { name: '전체화면 닫기', exact: true }).click();
	await page.getByRole('button', { name: '경기 종료하고 설정 변경', exact: true }).first().click();
	await page.getByRole('button', { name: '종료하고 설정 변경', exact: true }).click();
	await expect(page.locator('.winner-panel')).toHaveCount(0);
	await expect(effect).toHaveCount(0);
});

test('모바일 동작 줄이기에서는 마지막 도착 후에도 이름을 보여주고 색종이는 생략한다', async ({
	page
}) => {
	await page.setViewportSize({ width: 390, height: 844 });
	await page.emulateMedia({ reducedMotion: 'reduce' });
	await prepareWinners(page);
	await page.evaluate(() => {
		window.__arrivals = [0, 1, 2];
	});
	const effect = page.locator('.winner-celebration');
	await expect(effect).toContainText('첫당첨 · 둘째당첨 외1명');
	await expect(effect.locator('.confetti')).toHaveCount(0);
	await expect(effect.locator('.winner-banner')).toHaveCSS('animation-name', 'none');
	await expect(page.locator('.stage-state')).toHaveText('경기 종료');
	await expect(page.locator('.winner-panel')).toContainText('셋째당첨');
	await effect.scrollIntoViewIfNeeded();
	await page.screenshot({ path: 'output/playwright/marble-winner-mobile.png' });
	await page.evaluate(() => {
		window.__arrivals = [];
	});
	await page.getByRole('button', { name: '한 번 더 굴리기 ↻', exact: true }).click();
	await expect(page.locator('.stage-state')).toHaveText('경기 중');
	await expect(effect).toHaveCount(0);
	await expect(page.locator('.winner-panel')).toHaveCount(0);
});
