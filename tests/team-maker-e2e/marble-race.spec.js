import { test, expect } from '@playwright/test';
import { MAPS } from '../../src/lib/marble-race/catalog.js';
import { SOUND_FILES } from '../../src/lib/marble-race/audio.js';
async function editSettings(page) {
	if (await page.getByRole('button', { name: '준비 취소하고 설정 변경', exact: true }).count()) {
		await page
			.getByRole('button', { name: '준비 취소하고 설정 변경', exact: true })
			.first()
			.click();
		return;
	}
	await page.getByRole('button', { name: '경기 종료하고 설정 변경', exact: true }).first().click();
	await page.getByRole('button', { name: '종료하고 설정 변경', exact: true }).click();
}

test.describe('구슬 레이스 재질층과 녹음', () => {
	test.setTimeout(60000);
	const errors = new WeakMap();
	test.beforeEach(async ({ page }) => {
		const collected = [];
		errors.set(page, collected);
		page.on('pageerror', (error) => collected.push(error.message));
	});
	test.afterEach(async ({ page }) => {
		expect(errors.get(page)).toEqual([]);
	});
	test('새 맵의 소리만 준비하고 일시정지·초기화·캐시를 유지한다', async ({ page }) => {
		const requests = [];
		page.on('request', (request) => {
			if (request.url().includes('/audio/marble-race/')) requests.push(request.url());
		});
		await page.goto('/marble-race');
		await expect(page.getByRole('heading', { name: '블록 도감' })).toBeVisible();
		await expect(page.locator('[aria-labelledby=block-library-title] button')).toHaveCount(11);
		await page.getByRole('button', { name: /^도각도각 키보드$/ }).click();
		await page.getByRole('button', { name: '구슬 굴리기 ▶', exact: true }).first().click();
		await expect(page.locator('.stage-state')).toHaveText('경기 중');
		expect(requests).toHaveLength(new Set(MAPS[0].types.flatMap((type) => SOUND_FILES[type])).size);
		expect(
			requests.every((url) =>
				/\/(thock-[12]|clicky-keyboard-press-ai-v1|typewriter-8-ai-v1|popit-[12]|rubber-[12]|waxball-crack-A|asmr-lava-ai-v1|fanfare-tada-v1)\.wav$/.test(
					url
				)
			)
		).toBe(true);
		await page.waitForTimeout(6000);
		await page.getByRole('button', { name: '잠시 멈춤 Ⅱ', exact: true }).click();
		await expect(page.locator('.stage-state')).toHaveText('잠시 멈춤');
		const stats = await page.locator('.race-stats').innerText();
		const pausedCanvas = await page.locator('canvas').evaluate((canvas) => canvas.toDataURL());
		await page.waitForTimeout(2200);
		expect(await page.locator('canvas').evaluate((canvas) => canvas.toDataURL())).toBe(
			pausedCanvas
		);
		await expect(page.locator('.race-stats')).toHaveText(stats, { useInnerText: true });
		await editSettings(page);
		await page.getByRole('button', { name: '구슬 굴리기 ▶', exact: true }).first().click();
		await expect(page.locator('.stage-state')).toHaveText('경기 중');
		expect(requests).toHaveLength(new Set(MAPS[0].types.flatMap((type) => SOUND_FILES[type])).size);
	});
	test('다운로드 실패 후 재시도와 무음 시작을 제공한다', async ({ page }) => {
		await page.route('**/audio/marble-race/*.wav', (route) =>
			route.fulfill({ status: 503, body: '테스트 실패' })
		);
		await page.goto('/marble-race');
		await page.getByRole('button', { name: '구슬 굴리기 ▶', exact: true }).first().click();
		await expect(page.getByRole('button', { name: '소리 다시 준비', exact: true })).toBeVisible();
		await page.getByRole('button', { name: '소리 없이 시작', exact: true }).click();
		await expect(page.locator('.stage-state')).toHaveText('경기 중');
		await expect(page.getByRole('button', { name: '♪ 소리 꺼짐', exact: true })).toBeVisible();
		await editSettings(page);
		await page.unroute('**/audio/marble-race/*.wav');
		await page.getByRole('button', { name: '♪ 소리 꺼짐', exact: true }).click();
		await page.getByRole('button', { name: '구슬 굴리기 ▶', exact: true }).first().click();
		await expect(page.locator('.stage-state')).toHaveText('경기 중');
	});
	test('로딩 중 중복 시작을 막고 초기화하면 늦은 로딩이 경기를 시작하지 않는다', async ({
		page
	}) => {
		let release;
		const barrier = new Promise((resolve) => (release = resolve));
		await page.route('**/audio/marble-race/*.wav', async (route) => {
			await barrier;
			await route.continue();
		});
		await page.goto('/marble-race');
		await page.getByRole('button', { name: '구슬 굴리기 ▶', exact: true }).first().click();
		await expect(page.locator('.stage-state')).toHaveText('소리 준비 중');
		await expect(page.getByRole('textbox', { name: '참가자 이름' })).toBeDisabled();
		await expect(page.getByRole('button', { name: '잠시 멈춤 Ⅱ', exact: true })).toBeDisabled();
		await editSettings(page);
		release();
		await expect(page.locator('.stage-state')).toHaveText('출발 준비');
		await page.waitForTimeout(300);
		await expect(page.locator('.stage-state')).toHaveText('출발 준비');
	});
	test('320px에서도 설정·경기장·도감이 가로로 넘치지 않는다', async ({ page }) => {
		await page.setViewportSize({ width: 320, height: 800 });
		await page.goto('/marble-race');
		await page.getByRole('button', { name: /^도각도각 키보드$/ }).click();
		await expect(
			page.getByRole('button', { name: '구슬 굴리기 ▶', exact: true }).first()
		).toBeEnabled();
		expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(
			true
		);
		await page.getByRole('button', { name: '구슬 굴리기 ▶', exact: true }).first().click();
		await expect(page.locator('.stage-state')).toHaveText('경기 중');
		expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(
			true
		);
	});
	test('클릭·키보드 배속과 일시정지·초기화가 서로 간섭하지 않는다', async ({ page }) => {
		await page.goto('/marble-race');
		const speed = page.getByRole('button', { name: '경기 배속 전환', exact: true });
		const canvas = page.getByRole('button', { name: /^구슬 경기 화면/ });
		await expect(speed).toBeDisabled();
		await page.getByRole('button', { name: '구슬 굴리기 ▶', exact: true }).first().click();
		await expect(page.locator('.stage-state')).toHaveText('경기 중');
		await canvas.click();
		await expect(speed).toHaveText('2배속');
		await expect(canvas).toHaveAttribute('aria-pressed', 'true');
		await canvas.press('Enter');
		await expect(speed).toHaveText('1배속');
		await canvas.press('Space');
		await expect(speed).toHaveText('2배속');
		await page.getByRole('button', { name: '♫ 소리 켜짐', exact: true }).click();
		await expect(speed).toHaveText('2배속');
		await page.getByRole('button', { name: '경기장 전체화면', exact: true }).click();
		await expect(speed).toHaveText('2배속');
		await page.getByRole('button', { name: '전체화면 닫기', exact: true }).click();
		await page.getByRole('button', { name: '잠시 멈춤 Ⅱ', exact: true }).click();
		await expect(speed).toBeDisabled();
		await expect(speed).toHaveText('2배속');
		await page.getByRole('button', { name: '계속하기 ▶', exact: true }).last().click();
		await expect(speed).toBeEnabled();
		await expect(speed).toHaveText('2배속');
		const seconds = () =>
			page
				.locator('.race-stats > span')
				.nth(1)
				.innerText()
				.then((text) => {
					const [m, s] = text.split(':').map(Number);
					return m * 60 + s;
				});
		const before = await seconds();
		await page.waitForTimeout(2000);
		const advanced = (await seconds()) - before;
		expect(advanced).toBeGreaterThanOrEqual(3);
		expect(advanced).toBeLessThanOrEqual(5);
		await speed.click();
		await expect(speed).toHaveText('1배속');
		await speed.click();
		await editSettings(page);
		await expect(speed).toHaveText('1배속');
		await page.getByRole('button', { name: '구슬 굴리기 ▶', exact: true }).first().click();
		await expect(speed).toHaveText('1배속');
	});
	test('모바일 탭으로 배속을 바꾸고 다른 버튼은 배속을 바꾸지 않는다', async ({ browser }) => {
		const context = await browser.newContext({
			viewport: { width: 390, height: 844 },
			isMobile: true,
			hasTouch: true
		});
		try {
			const page = await context.newPage();
			await page.goto('http://127.0.0.1:4174/marble-race');
			await page.getByRole('button', { name: '구슬 굴리기 ▶', exact: true }).first().tap();
			const speed = page.getByRole('button', { name: '경기 배속 전환', exact: true });
			const canvas = page.getByRole('button', { name: /^구슬 경기 화면/ });
			await expect(page.locator('.stage-state')).toHaveText('경기 중');
			await canvas.tap();
			await expect(speed).toHaveText('2배속');
			await canvas.tap();
			await expect(speed).toHaveText('1배속');
			await page.getByRole('button', { name: '전체 맵', exact: true }).tap();
			await expect(speed).toHaveText('1배속');
			expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(
				true
			);
		} finally {
			await context.close();
		}
	});
	test('첫 충돌과 결승 충돌이 들리고 자동 카메라는 위로 되돌아가지 않는다', async ({ page }) => {
		test.setTimeout(140000);
		await page.addInitScript(() => {
			window.__raceAudio = [];
			window.__finaleShown = false;
			const originalSource = AudioContext.prototype.createBufferSource;
			AudioContext.prototype.createBufferSource = function () {
				const source = originalSource.call(this),
					originalStart = source.start;
				source.start = function (...args) {
					window.__raceAudio.push({
						finale: window.__finaleShown,
						clock: document.querySelector('.race-stats > span:nth-child(2)')?.textContent
					});
					return originalStart.apply(this, args);
				};
				return source;
			};
			const originalText = CanvasRenderingContext2D.prototype.fillText;
			CanvasRenderingContext2D.prototype.fillText = function (text, ...args) {
				if (text === '회전 판을 지나 골인하세요!') window.__finaleShown = true;
				return originalText.call(this, text, ...args);
			};
		});
		await page.goto('/marble-race');
		await page
			.getByRole('textbox', { name: '참가자 이름' })
			.fill(Array.from({ length: 30 }, (_, i) => `구슬${i + 1}`).join('\n'));
		await page.getByRole('button', { name: '구슬 굴리기 ▶', exact: true }).first().click();
		await page.evaluate(() => {
			window.__views = [];
			window.__viewTimer = setInterval(() => {
				const t = document.querySelector('canvas').getContext('2d').getTransform();
				window.__views.push({ top: -t.f / t.d, scale: t.a, finale: window.__finaleShown });
			}, 50);
		});
		await page.waitForFunction(() => window.__raceAudio.length > 0, null, { timeout: 6000 });
		// 첫 충돌과 실제 출력 연결은 marble-audio-e2e에서 두 브라우저로 검사한다.
		await page.getByRole('button', { name: '경기 배속 전환', exact: true }).click();
		await expect(page.locator('.stage-state')).toHaveText('경기 종료', { timeout: 125000 });
		const result = await page.evaluate(() => {
			clearInterval(window.__viewTimer);
			return { audio: window.__raceAudio, views: window.__views };
		});
		expect(result.audio.some((event) => event.finale)).toBe(true);
		for (let i = 1; i < result.views.length; i++) {
			if (!result.views[i].finale) {
				expect(result.views[i].top).toBeGreaterThanOrEqual(result.views[i - 1].top - 0.001);
				expect(result.views[i].scale).toBeCloseTo(result.views[0].scale, 6);
			}
			expect(result.views[i].scale).toBeLessThanOrEqual(result.views[0].scale * 2.4 + 0.001);
		}
	});
	test('경기 중 화면 크기와 전체화면을 바꿔도 카메라와 소리가 멈추지 않는다', async ({ page }) => {
		await page.goto('/marble-race');
		await page.getByRole('button', { name: '구슬 굴리기 ▶', exact: true }).first().click();
		await page.getByRole('button', { name: '경기 배속 전환', exact: true }).click();
		await page.waitForTimeout(1500);
		await page.setViewportSize({ width: 390, height: 844 });
		await page.getByRole('button', { name: '경기장 전체화면', exact: true }).click();
		const before = await page.locator('.race-stats').innerText();
		await page.waitForTimeout(1500);
		expect(await page.locator('.race-stats').innerText()).not.toBe(before);
		expect(
			await page.locator('canvas').evaluate((canvas) => {
				const t = canvas.getContext('2d').getTransform();
				return [t.a, t.d, t.e, t.f].every(Number.isFinite);
			})
		).toBe(true);
		await page.getByRole('button', { name: '전체화면 닫기', exact: true }).click();
		await page.setViewportSize({ width: 1440, height: 1000 });
		await expect(page.locator('.stage-state')).toHaveText('경기 중');
	});
	for (const [mode, map, count] of [
		['첫 번째', '도각도각 키보드', 1],
		['마지막', '도각도각 키보드', 1],
		['여러 명', '도각도각 키보드', 2],
		['n번째', '도각도각 키보드', 1]
	]) {
		test(`${mode}: 중복 이름을 별도 구슬로 처리하고 최종 당첨자를 표시한다`, async ({ page }) => {
			test.setTimeout(170000);
			await page.goto('/marble-race');
			await page
				.getByRole('textbox', { name: '참가자 이름' })
				.fill('같은 이름\n같은 이름\n다른 이름');
			await page.getByRole('button', { name: new RegExp('^' + map + '$') }).click();
			await page.getByRole('button', { name: mode, exact: true }).click();
			if (mode === 'n번째') await page.getByRole('spinbutton', { name: '당첨 순번' }).fill('2');
			if (mode === '여러 명') await page.getByRole('spinbutton', { name: '당첨 인원' }).fill('2');
			await page.getByRole('button', { name: '구슬 굴리기 ▶', exact: true }).first().click();
			await expect(page.locator('.stage-state')).toHaveText('경기 종료', { timeout: 155000 });
			await expect(page.locator('.winner-names > span')).toHaveCount(count);
			await expect(
				page.getByRole('region', { name: '구슬 도착 순위', exact: true }).locator('li')
			).toHaveCount(3);
			await expect(
				page.getByRole('button', { name: '결과 복사', exact: true }).first()
			).toBeVisible();
		});
	}
});

