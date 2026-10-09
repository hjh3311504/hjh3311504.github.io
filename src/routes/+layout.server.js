import { publicPaths, readPosts } from '$lib/server/blog.js';

export async function load() {
	// 예약 글과 초안의 경로는 운영 브라우저에 전달하지 않는다.
	return { analyticsPublicPaths: publicPaths(await readPosts()) };
}
