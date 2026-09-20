import assert from 'node:assert/strict';
import { mkdtemp, mkdir, writeFile, rm } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';
import { verifyTeamMakerCss } from '../../scripts/verify_team_maker_css.js';

async function fixture(
	t,
	entry = '.entry { font-size: var(--font-size-14); }',
	nested = '.nested { font-size: var(--font-size-16); }'
) {
	const root = await mkdtemp(path.join(os.tmpdir(), 'team-maker-css-'));
	t.after(() => rm(root, { recursive: true, force: true }));
	const sources = {
		'src/routes/team-maker/team-maker.css': entry,
		'src/lib/styles/tokens.css':
			':root { --font-size-12:12px; --font-size-14:14px; --font-size-16:16px; }',
		'src/lib/team-maker/styles/base.css': '.base { font-size: var(--font-size-12); }',
		'src/lib/team-maker/styles/nested/deeper/extra.css': nested,
		'src/lib/team-maker/styles/ignored.txt': 'font-size: 13px'
	};
	for (const [file, source] of Object.entries(sources)) {
		await mkdir(path.dirname(path.join(root, file)), { recursive: true });
		await writeFile(path.join(root, file), source);
	}
	return root;
}

test('진입점과 중첩 CSS의 공통 토큰은 통과하며 CSS 외 파일은 제외한다', async (t) => {
	await verifyTeamMakerCss(await fixture(t));
});

test('진입점의 홀수 px 오류에 파일 위치와 규칙을 표시한다', async (t) => {
	const root = await fixture(t, '.entry { font-size: 13px; }');
	await assert.rejects(
		verifyTeamMakerCss(root),
		/src\/routes\/team-maker\/team-maker\.css:\d+:\d+ \[ui\/font\]/
	);
});

test('중첩 폴더의 홀수 px 오류에 파일 위치와 규칙을 표시한다', async (t) => {
	const root = await fixture(t, undefined, '.a { font-size: 15px; } .b { font-size: 17px; }');
	await assert.rejects(
		verifyTeamMakerCss(root),
		/styles\/nested\/deeper\/extra\.css:\d+:\d+ \[ui\/font\]/
	);
});