test('이전 맵3종을 연결하고 저장 명단과 나머지 설정을 보존한다', async ({ page }) => {
	for (const [oldId, name] of [
		['workshop', '도각도각 키보드'],
		['toys', '톡톡 나무공방'],
		['bounce', '뽁뽁 물놀이']
	]) {
		await page.addInitScript(
			({ oldId }) =>
				localStorage.setItem(
					'lake.marble-race.v1',
					JSON.stringify({
						namesText: '보존 이름\n다른 이름',
						mapId: oldId,
						mode: 'multiple',
						count: 2,
						soundEnabled: false,
						volume: 30
					})
				),
			{ oldId }
		);
		await page.goto('/marble-race');
		await expect(page.getByRole('textbox', { name: '참가자 이름' })).toHaveValue(
			'보존 이름\n다른 이름'
		);
		await expect(page.getByRole('button', { name, exact: true })).toHaveAttribute(
			'aria-pressed',
			'true'
		);
		await expect(page.getByRole('button', { name: '여러 명', exact: true })).toHaveAttribute(
			'aria-pressed',
			'true'
		);
		await expect(page.getByRole('spinbutton', { name: '당첨 인원' })).toHaveValue('2');
	}
});

test('뽁뽁이를 미리 듣고 비활성 재질 없이 경기한다', async ({ page }) => {
	const requests = [];
	page.on('request', (r) => {
		if (r.url().includes('/audio/marble-race/')) requests.push(r.url());
	});
	await page.goto('/marble-race');
	expect(await page.locator('main').ariaSnapshot()).toContain('블록 도감');
	for (const name of ['슬라임', '키네틱 샌드', '비누', '왁뿌볼', '물풍선'])
		await expect(
			page
				.locator('[aria-labelledby=block-library-title]')
				.getByRole('button', { name: new RegExp(name) })
		).toHaveCount(0);
	await page.getByRole('button', { name: /뽁뽁이 소리/ }).click();
	await expect
		.poll(() => requests.filter((url) => url.endsWith('wrap-pop-ai-v1.wav')).length)
		.toBe(1);
	await page.getByRole('button', { name: '톡톡 나무공방', exact: true }).click();
	await page.getByRole('button', { name: '구슬 굴리기 ▶', exact: true }).first().click();
	await expect(page.locator('.stage-state')).toHaveText('경기 중');
	expect(requests.every((url) => !/\/(slime|sand|soap)[-]/.test(url))).toBe(true);
	expect(requests.filter((url) => url.endsWith('wrap-pop-ai-v1.wav'))).toHaveLength(1);
});

