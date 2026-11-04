import { createHash } from 'node:crypto';
import adapter from '@sveltejs/adapter-static';
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';
import { readPosts, publicEntries } from './src/lib/server/blog.js';
import { blogPrerenderGuard } from './scripts/blog_prerender.js';

const blogEntries = publicEntries(await readPosts());
// 예약 build는 같은 commit을 매일 다시 배포한다. 결과가 바뀌는 날짜 조건은 예약 글 공개뿐이므로 둘을 합쳐 버전을 정한다.
// 설정 파일은 build 중 여러 번 읽히므로 매번 같은 값이 나와야 한다. 로컬 build는 SvelteKit 기본값을 쓴다.
const versionName =
	process.env.GITHUB_SHA &&
	createHash('sha256')
		.update(JSON.stringify([process.env.GITHUB_SHA, blogEntries]))
		.digest('hex')
		.slice(0, 16);

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
		// GitHub Pages는 없는 하위 주소에도 404.html을 응답하므로 자산은 사이트 루트 기준으로 연결합니다.
		paths: { relative: false },
		// 열어 둔 페이지가 새 배포를 알아채도록 `_app/version.json`을 5분마다 확인합니다.
		version: { ...(versionName && { name: versionName }), pollInterval: 5 * 60_000 },
		prerender: {
			crawl: false,
			entries: ['*'],
			handleUnseenRoutes: blogPrerenderGuard(blogEntries.length)
		}
	},
	preprocess: vitePreprocess()
};

export default config;
