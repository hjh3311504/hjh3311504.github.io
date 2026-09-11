import { copyFile, mkdir } from 'node:fs/promises';

// 브라우저 실행 코드와 함께 배포할 원문이다. 버전은 package-lock.json을 따른다.
export const publishedLicenses = [
	['LICENSE', 'site-LICENSE.txt'],
	['THIRD_PARTY_NOTICES.md', 'THIRD_PARTY_NOTICES.md'],
	['licenses/Bootstrap-Icons-LICENSE.txt', 'Bootstrap-Icons-LICENSE.txt'],
	['src/lib/team-maker/fonts/SUIT-LICENSE.txt', 'SUIT-LICENSE.txt'],
	['src/lib/team-maker/fonts/SUITE-LICENSE.txt', 'SUITE-LICENSE.txt'],
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
