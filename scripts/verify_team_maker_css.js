import { checkFiles, listSources, formatDiagnostics } from './ui/checker.js';

// 기존 build 검증의 호출부는 유지하되 모든 페이지로 검사 범위를 넓힌다.
export async function verifyTeamMakerCss(root) {
	const diagnostics = await checkFiles(root, await listSources(root));
	if (diagnostics.length) throw new Error(`UI 규칙 위반:\n${formatDiagnostics(diagnostics)}`);
}
