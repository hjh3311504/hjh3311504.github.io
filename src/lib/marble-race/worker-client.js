export function createWorkerClient() {
	let worker,
		waiting,
		alive = false;
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
			waiting = { resolve, reject };
			worker.postMessage(message);
		});
	}
	return {
		async prepare(participants, map, seed, mode, count, onProgress) {
			stop();
			worker = new Worker(new URL('./race-worker.js', import.meta.url), { type: 'module' });
			alive = true;
			worker.onmessage = ({ data }) => {
				if (data.kind === 'progress') {
					onProgress?.(data);
					return;
				}
				const p = waiting;
				waiting = null;
				if (data.kind === 'error') p?.reject(new Error(data.message));
				else p?.resolve(data);
			};
			worker.onerror = () => {
				waiting?.reject(
					new Error('경기 계산을 시작하지 못했어요. 새로고침 후 다시 시도해 주세요.')
				);
				waiting = null;
			};
			return (
				await request({
					kind: 'prepare',
					participants: { entries: participants.entries, count: participants.count },
					map,
					seed,
					mode,
					count
				})
			).state;
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
