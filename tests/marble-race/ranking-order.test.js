import test from 'node:test';
import assert from 'node:assert/strict';
import { pinRankingItem } from '../../src/lib/marble-race/ranking-order.js';
import { createPreviewOrder } from '../../src/lib/marble-race/preview-order.js';

test('추적 카드는 실제 등수와 원본을 유지하며 중복 없이 첫 칸에 표시한다', () => {
	const items = Array.from({ length: 8 }, (_, id) => ({ id, rank: id + 1, name: '같은 이름' }));
	for (const pinned of items) {
		const view = pinRankingItem(items, pinned);
		const expected = [pinned, ...items.filter((item) => item !== pinned)];
		assert.equal(view.length, items.length);
		for (let first = 0; first <= items.length; first++) {
			for (let last = first; last <= items.length; last++) {
				assert.deepEqual(view.slice(first, last), expected.slice(first, last));
			}
		}
		assert.equal(view.slice(0, 1)[0].rank, pinned.id + 1);
	}
	assert.deepEqual(
		items.map((item) => item.id),
		[0, 1, 2, 3, 4, 5, 6, 7]
	);
	assert.equal(pinRankingItem(items, undefined), items);
});

test('검색에서 제외된 추적 카드도 첫 칸에 표시하고 추적 해제 시 검색 결과를 복원한다', () => {
	const pinned = { id: 9, rank: 10 },
		match = { id: 2, rank: 3 };
	const items = [match];
	const view = pinRankingItem(items, pinned);
	assert.equal(view.length, 2);
	assert.deepEqual(view.slice(0, 2), [pinned, match]);
	assert.deepEqual(view.slice(1, 2), [match]);
	assert.deepEqual(pinRankingItem([], pinned).slice(0, 1), [pinned]);
	assert.equal(pinRankingItem(items, undefined), items);
});

test('순위가 바뀌어도 최신 추적 구슬의 등수와 도착 상태를 표시한다', () => {
	const items = [
		{ id: 4, rank: 1, finished: true },
		{ id: 2, rank: 2, finished: false }
	];
	assert.deepEqual(pinRankingItem(items, items[1]).slice(0, 2), [items[1], items[0]]);
	assert.deepEqual(pinRankingItem(items, items[0]).slice(0, 2), items);
});

test('백만 개 준비 목록도 요청한 카드만 만들며 검색 그룹의 원래 위치를 찾는다', () => {
	const entries = [
		{ name: '앞', count: 500000 },
		{ name: '뒤', count: 500000 }
	];
	const source = createPreviewOrder(entries);
	const pinned = source.slice(999999, 1000000)[0];
	let created = 0;
	const slice = source.slice;
	source.slice = (first, last) => {
		created += last - first;
		return slice(first, last);
	};
	const view = pinRankingItem(source, pinned);
	assert.equal(view.length, 1000000);
	assert.deepEqual(
		view.slice(0, 3).map((item) => item.id),
		[999999, 0, 1]
	);
	assert.deepEqual(
		view.slice(999998, 1000000).map((item) => item.id),
		[999997, 999998]
	);
	assert.equal(created, 4);
	const matches = createPreviewOrder(entries, '뒤');
	assert.equal(matches.indexOfId(999999), 499999);
	assert.equal(matches.indexOfId(0), -1);
	assert.equal(pinRankingItem(matches, pinned).length, 500000);
	assert.equal(createPreviewOrder(entries, '1000000').indexOfId(999999), 0);
});
