import { MARBLE_COLORS } from './catalog.js';

// 준비 화면에서는 백만 명도 카드에 필요한 이름만 만든다.
export function createPreviewOrder(entries, query = '') {
	const groups = [];
	let sourceStart = 0,
		length = 0;
	const text = query.trim();
	for (const entry of entries) {
		const number = Number(text) - 1;
		if (!text || entry.name.includes(text)) {
			groups.push({ ...entry, sourceStart, start: length });
			length += entry.count;
		} else if (
			String(number + 1) === text &&
			number >= sourceStart &&
			number < sourceStart + entry.count
		) {
			groups.push({ name: entry.name, count: 1, sourceStart: number, start: length++ });
		}
		sourceStart += entry.count;
	}
	return {
		length,
		indexOfId(id) {
			for (const group of groups) {
				if (id >= group.sourceStart && id < group.sourceStart + group.count)
					return group.start + id - group.sourceStart;
			}
			return -1;
		},
		slice(first, last) {
			const items = [];
			for (const group of groups) {
				const from = Math.max(first, group.start),
					to = Math.min(last, group.start + group.count);
				for (let index = from; index < to; index++) {
					const id = group.sourceStart + index - group.start;
					items.push({
						id,
						name: group.name,
						color: MARBLE_COLORS[id % MARBLE_COLORS.length],
						rank: id + 1,
						progress: 0,
						finished: false
					});
				}
			}
			return items;
		}
	};
}
