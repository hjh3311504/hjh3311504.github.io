import { mkdir, writeFile, readFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';
import * as fontkit from 'fontkit';
import wawoff2 from 'wawoff2';

// 블로그의 파일 비교 실험. npm build와 분리해 원본과 측정값을 보존한다.
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const downloads = path.join(root, 'static/downloads/blog/file-guides');
const images = path.join(root, 'static/images/blog/file-guides');
await mkdir(downloads, { recursive: true });
await mkdir(images, { recursive: true });
const fontBytes = await wawoff2.decompress(
	await readFile(path.join(root, 'src/lib/team-maker/fonts/SUIT-Variable.woff2'))
);
const font = fontkit.create(Buffer.from(fontBytes)).getVariation({ wght: 400 });

function text(value, x, y, size, color = '#172b40') {
	const run = font.layout(value);
	let cursor = x;
	return run.glyphs
		.map((glyph, index) => {
			const position = run.positions[index];
			const scale = size / font.unitsPerEm;
			const element = `<path fill="${color}" transform="translate(${cursor + position.xOffset * scale},${y - position.yOffset * scale}) scale(${scale},${-scale})" d="${glyph.path.toSVG()}"/>`;
			cursor += position.xAdvance * scale;
			return element;
		})
		.join('');
}

const svg = (width, height, body) =>
	Buffer.from(
		`<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}">${body}</svg>`
	);
const rows = [];
async function save(name, buffer, settings) {
	await writeFile(path.join(downloads, name), buffer);
	const { width, height } = await sharp(buffer).metadata();
	rows.push({
		file: name,
		width,
		height,
		bytes: buffer.length,
		sha256: createHash('sha256').update(buffer).digest('hex'),
		...settings
	});
	return buffer;
}

const card = svg(
	1200,
	800,
	`
<rect width="1200" height="800" fill="#fff"/>
<rect x="48" y="48" width="1104" height="120" rx="16" fill="#e8f1f5"/>
${text('파일 비교 실험 · 글자와 도형', 80, 105, 36)}
${text('같은 원본을 다른 형식으로 저장했습니다.', 80, 142, 22)}
${text('작은 글자 0123456789 가나다라마', 80, 226, 20)}
${text('파란 글자 · 경계선과 주변 색을 확인하세요.', 80, 264, 20, '#005bce')}
<path d="M80 294H1120" stroke="#23465c" stroke-width="1"/>
${text('항목', 80, 356, 26)}${text('원본 크기', 440, 356, 26)}${text('확인할 부분', 760, 356, 26)}
${text('안내 카드', 80, 416, 24)}${text('1200 × 800', 440, 416, 24)}${text('글자 테두리', 760, 416, 24)}
${text('색상 막대', 80, 480, 24)}${text('같은 색 유지', 440, 480, 24)}${text('번짐과 잡티', 760, 480, 24)}
<rect x="80" y="540" width="320" height="100" fill="#005bce"/>
<rect x="400" y="540" width="320" height="100" fill="#f38b40"/>
<rect x="720" y="540" width="400" height="100" fill="#16354a"/>
${text('실제 서비스 화면이나 사진이 아닌, 직접 만든 시험용 카드입니다.', 80, 716, 22)}
`
);
await writeFile(path.join(downloads, 'text-card-source.svg'), card);
const png = await save(
	'text-card.png',
	await sharp(card).removeAlpha().png({ compressionLevel: 9 }).toBuffer(),
	{ format: 'png', compressionLevel: 9 }
);
const jpg90 = await save(
	'text-card-q90.jpg',
	await sharp(png).jpeg({ quality: 90, chromaSubsampling: '4:2:0' }).toBuffer(),
	{ format: 'jpeg', quality: 90, chromaSubsampling: '4:2:0' }
);
const jpg45 = await save(
	'text-card-q45.jpg',
	await sharp(png).jpeg({ quality: 45, chromaSubsampling: '4:2:0' }).toBuffer(),
	{ format: 'jpeg', quality: 45, chromaSubsampling: '4:2:0' }
);
const originalPixels = await sharp(png).raw().toBuffer();
const restoredPixels = await sharp(await sharp(png).png().toBuffer())
	.raw()
	.toBuffer();
if (!originalPixels.equals(restoredPixels)) throw new Error('PNG 재저장 후 픽셀이 달라졌습니다.');

async function compare(name, entries, crop, scale, title) {
	const rowHeight = crop.height * scale + 70;
	const width = 960;
	const height = 90 + rowHeight * entries.length;
	let labels = `<rect width="${width}" height="${height}" fill="#f4f7fa"/>${text(title, 32, 48, 28)}`;
	const parts = [];
	for (const [index, entry] of entries.entries()) {
		const top = 86 + index * rowHeight;
		labels += text(entry.label, 32, top + 20, 24);
		const extract = entry.crop || crop;
		parts.push({
			input: await sharp(entry.buffer)
				.extract(extract)
				.resize(crop.width * scale, crop.height * scale, { kernel: 'nearest' })
				.png()
				.toBuffer(),
			left: 32,
			top: top + 40
		});
	}
	await sharp(svg(width, height, labels))
		.composite(parts)
		.png()
		.toFile(path.join(images, name));
}
await compare(
	'text-format-comparison.png',
	[
		{ label: 'PNG · 원본 픽셀 유지', buffer: png },
		{ label: 'JPG · 품질 90', buffer: jpg90 },
		{ label: 'JPG · 품질 45', buffer: jpg45 }
	],
	{ left: 72, top: 202, width: 440, height: 70 },
	2,
	'동일한 글자 영역 · 가로·세로 2배 확대'
);

// 사진에 대한 결과로 일반화하지 않도록, 재현 가능한 합성 패턴을 사용한다.
const width = 1600;
const height = 1000;
const pixels = Buffer.alloc(width * height * 3);
let seed = 20261004;
for (let y = 0; y < height; y++) {
	for (let x = 0; x < width; x++) {
		seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
		const noise = (seed / 4294967296 - 0.5) * 55;
		const wave = Math.sin(x / 22) * Math.cos(y / 31) * 28;
		const offset = (y * width + x) * 3;
		pixels[offset] = Math.max(0, Math.min(255, 95 + x / 12 + noise));
		pixels[offset + 1] = Math.max(0, Math.min(255, 90 + y / 10 + wave + noise));
		pixels[offset + 2] = Math.max(0, Math.min(255, 165 + wave + noise));
	}
}
const overlay = svg(
	width,
	height,
	`<rect x="72" y="72" width="1456" height="220" rx="16" fill="#fff"/>${text('크기와 화질을 따로 바꿔봅니다.', 108, 132, 36)}${text('작은 글자 0123456789 가나다', 108, 192, 24)}${text('이 배경은 사진이 아닌 합성 시험 패턴입니다.', 108, 244, 26)}<path d="M80 720H1520M80 760H1520M80 800H1520" stroke="#fff" stroke-width="2"/>`
);
const pattern = await save(
	'resize-source.png',
	await sharp(pixels, { raw: { width, height, channels: 3 } })
		.composite([{ input: overlay }])
		.png()
		.toBuffer(),
	{ format: 'png', patternSeed: 20261004 }
);
const variants = [];
for (const [targetWidth, quality] of [
	[1600, 90],
	[1600, 60],
	[800, 90],
	[800, 60]
]) {
	const buffer = await save(
		`resize-${targetWidth}-q${quality}.jpg`,
		await sharp(pattern)
			.resize(targetWidth, undefined, { kernel: 'lanczos3' })
			.jpeg({ quality, chromaSubsampling: '4:2:0' })
			.toBuffer(),
		{ format: 'jpeg', quality, kernel: 'lanczos3', chromaSubsampling: '4:2:0' }
	);
	variants.push(buffer);
}
await compare(
	'resize-comparison.png',
	[
		{ label: '1600px · 품질 90 · 글자 영역 2배', buffer: variants[0] },
		{ label: '1600px · 품질 60 · 글자 영역 2배', buffer: variants[1] },
		{
			label: '800px · 품질 90 · 같은 영역 4배',
			buffer: variants[2],
			crop: { left: 50, top: 80, width: 220, height: 24 }
		}
	],
	{ left: 100, top: 160, width: 440, height: 48 },
	2,
	'같은 영역을 같은 표시 크기로 비교'
);
await sharp(png).resize(900).png().toFile(path.join(images, 'text-card-preview.png'));
await sharp(pattern).resize(900).png().toFile(path.join(images, 'resize-source-preview.png'));
const manifest = {
	measuredAt: '2026-10-04',
	versions: sharp.versions,
	pngRoundTripPixelsEqual: true,
	files: rows
};
await writeFile(
	path.join(downloads, 'image-measurements.json'),
	`${JSON.stringify(manifest, null, 2)}\n`
);
for (const row of rows) console.log(`${row.file}: ${row.width}×${row.height}, ${row.bytes}바이트`);

// 파일명만 JPG로 바꾼 PNG와 실제 JPG를 비교한다. 원본 파일은 덮어쓰지 않는다.
await writeFile(path.join(downloads, 'renamed-only.jpg'), png);
const formatResults = [];
for (const name of ['text-card.png', 'renamed-only.jpg', 'text-card-q90.jpg']) {
	const data = await readFile(path.join(downloads, name));
	const metadata = await sharp(data).metadata();
	formatResults.push({
		file: name,
		format: metadata.format,
		bytes: data.length,
		firstBytes: [...data.subarray(0, 8)]
			.map((byte) => byte.toString(16).padStart(2, '0'))
			.join(' '),
		sha256: createHash('sha256').update(data).digest('hex')
	});
}
if (formatResults[0].sha256 !== formatResults[1].sha256 || formatResults[2].format !== 'jpeg')
	throw new Error('확장자 비교 실패');
await writeFile(
	path.join(downloads, 'format-measurements.json'),
	`${JSON.stringify({ measuredAt: '2026-10-04', files: formatResults }, null, 2)}\n`
);
// 생성 직후 파일 자체를 다시 읽어 측정 파일과 일치하는지 검사한다.
for (const row of rows) {
	const stored = await readFile(path.join(downloads, row.file));
	if (createHash('sha256').update(stored).digest('hex') !== row.sha256) throw new Error(row.file);
}
