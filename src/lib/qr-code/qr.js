import QRCode from 'qrcode';
import { validTitle } from './title-input.js';
import {
	LINE_HEIGHT,
	TITLE_FONT,
	IMAGE_WIDTH,
	QR_SIZE,
	QR_LEFT,
	QR_TOP,
	TITLE_TOP,
	TITLE_WIDTH,
	imageHeight
} from './image-layout.js';

export const BOOKMARK_KEY = 'lake.qr-code.bookmarks.v1';
export const MAX_BYTES = 1800;
export const MAX_BOOKMARKS = 30;

export function validateSingleLine(content) {
	return /[\r\n\u2028\u2029]/u.test(content)
		? '웹페이지 주소에는 줄바꿈을 넣을 수 없습니다. 한 줄로 입력해 주세요.'
		: '';
}

export function validateContent(content) {
	if (!content.trim()) return '웹페이지 주소를 입력하세요.';
	const lineError = validateSingleLine(content);
	if (lineError) return lineError;
	if (new TextEncoder().encode(content).length > MAX_BYTES)
		return '내용이 너무 깁니다. 영문 약 1,800자 또는 한글 약 600자 이내로 줄여 주세요.';
	return '';
}

export function parseBookmarks(raw) {
	const parsed = JSON.parse(raw ?? '[]');
	if (!Array.isArray(parsed)) throw new Error('북마크 형식이 올바르지 않습니다.');
	return parsed
		.filter(
			(item) =>
				item &&
				typeof item.content === 'string' &&
				!validateContent(item.content) &&
				typeof item.title === 'string' &&
				validTitle(item.title)
		)
		.slice(0, MAX_BOOKMARKS)
		.map(({ content, title }) => ({ content, title }));
}

export function downloadName(title, format = 'png') {
	if (!['png', 'svg'].includes(format)) throw new Error('지원하지 않는 파일 형식입니다.');
	return (
		(Array.from(title, (character) => (character.charCodeAt(0) < 32 ? '_' : character))
			.join('')
			.trim()
			.replace(/[<>:"/\\|?*]/g, '_')
			.replace(/[. ]+$/, '') || 'qr-code') + `.${format}`
	);
}

export function createQrGeometry(content) {
	const error = validateContent(content);
	if (error) throw new Error(error);
	const { modules } = QRCode.create(content, { errorCorrectionLevel: 'M' });
	const cells = modules.size + 8;
	const scale = Math.floor(QR_SIZE / cells);
	const offset = Math.floor((QR_SIZE - cells * scale) / 2) + 4 * scale;
	let path = '';
	for (let row = 0; row < modules.size; row++) {
		for (let column = 0; column < modules.size; column++) {
			if (!modules.get(row, column)) continue;
			const start = column;
			while (column + 1 < modules.size && modules.get(row, column + 1)) column++;
			path += `M${offset + start * scale} ${offset + row * scale}h${(column - start + 1) * scale}v${scale}H${offset + start * scale}z`;
		}
	}
	return path;
}

export function createSvg(qrPath, outline) {
	const height = imageHeight(outline.lines.length);
	const titlePaths = outline.paths
		.map(
			({ d, x, y, scale }) =>
				`<path d="${d}" transform="translate(${x} ${y}) scale(${scale} ${-scale})"/>`
		)
		.join('');
	return `<svg xmlns="http://www.w3.org/2000/svg" width="${IMAGE_WIDTH}" height="${height}" viewBox="0 0 ${IMAGE_WIDTH} ${height}"><rect width="${IMAGE_WIDTH}" height="${height}" fill="#fff"/><g id="qr-code" fill="#000" transform="translate(${QR_LEFT} ${QR_TOP})"><path d="${qrPath}"/></g><g id="qr-title" fill="#000">${titlePaths}</g></svg>`;
}

export async function createQrImage(qrPath, preparedTitle, format = 'png') {
	if (format === 'svg') {
		if (preparedTitle.svgError) throw new Error(preparedTitle.svgError);
		return new Blob([createSvg(qrPath, preparedTitle)], { type: 'image/svg+xml;charset=utf-8' });
	}
	if (format !== 'png') throw new Error('지원하지 않는 파일 형식입니다.');
	const canvas = document.createElement('canvas');
	canvas.width = IMAGE_WIDTH;
	const context = canvas.getContext('2d');
	if (!context) throw new Error('이미지를 만들 수 없는 브라우저입니다.');
	const lineCount = preparedTitle.lines.length;
	canvas.height = imageHeight(lineCount);
	context.fillStyle = '#fff';
	context.fillRect(0, 0, canvas.width, canvas.height);
	context.fillStyle = '#000';
	context.save();
	context.translate(QR_LEFT, QR_TOP);
	context.fill(new Path2D(qrPath));
	context.restore();
	if (preparedTitle.fallback) {
		context.font = TITLE_FONT;
		context.textAlign = 'left';
		context.textBaseline = 'alphabetic';
		const line = preparedTitle.lines[0];
		if (line) {
			const metrics = context.measureText(line);
			const width = metrics.actualBoundingBoxLeft + metrics.actualBoundingBoxRight;
			const height = metrics.actualBoundingBoxAscent + metrics.actualBoundingBoxDescent;
			const scale = Math.min(1, TITLE_WIDTH / (width || 1), LINE_HEIGHT / (height || 1));
			context.save();
			context.translate(IMAGE_WIDTH / 2, TITLE_TOP + LINE_HEIGHT / 2);
			context.scale(scale, scale);
			context.fillText(
				line,
				(metrics.actualBoundingBoxLeft - metrics.actualBoundingBoxRight) / 2,
				(metrics.actualBoundingBoxAscent - metrics.actualBoundingBoxDescent) / 2
			);
			context.restore();
		}
	} else {
		for (const { d, x, y, scale } of preparedTitle.paths) {
			context.save();
			context.translate(x, y);
			context.scale(scale, -scale);
			context.fill(new Path2D(d));
			context.restore();
		}
	}
	return new Promise((resolve, reject) =>
		canvas.toBlob((value) => {
			if (value) resolve(value);
			else reject(new Error('이미지를 만들지 못했습니다.'));
		}, 'image/png')
	);
}
