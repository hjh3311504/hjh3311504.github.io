// 실제 순위는 유지하고 화면에 필요한 카드만 추적 구슬 뒤로 재배치한다.
export function pinRankingItem(items, pinned) {
	if (!pinned) return items;
	const index = items.indexOfId
		? items.indexOfId(pinned.id)
		: items.findIndex((item) => item.id === pinned.id);
	const length = items.length + (index < 0 ? 1 : 0);
	return {
		length,
		slice(first = 0, last = length) {
			const from = Math.max(0, first),
				to = Math.min(length, last);
			if (from >= to) return [];
			const result = from === 0 ? [pinned] : [];
			const start = Math.max(1, from) - 1,
				end = to - 1;
			if (index < 0) return result.concat(items.slice(start, end));
			if (start < index) result.push(...items.slice(start, Math.min(end, index)));
			if (end > index) result.push(...items.slice(Math.max(start, index) + 1, end + 1));
			return result;
		}
	};
}