test('물풍선은 제외하고 코르크·나무는 도감과 맵에서 같은 음원으로 재생한다', async ({ page }) => {
	const requests = [];
	page.on('request', (r) => {
		if (r.url().includes('/audio/marble-race/')) requests.push(r.url());
	});
	await page.goto('/marble-race');
	await page.getByRole('button', { name: '도각도각 키보드', exact: true }).click();
	expect(await page.locator('main').ariaSnapshot()).toContain('블록 도감');
	const capsule = page.getByRole('button', { name: /물풍선 소리 미리듣기/ });
	await expect(capsule).toHaveCount(0);
	await page.getByRole('button', { name: '구슬 굴리기 ▶', exact: true }).first().click();
	await expect(page.locator('.stage-state')).toHaveText('경기 중');
	expect(requests.some((url) => /wood-[12]/.test(url))).toBe(false);
	await editSettings(page);
	await page.locator('canvas').evaluate((canvas) => {
		canvas.setAttribute('data-audio-diagnostics', '');
		window.__newBlockSounds = [];
		canvas.addEventListener('marble-audio', (event) => {
			if (event.detail.kind === 'played') window.__newBlockSounds.push(event.detail.type);
		});
	});
	const played = (type) =>
		expect
			.poll(() => page.evaluate((type) => window.__newBlockSounds.includes(type), type))
			.toBe(true);
	await expect(page.getByRole('button', { name: /ASMR 캡슐 소리/ })).toHaveCount(0);
	const wood = page.getByRole('button', { name: /나무 소리 미리듣기/ });
	await expect(wood.locator('small')).toHaveCount(0);
	await wood.click();
	await played('wood');
	await expect.poll(() => requests.filter((url) => /wood-[12]\.wav$/.test(url)).length).toBe(2);
	const cork = page.getByRole('button', { name: /코르크 소리 미리듣기/ });
	await expect(cork.locator('small')).toHaveCount(0);
	await cork.click();
	await played('cork');
	await expect
		.poll(() => requests.filter((url) => /cork-pop-b-ai-[12]\.wav$/.test(url)).length)
		.toBe(2);
	for (const [type, name] of [
		['ember', '불씨'],
		['droplet', '물방울'],
		['frog', '개구리'],
		['duck', '오리']
	]) {
		await page.getByRole('button', { name: new RegExp(`${name} 소리 미리듣기`) }).click();
		await played(type);
	}
	await page.getByRole('button', { name: /청축 키보드 소리 미리듣기/ }).click();
	await played('clicky');
	await expect
		.poll(() => requests.some((url) => url.endsWith('clicky-keyboard-press-ai-v1.wav')))
		.toBe(true);
	await expect(page.locator('.stage-state')).toHaveText('출발 준비');
});

