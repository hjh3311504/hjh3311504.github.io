import test from 'node:test';
import assert from 'node:assert/strict';
import { blogListing } from '../../src/lib/blog/listing.js';

const posts = Array.from({ length: 43 }, (_, index) => ({
	slug: `post-${index}`,
	category: index < 13 ? 'guide' : 'note'
}));

test('페이지를 이동해도 글이 빠지거나 중복되지 않는다', () => {
	const result = [];
	for (let page = 1; page <= blogListing(posts).pageCount; page++) {
		result.push(...blogListing(posts, '', String(page)).posts);
	}
	assert.deepEqual(result, posts);
	assert.equal(blogListing(posts, '', '8').posts.length, 1);
});

test('카테고리별로 페이지를 나누고 범위를 벗어나면 마지막 페이지를 표시한다', () => {
	const listing = blogListing(posts, 'guide', '8');
	assert.equal(listing.total, 13);
	assert.equal(listing.currentPage, 3);
	assert.deepEqual(listing.posts, [posts[12]]);
	assert.deepEqual(blogListing(posts, 'guide').posts, posts.slice(0, 6));
});

test('빈 카테고리와 잘못된 URL 값을 안전하게 처리한다', () => {
	assert.deepEqual(blogListing(posts, 'update').posts, []);
	assert.equal(blogListing([], '', '99').currentPage, 1);
	for (const value of ['0', '-1', '1.5', 'NaN', 'Infinity', '']) {
		assert.equal(blogListing(posts, '', value).currentPage, 1);
	}
	assert.equal(blogListing(posts, 'toString').category, '');
});

test('페이지 번호는 현재 위치를 포함해 최대5개만 표시한다', () => {
	assert.deepEqual(blogListing(posts, '', '1').pages, [1, 2, 3, 4, 5]);
	assert.deepEqual(blogListing(posts, '', '4').pages, [2, 3, 4, 5, 6]);
	assert.deepEqual(blogListing(posts, '', '8').pages, [4, 5, 6, 7, 8]);
});
