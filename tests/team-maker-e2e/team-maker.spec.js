import { expect, test } from '@playwright/test';

const TEAM_MAKER_PATH = '/team-maker/';
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

async function openTeamMaker(page) {
	await page.goto(TEAM_MAKER_PATH);
	await expect(page.getByRole('heading', { name: '팀 메이커', level: 1 })).toBeVisible();
}

async function addParticipants(page, names) {
	await page.getByRole('button', { name: '일괄 추가' }).click();
	const dialog = page.getByRole('dialog', { name: '참가자 일괄 추가' });
	await dialog.getByRole('textbox', { name: '추가할 참가자 이름' }).fill(names.join('\n'));
	await dialog.getByRole('button', { name: `명단에 ${names.length}명 추가` }).click();
	await expect(
		page.getByRole('heading', { name: new RegExp(`참가자 입력 \\(${names.length}명\\)`) })
	).toBeVisible();
}

async function addRule(page, type, names) {
	const buttonName = type === 'together' ? '같은 팀 지정' : '다른 팀 지정';
	const dialogName = type === 'together' ? '같은 팀으로 지정' : '다른 팀으로 지정';
	await page.getByRole('button', { name: buttonName }).click();
	const dialog = page.getByRole('dialog', { name: dialogName });
	for (const name of names) {
		await dialog.getByRole('checkbox', { name, exact: true }).check();
	}
	await dialog.getByRole('button', { name: '규칙 추가' }).click();
}

async function readTeams(page) {
	return page.locator('#team-grid .team-card').evaluateAll((cards) =>
		cards.map((card) => ({
			name: card.querySelector('h3')?.textContent?.trim(),
			members: [...card.querySelectorAll('.team-members li span:last-child')].map((member) =>
				member.textContent?.trim()
			)
		}))
	);
}

async function expectNoHorizontalOverflow(page) {
	const dimensions = await page.evaluate(() => ({
		viewport: window.innerWidth,
		document: document.documentElement.scrollWidth,
		body: document.body.scrollWidth
	}));
	expect(dimensions.document).toBeLessThanOrEqual(dimensions.viewport + 1);
	expect(dimensions.body).toBeLessThanOrEqual(dimensions.viewport + 1);
}

async function toggleParticipant(page, name, included) {
	const action = included ? '선택' : '해제';
	const checkbox = page.getByRole('checkbox', { name: `${name} 참가 ${action}` });
	await checkbox.evaluate((element) => element.click());
	const nextAction = included ? '해제' : '선택';
	await expect(page.getByRole('checkbox', { name: `${name} 참가 ${nextAction}` })).toBeChecked({
		checked: included
	});
}

test('공통 메뉴는 데스크톱 고정과 드로워 전환, 모바일 탐색을 지원한다', async ({ page }) => {
	await page.setViewportSize({ width: 1440, height: 900 });
	await page.goto('/');

	await expect(page.getByRole('heading', { name: "Lake's develog", level: 1 })).toBeVisible();
	await expect(page.getByRole('complementary')).toBeVisible();
	await expect(page.getByRole('link', { name: '홈' })).toHaveAttribute('aria-current', 'page');
	await expect(page.getByRole('link', { name: /팀 메이커 도구/ })).toBeVisible();
	await expect(page.getByRole('link', { name: 'Blog', exact: true })).toHaveCount(0);
	await page.getByRole('button', { name: '테마 변경, 현재 자동' }).click();
	await expect(page.locator('.site-shell')).toHaveAttribute('data-theme', 'light');
	await page.getByRole('button', { name: '테마 변경, 현재 밝게' }).click();
	await expect(page.locator('.site-shell')).toHaveAttribute('data-theme', 'dark');

	await page.getByRole('button', { name: '사이드바 고정 해제' }).click();
	const menuButton = page.getByRole('button', { name: '메뉴 열기' });
	await expect(menuButton).toBeVisible();
	await menuButton.click();
	await expect(page.getByRole('dialog', { name: '사이트 내비게이션' })).toBeVisible();
	await expect(page.getByRole('link', { name: '홈' })).toBeFocused();

	await page.keyboard.press('Escape');
	await expect(menuButton).toBeFocused();

	await page.setViewportSize({ width: 390, height: 844 });
	await page.reload();
	await expect(page.getByRole('button', { name: '메뉴 열기' })).toBeVisible();
	await expectNoHorizontalOverflow(page);
});

