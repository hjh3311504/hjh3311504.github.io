import assert from 'node:assert/strict';
import { mkdtemp, mkdir, writeFile, rm } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';
import { verifyTeamMakerCss } from '../../scripts/verify_team_maker_css.js';

async function fixture(
	t,
	entry = '.entry { font-size: 14px; }',
	nested = '.nested { font-size: 16px; }'
) {
	const root = await mkdtemp(path.join(os.tmpdir(), 'team-maker-css-'));
	t.after(() => rm(root, { recursive: true, force: true }));
	const sources = {
		'src/routes/team-maker/team-maker.css': entry,
		'src/lib/team-maker/styles/base.css': '.base { font-size: 12px; }',
		'src/lib/team-maker/styles/nested/deeper/extra.css': nested,
		'src/lib/team-maker/styles/ignored.txt': 'font-size: 13px'
	};
	for (const [file, source] of Object.entries(sources)) {
		await mkdir(path.dirname(path.join(root, file)), { recursive: true });
		await writeFile(path.join(root, file), source);
	}
	return root;
}

test('진입점과 중첩 CSS의 짝수 px는 통과하며 CSS 외 파일은 제외한다', async (t) => {
	await verifyTeamMakerCss(await fixture(t));
});

test('진입점의 홀수 px 오류에 파일과 값을 표시한다', async (t) => {
	const root = await fixture(t, '.entry { font-size: 13px; }');
	await assert.rejects(verifyTeamMakerCss(root), /src\/routes\/team-maker\/team-maker\.css: 13px/);
});

test('중첩 폴더의 홀수 px 오류에 파일과 모든 값을 표시한다', async (t) => {
	const root = await fixture(t, undefined, '.a { font-size: 15px; } .b { font-size: 17px; }');
	await assert.rejects(verifyTeamMakerCss(root), /styles\/nested\/deeper\/extra\.css: 15px, 17px/);
});
