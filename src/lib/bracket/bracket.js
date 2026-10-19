// 한 번 지면 탈락하는 토너먼트의 배치와 진행을 계산한다.
// 저장하는 값은 첫 라운드 순서(slots)와 사용자가 고른 승자(winners)뿐이며 나머지는 매번 계산한다.
// 라운드에 남은 팀 수가 홀수일 때만 그 라운드에서 1팀이 부전승으로 올라간다.

export const MIN_TEAMS = 2;
export const MAX_TEAMS = 32;

/** 라운드별 참가 팀 수. 6팀이면 [6, 3, 2]다. */
export function roundSizes(teamCount) {
	const sizes = [teamCount];
	while (sizes.at(-1) > 2) sizes.push(Math.ceil(sizes.at(-1) / 2));
	return sizes;
}

/** 라운드 이름에 쓰는 칸 수. 3팀이 남은 라운드는 4강이다. */
function roundSlots(teamsInRound) {
	let slots = 2;
	while (slots < teamsInRound) slots *= 2;
	return slots;
}

export function bracketSummary(teamCount) {
	const sizes = roundSizes(teamCount);
	return {
		teams: teamCount,
		rounds: sizes.length,
		byes: sizes.filter((size) => size % 2).length,
		matches: teamCount - 1
	};
}

export function roundLabel(teamsInRound) {
	return teamsInRound === 2 ? '결승' : `${roundSlots(teamsInRound)}강`;
}

export function matchId(round, index) {
	return `r${round}m${index}`;
}

/**
 * 결승에서 첫 라운드 방향으로 시드를 펼쳐 배치표를 만든다.
 * 짝수 라운드는 표준 방식대로 높은 시드와 낮은 시드를 붙인다.
 * 홀수 라운드는 시드가 가장 높은 1팀을 부전승으로 두되, 바로 다음 라운드에서도
 * 부전승인 자리는 건너뛰어 같은 팀이 두 라운드 연속 부전승을 받지 않게 한다.
 * seeds는 첫 라운드 위에서부터의 시드, rounds[r]은 라운드 r 경기마다의 참가 수(1이면 부전승)다.
 */
export function bracketPlan(teamCount) {
	const sizes = roundSizes(teamCount);
	let upper = [{ seed: 1, bye: false }];
	const rounds = [];
	for (let round = sizes.length - 1; round >= 0; round--) {
		const count = sizes[round];
		const odd = count % 2 === 1;
		const byeSeed = odd
			? Math.min(...upper.filter((entry) => !entry.bye).map((entry) => entry.seed))
			: null;
		const partners = new Map(
			upper
				.filter((entry) => entry.seed !== byeSeed)
				.map((entry) => entry.seed)
				.sort((a, b) => a - b)
				.map((seed, index) => [seed, count - index])
		);
		const lower = [];
		const items = [];
		for (const entry of upper) {
			if (entry.seed === byeSeed) {
				lower.push({ seed: entry.seed, bye: true });
				items.push(1);
			} else {
				lower.push(
					{ seed: entry.seed, bye: false },
					{ seed: partners.get(entry.seed), bye: false }
				);
				items.push(2);
			}
		}
		rounds.unshift(items);
		upper = lower;
	}
	return { sizes, seeds: upper.map((entry) => entry.seed), rounds };
}

const plans = new Map();
function planFor(teamCount) {
	if (!plans.has(teamCount)) plans.set(teamCount, bracketPlan(teamCount));
	return plans.get(teamCount);
}

function shuffled(values, random) {
	const result = [...values];
	for (let index = result.length - 1; index > 0; index--) {
		const target = Math.floor(random() * (index + 1));
		[result[index], result[target]] = [result[target], result[index]];
	}
	return result;
}

/**
 * 팀 목록으로 새 대진표를 만든다. 팀 정보·제목·배치 방식은 생성 당시 값으로 복사한다.
 * 무작위 배치도 slots에 결과를 남겨 새로고침 뒤 같은 배치를 복원한다.
 */
export function createBracket({ teams, title = '', order = 'input', random = Math.random }) {
	if (teams.length < MIN_TEAMS || teams.length > MAX_TEAMS) {
		throw new RangeError(`팀은 ${MIN_TEAMS}~${MAX_TEAMS}개여야 합니다.`);
	}
	const ids = teams.map((team) => team.id);
	const seeded = order === 'random' ? shuffled(ids, random) : ids;
	return {
		title,
		order,
		teams: teams.map((team) => ({ id: team.id, name: team.name, members: [...team.members] })),
		slots: planFor(ids.length).seeds.map((seed) => seeded[seed - 1]),
		winners: {}
	};
}

/**
 * 라운드별 경기를 계산한다. 경기의 각 자리는 팀(team), 부전승(bye),
 * 앞 경기 승자를 기다리는 자리(pending) 중 하나다. 부전승 진출(auto)은 결과 수에 넣지 않는다.
 * from은 앞 라운드에서 이 경기로 올라오는 경기 번호, next는 다음 라운드 경기 번호다.
 * number는 부전승을 뺀 라운드 안의 경기 번호다.
 */
