// 실행: node scripts/generate_blog_download_examples.js
// 로컬 서버2개의 응답과 Chromium의 실제 링크 클릭·다운로드를 비교한다.
import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { once } from 'node:events';
import { createHash } from 'node:crypto';
import { mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { chromium } from '@playwright/test';

const destination = new URL('../static/downloads/blog/browser-download/', import.meta.url);
await mkdir(destination, { recursive: true });
const text = '오후 모임 준비물\n공책 1권\n연필 2자루\n';
const bytes = Buffer.from(text, 'utf8');
const sha256 = (value) => createHash('sha256').update(value).digest('hex');
await writeFile(new URL('meeting.txt', destination), bytes);
const responses = [];
const servers = [];
let browser;
const temporary = await mkdtemp(path.join(tmpdir(), 'blog-download-'));
try {
	const otherOrigin = await startServer((req, res) => {
		if (req.url === '/meeting.txt') sendText(req, res, 'inline', 'other-origin');
		else res.writeHead(404).end();
	});
	const origin = await startServer((req, res) => {
		if (req.url === '/') {
			res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
			res.end(`<!doctype html><html lang="ko"><meta charset="utf-8"><title>파일 저장 비교</title>
			<a id="inline" href="/inline/meeting.txt">화면에서 열기</a>
			<a id="attachment" href="/attachment/meeting.txt">서버가 저장 요청</a>
			<a id="same-origin" href="/inline/meeting.txt" download="link-copy.txt">같은 출처 저장</a>
			<a id="cross-origin" href="${otherOrigin}/meeting.txt" download="link-copy.txt">다른 출처 저장</a>
			</html>`);
		} else if (req.url === '/attachment/meeting.txt') {
			sendText(req, res, 'attachment; filename="meeting.txt"', 'same-origin');
		} else if (req.url === '/inline/meeting.txt') {
			sendText(req, res, 'inline', 'same-origin');
		} else {
			res.writeHead(404).end();
		}
	});
	browser = await chromium.launch();
	const context = await browser.newContext({
		acceptDownloads: true,
		locale: 'ko-KR',
		serviceWorkers: 'block'
	});
	// 실험 페이지의 요청은 이 프로세스의 로컬 서버로만 보낸다.
	await context.route('**/*', (route) => {
		const url = new URL(route.request().url());
		return [origin, otherOrigin].includes(url.origin) ? route.continue() : route.abort();
	});
	const results = [];
	for (const id of ['inline', 'attachment', 'same-origin', 'cross-origin']) {
		const page = await context.newPage();
		const downloads = [];
		page.on('download', (download) => downloads.push(download));
		await page.goto(origin);
		const responseStart = responses.length;
		const shouldDownload = ['attachment', 'same-origin'].includes(id);
		let result;
		if (shouldDownload) {
			const [download] = await Promise.all([
				page.waitForEvent('download'),
				page.locator(`#${id}`).click()
			]);
			const saved = path.join(temporary, `${id}.txt`);
			await download.saveAs(saved);
			const actual = await readFile(saved);
			assert.deepEqual(actual, bytes);
			assert.equal(await download.failure(), null);
			const suggestedFilename = download.suggestedFilename();
			assert.equal(suggestedFilename, id === 'attachment' ? 'meeting.txt' : 'link-copy.txt');
			result = {
				behavior: 'download',
				suggestedFilename,
				bytes: actual.length,
				sha256: sha256(actual)
			};
		} else {
			const target =
				id === 'inline' ? `${origin}/inline/meeting.txt` : `${otherOrigin}/meeting.txt`;
			await Promise.all([page.waitForURL(target), page.locator(`#${id}`).click()]);
			await page.waitForLoadState();
			const displayedText = await page.locator('pre').textContent();
			assert.equal(displayedText, text);
			assert.equal(downloads.length, 0);
			result = { behavior: 'display', displayedText, downloadCount: downloads.length };
		}
		const expectedOrigin = id === 'cross-origin' ? 'other-origin' : 'same-origin';
		const expectedPath =
			id === 'cross-origin'
				? '/meeting.txt'
				: shouldDownload && id === 'attachment'
					? '/attachment/meeting.txt'
					: '/inline/meeting.txt';
		const response = responses
			.slice(responseStart)
			.find((item) => item.origin === expectedOrigin && item.path === expectedPath);
		assert.ok(response, `${id}: 클릭한 파일의 응답 기록이 없습니다.`);
		results.push({ id, ...response, ...result });
		await page.close();
	}
	const record = {
		measuredAt: new Date().toISOString(),
		node: process.version,
		chromium: browser.version(),
		platform: `${process.platform}/${process.arch}`,
		method:
			'Headless Chromium; link clicks on two 127.0.0.1 servers with different ports; identical UTF-8 text bytes',
		limit:
			'Not a test of Chrome context menus, Android, iOS, Safari, login pages, or blocked downloads',
		original: { file: 'meeting.txt', bytes: bytes.length, sha256: sha256(bytes) },
		results
	};
	await writeFile(
		new URL('measurements.json', destination),
		JSON.stringify(record, null, 2) + '\n'
	);
	console.log(JSON.stringify(record, null, 2));
} finally {
	await browser?.close();
	await Promise.all(servers.map((server) => new Promise((resolve) => server.close(resolve))));
	await rm(temporary, { recursive: true, force: true });
}

async function startServer(handler) {
	const server = createServer(handler);
	servers.push(server);
	server.listen(0, '127.0.0.1');
	await once(server, 'listening');
	return `http://127.0.0.1:${server.address().port}`;
}

function sendText(req, res, disposition, origin) {
	const headers = {
		'Content-Type': 'text/plain; charset=utf-8',
		'Content-Disposition': disposition
	};
	responses.push({ origin, path: req.url, headers });
	res.writeHead(200, headers);
	res.end(bytes);
}
