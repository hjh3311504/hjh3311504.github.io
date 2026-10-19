import assert from 'node:assert/strict';
import test from 'node:test';
import {
	bracketPlan,
	bracketProgress,
	bracketSummary,
	createBracket,
	deriveRounds,
	isOutdated,
	resultCount,
	roundSizes,
	setWinner,
	statusText
} from '../../src/lib/bracket/bracket.js';
import {
	fitBracket,
	layoutBracket,
	screenDimensions,
	shouldMirror
} from '../../src/lib/bracket/layout.js';

const makeTeams = (count) =>
	Array.from({ length: count }, (_, index) => ({
		id: `t${index + 1}`,
		name: `${index + 1}팀`,
		members: []
	}));

/** 각 경기에서 sides의 첫 번째 팀이 이기도록 결승까지 진행한다. */
function playAll(bracket) {
	let current = bracket;
	for (;;) {
		const { next } = bracketProgress(current);
		if (!next) return current;
		const team = next.sides[0].team;
		current = setWinner(current, next.id, team).bracket;
	}
}

test('라운드마다 남은 팀 수가 홀수일 때만 1팀이 부전승을 받는다', () => {
	assert.deepEqual(roundSizes(2), [2]);
	assert.deepEqual(roundSizes(5), [5, 3, 2]);
	assert.deepEqual(roundSizes(6), [6, 3, 2]);
	assert.deepEqual(roundSizes(9), [9, 5, 3, 2]);
	assert.deepEqual(roundSizes(16), [16, 8, 4, 2]);
	assert.deepEqual(bracketSummary(6), { teams: 6, rounds: 3, byes: 1, matches: 5 });
	assert.deepEqual(bracketSummary(5), { teams: 5, rounds: 3, byes: 2, matches: 4 });
	assert.deepEqual(bracketSummary(8), { teams: 8, rounds: 3, byes: 0, matches: 7 });
});

test('2~32팀 모두 누락·중복 없이 배치하고 부전승은 라운드당 1개, 같은 팀 연속 부전승은 없다', () => {
	for (let count = 2; count <= 32; count++) {
		const teams = makeTeams(count);
		const bracket = createBracket({ teams });
		assert.equal(bracket.slots.length, count);
		assert.deepEqual([...bracket.slots].sort(), teams.map((team) => team.id).sort());

		const rounds = deriveRounds(bracket);
		const sizes = roundSizes(count);
		rounds.forEach((round, index) => {
			const byes = round.matches.filter((match) => match.auto).length;
			assert.equal(byes, sizes[index] % 2, `${count}팀 ${index + 1}라운드 부전승 수`);
			assert.equal(
				round.matches.filter((match) => !match.auto).length,
				Math.floor(sizes[index] / 2),
				`${count}팀 ${index + 1}라운드 경기 수`
			);
			for (const match of round.matches.filter((item) => item.auto)) {
				assert.equal(match.from.length <= 1, true);
				const before = index > 0 ? rounds[index - 1].matches[match.from[0]] : null;
				assert.ok(!before?.auto, `${count}팀 ${index + 1}라운드 연속 부전승`);
			}
		});

		const finished = playAll(bracket);
		const progress = bracketProgress(finished);
		assert.equal(progress.total, count - 1);
		assert.equal(progress.done, count - 1);
		assert.equal(progress.champion, 't1', `${count}팀은 1번 시드가 모두 이기면 우승`);
	}
});

test('6팀 예제: 8강은 3경기 모두 진행하고 4강에서 1팀이 부전승을 받는다', () => {
	const bracket = createBracket({ teams: makeTeams(6) });
	assert.deepEqual(bracket.slots, ['t1', 't6', 't2', 't5', 't3', 't4']);
	const rounds = deriveRounds(bracket);
	assert.deepEqual(
		rounds.map((round) => round.label),
		['8강', '4강', '결승']
	);
	assert.equal(rounds[0].matches.filter((match) => match.auto).length, 0);
	const [bye, semi] = rounds[1].matches;
	assert.equal(bye.auto, true);
	assert.deepEqual(bye.from, [0], '8강 1경기 승자가 부전승');
	assert.deepEqual(
		bye.sides.map((side) => side.kind),
		['pending', 'bye']
	);
	assert.equal(bye.number, null);
	assert.deepEqual(semi.from, [1, 2]);
	assert.equal(semi.number, 1);
	assert.equal(resultCount(bracket), 0);
	assert.equal(statusText(bracket), '경기 5개 중 0개 끝남 · 다음 경기: 8강 1경기');

	// 8강 1경기가 끝나면 승자가 부전승으로 결승에 오른다. 부전승은 결과 수에 넣지 않는다.
	const after = setWinner(bracket, 'r0m0', 't6').bracket;
	const next = deriveRounds(after);
	assert.equal(next[1].matches[0].winner, 't6');
	assert.equal(next[2].matches[0].sides[0].team, 't6');
	assert.equal(resultCount(after), 1);
});