export function deriveRounds(bracket) {
	const plan = planFor(bracket.slots.length);
	const rounds = [];
	let entrants = bracket.slots.map((team) => ({ kind: 'team', team, from: null }));
	plan.rounds.forEach((items, round) => {
		const matches = [];
		const winners = [];
		let position = 0;
		let number = 0;
		items.forEach((count, index) => {
			const id = matchId(round, index);
			const own = entrants.slice(position, position + count);
			position += count;
			const sides = count === 2 ? own : [own[0], { kind: 'bye', team: null, from: null }];
			const auto = count === 1;
			const teams = sides.filter((side) => side.kind === 'team').map((side) => side.team);
			const playable = !auto && teams.length === 2;
			const stored = bracket.winners[id];
			const winner = auto ? teams[0] : playable && teams.includes(stored) ? stored : undefined;
			matches.push({
				id,
				round,
				index,
				number: auto ? null : ++number,
				sides,
				from: own.map((side) => side.from).filter((from) => from !== null),
				next: null,
				auto,
				playable,
				winner
			});
			winners.push(
				winner === undefined
					? { kind: 'pending', team: null, from: index }
					: { kind: 'team', team: winner, from: index }
			);
		});
		if (rounds.length) {
			for (const match of matches) {
				for (const from of match.from) rounds.at(-1).matches[from].next = match.index;
			}
		}
		rounds.push({ round, label: roundLabel(plan.sizes[round]), matches });
		entrants = winners;
	});
	return rounds;
}

/** 실제로 화면에 반영되는 사용자 결과만 남긴다. */
export function effectiveWinners(rounds) {
	const winners = {};
	for (const { matches } of rounds) {
		for (const match of matches) {
			if (match.playable && match.winner !== undefined) winners[match.id] = match.winner;
		}
	}
	return winners;
}

function pathAfter(rounds, match) {
	const path = [];
	for (let current = match; current.next !== null;) {
		current = rounds[current.round + 1].matches[current.next];
		path.push(current.id);
	}
	return path;
}

/**
 * 승자를 정하거나 바꾸거나 취소한 결과를 계산한다. 원본은 바꾸지 않는다.
 * 기존 승자를 바꾸거나 취소하면 결승까지 이어지는 경기의 기존 결과를 지운다.
 * cleared는 그때 지워지는 사용자 결과 수이며, 고른 경기와 부전승은 포함하지 않는다.
 */
export function setWinner(bracket, id, team) {
	const rounds = deriveRounds(bracket);
	const match = rounds.flatMap((round) => round.matches).find((item) => item.id === id);
	if (!match?.playable || !match.sides.some((side) => side.team === team)) {
		return { bracket, cleared: 0, changed: false };
	}
	const current = effectiveWinners(rounds);
	const winners = { ...current };
	const previous = current[id];
	if (previous === team) delete winners[id];
	else winners[id] = team;
	let cleared = 0;
	if (previous !== undefined) {
		for (const later of pathAfter(rounds, match)) {
			if (later in winners) {
				delete winners[later];
				cleared++;
			}
		}
	}
	const next = { ...bracket, winners };
	return {
		bracket: { ...next, winners: effectiveWinners(deriveRounds(next)) },
		cleared,
		changed: true
	};
}

export function resultCount(bracket) {
	return Object.keys(effectiveWinners(deriveRounds(bracket))).length;
}

/**
 * 진행 상태: 실제 경기 수, 끝난 수, 다음 경기, 다음 경기가 있는 라운드의 경기 수와 끝난 수, 우승 팀 id.
 * 부전승은 경기가 아니므로 어느 수에도 넣지 않는다.
 */
export function bracketProgress(bracket) {
	const rounds = deriveRounds(bracket);
	const total = bracket.teams.length - 1;
	const done = Object.keys(effectiveWinners(rounds)).length;
	let next = null;
	let round = null;
	for (const { label, matches } of rounds) {
		const found = matches.find((match) => match.playable && match.winner === undefined);
		if (found) {
			next = { ...found, label };
			const games = matches.filter((match) => !match.auto);
			round = {
				label,
				total: games.length,
				done: games.filter((match) => match.winner !== undefined).length
			};
			break;
		}
	}
	const champion = rounds.at(-1).matches[0].winner ?? null;
	return { total, done, next, round, champion };
}

/** 대진표 위에 표시하는 진행 문구. 예: `경기 5개 중 3개 끝남 · 다음 경기: 4강 1경기` */
export function statusText(bracket) {
	const progress = bracketProgress(bracket);
	if (progress.champion) {
		const champion = bracket.teams.find((team) => team.id === progress.champion);
		return `우승: ${champion?.name ?? ''}`;
	}
	const next = progress.next
		? ` · 다음 경기: ${progress.next.label} ${progress.next.number}경기`
		: '';
	return `경기 ${progress.total}개 중 ${progress.done}개 끝남${next}`;
}

/** 대진표 위 보조 정보. 예: `6팀 · 입력 순서` */
export function bracketMeta(bracket) {
	return `${bracket.teams.length}팀 · ${bracket.order === 'random' ? '무작위 배치' : '입력 순서'}`;
}

/** 대진표를 만든 뒤 팀 목록·제목·배치 방식이 바뀌었는지 확인한다. 팀원은 비교하지 않는다. */
export function isOutdated(bracket, { teams, title, order }) {
	if (!bracket) return false;
	if (bracket.title !== title || bracket.order !== order) return true;
	if (bracket.teams.length !== teams.length) return true;
	return bracket.teams.some(
		(team, index) => team.id !== teams[index].id || team.name !== teams[index].name
	);
}
