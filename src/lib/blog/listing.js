import { categories } from './catalog.js';

export const POSTS_PER_PAGE = 6;

export function blogListing(posts, category = '', requestedPage = '1') {
	const selectedCategory = Object.hasOwn(categories, category) ? category : '';
	const filtered = selectedCategory
		? posts.filter((post) => post.category === selectedCategory)
		: posts;
	const pageCount = Math.max(1, Math.ceil(filtered.length / POSTS_PER_PAGE));
	const parsed = Number(requestedPage);
	const currentPage = Number.isSafeInteger(parsed) && parsed > 0 ? Math.min(parsed, pageCount) : 1;
	const firstPage = Math.max(1, Math.min(currentPage - 2, pageCount - 4));
	return {
		category: selectedCategory,
		total: filtered.length,
		pageCount,
		currentPage,
		pages: Array.from({ length: Math.min(5, pageCount) }, (_, index) => firstPage + index),
		posts: filtered.slice((currentPage - 1) * POSTS_PER_PAGE, currentPage * POSTS_PER_PAGE)
	};
}
