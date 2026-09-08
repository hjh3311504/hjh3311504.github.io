import { expect, test } from '@playwright/test';

const browserErrors = new WeakMap();
test.beforeEach(async ({ page }) => {
	const errors = [];
	browserErrors.set(page, errors);
	page.on('console', (message) => {
		if (message.type() === 'error') errors.push(`console: ${message.text()}`);
	});
	page.on('pageerror', (error) => errors.push(`pageerror: ${error.message}`));
});
test.afterEach(async ({ page }) => {
	expect(browserErrors.get(page)).toEqual([]);
});

async function settle(button) {
	await button.evaluate((element) =>
		Promise.all(element.getAnimations().map((animation) => animation.finished))
	);
}

async function appearance(button) {
	await settle(button);
	return button.evaluate((element) => {
		const style = getComputedStyle(element);
		return {
			color: style.color,
			backgroundColor: style.backgroundColor,
			borderColor: style.borderColor,
			opacity: style.opacity,
			transform: style.transform
		};
	});
}

// 테마에 정의된 색을 브라우저가 사용하는 RGB 표기로 변환합니다.
async function color(button, value) {
	return button.evaluate((element, value) => {
		const probe = document.createElement('span');
		probe.style.color = value;
		element.append(probe);
		const result = getComputedStyle(probe).color;
		probe.remove();
		return result;
	}, value);
}

async function expectKeyboardFocus(page, button) {
	await button.focus();
	await page.keyboard.press('Shift+Tab');
	await page.keyboard.press('Tab');
	await expect(button).toBeFocused();
	await expect(button).toHaveCSS('outline-style', 'solid');
	await expect(button).toHaveCSS('outline-width', '2px');
	await expect(button).toHaveCSS('outline-offset', '2px');
	await expect(button).toHaveCSS('outline-color', await color(button, 'var(--focus)'));
}

async function expectHover(page, button, colors) {
	await expectKeyboardFocus(page, button);
	await button.hover();
	await settle(button);
	for (const [property, value] of Object.entries(colors)) {
		await expect.soft(button).toHaveCSS(property, await color(button, value));
	}
}

async function expectDisabledPress(page, button) {
	await expect(button).toBeDisabled();
	await button.scrollIntoViewIfNeeded();
	await page.mouse.move(0, 0);
	const before = await appearance(button);
	const stored = await page.evaluate(() => JSON.stringify(localStorage));
	await button.hover({ force: true });
	expect.soft(await appearance(button)).toEqual(before);
	await page.mouse.down();
	expect.soft(await appearance(button)).toEqual(before);
	await page.mouse.up();
	await button.focus();
	await expect(button).not.toBeFocused();
	expect(await page.evaluate(() => JSON.stringify(localStorage))).toBe(stored);
}

async function addParticipants(page) {
	await page.locator('#person-name').fill('가영, 나연, 다현, 라희');
	await page.locator('#person-name').press('Enter');
	await expect(page.locator('[data-participant-remove]')).toHaveCount(4);
}

async function openWheel(page) {
	await addParticipants(page);
	await page.locator('#make-teams-button').click();
	await page.locator('.win-button').first().click();
	await page.locator('.draw-button').first().click();
	await expect(page.locator('#wheel-dialog')).toBeVisible();
}

