import { expect, test } from '@playwright/test';

test.use({ reducedMotion: 'no-preference' });

async function openWheel(page) {
	await page.addInitScript(() => {
		window.__pinSources = [];
		const createSource = AudioContext.prototype.createBufferSource;
		AudioContext.prototype.createBufferSource = function () {
			const source = createSource.call(this);
			const start = source.start.bind(source);
			const stop = source.stop.bind(source);
			const entry = { ended: false, stopped: false };
			source.start = (when = 0) => {
				const wheel = document.querySelector('#wheel');
				const transition = wheel
					?.getAnimations()
					.find((item) => item.transitionProperty === 'transform');
				Object.assign(entry, {
					when,
					now: this.currentTime,
					elapsed: Number(transition?.currentTime),
					from: transition?.effect.getKeyframes()[0].transform,
					to: wheel?.style.transform,
					duration: source.buffer.duration
				});
				window.__pinSources.push(entry);
				start(when);
			};
			source.stop = (...args) => {
				entry.stopped = true;
				return stop(...args);
			};
			source.addEventListener('ended', () => {
				entry.ended = true;
			});
			return source;
		};
	});
	await page.goto('/team-maker');
	await page.getByRole('button', { name: '일괄 추가' }).click();
	await page.getByRole('textbox', { name: '추가할 참가자 이름' }).fill('가영\n나연\n다현\n라희');
	await page.getByRole('button', { name: '명단에 4명 추가' }).click();
	await page.getByRole('button', { name: '팀 만들기' }).click();
	await page.getByRole('button', { name: '1팀 승리 기록' }).click();
	await page.getByRole('button', { name: '1팀에서 한 명 뽑기' }).click();
	return page.getByRole('dialog', { name: '1팀 뽑기' });
}

test('실제 CSS 회전과 같은 시각에 핀 소리를 예약하고 감속·다음 회전에도 맞춘다', async ({
	page
}) => {
	const errors = [];
	page.on('pageerror', (error) => errors.push(error.message));
	const dialog = await openWheel(page);
	await dialog.getByRole('button', { name: '돌리기', exact: true }).click();
	await expect.poll(() => page.evaluate(() => window.__pinSources.length)).toBeGreaterThan(20);
	const sources = await page.evaluate(() => window.__pinSources);
	expect(sources.length).toBeLessThan(90);
	expect(
		sources.every((item) => Math.abs(item.duration - 0.07) < 0.001 && item.when >= item.now)
	).toBe(true);
	const starts = sources.map((item) => item.when);
	const gaps = starts.slice(1).map((time, index) => time - starts[index]);
	expect(gaps.every((gap, index) => !index || gap >= gaps[index - 1] - 1e-6)).toBe(true);
	expect(starts.every((time, index) => !index || time - starts[index - 1] >= 1 / 24 - 1e-6)).toBe(
		true
	);
	expect(starts.at(-1) - starts.at(-2)).toBeGreaterThan((starts[1] - starts[0]) * 10);
	// 이 명단의 마지막 핀은 정지 각도와 일치한다. 예약 시각끼리 비교하면
	// 각 source.start 호출 사이에 갱신되는 오디오 시계의 영향을 받지 않는다.
	const origin = starts.at(-1) - 6.5;
	const observedOrigin = sources[0].now - sources[0].elapsed / 1000;
	expect(Math.abs(origin - observedOrigin)).toBeLessThan(0.01);
	for (const sample of sources.filter((_, index) => index % 20 === 0)) {
		const from = Number(sample.from.match(/-?[\d.]+/)[0]);
		const to = Number(sample.to.match(/-?[\d.]+/)[0]);
		const time = (sample.when - origin) / 6.5;
		let lo = 0,
			hi = 1;
		for (let n = 0; n < 40; n++) {
			const t = (lo + hi) / 2;
			const x = 0.3 * t * (1 - t) ** 2 + 0.18 * t * t * (1 - t) + t ** 3;
			if (x < time) lo = t;
			else hi = t;
		}
		const t = (lo + hi) / 2;
		const angle = from + (to - from) * (2.16 * t * (1 - t) ** 2 + 3 * t * t * (1 - t) + t ** 3);
		expect(Math.abs(angle / 15 - Math.round(angle / 15))).toBeLessThan(0.001);
	}
	await expect(dialog.locator('.wheel-outcome-name')).toBeVisible({ timeout: 8500 });
	await expect
		.poll(() => page.evaluate(() => window.__pinSources.every((item) => item.ended)))
		.toBe(true);
	await expect(dialog.locator('.wheel-label')).toHaveCount(1);
	await dialog.getByRole('button', { name: '다음 당첨자 뽑기' }).click();
	await expect
		.poll(() => page.evaluate(() => window.__pinSources.length))
		.toBeGreaterThan(sources.length);
	const second = await page.evaluate((count) => window.__pinSources.slice(count), sources.length);
	expect(Number(second[0].from.match(/-?[\d.]+/)[0])).toBeGreaterThan(2800);
	await dialog.getByRole('button', { name: '바로 뽑기' }).click();
	expect(
		await page.evaluate(() => window.__pinSources.every((item) => item.ended || item.stopped))
	).toBe(true);
	expect(errors).toEqual([]);
});

