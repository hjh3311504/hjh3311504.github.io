// 실행: node scripts/generate_blog_json_examples.js
// 의도적으로 잘못된 JSON 예제의 바이트를 포맷 도구로 고치지 않는다.
import assert from 'node:assert/strict';
import { mkdir, writeFile, readFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { chromium } from '@playwright/test';

const destination = new URL('../static/downloads/blog/json-syntax/', import.meta.url);
await mkdir(destination, { recursive: true });
const expected = { name: '오후 모임', count: 3 };
const corrected = JSON.stringify(expected) + '\n';
const samples = [
	{ file: 'valid.json', text: JSON.stringify(expected, null, 2) + '\n', valid: true },
	{ file: 'compact.json', text: corrected, valid: true },
	{ file: 'trailing-comma.json', text: '{"name":"오후 모임","count":3,}\n', valid: false },
	{ file: 'single-quotes.json', text: "{'name':'오후 모임','count':3}\n", valid: false },
	{ file: 'comment.json', text: '{"name":"오후 모임",/* 참가 인원 */"count":3}\n', valid: false },
	{ file: 'missing-comma.json', text: '{"name":"오후 모임" "count":3}\n', valid: false },
	{ file: 'curly-quotes.json', text: '{“name”:“오후 모임”,“count”:3}\n', valid: false }
];
const browser = await chromium.launch();
try {
	const page = await browser.newPage();
	const results = [];
	for (const sample of samples) {
		const path = new URL(sample.file, destination);
		await writeFile(path, sample.text, 'utf8');
		const bytes = await readFile(path);
		const text = bytes.toString('utf8');
		const nodeResult = parse(text);
		const chromiumResult = await page.evaluate(parse, text);
		assert.equal(nodeResult.valid, sample.valid);
		assert.equal(chromiumResult.valid, sample.valid);
		if (sample.valid) {
			assert.deepEqual(nodeResult.value, expected);
			assert.deepEqual(chromiumResult.value, expected);
		} else {
			assert.equal(nodeResult.error, 'SyntaxError');
			assert.equal(chromiumResult.error, 'SyntaxError');
		}
		results.push({
			file: sample.file,
			bytes: bytes.length,
			sha256: createHash('sha256').update(bytes).digest('hex'),
			node: nodeResult,
			chromium: chromiumResult
		});
	}
	// 본문의 수정 방법을 각각 적용하고 같은 내용으로 돌아오는지 확인한다.
	const repaired = [
		samples[2].text.replace(',}', '}'),
		samples[3].text.replaceAll("'", '"'),
		samples[4].text.replace('/* 참가 인원 */', ''),
		samples[5].text.replace('" "count"', '","count"'),
		samples[6].text.replaceAll('“', '"').replaceAll('”', '"')
	];
	for (const text of repaired) {
		assert.deepEqual(JSON.parse(text), expected);
		assert.deepEqual((await page.evaluate(parse, text)).value, expected);
	}
	const record = {
		measuredAt: new Date().toISOString(),
		node: process.version,
		chromium: browser.version(),
		platform: `${process.platform}/${process.arch}`,
		method: 'UTF-8 files without BOM; JSON.parse of saved text in Node.js and Chromium',
		limit: 'Syntax only; not validation of any application settings or VS Code GUI',
		repairsChecked: repaired.length,
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

function parse(text) {
	try {
		return { valid: true, value: JSON.parse(text) };
	} catch (error) {
		return { valid: false, error: error.name, message: error.message };
	}
}
