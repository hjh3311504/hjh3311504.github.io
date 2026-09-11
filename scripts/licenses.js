import { copyFile, mkdir } from 'node:fs/promises';

// 브라우저 실행 코드와 함께 배포할 원문이다. 버전은 package-lock.json을 따른다.
export const publishedLicenses = [
	['LICENSE', 'site-LICENSE.txt'],
	['THIRD_PARTY_NOTICES.md', 'THIRD_PARTY_NOTICES.md'],
	['licenses/Bootstrap-Icons-LICENSE.txt', 'Bootstrap-Icons-LICENSE.txt'],
	['src/lib/team-maker/fonts/SUIT-LICENSE.txt', 'SUIT-LICENSE.txt'],
	['src/lib/team-maker/fonts/SUITE-LICENSE.txt', 'SUITE-LICENSE.txt'],
	['node_modules/fontkit/README.md', 'fontkit-NOTICE.md'],
	['node_modules/fontkit/package.json', 'fontkit-package.json'],
	['node_modules/brotli/README.md', 'brotli-NOTICE.md'],
	['node_modules/brotli/package.json', 'brotli-package.json'],
	['node_modules/dfa/README.md', 'dfa-NOTICE.md'],
	['node_modules/dfa/package.json', 'dfa-package.json'],
	['node_modules/@swc/helpers/LICENSE', 'swc-helpers-LICENSE.txt'],
	['node_modules/tslib/LICENSE.txt', 'tslib-LICENSE.txt'],
	['node_modules/clone/LICENSE', 'clone-LICENSE.txt'],
	['node_modules/fast-deep-equal/LICENSE', 'fast-deep-equal-LICENSE.txt'],
	['node_modules/restructure/LICENSE', 'restructure-LICENSE.txt'],
	['node_modules/tiny-inflate/LICENSE', 'tiny-inflate-LICENSE.txt'],
	['node_modules/unicode-properties/LICENSE', 'unicode-properties-LICENSE.txt'],
	['node_modules/unicode-trie/LICENSE', 'unicode-trie-LICENSE.txt'],
	['node_modules/base64-js/LICENSE', 'base64-js-LICENSE.txt'],
	['node_modules/pako/LICENSE', 'pako-LICENSE.txt'],
	['node_modules/qrcode/license', 'qrcode-LICENSE.txt'],
	['node_modules/dijkstrajs/LICENSE.md', 'dijkstrajs-LICENSE.txt'],
	['node_modules/svelte/LICENSE.md', 'Svelte-LICENSE.txt'],
	['node_modules/@sveltejs/kit/LICENSE', 'SvelteKit-LICENSE.txt'],
	['node_modules/esm-env/LICENSE', 'esm-env-LICENSE.txt'],
	['node_modules/clsx/license', 'clsx-LICENSE.txt'],
	['node_modules/devalue/LICENSE', 'devalue-LICENSE.txt'],
	['node_modules/vite/LICENSE.md', 'Vite-LICENSE.txt']
];

export async function publishLicenses() {
	await mkdir('build/licenses', { recursive: true });
	for (const [source, name] of publishedLicenses) {
		await copyFile(source, `build/licenses/${name}`);
	}
}
