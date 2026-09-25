const DYNAMIC_BLOCK_KEYS = [
	'x',
	'y',
	'h',
	'hp',
	'alive',
	'flash',
	'respawnAt',
	'breakCycle',
	'tilt'
];
const STRIDE = 8;

// 이름·맵·블록의 고정 정보는 준비할 때 한 번만 보낸다.
export function createSnapshotEncoder() {
	let previousBlocks = [],
		blockKeys = [];
	return (race, events = [], cinematic = null, initial = false) => {
		const marbles = initial
			? race.marbles.map((m) => ({
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
				}))
			: undefined;
		const state = {
			time: race.time,
			skillWaves: race.skills.waves,
			...(initial ? { marbles } : packMarbles(race.marbles)),
			finished: race.finished.map((m) => m.id),
			events,
			cinematic,
			initial
		};
		if (initial) {
			previousBlocks = race.blocks.map((b) => ({ ...b }));
			blockKeys = race.blocks.map((b) => DYNAMIC_BLOCK_KEYS.filter((key) => key in b));
			return {
				...state,
				preview: race.preview,
				blocks: previousBlocks,
				layout: race.layout,
				zones: race.zones
			};
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
		if (!state) return current;
		if (state.initial) current = state;
		else {
			if (!current) throw new Error('경기 준비 정보가 없어요.');
			const values = state.marbleValues;
			for (let id = 0; id < current.marbles.length; id++) {
				const m = current.marbles[id],
					offset = id * STRIDE;
				m.x = values[offset];
				m.y = values[offset + 1];
				m.vx = values[offset + 2];
				m.vy = values[offset + 3];
				m.finished = Boolean(values[offset + 4]);
				m.finishTime = Number.isNaN(values[offset + 5]) ? null : values[offset + 5];
				m.windUntil = values[offset + 6];
				m.windDirection = values[offset + 7];
				m.held = null;
			}
			for (const [id, held] of state.heldMarbles) current.marbles[id].held = held;
			for (const { index, changes } of state.blockChanges)
				Object.assign(current.blocks[index], changes);
			current = {
				...current,
				time: state.time,
				skillWaves: state.skillWaves,
				finished: state.finished,
				events: state.events,
				cinematic: state.cinematic,
				initial: false
			};
		}
		return current;
	};
}

function packMarbles(marbles) {
	const marbleValues = new Float64Array(marbles.length * STRIDE),
		heldMarbles = [];
	for (let id = 0; id < marbles.length; id++) {
		const m = marbles[id],
			offset = id * STRIDE;
		marbleValues[offset] = m.x;
		marbleValues[offset + 1] = m.y;
		marbleValues[offset + 2] = m.vx;
		marbleValues[offset + 3] = m.vy;
		marbleValues[offset + 4] = Number(m.finished);
		marbleValues[offset + 5] = m.finishTime ?? NaN;
		marbleValues[offset + 6] = m.windUntil;
		marbleValues[offset + 7] = m.windDirection;
		if (m.held) heldMarbles.push([m.id, m.held]);
	}
	return { marbleValues, heldMarbles };
}
