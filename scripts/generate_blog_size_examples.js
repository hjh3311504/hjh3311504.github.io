// 실행: node scripts/generate_blog_size_examples.js
// 예제 원본은 output/에, 공개 측정 기록은 static/downloads/blog/file-size/에 저장한다.
import assert from 'node:assert/strict';
import { mkdir, writeFile, stat, readFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { chromium } from '@playwright/test';

const root = new URL('../', import.meta.url);
const samples = new URL('output/blog-file-size/', root);
const destination = new URL('static/downloads/blog/file-size/', root);
await mkdir(samples, { recursive: true });
await mkdir(destination, { recursive: true });
const sizes = [999999, 1000000, 1048576];
const paths = [];
for (const bytes of sizes) {
	const file = new URL(`sample-${bytes}.txt`, samples);
	await writeFile(file, Buffer.alloc(bytes, 65));
	assert.equal((await stat(file)).size, bytes);
	paths.push(fileURLToPath(file));
}
const browser = await chromium.launch();
try {
	const page = await browser.newPage();
	await page.setContent('<input type="file" multiple aria-label="용량 측정 예제">');
	await page.locator('input').setInputFiles(paths);
	const results = await page.locator('input').evaluate((input) =>
		Array.from(input.files, (file) => ({
			file: file.name,
			bytes: file.size,
			MB: (file.size / 1000000).toFixed(6),
			MiB: (file.size / 1048576).toFixed(6),
			roundedMB: (file.size / 1000000).toFixed(2),
			atMostOneMB: file.size <= 1000000,
			belowOneMB: file.size < 1000000
		}))
	);
	assert.deepEqual(
		results.map((row) => row.bytes),
		sizes
	);
	assert.deepEqual(
		results.map((row) => row.atMostOneMB),
		[true, true, false]
	);
	assert.deepEqual(
		results.map((row) => row.belowOneMB),
		[true, false, false]
	);
	for (let index = 0; index < paths.length; index++) {
		results[index].sha256 = createHash('sha256')
			.update(await readFile(paths[index]))
			.digest('hex');
	}
	const record = {
		measuredAt: new Date().toISOString(),
		node: process.version,
		chromium: browser.version(),
		platform: `${process.platform}/${process.arch}`,
		input: 'ASCII A (0x41) repeated; no newline; local file input only; no upload',
		limit: 'Local comparison only; not the policy of any upload service',
		results
	};
	await writeFile(
		new URL('measurements.json', destination),
		JSON.stringify(record, null, 2) + '\n'
	);
	console.log(JSON.stringify(record, null, 2));
} finally {
	await browser.close();
}
