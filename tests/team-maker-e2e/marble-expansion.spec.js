import { test, expect } from '@playwright/test';
import { SOUND_FILES } from '../../src/lib/marble-race/audio.js';
const start = (page) => page.getByRole('button', { name: '구슬 굴리기 ▶', exact: true }).first();
test('경기 전 저장·곱하기·n번째·볼륨과 중복 재질 내 맵을 복원한다', async ({ page }) => {
	await page.goto('/marble-race');
	expect(await page.locator('main').ariaSnapshot()).toContain('내 맵 만들기');
	await page.getByLabel('참가자 이름').fill('토끼*1001');
	await page.getByRole('button', { name: 'n번째', exact: true }).click();
	await page.getByLabel('당첨 순번').fill('1001');
	await page.getByLabel('소리 크기').fill('27');
	await page.getByRole('button', { name: /내 맵 만들기/ }).click();
	const dialog = page.getByRole('dialog', { name: '내 맵 만들기' });
	await dialog.getByLabel('맵 이름').fill('같은 소리 네 번');
	for (let i = 1; i <= 4; i++) await dialog.getByLabel(`${i}구역`).selectOption('wood');
	await dialog.getByRole('button', { name: '저장하고 선택' }).click();
	await expect(page.getByRole('button', { name: '같은 소리 네 번', exact: true })).toHaveAttribute(
		'aria-pressed',
		'true'
	);
	await expect
		.poll(() => page.evaluate(() => JSON.parse(localStorage.getItem('lake.marble-race.v1'))?.nth))
		.toBe(1001);
	await page.reload();
	await expect(page.getByLabel('참가자 이름')).toHaveValue('토끼*1001');
	await expect(page.getByLabel('당첨 순번')).toHaveValue('1001');
	await expect(page.getByLabel('소리 크기')).toHaveValue('27');
	await expect(page.getByRole('button', { name: '같은 소리 네 번', exact: true })).toHaveAttribute(
		'aria-pressed',
		'true'
	);
	expect(
		await page.evaluate(
			() => JSON.parse(localStorage.getItem('lake.marble-race.custom-maps.v1'))[0].layers
		)
	).toEqual(Array(4).fill('wood'));
	await page.getByRole('button', { name: '삭제', exact: true }).click();
	await expect(page.getByRole('button', { name: '톡톡 나무공방', exact: true })).toHaveAttribute(
		'aria-pressed',
		'true'
	);
});
test('일시정지 패널 하나에서 계속하기·종료 후 편집과 미니맵을 제공한다', async ({ page }) => {
	await page.goto('/marble-race');
	expect(await page.locator('main').ariaSnapshot()).toContain('구슬 굴리기');
	await page.evaluate(() => {
		window.__loadingOverlaySeen = false;
		window.__playButton = document.querySelector('.play-controls button');
		window.__playButtonReplaced = false;
		new MutationObserver(() => {
			if (document.querySelector('.play-controls button') !== window.__playButton)
				window.__playButtonReplaced = true;
			if (
				[...document.querySelectorAll('.stage-overlay-card')].some((card) =>
					card.textContent.includes('경기를 준비하고 있어요')
				)
			)
				window.__loadingOverlaySeen = true;
		}).observe(document.querySelector('.race-stage'), { childList: true, subtree: true });
	});
	// 이 검사는 잠금·미니맵 UI를 검증하며 브라우저 오디오 실행 상태와 분리한다.
	await page.getByRole('button', { name: '♫ 소리 켜짐', exact: true }).click();
	await start(page).click();
	await expect(page.locator('.stage-state')).toHaveText('경기 중');
	await expect(
		page.getByText('경기 중에는 참가자·맵·당첨 방식을 변경할 수 없습니다.', { exact: true })
	).toBeVisible();
	await expect(
		page
			.locator('.play-controls')
			.getByRole('button', { name: '경기 종료하고 설정 변경', exact: true })
	).toHaveCount(0);
	const box = page.locator('.race-minimap svg > rect').last();
	const before = await box.getAttribute('y');
	await expect.poll(() => box.getAttribute('y'), { timeout: 10000 }).not.toBe(before);
	await page.getByRole('button', { name: '경기 종료하고 설정 변경', exact: true }).first().click();
	const panel = page.getByRole('region', { name: '일시정지' });
	await expect(panel).toBeVisible();
	await expect(panel).toHaveCount(1);
	await expect(page.getByRole('dialog', { name: '경기를 종료할까요?' })).toHaveCount(0);
	await expect(panel.getByRole('button', { name: '계속하기 ▶' })).toBeFocused();
	await expect(panel.getByText(/종료하면 현재 경기를 이어갈 수 없어요/)).toBeVisible();
	await panel.getByRole('button', { name: '계속하기 ▶' }).click();
	await expect(page.locator('.stage-state')).toHaveText('경기 중');
	expect(await page.evaluate(() => window.__loadingOverlaySeen)).toBe(false);
	expect(await page.evaluate(() => window.__playButtonReplaced)).toBe(false);
	await page.getByRole('button', { name: '일시정지 Ⅱ' }).click();
	await expect(panel).toBeVisible();
	await page.setViewportSize({ width: 390, height: 844 });
	await expect(panel.getByRole('button', { name: '종료하고 설정 변경' })).toBeVisible();
	await panel.getByRole('button', { name: '종료하고 설정 변경' }).click();
	await expect(panel).toHaveCount(0);
	await expect(page.getByLabel('참가자 이름')).toBeFocused();
	await expect(page.getByLabel('참가자 이름')).toBeEnabled();
	await expect(page.locator('.stage-state')).toHaveText('출발 준비');
});
test('백만 개 준비를 취소하고 현재 명단을 유지한다', async ({ page }) => {
	await page.goto('/marble-race');
	await page.getByRole('button', { name: '♫ 소리 켜짐' }).click();
	await page.getByLabel('참가자 이름').fill('토끼*1000000');
	await start(page).click();
	await expect(
		page.getByRole('button', { name: '준비 취소하고 설정 변경', exact: true }).first()
	).toBeVisible();
	await expect(page.locator('.stage-overlay-card')).toHaveCount(0);
	await expect(page.locator('.stage-state')).toContainText('준비');
	await expect(page.locator('.play-controls button')).toHaveCount(1);
	await expect(page.locator('.play-controls button')).toHaveText('구슬 굴리기 ▶');
	await expect(page.locator('.play-controls button')).toBeDisabled();
	await page.getByRole('button', { name: '준비 취소하고 설정 변경', exact: true }).click();
	await expect(page.getByLabel('참가자 이름')).toBeEnabled();
	await expect(page.getByLabel('참가자 이름')).toHaveValue('토끼*1000000');
	await page.waitForTimeout(300);
	await expect(page.locator('.stage-state')).toHaveText('출발 준비');
});
test('1,000개 경기에서 화면과 버튼 응답을 측정하고 목록을 일부만 그린다', async ({
	page
}, testInfo) => {
	test.setTimeout(45000);
	await page.goto('/marble-race');
	await page.getByLabel('참가자 이름').fill('구슬*1000');
	// 음원 로딩을 제외한 화면·Worker 성능을 측정한다.
	await page.getByRole('button', { name: '♫ 소리 켜짐', exact: true }).click();
	await start(page).click();
	await expect(page.locator('.stage-state')).toHaveText('경기 중', { timeout: 15000 });
	const metrics = await page.evaluate(
		() =>
			new Promise((resolve) => {
				const times = [];
				const start = performance.now();
				let last = start;
				const tick = (now) => {
					times.push(now - last);
					last = now;
					if (now - start >= 5000)
						resolve({
							fps: times.length / ((now - start) / 1000),
							frames: times.length,
							userAgent: navigator.userAgent,
							cores: navigator.hardwareConcurrency
						});
					else requestAnimationFrame(tick);
				};
				requestAnimationFrame(tick);
			})
	);
	const response = await page.evaluate(
		() =>
			new Promise((resolve) => {
				const button = [...document.querySelectorAll('button')].find((b) =>
					b.textContent.includes('일시정지')
				);
				const start = performance.now();
				const observer = new MutationObserver(() => {
					if (document.querySelector('.stage-state').textContent === '일시정지') {
						observer.disconnect();
						resolve(performance.now() - start);
					}
				});
				observer.observe(document.querySelector('.stage-state'), {
					childList: true,
					subtree: true,
					characterData: true
				});
				button.click();
			})
	);
	metrics.buttonMs = response;
	await testInfo.attach('1,000개 화면 성능', {
		body: JSON.stringify(metrics, null, 2),
		contentType: 'application/json'
	});
	console.log('대규모 경기 성능', JSON.stringify(metrics));
	expect(metrics.fps).toBeGreaterThanOrEqual(30);
	expect(response).toBeLessThanOrEqual(200);
	expect(
		await page.getByRole('region', { name: '구슬 도착 순위', exact: true }).locator('li').count()
	).toBeLessThan(30);
	await expect(page.locator('.race-stats')).toContainText('/ 1000 도착');
});

