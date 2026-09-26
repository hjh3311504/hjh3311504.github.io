// 화면 대역도 실제 Worker와 같은 숫자 배열 형식을 사용한다.
export async function installMarbleWire(page) {
	await page.addInitScript(() => {
		// 화면 전용 대역도 run/pause/ack 경계를 사용한다. 실제 물리는 별도 검사한다.
		window.__mockMarbleStream = (worker, data) => {
			if (data.kind === 'run') {
				worker.mockSpeed = data.speed;
				clearInterval(worker.mockTimer);
				worker.mockTimer = setInterval(
					() => worker.postMessage({ kind: 'advance', speed: worker.mockSpeed }),
					17
				);
			} else if (data.kind === 'speed') worker.mockSpeed = data.speed;
			else if (data.kind === 'pause') {
				clearInterval(worker.mockTimer);
				worker.postMessage({ kind: 'advance', speed: worker.mockSpeed, requestId: data.requestId });
			} else if (data.kind !== 'ack') return false;
			return true;
		};

		window.__packMarbleState = (state) => {
			state.marbleValues = new Float64Array(state.marbles.length * 8);
			state.heldMarbles = [];
			for (const m of state.marbles) {
				state.marbleValues.set(
					[
						m.x,
						m.y,
						m.vx,
						m.vy,
						Number(m.finished),
						m.finishTime ?? NaN,
						m.windUntil,
						m.windDirection
					],
					m.id * 8
				);
				if (m.held) state.heldMarbles.push([m.id, m.held]);
			}
			delete state.marbles;
			return state;
		};
		window.__readMarbleValues = (state) => {
			if (state.initial) return state.marbles;
			const result = [];
			for (let offset = 0; offset < state.marbleValues.length; offset += 8) {
				const v = state.marbleValues;
				result.push({
					id: offset / 8,
					x: v[offset],
					y: v[offset + 1],
					vx: v[offset + 2],
					vy: v[offset + 3],
					finished: Boolean(v[offset + 4]),
					finishTime: Number.isNaN(v[offset + 5]) ? null : v[offset + 5],
					windUntil: v[offset + 6],
					windDirection: v[offset + 7],
					held: null
				});
			}
			for (const [id, held] of state.heldMarbles) result[id].held = held;
			return result;
		};
	});
}
