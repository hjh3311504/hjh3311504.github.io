// 대진표 카드와 연결선의 좌표를 계산한다. 카드 높이를 고정해 연결선과 카드 중심이 어긋나지 않게 한다.
// 인쇄도 같은 넓은 화면 치수로 그린 뒤 용지에 맞게 축소한다.
// 넓은 화면과 인쇄는 영역에 맞춰 줄이며, 한 방향과 좌우 대칭 중 덜 줄여도 되는 배치를 고른다.

export const screenDimensions = {
	wide: { cardWidth: 208, gap: 48, labelHeight: 52, cardGap: 24 },
	compact: { cardWidth: 224, gap: 40, labelHeight: 52, cardGap: 24 }
};

/** 팀 칸 높이. 팀원 표시가 있으면 한 줄을 더 둔다. 누르기 쉽게 44px 이상으로 둔다. */
export function rowHeight(hasMembers) {
	return hasMembers ? 56 : 44;
}

// 카드 위 경기 이름 줄, 팀 칸 사이 간격, 아래·옆 안쪽 여백, 위아래 테두리 합이다.
export const CARD_HEADER = 28;
export const SIDE_GAP = 4;
export const CARD_PADDING = 8;
const CARD_BORDERS = 2;

export function cardHeightFor(hasMembers) {
	return CARD_HEADER + rowHeight(hasMembers) * 2 + SIDE_GAP + CARD_PADDING + CARD_BORDERS;
}

/** 창 크기를 재기 전 처음 그릴 때 좌우 대칭으로 둘 최소 팀 수 */
export const MIRROR_FROM = 17;
// 대칭 배치에서 결승 카드와 그 위 우승 카드 사이 간격
const CHAMPION_GAP = 32;

export function teamCountOf(rounds) {
	return rounds[0].matches.reduce((count, match) => count + (match.auto ? 1 : 2), 0);
}

export function shouldMirror(rounds) {
	return teamCountOf(rounds) >= MIRROR_FROM;
}

/** 대진표를 width×height 영역에 맞출 때의 배율. 키우지는 않는다. */
export function fitZoom({ width, height }, areaWidth, areaHeight) {
	return Math.min(1, areaWidth / width, areaHeight / height);
}

/**
 * 한 방향과 좌우 대칭 중 영역에 덜 줄여서 들어가는 배치를 고른다. 배율이 같으면 한 방향을 쓴다.
 * 3라운드(5팀) 이상일 때만 대칭을 고려한다.
 */
export function fitBracket(rounds, dims, hasMembers, areaWidth, areaHeight) {
	const zoom = fitZoom(layoutBracket(rounds, dims, hasMembers), areaWidth, areaHeight);
	if (rounds.length < 3) return { mirror: false, zoom };
	const mirrored = fitZoom(
		layoutBracket(rounds, dims, hasMembers, { mirror: true }),
		areaWidth,
		areaHeight
	);
	return mirrored > zoom + 0.001 ? { mirror: true, zoom: mirrored } : { mirror: false, zoom };
}

/** 경기마다 왼쪽(left)·오른쪽(right)·가운데 결승(center) 중 어디에 그릴지 정한다. */
function matchSides(rounds, mirror) {
	const last = rounds.length - 1;
	const sides = rounds.map((round) => round.matches.map(() => 'left'));
	if (!mirror) return sides;
	const final = rounds[last].matches[0];
	sides[last][0] = 'center';
	for (let round = last - 1; round >= 0; round--) {
		for (const match of rounds[round].matches) {
			sides[round][match.index] =
				round === last - 1
					? match.index === final.from[0]
						? 'left'
						: 'right'
					: sides[round + 1][match.next];
		}
	}
	return sides;
}

/**
 * 첫 라운드 카드는 쪽마다 위에서부터 같은 간격으로 쌓는다.
 * 다음 라운드 카드는 올라오는 앞 경기 카드들의 가운데에 둔다. 부전승 카드는 앞 경기와 같은 높이다.
 * mirror면 왼쪽 절반은 왼쪽에서 오른쪽으로, 오른쪽 절반은 오른쪽에서 왼쪽으로 진행해 가운데 결승에서 만난다.
 * 우승 카드는 대칭 배치에서는 결승 위, 아니면 결승 오른쪽 열에 둔다.
 */
