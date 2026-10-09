import assert from 'node:assert/strict';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import QRCode from 'qrcode';
import jsQR from 'jsqr';
import sharp from 'sharp';
import * as fontkit from 'fontkit';
import { decompress } from 'wawoff2';

// 카메라 촬영이 아닌 PNG 픽셀의 해독 실험이다. 기존 예제는 덮어쓰지 않는다.
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const downloads = path.join(root, 'static/downloads/blog/qr-readability');
const images = path.join(root, 'static/images/blog/qr-readability');
await mkdir(downloads, { recursive: true });
await mkdir(images, { recursive: true });
const content = 'https://hjh3311504.github.io/qr-code';
const modules = QRCode.create(content, { errorCorrectionLevel: 'M' }).modules.size;
const original = await QRCode.toBuffer(content, { errorCorrectionLevel: 'M', margin: 4, scale: 8 });
const cropped = await sharp(original)
	.extract({ left: 32, top: 32, width: modules * 8, height: modules * 8 })
	.png()
	.toBuffer();
const small = await sharp(original).resize(32, 32, { kernel: 'lanczos3' }).png().toBuffer();
const enlarged = await sharp(small)
	.resize((modules + 8) * 8, (modules + 8) * 8, { kernel: 'nearest' })
	.png()
	.toBuffer();
const variants = [
	['original.png', '원본 · 여백4칸', original, '4모듈 여백, 모듈당8px'],
	['no-margin.png', '여백 제거', cropped, '원본의 바깥 흰 여백만 잘라냄'],
	['small-32.png', '32px로 축소', small, 'Lanczos3로32×32px 축소'],
	['enlarged.png', '축소본 다시 확대', enlarged, '32px 축소본을 최근접 보간으로 원본 크기까지 확대']
];
const files = [];
for (const [name, , buffer, operation] of variants) {
	await writeFile(path.join(downloads, name), buffer);
	const { data, info } = await sharp(buffer)
		.ensureAlpha()
		.raw()
		.toBuffer({ resolveWithObject: true });
	const decoded = jsQR(new Uint8ClampedArray(data), info.width, info.height, {
		inversionAttempts: 'dontInvert'
	});
	if (decoded) assert.equal(decoded.data, content, '해독 결과는 입력 주소와 같아야 한다');
	files.push({
		file: name,
		operation,
		width: info.width,
		height: info.height,
		bytes: buffer.length,
		decoded: decoded?.data ?? null,
		matchesOriginal: decoded?.data === content,
		sha256: createHash('sha256').update(buffer).digest('hex')
	});
}
assert.equal(files[0].matchesOriginal, true);
const packageVersion = async (name) =>
	JSON.parse(await readFile(path.join(root, 'node_modules', name, 'package.json'), 'utf8')).version;
await writeFile(
	path.join(downloads, 'measurements.json'),
	JSON.stringify(
		{
			measuredAt: new Date().toISOString(),
			content,
			modules,
			errorCorrectionLevel: 'M',
			method: 'PNG RGBA pixels decoded by jsQR; no camera, printer, or phone tested',
			node: process.version,
			qrcode: await packageVersion('qrcode'),
			jsqr: await packageVersion('jsqr'),
			sharp: sharp.versions,
			files
		},
		null,
		2
	) + '\n'
);
const font = fontkit
	.create(
		Buffer.from(
			await decompress(
				await readFile(path.join(root, 'src/lib/team-maker/fonts/SUIT-Variable.woff2'))
			)
		)
	)
	.getVariation({ wght: 400 });
function label(value, x, y, size) {
	const run = font.layout(value);
	let cursor = x;
	return run.glyphs
		.map((glyph, index) => {
			const pos = run.positions[index];
			const scale = size / font.unitsPerEm;
			const result = `<path fill="#172b40" transform="translate(${cursor + pos.xOffset * scale},${y - pos.yOffset * scale}) scale(${scale},${-scale})" d="${glyph.path.toSVG()}"/>`;
			cursor += pos.xAdvance * scale;
			return result;
		})
		.join('');
}
let body = '<rect width="640" height="760" fill="white"/>';
for (let i = 0; i < variants.length; i++) {
	const [, title, buffer] = variants[i];
	const left = (i % 2) * 320 + 24;
	const top = Math.floor(i / 2) * 380;
	const preview = await sharp(buffer).resize(272, 272, { kernel: 'nearest' }).png().toBuffer();
	body += label(title, left, top + 36, 22);
	body += `<image x="${left}" y="${top + 60}" width="272" height="272" href="data:image/png;base64,${preview.toString('base64')}"/>`;
	body += label(
		`${files[i].width}×${files[i].height}px · ${files[i].matchesOriginal ? '해독 성공' : '해독 실패'}`,
		left,
		top + 364,
		20
	);
}
await sharp(
	Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="640" height="760">${body}</svg>`)
)
	.png()
	.toFile(path.join(images, 'comparison.png'));
console.log(JSON.stringify({ modules, files }, null, 2));
