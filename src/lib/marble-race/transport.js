// 이름·맵·블록의 고정 정보는 준비할 때 한 번만 보낸다.
export function createSnapshotEncoder() {
	let previousBlocks = [],
		blockKeys = [];
	return (race, events = [], cinematic = null, initial = false) => {
		const marbles = race.marbles.map((m) => ({
			id: m.id,
			...(initial ? { name: m.name, color: m.color, r: m.r } : {}),
			x: m.x,
			y: m.y,
			vx: m.vx,
			vy: m.vy,
			finished: m.finished,
			finishTime: m.finishTime,
			windUntil: m.windUntil,
			windDirection: m.windDirection,
			held: m.held
		}));
		const state = {
			time: race.time,
			marbles,
			finished: race.finished.map((m) => m.id),
			events,
			cinematic,
			initial
		};
		if (initial) {
			previousBlocks = race.blocks.map((b) => ({ ...b }));
			blockKeys = race.blocks.map((b) => Object.keys(b));
			return { ...state, blocks: previousBlocks, layout: race.layout, zones: race.zones };
		}
		const blockChanges = [];
		for (const [index, block] of race.blocks.entries()) {
			const previous = previousBlocks[index];
			let changes;
			for (const key of blockKeys[index]) {
				if (!Object.is(block[key], previous[key])) {
					changes ??= {};
					changes[key] = block[key];
				}
			}
			if (changes) {
				blockChanges.push({ index, changes });
				Object.assign(previous, changes);
			}
		}
		return { ...state, blockChanges };
	};
}

export function createSnapshotDecoder() {
	let current;
	return (state) => {
		if (state.initial) current = state;
		else {
			if (!current) throw new Error('경기 준비 정보가 없어요.');
			for (const marble of state.marbles) Object.assign(current.marbles[marble.id], marble);
			for (const { index, changes } of state.blockChanges)
				Object.assign(current.blocks[index], changes);
			current = {
				...current,
				time: state.time,
				finished: state.finished,
				events: state.events,
				cinematic: state.cinematic,
				initial: false
			};
		}
		return current;
	};
}
