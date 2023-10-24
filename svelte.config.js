// import adapter from '@sveltejs/adapter-static';
import adapter from '@sveltejs/adapter-static';
import { vitePreprocess } from '@sveltejs/kit/vite';
import { mdsvex } from 'mdsvex';
import rehypeExternalLinks from 'rehype-external-links';
import rehypeSlug from 'rehype-slug';
import rehypeAutolinkHeadings from 'rehype-autolink-headings';

const dev = process.argv.includes('dev');
const extensions = ['.svelte', '.md'];

/** @type {import('@sveltejs/kit').Config} */
const config = {
	kit: {
		adapter: adapter({
			pages: "build",
			assets: "build",
			fallback: "404.html",
			precompress: false,
			strict: true
		}),
		// paths: {
		// 	base: dev ? '' : '/hjh3311504.github.io',
		// 	// base: '',
		// },
		prerender: {
			handleHttpError: 'warn'
		},
	},
	preprocess: [
		vitePreprocess(),
		mdsvex({
			extensions: extensions,
			rehypePlugins: [
				rehypeExternalLinks, // Adds 'target' and 'rel' to external links
				rehypeSlug, // Adds 'id' attributes to Headings (h1,h2,etc)
				[
					rehypeAutolinkHeadings,
					{
						// Adds hyperlinks to the headings, requires rehypeSlug
						behavior: 'prepend',
						properties: { className: ['heading-link'], title: 'Permalink', ariaHidden: 'true' },
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
	extensions: extensions,
};

export default config;
