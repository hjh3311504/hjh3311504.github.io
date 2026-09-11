export const MAX_TITLE_LENGTH = 10;
const segmenter = new Intl.Segmenter('ko', { granularity: 'grapheme' });

export function titleCharacters(title) {
	return Array.from(segmenter.segment(title), ({ segment }) => segment);
}

export function limitTitle(title) {
	return titleCharacters(title.replace(/[\r\n]/g, ''))
		.slice(0, MAX_TITLE_LENGTH)
		.join('');
}

export function validTitle(title) {
	return !/[\r\n]/.test(title) && titleCharacters(title).length <= MAX_TITLE_LENGTH;
}
