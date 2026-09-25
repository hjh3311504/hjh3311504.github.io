import { installMarbleWire } from './helpers/marble-wire.js';
import { test, expect } from '@playwright/test';

test('결승 선두 표식은 즉시 바꾸고 카메라는 부드럽게 따라간다', async ({ page }) => {
	await installMarbleWire(page);
	await page.emulateMedia({ reducedMotion: 'no-preference' });
	await page.addInitScript(() => {
		window.__testLeader = 0;
		const NativeWorker = window.Worker;
		// 화면 전달 경계에서 재현 가능한 두 후보 상태를 제공한다. 후보 판정은 단위 검사에서 검증한다.
		window.Worker = class extends NativeWorker {
			constructor(...args) {
				super(...args);
				this.addEventListener('message', ({ data }) => {
					if (data.kind === 'ready') this.initialState = structuredClone(data.state);
				});
			}
			postMessage(data) {
				if (data.kind !== 'advance' || !this.initialState) return super.postMessage(data);
				const state = structuredClone(this.initialState);
				const leader = window.__testLeader;
				state.initial = false;
				state.blockChanges = [];
				state.time = 20 + (this.frames = (this.frames ?? 0) + 1) / 120;
				state.events = [];
				state.marbles.forEach((m, i) => {
					m.x = i === 0 ? 260 : 460;
					m.y = state.layout.finale.start + (i === leader ? 200 : 160);
				});
				state.cinematic = { active: true, focusId: leader, newWinners: [] };
				window.__packMarbleState(state);
				queueMicrotask(() =>
					this.dispatchEvent(
						new MessageEvent('message', {
							data: { kind: 'frame', state, unused: 0 }
						})
					)
				);
			}
		};
		const originalArc = CanvasRenderingContext2D.prototype.arc;
		const originalStroke = CanvasRenderingContext2D.prototype.stroke;
		const originalBegin = CanvasRenderingContext2D.prototype.beginPath;
		CanvasRenderingContext2D.prototype.beginPath = function (...args) {
			this.__lastArc = null;
			return originalBegin.apply(this, args);
		};
		CanvasRenderingContext2D.prototype.arc = function (x, y, radius, ...args) {
			this.__lastArc = { x, y, radius };
			return originalArc.call(this, x, y, radius, ...args);
		};
		CanvasRenderingContext2D.prototype.stroke = function (...args) {
			const ring = this.__lastArc;
			if (ring?.radius === 18 && this.strokeStyle === '#ffffff' && this.canvas.isConnected) {
				const t = this.getTransform();
				const observation = {
					id: ring.x === 260 ? 0 : 1,
					zoom:
						t.a /
						devicePixelRatio /
						Math.min(this.canvas.clientWidth / 720, this.canvas.clientHeight / 680),
					x: (t.a * ring.x + t.e) / devicePixelRatio,
					y: (t.d * ring.y + t.f) / devicePixelRatio,
					width: this.canvas.width / devicePixelRatio,
					height: this.canvas.height / devicePixelRatio
				};
				if (window.__focusObservation?.id !== observation.id)
					window.__firstFocusFrame = observation;
				window.__focusObservation = observation;
			}
			return originalStroke.apply(this, args);
		};
	});
	await page.goto('/marble-race');
	expect(await page.locator('main').ariaSnapshot()).toContain('레이스 시작');
	await expect(
		page.getByRole('button', { name: '레이스 시작 ▶', exact: true }).first()
	).toBeEnabled();
	await page.getByLabel('참가자 이름').fill('앞구슬\n뒤구슬');
	await page.getByRole('button', { name: '♫ 소리 켜짐', exact: true }).click();
	await page.getByRole('button', { name: '레이스 시작 ▶', exact: true }).first().click();
	await expect.poll(() => page.evaluate(() => window.__focusObservation?.id)).toBe(0);
	await expect(page.getByRole('button', { name: '경기 배속 전환', exact: true })).toHaveText(
		'0.25배속'
	);
	await expect(page.getByText(/당첨 확정까지.*배속으로 진행합니다/)).toHaveCount(0);
	await expect
		.poll(() => page.evaluate(() => window.__focusObservation?.zoom))
		.toBeGreaterThan(2.35);
	await page.evaluate(() => {
		window.__testLeader = 1;
	});
	await expect.poll(() => page.evaluate(() => window.__firstFocusFrame?.id)).toBe(1);
	const first = await page.evaluate(() => window.__firstFocusFrame);
	expect(Math.abs(first.x - first.width / 2)).toBeGreaterThan(20);
	await expect
		.poll(() =>
			page.evaluate(() => {
				const current = window.__focusObservation;
				return Math.abs(current.x - current.width / 2);
			})
		)
		.toBeLessThan(2);
	await page.evaluate(() => {
		window.__testLeader = 0;
	});
	await expect.poll(() => page.evaluate(() => window.__firstFocusFrame?.id)).toBe(0);
	const again = await page.evaluate(() => window.__firstFocusFrame);
	expect(Math.abs(again.x - again.width / 2)).toBeGreaterThan(20);
	await expect
		.poll(() =>
			page.evaluate(() => {
				const current = window.__focusObservation;
				return Math.abs(current.x - current.width / 2);
			})
		)
		.toBeLessThan(2);
});