test('Team Maker의 다크 모드는 Home과 같은 기본 색상표를 사용한다', async ({ page }) => {
	await page.addInitScript(() => localStorage.setItem('juno.develog.theme', 'dark'));
	await page.goto('/');

	const homeColors = await page.locator('.site-shell').evaluate((shell) => {
		const card = shell.querySelector('.home-card');
		const sidebar = shell.querySelector('.site-sidebar');
		return {
			rightGap: window.innerWidth - shell.getBoundingClientRect().right,
			canvas: getComputedStyle(shell).backgroundColor,
			background: getComputedStyle(shell).backgroundImage,
			backgroundSize: getComputedStyle(shell).backgroundSize,
			body: getComputedStyle(document.body).backgroundColor,
			pageLayer: getComputedStyle(shell.querySelector('.home-stage')).backgroundColor,
			surface: getComputedStyle(card).backgroundColor,
			sidebar: getComputedStyle(sidebar).backgroundColor,
			text: getComputedStyle(card).color,
			line: getComputedStyle(card).borderTopColor
		};
	});

	await page.goto(TEAM_MAKER_PATH);
	const teamMakerColors = await page.locator('.site-shell').evaluate((shell) => {
		const card = shell.querySelector('.team-maker-page .card');
		const sidebar = shell.querySelector('.site-sidebar');
		return {
			rightGap: window.innerWidth - shell.getBoundingClientRect().right,
			canvas: getComputedStyle(shell).backgroundColor,
			background: getComputedStyle(shell).backgroundImage,
			backgroundSize: getComputedStyle(shell).backgroundSize,
			body: getComputedStyle(document.body).backgroundColor,
			pageLayer: getComputedStyle(shell.querySelector('.team-maker-page')).backgroundColor,
			surface: getComputedStyle(card).backgroundColor,
			sidebar: getComputedStyle(sidebar).backgroundColor,
			text: getComputedStyle(card).color,
			line: getComputedStyle(card).borderTopColor
		};
	});

	expect(homeColors.rightGap).toBe(0);
	expect(teamMakerColors).toEqual(homeColors);
});

test('승패 기록의 긴 참가자 이름은 생략하지 않고 여러 줄로 표시한다', async ({ page }) => {
	const names = [
		'가영'.repeat(18),
		'나연'.repeat(18),
		'다현'.repeat(18),
		'라희'.repeat(18),
		'마루'.repeat(18),
		'바다'.repeat(18)
	];
	await openTeamMaker(page);
	await addParticipants(page, names);
	await page.getByRole('button', { name: '팀 만들기' }).click();
	await page.getByRole('button', { name: '1팀 승리 기록' }).click();

	const summary = page.locator('.history-summary').first();
	await expect(summary).toBeVisible();
	const summaryLayout = await summary.evaluate((element) => ({
		clientWidth: element.clientWidth,
		scrollWidth: element.scrollWidth,
		height: element.getBoundingClientRect().height,
		lineHeight: Number.parseFloat(getComputedStyle(element).lineHeight)
	}));
	expect(summaryLayout.scrollWidth).toBeLessThanOrEqual(summaryLayout.clientWidth + 1);
	expect(summaryLayout.height).toBeGreaterThan(summaryLayout.lineHeight * 1.5);

	await page.getByRole('button', { name: '기록 보기' }).click();
	const teamNames = page.locator('.history-team-names');
	await expect(teamNames).toHaveCount(2);
	const renderedNames = (await teamNames.allTextContents()).join(', ');
	for (const name of names) expect(renderedNames).toContain(name);
	const teamNameLayouts = await teamNames.evaluateAll((elements) =>
		elements.map((element) => ({
			clientWidth: element.clientWidth,
			scrollWidth: element.scrollWidth,
			height: element.getBoundingClientRect().height,
			lineHeight: Number.parseFloat(getComputedStyle(element).lineHeight)
		}))
	);
	expect(teamNameLayouts.every((item) => item.scrollWidth <= item.clientWidth + 1)).toBe(true);
	expect(teamNameLayouts.some((item) => item.height > item.lineHeight * 1.5)).toBe(true);
});

