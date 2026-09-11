import fontUrl from '../../../.svelte-kit/qr-font/SUIT-Variable.ttf?url';

let pending;

export function loadTitleFont() {
	if (!pending) {
		pending = Promise.all([
			import('./title-outline.js'),
			fetch(fontUrl, { signal: AbortSignal.timeout(10000) }).then((response) => {
				if (!response.ok) throw new Error('제목 글꼴을 불러오지 못했습니다.');
				return response.arrayBuffer();
			})
		]).then(([engine, buffer]) => ({
			engine,
			font: engine.createTitleFont(new Uint8Array(buffer))
		}));
		pending.catch(() => {
			pending = undefined;
		});
	}
	return pending;
}
