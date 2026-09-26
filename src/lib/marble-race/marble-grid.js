// 32px 격자의 이웃은 구슬이 칸을 옮길 때만 바뀐다.
// 위치·속도 판정은 호출자가 매번 수행하며, 여기서는 번호순 후보만 재사용한다.
export function createMarbleGrid() {
	let heads = new Int32Array(0),
		revisions = new Float64Array(0),
		offset,
		members = [],
		cache = [];
	const next = [],
		previous = [],
		memberships = [],
		byId = [],
		overflow = new Map();
	const get = (key) => (key >= 0 && key < heads.length ? heads[key] : (overflow.get(key) ?? -1));
	const set = (key, value) => {
		if (key >= 0 && key < heads.length) heads[key] = value;
		else overflow.set(key, value);
	};
	function invalidate(key) {
		for (let y = -1; y <= 1; y++)
			for (let x = -1; x <= 1; x++) {
				const neighbor = key + y * 32 + x;
				if (neighbor >= 0 && neighbor < revisions.length) revisions[neighbor]++;
				else delete cache[neighbor];
			}
	}
	function remove(id) {
		const old = memberships[id];
		if (old == null) return;
		if (previous[id] === -1) set(old, next[id]);
		else next[previous[id]] = next[id];
		if (next[id] !== -1) previous[next[id]] = previous[id];
		memberships[id] = null;
		invalidate(old);
	}
	function update(m) {
		if (m.finished) {
			remove(m.id);
			return;
		}
		const key = Math.floor(m.y / 32) * 32 + Math.floor(m.x / 32) - offset;
		if (memberships[m.id] === key) return;
		remove(m.id);
		const head = get(key);
		next[m.id] = head;
		previous[m.id] = -1;
		if (head !== -1) previous[head] = m.id;
		set(key, m.id);
		byId[m.id] = m;
		memberships[m.id] = key;
		invalidate(key);
	}
	return {
		byId,
		update,
		prepare(marbles) {
			let minY = Infinity,
				maxY = -Infinity,
				same = members.length === marbles.length;
			for (let i = 0; i < marbles.length; i++) {
				const m = marbles[i];
				if (members[i] !== m) same = false;
				if (!m.finished) {
					minY = Math.min(minY, m.y);
					maxY = Math.max(maxY, m.y);
				}
			}
			if (minY === Infinity) return false;
			const newOffset = (Math.floor(minY / 32) - 2) * 32;
			const size = (Math.floor(maxY / 32) + 3) * 32 - newOffset;
			if (!same || offset !== newOffset || heads.length < size) {
				if (heads.length < size) {
					const capacity = 2 ** Math.ceil(Math.log2(size));
					heads = new Int32Array(capacity);
					revisions = new Float64Array(capacity);
				}
				heads.fill(-1);
				revisions.fill(0);
				memberships.fill(null);
				overflow.clear();
				cache = [];
				offset = newOffset;
				if (!same) members = marbles.slice();
			}
			for (const m of marbles) update(m);
			return true;
		},
		nearby(m) {
			const key = Math.floor(m.y / 32) * 32 + Math.floor(m.x / 32) - offset;
			const revision = revisions[key] ?? 0;
			let entry = cache[key];
			if (entry?.revision === revision) return entry.ids;
			if (!entry) cache[key] = entry = { ids: [] };
			const ids = entry.ids;
			ids.length = 0;
			for (let y = -1; y <= 1; y++)
				for (let x = -1; x <= 1; x++)
					for (let id = get(key + y * 32 + x); id !== -1; id = next[id]) ids.push(id);
			for (let i = 1; i < ids.length; i++) {
				const id = ids[i];
				let j = i - 1;
				while (j >= 0 && ids[j] > id) {
					ids[j + 1] = ids[j];
					j--;
				}
				ids[j + 1] = id;
			}
			entry.revision = revision;
			return ids;
		}
	};
}
