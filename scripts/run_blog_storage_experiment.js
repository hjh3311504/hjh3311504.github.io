import { spawnSync } from 'node:child_process';
import { mkdir, writeFile } from 'node:fs/promises';
import measure from './blog_storage_experiment.js';

// 먼저 독립된 Playwright CLI 세션에서 로컬 개발 서버를 연다.
// node scripts/run_blog_storage_experiment.js /path/to/playwright_cli.sh blog-storage
const executable = process.argv[2] || 'playwright-cli';
const session = process.argv[3] || 'blog-storage';
await mkdir('static/images/blog/browser-storage', { recursive: true });
await mkdir('static/downloads/blog/browser-storage', { recursive: true });
const result = spawnSync(executable, ['--session', session, 'run-code', measure.toString()], {
	encoding: 'utf8',
	timeout: 120_000
});
if (result.error) throw result.error;
if (result.status !== 0) throw new Error(result.stderr || result.stdout);
const match = result.stdout.match(/### Result\n([^\n]+)/);
if (!match) throw new Error(`실험 결과 JSON이 없습니다.\n${result.stdout}`);
const evidence = JSON.parse(match[1]);
if (!evidence.cases?.deleted || !evidence.browser) throw new Error('실험 결과 필드가 없습니다.');
await writeFile(
	'static/downloads/blog/browser-storage/measurements.json',
	JSON.stringify(evidence, null, 2) + '\n'
);
console.log(JSON.stringify(evidence, null, 2));
