import { publicPosts } from '$lib/server/blog.js';

export async function load() {
	return { latestPosts: (await publicPosts()).slice(0, 3) };
}
