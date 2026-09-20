import { createHash, randomUUID } from 'node:crypto';
import { mkdir, readFile, writeFile, rename, rm, readdir } from 'node:fs/promises';
import path from 'node:path';
import { setTimeout as delay } from 'node:timers/promises';

const hash = (value) => createHash('sha256').update(value).digest('hex');

// 도구 이름·명령 문자열 대신 디스크 내용을 비교해 shell·중첩 도구·새 파일도 검사한다.
export async function runHook(root, event) {
	if (event.permission_mode === 'plan') return {};
	const session = hash(String(event.session_id ?? event.thread_id ?? 'local')).slice(0, 24);
	const directory = path.join(root, '.context/ui-harness');
	await mkdir(directory, { recursive: true });
	const cacheFile = path.join(directory, `${session}.json`);
	const lock = `${cacheFile}.lock`;
	let locked = false;
	try {
		for (let attempt = 0; attempt < 100; attempt++) {
			try {
				await mkdir(lock);
				locked = true;
				break;
			} catch (error) {
				if (error.code !== 'EEXIST') throw error;
				await delay(20);
			}
		}
		if (!locked)
			throw new Error('동일 세션의 이전 UI 검사가 끝나지 않았습니다. check:ui로 확인하세요.');
		const { listSources, checkFiles, collectHeadingClasses, formatDiagnostics } =
			await import('./checker.js');
		const files = await listSources(root);
		const policyFiles = [
			'package-lock.json',
			...(await readdir(path.join(root, 'scripts/ui')))
				.filter((file) => file.endsWith('.js'))
				.map((file) => `scripts/ui/${file}`)
		];
		const hashes = Object.fromEntries(
			await Promise.all(
				[...files, ...policyFiles].map(async (file) => [
					file,
					hash(await readFile(path.join(root, file)))
				])
			)
		);
		let previous = {};
		try {
			previous = JSON.parse(await readFile(cacheFile, 'utf8'));
		} catch (error) {
			if (error.code !== 'ENOENT' && !(error instanceof SyntaxError)) throw error;
		}
		let invalidate = [...policyFiles, 'src/lib/styles/tokens.css'].some(
			(file) => hashes[file] !== previous[file]
		);
		let headingClasses;
		const svelteChanged = [...new Set([...files, ...Object.keys(previous)])].some(
			(file) => file.endsWith('.svelte') && hashes[file] !== previous[file]
		);
		// 마크업이 바뀌면 수정하지 않은 CSS도 공통 제목을 덮어쓸 수 있다.
		if (invalidate || svelteChanged || !previous.$headingClasses) {
			headingClasses = await collectHeadingClasses(root, files);
			hashes.$headingClasses = hash(JSON.stringify([...headingClasses].sort()));
			invalidate ||= hashes.$headingClasses !== previous.$headingClasses;
		} else hashes.$headingClasses = previous.$headingClasses;
		const changed = invalidate ? files : files.filter((file) => hashes[file] !== previous[file]);
		const diagnostics =
			invalidate || changed.length ? await checkFiles(root, changed, { headingClasses }) : [];
		const temporary = `${cacheFile}.${randomUUID()}.tmp`;
		await writeFile(temporary, JSON.stringify(hashes));
		await rename(temporary, cacheFile);
		if (!diagnostics.length) return {};
		const reportFile = path.join(directory, `${session}-report.txt`);
		await writeFile(reportFile, formatDiagnostics(diagnostics));
		const message = `UI 수정 직후 검사: ${diagnostics.length}개 위반이 있습니다. 다음 수정에서 공통 컴포넌트·토큰으로 바로잡으세요.\n${formatDiagnostics(diagnostics.slice(0, 20))}${diagnostics.length > 20 ? `\n전체 결과: ${reportFile}` : ''}`;
		return {
			hookSpecificOutput: {
				hookEventName: event.hook_event_name ?? 'PostToolUse',
				additionalContext: message
			}
		};
	} finally {
		if (locked) await rm(lock, { recursive: true, force: true });
	}
}
