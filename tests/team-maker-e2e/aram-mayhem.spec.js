import { expect, test } from '@playwright/test';
import { stubAdsense } from './helpers/adsense.js';

const HUB_PATH = '/aram-mayhem';
const browserErrors = new WeakMap();

test.beforeEach(async ({ page }) => {
	await stubAdsense(page);
	// 조합 카드의 플레이 영상이 실제 YouTube에 접속하지 않게 한다.
	await page.route('https://www.youtube-nocookie.com/**', (route) =>
		route.fulfill({ contentType: 'text/html', body: '<!doctype html><title>영상</title>' })
	);
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

test('허브의 꼭 읽어야 할 증강 공략에서 증강 공략으로 가고 챔피언 공략으로 이어진다', async ({
	page
}) => {
	await openHub(page);
	await page
		.getByRole('region', { name: '꼭 읽어야 할 증강 공략' })
		.getByRole('link', { name: /장갑 충격/ })
		.click();
	await expect(page).toHaveURL(/\/aram-mayhem\/augments\/armored-impact$/);
	await expect(
		page.getByRole('heading', { name: '증바람 장갑 충격 공략', level: 1 })
	).toBeVisible();
	await expect(page).toHaveTitle(/증바람 장갑 충격\(장충\) 공략$/);
	// 모든 챔피언이 같은 템트리라 위에 한 번만 보여 주고, 모루작 빌드를 그 아래에 더한다.
	await expect(page.getByRole('list', { name: '코어 아이템 구매 순서' })).toHaveCount(2);
	// 어울리는 챔피언은 조합 카드 없이 허브와 같은 챔피언 타일로만 보여 준다.
	await expect(page.getByRole('heading', { name: '어울리는 챔피언 24명', level: 3 })).toBeVisible();
	const tiles = page.getByRole('list', { name: '어울리는 챔피언' }).getByRole('link');
	await expect(tiles).toHaveCount(24);
	await expect(page.locator('.aram-combo')).toHaveCount(0);
	await tiles.filter({ hasText: '트런들' }).click();
	await expect(page).toHaveURL(/\/aram-mayhem\/trundle$/);
	await expect(championName(page)).toHaveText('트런들');
});

test('허브는 꼭 읽어야 할 증강 공략을 챔피언 이름 검색 위에 두고 벌이다!!! 공략은 적중 시 효과를 안내한다', async ({
	page
}) => {
	await openHub(page);
	const links = page.getByRole('region', { name: '꼭 읽어야 할 증강 공략' });
	const search = page.getByLabel('챔피언 이름 검색');
	await expect(links).toBeVisible();
	await expect(search).toBeVisible();
	const linksBox = await links.boundingBox();
	const searchBox = await search.boundingBox();
	expect(linksBox.y + linksBox.height).toBeLessThanOrEqual(searchBox.y);

	await links.getByRole('link', { name: /벌이다!!!/ }).click();
	await expect(page).toHaveURL(/\/aram-mayhem\/augments\/bees$/);
	// 챔피언마다 템트리가 달라 템트리 카드 없이 알아 둘 점만 보여 준다.
	await expect(page.getByRole('heading', { name: '벌이다!!! 템트리', level: 3 })).toHaveCount(0);
	await expect(page.getByRole('heading', { name: '알아 둘 점', level: 3 })).toBeVisible();
	await expect(page.locator('.aram-detail')).toContainText(
		'패시브나 스킬에 적중 시 효과가 붙은 챔피언이 쓰면 효과가 더 커져요.'
	);
	await expect(page.getByRole('heading', { name: '어울리는 챔피언 16명', level: 3 })).toBeVisible();
});

test('떴다, 징크스 공략은 어울리는 증강으로 속전속결과 보석 건틀릿을 출처 없이 보여 준다', async ({
	page
}) => {
	await openHub(page);
	const link = page
		.getByRole('region', { name: '꼭 읽어야 할 증강 공략' })
		.getByRole('link', { name: /떴다, 징크스/ });
	await expect(link).toContainText('로켓 피해 증폭');
	await link.click();
	await expect(page).toHaveURL(/\/aram-mayhem\/augments\/get-jinxed$/);
	await expect(
		page.getByRole('heading', { name: '증바람 떴다, 징크스 공략', level: 1 })
	).toBeVisible();
	// 제목은 쉼표 없이 검색하는 이름을 쓴다.
	await expect(page).toHaveTitle(/증바람 떴다 징크스 공략/);
	await expect(
		page.getByRole('heading', { name: '함께 고르면 좋은 증강', level: 3 })
	).toBeVisible();
	const cards = page.locator('.aram-synergies > li');
	await expect(cards).toHaveCount(2);
	await expect(cards.nth(0).locator('.aram-sub-heading')).toContainText('속전속결');
	await expect(cards.nth(1).locator('.aram-sub-heading')).toContainText('보석 건틀릿');
	await expect(cards.nth(1)).toContainText('로켓 피해에도 치명타가 터져요.');
	// 로켓 이동 속도 1400과 상대 이동 속도의 차이 10마다 피해가 1% 늘어난다.
	const table = page.getByRole('table', { name: /로켓 이동 속도 1400일 때/ });
	await expect(table.getByRole('row')).toHaveCount(4);
	await expect(table.getByRole('row', { name: /400/ }).getByRole('cell')).toHaveText('+100%');
	// 출처·영상과 어울리는 챔피언 목록은 없다.
	await expect(page.locator('.aram-detail iframe')).toHaveCount(0);
	await expect(page.locator('.aram-detail .aram-sources')).toHaveCount(0);
	await expect(page.getByRole('list', { name: '어울리는 챔피언' })).toHaveCount(0);
});

test('운명의 무기 공략은 챔피언 대신 AD·AP·암살자 1코어 카드 3개를 출처 없이 보여 준다', async ({
	page
}) => {
	await openHub(page);
	const link = page
		.getByRole('region', { name: '꼭 읽어야 할 증강 공략' })
		.getByRole('link', { name: /운명의 무기/ });
	await expect(link).toContainText('방마관 100% 만들기');
	await link.click();
	await expect(page).toHaveURL(/\/aram-mayhem\/augments\/weapon-of-destiny$/);
	await expect(page).toHaveTitle(/증바람 운명의 무기\(운무\) 공략$/);
	await expect(page.getByRole('heading', { name: '1코어 추천', level: 3 })).toBeVisible();
	// 관통력 100%를 강조하고 관통력은 아이콘 타일로 보여 준다.
	// %와 '까지' 사이에는 줄바꿈을 막는 단어 잇기 문자가 있다.
	await expect(page.locator('.aram-aug-lead')).toContainText(/100%\u2060까지/);
	await expect(page.locator('.aram-aug-lead .aram-stat-icon img')).toHaveCount(3);
	const cards = page.locator('.aram-role-items > li');
	await expect(cards).toHaveCount(3);
	await expect(cards.nth(0)).toContainText('AD 챔피언');
	await expect(cards.nth(0)).toContainText('도미닉 경의 인사');
	await expect(cards.nth(1)).toContainText('AP 챔피언');
	await expect(cards.nth(1).locator('.aram-item')).toHaveText(['무덤꽃', '공허의 지팡이']);
	await expect(cards.nth(2)).toContainText('암살자 챔피언');
	await expect(cards.nth(2)).toContainText('독사의 송곳니');
	await expect(page.locator('.aram-sources')).toHaveCount(0);
	await expect(page.getByRole('heading', { name: /어울리는 챔피언/ })).toHaveCount(0);
});

test('장갑 충격 공략과 챔피언 빌드 탭에 모루작 빌드와 추천 모루를 보여 준다', async ({ page }) => {
	await page.goto(`${HUB_PATH}/augments/armored-impact`);
	const vest = page.locator('.aram-card', { hasText: '모루작 빌드' });
	const items = ['쇠사슬 조끼', '2티어 신발', '해신 작쇼', '모루 반복 구매'];
	await expect(vest.locator('.aram-item')).toHaveText(items);
	await expect(vest.locator('.aram-core-with')).toHaveText('2티어 신발');
	await expect(vest.locator('.aram-caution')).toContainText('저점이 낮아요');
	await expect(vest.locator('.aram-anvil-badge')).toHaveText(['프리즘', '골드', '실버']);
	// 줄은 등급, 칸은 1순위·2순위인 표다.
	await expect(vest.getByRole('columnheader')).toHaveText(['등급', '1순위', '2순위']);
	const prism = vest.getByRole('row', { name: '프리즘 모루' });
	await expect(prism.locator('td').first().locator('.aram-anvil-stat')).toHaveText([
		'방어구 관통력',
		'모든 피해 흡혈'
	]);
	await expect(
		vest.getByRole('row', { name: '골드·실버 모루' }).locator('td').nth(1)
	).toContainText('스킬 가속 + 공격 속도');

	await page.goto(`${HUB_PATH}/rammus`);
	// 버튼 사이의 · 기호는 화면 읽기에서 빠진다.
	await page.getByRole('button', { name: '장갑 충격 모루작 빌드' }).click();
	const core = page.getByRole('list', { name: '코어 아이템 구매 순서' });
	await expect(core.locator('.aram-item')).toHaveText(items);
	await expect(page.locator('.aram-builds .aram-anvil-badge')).toHaveText([
		'프리즘',
		'골드',
		'실버'
	]);
	// 완전히 다른 템트리라 기본 빌드와 비교한 추가·변경 표시는 하지 않는다.
	await expect(core.locator('.aram-mark')).toHaveCount(0);
});

test('예전 #챔피언 주소는 챔피언 공략 페이지로 옮긴다', async ({ page }) => {
	await page.goto(`${HUB_PATH}#ashe`);
	await expect(page).toHaveURL(/\/aram-mayhem\/ashe$/);
	await expect(championName(page)).toHaveText('애쉬');

	// 깨진 주소나 모르는 값이면 허브에 그대로 머문다.
	await openHub(page, '#%E0');
	await expect(page).toHaveURL(/\/aram-mayhem#%E0$/);
});

test('허브 검색은 이름·별명·초성으로 챔피언 목록을 거른다', async ({ page }) => {
	await openHub(page);
	// 역할 버튼은 두지 않는다.
	await expect(page.getByRole('group', { name: '역할로 거르기' })).toHaveCount(0);
	// 타일은 초성별로 묶이고 쌍자음 챔피언은 기본 자음 묶음에 들어간다.
	await expect(picker(page).getByRole('list')).toHaveCount(14);
	await expect(
		picker(page).getByRole('list', { name: 'ㅂ 챔피언' }).getByRole('link', { name: '뽀삐' })
	).toBeVisible();
	const box = page.getByRole('searchbox', { name: '챔피언 이름 검색' });
	await box.fill('켄치');
	await expect(picker(page).getByRole('link')).toHaveText(['탐 켄치']);
	// 거르고 나서 빈 초성 묶음은 숨긴다.
	await expect(picker(page).getByRole('list')).toHaveCount(1);
	await expect(picker(page).getByRole('list', { name: 'ㅌ 챔피언' })).toBeVisible();
	await box.fill('마이');
	await expect(picker(page).getByRole('link')).toHaveText(['마스터 이']);
	await box.fill('ㅌㅁ');
	await expect(picker(page).getByRole('link')).toHaveText(['티모']);
	await box.fill('없는 이름');
	await expect(page.getByText('찾는 챔피언이 아직 가이드에 없어요.')).toBeVisible();
	// 긴 이름은 타일에 줄임말로 보이고, 링크 이름은 보이는 줄임말과 전체 이름을 함께 담는다.
	await box.fill('트페');
	await expect(
		picker(page).getByRole('link', { name: '트페 (트위스티드 페이트)', exact: true })
	).toHaveText('트페');

	await box.fill('');
	await expect(picker(page).getByRole('list')).toHaveCount(14);
});

test('허브의 초성 색인은 그 묶음으로 이동하고 검색으로 빈 초성은 누를 수 없다', async ({
	page
}) => {
	await openHub(page);
	const index = page.getByRole('navigation', { name: '초성으로 이동' });
	await expect(index.getByRole('link')).toHaveCount(14);
	// 초성 버튼은 정사각형이다.
	for (const link of await index.getByRole('link').all()) {
		const { width, height } = await link.boundingBox();
		expect(width).toBe(height);
	}
	await index.getByRole('link', { name: 'ㅋ', exact: true }).click();
	await expect(page).toHaveURL(/#aram-initial-/);
	// 이동한 묶음은 화면 위에 붙어 있는 색인 아래에 보인다.
	const group = picker(page).getByRole('list', { name: 'ㅋ 챔피언' });
	await expect(group).toBeInViewport();
	await expect
		.poll(async () => (await group.boundingBox()).y - (await index.boundingBox()).y)
		.toBeGreaterThan((await index.boundingBox()).height);
	// 고른 묶음은 붉은 테두리 카드로 감싸고 화면 세로 가운데에 둔다. 색인의 그 초성 버튼도 붉게 채운다.
	const row = page.locator('#aram-initial-ㅋ');
	await expect(row).toHaveAttribute('data-active', 'true');
	await expect(page.locator('.aram-initial-row[data-active]')).toHaveCount(1);
	await expect(index.locator('[aria-current]')).toHaveText(['ㅋ']);
	await expect(index.getByRole('link', { name: 'ㅋ', exact: true })).toHaveAttribute(
		'aria-current',
		'location'
	);
	// 카드가 좌우로 넓어져도 타일 자리는 다른 묶음과 같다.
	expect((await group.getByRole('link').first().boundingBox()).x).toBe(
		(await page.locator('#aram-initial-ㄱ').getByRole('link').first().boundingBox()).x
	);
	await expect(row.locator('.aram-initial')).not.toHaveCSS(
		'color',
		await page
			.locator('#aram-initial-ㄱ .aram-initial')
			.evaluate((el) => getComputedStyle(el).color)
	);
	const viewport = page.viewportSize();
	await expect
		.poll(async () => {
			const rowBox = await row.boundingBox();
			return Math.abs(rowBox.y + rowBox.height / 2 - viewport.height / 2);
		})
		.toBeLessThan(2);
	// 다른 초성을 누르면 카드와 색인 표시가 그 초성으로 옮겨 간다.
	await index.getByRole('link', { name: 'ㄱ', exact: true }).click();
	await expect(page.locator('#aram-initial-ㄱ')).toHaveAttribute('data-active', 'true');
	await expect(row).not.toHaveAttribute('data-active');
	await expect(index.locator('[aria-current]')).toHaveText(['ㄱ']);

	// 빈 초성은 자리를 지킨 채 링크 없이 흐리게 보인다.
	const box = page.getByRole('searchbox', { name: '챔피언 이름 검색' });
	const disabled = index.locator('[aria-disabled="true"]');
	await box.fill('ㅌㅁ');
	await expect(index.getByRole('link')).toHaveText(['ㅌ']);
	await expect(disabled).toHaveCount(13);
	await expect(disabled.first()).toHaveCSS('opacity', '0.3');
	// 고른 초성이 검색으로 비면 색인 표시도 없앤다.
	await expect(index.locator('[aria-current]')).toHaveCount(0);
	// 검색 결과가 없어도 색인은 남고 모든 초성이 흐려진다.
	await box.fill('없는 이름');
	await expect(index).toBeVisible();
	await expect(disabled).toHaveCount(14);
});

test('보조 키를 누르고 초성 색인을 누르면 새 탭으로 열고 현재 화면은 그대로 둔다', async ({
	page,
	context
}) => {
	await openHub(page);
	const index = page.getByRole('navigation', { name: '초성으로 이동' });
	const popup = context.waitForEvent('page');
	await index
		.getByRole('link', { name: 'ㅋ', exact: true })
		.click({ modifiers: ['ControlOrMeta'] });
	expect((await popup).url()).toMatch(/#aram-initial-/);
	await expect(page).not.toHaveURL(/#aram-initial-/);
	await expect(page.locator('.aram-initial-row[data-active]')).toHaveCount(0);
	await expect(index.locator('[aria-current]')).toHaveCount(0);
});

test('화면보다 긴 초성 묶음은 가운데 대신 붙어 있는 색인 바로 아래에 맞춘다', async ({ page }) => {
	await page.setViewportSize({ width: 390, height: 740 });
	await openHub(page);
	const index = page.getByRole('navigation', { name: '초성으로 이동' });
	await index.getByRole('link', { name: 'ㅅ', exact: true }).click();
	const row = page.locator('#aram-initial-ㅅ');
	await expect(row).toHaveAttribute('data-active', 'true');
	// 묶음 위쪽이 색인 바로 아래(여유 8px)에 온다. 부드러운 스크롤이 끝날 때까지 기다린다.
	await expect
		.poll(async () => {
			const indexBox = await index.boundingBox();
			return Math.abs((await row.boundingBox()).y - (indexBox.y + indexBox.height) - 8);
		})
		.toBeLessThanOrEqual(1);
});

test('허브 타일에 키보드 초점이 가면 붙어 있는 색인에 가려지지 않는다', async ({ page }) => {
	await openHub(page);
	const index = page.getByRole('navigation', { name: '초성으로 이동' });
	const tiles = picker(page).getByRole('list', { name: 'ㅋ 챔피언' }).getByRole('link');
	// ㅋ 묶음 첫 줄을 붙어 있는 색인 밑(화면 위 20px)에 두고 두 번째 타일에 초점을 둔다.
	await tiles.nth(1).evaluate((tile) => {
		document.documentElement.style.scrollBehavior = 'auto';
		window.scrollTo(0, tile.getBoundingClientRect().top + window.scrollY - 20);
		tile.focus({ preventScroll: true });
	});
	const indexBox = await index.boundingBox();
	expect((await tiles.first().boundingBox()).y).toBeLessThan(indexBox.y + indexBox.height);
	// Shift+Tab으로 색인에 가려진 첫 타일로 가면 화면이 움직여 색인 아래에 보인다.
	await page.keyboard.press('Shift+Tab');
	await expect(tiles.first()).toBeFocused();
	expect((await tiles.first().boundingBox()).y).toBeGreaterThanOrEqual(
		indexBox.y + indexBox.height
	);
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

test('조합 카드의 플레이 영상은 자동 재생하지 않는다', async ({ page }) => {
	for (const [path, combo, id] of [
		['kaisa', 'W만으로 패시브 터트리기', 'TXJnV9S1t8g'],
		['malphite', '방어력 기반 평타', 'Vx5VH92Zd2I']
	]) {
		await page.goto(`${HUB_PATH}/${path}`);
		const frame = page
			.locator('.aram-combo')
			.filter({ hasText: combo })
			.locator('.aram-video iframe');
		await expect(frame).toHaveAttribute('src', new RegExp(`/embed/${id}\\?loop=1`));
		await expect(frame).not.toHaveAttribute('src', /autoplay|mute/);
		await expect(frame).toHaveAttribute('loading', 'lazy');
		await expect(frame).toHaveAttribute('title', /플레이 영상/);
	}
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

test('문장 속 아이콘 타일은 어느 문장에 넣어도 문장 글자와 같은 높이에 놓인다', async ({
	page
}) => {
	// 타일 글자와 바로 옆 문장 글자의 아래선, 아이콘·스킬 키 상자와 문장 글자의 세로 중심을 비교한다.
	// 키만 보이는 스킬 타일처럼 글자가 없는 타일도 잰다.
	// 보정 class가 없는 새 문장(글자 크기·줄 높이 여러 개)에 종류별 타일을 넣어도 맞아야 한다.
	const measure = () => {
		const textRect = (node, start, end) => {
			const range = document.createRange();
			if (start === undefined) range.selectNodeContents(node);
			else {
				range.setStart(node, start);
				range.setEnd(node, end);
			}
			return range.getBoundingClientRect();
		};
		const isText = (node) => node?.nodeType === 3 && node.textContent.trim();
		const middle = (rect) => (rect.top + rect.bottom) / 2;
		const gap = (tile) => {
			const label = [...tile.childNodes].reverse().find(isText);
			let near = tile.nextSibling;
			while (near && !isText(near)) near = near.nextSibling;
			let index = near?.textContent.search(/\S/);
			if (!near) {
				near = tile.previousSibling;
				while (near && !isText(near)) near = near.previousSibling;
				index = near?.textContent.search(/\S\s*$/);
			}
			if (!near) return null;
			const word = textRect(near, index, index + 1);
			const box = tile.getBoundingClientRect();
			if (word.top > box.bottom || word.bottom < box.top) return null;
			const icon = tile.querySelector('img, .aram-ring, .aram-stat-icon');
			const key = tile.querySelector('.aram-key');
			return {
				name: label?.textContent.trim() ?? tile.title,
				baseline: label ? Math.abs(textRect(label).bottom - word.bottom) : 0,
				icon: icon ? Math.abs(middle(icon.getBoundingClientRect()) - middle(word)) : 0,
				key: key ? Math.abs(middle(key.getBoundingClientRect()) - middle(word)) : 0
			};
		};
		const tiles = [...document.querySelectorAll('.aram-ic')].filter(
			(tile) =>
				tile.getClientRects().length &&
				!/flex|grid/.test(getComputedStyle(tile.parentElement).display)
		);
		const kinds = {
			키: '.aram-ic-key-only',
			스킬: '.aram-ic:has(.aram-key):not(.aram-ic-key-only)',
			증강: '.aram-ic:has(.aram-ring)',
			능력치: '.aram-ic:has(.aram-stat-icon)',
			아이템: '.aram-ic:not(:has(.aram-key, .aram-ring, .aram-stat-icon))'
		};
		const found = Object.entries(kinds)
			.map(([kind, selector]) => [kind, tiles.find((tile) => tile.matches(selector))])
			.filter(([, tile]) => tile);
		const samples = found.map(([, tile]) => tile);
		const probes = [];
		for (const sample of samples) {
			for (const size of [14, 16, 20]) {
				for (const lineHeight of ['1.4', '2.4']) {
					const sentence = document.createElement('div');
					sentence.style.cssText = `font-size:${size}px;line-height:${lineHeight}`;
					sentence.append('앞 글자 ', sample.cloneNode(true), '가 뒤 글자');
					document.querySelector('.aram-page').append(sentence);
					probes.push(gap(sentence.firstElementChild));
					sentence.remove();
				}
			}
		}
		return {
			kinds: found.map(([kind]) => kind),
			rows: [...tiles.map(gap), ...probes].filter(Boolean)
		};
	};
	for (const [path, kinds] of [
		['/aram-mayhem/augments/get-jinxed', ['증강', '능력치']],
		['/aram-mayhem/master-yi', ['스킬', '증강', '아이템']],
		['/aram-mayhem/lee-sin', ['키']]
	]) {
		await page.goto(path);
		await page.evaluate(() => document.fonts.ready);
		const result = await page.evaluate(measure);
		// 키만 보이는 스킬 타일 등 그 페이지에 있는 타일 종류를 모두 잰다.
		expect(result.kinds, `${path} 타일 종류`).toEqual(expect.arrayContaining(kinds));
		for (const row of result.rows) {
			expect(row.baseline, `${path} ${row.name} 글자 아래선`).toBeLessThan(0.75);
			expect(row.icon, `${path} ${row.name} 아이콘 중심`).toBeLessThan(1);
			expect(row.key, `${path} ${row.name} 스킬 키 중심`).toBeLessThan(1);
		}
	}
});