test('SvelteKit 하위 route에서 기본 화면과 내부 자원을 불러오며 외부로 요청하지 않는다', async ({
	page
}) => {
	const responses = new Map();
	const requests = [];
	page.on('response', (response) =>
		responses.set(new URL(response.url()).pathname, response.status())
	);
	page.on('request', (request) => requests.push(new URL(request.url())));

	await openTeamMaker(page);
	await page.waitForLoadState('networkidle');

	await expect(page.getByRole('heading', { name: '1. 참가자 입력 (0명)' })).toBeVisible();
	await expect(page.getByRole('heading', { name: '2. 나누는 방식' })).toBeVisible();
	await expect(page.getByRole('button', { name: '팀 만들기' })).toBeDisabled();
	await expect(page.getByRole('heading', { name: '3. 결과' })).toBeVisible();
	await expect(page.locator('#split-value')).toHaveText('2');
	await expect(page.getByRole('button', { name: /결과.*복사/ })).toHaveCount(0);
	await expect(page.locator('.team-maker-page')).toBeVisible();

	const svelteAssets = [...responses.entries()].filter(
		([path, status]) => path.includes('/_app/immutable/') && status === 200
	);
	expect(svelteAssets.length).toBeGreaterThan(0);
	const externalRequests = requests.filter((url) => url.origin !== 'http://127.0.0.1:4174');
	expect(externalRequests.map((url) => url.href)).toEqual([]);
});

test('참가자 편집, 두 나누기 방식, 다시 섞기와 새로고침 복구가 동작한다', async ({ page }) => {
	await openTeamMaker(page);
	await addParticipants(page, ['가영', '나연', '다현', '라희', '마루']);

	const firstName = page.getByRole('textbox', { name: '1번째 참가자 이름' });
	await firstName.fill('가영 수정');
	await firstName.press('Tab');
	await page.getByRole('radio', { name: '인원 수로 나누기' }).click();
	await expect(page.locator('#split-value')).toHaveText('4');
	await page.getByRole('button', { name: '팀 만들기' }).click();

	await expect(page.locator('#team-grid .team-card')).toHaveCount(2);
	let teams = await readTeams(page);
	expect(teams.map((team) => team.members.length).sort()).toEqual([2, 3]);
	const firstMembers = teams.flatMap((team) => team.members).sort();

	await page.getByRole('button', { name: '다시 섞기' }).click();
	teams = await readTeams(page);
	expect(teams.flatMap((team) => team.members).sort()).toEqual(firstMembers);

	await toggleParticipant(page, '나연', false);
	await expect(page.getByText('아직 만든 팀이 없습니다', { exact: true })).toBeVisible();
	await expect(
		page.getByRole('heading', { name: '1. 참가자 입력 (5명 중 4명 참가)' })
	).toBeVisible();

	await page.reload();
	await expect(page.getByRole('radio', { name: '인원 수로 나누기' })).toBeChecked();
	await expect(page.getByRole('textbox', { name: '1번째 참가자 이름' })).toHaveValue('가영 수정');
	await expect(page.getByRole('checkbox', { name: '나연 참가 선택' })).not.toBeChecked();
	await expect(page.getByText('아직 만든 팀이 없습니다', { exact: true })).toBeVisible();

	await page.getByRole('radio', { name: '팀 수로 나누기' }).click();
	await expect(page.locator('#split-value')).toHaveText('2');
});

test('쉼표로 참가자를 추가하고 삭제 뒤 빈자리를 순서대로 채운다', async ({ page }) => {
	await openTeamMaker(page);
	await page.getByRole('textbox', { name: '참가자 이름' }).fill('1, 2,3,4,5,6,7,8');
	await page.getByRole('button', { name: '추가', exact: true }).click();
	await expect(page.getByRole('heading', { name: '1. 참가자 입력 (8명)' })).toBeVisible();
	await page.getByRole('button', { name: '5 삭제', exact: true }).click();

	const participantNames = page.locator('#participant-list .participant-name');
	await expect
		.poll(() => participantNames.evaluateAll((inputs) => inputs.map((input) => input.value)))
		.toEqual(['1', '2', '3', '4', '7', '6', '8']);
	await expect(page.locator('#participant-list .participant-number')).toHaveText([
		'1',
		'2',
		'3',
		'4',
		'5',
		'6',
		'7'
	]);
});

