import assert from 'node:assert/strict';
import { execFileSync, spawn } from 'node:child_process';
import { createHash } from 'node:crypto';
import { once } from 'node:events';
import { mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { createInterface } from 'node:readline';
import { fileURLToPath } from 'node:url';
import { chromium } from '@playwright/test';

// 정렬 화면을 구현하지 않고 Python 기본 파일 목록을 그대로 열어 순서를 기록한다.
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const downloadDirectory = path.join(root, 'static/downloads/blog/filename-order');
const imageDirectory = path.join(root, 'static/images/blog/filename-order');
const source = JSON.parse(
	await readFile(path.join(downloadDirectory, 'measurements.json'), 'utf8')
);
const cases = [
	{ directory: 'unpadded', files: source.input, expected: source.textOrder },
	{ directory: 'padded', files: source.paddedInput, expected: source.paddedTextOrder },
	{ directory: 'unpadded-dates', files: source.dateInput, expected: source.unpaddedDateOrder },
	{ directory: 'padded-dates', files: source.paddedDateInput, expected: source.paddedDateOrder }
];
const temporaryDirectory = await mkdtemp(path.join(os.tmpdir(), 'blog-filename-experiment-'));
let browser;
let server;
let serverExit;
try {
	for (const item of cases) {
		const folder = path.join(temporaryDirectory, item.directory);
		await mkdir(folder);
		for (const file of item.files) {
			await writeFile(path.join(folder, file), `정렬 확인용 가상 모임 자료: ${file}\n`);
		}
	}
	await mkdir(imageDirectory, { recursive: true });
	const zipPath = path.join(downloadDirectory, 'filename-examples.zip');
	execFileSync('python3', [
		'-c',
		`import pathlib, sys, zipfile
source = pathlib.Path(sys.argv[1])
with zipfile.ZipFile(sys.argv[2], 'w', compression=zipfile.ZIP_DEFLATED) as archive:
    for file in sorted(source.rglob('*.txt')):
        info = zipfile.ZipInfo(file.relative_to(source).as_posix(), (2026, 10, 13, 0, 0, 0))
        info.compress_type = zipfile.ZIP_DEFLATED
        info.external_attr = 0o100644 << 16
        archive.writestr(info, file.read_bytes())`,
		temporaryDirectory,
		zipPath
	]);
	server = spawn('python3', [
		'-u',
		'-c',
		`from functools import partial
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
import json, platform, sys
handler = partial(SimpleHTTPRequestHandler, directory=sys.argv[1])
with ThreadingHTTPServer(('127.0.0.1', 0), handler) as server:
    print(json.dumps({'port': server.server_port, 'python': platform.python_version()}), flush=True)
    server.serve_forever()`,
		temporaryDirectory
	]);
	serverExit = once(server, 'exit');
	// 시작 실패를 바로 감지하고 로컬 서버를 남기지 않는다.
	serverExit.catch(() => {});
	const lines = createInterface({ input: server.stdout });
	let serverErrors = '';
	server.stderr.on('data', (chunk) => (serverErrors += chunk.toString()));
	const ready = await new Promise((resolve, reject) => {
		const timeout = setTimeout(() => reject(new Error('파일 목록 서버 시작 시간 초과')), 10000);
		const fail = (error) => {
			clearTimeout(timeout);
			reject(error);
		};
		server.once('error', fail);
		server.once('exit', (code) => fail(new Error(`파일 목록 서버 종료: ${code} ${serverErrors}`)));
		lines.once('line', (line) => {
			clearTimeout(timeout);
			try {
				resolve(JSON.parse(line));
			} catch (error) {
				reject(error);
			}
		});
	});
	browser = await chromium.launch({ headless: true });
	const page = await browser.newPage({
		viewport: { width: 360, height: 300 },
		deviceScaleFactor: 2
	});
	const results = [];
	for (const item of cases) {
		const response = await page.goto(`http://127.0.0.1:${ready.port}/${item.directory}/`);
		assert.equal(response.status(), 200);
		const displayedNames = await page.locator('li a').allTextContents();
		assert.deepEqual(displayedNames, item.expected);
		const screenshot = `${item.directory}.png`;
		await page.screenshot({ path: path.join(imageDirectory, screenshot) });
		results.push({
			directory: item.directory,
			createdNames: item.files,
			displayedNames,
			screenshot
		});
	}
	const zip = await readFile(zipPath);
	await writeFile(
		path.join(downloadDirectory, 'browser-measurements.json'),
		JSON.stringify(
			{
				measuredAt: new Date().toISOString(),
				platform: { system: os.platform(), release: os.release() },
				python: ready.python,
				chromium: browser.version(),
				method:
					'Actual files served by Python SimpleHTTPRequestHandler; unmodified directory listing in Chromium',
				viewport: { width: 360, height: 300, deviceScaleFactor: 2 },
				archive: {
					file: 'filename-examples.zip',
					bytes: zip.length,
					sha256: createHash('sha256').update(zip).digest('hex')
				},
				cases: results
			},
			null,
			2
		) + '\n'
	);
	console.log(
		'실제 파일 목록4개 확인 완료: Python ' + ready.python + ', Chromium ' + browser.version()
	);
} finally {
	await browser?.close();
	if (server && server.exitCode === null && !server.killed) server.kill();
	await serverExit?.catch(() => {});
	await rm(temporaryDirectory, { recursive: true, force: true });
}
