import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { checkFiles, listSources, formatDiagnostics } from './ui/checker.js';

const root = fileURLToPath(new URL('../', import.meta.url));
try {
	const args = process.argv.slice(2);
	const files = args.length
		? args.map((file) => path.relative(root, path.resolve(file)).split(path.sep).join('/'))
		: await listSources(root);
	if (
		files.some(
			(file) => !file.startsWith('src/') || file.includes('../') || !/\.(css|svelte)$/.test(file)
		)
	)
		throw new Error('src/ 아래 CSS·Svelte 파일을 지정하세요.');
	const diagnostics = await checkFiles(root, files);
	if (diagnostics.length) {
		console.error(formatDiagnostics(diagnostics));
		process.exitCode = 1;
	}
} catch (error) {
	console.error(`UI 검사를 실행하지 못했습니다: ${error.message}`);
	process.exitCode = 2;
}
