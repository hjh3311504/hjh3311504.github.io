import test from 'node:test';
import assert from 'node:assert/strict';
import { createDrawSchedule } from '../../src/lib/marble-race/draw-schedule.js';

for (const count of [200, 1000])
	for (const hz of [30, 60, 90, 120, 144, 240]) {
		test(`${hz}Hz 화면에서${count}개 그리기는 최대60fps이며 낮은 화면 주기를 늦추지 않는다`, () => {
			const draw = createDrawSchedule();
			let frames = 0;
			for (let i = 0; i < hz * 10; i++) if (draw((i * 1000) / hz, count)) frames++;
			assert.ok(Math.abs(frames - Math.min(hz, 60) * 10) <= 1, `${frames}회`);
		});
	}

test('작은 경기는 원래 화면 주기로 그리고 경기 변경을 즉시 반영한다', () => {
	const draw = createDrawSchedule();
	assert.equal(draw(0, 1000), true);
	assert.equal(draw(4, 1000), false);
	assert.equal(draw(8, 30), true);
	assert.equal(draw(12, 30), true);
	assert.equal(draw(16, 1000), true);
	assert.equal(draw(20, 1000), false);
});

test('긴 화면 중단 뒤에 과거 프레임을 몰아서 그리지 않는다', () => {
	const draw = createDrawSchedule();
	draw(0, 1000);
	assert.equal(draw(1000, 1000), true);
	assert.equal(draw(1001, 1000), false);
	assert.equal(draw(1008, 1000), false);
	assert.equal(draw(1017, 1000), true);
});
