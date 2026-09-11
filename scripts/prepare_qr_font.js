import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { decompress } from 'wawoff2';

// fontkit 2의 WOFF2 가변 글꼴 오류를 피한다. 글꼴 내용은 바꾸지 않고 압축만 푼다.
export async function prepareQrFont() {
	const source = new URL('../src/lib/team-maker/fonts/SUIT-Variable.woff2', import.meta.url);
	const directory = new URL('../.svelte-kit/qr-font/', import.meta.url);
	const target = new URL('SUIT-Variable.ttf', directory);
	const decoded = Buffer.from(await decompress(await readFile(source)));
	await mkdir(directory, { recursive: true });
	const previous = await readFile(target).catch((error) => {
		if (error.code !== 'ENOENT') throw error;
		return null;
	});
	if (!previous?.equals(decoded)) await writeFile(target, decoded);
	return fileURLToPath(target);
}