test('1,000개 전원 완주·실제 시간·전체 결과 복사와 확정 결과 보존', async ({
	page,
	context
}, info) => {
	test.setTimeout(300000);
	await context.grantPermissions(['clipboard-read', 'clipboard-write']);
	await page.goto('/marble-race');
	await page.getByLabel('참가자 이름').fill('완주*1000');
	await page.getByRole('button', { name: '도각도각 키보드', exact: true }).click();
	await start(page).click();
	await expect(page.locator('.stage-state')).toHaveText('경기 중', { timeout: 15000 });
	await page.evaluate(() => {
		window.__performance = {
			started: performance.now(),
			last: performance.now(),
			bucket: performance.now(),
			frames: 0,
			totalFrames: 0,
			minFps: Infinity
		};
		const frame = (now) => {
			const m = window.__performance;
			m.frames++;
			m.totalFrames++;
			if (now - m.bucket >= 1000) {
				m.minFps = Math.min(m.minFps, m.frames / ((now - m.bucket) / 1000));
				m.bucket = now;
				m.frames = 0;
			}
			m.last = now;
			if (document.querySelector('.stage-state').textContent !== '경기 종료')
				requestAnimationFrame(frame);
		};
		requestAnimationFrame(frame);
	});
	await expect(page.locator('.stage-state')).toHaveText('경기 종료', { timeout: 270000 });
	await expect(page.locator('.race-stats')).toContainText('1000 / 1000 도착');
	const stats = await page.evaluate(() => ({
		...window.__performance,
		wallSeconds: (performance.now() - window.__performance.started) / 1000,
		gameClock: document.querySelector('.race-stats>span:nth-child(2)').textContent
	}));
	console.log('1,000개 전체 경기', JSON.stringify(stats));
	await info.attach('1,000개 전체 경기', {
		body: JSON.stringify(stats, null, 2),
		contentType: 'application/json'
	});
	expect(stats.minFps).toBeGreaterThanOrEqual(30);
	const selected = await page.getByRole('complementary', { name: '확정 당첨자' }).innerText();
	await page.getByRole('button', { name: '마지막', exact: true }).click();
	await expect(page.getByRole('complementary', { name: '확정 당첨자' })).toHaveText(selected, {
		useInnerText: true
	});
	await page.getByRole('button', { name: '결과 복사', exact: true }).first().click();
	const copied = await page.evaluate(() => navigator.clipboard.readText());
	expect(copied).toContain('첫번째 도착 당첨자');
	expect(copied).toContain('1000등: 완주');
});