test('회전 중에는 당첨 명단 삭제를 막고 종료 후에는 삭제할 수 있다', async ({ page }) => {
	const dialog = await openWheel(page);
	await dialog.getByRole('button', { name: '돌리기', exact: true }).click();
	await expect.poll(() => page.evaluate(() => window.__pinSources.length)).toBeGreaterThan(0);
	await dialog.getByRole('button', { name: '바로 뽑기' }).click();
	await expect(dialog.locator('.wheel-label')).toHaveCount(1);
	const clearButton = dialog.getByRole('button', { name: '명단 삭제' });
	await expect(clearButton).toBeEnabled();
	const firstCount = await page.evaluate(() => window.__pinSources.length);
	await dialog.getByRole('button', { name: '다음 당첨자 뽑기' }).click();
	await expect
		.poll(() => page.evaluate(() => window.__pinSources.length))
		.toBeGreaterThan(firstCount);
	await expect(clearButton).toBeDisabled();
	// 이미 전달된 클릭 이벤트가 있어도 진행 중인 추첨을 초기화하지 않는다.
	await clearButton.evaluate((button) =>
		button.dispatchEvent(new MouseEvent('click', { bubbles: true }))
	);
	await expect(dialog.locator('#wheel-result')).toHaveText('돌리는 중…');
	await expect(dialog.locator('.wheel-picked-item')).toHaveCount(1);
	await dialog.getByRole('button', { name: '바로 뽑기' }).click();
	await expect(clearButton).toBeEnabled();
	await clearButton.click();
	await expect(dialog.locator('#wheel-result')).toHaveText('돌리기를 누르세요.');
	await expect(dialog.locator('.wheel-label')).toHaveCount(2);
	await expect(dialog.locator('.wheel-picked-item')).toHaveCount(0);
	expect(
		await page.evaluate(() => window.__pinSources.every((item) => item.ended || item.stopped))
	).toBe(true);
});

test('음소거·다시 켜기·바로 뽑기·화면 이탈이 예약된 소리까지 처리한다', async ({ page }) => {
	const dialog = await openWheel(page);
	await dialog.getByRole('button', { name: '돌리기', exact: true }).click();
	await expect.poll(() => page.evaluate(() => window.__pinSources.length)).toBeGreaterThan(0);
	await dialog.getByRole('button', { name: '효과음 끄기' }).click();
	const mutedCount = await page.evaluate(() => window.__pinSources.length);
	expect(
		await page.evaluate(() => window.__pinSources.every((item) => item.ended || item.stopped))
	).toBe(true);
	await page.waitForTimeout(500);
	expect(await page.evaluate(() => window.__pinSources.length)).toBe(mutedCount);
	await dialog.getByRole('button', { name: '효과음 켜기' }).click();
	await expect
		.poll(() => page.evaluate(() => window.__pinSources.length))
		.toBeGreaterThan(mutedCount);
	const resumed = await page.evaluate((count) => window.__pinSources.slice(count), mutedCount);
	expect(resumed.length).toBeLessThan(mutedCount);
	expect(resumed.every((item) => item.when >= item.now)).toBe(true);
	await dialog.getByRole('button', { name: '바로 뽑기' }).click();
	expect(
		await page.evaluate(() => window.__pinSources.every((item) => item.ended || item.stopped))
	).toBe(true);
	await page.keyboard.press('Escape');
	await page.locator('a[href="/"]').first().click();
	expect(
		await page.evaluate(() => window.__pinSources.every((item) => item.ended || item.stopped))
	).toBe(true);
});

test('동작 줄이기에서는 긴 회전음이나 핀 소리 묶음을 재생하지 않는다', async ({ page }) => {
	await page.emulateMedia({ reducedMotion: 'reduce' });
	const dialog = await openWheel(page);
	await dialog.getByRole('button', { name: '돌리기', exact: true }).click();
	await page.waitForTimeout(300);
	expect(await page.evaluate(() => window.__pinSources.length)).toBe(0);
	await dialog.getByRole('button', { name: '바로 뽑기' }).click();
	await expect(dialog.locator('.wheel-outcome-name')).toBeVisible();
});
