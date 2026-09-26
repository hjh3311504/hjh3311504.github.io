import test from 'node:test';
import assert from 'node:assert/strict';
import { createDisplayRenderer } from '../../src/lib/marble-race/display-renderer.js';

function setup(supported = true) {
	const workers = [],
		calls = [],
		inlineCalls = [];
	const canvas = {
		width: 1,
		height: 1,
		getContext: () => ({ setTransform() {}, fillRect() {}, drawImage: (b) => calls.push(b) })
	};
	const createInline = () => ({
		reset: (r) => inlineCalls.push(['reset', r.identity]),
		render: (r) => inlineCalls.push(['render', r.identity]),
		addEvents: (e) => inlineCalls.push(['events', e])
	});
	const createWorker = () => {
		const w = {
			messages: [],
			terminated: false,
			postMessage(data) {
				this.messages.push(data);
			},
			terminate() {
				this.terminated = true;
			}
		};
		workers.push(w);
		return w;
	};
	const renderer = createDisplayRenderer(canvas, { createInline, createWorker, supported });
	const race = {
		identity: Symbol(),
		time: 0,
		marbles: Array.from({ length: 200 }, (_, id) => ({
			id,
			name: '공',
			color: '#abc',
			r: 13,
			x: id,
			y: 0,
			vx: 0,
			vy: 0,
			finished: false
		})),
		blocks: [],
		finished: [],
		layout: {},
		zones: [],
		skillWaves: []
	};
	const options = {
		bounds: { width: 320, height: 480 },
		view: { left: 0, top: 0, scale: 1 },
		reduced: false
	};
	function reply(w = workers.at(-1), generation = w.messages.at(-1).generation, width = 320) {
		const bitmap = {
			width,
			height: 480,
			closed: false,
			close() {
				this.closed = true;
			}
		};
		w.onmessage({ data: { kind: 'painted', generation, bitmap } });
		return bitmap;
	}
	return { renderer, race, options, workers, calls, inlineCalls, reply };
}

test('진행 중 요청은1개이고 기다리는 동안 모은 이벤트는 다음 그림에 모두 전달한다', () => {
	const s = setup();
	const { renderer, race, options } = s;
	renderer.addEvents([{ type: 'first' }], race.identity);
	renderer.render(race, options);
	const w = s.workers[0];
	assert.deepEqual(w.messages[0].state.events, [{ type: 'first' }]);
	renderer.addEvents([{ type: 'second' }], race.identity);
	renderer.render(race, options);
	renderer.addEvents([{ type: 'third' }], race.identity);
	renderer.render(race, options);
	assert.equal(w.messages.length, 1);
	const bitmap = s.reply();
	assert.equal(bitmap.closed, true);
	assert.equal(s.calls.length, 1);
	race.time = 1;
	renderer.render(race, options);
	assert.deepEqual(w.messages[1].state.events, [{ type: 'second' }, { type: 'third' }]);
	assert.equal(w.messages[1].state.initial, false);
	assert.equal(w.messages[1].state.time, 1);
});

test('초기화 뒤 늦은 그림과 오류가 새 경기를 덮지 않고 Worker를 정리한다', () => {
	const s = setup();
	s.renderer.render(s.race, s.options);
	const old = s.workers[0];
	s.race = { ...s.race, identity: Symbol(), preview: true };
	s.renderer.render(s.race, s.options);
	assert.equal(old.terminated, true);
	assert.equal(s.reply(old).closed, true);
	old.onerror();
	assert.equal(s.calls.length, 0);
	s.race = { ...s.race, identity: Symbol(), preview: false };
	s.renderer.render(s.race, s.options);
	assert.equal(s.workers.length, 2);
	s.renderer.destroy();
	assert.equal(s.workers[1].terminated, true);
	assert.equal(s.reply().closed, true);
	assert.equal(s.calls.length, 0);
});

test('크기를 바꾼 뒤 도착한 이전 크기의 그림을 버리고 다음 요청에 새 크기를 쓴다', () => {
	const s = setup();
	s.renderer.render(s.race, s.options);
	const resized = { ...s.options, bounds: { width: 500, height: 480 } };
	s.renderer.render(s.race, resized);
	assert.equal(s.reply().closed, true);
	assert.equal(s.calls.length, 0);
	s.renderer.render(s.race, resized);
	assert.equal(s.workers[0].messages[1].options.bounds.width, 500);
	s.reply(s.workers[0], undefined, 500);
	assert.equal(s.calls.length, 1);
});

test('Worker 오류 때 미처 그리지 못한 이벤트와 현재 상태를 기존 방식으로 넘긴다', () => {
	const s = setup();
	s.renderer.addEvents([{ id: 1 }], s.race.identity);
	s.renderer.render(s.race, s.options);
	s.renderer.addEvents([{ id: 2 }], s.race.identity);
	s.workers[0].onmessage({ data: { kind: 'paint-error' } });
	assert.equal(s.workers[0].terminated, true);
	assert.deepEqual(s.inlineCalls.find((c) => c[0] === 'events')[1], [{ id: 1 }, { id: 2 }]);
	s.renderer.render(s.race, s.options);
	assert.equal(s.workers.length, 1);
});

test('미지원 브라우저와 작은 경기·준비 화면은 기존 그리기를 사용한다', () => {
	for (const kind of ['unsupported', 'small', 'preview']) {
		const s = setup(kind !== 'unsupported');
		if (kind === 'small') s.race.marbles.length = 2;
		if (kind === 'preview') s.race.preview = true;
		s.renderer.addEvents([{ id: 1 }], s.race.identity);
		s.renderer.render(s.race, s.options);
		assert.equal(s.workers.length, 0);
		assert.deepEqual(
			s.inlineCalls.map((c) => c[0]),
			['reset', 'events', 'render']
		);
		assert.deepEqual(s.inlineCalls[1][1], [{ id: 1 }]);
	}
});
