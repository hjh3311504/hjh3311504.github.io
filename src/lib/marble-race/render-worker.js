import suitFont from '../team-maker/fonts/SUIT-Team-Maker.woff2?url';
import { createRenderer } from './renderer.js';
import { createSnapshotDecoder } from './transport.js';

const font = new FontFace('SUIT', `url(${suitFont})`, { weight: '100 900' });
self.fonts.add(font);
const ready = font.load();
const canvas = new OffscreenCanvas(1, 1);
const renderer = createRenderer(canvas);
const decode = createSnapshotDecoder();

self.onmessage = async ({ data }) => {
	if (data.kind !== 'paint') return;
	try {
		await ready;
		const race = decode(data.state);
		race.identity = data.generation;
		// 새 경기의 캐시를 먼저 비워 첫 그림 전의 이벤트도 보존한다.
		renderer.reset(race);
		renderer.addEvents(data.state.events, data.options.reduced);
		renderer.render(race, data.options);
		const bitmap = canvas.transferToImageBitmap();
		self.postMessage({ kind: 'painted', generation: data.generation, bitmap }, [bitmap]);
	} catch (error) {
		self.postMessage({ kind: 'paint-error', message: String(error) });
	}
};
