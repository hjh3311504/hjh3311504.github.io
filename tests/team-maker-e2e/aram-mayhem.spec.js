import { expect, test } from '@playwright/test';
import { stubAdsense } from './helpers/adsense.js';

const ARAM_PATH = '/aram-mayhem';
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

async function openGuide(page, hash = '') {
	await page.goto(`${ARAM_PATH}${hash}`);
	await expect(
		page.getByRole('heading', { name: '칼바람 아수라장 증강 가이드', level: 1 })
	).toBeVisible();
	await expect(page.locator('.aram-detail-anchor[data-ready]')).toBeAttached();
}

const championName = (page) => page.locator('#aram-champion-name');
const picker = (page) => page.getByRole('list', { name: '챔피언 고르기' });

test('챔피언을 고르면 설명과 주소가 바뀌고 주소로 다시 열 수 있다', async ({ page }) => {
	await openGuide(page);
	await expect(championName(page)).toHaveText('가렌');
	await picker(page).getByRole('button', { name: '티모' }).click();
	await expect(championName(page)).toHaveText('티모');
	await expect(picker(page).getByRole('button', { name: '티모' })).toHaveAttribute(
		'aria-pressed',
		'true'
	);
	expect(new URL(page.url()).hash).toBe('#teemo');

	await openGuide(page, '#ashe');
	await expect(championName(page)).toHaveText('애쉬');

	// 깨진 주소는 첫 챔피언으로 열고 고르기는 그대로 동작한다.
	await openGuide(page, '#%E0');
	await expect(championName(page)).toHaveText('가렌');
	await picker(page).getByRole('button', { name: '티모' }).click();
	await expect(championName(page)).toHaveText('티모');
});

test('이름 검색과 역할로 챔피언 목록을 거른다', async ({ page }) => {
	await openGuide(page);
	await page.getByRole('searchbox', { name: '챔피언 이름 검색' }).fill('켄치');
	await expect(picker(page).getByRole('button')).toHaveText(['탐 켄치']);
	await page.getByRole('searchbox', { name: '챔피언 이름 검색' }).fill('없는 챔피언');
	await expect(page.getByText('찾는 챔피언이 아직 가이드에 없어요.')).toBeVisible();

	await page.getByRole('searchbox', { name: '챔피언 이름 검색' }).fill('');
	await page
		.getByRole('group', { name: '역할로 거르기' })
		.getByRole('button', { name: '탱커' })
		.click();
	const names = (await picker(page).getByRole('button').allTextContents()).map((n) => n.trim());
	expect(names).toContain('브라움');
	expect(names).not.toContain('티모');
});

test('빌드 탭을 바꾸면 증강 빌드의 바뀐 아이템을 표시한다', async ({ page }) => {
	await openGuide(page, '#teemo');
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

	// 다른 챔피언을 고르면 첫 기본 빌드로 돌아간다.
	await picker(page).getByRole('button', { name: '애쉬' }).click();
	await expect(tabs.getByRole('button', { name: '기본 빌드 · 몰락한 왕의 검' })).toHaveAttribute(
		'aria-pressed',
		'true'
	);
});

test('증강 이름을 누르면 효과를 보여 주고 다시 누르면 닫는다', async ({ page }) => {
	await openGuide(page, '#ashe');
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
	await openGuide(page, '#ashe');
	const combo = page.locator('.aram-combo').filter({ hasText: '무한 E·R 애쉬' });
	await combo.locator('summary').click();
	await expect(combo).not.toHaveAttribute('open', '');
	await picker(page).getByRole('button', { name: '티모' }).click();
	await picker(page).getByRole('button', { name: '애쉬' }).click();
	await expect(
		page.locator('.aram-combo').filter({ hasText: '무한 E·R 애쉬' })
	).not.toHaveAttribute('open', '');
});

test('좁은 화면에서도 가로로 넘치지 않는다', async ({ page }) => {
	await page.setViewportSize({ width: 360, height: 800 });
	await openGuide(page, '#yasuo');
	const overflow = await page.evaluate(
		() => document.documentElement.scrollWidth - document.documentElement.clientWidth
	);
	expect(overflow).toBeLessThanOrEqual(0);
});