test('같은 팀 규칙을 먼저 표시하고 두 규칙을 지켜 팀을 만든다', async ({ page }) => {
	await openTeamMaker(page);
	await addParticipants(page, ['가영', '나연', '다현', '라희', '마루', '바다']);
	await addRule(page, 'apart', ['다현', '라희']);
	await addRule(page, 'together', ['가영', '나연']);

	await expect(page.locator('#rules-list .rule-chip')).toHaveText(['같은 팀', '다른 팀']);
	await page.getByRole('button', { name: '팀 만들기' }).click();
	const teams = await readTeams(page);
	const teamOf = (name) => teams.findIndex((team) => team.members.includes(name));
	expect(teamOf('가영')).toBe(teamOf('나연'));
	expect(teamOf('다현')).not.toBe(teamOf('라희'));

	await page.locator('#rules-list [data-rule-remove]').first().click();
	await expect(page.locator('#rules-list .rule-chip')).toHaveText(['다른 팀']);
	await expect(page.getByText('아직 만든 팀이 없습니다', { exact: true })).toBeVisible();
});

test('명단을 저장하고 덮어쓴 뒤 불러오고 삭제한다', async ({ page }) => {
	await openTeamMaker(page);
	await addParticipants(page, ['가영', '나연', '다현']);
	await addRule(page, 'together', ['가영', '나연']);
	await toggleParticipant(page, '다현', false);

	await page.getByRole('button', { name: '명단 저장·불러오기' }).click();
	let dialog = page.getByRole('dialog', { name: '명단 저장·불러오기' });
	await dialog.getByRole('textbox', { name: '명단 이름' }).fill('주말 경기');
	await dialog.getByRole('button', { name: '저장', exact: true }).click();
	await expect(dialog.locator('.roster-row')).toHaveCount(1);
	await dialog.getByRole('button', { name: '닫기' }).click();

	const firstName = page.getByRole('textbox', { name: '1번째 참가자 이름' });
	await firstName.fill('가영 수정');
	await firstName.press('Tab');
	await page.getByRole('button', { name: '명단 저장·불러오기' }).click();
	dialog = page.getByRole('dialog', { name: '명단 저장·불러오기' });
	await dialog.getByRole('textbox', { name: '명단 이름' }).fill('주말 경기');
	await dialog.getByRole('button', { name: '저장', exact: true }).click();
	await expect(dialog.locator('.roster-row')).toHaveCount(1);
	await dialog.getByRole('button', { name: '닫기' }).click();

	await firstName.fill('임시 이름');
	await firstName.press('Tab');
	await page.reload();
	await page.getByRole('button', { name: '명단 저장·불러오기' }).click();
	dialog = page.getByRole('dialog', { name: '명단 저장·불러오기' });
	await expect(dialog.getByText('주말 경기', { exact: true })).toBeVisible();
	await dialog.getByRole('button', { name: '불러오기' }).click();

	await expect(page.getByRole('textbox', { name: '1번째 참가자 이름' })).toHaveValue('가영 수정');
	await expect(page.getByRole('checkbox', { name: '다현 참가 선택' })).not.toBeChecked();
	await expect(page.locator('#rules-list .rule-chip')).toHaveText(['같은 팀']);

	await page.getByRole('button', { name: '명단 저장·불러오기' }).click();
	dialog = page.getByRole('dialog', { name: '명단 저장·불러오기' });
	await dialog.getByRole('button', { name: '주말 경기 저장 명단 삭제' }).click();
	const confirm = page.getByRole('dialog', { name: '저장한 명단을 삭제할까요?' });
	await confirm.getByRole('button', { name: '삭제', exact: true }).click();
	await expect(dialog.locator('.roster-row')).toHaveCount(0);
	await expect(dialog.getByText('저장한 명단이 없습니다.', { exact: false })).toBeVisible();
});