test('5팀은 8강과 4강에서 1팀씩 부전승을 받고 같은 팀이 연달아 받지 않는다', () => {
	const bracket = createBracket({ teams: makeTeams(5) });
	assert.deepEqual(bracketPlan(5).rounds, [[2, 1, 2], [1, 2], [2]]);
	assert.deepEqual(bracket.slots, ['t1', 't5', 't2', 't3', 't4']);
	const rounds = deriveRounds(bracket);
	assert.equal(rounds[0].matches[1].winner, 't2', '8강은 2번 시드 부전승');
	assert.deepEqual(rounds[1].matches[0].from, [0], '4강은 1번 시드 쪽 경기 승자 부전승');
	assert.deepEqual(rounds[1].matches[1].from, [1, 2]);
	const progress = bracketProgress(bracket);
	assert.equal(progress.next.id, 'r0m0');
	assert.equal(progress.next.number, 1);
	assert.equal(bracketProgress(setWinner(bracket, 'r0m0', 't1').bracket).next.number, 2);
	// 라운드 진행 수에는 부전승을 넣지 않는다.
	assert.deepEqual(progress.round, { label: '8강', total: 2, done: 0 });
	const first = setWinner(bracket, 'r0m0', 't1').bracket;
	assert.deepEqual(bracketProgress(first).round, { label: '8강', total: 2, done: 1 });
	const second = setWinner(first, 'r0m2', 't3').bracket;
	assert.deepEqual(bracketProgress(second).round, { label: '4강', total: 1, done: 0 });
	assert.equal(bracketProgress(second).done, 2);
});

test('2팀과 3팀 대진표', () => {
	const two = createBracket({ teams: makeTeams(2) });
	assert.deepEqual(
		deriveRounds(two).map((round) => round.label),
		['결승']
	);
	const { bracket } = setWinner(two, 'r0m0', 't2');
	assert.equal(bracketProgress(bracket).champion, 't2');
	assert.equal(bracketProgress(bracket).round, null);

	const three = createBracket({ teams: makeTeams(3) });
	assert.deepEqual(three.slots, ['t1', 't2', 't3']);
	assert.deepEqual(
		deriveRounds(three).map((round) => round.label),
		['4강', '결승']
	);
	assert.equal(bracketProgress(three).next.id, 'r0m1');
});

test('카드는 겹치지 않고 다음 경기 카드는 앞 경기들의 가운데에 놓인다', () => {
	for (const [count, mirror] of Array.from({ length: 31 }, (_, index) => index + 2).flatMap(
		(count) => [
			[count, false],
			[count, true]
		]
	)) {
		const rounds = deriveRounds(createBracket({ teams: makeTeams(count) }));
		const layout = layoutBracket(rounds, screenDimensions.wide, false, { mirror });
		const center = (match) => {
			const card = layout.cards.find((item) => item.match === match);
			return card.y + layout.cardHeight / 2;
		};
		for (const round of rounds) {
			// 대칭 배치에서는 같은 라운드가 좌우 두 열에 있으므로 열(x)마다 확인한다.
			const columns = layout.cards
				.filter((card) => card.match.round === round.round)
				.sort((a, b) => a.x - b.x || a.y - b.y);
			for (let index = 1; index < columns.length; index++) {
				if (columns[index].x !== columns[index - 1].x) continue;
				assert.ok(
					columns[index].y - columns[index - 1].y >= layout.cardHeight,
					`${count}팀 ${round.label} 카드 겹침`
				);
			}
			if (round.round === 0) continue;
			for (const match of round.matches) {
				const sources = match.from.map((from) => center(rounds[round.round - 1].matches[from]));
				const average = sources.reduce((sum, value) => sum + value, 0) / sources.length;
				assert.equal(center(match), average);
			}
		}
		assert.ok(layout.cards.every((card) => card.y + layout.cardHeight <= layout.height));
		assert.ok(layout.champion.y + layout.champion.height <= layout.height);
		assert.ok(layout.cards.every((card) => card.x + 208 <= layout.width));
	}
});

