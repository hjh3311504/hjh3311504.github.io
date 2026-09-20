import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, mkdir, writeFile, rm, readdir } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { runHook } from '../../scripts/ui/hook.js';

async function fixture(t) {
	const root = await mkdtemp(path.join(os.tmpdir(), 'ui-harness-'));
	t.after(() => rm(root, { recursive: true, force: true }));
	await mkdir(path.join(root, 'src/lib/styles'), { recursive: true });
	await mkdir(path.join(root, 'scripts/ui'), { recursive: true });
	await writeFile(path.join(root, 'package-lock.json'), '{}');
	await writeFile(path.join(root, 'scripts/ui/policy.js'), '// 정책');
	await writeFile(
		path.join(root, 'src/lib/styles/tokens.css'),
		':root{--font-size-14:14px;--space-8:8px}'
	);
	return root;
}
const event = (session = 'codex') => ({ session_id: session, hook_event_name: 'PostToolUse' });
const feedback = (result) => result.hookSpecificOutput?.additionalContext ?? '';

test('새 페이지 생성 즉시 경고하고 같은 파일 내용은 반복하지 않는다', async (t) => {
	const root = await fixture(t);
	assert.deepEqual(await runHook(root, event()), {});
	await writeFile(
		path.join(root, 'src/new.svelte'),
		'<style>p{font-size:13px}</style><p>새 페이지</p>'
	);
	assert.match(feedback(await runHook(root, event())), /new.svelte.*ui\/font/);
	assert.deepEqual(await runHook(root, event()), {});
	await writeFile(
		path.join(root, 'src/new.svelte'),
		'<style>p{font-size:var(--font-size-14)}</style><p>새 페이지</p>'
	);
	assert.deepEqual(await runHook(root, event()), {});
	await rm(path.join(root, 'src/new.svelte'));
	assert.deepEqual(await runHook(root, event()), {});
});
test('shell 변경과 실패한 shell의 부분 수정도 검사한다', async (t) => {
	const root = await fixture(t);
	await runHook(root, event('claude'));
	await writeFile(path.join(root, 'src/page.css'), '.a{gap:3px}');
	const result = await runHook(root, {
		...event('claude'),
		tool_name: 'Bash',
		hook_event_name: 'PostToolUseFailure'
	});
	assert.equal(result.hookSpecificOutput.hookEventName, 'PostToolUseFailure');
	assert.match(feedback(result), /ui\/spacing/);
});
test('정책·토큰이 바뀌면 변경하지 않은 페이지도 다시 검사한다', async (t) => {
	const root = await fixture(t);
	await writeFile(path.join(root, 'src/page.css'), '.a{font-size:var(--font-size-14)}');
	await runHook(root, event());
	await writeFile(path.join(root, 'src/lib/styles/tokens.css'), ':root{--space-8:8px}');
	assert.match(feedback(await runHook(root, event())), /page.css/);
});
test('여러 세션의 경고 기록을 분리하고 동시 호출을 직렬 처리한다', async (t) => {
	const root = await fixture(t);
	await writeFile(path.join(root, 'src/page.css'), '.a{gap:3px}');
	const results = await Promise.all([
		runHook(root, event('one')),
		runHook(root, event('one')),
		runHook(root, event('two'))
	]);
	assert.equal(results.filter((result) => feedback(result)).length, 2);
	assert.equal(
		(await readdir(path.join(root, '.context/ui-harness'))).filter((file) => file.endsWith('.json'))
			.length,
		2
	);
});
test('검사 실패 후에도 다음 검사에서 재시도한다', async (t) => {
	const root = await fixture(t);
	await rm(path.join(root, 'src/lib/styles/tokens.css'));
	await assert.rejects(runHook(root, event()));
	await writeFile(path.join(root, 'src/lib/styles/tokens.css'), ':root{--space-8:8px}');
	await writeFile(path.join(root, 'src/page.css'), '.a{gap:3px}');
	assert.match(feedback(await runHook(root, event())), /ui\/spacing/);
});
test('Plan 모드에서는 검사 상태를 기록하지 않는다', async (t) => {
	const root = await fixture(t);
	assert.deepEqual(await runHook(root, { ...event(), permission_mode: 'plan' }), {});
	await assert.rejects(readdir(path.join(root, '.context')), { code: 'ENOENT' });
});

test('공통 제목에 붙인 별도 class를 통한 외부 CSS 덮어쓰기도 검사한다', async (t) => {
	const root = await fixture(t);
	await writeFile(
		path.join(root, 'src/page.svelte'),
		'<script>import { SectionHeader as Heading } from "$lib/components/ui";</script><Heading class="custom-heading" title="안내" />'
	);
	await writeFile(
		path.join(root, 'src/page.css'),
		'.custom-heading h2{font-size:var(--font-size-14)}'
	);
	assert.match(feedback(await runHook(root, event())), /ui\/override/);
});

test('공통 제목 class의 추가·변경·삭제를 감지하고 기존 CSS도 재검사한다', async (t) => {
	const root = await fixture(t);
	const page = path.join(root, 'src/page.svelte');
	const markup = (name) =>
		`<script>import { SectionHeader as Heading } from "$lib/components/ui";</script><Heading class="${name}" title="안내" />`;
	await writeFile(page, '<div class="heading">안내</div>');
	await writeFile(path.join(root, 'src/page.css'), '.heading h2{font-size:var(--font-size-14)}');
	await writeFile(
		path.join(root, 'src/other.svelte'),
		'<style>.other h2{font-size:var(--font-size-14)}</style>'
	);
	assert.deepEqual(await runHook(root, event()), {});
	await writeFile(page, markup('heading'));
	assert.match(feedback(await runHook(root, event())), /page.css.*ui\/override/);
	assert.deepEqual(await runHook(root, event()), {});
	// 제목 사용 정보가 그대로면 관계없는 문구 수정으로 경고를 반복하지 않는다.
	await writeFile(path.join(root, 'src/text.svelte'), '<p>수정한 문구</p>');
	assert.deepEqual(await runHook(root, event()), {});
	await writeFile(page, markup('other'));
	const renamed = feedback(await runHook(root, event()));
	assert.match(renamed, /other.svelte.*ui\/override/);
	assert.doesNotMatch(renamed, /page.css/);
	await rm(page);
	assert.deepEqual(await runHook(root, event()), {});
	await writeFile(page, markup('heading'));
	assert.match(feedback(await runHook(root, event())), /page.css.*ui\/override/);
});
