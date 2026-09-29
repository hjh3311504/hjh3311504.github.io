import { publicPosts } from '$lib/server/blog.js';
import { rss } from '$lib/blog/catalog.js';

export const prerender = true;

export async function GET() {
	return new Response(rss(await publicPosts()), {
		headers: { 'Content-Type': 'application/rss+xml; charset=utf-8' }
	});
}
