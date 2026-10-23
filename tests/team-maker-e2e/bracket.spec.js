import { expect, test } from '@playwright/test';
import { stubAdsense } from './helpers/adsense.js';

const BRACKET_PATH = '/bracket';
const STORAGE_KEY = 'lake.bracket.v1';
const IMPORT_KEY = 'lake.bracket.import.v1';
const SIX_TEAMS = ['호랑이', '늑대', '여우', '독수리', '상어', '곰'];
const browserErrors = new WeakMap();

test.beforeEach(async ({ page }) => {
	await stubAdsense(page);
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

async function openBracket(page) {
	await page.goto(BRACKET_PATH);
	await expect(page.getByRole('heading', { name: '대진표 만들기', level: 1 })).toBeVisible();
	expect(new URL(page.url()).pathname).toBe(BRACKET_PATH);
	// 화면이 저장 값을 복원한 뒤에 조작한다.
	await expect(page.locator('.bracket-setup[data-ready]')).toBeVisible();
}

async function replaceTeams(page, names) {
	await page.getByRole('button', { name: '일괄 추가' }).click();
	const dialog = page.getByRole('dialog', { name: '여러 팀 한 번에 추가' });
	await dialog.getByRole('textbox', { name: '팀 이름' }).fill(names.join('\n'));
	await dialog.getByRole('radio', { name: '지금 목록을 바꾸기' }).check();
	await dialog.getByRole('button', { name: '추가하기' }).click();
	await expect(dialog).toBeHidden();
	await expect(page.locator('.bracket-team-list > li')).toHaveCount(names.length);
}

async function buildBracket(page) {
	await page
		.locator('.bracket-panel')
		.getByRole('button', { name: /대진표 (다시 )?만들기/ })
		.click();
	await expect(page.locator('.bracket-scroller .bracket-match').first()).toBeVisible();
}

const board = (page) => page.locator('.bracket-scroller');
const pickButton = (page, round, game, name) =>
	board(page).getByRole('button', { name: `${round} ${game}경기, ${name}을(를) 승자로 정하기` });

async function savedState(page) {
	return page.evaluate((key) => JSON.parse(localStorage.getItem(key)), STORAGE_KEY);
}

async function expectNoHorizontalOverflow(page) {
	const size = await page.evaluate(() => ({
		viewport: window.innerWidth,
		document: document.documentElement.scrollWidth
	}));
	expect(size.document).toBeLessThanOrEqual(size.viewport + 1);
}

function pdfPages(buffer) {
	const text = buffer.toString('latin1');
	const boxes = [...text.matchAll(/\/MediaBox\s*\[\s*0 0 ([\d.]+) ([\d.]+)\s*\]/g)];
	return {
		count: (text.match(/\/Type\s*\/Page[^s]/g) ?? []).length,
		landscape: boxes.every(([, width, height]) => Number(width) > Number(height))
	};
}

test('6팀 대진표는 4강에서만 부전승을 두고 우승까지 기록한 뒤 새로고침해도 복원한다', async ({
	page
}) => {
	await openBracket(page);
	await replaceTeams(page, SIX_TEAMS);
	await expect(page.locator('.bracket-summary')).toHaveText(
		'6팀 · 라운드 3개 · 부전승 1개 · 경기 5개'
	);
	await page.getByRole('textbox', { name: '대진표 제목 (선택)' }).fill('10월 사내 풋살 대회');
	await buildBracket(page);

	const status = page.locator('#bracket-board .bracket-status');
	await expect(page.locator('#bracket-board .bracket-board-name')).toHaveText(
		'10월 사내 풋살 대회'
	);
	await expect(status).toHaveText('경기 5개 중 0개 끝남 · 다음 경기: 8강 1경기');
	const band = page.locator('#bracket-board .bracket-progress');
	await expect(band).toContainText('전체 경기(0/5) · 8강 진행 중');
	await expect(band.locator('.bracket-progress-percent')).toHaveText('0%');
	await expect(band).toContainText('다음 경기 · 8강 1경기(0/3)');
	await expect(band).toContainText('호랑이 vs 곰');
	// 8강은 6팀이 모두 경기하고, 이긴 3팀 중 8강 1경기 승자가 4강에서 부전승을 받는다.
	await expect(board(page).locator('.bracket-match-bye')).toHaveCount(1);
	await expect(board(page).locator('[data-match="r0m0"]')).toContainText('호랑이');
	await expect(board(page).locator('[data-match="r0m0"]')).toContainText('곰');
	await expect(board(page).locator('[data-match="r1m0"]')).toContainText('부전승');

	await pickButton(page, '8강', 1, '호랑이').click();
	await expect(pickButton(page, '8강', 1, '호랑이')).toHaveAttribute('aria-pressed', 'true');
	await expect(board(page).locator('[data-match="r1m0"]')).toContainText('호랑이');
	await expect(status).toHaveText('경기 5개 중 1개 끝남 · 다음 경기: 8강 2경기');
	await expect(band).toContainText('전체 경기(1/5) · 8강 진행 중');
	await expect(band.locator('.bracket-progress-percent')).toHaveText('20%');
	await expect(band).toContainText('다음 경기 · 8강 2경기(1/3)');
	// 경기로 이동은 스크롤하지 않고 다음 경기 카드의 첫 팀 버튼에 포커스만 둔다.
	const move = band.getByRole('button', { name: '다음 경기 8강 2경기로 이동' });
	await move.scrollIntoViewIfNeeded();
	// 앞 동작의 부드러운 스크롤이 끝난 뒤 위치를 기록한다.
	let scrollBefore = -1;
	await expect
		.poll(async () => {
			const current = await page.evaluate(() => scrollY);
			const settled = current === scrollBefore;
			scrollBefore = current;
			return settled;
		})
		.toBe(true);
	await move.click();
	await expect(board(page).locator('[data-match="r0m1"] button').first()).toBeFocused();
	await expect(board(page).locator('[data-match="r0m1"]')).toHaveClass(/bracket-match-focus/);
	expect(await page.evaluate(() => scrollY)).toBe(scrollBefore);
	await pickButton(page, '8강', 2, '상어').click();
	await pickButton(page, '8강', 3, '독수리').click();
	await pickButton(page, '4강', 1, '상어').click();
	await pickButton(page, '결승', 1, '상어').click();
	await expect(status).toHaveText('우승: 상어');
	await expect(board(page).locator('.bracket-champion')).toContainText('상어');
	await expect(band).toContainText('전체 경기(5/5) · 모든 경기 끝남');
	await expect(band.locator('.bracket-progress-percent')).toHaveText('100%');
	await expect(band.locator('.bracket-progress-side .bracket-progress-title')).toHaveText('우승');
	await expect(band.locator('.bracket-progress-champion')).toHaveText('상어');
	await expect(page.locator('#bracket-board .bracket-board-hint')).toHaveCount(0);

	// 다시 누르면 그 경기 결과만 취소된다.
	await pickButton(page, '결승', 1, '상어').click();
	await expect(status).toHaveText('경기 5개 중 4개 끝남 · 다음 경기: 결승 1경기');
	await pickButton(page, '결승', 1, '호랑이').click();
	await expect(status).toHaveText('우승: 호랑이');

	await page.waitForTimeout(300);
	await page.reload();
	await expect(page.locator('#bracket-board .bracket-status')).toHaveText('우승: 호랑이');
	await expect(page.locator('.bracket-team-list input')).toHaveCount(6);
	await expect(page.locator('#bracket-board .bracket-board-name')).toHaveText(
		'10월 사내 풋살 대회'
	);
});

test('5팀은 8강과 4강에서 1팀씩 부전승을 받는다', async ({ page }) => {
	await openBracket(page);
	await replaceTeams(page, SIX_TEAMS.slice(0, 5));
	await expect(page.locator('.bracket-summary')).toHaveText(
		'5팀 · 라운드 3개 · 부전승 2개 · 경기 4개'
	);
	await buildBracket(page);
	await expect(board(page).locator('.bracket-match-bye')).toHaveCount(2);
	await expect(board(page).locator('[data-match="r0m1"]')).toContainText('늑대');
	await expect(board(page).locator('[data-match="r0m1"]')).toContainText('부전승');
	await expect(board(page).locator('[data-match="r1m0"]')).toContainText('부전승');
});

test('팀을 입력칸으로 추가하고 손잡이로 순서를 바꾸며 목록을 비운다', async ({ page }) => {
	await openBracket(page);
	await expect(page.locator('.bracket-team-list > li')).toHaveCount(0);
	const input = page.getByRole('textbox', { name: '새 팀 이름' });
	await input.fill('호랑이, 늑대,여우');
	await input.press('Enter');
	await expect(input).toHaveValue('');
	await expect(input).toBeFocused();
	await input.fill('독수리');
	await page.getByRole('button', { name: '추가', exact: true }).click();
	const names = () =>
		page
			.locator('.bracket-team-list input')
			.evaluateAll((inputs) => inputs.map((item) => item.value));
	expect(await names()).toEqual(['호랑이', '늑대', '여우', '독수리']);
	// 추가 버튼을 눌러도 바로 다음 팀을 입력할 수 있다.
	await expect(input).toBeFocused();
	await expect(page.locator('.bracket-team-count')).toHaveText('(4/32팀)');

	// 이미 있는 이름은 추가하지 않고 이유를 보여 준다.
	await input.fill('곰, 늑대');
	await input.press('Enter');
	await expect(input).toHaveAccessibleDescription(/같은 이름의 팀이 있어요: 늑대/);
	await expect(input).toHaveValue('곰, 늑대');
	await input.fill('');

	// 키보드: 손잡이에서 화살표 키로 옮기고 포커스는 손잡이에 남는다.
	const handle = page.getByRole('button', { name: /^여우 순서 바꾸기/ });
	await handle.focus();
	await page.keyboard.press('ArrowUp');
	await page.keyboard.press('ArrowUp');
	expect(await names()).toEqual(['여우', '호랑이', '늑대', '독수리']);
	await expect(page.getByRole('button', { name: /^여우 순서 바꾸기/ })).toBeFocused();
	await expect(page.locator('.bracket-sr-only[role="status"]')).toHaveText(
		'여우을(를) 1번으로 옮겼어요.'
	);
	await page.keyboard.press('End');
	expect(await names()).toEqual(['호랑이', '늑대', '독수리', '여우']);

	// 끌기: 4번 손잡이를 첫 행 위로 옮긴다.
	await buildBracket(page);
	// 대진표를 만들면 대진표 위치로 스크롤되므로 목록을 다시 화면에 둔다.
	await page.locator('.bracket-team-list').scrollIntoViewIfNeeded();
	const from = await page.getByRole('button', { name: /^여우 순서 바꾸기/ }).boundingBox();
	const first = await page.locator('.bracket-team-row').first().boundingBox();
	await page.mouse.move(from.x + from.width / 2, from.y + from.height / 2);
	await page.mouse.down();
	await page.mouse.move(from.x + from.width / 2, first.y + 4, { steps: 12 });
	await page.mouse.up();
	expect(await names()).toEqual(['여우', '호랑이', '늑대', '독수리']);
	await expect(
		page.getByText('팀 목록이 바뀌었어요. 다시 만들면 대진표에 반영돼요.')
	).toBeVisible();
	await page.waitForTimeout(300);
	expect((await savedState(page)).teams.map((team) => team.name)).toEqual([
		'여우',
		'호랑이',
		'늑대',
		'독수리'
	]);

	// 목록 비우기는 확인하고 만든 대진표는 남긴다.
	await page.getByRole('button', { name: '팀 목록 비우기' }).click();
	const dialog = page.getByRole('dialog', { name: '팀 목록을 비울까요?' });
	await expect(dialog).toContainText('팀 4개를 목록에서 지워요.');
	await dialog.getByRole('button', { name: '목록 비우기' }).click();
	await expect(page.locator('.bracket-team-list > li')).toHaveCount(0);
	await expect(page.getByRole('button', { name: '팀 목록 비우기' })).toBeDisabled();
	await expect(board(page)).toContainText('호랑이');
});

test('32팀이면 팀 목록은 일정 높이까지만 보이고 안에서 스크롤하며 끌어서 끝까지 옮긴다', async ({
	page
}) => {
	await openBracket(page);
	const input = page.getByRole('textbox', { name: '새 팀 이름' });
	const names = Array.from({ length: 32 }, (_, index) => `팀${index + 1}`);
	await input.fill(names.join(', '));
	await input.press('Enter');
	const list = page.locator('.bracket-team-list');
	await expect(list.locator('> li')).toHaveCount(32);
	const size = await list.evaluate((element) => ({
		client: element.clientHeight,
		scroll: element.scrollHeight,
		top: element.scrollTop
	}));
	expect(size.client).toBeLessThanOrEqual(488);
	expect(size.scroll).toBeGreaterThan(size.client);
	// 방금 넣은 마지막 팀이 보이도록 맨 아래로 내려가 있다.
	expect(size.top + size.client).toBeGreaterThanOrEqual(size.scroll - 1);
	await expect(page.getByRole('textbox', { name: '32번 팀 이름' })).toBeInViewport();
	await expect(input).toBeInViewport();

	const namesNow = () =>
		page
			.locator('.bracket-team-list input')
			.evaluateAll((inputs) => inputs.map((item) => item.value));
	// 맨 위로 올린 뒤 1번 팀을 목록 아래 가장자리로 끌고 있으면 자동으로 스크롤하며 내려간다.
	await list.evaluate((element) => element.scrollTo({ top: 0 }));
	const handle = await page.getByRole('button', { name: /^팀1 순서 바꾸기/ }).boundingBox();
	const box = await list.boundingBox();
	await page.mouse.move(handle.x + handle.width / 2, handle.y + handle.height / 2);
	await page.mouse.down();
	await page.mouse.move(handle.x + handle.width / 2, box.y + box.height - 8, { steps: 10 });
	await expect
		.poll(() => list.evaluate((element) => element.scrollTop), { timeout: 5000 })
		.toBeGreaterThan(400);
	// 자동 스크롤은 화면 갱신마다 진행되므로 고정 시간 대신 실제 도착 위치를 기다린다.
	await expect
		.poll(async () => (await namesNow()).indexOf('팀1'), { timeout: 5000 })
		.toBeGreaterThanOrEqual(28);
	await page.mouse.up();
	expect((await namesNow()).indexOf('팀1')).toBeGreaterThanOrEqual(28);
});

test('앞 경기 승자를 바꾸면 확인한 뒤 이어진 결과만 지운다', async ({ page }) => {
	await openBracket(page);
	await replaceTeams(page, SIX_TEAMS);
	await buildBracket(page);
	await pickButton(page, '8강', 1, '호랑이').click();
	await pickButton(page, '8강', 2, '상어').click();
	await pickButton(page, '8강', 3, '독수리').click();
	await pickButton(page, '4강', 1, '상어').click();
	await pickButton(page, '결승', 1, '상어').click();

	const opener = pickButton(page, '8강', 2, '늑대');
	await opener.click();
	const dialog = page.getByRole('dialog', { name: '승자를 바꿀까요?' });
	await expect(dialog).toContainText('8강 2경기 결과를 바꾸면 이후 경기 2개의 결과가 지워져요.');
	await dialog.getByRole('button', { name: '그대로 두기' }).click();
	await expect(dialog).toBeHidden();
	await expect(opener).toBeFocused();
	await expect(page.locator('#bracket-board .bracket-status')).toHaveText('우승: 상어');

	await opener.click();
	await dialog.getByRole('button', { name: '바꾸기' }).click();
	await expect(pickButton(page, '8강', 2, '늑대')).toHaveAttribute('aria-pressed', 'true');
	// 다른 갈래의 8강 결과와 부전승 진출은 남는다.
	await expect(pickButton(page, '8강', 3, '독수리')).toHaveAttribute('aria-pressed', 'true');
	await expect(board(page).locator('[data-match="r1m0"]')).toContainText('호랑이');
	await expect(page.locator('#bracket-board .bracket-status')).toHaveText(
		'경기 5개 중 3개 끝남 · 다음 경기: 4강 1경기'
	);
});

test('팀 목록을 바꾸면 다시 만들기를 안내하고 기록이 있으면 확인한다', async ({ page }) => {
	await openBracket(page);
	await replaceTeams(page, SIX_TEAMS);
	await buildBracket(page);
	await pickButton(page, '8강', 1, '호랑이').click();

	await page.getByRole('textbox', { name: '6번 팀 이름' }).fill('판다');
	await expect(
		page.getByText('팀 목록이 바뀌었어요. 다시 만들면 대진표에 반영돼요.')
	).toBeVisible();
	// 대진표는 만든 시점의 팀 이름을 유지한다.
	await expect(board(page)).toContainText('곰');

	await page.locator('.bracket-panel').getByRole('button', { name: '대진표 다시 만들기' }).click();
	const dialog = page.getByRole('dialog', { name: '대진표를 다시 만들까요?' });
	await expect(dialog).toContainText('기록한 경기 결과 1개가 지워져요.');
	await dialog.getByRole('button', { name: '다시 만들기' }).click();
	await expect(board(page)).toContainText('판다');
	await expect(page.locator('#bracket-board .bracket-status')).toHaveText(
		'경기 5개 중 0개 끝남 · 다음 경기: 8강 1경기'
	);

	await page.getByRole('textbox', { name: '1번 팀 이름' }).fill('늑대');
	await expect(page.getByText('같은 이름의 팀이 있어요.').first()).toBeVisible();
	await expect(
		page.locator('.bracket-panel').getByRole('button', { name: /대진표/ })
	).toBeDisabled();
});

test('팀 메이커 결과를 대진표로 가져오고 팀 메이커 기록은 바꾸지 않는다', async ({ page }) => {
	await page.goto('/team-maker');
	await page.getByRole('button', { name: '일괄 추가' }).click();
	const bulk = page.getByRole('dialog', { name: '참가자 일괄 추가' });
	await bulk
		.getByRole('textbox', { name: '추가할 참가자 이름' })
		.fill(['가영', '나연', '다현', '라희', '마루', '바다'].join('\n'));
	await bulk.getByRole('button', { name: '명단에 6명 추가' }).click();
	await page.getByRole('button', { name: '값 늘리기' }).click();
	await expect(page.locator('#split-value')).toHaveText('3');
	await page.getByRole('button', { name: '팀 만들기' }).click();
	await expect(page.locator('#team-grid .team-card')).toHaveCount(3);
	const before = await page.evaluate(() => localStorage.getItem('team-maker:v1'));

	await page.getByRole('button', { name: '대진표 만들기' }).click();
	await expect(page).toHaveURL(/\/bracket$/);
	await expect(page.locator('.bracket-notice')).toHaveText(
		'팀 메이커에서 팀 3개를 가져와 대진표를 만들었어요.'
	);
	await expect(page.locator('.bracket-team-list > li')).toHaveCount(3);
	await expect(page.locator('.bracket-team-members')).toHaveCount(3);
	await expect(board(page).locator('.bracket-side-members').first()).toBeVisible();
	await expect(page.locator('#bracket-board .bracket-status')).toHaveText(
		'경기 2개 중 0개 끝남 · 다음 경기: 4강 1경기'
	);
	expect(await page.evaluate((key) => localStorage.getItem(key), IMPORT_KEY)).toBeNull();
	expect(await page.evaluate(() => localStorage.getItem('team-maker:v1'))).toBe(before);

	// 팀 이름을 바꿔도 팀원은 그대로 둔다.
	const members = await page.locator('.bracket-team-members').first().textContent();
	await page.getByRole('textbox', { name: '1번 팀 이름' }).fill('A팀');
	await expect(page.locator('.bracket-team-members').first()).toHaveText(members);

	// 임시 키는 한 번만 처리한다.
	await page.reload();
	await expect(page.locator('.bracket-notice')).toHaveCount(0);
});

test('진행 중인 대진표가 있으면 가져오기 전에 묻고 거절하면 기존 대진표를 유지한다', async ({
	page
}) => {
	await openBracket(page);
	await replaceTeams(page, SIX_TEAMS);
	await buildBracket(page);
	await pickButton(page, '8강', 1, '호랑이').click();
	await page.waitForTimeout(300);
	const importTeams = (names) =>
		page.evaluate(
			({ key, names }) =>
				localStorage.setItem(
					key,
					JSON.stringify({ version: 1, teams: names.map((name) => ({ name, members: ['가영'] })) })
				),
			{ key: IMPORT_KEY, names }
		);

	await importTeams(['1팀', '2팀']);
	await page.reload();
	const dialog = page.getByRole('dialog', { name: '진행 중인 대진표가 있어요' });
	await expect(dialog).toContainText('가져온 팀 2개로 바꾸면 기록한 경기 결과 1개가 지워져요.');
	await page.keyboard.press('Escape');
	await expect(dialog).toBeHidden();
	await expect(page.locator('.bracket-team-list > li')).toHaveCount(6);
	expect(await page.evaluate((key) => localStorage.getItem(key), IMPORT_KEY)).toBeNull();

	await importTeams(['1팀', '2팀']);
	await page.reload();
	await dialog.getByRole('button', { name: '가져온 팀으로 바꾸기' }).click();
	await expect(page.locator('.bracket-team-list > li')).toHaveCount(2);
	await expect(page.locator('#bracket-board .bracket-status')).toHaveText(
		'경기 1개 중 0개 끝남 · 다음 경기: 결승 1경기'
	);

	await importTeams(['혼자']);
	await page.reload();
	await expect(page.locator('.bracket-notice')).toHaveText(
		'대진표는 2~32팀만 만들 수 있어요. 가져온 팀은 1개예요.'
	);
	await expect(page.locator('.bracket-team-list > li')).toHaveCount(2);
});

test('팀 메이커의 17팀 결과는 넓은 화면에서 좌우 대칭 대진표로 만든다', async ({ page }) => {
	await page.setViewportSize({ width: 1440, height: 900 });
	await page.goto('/team-maker');
	const names = Array.from({ length: 17 }, (_, index) => `참가${index + 1}`);
	await page.getByRole('button', { name: '일괄 추가' }).click();
	const bulk = page.getByRole('dialog', { name: '참가자 일괄 추가' });
	await bulk.getByRole('textbox', { name: '추가할 참가자 이름' }).fill(names.join('\n'));
	await bulk.getByRole('button', { name: '명단에 17명 추가' }).click();
	const increase = page.getByRole('button', { name: '값 늘리기' });
	while ((await page.locator('#split-value').textContent()) !== '17') await increase.click();
	await page.getByRole('button', { name: '팀 만들기' }).click();
	await expect(page.locator('#team-grid .team-card')).toHaveCount(17);

	await page.getByRole('button', { name: '대진표 만들기' }).click();
	await expect(page).toHaveURL(/\/bracket$/);
	await expect(page.locator('.bracket-team-list > li')).toHaveCount(17);
	const view = board(page).locator('.bracket-view');
	await expect(view).toHaveClass(/bracket-view-mirror/);
	await expect(board(page).locator('.bracket-round-label')).toHaveText([
		'32강',
		'16강',
		'8강',
		'4강',
		'결승',
		'4강',
		'8강',
		'16강',
		'32강'
	]);
	// 대진표를 만든 직후 페이지가 스크롤되므로 모든 위치를 한 번에 대진표 기준으로 잰다.
	const place = await view.evaluate((element) => {
		const origin = element.getBoundingClientRect();
		const rect = (selector) => {
			const box = element.querySelector(selector).getBoundingClientRect();
			return {
				x: box.x - origin.x,
				top: box.top - origin.top,
				bottom: box.bottom - origin.top,
				width: box.width
			};
		};
		return {
			width: origin.width,
			final: rect('[data-match="r4m0"]'),
			champion: rect('.bracket-champion'),
			semis: [rect('[data-match="r3m0"]'), rect('[data-match="r3m1"]')]
		};
	});
	// 결승은 가운데 열에 있고 우승 카드는 그 위에 있다.
	expect(Math.abs(place.final.x + place.final.width / 2 - place.width / 2)).toBeLessThan(1);
	expect(place.champion.x).toBeCloseTo(place.final.x, 0);
	expect(place.champion.bottom).toBeLessThan(place.final.top);
	// 양쪽 팀 수가 달라도 두 준결승은 결승과 같은 높이에 있다.
	for (const semi of place.semis) expect(semi.top).toBeCloseTo(place.final.top, 0);
	await expectNoHorizontalOverflow(page);

	// 좁은 화면은 라운드 탭으로 넘기므로 한 방향 배치로 돌아간다.
	await page.setViewportSize({ width: 390, height: 844 });
	await expect(view).not.toHaveClass(/bracket-view-mirror/);
	await expect(board(page).locator('.bracket-round-label')).toHaveCount(6);
});

for (const count of [8, 16, 32]) {
	test(`FHD 화면에서 ${count}팀 대진표 섹션은 스크롤 없이 창 안에 들어온다`, async ({ page }) => {
		await page.setViewportSize({ width: 1920, height: 953 });
		await openBracket(page);
		await replaceTeams(
			page,
			Array.from({ length: count }, (_, index) => `${index + 1}번 팀`)
		);
		await buildBracket(page);
		await expect
			.poll(() =>
				page.evaluate(() => {
					const section = document.querySelector('#bracket-board');
					const scroller = section.querySelector('.bracket-scroller');
					return (
						section.getBoundingClientRect().height <= innerHeight &&
						scroller.scrollWidth <= scroller.clientWidth
					);
				})
			)
			.toBe(true);
		// 70% 미만으로 줄어드는 32팀만 글자 위주 카드가 된다.
		const textFirst = expect(board(page).locator('.bracket-view'));
		if (count === 32) await textFirst.toHaveClass(/bracket-view-text-first/);
		else await textFirst.not.toHaveClass(/bracket-view-text-first/);
		// 줄여도 팀을 눌러 승자를 기록할 수 있다.
		await pickButton(page, `${count}강`, 1, '1번 팀').click();
		await expect(pickButton(page, `${count}강`, 1, '1번 팀')).toHaveAttribute(
			'aria-pressed',
			'true'
		);
	});
}

test('넓은 화면에서 대진표를 확대·축소하고 화면 맞춤으로 되돌린다', async ({ page }) => {
	await page.setViewportSize({ width: 1920, height: 953 });
	await openBracket(page);
	await replaceTeams(
		page,
		Array.from({ length: 16 }, (_, index) => `${index + 1}번 팀`)
	);
	await buildBracket(page);
	const value = page.locator('#bracket-board .bracket-zoom-value');
	const view = board(page).locator('.bracket-view');
	const fit = page.getByRole('button', { name: '화면 맞춤' });
	// 창 크기에 맞춘 배율은 읽지 않고, 버튼으로 바꿀 때만 화면 낭독기에 알린다.
	const message = page.locator('.bracket-zoom [aria-live]');
	await expect(value).not.toHaveAttribute('aria-live');
	await expect(value).toHaveText('81%');
	await expect(message).toHaveText('');
	await expect(fit).toBeDisabled();
	await page.getByRole('button', { name: '대진표 확대' }).click();
	await expect(value).toHaveText('100%');
	await expect(message).toHaveText('대진표 크기 100%');
	await expect(view).not.toHaveAttribute('style', /zoom/);
	await page.getByRole('button', { name: '대진표 확대' }).click();
	await expect(value).toHaveText('125%');
	await expect(view).toHaveAttribute('style', /zoom: 1\.25/);
	// 창보다 커지면 대진표 영역 안에서 가로로 스크롤한다.
	expect(await board(page).evaluate((element) => element.scrollWidth > element.clientWidth)).toBe(
		true
	);
	// 125% → 100% → 80% → 67% → 50%
	for (let step = 0; step < 4; step++) {
		await page.getByRole('button', { name: '대진표 축소' }).click();
	}
	await expect(value).toHaveText('50%');
	await expect(page.getByRole('button', { name: '대진표 축소' })).toBeDisabled();
	await fit.click();
	await expect(value).toHaveText('81%');
	await expect(message).toHaveText('대진표 크기 화면 맞춤 81%');

	// 직접 고른 배율은 배치가 다른 대진표를 만들면 화면 맞춤으로 돌아간다.
	await page.getByRole('button', { name: '대진표 확대' }).click();
	await page.getByRole('button', { name: '대진표 확대' }).click();
	await expect(value).toHaveText('125%');
	await replaceTeams(page, SIX_TEAMS);
	await buildBracket(page);
	await expect(value).toHaveText('100%');
	await expect(fit).toBeDisabled();
});

test('저장된 대진표가 손상되면 알리고 계속 사용할 수 있다', async ({ page }) => {
	// 대진표 화면은 떠날 때 저장하므로 다른 화면에서 손상된 값을 넣는다.
	await page.goto('/about');
	await page.evaluate((key) => localStorage.setItem(key, '{broken'), STORAGE_KEY);
	await page.goto(BRACKET_PATH);
	await expect(page.locator('.bracket-notice')).toHaveText(
		'저장된 대진표를 읽지 못해 새로 시작해요.'
	);
	await expect(page.locator('.bracket-team-list > li')).toHaveCount(0);
	await page.getByRole('textbox', { name: '새 팀 이름' }).fill('곰, 여우, 늑대, 상어');
	await page.getByRole('textbox', { name: '새 팀 이름' }).press('Enter');
	await buildBracket(page);
	await page.waitForTimeout(300);
	expect((await savedState(page)).bracket.slots).toHaveLength(4);
});

test('대진표만 손상되면 팀 목록은 남기고 대진표만 지웠다고 알린다', async ({ page }) => {
	await page.goto('/about');
	await page.evaluate(
		(key) =>
			localStorage.setItem(
				key,
				JSON.stringify({
					version: 1,
					title: '',
					order: 'input',
					teams: [
						{ id: 'a', name: '곰', members: [] },
						{ id: 'b', name: '여우', members: [] }
					],
					bracket: { teams: 'broken' }
				})
			),
		STORAGE_KEY
	);
	await openBracket(page);
	await expect(page.locator('.bracket-notice')).toHaveText(
		'저장된 대진표를 읽지 못해 지웠어요. 팀 목록은 그대로예요.'
	);
	await expect(page.locator('.bracket-team-list > li')).toHaveCount(2);
	await expect(page.locator('.bracket-scroller')).toHaveCount(0);
});

test('브라우저가 저장 공간을 막아도 알리고 대진표를 만들 수 있다', async ({ page }) => {
	await page.addInitScript(() => {
		Object.defineProperty(window, 'localStorage', {
			configurable: true,
			get() {
				throw new DOMException('저장 공간 차단', 'SecurityError');
			}
		});
	});
	await openBracket(page);
	await expect(page.locator('.bracket-notice')).toHaveText(
		'브라우저 저장 공간을 읽지 못했어요. 저장 없이 사용할 수 있어요.'
	);
	await replaceTeams(page, SIX_TEAMS);
	await buildBracket(page);
	await board(page).locator('[data-match="r0m0"] button.bracket-side').first().click();
	await expect(board(page).locator('button[aria-pressed="true"]')).toHaveCount(1);
	await expect(page.locator('.bracket-notice')).toHaveText(
		'브라우저에 저장하지 못했어요. 화면을 닫으면 대진표가 사라질 수 있어요.'
	);
});

test('저장 대기 중 다른 화면으로 이동해도 마지막 변경을 저장한다', async ({ page }) => {
	await openBracket(page);
	await replaceTeams(page, SIX_TEAMS);
	await buildBracket(page);
	await page.waitForTimeout(300);
	await page.evaluate(() => {
		document.querySelector('.bracket-scroller [data-match="r0m1"] button.bracket-side').click();
		document.querySelector('a[href="/"]').click();
	});
	await expect(page).toHaveURL(/\/$/);
	const saved = await savedState(page);
	expect(saved.bracket.winners).toEqual({ r0m1: saved.bracket.teams[1].id });
});

test('390px 화면에서 가로로 넘치지 않고 라운드 탭으로 이동한다', async ({ page }) => {
	await page.setViewportSize({ width: 390, height: 844 });
	await openBracket(page);
	await replaceTeams(page, SIX_TEAMS);
	await buildBracket(page);
	await expectNoHorizontalOverflow(page);

	const tabs = page.getByRole('group', { name: '라운드로 이동' });
	await expect(tabs.getByRole('button', { name: '8강' })).toHaveAttribute('aria-current', 'true');
	await tabs.getByRole('button', { name: '결승' }).click();
	await expect(tabs.getByRole('button', { name: '결승' })).toHaveAttribute('aria-current', 'true');
	await expect(board(page).locator('[data-column="2"]')).toBeInViewport();
	await expectNoHorizontalOverflow(page);

	// 다음 경기가 다른 라운드에 있으면 경기로 이동이 그 라운드 탭으로 넘긴다.
	await tabs.getByRole('button', { name: '8강' }).click();
	for (const game of [1, 2, 3]) {
		await board(page)
			.locator(`[data-match="r0m${game - 1}"] button.bracket-side`)
			.first()
			.click();
	}
	await tabs.getByRole('button', { name: '8강' }).click();
	await page.getByRole('button', { name: /^다음 경기 4강 1경기로 이동$/ }).click();
	await expect(tabs.getByRole('button', { name: '4강' })).toHaveAttribute('aria-current', 'true');
	const focused = board(page).locator('.bracket-match-focus');
	await expect(focused.locator('button').first()).toBeFocused();
	await expect
		.poll(() =>
			focused.evaluate((card) => {
				const box = card.getBoundingClientRect();
				const view = card.closest('.bracket-scroller').getBoundingClientRect();
				return box.left >= view.left - 1 && box.right <= view.right + 1;
			})
		)
		.toBe(true);
});

for (const count of [16, 32]) {
	test(`${count}팀 대진표를 팀원과 함께 A4 가로 1장에 인쇄한다`, async ({ page }) => {
		// 대진표 화면은 떠날 때 저장하므로 다른 화면에서 저장 값을 넣는다.
		await page.goto('/about');
		const teams = Array.from({ length: count }, (_, index) => ({
			id: `t${index}`,
			name: `아주긴팀이름테스트${String(index + 1).padStart(2, '0')}번팀`,
			members: ['가영', '나연', '다현', '라희', '마루']
		}));
		await page.evaluate(
			({ key, teams }) =>
				localStorage.setItem(
					key,
					JSON.stringify({
						version: 1,
						title: '전사 체육대회 결승 토너먼트',
						order: 'input',
						teams,
						bracket: null
					})
				),
			{ key: STORAGE_KEY, teams }
		);
		await openBracket(page);
		await buildBracket(page);
		// 1280×720에서는 70% 미만으로 줄어 글자 위주 카드가 된다.
		const view = board(page).locator('.bracket-view');
		await expect(view).toHaveClass(/bracket-view-text-first/);
		await expect(board(page).locator('.bracket-side-empty .bracket-side-name').first()).toHaveText(
			'—'
		);
		await expect(board(page).locator('.bracket-side-empty .bracket-sr-only').first()).toHaveText(
			/^앞 경기 승자 /
		);
		// 인쇄는 모든 정보를 담은 카드이므로 화면을 100%로 키워 같은 카드끼리 비교한다.
		while ((await page.locator('#bracket-board .bracket-zoom-value').textContent()) !== '100%') {
			await page.getByRole('button', { name: '대진표 확대' }).click();
		}
		await expect(view).not.toHaveClass(/bracket-view-text-first/);
		await page.locator('.bracket-scroller [data-match="r0m0"] button').first().click();
		// 마우스를 치워 화면 버튼의 hover 색이 비교에 섞이지 않게 한다.
		await page.mouse.move(0, 0);
		// 버튼의 색 전환(160ms)이 끝난 뒤 비교한다.
		await page.waitForTimeout(300);
		await page.locator('.bracket-scroller').evaluate((element) => (element.scrollLeft = 400));

		// 인쇄 사본은 화면의 밝은 테마 대진표와 같은 모양이다. 어두운 테마에서도 종이에는 밝은 색을 쓴다.
		const looks = (scope) =>
			page.evaluate((scope) => {
				const style = (selector) =>
					getComputedStyle(document.querySelector(`${scope} ${selector}`));
				// 인쇄 사본은 축소돼 있어 px 값에 소수점 차이가 생기므로 반올림해 비교한다.
				const value = (text) =>
					/^[\d.]+px$/.test(text) ? `${Math.round(parseFloat(text))}px` : text;
				const pick = (selector, keys) =>
					Object.fromEntries(keys.map((key) => [key, value(style(selector)[key])]));
				return {
					match: pick('[data-match="r0m0"]', ['width', 'borderTopColor', 'borderRadius']),
					won: pick('.bracket-side-won', ['backgroundColor', 'color']),
					lost: pick('.bracket-side-lost .bracket-side-name', ['textDecorationLine', 'color']),
					pending: pick('.bracket-side-empty', ['backgroundColor']),
					line: pick('.bracket-line-done', ['stroke', 'strokeWidth']),
					name: pick('.bracket-side-name', ['fontSize', 'fontWeight']),
					pendingText: document
						.querySelector(`${scope} .bracket-side-empty .bracket-side-name`)
						.textContent.trim()
				};
			}, scope);
		const screen = await looks('.bracket-scroller');
		await page.evaluate(() => (document.documentElement.dataset.theme = 'dark'));
		await page.emulateMedia({ media: 'print' });
		expect(await looks('.bracket-print')).toEqual(screen);
		expect(screen.pendingText).toBe('앞 경기 승자');
		// page.pdf()는 지정한 media를 따르므로 인쇄 media로 되돌린 뒤 만든다.
		await page.emulateMedia({ media: null });

		const pdf = await page.pdf({ preferCSSPageSize: true, printBackground: true });
		const pages = pdfPages(pdf);
		expect(pages.count).toBe(1);
		expect(pages.landscape).toBe(true);

		await page.emulateMedia({ media: 'print' });
		const visible = await page.evaluate(() => {
			const print = document.querySelector('.bracket-print');
			const box = print.getBoundingClientRect();
			const hidden = [...document.querySelectorAll('.bracket-page, .site-nav, nav')].every(
				(element) => !element.checkVisibility()
			);
			return { width: box.width, height: box.height, hidden };
		});
		expect(visible.hidden).toBe(true);
		await page.emulateMedia({ media: 'screen' });
	});
}
