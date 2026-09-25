// 계산 응답은 바로 돌려주고 큰 화면 상태만 실제 시간 기준 최대60회/초로 묶는다.
export function createFrameBatch() {
	let last = -Infinity;
	let events = [];
	return {
		reset(now) {
			last = now;
			events = [];
		},
		add(next) {
			events.push(...next);
		},
		ready(now, urgent = false) {
			return urgent || now - last >= 1000 / 60;
		},
		take(now) {
			last = now;
			const result = events;
			events = [];
			return result;
		}
	};
}
