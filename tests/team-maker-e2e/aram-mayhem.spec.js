import { expect, test } from '@playwright/test';
import { stubAdsense } from './helpers/adsense.js';

const HUB_PATH = '/aram-mayhem';
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

test.afterEach(async ({ page }, testInfo) => {
	// 없는 주소는 404 응답을 콘솔 오류로 남기므로 그 검사만 제외한다.
	const errors = browserErrors.get(page);
	if (testInfo.title.includes('없는 챔피언')) return;
	expect(errors).toEqual([]);
});

async function openHub(page, hash = '') {
	await page.goto(`${HUB_PATH}${hash}`);
	await expect(page.getByRole('heading', { name: /증바람 공략/, level: 1 })).toBeVisible();
	await expect(page.locator('.aram-picker[data-ready]')).toBeAttached();
}

async function openChampion(page, id) {
	await page.goto(`${HUB_PATH}/${id}`);
	await expect(page.locator('.aram-search-dialog[data-ready]')).toBeAttached();
}

const championName = (page) => page.locator('#aram-champion-name');
const picker = (page) => page.getByRole('list', { name: '챔피언 고르기' });
const searchButton = (page) => page.getByRole('button', { name: /챔피언 검색/ });
const searchDialog = (page) => page.getByRole('dialog', { name: '챔피언 검색' });
const search = (page) => page.getByRole('combobox', { name: '다른 챔피언 찾기' });
const suggestions = (page) => page.getByRole('listbox', { name: '찾은 챔피언' });

async function goByName(page, query, name) {
	await searchButton(page).click();
	await search(page).fill(query);
	await suggestions(page).getByRole('option', { name }).click();
	await expect(championName(page)).toHaveText(name);
}

test('허브의 챔피언 타일은 챔피언 공략 페이지로 이동한다', async ({ page }) => {
	await openHub(page);
	await picker(page).getByRole('link', { name: '티모' }).click();
	await expect(page).toHaveURL(/\/aram-mayhem\/teemo$/);
	await expect(page.getByRole('heading', { name: '증바람 티모 공략', level: 1 })).toBeVisible();
	await expect(championName(page)).toHaveText('티모');
	// 로컬 미리보기는 제목 앞에 [로컬]을 붙인다.
	await expect(page).toHaveTitle(/증바람 티모 공략$/);
});

test('허브의 증강별 공략에서 증강 공략으로 가고 챔피언 공략으로 이어진다', async ({ page }) => {
	await openHub(page);
	await page
		.getByRole('region', { name: '증강별 공략' })
		.getByRole('link', { name: /장갑 충격/ })
		.click();
	await expect(page).toHaveURL(/\/aram-mayhem\/augments\/armored-impact$/);
	await expect(
		page.getByRole('heading', { name: '증바람 장갑 충격 공략', level: 1 })
	).toBeVisible();
	await expect(page).toHaveTitle(/증바람 장갑 충격\(장충\) 공략$/);
	// 모든 챔피언이 같은 템트리라 위에 한 번만 보여 준다.
	await expect(page.getByRole('list', { name: '코어 아이템 구매 순서' })).toHaveCount(1);
	await page.getByRole('link', { name: '트런들' }).click();
	await expect(page).toHaveURL(/\/aram-mayhem\/trundle$/);
	await expect(championName(page)).toHaveText('트런들');
});

