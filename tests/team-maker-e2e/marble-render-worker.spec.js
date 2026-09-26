import { test, expect } from '@playwright/test';
import { readFileSync, readdirSync } from 'node:fs';

// 실제 build의 Worker를 메인 스레드의 같은 OffscreenCanvas 계산과 비교한다.
// HTML Canvas와 OffscreenCanvas의 블록 가장자리 처리 차이를 전송 오류와 구분한다.
test('1000개 그리기 Worker는 글꼴·스킬·크기·초기화 변경을 같은 픽셀로 표시한다', async ({
	page
}, testInfo) => {
	test.setTimeout(60000);
	const workerUrl =
		process.env.MARBLE_DEV === '1'
			? '/src/lib/marble-race/render-worker.js'
			: '/_app/immutable/workers/' +
				readdirSync('build/_app/immutable/workers').find((name) =>
					/^render-worker-.*\.js$/.test(name)
				);
	await page.route('**/__marble/*.js', async (route) => {
		const name = new URL(route.request().url()).pathname.split('/').pop();
		let source = readFileSync(
			new URL(`../../src/lib/marble-race/${name}`, import.meta.url),
			'utf8'
		);
		if (name === 'display-renderer.js')
			source = source.replace("'./render-worker.js'", JSON.stringify(workerUrl));
		await route.fulfill({ contentType: 'text/javascript', body: source });
	});
	await page.goto('/marble-race');
	expect(await page.locator('main').ariaSnapshot()).toContain('레이스 시작');
	const results = await page.evaluate(async () => {
		const [{ createRace }, { createRenderer }, { createDisplayRenderer }] = await Promise.all([
			import('/__marble/physics.js'),
			import('/__marble/renderer.js'),
			import('/__marble/display-renderer.js')
		]);
		await document.fonts.load('800 18px SUIT', '구슬1000');
		await document.fonts.ready;
		const reference = new OffscreenCanvas(1, 1),
			shown = document.createElement('canvas');
		reference.getContext('2d', { willReadFrequently: false });
		shown.getContext('2d', { willReadFrequently: false });
		const a = createRenderer(reference),
			b = createDisplayRenderer(shown);
		const ctx = shown.getContext('2d'),
			draw = ctx.drawImage.bind(ctx);
		let paints = 0;
		ctx.drawImage = (...args) => {
			draw(...args);
			paints++;
		};
		let race = createRace(
			Array.from({ length: 1000 }, (_, i) => `구슬${i}Long이름`),
			'keyboard',
			47,
			{ skillsEnabled: true }
		);
		race.identity = 'first';
		for (const m of race.marbles) {
			m.x = 25 + (m.id % 25) * 28;
			m.y = 35 + Math.floor(m.id / 25) * 28;
		}
		let options = {
			bounds: { width: 349, height: 480 },
			view: { scale: 349 / 720, left: 0, top: 0 },
			skillsEnabled: true,
			reduced: false,
			focusId: '-1'
		};
		const results = [];
		try {
			for (let stage = 0; stage < 11; stage++) {
				if (stage === 1) options.focusId = '4';
				if (stage === 2) {
					race.time = 0.4;
					race.marbles[4].held = { kind: 'lightning', until: 2 };
					race.marbles[5].held = { kind: 'frost', until: 2 };
				}
				if (stage === 3) {
					race.time = 0.5;
					race.marbles[4].x = 250;
					race.marbles[4].y = 200;
				}
				if (stage === 4)
					options = {
						...options,
						bounds: { width: 720, height: 1000 },
						view: { scale: 1, left: 0, top: 0 }
					};
				if (stage === 5) options.overview = true;
				if (stage === 6) {
					options.overview = false;
					options.view.top = race.zones[0].y - 40;
					race.blocks[3].alive = false;
				}
				if (stage === 7) {
					race.time = 0.55;
					const event = { ...race.blocks[4], blockId: race.blocks[4].id, broken: true };
					a.addEvents([event], false);
					b.addEvents([event], race.identity);
				}
				if (stage === 8) {
					options.view.top = race.layout.finale.start;
					race.time = 2;
				}
				if (stage === 9) {
					race = createRace(Array(1000).fill('새 경기'), 'keyboard', 12);
					race.identity = 'second';
					options.view.top = 0;
				}
				if (stage === 10) {
					race = { ...race, identity: 'preview', preview: true };
				}
				a.render(race, options);
				const before = paints;
				b.render(race, options);
				const deadline = performance.now() + 5000;
				while (paints === before && performance.now() < deadline)
					await new Promise((resolve) => setTimeout(resolve, 10));
				if (paints === before) throw Error('Worker 그림 수신 시간 초과');
				const left = reference
					.getContext('2d')
					.getImageData(0, 0, reference.width, reference.height).data;
				const right = ctx.getImageData(0, 0, shown.width, shown.height).data;
				let difference = 0,
					maximumError = 0,
					minX = 99999,
					minY = 99999,
					maxX = 0,
					maxY = 0;
				for (let i = 0; i < left.length; i++)
					if (left[i] !== right[i]) {
						difference++;
						maximumError = Math.max(maximumError, Math.abs(left[i] - right[i]));
						const x = Math.floor(i / 4) % reference.width,
							y = Math.floor(i / 4 / reference.width);
						minX = Math.min(minX, x);
						maxX = Math.max(maxX, x);
						minY = Math.min(minY, y);
						maxY = Math.max(maxY, y);
					}
				results.push({
					stage,
					difference,
					maximumError,
					minX,
					minY,
					maxX,
					maxY,
					width: shown.width,
					height: shown.height,
					...(difference
						? {
								reference: (() => {
									const c = document.createElement('canvas');
									c.width = reference.width;
									c.height = reference.height;
									c.getContext('2d').drawImage(reference, 0, 0);
									return c.toDataURL();
								})(),
								shown: shown.toDataURL()
							}
						: {})
				});
			}
		} finally {
			b.destroy();
		}
		return results;
	});
	for (const r of results) {
		if (r.reference) {
			await testInfo.attach(`reference-${r.stage}`, {
				body: Buffer.from(r.reference.split(',')[1], 'base64'),
				contentType: 'image/png'
			});
			await testInfo.attach(`worker-${r.stage}`, {
				body: Buffer.from(r.shown.split(',')[1], 'base64'),
				contentType: 'image/png'
			});
			delete r.reference;
			delete r.shown;
		}
	}
	console.log('Worker 그림 비교', JSON.stringify(results));
	expect(results.every((result) => result.difference === 0)).toBe(true);
});