test('승리·취소·기록 삭제와 돌림판 당첨자 및 효과음을 처리한다', async ({ page }) => {
	await page.addInitScript(() => {
		window.__audioStarts = [];
		class FakeAudioParam {
			setValueAtTime() {}
			exponentialRampToValueAtTime() {}
		}
		class FakeOscillator {
			constructor() {
				this.frequency = new FakeAudioParam();
			}
			connect(target) {
				return target;
			}
			start(time = 0) {
				window.__audioStarts.push(time);
			}
			stop() {}
			addEventListener() {}
		}
		class FakeGain {
			constructor() {
				this.gain = new FakeAudioParam();
			}
			connect(target) {
				return target;
			}
		}
		class FakeAudioContext {
			constructor() {
				this.currentTime = 0;
				this.destination = {};
				this.state = 'running';
			}
			createOscillator() {
				return new FakeOscillator();
			}
			createGain() {
				return new FakeGain();
			}
			resume() {
				return Promise.resolve();
			}
		}
		Object.defineProperty(window, 'AudioContext', { value: FakeAudioContext });
	});

	await openTeamMaker(page);
	await addParticipants(page, ['가영', '나연', '다현', '라희']);
	await page.getByRole('button', { name: '팀 만들기' }).click();
	const firstTeamMembers = (await readTeams(page))[0].members;
	await page.getByRole('button', { name: '1팀 승리 기록' }).click();

	await expect(page.getByText('1팀승', { exact: true }).first()).toBeVisible();
	await expect(page.getByText('2팀패', { exact: true }).first()).toBeVisible();
	await page.getByRole('button', { name: '기록 보기' }).click();
	const historyDialog = page.getByRole('dialog', { name: '승패 기록' });
	await expect(historyDialog.locator('.history-team-label')).toHaveText(['1팀승', '2팀패']);
	await page.keyboard.press('Escape');
	await expect(historyDialog).not.toBeVisible();

	await page.getByRole('button', { name: '1팀에서 한 명 뽑기' }).click();
	const wheelDialog = page.getByRole('dialog', { name: '1팀 뽑기' });
	const soundButton = wheelDialog.getByRole('button', { name: '효과음 끄기' });
	await soundButton.click();
	await expect(wheelDialog.getByRole('button', { name: '효과음 켜기' })).toHaveAttribute(
		'aria-pressed',
		'false'
	);
	await wheelDialog.getByRole('button', { name: '효과음 켜기' }).click();
	await wheelDialog.getByRole('button', { name: '돌리기' }).click();

	await expect.poll(() => page.evaluate(() => window.__audioStarts.length)).toBeGreaterThan(0);
	expect(await page.evaluate(() => window.__audioStarts[0])).toBe(0);
	const wheelResult = wheelDialog.locator('#wheel-result');
	await expect(wheelResult).toHaveText(/^당첨자 · /, { timeout: 8_000 });
	const pickedName = (await wheelResult.textContent()).replace('당첨자 · ', '').trim();
	expect(firstTeamMembers).toContain(pickedName);

	const stoppedAngle = await wheelDialog.locator('#wheel').evaluate((wheel, picked) => {
		const rotation = Number(wheel.style.transform.match(/-?\d+(?:\.\d+)?/)?.[0] || 0);
		const label = [...wheel.querySelectorAll('.wheel-label')].find(
			(item) => item.textContent?.trim() === picked
		);
		const labelAngle = Number(label?.dataset.angle || 0);
		return (((rotation + labelAngle) % 360) + 360) % 360;
	}, pickedName);
	expect(Math.min(stoppedAngle, 360 - stoppedAngle)).toBeLessThan(0.001);
	await expect(page.locator('.team-card').first().locator('.picked-person strong')).toHaveText(
		pickedName
	);

	await wheelDialog.locator('[data-close-dialog]').last().click();
	await page.getByRole('button', { name: '승리 취소' }).click();
	await expect(page.locator('#history-card')).toBeHidden();
	await page.getByRole('button', { name: '2팀 승리 기록' }).click();
	await page.locator('#today-history-list [data-history-remove]').click();
	const confirm = page.getByRole('dialog', { name: '이 기록을 삭제할까요?' });
	await confirm.getByRole('button', { name: '삭제', exact: true }).click();
	await expect(page.locator('#history-card')).toBeHidden();
});

