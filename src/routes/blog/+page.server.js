import { dev } from '$app/environment';
import { readPosts, summarizePost, isPublicPost } from '$lib/server/blog.js';

export async function load() {
	const posts = await readPosts();
	return {
		posts: posts.filter(isPublicPost).map(summarizePost),
		drafts: dev ? posts.filter((post) => !isPublicPost(post)).map(summarizePost) : []
	};
}
