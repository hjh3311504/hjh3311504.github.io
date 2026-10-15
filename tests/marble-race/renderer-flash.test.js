import test from 'node:test';
import assert from 'node:assert/strict';
import { createRenderer } from '../../src/lib/marble-race/renderer.js';
import { createRace } from '../../src/lib/marble-race/physics.js';

// 실제 Canvas 없이 채우기 호출과 그때의 색·투명도만 기록한다.
function mockContext(record) {
	const state = { fillStyle: '#000000', globalAlpha: 1 };
	return new Proxy(state, {
		get(target, prop) {
			if (prop in target) return target[prop];
			if (prop === 'measureText') return () => ({ width: 10 });
			if (typeof prop === 'string' && prop.startsWith('create'))
				return () => ({ addColorStop() {} });
			if (prop === 'getTransform') return () => ({ a: 1, b: 0, c: 0, d: 1, e: 0, f: 0 });
			return (...args) => record?.(prop, target, args);
		},
		set(target, prop, value) {
			target[prop] = value;
			return true;
		}
	});
}
function mockCanvas(record) {
	const ctx = mockContext(record);
	return {
		width: 1,
		height: 1,
		ownerDocument: { createElement: () => mockCanvas() },
		getContext: () => ctx
	};
}

test('결승 벽·통로·회전바는 부딪혀도 번쩍이지 않고 다른 블록은 번쩍인다', () => {
	const fills = [];
	const renderer = createRenderer(
		mockCanvas((name, state) => {
			if (name === 'fill') fills.push({ style: state.fillStyle, alpha: state.globalAlpha });
		})
	);
	const race = createRace(['가', '나'], 'keyboard', 47);
	Object.assign(race, { identity: Symbol(), finished: [], time: 1 });
	for (const marble of race.marbles) marble.y = 0;
	const { start } = race.layout.finale;
	const finale = race.blocks.filter((b) => b.zoneId === 'finale');
	const pin = race.blocks.find((b) => b.zoneId !== 'finale' && b.y > start - 300 && b.y < start);
	assert.ok(finale.some((b) => b.id === 'finale-bar'));
	assert.ok(pin);
	// 충돌 직후 번쩍임은 흰색을 투명도0.35로 덮는다.
	const flashes = () =>
		fills.filter((f) => f.style === '#ffffff' && Math.abs(f.alpha - 0.35) < 1e-9).length;
	const options = {
		view: { left: 0, top: start - 300, scale: 1 },
		bounds: { width: 720, height: 1100 },
		pixelRatio: 1
	};
	for (const block of finale) block.flash = race.time;
	renderer.render(race, options);
	assert.equal(flashes(), 0);
	fills.length = 0;
	pin.flash = race.time;
	renderer.render(race, options);
	assert.equal(flashes(), 1);
});
