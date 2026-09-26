import { createSnapshotDecoder } from './transport.js';
export function createWorkerClient(onFrame, onError) {
	let worker,
		waiting,
		alive = false,
		requestSerial = 0;
	function stop() {
		alive = false;
		worker?.terminate();
		worker = null;
		waiting?.reject(new Error('경기 준비를 취소했어요.'));
		waiting = null;
	}
	function request(message) {
		return new Promise((resolve, reject) => {
			if (!worker || waiting) {
				reject(new Error('경기 계산을 준비하지 못했어요.'));
				return;
			}
			const requestId = ++requestSerial;
			waiting = { resolve, reject, requestId };
			worker.postMessage({ ...message, requestId });
		});
	}
	return {
		async prepare(
			participants,
			map,
			seed,
			mode,
			count,
			onProgress,
			startRank = 1,
			skillsEnabled = false,
			preview = false
		) {
			stop();
			worker = new Worker(new URL('./race-worker.js', import.meta.url), { type: 'module' });
			alive = true;
			const currentWorker = worker;
			const decode = createSnapshotDecoder();
			worker.onmessage = ({ data }) => {
				if (worker !== currentWorker) return;
				if (data.kind === 'progress') {
					onProgress?.(data);
					return;
				}
				if (data.stream) {
					try {
						// 수신 확인은 큰 상태 전달만 제어한다. 물리 계산은 이 응답을 기다리지 않는다.
						currentWorker.postMessage({ kind: 'ack', serial: data.serial });
						const result = { ...data, state: decode(data.state) };
						onFrame?.(result.state);
						if (waiting && data.reply === waiting.requestId) {
							const p = waiting;
							waiting = null;
							p.resolve(result);
						}
					} catch (error) {
						waiting?.reject(error);
						waiting = null;
						onError?.(error);
					}
					return;
				}
				const p = waiting;
				waiting = null;
				if (data.kind === 'error') {
					const error = new Error(data.message);
					p?.reject(error);
					onError?.(error);
				} else {
					try {
						p?.resolve({ ...data, state: decode(data.state) });
					} catch (error) {
						p?.reject(error);
					}
				}
			};
			worker.onerror = () => {
				if (worker !== currentWorker) return;
				waiting?.reject(
					new Error('경기 계산을 시작하지 못했어요. 새로고침 후 다시 시도해 주세요.')
				);
				waiting = null;
			};
			return (
				await request({
					kind: 'prepare',
					preview,
					participants: { entries: participants.entries, count: participants.count },
					map,
					seed,
					mode,
					count,
					startRank,
					skillsEnabled
				})
			).state;
		},
		run(speed) {
			worker?.postMessage({ kind: 'run', speed });
		},
		setSpeed(speed) {
			worker?.postMessage({ kind: 'speed', speed });
		},
		pause() {
			return request({ kind: 'pause' });
		},
		snapshot() {
			return request({ kind: 'snapshot' });
		},
		advance(seconds, speed) {
			return request({ kind: 'advance', seconds, speed });
		},
		get alive() {
			return alive;
		},
		stop
	};
}
