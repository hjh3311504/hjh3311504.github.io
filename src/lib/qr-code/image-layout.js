export const IMAGE_WIDTH = 1024;
export const QR_SIZE = 768;
export const QR_LEFT = (IMAGE_WIDTH - QR_SIZE) / 2;
export const QR_TOP = 32;
export const TITLE_TOP = QR_TOP + QR_SIZE + 32;
export const TITLE_SIZE = 64;
export const LINE_HEIGHT = 88;
export const TITLE_WIDTH = 896;
export const TITLE_FONT = `700 ${TITLE_SIZE}px "SUIT Full", sans-serif`;

export function imageHeight(lineCount) {
	return TITLE_TOP + (lineCount ? lineCount * LINE_HEIGHT + 32 : 0);
}