export function layoutBracket(
	rounds,
	{ cardWidth, gap, labelHeight, cardGap },
	hasMembers,
	{ mirror = false } = {}
) {
	const row = rowHeight(hasMembers);
	const cardHeight = cardHeightFor(hasMembers);
	const slot = cardHeight + cardGap;
	const step = cardWidth + gap;
	const last = rounds.length - 1;
	mirror = mirror && rounds.length > 1;
	const sides = matchSides(rounds, mirror);
	const columnX = (round, side) => (side === 'right' ? (2 * last - round) * step : round * step);

	const counts = { left: 0, right: 0 };
	const centers = [];
	for (const round of rounds) {
		centers.push(
			round.matches.map((match) => {
				if (round.round > 0) {
					return (
						match.from.reduce((sum, from) => sum + centers[round.round - 1][from], 0) /
						match.from.length
					);
				}
				const side = sides[0][match.index];
				return labelHeight + slot * counts[side]++ + slot / 2;
			})
		);
	}

	const championHeight = cardHeight;
	let height = labelHeight + slot * Math.max(counts.left, counts.right);
	let champion;
	if (mirror) {
		// 양쪽 팀 수가 다르면 두 준결승 카드의 높이가 달라진다. 낮은 쪽에 맞춰 각 쪽을 통째로 내려
		// 두 준결승과 결승을 같은 높이에 두고, 결승 위에 우승 카드가 들어갈 자리도 확보한다.
		const semis = { left: 0, right: 0 };
		for (const match of rounds[last - 1].matches) {
			semis[sides[last - 1][match.index]] = centers[last - 1][match.index];
		}
		const lowest = labelHeight + championHeight + CHAMPION_GAP + cardHeight / 2;
		const target = Math.max(semis.left, semis.right, lowest);
		const shift = { left: target - semis.left, right: target - semis.right };
		for (let round = 0; round < last; round++) {
			centers[round] = centers[round].map((center, index) => center + shift[sides[round][index]]);
		}
		centers[last] = [target];
		height = Math.max(
			labelHeight + slot * counts.left + shift.left,
			labelHeight + slot * counts.right + shift.right
		);
		champion = {
			x: last * step,
			y: target - cardHeight / 2 - CHAMPION_GAP - championHeight,
			height: championHeight
		};
	} else {
		const finalCenter = centers[last][0];
		champion = {
			x: rounds.length * step,
			y: Math.max(labelHeight, finalCenter - championHeight / 2),
			height: championHeight
		};
		height = Math.max(height, labelHeight + championHeight);
	}

	const cards = [];
	const paths = [];
	for (const round of rounds) {
		for (const match of round.matches) {
			const side = sides[round.round][match.index];
			const x = columnX(round.round, side);
			const y = centers[round.round][match.index];
			cards.push({ match, x, y: y - cardHeight / 2, side });
			const done = match.winner !== undefined;
			if (match.next === null && mirror) {
				// 결승에서 우승 카드로 세로선을 잇는다.
				const middle = x + cardWidth / 2;
				const from = champion.y < y ? y - cardHeight / 2 : y + cardHeight / 2;
				const to = champion.y < y ? champion.y + championHeight : champion.y;
				paths.push({ id: match.id, d: `M${middle} ${from}V${to}`, done });
				continue;
			}
			const target = match.next === null ? y : centers[round.round + 1][match.next];
			const right = side === 'right';
			const start = right ? x : x + cardWidth;
			const end = right ? start - gap : start + gap;
			const middle = right ? start - gap / 2 : start + gap / 2;
			paths.push({
				id: match.id,
				d: target === y ? `M${start} ${y}H${end}` : `M${start} ${y}H${middle}V${target}H${end}`,
				done
			});
		}
	}

	const columns = mirror
		? [
				...rounds.slice(0, last).map((round) => ({ label: round.label, x: round.round * step })),
				{ label: rounds[last].label, x: last * step },
				...rounds
					.slice(0, last)
					.reverse()
					.map((round) => ({ label: round.label, x: columnX(round.round, 'right') }))
			]
		: [...rounds.map((round) => round.label), '우승'].map((label, index) => ({
				label,
				x: index * step
			}));

	return {
		width: mirror ? (2 * last + 1) * step - gap : (rounds.length + 1) * step - gap,
		height,
		step,
		row,
		cardHeight,
		mirror,
		columns,
		cards,
		paths,
		champion
	};
}
