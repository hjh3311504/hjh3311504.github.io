import { sveltekit } from '@sveltejs/kit/vite';
import path from 'path';
import { defineConfig } from 'vite';

// /** @type {import('vite').UserConfig} */
// const config = {
// 	plugins: [sveltekit()],
// 	resolve: {
// 		alias: {
// 			$routes: path.resolve('./src/routes')
// 		}
// 	}
// };

// export default config;

export default defineConfig({
	plugins: [sveltekit()],
	resolve: {
		alias: {
			$routes: path.resolve('./src/routes')
		}
	}
});