test('예전 #챔피언 주소는 챔피언 공략 페이지로 옮긴다', async ({ page }) => {
	await page.goto(`${HUB_PATH}#ashe`);
	await expect(page).toHaveURL(/\/aram-mayhem\/ashe$/);
	await expect(championName(page)).toHaveText('애쉬');

	// 깨진 주소나 모르는 값이면 허브에 그대로 머문다.
	await openHub(page, '#%E0');
	await expect(page).toHaveURL(/\/aram-mayhem#%E0$/);
});

test('허브 검색은 이름·별명·초성과 역할로 챔피언 목록을 거른다', async ({ page }) => {
	await openHub(page);
	const box = page.getByRole('searchbox', { name: '챔피언 이름 검색' });
	await box.fill('켄치');
	await expect(picker(page).getByRole('link')).toHaveText(['탐 켄치']);
	await box.fill('마이');
	await expect(picker(page).getByRole('link')).toHaveText(['마스터 이']);
	await box.fill('ㅌㅁ');
	await expect(picker(page).getByRole('link')).toHaveText(['티모']);
	await box.fill('없는 이름');
	await expect(page.getByText('찾는 챔피언이 아직 가이드에 없어요.')).toBeVisible();

	await box.fill('');
	await page
		.getByRole('group', { name: '역할로 거르기' })
		.getByRole('button', { name: '탱커' })
		.click();
	const names = (await picker(page).getByRole('link').allTextContents()).map((n) => n.trim());
	expect(names).toContain('브라움');
	expect(names).not.toContain('티모');
});

test('떠 있는 검색 버튼과 / 키로 검색 창을 열고 키보드로 챔피언을 고른다', async ({ page }) => {
	await openChampion(page, 'garen');
	await expect(searchDialog(page)).toBeHidden();
	// 다른 챔피언 링크 목록은 두지 않는다.
	await expect(page.locator('a[href^="/aram-mayhem/"]')).toHaveCount(0);

	await searchButton(page).click();
	await expect(searchDialog(page)).toBeVisible();
	await expect(search(page)).toBeFocused();
	await expect(suggestions(page)).toBeHidden();
	await search(page).fill('마이');
	await expect(search(page)).toHaveAttribute('aria-expanded', 'true');
	await expect(suggestions(page).getByRole('option')).toHaveText([/마스터 이/]);
	await search(page).press('Enter');
	await expect(page).toHaveURL(/\/aram-mayhem\/master-yi$/);
	await expect(championName(page)).toHaveText('마스터 이');
	await expect(searchDialog(page)).toBeHidden();

	// / 키로 열고, 방향키로 고르고, Escape로 닫는다.
	await page.keyboard.press('/');
	await expect(searchDialog(page)).toBeVisible();
	await expect(search(page)).toBeFocused();
	await expect(search(page)).toHaveValue('');
	await search(page).fill('ㅌ');
	await expect(suggestions(page).getByRole('option').first()).toHaveAttribute(
		'aria-selected',
		'true'
	);
	await search(page).press('ArrowDown');
	await expect(suggestions(page).getByRole('option').nth(1)).toHaveAttribute(
		'aria-selected',
		'true'
	);
	await search(page).press('Escape');
	await expect(searchDialog(page)).toBeHidden();

	await searchButton(page).click();
	await search(page).fill('없는 이름');
	await expect(page.getByText('찾는 챔피언이 아직 가이드에 없어요.')).toBeVisible();
	await searchDialog(page).getByRole('button', { name: '닫기' }).click();
	await expect(searchDialog(page)).toBeHidden();

	// 닫기 버튼으로 닫아도 다음에는 빈 검색창으로 연다.
	await searchButton(page).click();
	await expect(search(page)).toHaveValue('');
	await expect(page.getByText('찾는 챔피언이 아직 가이드에 없어요.')).toBeHidden();
	await search(page).press('Escape');
	await expect(searchDialog(page)).toBeHidden();
});

test('메뉴 서랍이 열려 있으면 / 키로 검색 창을 열지 않는다', async ({ page }) => {
	await page.setViewportSize({ width: 390, height: 800 });
	await openChampion(page, 'garen');
	await page.getByRole('button', { name: '메뉴 열기' }).filter({ visible: true }).click();
	await expect(page.getByRole('dialog', { name: '사이트 내비게이션' })).toBeVisible();
	await page.keyboard.press('/');
	await expect(searchDialog(page)).toBeHidden();
});

test('낮은 화면에서도 검색 창이 화면 안에 들어온다', async ({ page }) => {
	await page.setViewportSize({ width: 800, height: 400 });
	await openChampion(page, 'garen');
	await searchButton(page).click();
	await search(page).fill('ㅇ');
	const bottom = await searchDialog(page).evaluate((el) => el.getBoundingClientRect().bottom);
	expect(bottom).toBeLessThanOrEqual(400);
});

test('빌드 탭을 바꾸면 증강 빌드의 바뀐 아이템을 표시한다', async ({ page }) => {
	await openChampion(page, 'teemo');
	const tabs = page.getByRole('group', { name: '빌드 고르기' });
	await expect(tabs.getByRole('button', { name: '기본 빌드 · 주문력' })).toHaveAttribute(
		'aria-pressed',
		'true'
	);
	await expect(page.locator('.aram-core .aram-mark')).toHaveCount(0);

	await tabs.getByRole('button', { name: '벌이다!!!' }).click();
	await expect(tabs.getByRole('button', { name: '벌이다!!!' })).toHaveAttribute(
		'aria-pressed',
		'true'
	);
	await expect(page.locator('.aram-core .aram-mark').first()).toHaveText('변경');
	await expect(page.locator('.aram-situational .aram-mark').first()).toHaveText('추가');

	// 다른 챔피언으로 가면 첫 기본 빌드로 돌아간다.
	await goByName(page, '애쉬', '애쉬');
	await expect(tabs.getByRole('button', { name: '기본 빌드 · 몰락한 왕의 검' })).toHaveAttribute(
		'aria-pressed',
		'true'
	);
});

test('증강 이름을 누르면 효과를 보여 주고 다시 누르면 닫는다', async ({ page }) => {
	await openChampion(page, 'ashe');
	const combo = page.locator('.aram-combo').filter({ hasText: '무한 E·R 애쉬' });
	const archmage = combo.getByRole('button', { name: '대마법사' }).first();
	await archmage.click();
	await expect(archmage).toHaveAttribute('aria-expanded', 'true');
	await expect(combo.locator('.aram-aug-detail')).toContainText('대마법사');
	await archmage.click();
	await expect(combo.locator('.aram-aug-detail')).toHaveCount(0);

	// 조합 출처는 새 탭으로 연다.
	const source = combo.getByRole('link', { name: /유튜브/ });
	await expect(source).toHaveAttribute('target', '_blank');
	await expect(source).toHaveAttribute('rel', 'noopener noreferrer');
});

test('접은 조합 카드는 다른 챔피언을 봤다가 돌아와도 접혀 있다', async ({ page }) => {
	await openChampion(page, 'ashe');
	const combo = () => page.locator('.aram-combo').filter({ hasText: '무한 E·R 애쉬' });
	await combo().locator('summary').click();
	await expect(combo()).not.toHaveAttribute('open', '');
	await goByName(page, '티모', '티모');
	await goByName(page, '애쉬', '애쉬');
	await expect(combo()).not.toHaveAttribute('open', '');
});

test('없는 챔피언·증강 주소는 404를 보여 준다', async ({ page }) => {
	for (const path of [`${HUB_PATH}/unknown-champion`, `${HUB_PATH}/augments/unknown-augment`]) {
		const response = await page.goto(path);
		expect(response?.status(), path).toBe(404);
	}
});

test('좁은 화면에서도 가로로 넘치지 않는다', async ({ page }) => {
	await page.setViewportSize({ width: 360, height: 800 });
	for (const path of [HUB_PATH, `${HUB_PATH}/yasuo`, `${HUB_PATH}/augments/bees`]) {
		await page.goto(path);
		const overflow = await page.evaluate(
			() => document.documentElement.scrollWidth - document.documentElement.clientWidth
		);
		expect(overflow, path).toBeLessThanOrEqual(0);
	}
});
