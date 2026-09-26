import { drawMarble } from './marble-painter.js';

// 순위가 바뀌어 카드가 다시 만들어져도 같은 번호의 그림은 재사용한다.
const documents = new WeakMap();
export function paintMarbleIcon(canvas, id, color, quality) {
	const document = canvas.ownerDocument;
	let cache = documents.get(document);
	const fonts = document.fonts.status;
	if (!cache || cache.fonts !== fonts) {
		cache = { fonts, images: new Map() };
		documents.set(document, cache);
	}
	const key = `${id}:${color}:${quality}`;
	let image = cache.images.get(key);
	if (!image) {
		image = document.createElement('canvas');
		image.width = image.height = 36 * quality;
		const brush = image.getContext('2d');
		if (!brush) return;
		brush.scale(quality, quality);
		brush.translate(18, 18);
		let size = 12;
		brush.font = `800 ${size}px SUIT, sans-serif`;
		while (size > 4 && brush.measureText(String(id + 1)).width > 30) {
			size -= 2;
			brush.font = `800 ${size}px SUIT, sans-serif`;
		}
		drawMarble(brush, { id, color, r: 18 }, brush.font);
		if (cache.images.size >= 256) cache.images.delete(cache.images.keys().next().value);
	} else cache.images.delete(key);
	cache.images.set(key, image);
	canvas.width = canvas.height = image.width;
	canvas.getContext('2d')?.drawImage(image, 0, 0);
}
