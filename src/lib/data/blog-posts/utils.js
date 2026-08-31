// Disabling eslint because importing Prism is needed
// even if not directly used in this file
import Prism from 'prismjs';
// Keep the import available before prism-svelte registers its grammar.
void Prism;
import 'prism-svelte';
import readingTime from 'reading-time';
import striptags from 'striptags';
import { render as renderComponent } from 'svelte/server';

export const importPosts = (render = false) => {
	const blogImports = import.meta.glob('$routes/*/*/*.md', { eager: true });
	const innerImports = import.meta.glob('$routes/*/*/*/*.md', { eager: true });

	const imports = { ...blogImports, ...innerImports };

	/** @type {App.BlogPost[]} */
	const posts = [];
	for (const path in imports) {
		const post = imports[path];
		if (post) {
			posts.push({
				...post.metadata,
				html: render ? renderComponent(post.default).body : undefined
			});
		}
	}

	return posts;
};

/**
 * @param {App.BlogPost[]} posts
 * @return {App.BlogPost}
 * */
export const filterPosts = (posts) => {
	return posts
		.filter((post) => !post.hidden)
		.sort((a, b) =>
			new Date(a.date).getTime() > new Date(b.date).getTime()
				? -1
				: new Date(a.date).getTime() < new Date(b.date).getTime()
					? 1
					: 0
		)
		.map((post) => {
			const readingTimeResult = post.html ? readingTime(striptags(post.html) || '') : undefined;
			const relatedPosts = getRelatedPosts(posts, post);

			return {
				...post,
				readingTime: readingTimeResult ? readingTimeResult.text : '',
				relatedPosts: relatedPosts
			};
		});
};

// #region Unexported Functions
/**
 * @param {App.BlogPost[]} posts
 * @param {App.BlogPost} post
 * */
const getRelatedPosts = (posts, post) => {
	// Get the first 3 posts that have the highest number of tags in common
	const relatedPosts = posts
		.filter((p) => p.slug !== post.slug)
		.sort((a, b) => {
			const aTags = a.tags?.filter((t) => post.tags?.includes(t));
			const bTags = b.tags?.filter((t) => post.tags?.includes(t));
			return aTags?.length > bTags?.length ? -1 : aTags?.length < bTags?.length ? 1 : 0;
		});

	return relatedPosts.slice(0, 3).map((p) => ({
		...p,
		readingTime: p.html ? readingTime(striptags(p.html) || '').text : ''
	}));
};

// #endregion