for (const theme of ['light', 'dark']) {
	test.describe(theme === 'light' ? '밝은 테마 버튼 상태' : '어두운 테마 버튼 상태', () => {
		test.beforeEach(async ({ page }) => {
			await page.addInitScript((theme) => localStorage.setItem('juno.develog.theme', theme), theme);
			await page.goto('/team-maker');
			await expect(page.locator('.site-shell')).toHaveAttribute('data-theme', theme);
		});

		test('비활성 팀 만들기·dialog 확인은 눌러도 축소되거나 실행되지 않는다', async ({ page }) => {
			await expectDisabledPress(page, page.locator('#make-teams-button'));
			await expect(page.locator('#team-grid .team-card')).toHaveCount(0);
			await page.locator('#open-bulk-button').click();
			await expectDisabledPress(page, page.locator('#bulk-add-button'));
			await expect(page.locator('#bulk-dialog')).toBeVisible();
			await expect(page.locator('[data-participant-remove]')).toHaveCount(0);
			await page.locator('#bulk-dialog [data-close-dialog]').first().click();
			await page.locator('#open-rosters-button').click();
			await expectDisabledPress(page, page.locator('#save-roster-button'));
			await expect(page.locator('.roster-row')).toHaveCount(0);
			await page.locator('#roster-dialog [data-close-dialog]').click();
			await addParticipants(page);
			await page.locator('#add-together-rule').click();
			await expectDisabledPress(page, page.locator('#save-rule-button'));
			await expect(page.locator('#rules-list .rule-row')).toHaveCount(0);
		});

		test('추첨과 다음 당첨자 버튼은 hover에서 초록색을 유지한다', async ({ page }) => {
			await addParticipants(page);
			await page.locator('#make-teams-button').click();
			await page.locator('.win-button').first().click();
			const draw = page.locator('.draw-button').first();
			const colors = {
				color: 'var(--green)',
				'background-color': 'var(--green-soft)',
				'border-color': 'var(--green)'
			};
			await expectHover(page, draw, colors);
			await draw.click();
			await page.locator('#spin-wheel-button').click();
			await page.locator('#spin-wheel-button').click();
			await page.locator('#wheel-close-button').click();
			await expect(draw).toHaveText('다음 당첨자 뽑기');
			await expectHover(page, draw, colors);
		});

		test('다시 섞기는 hover에서 공통 utility 색이 아닌 강조색을 유지한다', async ({ page }) => {
			await addParticipants(page);
			await page.locator('#make-teams-button').click();
			const button = page.locator('#reshuffle-button');
			await expectHover(page, button, {
				color: 'var(--on-primary)',
				'background-color': 'var(--primary-active)',
				'border-color': 'var(--primary-active)'
			});
			await button.click();
			await expect(page.locator('#team-grid .team-card')).toHaveCount(2);
		});

		test('참가자 전체 삭제는 hover에서도 경고색을 유지한다', async ({ page }) => {
			await addParticipants(page);
			const button = page.locator('#clear-list-button');
			await expectHover(page, button, {
				color: 'var(--danger)',
				'background-color': 'var(--danger-soft)',
				'border-color': 'var(--danger-line)'
			});
			await button.click();
			await expect(page.locator('#confirm-dialog')).toBeVisible();
			await page.locator('#cancel-confirm-button').click();
			await expect(page.locator('[data-participant-remove]')).toHaveCount(4);
		});

		test('삭제 확인은 기능별 hover 색상과 삭제 동작을 유지한다', async ({ page }) => {
			await addParticipants(page);
			await page.locator('#clear-list-button').click();
			const button = page.locator('#confirm-action-button');
			await expectHover(page, button, {
				color: 'var(--on-danger)',
				'background-color': '#d93d43',
				'border-color': '#d93d43'
			});
			await button.click();
			await expect(page.locator('[data-participant-remove]')).toHaveCount(0);
		});

		test('저장 명단 불러오기는 기능별 hover 테두리를 유지한다', async ({ page }) => {
			await addParticipants(page);
			await page.locator('#open-rosters-button').click();
			await page.locator('#roster-name').fill('점검 명단');
			await page.locator('#save-roster-button').click();
			const button = page.locator('.roster-load-button');
			await expectHover(page, button, {
				color: 'var(--primary-dark)',
				'background-color': 'var(--primary-soft)',
				'border-color': 'var(--primary-line)'
			});
			await button.click();
			await expect(page.locator('#roster-dialog')).not.toBeVisible();
			await expect(page.locator('[data-participant-remove]')).toHaveCount(4);
		});

		test('추첨 중 닫기와 모두 뽑음은 hover·누름에 반응하지 않는다', async ({ page }) => {
			await openWheel(page);
			// 추첨 중 상태를 고정해 자동 완료와 검사 시간의 경쟁을 없앱니다.
			await page.clock.install();
			await page.clock.pauseAt(new Date());
			await page.locator('#spin-wheel-button').click();
			for (const button of await page.locator('#wheel-dialog [data-close-dialog]').all()) {
				await expectDisabledPress(page, button);
				await expect(page.locator('#wheel-dialog')).toBeVisible();
				await expect(page.locator('#wheel-result')).toHaveText('돌리는 중…');
			}
			await page.locator('#spin-wheel-button').click();
			await page.locator('#spin-wheel-button').click();
			await page.locator('#spin-wheel-button').click();
			await expectDisabledPress(page, page.locator('#spin-wheel-button'));
			await expect(page.locator('#wheel-result')).toContainText('2번째 당첨자');
			await page.locator('#wheel-close-button').click();
			await expectDisabledPress(page, page.locator('.draw-button:disabled'));
			await expect(page.locator('#wheel-dialog')).not.toBeVisible();
		});

		test('참가자 삭제 처리 중 다른 삭제 버튼은 hover와 클릭에 반응하지 않는다', async ({
			page
		}) => {
			await addParticipants(page);
			await page.clock.install();
			await page.clock.pauseAt(new Date());
			await page.locator('[data-participant-remove]').first().click();
			await expectDisabledPress(page, page.locator('[data-participant-remove]').nth(1));
			await page.clock.runFor(600);
			await expect(page.locator('[data-participant-remove]')).toHaveCount(3);
			await expect(page.getByRole('button', { name: '나연 삭제', exact: true })).toBeEnabled();
		});
	});
}