test('타자기를 도각2로 복구하고 도각3을 선택한 내 맵과 음원을 유지한다', async ({ page }) => {
	const requests = [];
	page.on('request', (r) => {
		if (r.url().includes('/audio/marble-race/')) requests.push(r.url());
	});
	await page.addInitScript(() => {
		if (sessionStorage.getItem('thock-migration-seeded')) return;
		sessionStorage.setItem('thock-migration-seeded', 'yes');
		localStorage.setItem(
			'lake.marble-race.v1',
			JSON.stringify({ namesText: '토끼*2', mapId: 'custom-keys', volume: 27 })
		);
		localStorage.setItem(
			'lake.marble-race.custom-maps.v1',
			JSON.stringify([
				{ id: 'custom-keys', name: '내 키보드', layers: ['typewriter', 'thock', 'popit', 'thock'] }
			])
		);
	});
	await page.goto('/marble-race');
	expect(await page.locator('main').ariaSnapshot()).toContain('도각 키보드2');
	await expect(page.getByLabel('참가자 이름')).toHaveValue('토끼*2');
	await expect(page.getByRole('button', { name: '내 키보드', exact: true })).toHaveAttribute(
		'aria-pressed',
		'true'
	);
	await page.getByRole('button', { name: '수정', exact: true }).click();
	const dialog = page.getByRole('dialog', { name: '내 맵 만들기' });
	await expect(dialog.getByLabel('1구역')).toHaveValue('thock2');
	await expect(dialog.getByRole('option', { name: '옛날 타자기', exact: true })).toHaveCount(0);
	await dialog.getByLabel('2구역').selectOption('thock3');
	await dialog.getByRole('button', { name: '저장하고 선택' }).click();
	await expect
		.poll(() =>
			page.evaluate(
				() => JSON.parse(localStorage.getItem('lake.marble-race.custom-maps.v1'))[0].layers
			)
		)
		.toEqual(['thock2', 'thock3', 'popit', 'thock']);
	await page.reload();
	await expect(page.getByLabel('소리 크기')).toHaveValue('27');
	await start(page).click();
	await expect(page.locator('.stage-state')).toHaveText('경기 중');
	for (const type of ['thock2', 'thock3'])
		expect(requests.some((url) => url.endsWith(SOUND_FILES[type][0]))).toBe(true);
	expect(requests.some((url) => url.includes('typewriter'))).toBe(false);
});