test('17팀부터 좌우 대칭: 양쪽 절반이 가운데 결승에서 만나고 우승 카드는 결승 위에 있다', () => {
	assert.equal(shouldMirror(deriveRounds(createBracket({ teams: makeTeams(16) }))), false);
	for (let count = 17; count <= 32; count++) {
		const rounds = deriveRounds(createBracket({ teams: makeTeams(count) }));
		assert.equal(shouldMirror(rounds), true);
		const layout = layoutBracket(rounds, screenDimensions.wide, false, { mirror: true });
		const final = layout.cards.find((card) => card.side === 'center');
		const left = layout.cards.filter((card) => card.side === 'left');
		const right = layout.cards.filter((card) => card.side === 'right');
		assert.ok(left.length && right.length, `${count}팀 양쪽 카드`);
		assert.ok(left.every((card) => card.x < final.x));
		assert.ok(right.every((card) => card.x > final.x));
		// 첫 라운드 같은 열 카드 수가 절반 근처라 세로 길이가 줄어든다.
		assert.ok(layout.height < layoutBracket(rounds, screenDimensions.wide, false).height);
		// 양쪽 팀 수가 달라도 두 준결승과 결승은 같은 높이라 연결선이 수평이다.
		const semis = layout.cards.filter((card) => card.match.round === rounds.length - 2);
		assert.equal(semis.length, 2);
		assert.ok(
			semis.every((card) => card.y === final.y),
			`${count}팀 준결승 높이`
		);
		for (const card of semis) {
			const path = layout.paths.find((item) => item.id === card.match.id);
			assert.ok(!path.d.includes('V'), `${count}팀 준결승 연결선 ${path.d}`);
		}
		assert.ok(
			layout.cards.every((card) => card.y >= 52),
			`${count}팀 열 제목과 겹침`
		);
		assert.equal(layout.champion.x, final.x);
		assert.ok(layout.champion.y + layout.champion.height < final.y, `${count}팀 우승 카드 위치`);
		assert.equal(layout.width, (2 * (rounds.length - 1) + 1) * layout.step - 48);
		// 오른쪽 카드의 연결선은 카드 왼쪽 끝에서 왼쪽으로 나간다.
		for (const card of right) {
			const path = layout.paths.find((item) => item.id === card.match.id);
			assert.ok(path.d.startsWith(`M${card.x} `), path.d);
		}
	}
});

test('같은 팀을 다시 누르면 취소하고 다른 팀을 누르면 바꾼다', () => {
	const start = createBracket({ teams: makeTeams(4) });
	const picked = setWinner(start, 'r0m0', 't1');
	assert.equal(picked.cleared, 0);
	assert.equal(picked.bracket.winners.r0m0, 't1');
	assert.deepEqual(start.winners, {}, '원본은 바꾸지 않는다');

	const changed = setWinner(picked.bracket, 'r0m0', 't4');
	assert.equal(changed.bracket.winners.r0m0, 't4');
	const cancelled = setWinner(changed.bracket, 'r0m0', 't4');
	assert.equal(cancelled.bracket.winners.r0m0, undefined);
});

test('앞 경기 결과를 바꾸면 결승까지 이어진 기존 결과만 지우고 다른 갈래는 유지한다', () => {
	// 8팀: r0m0(1-8) r0m1(4-5) r0m2(2-7) r0m3(3-6)
	let bracket = createBracket({ teams: makeTeams(8) });
	for (const [id, team] of [
		['r0m0', 't1'],
		['r0m1', 't4'],
		['r0m2', 't2'],
		['r0m3', 't3'],
		['r1m0', 't4'],
		['r1m1', 't2'],
		['r2m0', 't2']
	]) {
		bracket = setWinner(bracket, id, team).bracket;
	}
	assert.equal(resultCount(bracket), 7);

	// 결승 승자 t2는 바뀐 뒤에도 결승 참가 팀이지만 새 상대와는 경기하지 않았으므로 지운다.
	const result = setWinner(bracket, 'r0m0', 't8');
	assert.equal(result.cleared, 2, '4강 1경기와 결승');
	assert.equal(result.bracket.winners.r1m0, undefined);
	assert.equal(result.bracket.winners.r2m0, undefined);
	assert.equal(result.bracket.winners.r1m1, 't2', '다른 갈래 4강은 유지');
	assert.equal(result.bracket.winners.r0m3, 't3');
	assert.equal(resultCount(result.bracket), 5);
	assert.equal(bracketProgress(result.bracket).champion, null);
});

test('결과가 없는 이후 경기는 지울 결과로 세지 않고 결승 변경은 아무것도 지우지 않는다', () => {
	let bracket = createBracket({ teams: makeTeams(4) });
	bracket = setWinner(bracket, 'r0m0', 't1').bracket;
	assert.equal(setWinner(bracket, 'r0m0', 't4').cleared, 0);
	bracket = setWinner(bracket, 'r0m1', 't2').bracket;
	bracket = setWinner(bracket, 'r1m0', 't1').bracket;
	const finalChange = setWinner(bracket, 'r1m0', 't2');
	assert.equal(finalChange.cleared, 0);
	assert.equal(bracketProgress(finalChange.bracket).champion, 't2');
});

