import { createRenderer } from './renderer.js';
import { createSnapshotEncoder } from './transport.js';

// 큰 경기는 완성된 그림만 받아 화면에 붙인다. 물리 시간과 효과음은 이 작업을 기다리지 않는다.
export function createDisplayRenderer(
	canvas,
	{
		createInline = createRenderer,
		createWorker = () =>
			new Worker(new URL('./render-worker.js', import.meta.url), { type: 'module' }),
		supported = typeof OffscreenCanvas !== 'undefined' && typeof Worker !== 'undefined'
	} = {}
) {
	let inline = createInline(canvas);
	const ctx = canvas.getContext('2d');
	let worker,
		busy = false,
		disposed = false,
		failed = false,
		identity,
		generation = 0,
		encode,
		initial = true,
		latest;
	let events = [],
		inFlightEvents = [],
		eventIdentity;

	function stopWorker() {
		worker?.terminate();
		worker = null;
		busy = false;
		inFlightEvents = [];
	}
	function useInline() {
		const pending = [...inFlightEvents, ...events];
		failed = true;
		stopWorker();
		inline = createInline(canvas);
		if (latest) {
			inline.reset(latest.race);
			inline.addEvents(pending, latest.options.reduced);
			inline.render(latest.race, latest.options);
		}
		events = [];
	}
	function startWorker() {
		try {
			worker = createWorker();
			const current = worker;
			worker.onmessage = ({ data }) => {
				if (disposed || worker !== current) {
					data.bitmap?.close();
					return;
				}
				if (data.kind === 'paint-error') {
					useInline();
					return;
				}
				if (data.kind !== 'painted') return;
				busy = false;
				inFlightEvents = [];
				const bitmap = data.bitmap;
				const bounds = latest.options.bounds;
				const dpr = Math.min(globalThis.devicePixelRatio || 1, 2);
				if (
					data.generation === generation &&
					bitmap.width === Math.round(bounds.width * dpr) &&
					bitmap.height === Math.round(bounds.height * dpr)
				) {
					if (canvas.width !== bitmap.width || canvas.height !== bitmap.height) {
						canvas.width = bitmap.width;
						canvas.height = bitmap.height;
					}
					ctx.setTransform(1, 0, 0, 1, 0, 0);
					ctx.fillStyle = '#101d2c';
					ctx.fillRect(0, 0, canvas.width, canvas.height);
					ctx.drawImage(bitmap, 0, 0);
				}
				bitmap.close();
			};
			worker.onerror = () => {
				if (worker === current && !disposed) useInline();
			};
			return true;
		} catch {
			useInline();
			return false;
		}
	}
	return {
		render(race, options) {
			if (disposed) return;
			latest = { race, options };
			if (identity !== (race.identity ?? race)) {
				identity = race.identity ?? race;
				generation++;
				stopWorker();
				encode = createSnapshotEncoder();
				initial = true;
				if (eventIdentity !== identity) events = [];
			}
			if (failed || !supported || race.preview || race.marbles.length < 200) {
				inline.reset(race);
				inline.addEvents(events, options.reduced);
				events = [];
				inline.render(race, options);
				return;
			}
			if (busy || (!worker && !startWorker())) return;
			try {
				const state = encode(
					{ ...race, skills: { waves: race.skillWaves ?? [] } },
					events,
					null,
					initial
				);
				inFlightEvents = events;
				events = [];
				busy = true;
				worker.postMessage(
					{
						kind: 'paint',
						state,
						generation,
						options: { ...options, pixelRatio: Math.min(globalThis.devicePixelRatio || 1, 2) }
					},
					state.marbleValues ? [state.marbleValues.buffer] : []
				);
				initial = false;
			} catch {
				useInline();
			}
		},
		addEvents(incoming, raceIdentity) {
			if (eventIdentity !== raceIdentity) events = [];
			eventIdentity = raceIdentity;
			events.push(...incoming);
		},
		destroy() {
			disposed = true;
			stopWorker();
			events = [];
			latest = null;
		}
	};
}
