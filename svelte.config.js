import adapter from '@sveltejs/adapter-static';
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';

/** @type {import('@sveltejs/kit').Config} */
const config = {
	kit: {
		adapter: adapter({
			pages: 'build',
			assets: 'build',
			precompress: false,
			strict: true
		}),
		prerender: {
			crawl: false,
			entries: ['*']
		},
		alias: {
			$components: 'src/lib/components',
			$data: 'src/lib/data',
			$stores: 'src/lib/stores'
		}
	},
	preprocess: vitePreprocess()
};

export default config;
