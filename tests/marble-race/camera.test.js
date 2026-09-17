import test from 'node:test';
import assert from 'node:assert/strict';
import { createCamera } from '../../src/lib/marble-race/camera.js';
import { createRace } from '../../src/lib/marble-race/physics.js';

test('출발·반동·선두 교체·골인 경계에서 확대 비율과 아래 방향 이동을 유지한다', () => {
	const race = createRace(['가', '나']);
	const camera = createCamera();
	const options = { width: 900, height: 570, seconds: 1 / 60 };
	let previous = camera.update(race, options);
	const scale = previous.scale;
	race.time = 3;
	for (const y of [
		500,
		700,
		650,
		900,
		800,
		race.layout.finale.start + 10,
		race.layout.finale.start - 50
	]) {
		race.marbles[0].y = y;
		for (let i = 0; i < 60; i++) {
			const next = camera.update(race, options);
			assert.ok(next.top >= previous.top);
			assert.equal(next.scale, scale);
			previous = next;
		}
	}
	assert.ok(previous.finale);
	race.marbles[0].finished = true;
	assert.ok(camera.update(race, options).top >= previous.top);
	const top = camera.getView().top;
	for (let i = 0; i < 60; i++) camera.update(race, { ...options, focusId: 1 });
	assert.ok(camera.getView().top < top, '직접 구슬을 선택하면 위쪽으로도 이동한다');
});
test('같은 실제 시간이면 경기 배속과 무관하게 카메라가 같은 위치까지 이동한다', () => {
	const race = createRace(['가', '나']);
	race.time = 3;
	race.marbles[0].y = 1000;
	const a = createCamera(),
		b = createCamera();
	for (let i = 0; i < 60; i++) {
		a.update(race, { width: 900, height: 570, seconds: 1 / 60 });
		race.time += 1;
		b.update(race, { width: 900, height: 570, seconds: 1 / 60 });
	}
	assert.deepEqual(a.getView(), b.getView());
});

test('일시정지 중 직접 선택한 구슬은 새 프레임을 기다리지 않고 보여준다', () => {
	const race = createRace(['앞', '뒤']);
	race.time = 4;
	race.marbles[0].y = 1500;
	const camera = createCamera(),
		options = { width: 900, height: 570, seconds: 1 / 60 };
	for (let i = 0; i < 120; i++) camera.update(race, options);
	const previous = camera.getView().top;
	const next = camera.update(race, { ...options, seconds: 0, focusId: 1 });
	assert.ok(next.top < previous);
});

test('결승에서 화면 크기를 바꾸면 일시정지 중에도 판과 판정선을 함께 보여준다', () => {
	const race = createRace(['가', '나']);
	race.marbles[0].y = race.layout.finale.mouthY - 25;
	const camera = createCamera();
	for (let i = 0; i < 100; i++)
		camera.update(race, { width: 720, height: 680, seconds: 1 / 60, focusId: '0' });
	const view = camera.update(race, { width: 330, height: 480, seconds: 0, focusId: '0' });
	assert.ok(view.top <= race.layout.finale.rotor.y - 90);
	assert.ok(view.bottom >= race.layout.finish.y);
	assert.equal(view.scale, 330 / 720);
});

test('걷어 올려진 후보가 결승 시작점 위에 있어도 시작된 결승 연출을 유지한다', () => {
	const race = createRace(['가', '나']);
	race.marbles[0].y = race.layout.finale.start - 20;
	const view = createCamera().update(race, {
		width: 720,
		height: 680,
		seconds: 1 / 60,
		cinematic: { active: true, focusId: 0 }
	});
	assert.equal(view.finale, true);
	assert.ok(view.top < race.marbles[0].y && view.bottom > race.marbles[0].y);
});

test('결승 확대는2.4배로 후보의 좌우·상하 위치를 따라가고 동작 줄이기를 따른다', () => {
	const race = createRace(['가', '나']);
	const m = race.marbles[0];
	const camera = createCamera();
	const options = {
		width: 720,
		height: 680,
		seconds: 1 / 60,
		cinematic: { active: true, focusId: 0 }
	};
	for (const [x, offset] of [
		[100, 100],
		[300, 250],
		[400, 180],
		[360, 680]
	]) {
		m.x = x;
		m.y = race.layout.finale.start + offset;
		for (let i = 0; i < 180; i++) camera.update(race, options);
		const view = camera.getView();
		assert.ok(Math.abs(view.scale - 2.4) < 0.001);
		assert.ok(m.x > view.left && m.x < view.right);
		assert.ok(m.y > view.top && m.y < view.bottom);
	}
	const reduced = createCamera().update(race, { ...options, reduced: true });
	assert.equal(reduced.scale, 1);
});
