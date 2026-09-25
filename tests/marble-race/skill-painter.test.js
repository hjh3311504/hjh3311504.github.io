import test from 'node:test';
import assert from 'node:assert/strict';
import { drawElectricField, drawSkill } from '../../src/lib/marble-race/skill-painter.js';

function drawingContext() {
	const calls = { bitmaps: [], images: [], rotations: [] };
	const brush = new Proxy({}, { get: (_, key) => (key === 'getContext' ? () => brush : () => {}) });
	const canvas = {
		ownerDocument: {
			createElement() {
				const bitmap = { getContext: () => brush };
				calls.bitmaps.push(bitmap);
				return bitmap;
			}
		}
	};
	const ctx = new Proxy(
		{
			canvas,
			getTransform: () => ({ a: 1, b: 0 }),
			drawImage: (...args) => calls.images.push(args),
			rotate: (angle) => calls.rotations.push(angle)
		},
		{ get: (target, key) => target[key] ?? (() => {}) }
	);
	return { ctx, calls };
}

test('번개 고정100개는 고리·전기선 그림2개를 공유하고 회전은 표시 시각을 따른다', () => {
	const { ctx, calls } = drawingContext();
	for (let i = 0; i < 100; i++) drawElectricField(ctx, { x: i, y: 100, r: 13 }, 0.5);
	assert.equal(calls.bitmaps.length, 2);
	assert.equal(calls.images.length, 200);
	assert.equal(calls.images[0][0], calls.images[198][0]);
	assert.equal(calls.rotations[0], 1.5);
	drawElectricField(ctx, { x: 20, y: 100, r: 13 }, 0.6);
	assert.equal(calls.bitmaps.length, 2);
	assert.ok(Math.abs(calls.rotations.at(-2) - 1.8) < 1e-9);
});

test('동작 줄이기는 고리1개만 그리며 화면 밖 스킬에는 그림 명령을 만들지 않는다', () => {
	const { ctx, calls } = drawingContext();
	drawElectricField(ctx, { x: 0, y: 0, r: 13 }, 10, true);
	assert.equal(calls.bitmaps.length, 1);
	assert.deepEqual(calls.rotations, [0]);
	const forbidden = new Proxy(
		{},
		{
			get() {
				throw new Error('화면 밖 그림 호출');
			}
		}
	);
	for (const type of ['pulse', 'lightning', 'gust'])
		drawSkill(forbidden, { type, x: 1000, y: 200, top: 0, width: 120, height: 240 }, 0.1, false, {
			left: 0,
			right: 720,
			top: 0,
			bottom: 680
		});
});
