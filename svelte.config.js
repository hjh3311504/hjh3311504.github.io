import adapter from '@sveltejs/adapter-static';
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';
import { readPosts, publicEntries } from './src/lib/server/blog.js';
import { blogPrerenderGuard } from './scripts/blog_prerender.js';

const blogEntries = publicEntries(await readPosts());

/** @type {import('@sveltejs/kit').Config} */
const config = {
	kit: {
		adapter: adapter({
			pages: 'build',
			assets: 'build',
			precompress: false,
			strict: true
		}),
		// Team Maker의 첫 화면 CSS를 HTML에 포함해 스타일 적용 전 깜빡임을 막습니다.
		inlineStyleThreshold: 70_000,
		prerender: {
			crawl: false,
			entries: ['*'],
			handleUnseenRoutes: blogPrerenderGuard(blogEntries.length)
		}
	},
	preprocess: vitePreprocess()
};

export default config;
