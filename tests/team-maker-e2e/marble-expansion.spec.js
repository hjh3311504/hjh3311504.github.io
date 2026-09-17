import { test, expect } from '@playwright/test';
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
		.poll(() => page.evaluate(() => JSON.parse(localStorage.getItem('lake.marble-race.v1')).nth))
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
test('설정 잠금 이유·확인 취소·종료 후 편집과 미니맵을 제공한다', async ({ page }) => {
	await page.goto('/marble-race');
	await start(page).click();
	await expect(page.locator('.stage-state')).toHaveText('경기 중');
	await expect(
		page.getByText('경기 중에는 참가자·맵·당첨 방식을 변경할 수 없습니다.', { exact: true })
	).toBeVisible();
	const box = page.locator('.race-minimap svg > rect').last();
	const before = await box.getAttribute('y');
	await expect.poll(() => box.getAttribute('y'), { timeout: 10000 }).not.toBe(before);
	await page.getByRole('button', { name: '경기 종료하고 설정 변경', exact: true }).first().click();
	await expect(page.getByRole('dialog', { name: '경기를 종료할까요?' })).toBeVisible();
	await page.getByRole('button', { name: '경기로 돌아가기' }).click();
	await expect(page.locator('.stage-state')).toHaveText('경기 중');
	await page.getByRole('button', { name: '잠시 멈춤 Ⅱ' }).click();
	await expect(page.getByText(/일시정지 중에도 경기 설정/)).toBeVisible();
	await page.getByRole('button', { name: '경기 종료하고 설정 변경', exact: true }).first().click();
	await page.getByRole('button', { name: '종료하고 설정 변경', exact: true }).click();
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
	await page.getByRole('button', { name: '준비 취소하고 설정 변경', exact: true }).first().click();
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
					b.textContent.includes('잠시 멈춤')
				);
				const start = performance.now();
				const observer = new MutationObserver(() => {
					if (document.querySelector('.stage-state').textContent === '잠시 멈춤') {
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
	expect(copied).toContain('첫 번째 도착 당첨자');
	expect(copied).toContain('1000등: 완주');
});
