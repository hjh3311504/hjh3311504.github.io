// 기능이 만든 이벤트와 예약 작업을 화면 종료 시 함께 정리합니다.
export function createLifetime() {
	let active = true;
	const listeners = new Set();
	const timers = new Set();
	const frames = new Set();

	function on(target, type, handler, options) {
		if (!active) return;
		const once = typeof options === 'object' && options.once;
		const listener = (...args) => {
			if (once) listeners.delete(remove);
			if (active) handler(...args);
		};
		const remove = () => target.removeEventListener(type, listener, options);
		target.addEventListener(type, listener, options);
		listeners.add(remove);
	}

	function schedule(callback, delay) {
		if (!active) return null;
		const id = globalThis.setTimeout(() => {
			timers.delete(id);
			if (active) callback();
		}, delay);
		timers.add(id);
		return id;
	}

	function cancel(id) {
		globalThis.clearTimeout(id);
		timers.delete(id);
	}

	function requestFrame(callback) {
		if (!active) return null;
		const id = globalThis.requestAnimationFrame((time) => {
			frames.delete(id);
			if (active) callback(time);
		});
		frames.add(id);
		return id;
	}

	function destroy() {
		if (!active) return;
		active = false;
		for (const remove of listeners) remove();
		for (const id of timers) globalThis.clearTimeout(id);
		for (const id of frames) globalThis.cancelAnimationFrame(id);
		listeners.clear();
		timers.clear();
		frames.clear();
	}

	return {
		on,
		setTimeout: schedule,
		clearTimeout: cancel,
		requestAnimationFrame: requestFrame,
		destroy,
		get active() {
			return active;
		}
	};
}
