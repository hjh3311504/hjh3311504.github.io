import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { decompress } from 'wawoff2';
import sharp from 'sharp';
import jsQR from 'jsqr';
import QRCode from 'qrcode';
import {
	IMAGE_WIDTH,
	TITLE_TOP,
	QR_SIZE,
	QR_LEFT,
	QR_TOP,
	imageHeight
} from '../../src/lib/qr-code/image-layout.js';
import { createTitleFont, createTitleOutline } from '../../src/lib/qr-code/title-outline.js';
import {
	createQrGeometry,
	createQrImage,
	createSvg,
	downloadName
} from '../../src/lib/qr-code/qr.js';

const bytes = await decompress(
	await readFile(new URL('../../src/lib/team-maker/fonts/SUIT-Variable.woff2', import.meta.url))
);
const font = createTitleFont(bytes);

test('실제 SUIT 700 윤곽선은 한글과 기호를 글꼴 없는 SVG로 내보낸다', async () => {
	assert.deepEqual(font.variationCoords, [700]);
	for (const title of ['한글ABC123&<', '한'.repeat(10), 'gjpqy', '', '한글']) {
		const outline = createTitleOutline(font, title);
		assert.deepEqual(outline.unsupported, []);
		assert.equal(outline.paths.length > 0, Boolean(title));
		const svg = createSvg(createQrGeometry('https://example.com'), outline);
		assert.doesNotMatch(svg, /<text\b|<image\b|font-family|@font-face|<script\b|foreignObject|NaN/);
		assert.match(svg, /id="qr-code"/);
		assert.match(svg, /id="qr-title"/);
		const { data, info } = await sharp(Buffer.from(svg))
			.ensureAlpha()
			.raw()
			.toBuffer({ resolveWithObject: true });
		assert.equal(info.width, 1024);
		assert.equal(info.height, imageHeight(outline.lines.length));
		assert.equal(outline.lines.length, title ? 1 : 0);
		assert.equal(
			jsQR(new Uint8ClampedArray(data), info.width, info.height)?.data,
			'https://example.com'
		);
		if (title) {
			const titlePixels = data.subarray(IMAGE_WIDTH * TITLE_TOP * 4);
			assert.ok(
				titlePixels.some((value, index) => index % 4 !== 3 && value < 128),
				'제목이 실제로 그려져야 한다'
			);
			const inkRows = [];
			for (let y = TITLE_TOP; y < info.height; y++) {
				if (
					data
						.subarray(y * IMAGE_WIDTH * 4, (y + 1) * IMAGE_WIDTH * 4)
						.some((value, index) => index % 4 !== 3 && value < 128)
				)
					inkRows.push(y);
			}
			assert.ok(
				Math.abs((inkRows[0] + inkRows.at(-1) + 1) / 2 - (TITLE_TOP + 44)) <= 1,
				'제목의 실제 윤곽선을 88px 영역의 세로 가운데에 배치해야 한다'
			);
		}
	}
});

test('글꼴에 없는 제목 글자를 버리거나 대체 도형으로 바꾸지 않는다', () => {
	const outline = createTitleOutline(font, '안내 😀 漢 😀');
	assert.deepEqual(outline.unsupported, ['😀', '漢']);
	assert.deepEqual(outline.paths, []);
});

test('촘촘한 QR도 SVG를 렌더링한 뒤 원문 그대로 해독한다', async () => {
	for (const content of ['https://example.com/한글?q=😀', '한'.repeat(600), 'a'.repeat(1800)]) {
		const svg = createSvg(createQrGeometry(content), { lines: [], paths: [] });
		const { data, info } = await sharp(Buffer.from(svg))
			.ensureAlpha()
			.raw()
			.toBuffer({ resolveWithObject: true });
		assert.equal(info.height, 832);
		assert.equal(jsQR(new Uint8ClampedArray(data), info.width, info.height)?.data, content);
		// 모든 QR 무늬가 지정된 768px 영역 안에 있어야 한다.
		for (let y = 0; y < info.height; y++) {
			for (let x = 0; x < info.width; x++) {
				if (x >= QR_LEFT && x < QR_LEFT + QR_SIZE && y >= QR_TOP && y < QR_TOP + QR_SIZE) continue;
				assert.equal(data[(y * info.width + x) * 4], 255);
			}
		}
	}
});

test('PNG와 SVG 파일 이름은 형식에 맞는 확장자를 사용한다', () => {
	assert.equal(downloadName('안내'), '안내.png');
	assert.equal(downloadName('안내', 'svg'), '안내.svg');
	assert.equal(downloadName('', 'svg'), 'qr-code.svg');
	assert.throws(() => downloadName('안내', 'html'));
});

test('SVG 출력은 준비된 QR·제목을 재사용하며 PNG Canvas 없이 만든다', async (t) => {
	const path = createQrGeometry('https://example.com/export');
	const outline = createTitleOutline(font, 'SUIT 제목');
	const encoding = t.mock.method(QRCode, 'create', () => {
		throw new Error('출력할 때 QR을 다시 계산하면 안 됩니다.');
	});
	// Node에는 document·Canvas가 없으므로 PNG용 Canvas에 접근해도 실패한다.
	const blob = await createQrImage(path, outline, 'svg');
	assert.equal(blob.type, 'image/svg+xml;charset=utf-8');
	assert.equal(await blob.text(), createSvg(path, outline));
	assert.equal(encoding.mock.callCount(), 0);
	await assert.rejects(createQrImage(path, { ...outline, svgError: '지원하지 않는 글자' }, 'svg'));
});
