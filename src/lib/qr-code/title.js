import { pendingTitle } from './title-layout.js';
import { TITLE_FONT } from './image-layout.js';

// 제목만 준비한다. QR 계산이나 최종 PNG·SVG 생성은 하지 않는다.
export async function prepareTitle(title) {
	const prepared = pendingTitle(title);
	if (!title.trim()) return { ...prepared, fallback: false };
	try {
		const { loadTitleFont } = await import('./font-loader.js');
		const { engine, font } = await loadTitleFont();
		const outline = engine.createTitleOutline(font, title);
		if (!outline.unsupported.length) return { ...prepared, ...outline, fallback: false };
		prepared.svgError = `SVG 제목으로 저장할 수 없는 글자: ${outline.unsupported.join(' ')}. 제목을 바꾸거나 PNG로 저장하세요.`;
	} catch {
		prepared.svgError = '제목의 윤곽선을 만들지 못했습니다. 다시 시도하거나 PNG로 저장하세요.';
		prepared.canRetrySvg = true;
	}
	// 일반 글자는 SUIT 700으로 그리고, SUIT에 없는 글자만 시스템 글꼴로 보완한다.
	try {
		await document.fonts.load(TITLE_FONT, title);
	} catch {
		// 글꼴 요청이 실패해도 PNG와 제목 미리보기를 제공한다.
	}
	return prepared;
}
