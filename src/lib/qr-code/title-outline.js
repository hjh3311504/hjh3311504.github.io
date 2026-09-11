import { create } from 'fontkit';
import { titleLines } from './title-layout.js';
import { TITLE_SIZE, TITLE_WIDTH, LINE_HEIGHT, IMAGE_WIDTH, TITLE_TOP } from './image-layout.js';

export function createTitleFont(bytes) {
	return create(bytes).getVariation({ wght: 700 });
}

export function createTitleOutline(font, title) {
	const normalized = title.trim().normalize('NFC');
	const unsupported = [
		...new Set(
			Array.from(normalized).filter(
				(character) => !font.hasGlyphForCodePoint(character.codePointAt(0))
			)
		)
	];
	if (unsupported.length) return { unsupported, paths: [], lines: [] };
	const lines = titleLines(normalized);
	if (!lines.length) return { unsupported: [], paths: [], lines };
	const run = font.layout(lines[0]);
	let cursor = 0;
	let minX = Infinity,
		maxX = -Infinity,
		minY = Infinity,
		maxY = -Infinity;
	const glyphs = [];
	run.glyphs.forEach((glyph, index) => {
		if (glyph.id === 0) throw new Error('글자 윤곽선이 없습니다.');
		const position = run.positions[index];
		const x = cursor + position.xOffset;
		const y = position.yOffset;
		const d = glyph.path.toSVG();
		if (d) {
			const box = glyph.bbox;
			minX = Math.min(minX, x + box.minX);
			maxX = Math.max(maxX, x + box.maxX);
			minY = Math.min(minY, y + box.minY);
			maxY = Math.max(maxY, y + box.maxY);
			glyphs.push({ d, x, y });
		}
		cursor += position.xAdvance;
	});
	if (!glyphs.length) return { unsupported: [], paths: [], lines };
	const scale = Math.min(
		TITLE_SIZE / font.unitsPerEm,
		TITLE_WIDTH / (maxX - minX),
		LINE_HEIGHT / (maxY - minY)
	);
	const left = IMAGE_WIDTH / 2 - ((minX + maxX) * scale) / 2;
	const baseline = TITLE_TOP + LINE_HEIGHT / 2 + ((minY + maxY) * scale) / 2;
	const paths = glyphs.map(({ d, x, y }) => ({
		d,
		x: left + x * scale,
		y: baseline - y * scale,
		scale
	}));
	return { unsupported: [], paths, lines };
}