test('룰렛 회전 중 dialog를 닫아도 다시 추첨할 수 있다', async ({ page }) => {
	await openTeamMaker(page);
	await addParticipants(page, ['가영', '나연', '다현', '라희']);
	await page.getByRole('button', { name: '팀 만들기' }).click();
	await page.getByRole('button', { name: '1팀 승리 기록' }).click();

	const openWheelButton = page.getByRole('button', { name: '1팀에서 한 명 뽑기' });
	const wheelDialog = page.getByRole('dialog', { name: '1팀 뽑기' });
	const spinButton = wheelDialog.locator('#spin-wheel-button');
	const wheelResult = wheelDialog.locator('#wheel-result');

	await openWheelButton.click();
	await spinButton.click();
	await expect(spinButton).toBeDisabled();
	await expect(spinButton).toHaveText('돌리는 중…');
	await wheelDialog.locator('[data-close-dialog]').last().click();
	await expect(wheelDialog).not.toBeVisible();

	await openWheelButton.click();
	await expect(spinButton).toBeEnabled();
	await expect(spinButton).toHaveText('돌리기');
	await expect(wheelResult).toHaveText('돌리기를 누르세요.');

	await spinButton.click();
	await page.keyboard.press('Escape');
	await expect(wheelDialog).not.toBeVisible();
	await openWheelButton.click();
	await expect(spinButton).toBeEnabled();
	await expect(spinButton).toHaveText('돌리기');
	await page.waitForTimeout(7_000);
	await expect(wheelResult).toHaveText('돌리기를 누르세요.');
	await expect(page.locator('.team-card').first().locator('.picked-person')).toHaveCount(0);

	await spinButton.click();
	await expect(wheelResult).toHaveText(/^당첨자 · /, { timeout: 8_000 });
	await expect(page.locator('.team-card').first().locator('.picked-person strong')).toBeVisible();
});

test('저장 실패를 알리고 모바일에서 키보드와 dialog를 사용할 수 있다', async ({ page }) => {
	await page.addInitScript(() => {
		const fail = () => {
			throw new DOMException('저장 공간 차단', 'SecurityError');
		};
		Storage.prototype.getItem = fail;
		Storage.prototype.setItem = fail;
	});
	await page.setViewportSize({ width: 390, height: 844 });
	await openTeamMaker(page);
	await expect(page.getByRole('alert')).toContainText('저장하지 못했습니다');

	const input = page.getByRole('textbox', { name: '참가자 이름' });
	await input.focus();
	await page.keyboard.type('가영');
	await page.keyboard.press('Enter');
	await page.keyboard.type('나연');
	await page.keyboard.press('Enter');

	await page.getByRole('button', { name: '값 줄이기' }).click();
	await page.getByRole('button', { name: '값 늘리기' }).focus();
	await page.keyboard.press('Tab');
	const makeButton = page.getByRole('button', { name: '팀 만들기' });
	await expect(makeButton).toBeFocused();
	const outlineWidth = await makeButton.evaluate((button) => getComputedStyle(button).outlineWidth);
	expect(Number.parseFloat(outlineWidth)).toBeGreaterThanOrEqual(2);
	await page.keyboard.press('Enter');
	await expect(page.locator('#team-grid .team-card')).toHaveCount(2);

	await page.getByRole('button', { name: '명단 저장·불러오기' }).focus();
	await page.keyboard.press('Enter');
	const dialog = page.getByRole('dialog', { name: '명단 저장·불러오기' });
	await expect(dialog).toBeVisible();
	await expect(dialog.getByRole('textbox', { name: '명단 이름' })).toBeFocused();
	const bounds = await dialog.boundingBox();
	expect(bounds).not.toBeNull();
	expect(bounds.x).toBeGreaterThanOrEqual(0);
	expect(bounds.x + bounds.width).toBeLessThanOrEqual(390);
	await expectNoHorizontalOverflow(page);

	await page.keyboard.press('Escape');
	await expect(dialog).not.toBeVisible();
});
