import { dev } from '$app/environment';
import { readPosts, summarizePost } from '$lib/server/blog.js';

export async function load() {
	const posts = await readPosts();
	return {
		posts: posts.filter((post) => post.published).map(summarizePost),
		drafts: dev ? posts.filter((post) => !post.published).map(summarizePost) : []
	};
}
