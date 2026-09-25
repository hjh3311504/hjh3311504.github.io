// 200개부터 최대60회/초로 그려 물리 Worker에 계산 여유를 준다.
// 이 일정은 경기 시간이나 Worker 요청에 사용하지 않는다.
export function createDrawSchedule() {
	let next = 0;
	return (now, count) => {
		const interval = count >= 200 ? 1000 / 60 : 0;
		if (interval && now + 0.5 < next) return false;
		next = interval ? next + interval * (Math.floor((now + 0.5 - next) / interval) + 1) : now;
		return true;
	};
}
