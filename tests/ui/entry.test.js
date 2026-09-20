import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, mkdir, writeFile, readFile, cp, symlink, rm } from 'node:fs/promises';
import { promisify } from 'node:util';
import { execFile } from 'node:child_process';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const exec = promisify(execFile);
const repository = fileURLToPath(new URL('../../', import.meta.url));

async function fixture(t) {
	const root = await mkdtemp(path.join(os.tmpdir(), 'ui-hook-entry-'));
	t.after(() => rm(root, { recursive: true, force: true }));
	await mkdir(path.join(root, 'scripts'), { recursive: true });
	await mkdir(path.join(root, 'src/lib/styles'), { recursive: true });
	await cp(path.join(repository, 'scripts/ui'), path.join(root, 'scripts/ui'), { recursive: true });
	await cp(path.join(repository, 'scripts/ui_hook.js'), path.join(root, 'scripts/ui_hook.js'));
	await symlink(path.join(repository, 'node_modules'), path.join(root, 'node_modules'), 'dir');
	await writeFile(path.join(root, 'package.json'), '{"type":"module"}');
	await writeFile(path.join(root, 'package-lock.json'), '{}');
	await writeFile(path.join(root, 'src/lib/styles/tokens.css'), ':root{--font-size-14:14px}');
	await writeFile(
		path.join(root, 'src/new.svelte'),
		'<p>새 페이지</p><style>p{font-size:13px}</style>'
	);
	await exec('git', ['init', '--quiet', root]);
	return root;
}

for (const [name, config] of [
	['Codex', '.codex/hooks.json'],
	['Claude Code', '.claude/settings.json']
]) {
	test(`${name}에 등록한 실제 명령이 새 파일 경고 JSON을 반환한다`, async (t) => {
		const root = await fixture(t);
		const settings = JSON.parse(await readFile(path.join(repository, config), 'utf8'));
		const command = settings.hooks.PostToolUse[0].hooks[0].command;
		const eventFile = path.join(root, 'event.json');
		await writeFile(
			eventFile,
			JSON.stringify({
				session_id: name,
				hook_event_name: 'PostToolUse',
				tool_name: name === 'Codex' ? 'apply_patch' : 'Write'
			})
		);
		const { stdout } = await exec('/bin/sh', ['-c', `${command} < event.json`], {
			cwd: root,
			env: { ...process.env, CLAUDE_PROJECT_DIR: root }
		});
		const output = JSON.parse(stdout);
		assert.equal(output.hookSpecificOutput.hookEventName, 'PostToolUse');
		assert.match(output.hookSpecificOutput.additionalContext, /src\/new.svelte.*ui\/font/);
		await writeFile(
			path.join(root, 'src/new.svelte'),
			'<p>수정한 페이지</p><style>p{font-size:var(--font-size-14)}</style>'
		);
		const clean = await exec('/bin/sh', ['-c', `${command} < event.json`], {
			cwd: root,
			env: { ...process.env, CLAUDE_PROJECT_DIR: root }
		});
		assert.equal(clean.stdout, '');
	});
}

test('hook 실행 의존성이 없으면 에이전트에게 실행 실패를 전달한다', async (t) => {
	const root = await fixture(t);
	await rm(path.join(root, 'scripts/ui/checker.js'));
	const { stdout } = await exec('/bin/sh', ['-c', 'node scripts/ui_hook.js < /dev/null'], {
		cwd: root
	});
	assert.match(
		JSON.parse(stdout).hookSpecificOutput.additionalContext,
		/UI 검사가 실행되지 않았습니다/
	);
});