test('부전승 경기·정해지지 않은 경기·참가하지 않은 팀은 고를 수 없다', () => {
	const bracket = createBracket({ teams: makeTeams(5) });
	assert.equal(setWinner(bracket, 'r0m1', 't2').changed, false, '부전승 경기');
	assert.equal(setWinner(bracket, 'r1m1', 't2').changed, false, '상대 미정');
	assert.equal(setWinner(bracket, 'r0m0', 't2').changed, false, '다른 경기의 팀');
	assert.equal(setWinner(bracket, 'r9m9', 't1').changed, false, '없는 경기');
});

test('무작위 배치는 주입한 난수로 재현되고 입력 순서와 다르다', () => {
	const teams = makeTeams(8);
	const sequence = (seed) => {
		let value = seed;
		return () => {
			value = (value * 9301 + 49297) % 233280;
			return value / 233280;
		};
	};
	const first = createBracket({ teams, order: 'random', random: sequence(7) });
	const second = createBracket({ teams, order: 'random', random: sequence(7) });
	assert.deepEqual(first.slots, second.slots);
	assert.notDeepEqual(first.slots, createBracket({ teams }).slots);
	assert.deepEqual(
		first.teams.map((team) => team.id),
		teams.map((team) => team.id),
		'팀 목록 순서는 유지'
	);
});

test('팀 수가 범위를 벗어나면 만들지 않는다', () => {
	assert.throws(() => createBracket({ teams: makeTeams(1) }), RangeError);
	assert.throws(() => createBracket({ teams: makeTeams(33) }), RangeError);
});

test('생성 당시 팀·제목·배치와 다르면 다시 만들기가 필요하다', () => {
	const teams = makeTeams(4);
	const bracket = createBracket({ teams, title: '대회', order: 'input' });
	const draft = { teams: teams.map((team) => ({ ...team })), title: '대회', order: 'input' };
	assert.equal(isOutdated(bracket, draft), false);
	assert.equal(isOutdated(null, draft), false);
	assert.equal(isOutdated(bracket, { ...draft, title: '새 대회' }), true);
	assert.equal(isOutdated(bracket, { ...draft, order: 'random' }), true);
	assert.equal(isOutdated(bracket, { ...draft, teams: draft.teams.slice(1) }), true);
	const renamed = draft.teams.map((team, index) =>
		index === 0 ? { ...team, name: '호랑이' } : team
	);
	assert.equal(isOutdated(bracket, { ...draft, teams: renamed }), true);
	// 팀원은 비교하지 않고, 입력을 되돌리면 안내가 사라진다.
	const withMembers = draft.teams.map((team) => ({ ...team, members: ['가'] }));
	assert.equal(isOutdated(bracket, { ...draft, teams: withMembers }), false);
});

test('생성 당시 팀 정보는 복사본이라 입력 목록을 바꿔도 유지된다', () => {
	const teams = makeTeams(3).map((team) => ({ ...team, members: ['가', '나'] }));
	const bracket = createBracket({ teams });
	teams[0].name = '바뀜';
	teams[0].members.push('다');
	assert.equal(bracket.teams[0].name, '1팀');
	assert.deepEqual(bracket.teams[0].members, ['가', '나']);
});

test('영역에 맞출 때 한 방향과 대칭 중 덜 줄여도 되는 배치를 고른다', () => {
	const rounds = (count) => deriveRounds(createBracket({ teams: makeTeams(count) }));
	const wide = screenDimensions.wide;
	// 넉넉하면 줄이지 않고 한 방향을 쓴다.
	assert.deepEqual(fitBracket(rounds(8), wide, false, 2000, 2000), { mirror: false, zoom: 1 });
	// 2라운드 이하는 대칭을 쓰지 않는다.
	assert.equal(fitBracket(rounds(4), wide, false, 300, 200).mirror, false);
	for (const count of [12, 16, 24, 32]) {
		const fit = fitBracket(rounds(count), wide, false, 1412, 690);
		const normal = layoutBracket(rounds(count), wide, false);
		const mirrored = layoutBracket(rounds(count), wide, false, { mirror: true });
		assert.equal(fit.mirror, true, `${count}팀은 세로로 긴 한 방향보다 대칭이 덜 줄어든다`);
		assert.ok(fit.zoom > Math.min(1412 / normal.width, 690 / normal.height));
		assert.ok(mirrored.width * fit.zoom <= 1412 + 0.01 && mirrored.height * fit.zoom <= 690 + 0.01);
	}
});