for (const width of [1440, 390])
	test(`${width}px 큰 경기의 그리기 Worker는 정지·재개·초기화·화면 종료를 따른다`, async ({
		page
	}) => {
		await page.setViewportSize({ width, height: 1000 });
		await page.addInitScript(() => {
			window.__renderWorkers = 0;
			window.__workerPaints = 0;
			const NativeWorker = window.Worker;
			window.Worker = class extends NativeWorker {
				constructor(url, ...args) {
					super(url, ...args);
					this.rendering = String(url).includes('render-worker');
					if (this.rendering) {
						window.__renderWorkers++;
						this.addEventListener('message', ({ data }) => {
							if (data.kind === 'painted') window.__workerPaints++;
						});
					}
				}
				terminate() {
					if (this.rendering) {
						window.__renderWorkers--;
						this.rendering = false;
					}
					super.terminate();
				}
			};
		});
		await page.goto('/marble-race');
		expect(await page.locator('main').ariaSnapshot()).toContain('레이스 시작');
		const start = page.getByRole('button', { name: '레이스 시작 ▶', exact: true }).first();
		await expect(start).toBeEnabled();
		await page.getByLabel('참가자 이름').fill('공*1000');
		await page.getByRole('button', { name: '♫ 소리 켜짐', exact: true }).click();
		await start.click();
		await expect(page.locator('.stage-state')).toHaveText('경기 중');
		await expect.poll(() => page.evaluate(() => window.__workerPaints)).toBeGreaterThan(2);
		await page.getByRole('button', { name: '일시정지 Ⅱ', exact: true }).click();
		await expect(page.locator('.stage-state')).toHaveText('일시정지');
		await page.getByRole('button', { name: '계속하기 ▶', exact: true }).first().click();
		await expect(page.locator('.stage-state')).toHaveText('경기 중');
		await page.getByRole('button', { name: '일시정지 Ⅱ', exact: true }).click();
		await page.getByRole('button', { name: '종료하고 설정 변경', exact: true }).click();
		await expect(page.locator('.stage-state')).toHaveText('출발 준비');
		await expect.poll(() => page.evaluate(() => window.__renderWorkers)).toBe(0);
		await page.getByLabel('참가자 이름').fill('새 구슬*1000');
		await expect(start).toBeEnabled();
		await start.click();
		await expect.poll(() => page.evaluate(() => window.__renderWorkers)).toBe(1);
		await page
			.locator('.race-stage')
			.screenshot({ path: `.context/render-worker-stage-${width}.png` });
		// SvelteKit 화면 전환의 정리 함수를 실행한다.
		await page.evaluate(() => {
			const link = document.createElement('a');
			link.href = '/qr-code';
			link.textContent = '다른 도구';
			document.body.append(link);
			link.click();
		});
		await expect(page).toHaveURL(/\/qr-code/);
		await expect.poll(() => page.evaluate(() => window.__renderWorkers)).toBe(0);
	});
