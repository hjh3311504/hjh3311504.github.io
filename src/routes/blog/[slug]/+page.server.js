import { error } from '@sveltejs/kit';
import { dev } from '$app/environment';
import {
	readPosts,
	publicEntries,
	relatedPosts,
	summarizePost,
	isPublicPost
} from '$lib/server/blog.js';

export async function entries() {
	return publicEntries(await readPosts());
}

export async function load({ params }) {
	const posts = await readPosts();
	const post = posts.find((post) => post.slug === params.slug && (isPublicPost(post) || dev));
	if (!post) error(404, '글을 찾을 수 없습니다.');
	return {
		post: { ...summarizePost(post), html: post.html, toc: post.toc },
		related: relatedPosts(posts, post)
	};
}