test('도감11종을 게임 타일 이미지로 표시하고 각 맵의 음원만 준비한다', async ({ page }) => {
	const requests = [];
	page.on('request', (request) => {
		if (request.url().includes('/audio/marble-race/'))
			requests.push(new URL(request.url()).pathname);
	});
	for (const map of MAPS) {
		await page.goto('/marble-race');
		expect(await page.locator('[aria-labelledby=block-library-title]').ariaSnapshot()).toContain(
			'블록 도감'
		);
		const pictures = page.locator('[aria-labelledby=block-library-title] img');
		await expect(pictures).toHaveCount(11);
		await expect
			.poll(() =>
				pictures.evaluateAll((images) =>
					images.every((img) => img.complete && img.naturalWidth === 96)
				)
			)
			.toBe(true);
		const sources = await pictures.evaluateAll((images) => images.map((img) => img.src));
		expect(new Set(sources).size).toBe(11);
		expect(sources.every((src) => src.startsWith('data:image/png;base64,'))).toBe(true);
		await page.getByRole('button', { name: map.name, exact: true }).click();
		await expect(page.locator('.map-material')).toHaveCount(4);
		requests.length = 0;
		await page.getByRole('button', { name: '구슬 굴리기 ▶', exact: true }).first().click();
		await expect(page.locator('.stage-state')).toHaveText('경기 중');
		expect(requests.slice().sort()).toEqual(
			[...new Set(map.types.flatMap((type) => SOUND_FILES[type]))].sort()
		);
	}
	await editSettings(page);
	await page
		.locator('[aria-labelledby=block-library-title]')
		.screenshot({ path: 'output/playwright/block-library-game-tiles.png' });
});
