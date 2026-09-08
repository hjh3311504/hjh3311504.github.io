import assert from 'node:assert/strict';
import test from 'node:test';
import { createLifetime } from '../../src/lib/team-maker/lifecycle.js';

test('종료한 기능의 이벤트를 해제하고 재연결해도 한 번만 처리한다', () => {
	const target = new EventTarget();
	let calls = 0;
	const first = createLifetime();
	first.on(target, 'change', () => calls++);
	target.dispatchEvent(new Event('change'));
	assert.equal(calls, 1);
	first.destroy();
	first.destroy();
	target.dispatchEvent(new Event('change'));
	assert.equal(calls, 1);
	const second = createLifetime();
	second.on(target, 'change', () => calls++);
	target.dispatchEvent(new Event('change'));
	assert.equal(calls, 2);
	second.destroy();
});

test('한 번만 처리하는 이벤트와 캡처 이벤트도 수명을 따른다', () => {
	const target = new EventTarget();
	const lifetime = createLifetime();
	let calls = 0;
	lifetime.on(target, 'change', () => calls++, { once: true });
	lifetime.on(target, 'change', () => calls++, { capture: true });
	target.dispatchEvent(new Event('change'));
	target.dispatchEvent(new Event('change'));
	assert.equal(calls, 3);
	lifetime.destroy();
	target.dispatchEvent(new Event('change'));
	assert.equal(calls, 3);
});

test('개별 취소와 화면 종료가 예약 작업 및 재예약을 막는다', (t) => {
	t.mock.timers.enable({ apis: ['setTimeout'] });
	const lifetime = createLifetime();
	let calls = 0;
	const cancelled = lifetime.setTimeout(() => calls++, 20);
	lifetime.clearTimeout(cancelled);
	lifetime.setTimeout(() => {
		calls++;
		lifetime.setTimeout(() => calls++, 20);
	}, 10);
	t.mock.timers.tick(10);
	assert.equal(calls, 1);
	lifetime.destroy();
	lifetime.setTimeout(() => calls++, 1);
	t.mock.timers.tick(100);
	assert.equal(calls, 1);
	assert.equal(lifetime.active, false);
});
