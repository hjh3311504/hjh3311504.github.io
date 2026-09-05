import { expect, test } from '@playwright/test';

const TEAM_MAKER_PATH = '/team-maker';
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
	await expect(page.getByRole('heading', { name: '무료 팀짜기·조짜기', level: 1 })).toBeVisible();
	expect(new URL(page.url()).pathname).toBe(TEAM_MAKER_PATH);
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

test('전체 기록의 긴 참가자 이름은 생략하지 않고 여러 줄로 표시한다', async ({ page }) => {
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

	await page.getByRole('button', { name: '전체 기록' }).click();
	const teamNames = page.getByRole('dialog', { name: '전체 기록' }).locator('.history-team-names');
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
	await expect(page.locator('#copy-result-button')).toHaveCount(1);
	await expect(page.locator('#copy-result-button')).toBeHidden();
	await expect(page.locator('.team-maker-page')).toBeVisible();

	const svelteAssets = [...responses.entries()].filter(
		([path, status]) => path.includes('/_app/immutable/') && status === 200
	);
	expect(svelteAssets.length).toBeGreaterThan(0);
	const externalRequests = requests.filter((url) => url.origin !== 'http://127.0.0.1:4174');
	expect(externalRequests.map((url) => url.href)).toEqual([]);
});

test('검색 안내 본문은 PC와 모바일에서 제목 구조와 한 열 배치를 유지한다', async ({ page }) => {
	await page.setViewportSize({ width: 1280, height: 900 });
	await openTeamMaker(page);

	await expect(page).toHaveTitle('무료 팀짜기·조짜기 프로그램 | 팀 메이커');
	await expect(page.locator('html')).toHaveAttribute('lang', 'ko');
	await expect(page.locator('h1')).toHaveCount(1);
	await expect(page.locator('link[rel="canonical"]')).toHaveAttribute(
		'href',
		'https://hjh3311504.github.io/team-maker'
	);

	const guide = page.getByTestId('team-maker-guide');
	for (const heading of [
		'3단계로 팀 나누기',
		'이럴 때 사용하세요',
		'팀 메이커의 주요 기능',
		'자주 묻는 질문'
	]) {
		await expect(guide.getByRole('heading', { name: heading, level: 2 })).toBeVisible();
	}
	await expect(guide.locator('.guide-steps > li')).toHaveCount(3);
	await expect(guide.locator('.faq-item')).toHaveCount(6);
	for (const faq of await guide.locator('.faq-item').all()) {
		await expect(faq.getByRole('heading', { level: 3 })).toBeVisible();
		await expect(faq.locator('p')).toBeVisible();
	}
	await expect(
		guide.getByText(
			'Lake가 만들고 직접 관리합니다. 참가자 이름은 현재 브라우저에만 저장되며 서버로 전송되지 않습니다.'
		)
	).toBeVisible();
	await expectNoHorizontalOverflow(page);

	await addParticipants(page, ['가영', '나연', '다현', '라희']);
	await page.getByRole('button', { name: '팀 만들기' }).click();
	await expect(page.locator('#team-grid .team-card')).toHaveCount(2);

	await page.setViewportSize({ width: 390, height: 844 });
	await page.reload();
	await expect(guide).toBeVisible();
	const mobileColumns = await guide
		.locator('.use-case-grid')
		.evaluate((element) =>
			getComputedStyle(element).gridTemplateColumns.split(' ').filter(Boolean)
		);
	expect(mobileColumns).toHaveLength(1);
	await expectNoHorizontalOverflow(page);
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
		class FakeBufferSource {
			constructor() {
				this.buffer = null;
				this.playbackRate = { value: 1 };
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
		class FakeBiquadFilter {
			constructor() {
				this.type = 'lowpass';
				this.frequency = new FakeAudioParam();
				this.Q = { value: 1 };
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
				this.sampleRate = 48_000;
			}
			createOscillator() {
				return new FakeOscillator();
			}
			createGain() {
				return new FakeGain();
			}
			createBufferSource() {
				return new FakeBufferSource();
			}
			createBiquadFilter() {
				return new FakeBiquadFilter();
			}
			createBuffer(channels, length, sampleRate) {
				const data = new Float32Array(length);
				return { sampleRate, length, getChannelData: () => data };
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
	await page.getByRole('button', { name: '전체 기록' }).click();
	const historyDialog = page.getByRole('dialog', { name: '전체 기록' });
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

	// 판이 도는 동안에는 아무 소리도 내지 않는다.
	await page.waitForTimeout(2_000);
	expect(await page.evaluate(() => window.__audioStarts.length)).toBe(0);

	const wheelResult = wheelDialog.locator('#wheel-result');
	await expect(wheelResult.locator('.wheel-outcome-name')).toBeVisible({ timeout: 8_000 });
	const pickedName = (await wheelResult.locator('.wheel-outcome-name').textContent()).trim();
	expect(firstTeamMembers).toContain(pickedName);

	// 판이 멈춘 뒤에 당첨 팡파르만 울린다.
	const fanfare = await page.evaluate(() => window.__audioStarts.slice());
	expect(fanfare.length).toBeGreaterThan(0);
	expect([...fanfare].sort((first, second) => first - second)).toEqual(fanfare);

	const stoppedAngle = await wheelDialog.locator('#wheel').evaluate((wheel, picked) => {
		const rotation = Number(wheel.style.transform.match(/-?\d+(?:\.\d+)?/)?.[0] || 0);
		const label = [...wheel.querySelectorAll('.wheel-label')].find(
			(item) => item.textContent?.trim() === picked
		);
		const labelAngle = Number(label?.dataset.angle || 0);
		return (((rotation + labelAngle) % 360) + 360) % 360;
	}, pickedName);
	expect(Math.min(stoppedAngle, 360 - stoppedAngle)).toBeLessThan(0.001);
	await expect(page.locator('.team-card .picked-person')).toHaveCount(0);
	await expect(page.locator('#picked-groups .picked-person')).toHaveCount(1);
	await expect(page.locator('#picked-groups .picked-name')).toHaveText(pickedName);

	await wheelDialog.locator('[data-close-dialog]').last().click();
	await page.getByRole('button', { name: '승리 취소' }).click();
	await expect(page.locator('#history-card')).toBeHidden();
	await page.getByRole('button', { name: '2팀 승리 기록' }).click();
	await page.locator('#today-history-list [data-history-remove]').click();
	const confirm = page.getByRole('dialog', { name: '이 기록을 삭제할까요?' });
	await confirm.getByRole('button', { name: '삭제', exact: true }).click();
	await expect(page.locator('#history-card')).toBeHidden();
});

test('룰렛 회전 중에는 닫기를 막고 바로 뽑기로 결과를 확정한다', async ({ page }) => {
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
	await expect(spinButton).toBeEnabled();
	await expect(spinButton).toHaveText('바로 뽑기');
	await expect(wheelDialog.locator('.wheel-label').first()).toHaveCSS('opacity', '1');
	await expect(wheelDialog.locator('[data-close-dialog]').last()).toBeDisabled();
	const spinningResultHeight = await wheelResult.evaluate(
		(element) => element.getBoundingClientRect().height
	);
	await page.keyboard.press('Escape');
	await expect(wheelDialog).toBeVisible();

	await spinButton.click();
	await expect(wheelResult.locator('.wheel-outcome-name')).toBeVisible();
	await expect
		.poll(() => wheelResult.evaluate((element) => element.getBoundingClientRect().height))
		.toBe(spinningResultHeight);
	await expect
		.poll(() =>
			wheelDialog
				.locator('#wheel')
				.evaluate(
					(wheel) => wheel.getAnimations().filter((item) => item.playState === 'running').length
				)
		)
		.toBe(0);
	await expect(page.locator('#picked-groups .picked-name')).toBeVisible();
	await expect(wheelDialog.locator('[data-close-dialog]').last()).toBeEnabled();
	await page.keyboard.press('Escape');
	await expect(wheelDialog).not.toBeVisible();
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

test('팀 결과를 팀 이름과 참가자 이름만 담은 글로 복사한다', async ({ page, context }) => {
	await context.grantPermissions(['clipboard-read', 'clipboard-write']);
	await openTeamMaker(page);
	await addParticipants(page, ['황준호', '권순범', '하종우', '이민형']);
	await page.getByRole('button', { name: '팀 만들기' }).click();

	const teams = await readTeams(page);
	const expected = teams.map((team) => [team.name, ...team.members].join('\n')).join('\n');

	const copyButton = page.locator('#copy-result-button');
	await copyButton.click();
	await expect(copyButton).toHaveText('복사 완료');
	expect(await page.evaluate(() => navigator.clipboard.readText())).toBe(expected);
	await expect(copyButton).toHaveText('명단 복사', { timeout: 5_000 });
});

test('3팀 이상이면 1등부터 순차로 지정하고 남은 팀이 자동으로 마지막 순위가 된다', async ({
	page
}) => {
	await openTeamMaker(page);
	await addParticipants(page, ['가영', '나연', '다현', '라희', '마루', '바다']);
	await page.getByRole('button', { name: '값 늘리기' }).click();
	await expect(page.locator('#split-value')).toHaveText('3');
	await page.getByRole('button', { name: '팀 만들기' }).click();
	await expect(page.locator('#team-grid .team-card')).toHaveCount(3);

	const chipOf = (index) => page.locator('.team-card').nth(index).locator('.team-count-chip');
	await expect(page.getByRole('button', { name: '1팀 1등 기록' })).toBeVisible();
	await expect(chipOf(0)).toHaveText('2명');

	await page.getByRole('button', { name: '2팀 1등 기록' }).click();
	await expect(chipOf(1)).toHaveText('1등');
	await expect(chipOf(0)).toHaveText('미정');
	await expect(page.getByRole('button', { name: '2팀에서 한 명 뽑기' })).toBeVisible();
	await expect(page.getByRole('button', { name: '1팀 2등 기록' })).toBeVisible();
	await expect(page.getByRole('button', { name: '3팀 2등 기록' })).toBeVisible();

	await page.getByRole('button', { name: '3팀 2등 기록' }).click();
	await expect(chipOf(2)).toHaveText('2등');
	await expect(chipOf(0)).toHaveText('3등');
	await expect(page.getByRole('button', { name: '1팀에서 한 명 뽑기' })).toBeVisible();
	await expect(page.locator('.team-card').nth(0)).toHaveAttribute('data-place', 'last');
	await expect(page.locator('.team-card').nth(1)).toHaveAttribute('data-place', 'first');
	await expect(page.locator('.team-card').nth(2)).toHaveAttribute('data-place', 'middle');
	await expect(page.locator('#today-history-list .history-team-label')).toHaveText([
		'1팀 3등',
		'2팀 1등',
		'3팀 2등'
	]);

	const undo = page.getByRole('button', { name: '순위 취소' });
	await undo.click();
	await expect(page.getByRole('button', { name: '1팀 2등 기록' })).toBeVisible();
	await expect(page.getByRole('button', { name: '3팀 2등 기록' })).toBeVisible();
	await expect(chipOf(1)).toHaveText('1등');

	await undo.click();
	await expect(page.getByRole('button', { name: '1팀 1등 기록' })).toBeVisible();
	await expect(page.locator('#history-card')).toBeHidden();
});

test('4팀 기록은 1등만 승리이고 나머지 세 팀은 모두 패배다', async ({ page }) => {
	await openTeamMaker(page);
	await page.evaluate(() => {
		localStorage.setItem(
			'team-maker:v1',
			JSON.stringify({
				version: 2,
				history: [
					{
						id: 'four-teams',
						occurredAt: new Date().toISOString(),
						winnerTeamId: 2,
						ranking: [2],
						teams: [
							{ id: 1, name: '1팀', members: ['가영'], picks: [] },
							{ id: 2, name: '2팀', members: ['나연'], picks: [] },
							{ id: 3, name: '3팀', members: ['다현'], picks: [] },
							{ id: 4, name: '4팀', members: ['라희'], picks: [] }
						]
					}
				]
			})
		);
	});
	await page.reload();
	await page.getByRole('button', { name: '참가자 통계' }).click();
	const rows = await page.locator('#player-stats-rows tr').evaluateAll((items) =>
		Object.fromEntries(
			items.map((row) => {
				const cells = [...row.querySelectorAll('th, td')].map((cell) => cell.textContent.trim());
				return [cells[1], { wins: Number(cells[3]), losses: Number(cells[4]) }];
			})
		)
	);
	expect(rows).toEqual({
		가영: { wins: 0, losses: 1 },
		나연: { wins: 1, losses: 0 },
		다현: { wins: 0, losses: 1 },
		라희: { wins: 0, losses: 1 }
	});
});

test('당첨자를 뺀 나머지에서 다시 뽑고 모두 뽑으면 멈춘다', async ({ page }) => {
	test.setTimeout(90_000);
	await openTeamMaker(page);
	await addParticipants(page, ['가영', '나연', '다현', '라희']);
	await page.getByRole('button', { name: '팀 만들기' }).click();
	const firstTeamMembers = (await readTeams(page))[0].members;
	await page.getByRole('button', { name: '1팀 승리 기록' }).click();

	const picked = page.locator('#picked-groups');
	const wheelDialog = page.getByRole('dialog', { name: '1팀 뽑기' });
	const spinButton = wheelDialog.locator('#spin-wheel-button');

	await page.getByRole('button', { name: '1팀에서 한 명 뽑기' }).click();
	await expect(wheelDialog.locator('.wheel-label')).toHaveCount(2);
	await spinButton.click();
	await expect(spinButton).toHaveText('바로 뽑기');
	await spinButton.click();
	await expect(wheelDialog.locator('.wheel-outcome-name')).toBeVisible();
	await expect(wheelDialog.locator('.wheel-outcome-eyebrow')).toHaveText('1번째 당첨자');
	await expect(wheelDialog.locator('.wheel-outcome-icon')).toHaveAttribute(
		'src',
		/\/confetti\.png$/
	);
	await expect(picked.locator('.picked-row')).toHaveCount(1);
	const singlePickLayout = await picked.evaluate((container) => ({
		containerWidth: container.getBoundingClientRect().width,
		cardWidth: container.querySelector('.picked-person').getBoundingClientRect().width
	}));
	expect(singlePickLayout.cardWidth).toBeLessThan(singlePickLayout.containerWidth * 0.6);
	await expect(wheelDialog.locator('#wheel-side')).toBeVisible();
	await expect(wheelDialog.locator('#wheel-side-title')).toHaveText('누적 당첨자 1명');
	await expect(wheelDialog.locator('.wheel-picked-number')).toHaveText('1');
	await expect(wheelDialog.locator('.wheel-picked-flag')).toHaveText('최근 당첨자');
	await expect(wheelDialog.locator('.wheel-label')).toHaveCount(1, { timeout: 5_000 });
	await expect(spinButton).toHaveText('다음 당첨자 뽑기');

	await spinButton.click();
	await expect(spinButton).toHaveText('바로 뽑기');
	await spinButton.click();
	await expect(picked.locator('.picked-row')).toHaveCount(2);
	await expect(spinButton).toBeDisabled({ timeout: 5_000 });

	const pickedNames = await picked.locator('.picked-name').allTextContents();
	expect(new Set(pickedNames).size).toBe(2);
	for (const name of pickedNames) expect(firstTeamMembers).toContain(name);

	await wheelDialog.getByRole('button', { name: '명단 삭제' }).click();
	await expect(picked.locator('.picked-row')).toHaveCount(0);
	await expect(wheelDialog.locator('.wheel-label')).toHaveCount(2);
	await expect(spinButton).toBeEnabled();
	await expect(spinButton).toHaveText('돌리기');
});

test('오늘 기록을 화면에서만 지우고 전체 기록에는 남긴다', async ({ page }) => {
	await openTeamMaker(page);
	await addParticipants(page, ['가영', '나연', '다현', '라희']);
	await page.getByRole('button', { name: '팀 만들기' }).click();
	await page.getByRole('button', { name: '1팀 승리 기록' }).click();
	await expect(page.locator('#today-history-list .history-team-label')).toHaveText([
		'1팀승',
		'2팀패'
	]);
	await expect(page.locator('#today-history-count')).toHaveText('(1경기)');

	await page.getByRole('button', { name: '초기화' }).click();
	const confirm = page.getByRole('dialog', { name: '오늘 기록을 화면에서 지울까요?' });
	await expect(confirm).toContainText('전체 기록에는 그대로 남습니다.');
	await confirm.getByRole('button', { name: '지우기' }).click();

	await expect(page.locator('#today-history-list li')).toHaveCount(0);
	await expect(page.locator('#today-history-count')).toHaveText('(0경기)');
	await expect(page.locator('#history-card')).toBeVisible();
	await expect(page.locator('#today-history-empty')).toContainText('전체 기록에는 그대로');

	await page.getByRole('button', { name: '전체 기록' }).click();
	const historyDialog = page.getByRole('dialog', { name: '전체 기록' });
	await expect(historyDialog.locator('.history-match')).toHaveCount(1);
	await expect(historyDialog).toContainText('전체 1경기');
	await page.keyboard.press('Escape');

	await page.getByRole('button', { name: '다시 섞기' }).click();
	await page.getByRole('button', { name: '2팀 승리 기록' }).click();
	await expect(page.locator('#today-history-count')).toHaveText('(1경기)');
	await expect(page.locator('#today-history-list li')).toHaveCount(1);
});

test('오늘 기록은 3개를 먼저 보여 주고 펼치면 전체를 보여 준다', async ({ page }) => {
	await openTeamMaker(page);
	await page.evaluate(() => {
		const history = Array.from({ length: 4 }, (_, index) => ({
			id: `match-${index + 1}`,
			occurredAt: new Date(Date.now() - index * 60_000).toISOString(),
			winnerTeamId: 1,
			ranking: [1, 2],
			teams: [
				{ id: 1, name: '1팀', members: ['가영', '나연'], picks: [] },
				{ id: 2, name: '2팀', members: ['다현', '라희'], picks: [] }
			]
		}));
		localStorage.setItem(
			'team-maker:v1',
			JSON.stringify({
				version: 2,
				participants: [],
				rules: [],
				rosters: [],
				mode: 'teams',
				teamCount: 2,
				teamSize: 4,
				history,
				soundEnabled: true,
				todayClearedAt: null
			})
		);
	});
	await page.reload();

	await expect(page.locator('#today-history-count')).toHaveText('(4경기)');
	await expect(page.locator('#today-history-list li')).toHaveCount(3);
	const toggle = page.getByRole('button', { name: '펼치기' });
	await expect(toggle).toBeVisible();
	await toggle.click();
	await expect(page.locator('#today-history-list li')).toHaveCount(4);
	await expect(page.getByRole('button', { name: '접기' })).toHaveAttribute('aria-expanded', 'true');

	await page.getByRole('button', { name: '접기' }).click();
	await expect(page.locator('#today-history-list li')).toHaveCount(3);
});

test('참가자 통계는 오늘만 세고 전체 기록은 1등 확률을 최대 소수점1자리로 보여준다', async ({
	page
}) => {
	await openTeamMaker(page);
	await page.evaluate(() => {
		const day = 24 * 60 * 60 * 1000;
		const match = (id, occurredAt, picks) => ({
			id,
			occurredAt,
			winnerTeamId: 1,
			ranking: [1, 2],
			teams: [
				{ id: 1, name: '1팀', members: ['가영', '나연'], picks },
				{ id: 2, name: '2팀', members: ['다현', '라희'], picks: [] }
			]
		});
		const history = [
			match('match-1', new Date(Date.now() - 60_000).toISOString(), ['가영']),
			match('match-2', new Date(Date.now() - 120_000).toISOString(), []),
			match('match-3', new Date(Date.now() - 2 * day).toISOString(), [])
		];
		localStorage.setItem('team-maker:v1', JSON.stringify({ version: 2, history }));
	});
	await page.reload();

	await page.getByRole('button', { name: '참가자 통계' }).click();
	const dialog = page.getByRole('dialog', { name: '참가자 통계' });
	await expect(dialog).toBeVisible();
	// 이틀 전 경기는 빠지고 오늘 두 경기만 센다.
	await expect(dialog).toContainText('오늘 2경기');
	await expect(dialog.locator('.stats-leader').nth(0)).toContainText('최다 승리');
	await expect(dialog.locator('.stats-leader').nth(0)).toContainText('2승');
	await expect(dialog.locator('.stats-leader').nth(1)).toContainText('최다 당첨');
	await expect(dialog.locator('.stats-leader').nth(1)).toContainText('가영');
	await expect(dialog.locator('.stats-leader').nth(2)).toContainText('최다 패배');
	await expect(dialog.locator('.stats-leader').nth(2)).toContainText('2패');
	await expect(dialog.locator('.stats-pair').first()).toContainText('가영 + 나연');
	await expect(dialog.locator('.stats-pair').first()).toContainText('2승 0패');
	await expect(dialog.locator('.stats-pair').first()).toContainText('100%');
	await expect(dialog.locator('.stats-pair').first()).toHaveAttribute(
		'aria-label',
		/같은 팀 2번 중 2번 승리/
	);
	await expect(dialog.locator('#player-stats-rows tr')).toHaveCount(4);
	await page.keyboard.press('Escape');
	await expect(dialog).not.toBeVisible();

	await page.getByRole('button', { name: '전체 기록' }).click();
	const historyDialog = page.getByRole('dialog', { name: '전체 기록' });
	await historyDialog.getByRole('tab', { name: '전체 통계' }).click();
	const overview = historyDialog.locator('#history-overview');
	await expect(overview).toBeVisible();
	await expect(overview.locator('.overview-fact').nth(0)).toContainText('3경기');
	await expect(overview.locator('.overview-fact').nth(1)).toContainText('2일');
	await expect(overview.locator('.overview-fact').nth(2)).toContainText('4명');
	await expect(overview.locator('.podium-card')).toHaveCount(3);
	await expect(overview.locator('#history-overview-ranking tr')).toHaveCount(1);
	await expect(overview.locator('.podium-card').first()).toContainText('가영');
	await expect(overview.locator('.podium-card').first()).toContainText('3승 0패 · 100%');
	await expect(overview.locator('#history-overview-ranking tr')).toContainText('0승 3패');
	await expect(overview).toContainText(
		'막대와 백분율은 1등 확률입니다. 3팀 이상 경기에서는 2등부터 모두 패로 셉니다.'
	);
	await expect(overview).not.toContainText('승률');

	await overview.getByRole('button', { name: '승리순' }).click();
	await expect(overview.getByRole('menuitemradio', { name: /경기수순/ })).toHaveCount(0);
	await overview.getByRole('menuitemradio', { name: /1등 확률순/ }).click();
	await expect(overview.getByRole('button', { name: '1등 확률순' })).toBeVisible();
	await overview.getByRole('searchbox', { name: '참가자 검색' }).fill('라희');
	await expect(overview.locator('#history-overview-ranking tr')).toContainText('라희');

	await historyDialog.getByRole('button', { name: '닫기' }).click();
	await expect(historyDialog).not.toBeVisible();
});

test('1등 확률순은 유효한 1등이 있는 참가 경기만 계산해 정렬한다', async ({ page }) => {
	await openTeamMaker(page);
	await page.evaluate(() => {
		const occurredAt = new Date().toISOString();
		const match = (id, winner, loser) => ({
			id,
			occurredAt,
			winnerTeamId: 1,
			ranking: [1, 2],
			teams: [
				{ id: 1, name: '1팀', members: [winner], picks: [] },
				{ id: 2, name: '2팀', members: [loser], picks: [] }
			]
		});
		const history = [
			match('valid-1', '가영', '나연'),
			match('valid-2', '나연', '다현'),
			match('valid-3', '나연', '다현'),
			{
				id: 'invalid',
				occurredAt,
				winnerTeamId: 9,
				ranking: [9],
				teams: [
					{ id: 1, name: '1팀', members: ['가영'], picks: [] },
					{ id: 2, name: '2팀', members: ['라희'], picks: [] }
				]
			}
		];
		localStorage.setItem('team-maker:v1', JSON.stringify({ version: 2, history }));
	});
	await page.reload();

	await page.getByRole('button', { name: '전체 기록' }).click();
	const dialog = page.getByRole('dialog', { name: '전체 기록' });
	await dialog.getByRole('tab', { name: '전체 통계' }).click();
	const overview = dialog.locator('#history-overview');
	await overview.getByRole('button', { name: '승리순' }).click();
	await overview.getByRole('menuitemradio', { name: /1등 확률순/ }).click();

	await expect(overview.locator('.podium-card').first()).toContainText('가영');
	await expect(overview.locator('.podium-card').first()).toContainText('1승 0패 · 100%');
});
