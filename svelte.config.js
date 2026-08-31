import adapter from '@sveltejs/adapter-static';
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';
import { mdsvex } from 'mdsvex';
import rehypeExternalLinks from 'rehype-external-links';
import rehypeSlug from 'rehype-slug';
import rehypeAutolinkHeadings from 'rehype-autolink-headings';

const extensions = ['.svelte', '.md'];
const markdownExtensions = ['.md'];

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
	preprocess: [
		vitePreprocess(),
		mdsvex({
			extensions: markdownExtensions,
			rehypePlugins: [
				rehypeExternalLinks, // Adds 'target' and 'rel' to external links
				rehypeSlug, // Adds 'id' attributes to Headings (h1,h2,etc)
				[
					rehypeAutolinkHeadings,
					{
						// Adds hyperlinks to the headings, requires rehypeSlug
						behavior: 'prepend',
						properties: {
							className: ['heading-link'],
							title: 'Permalink',
							ariaHidden: 'true'
						},
						content: {
							type: 'element',
							tagName: 'span',
							properties: {},
							children: [{ type: 'text', value: '#' }]
						}
					}
				]
			]
		})
	],
	extensions: extensions
};

export default config;
