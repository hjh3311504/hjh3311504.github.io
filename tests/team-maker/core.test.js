import assert from 'node:assert/strict';
import test from 'node:test';

import {
	AssignmentError,
	PARTICIPANT_REMOVAL_PATTERN,
	SIZE_MODE,
	TEAM_MODE,
	calculateTeamCount,
	calculateWheelTargetRotation,
	cleanRulesAfterParticipantRemoval,
	appendTeamRank,
	formatTeamResultLabel,
	formatTeamsText,
	getSetupStatus,
	localDateKey,
	makeTeams,
	orderParticipantsForColumns,
	parseParticipantNames,
	planParticipantRemoval,
	rebalanceParticipantColumns,
	removeLastTeamRank,
	resolveTeamRanking,
	selectTodayHistory,
	shuffle,
	summarizeParticipantStats
} from '../../src/lib/team-maker/core.js';

const people = (...names) => names.map((name, index) => ({ id: `p${index + 1}`, name }));
const steadyRandom = () => 0.37;

test('공백·줄바꿈·쉼표를 정리하고 중복 이름은 유지한다', () => {
	assert.deepEqual(parseParticipantNames(' 민수 \n\n 영희, 민수 '), ['민수', '영희', '민수']);
});

test('팀 수와 팀당 인원 방식의 팀 수를 계산한다', () => {
	assert.equal(calculateTeamCount(TEAM_MODE, 3, 10), 3);
	assert.equal(calculateTeamCount(SIZE_MODE, 4, 10), 3);
	assert.equal(calculateTeamCount(SIZE_MODE, 4, 5), 2);
});

test('참가자와 설정값에 따라 팀 만들기 상태를 설명한다', () => {
	assert.match(
		getSetupStatus({ mode: TEAM_MODE, teamCount: 2, teamSize: 2, participantCount: 1 }).reason,
		/두 명 이상/
	);
	assert.match(
		getSetupStatus({ mode: TEAM_MODE, teamCount: 4, teamSize: 2, participantCount: 3 }).reason,
		/팀 수가 많/
	);
	assert.match(
		getSetupStatus({ mode: SIZE_MODE, teamCount: 2, teamSize: 4, participantCount: 3 }).reason,
		/팀당 인원이 많/
	);
	assert.deepEqual(
		getSetupStatus({ mode: TEAM_MODE, teamCount: 2, teamSize: 2, participantCount: 4 }),
		{ disabled: false, reason: '4명을 2개 팀으로 나눕니다.', teamCount: 2 }
	);
});

test('정확히 나눠지는 경우와 나머지가 있는 경우의 차이는 최대 한 명이다', () => {
	const exact = makeTeams({
		participants: people('가', '나', '다', '라'),
		teamCount: 2,
		random: steadyRandom
	});
	assert.deepEqual(exact.map((team) => team.members.length).sort(), [2, 2]);

	const remainder = makeTeams({
		participants: people('가', '나', '다', '라', '마', '바', '사', '아'),
		teamCount: 3,
		random: steadyRandom
	});
	assert.deepEqual(remainder.map((team) => team.members.length).sort(), [2, 3, 3]);
});

test('팀당 인원이 참가 인원과 같으면 한 팀을 만든다', () => {
	const result = makeTeams({
		participants: people('가', '나', '다'),
		teamCount: calculateTeamCount(SIZE_MODE, 3, 3),
		random: steadyRandom
	});
	assert.equal(result.length, 1);
	assert.equal(result[0].members.length, 3);
});

test('같은 팀과 다른 팀 규칙을 함께 지킨다', () => {
	const participants = people('가', '나', '다', '라', '마', '바');
	const result = makeTeams({
		participants,
		teamCount: 3,
		rules: [
			{ type: 'together', participantIds: ['p1', 'p2'] },
			{ type: 'apart', participantIds: ['p1', 'p3', 'p4'] }
		],
		random: steadyRandom
	});
	const teamOf = (id) =>
		result.findIndex((team) => team.members.some((member) => member.id === id));
	assert.equal(teamOf('p1'), teamOf('p2'));
	assert.notEqual(teamOf('p1'), teamOf('p3'));
	assert.notEqual(teamOf('p1'), teamOf('p4'));
	assert.notEqual(teamOf('p3'), teamOf('p4'));
});

test('같은 팀과 다른 팀 규칙이 충돌하면 구체적인 오류를 낸다', () => {
	assert.throws(
		() =>
			makeTeams({
				participants: people('가', '나', '다', '라'),
				teamCount: 2,
				rules: [
					{ type: 'together', participantIds: ['p1', 'p2'] },
					{ type: 'apart', participantIds: ['p1', 'p2'] }
				]
			}),
		(error) => error instanceof AssignmentError && error.code === 'RULE_CONFLICT'
	);
});

test('같은 팀 묶음이 정원을 넘으면 결과를 만들지 않는다', () => {
	assert.throws(
		() =>
			makeTeams({
				participants: people('가', '나', '다', '라'),
				teamCount: 2,
				rules: [{ type: 'together', participantIds: ['p1', 'p2', 'p3'] }]
			}),
		(error) => error instanceof AssignmentError && error.code === 'TOGETHER_GROUP_TOO_LARGE'
	);
});

test('서로 다른 팀 규칙보다 팀 수가 적으면 결과를 만들지 않는다', () => {
	assert.throws(
		() =>
			makeTeams({
				participants: people('가', '나', '다', '라'),
				teamCount: 2,
				rules: [{ type: 'apart', participantIds: ['p1', 'p2', 'p3'] }]
			}),
		(error) => error instanceof AssignmentError && error.code === 'NOT_ENOUGH_TEAMS_FOR_APART_RULE'
	);
});

test('한 참가자만 여러 명과 떨어지는 규칙은 가능한 배정을 막지 않는다', () => {
	const result = makeTeams({
		participants: people('가', '나', '다'),
		teamCount: 2,
		rules: [
			{ type: 'apart', participantIds: ['p1', 'p2'] },
			{ type: 'apart', participantIds: ['p1', 'p3'] }
		],
		random: steadyRandom
	});
	const teamOf = (id) =>
		result.findIndex((team) => team.members.some((member) => member.id === id));

	assert.notEqual(teamOf('p1'), teamOf('p2'));
	assert.notEqual(teamOf('p1'), teamOf('p3'));
	assert.equal(teamOf('p2'), teamOf('p3'));
});

test('참가자 삭제 뒤 2명 미만인 규칙을 정리한다', () => {
	assert.deepEqual(
		cleanRulesAfterParticipantRemoval(
			[
				{ id: 'r1', type: 'together', participantIds: ['p1', 'p2', 'p3'] },
				{ id: 'r2', type: 'apart', participantIds: ['p1', 'p3'] }
			],
			new Set(['p1', 'p2'])
		),
		[{ id: 'r1', type: 'together', participantIds: ['p1', 'p2'] }]
	);
});

test('5번 참가자를 지우면 7번과 8번이 각각 5번과 7번 자리로 이동한다', () => {
	const participants = Array.from({ length: 8 }, (_, index) => ({
		id: `p${index + 1}`,
		name: String(index + 1),
		column: index % 2
	}));
	const result = rebalanceParticipantColumns(
		participants.filter((participant) => participant.id !== 'p5')
	);

	assert.deepEqual(
		result.filter((participant) => participant.column === 0).map((participant) => participant.name),
		['1', '3', '7', '8']
	);
	assert.deepEqual(
		result.filter((participant) => participant.column === 1).map((participant) => participant.name),
		['2', '4', '6']
	);
	assert.deepEqual(
		result.map((participant) => participant.name),
		['1', '2', '3', '4', '6', '7', '8']
	);
	assert.deepEqual(
		orderParticipantsForColumns(result).map((participant) => participant.name),
		['1', '2', '3', '4', '7', '6', '8']
	);
});

test('연속으로 삭제해도 끝 참가자는 반대 열의 맨 아래로 이동한다', () => {
	const participants = Array.from({ length: 5 }, (_, index) => ({
		id: `p${index + 1}`,
		name: String(index + 1),
		column: index % 2
	}));
	const afterFirstRemoval = planParticipantRemoval(participants, 'p1').nextParticipants;
	const secondPlan = planParticipantRemoval(afterFirstRemoval, 'p3');

	assert.deepEqual(
		orderParticipantsForColumns(secondPlan.nextParticipants)
			.filter((participant) => participant.column === 0)
			.map((participant) => participant.id),
		['p5', 'p4']
	);
	assert.deepEqual(secondPlan.shiftingParticipantIds, ['p5']);
	assert.equal(secondPlan.crossingParticipantId, 'p4');
});

test('한 열 목록에서 1번을 삭제하면 2번부터 차례로 빈자리를 채운다', () => {
	const participants = Array.from({ length: 8 }, (_, index) => ({
		id: `p${index + 1}`,
		name: String(index + 1),
		column: index % 2
	}));
	const plan = planParticipantRemoval(participants, 'p1');

	assert.deepEqual(
		plan.nextParticipants.map((participant) => participant.id),
		['p2', 'p3', 'p4', 'p5', 'p6', 'p7', 'p8']
	);
	assert.deepEqual(
		orderParticipantsForColumns(plan.nextParticipants).map((participant) => participant.id),
		['p3', 'p2', 'p5', 'p4', 'p7', 'p6', 'p8']
	);
});

test('연속 삭제의 모든 이동은 위, 왼쪽, 오른쪽 위 방향으로만 일어난다', () => {
	function positions(participants) {
		const rows = [0, 0];
		return new Map(
			orderParticipantsForColumns(participants).map((participant) => {
				const column = participant.column === 1 ? 1 : 0;
				return [participant.id, { column, row: rows[column]++ }];
			})
		);
	}

	function inspectRemovals(participants) {
		if (participants.length < 2) return;
		const before = positions(participants);
		for (const removed of participants) {
			const plan = planParticipantRemoval(participants, removed.id);
			const after = positions(plan.nextParticipants);
			for (const participant of plan.nextParticipants) {
				const previousPosition = before.get(participant.id);
				const nextPosition = after.get(participant.id);
				const columnMovement = nextPosition.column - previousPosition.column;
				const rowMovement = nextPosition.row - previousPosition.row;
				if (columnMovement === 0 && rowMovement === 0) continue;

				assert.equal(
					(columnMovement === 0 && rowMovement === -1) ||
						(columnMovement === -1 && rowMovement === 0) ||
						(columnMovement === 1 && rowMovement === -1),
					true,
					`${participant.id}의 이동 방향이 범위를 벗어났습니다.`
				);
				if (columnMovement !== 0) {
					const sourceTail = orderParticipantsForColumns(participants)
						.filter((item) => item.column === previousPosition.column)
						.at(-1);
					assert.equal(participant.id, sourceTail.id);
				}
			}
			inspectRemovals(plan.nextParticipants);
		}
	}

	inspectRemovals(
		Array.from({ length: 8 }, (_, index) => ({
			id: `p${index + 1}`,
			name: String(index + 1),
			column: index % 2
		}))
	);
});

test('8명 명단의 모든 삭제 위치를 네 가지 이동 패턴으로 분류한다', () => {
	const participants = Array.from({ length: 8 }, (_, index) => ({
		id: `p${index + 1}`,
		name: String(index + 1),
		column: index % 2
	}));
	const expected = [
		[PARTICIPANT_REMOVAL_PATTERN.SHIFT_AND_CROSS, ['p3', 'p5', 'p7'], 'p8'],
		[PARTICIPANT_REMOVAL_PATTERN.SHIFT_ONLY, ['p4', 'p6', 'p8'], null],
		[PARTICIPANT_REMOVAL_PATTERN.SHIFT_AND_CROSS, ['p5', 'p7'], 'p8'],
		[PARTICIPANT_REMOVAL_PATTERN.SHIFT_ONLY, ['p6', 'p8'], null],
		[PARTICIPANT_REMOVAL_PATTERN.SHIFT_AND_CROSS, ['p7'], 'p8'],
		[PARTICIPANT_REMOVAL_PATTERN.SHIFT_ONLY, ['p8'], null],
		[PARTICIPANT_REMOVAL_PATTERN.CROSS_ONLY, [], 'p8'],
		[PARTICIPANT_REMOVAL_PATTERN.EXIT_ONLY, [], null]
	];

	for (const [index, expectation] of expected.entries()) {
		const plan = planParticipantRemoval(participants, `p${index + 1}`);
		assert.deepEqual(
			[plan.pattern, plan.shiftingParticipantIds, plan.crossingParticipantId],
			expectation
		);
		assert.equal(plan.removedDisplayNumber, index + 1);
	}
});

test('7명 명단은 홀수와 짝수 위치의 당김·교차 패턴이 반대로 반복된다', () => {
	const participants = Array.from({ length: 7 }, (_, index) => ({
		id: `p${index + 1}`,
		name: String(index + 1),
		column: index % 2
	}));
	const expectedPatterns = [
		PARTICIPANT_REMOVAL_PATTERN.SHIFT_ONLY,
		PARTICIPANT_REMOVAL_PATTERN.SHIFT_AND_CROSS,
		PARTICIPANT_REMOVAL_PATTERN.SHIFT_ONLY,
		PARTICIPANT_REMOVAL_PATTERN.SHIFT_AND_CROSS,
		PARTICIPANT_REMOVAL_PATTERN.SHIFT_ONLY,
		PARTICIPANT_REMOVAL_PATTERN.CROSS_ONLY,
		PARTICIPANT_REMOVAL_PATTERN.EXIT_ONLY
	];

	assert.deepEqual(
		participants.map((participant) => planParticipantRemoval(participants, participant.id).pattern),
		expectedPatterns
	);
});

test('1명부터 20명까지 모든 삭제 위치가 같은 패턴 공식에 맞는다', () => {
	for (let total = 1; total <= 20; total += 1) {
		const participants = Array.from({ length: total }, (_, index) => ({
			id: `p${index + 1}`,
			name: String(index + 1),
			column: index % 2
		}));

		for (let removed = 1; removed <= total; removed += 1) {
			const plan = planParticipantRemoval(participants, `p${removed}`);
			const sameParity = total % 2 === removed % 2;
			const expectedPattern =
				removed === total
					? PARTICIPANT_REMOVAL_PATTERN.EXIT_ONLY
					: removed === total - 1
						? PARTICIPANT_REMOVAL_PATTERN.CROSS_ONLY
						: sameParity
							? PARTICIPANT_REMOVAL_PATTERN.SHIFT_ONLY
							: PARTICIPANT_REMOVAL_PATTERN.SHIFT_AND_CROSS;
			const expectedShiftIds = [];
			for (let shifted = removed + 2; shifted <= total; shifted += 2) {
				expectedShiftIds.push(`p${shifted}`);
			}

			assert.equal(plan.pattern, expectedPattern);
			assert.deepEqual(plan.shiftingParticipantIds, expectedShiftIds);
			assert.equal(plan.crossingParticipantId, sameParity ? null : `p${total}`);
			assert.equal(plan.nextParticipants.length, total - 1);
		}
	}
});

test('돌림판이 선택한 조각의 가운데를 포인터에 맞춘다', () => {
	const segmentCount = 7;
	const segmentDegrees = 360 / segmentCount;

	for (let pickedIndex = 0; pickedIndex < segmentCount; pickedIndex += 1) {
		const rotation = calculateWheelTargetRotation(127.25, segmentCount, pickedIndex);
		const pickedCenter = pickedIndex * segmentDegrees + segmentDegrees / 2;
		const stoppedAngle = (((rotation + pickedCenter) % 360) + 360) % 360;
		assert.ok(Math.abs(stoppedAngle) < 1e-9 || Math.abs(stoppedAngle - 360) < 1e-9);
	}
});

const match = (id, ranking, teams) => ({
	id,
	occurredAt: `2026-09-02T0${id}:00:00.000Z`,
	winnerTeamId: ranking[0],
	ranking,
	teams: teams.map((team, index) => ({
		id: index + 1,
		name: `${index + 1}팀`,
		members: team.members,
		picks: team.picks ?? []
	}))
});

test('팀 결과를 팀 이름과 참가자 이름만 담은 여러 줄 글로 만든다', () => {
	assert.equal(
		formatTeamsText([
			{ name: '1팀', members: [{ name: '황준호' }, { name: '권순범' }] },
			{ name: '2팀', members: [{ name: '하종우' }, { name: '이민형' }] }
		]),
		'1팀\n황준호\n권순범\n2팀\n하종우\n이민형'
	);
	assert.equal(formatTeamsText([{ name: '1팀', members: ['가영', '나연'] }]), '1팀\n가영\n나연');
	assert.equal(formatTeamsText([]), '');
});

test('2팀은 승리 한 번으로 순위가 완결되고 3팀 이상은 순차로 지정한다', () => {
	assert.deepEqual(appendTeamRank([], 1, [1, 2]), [1, 2]);
	assert.deepEqual(appendTeamRank([], 2, [1, 2]), [2, 1]);
	assert.deepEqual(appendTeamRank([], 3, [1, 2, 3]), [3]);
	assert.deepEqual(appendTeamRank([3], 1, [1, 2, 3]), [3, 1, 2]);
	assert.deepEqual(appendTeamRank([], 2, [1, 2, 3, 4]), [2]);
	assert.deepEqual(appendTeamRank([2], 4, [1, 2, 3, 4]), [2, 4]);
	assert.deepEqual(appendTeamRank([2, 4], 1, [1, 2, 3, 4]), [2, 4, 1, 3]);
});

test('이미 순위를 받은 팀이나 목록 밖 팀을 고르면 입력을 그대로 돌려준다', () => {
	const ranking = [3, 1, 2];
	assert.equal(appendTeamRank(ranking, 1, [1, 2, 3]), ranking);
	assert.equal(appendTeamRank(ranking, 9, [1, 2, 3]), ranking);
});

test('순위 취소는 자동으로 채워진 마지막 순위까지 함께 되돌린다', () => {
	assert.deepEqual(removeLastTeamRank([1, 2], [1, 2]), []);
	assert.deepEqual(removeLastTeamRank([3, 1, 2], [1, 2, 3]), [3]);
	assert.deepEqual(removeLastTeamRank([3], [1, 2, 3]), []);
	assert.deepEqual(removeLastTeamRank([], [1, 2, 3]), []);
	assert.deepEqual(removeLastTeamRank([2, 4, 1, 3], [1, 2, 3, 4]), [2, 4]);
});

test('순위를 순서대로 넣었다 되돌리면 매 단계 이전 상태로 정확히 돌아온다', () => {
	for (let teamCount = 2; teamCount <= 6; teamCount += 1) {
		const teamIds = Array.from({ length: teamCount }, (_, index) => index + 1);
		const order = shuffle(teamIds, () => 0.37);
		const states = [[]];
		let ranking = [];
		for (const teamId of order) {
			const next = appendTeamRank(ranking, teamId, teamIds);
			if (next === ranking) continue;
			ranking = next;
			states.push(ranking);
		}
		assert.equal(ranking.length, teamCount);
		for (let index = states.length - 1; index > 0; index -= 1) {
			assert.deepEqual(removeLastTeamRank(states[index], teamIds), states[index - 1]);
		}
	}
});

test('저장된 기록의 순위를 정리하고 옛 기록도 되살린다', () => {
	const teams = [
		{ id: 1, name: '1팀', members: ['가영'] },
		{ id: 2, name: '2팀', members: ['나연'] }
	];
	assert.deepEqual(resolveTeamRanking({ winnerTeamId: 1, teams }), {
		ranking: [1, 2],
		complete: true
	});

	const threeTeams = [...teams, { id: 3, name: '3팀', members: ['다현'] }];
	assert.deepEqual(resolveTeamRanking({ winnerTeamId: 2, teams: threeTeams }), {
		ranking: [2],
		complete: false
	});

	assert.deepEqual(
		resolveTeamRanking({ winnerTeamId: 2, ranking: [2, 2, 9, 1], teams: threeTeams }),
		{ ranking: [2, 1, 3], complete: true }
	);

	assert.deepEqual(resolveTeamRanking({ winnerTeamId: 9, teams: threeTeams }), {
		ranking: [],
		complete: false
	});
});

test('2팀은 승패로, 3팀 이상은 등수 숫자로 표시하고 꼴등이라는 말은 쓰지 않는다', () => {
	assert.equal(formatTeamResultLabel({ teamName: '1팀', rank: 1, teamCount: 2 }), '1팀승');
	assert.equal(formatTeamResultLabel({ teamName: '2팀', rank: 2, teamCount: 2 }), '2팀패');
	assert.equal(formatTeamResultLabel({ teamName: '1팀', rank: 1, teamCount: 3 }), '1팀 1등');
	assert.equal(formatTeamResultLabel({ teamName: '3팀', rank: 3, teamCount: 3 }), '3팀 3등');
	assert.equal(formatTeamResultLabel({ teamName: '4팀', rank: null, teamCount: 4 }), '순위 미정');
	assert.equal(
		formatTeamResultLabel({ teamName: '4팀', rank: null, teamCount: 4, compact: true }),
		'미정'
	);

	// 팀 이름을 이미 보여 주는 칩에서는 등수만 적는다. 2팀 표기는 그대로 둔다.
	assert.equal(
		formatTeamResultLabel({ teamName: '1팀', rank: 1, teamCount: 3, compact: true }),
		'1등'
	);
	assert.equal(
		formatTeamResultLabel({ teamName: '3팀', rank: 3, teamCount: 3, compact: true }),
		'3등'
	);
	assert.equal(
		formatTeamResultLabel({ teamName: '1팀', rank: 1, teamCount: 2, compact: true }),
		'1팀승'
	);
	assert.equal(
		formatTeamResultLabel({ teamName: '2팀', rank: 2, teamCount: 2, compact: true }),
		'2팀패'
	);

	for (let teamCount = 2; teamCount <= 6; teamCount += 1) {
		for (let rank = 1; rank <= teamCount; rank += 1) {
			for (const compact of [false, true]) {
				const label = formatTeamResultLabel({ teamName: `${rank}팀`, rank, teamCount, compact });
				assert.ok(!label.includes('꼴등'), `${label}에 꼴등이 들어갔습니다.`);
			}
		}
	}
});

test('오늘 기록은 날짜와 지우기 시각을 함께 본다', () => {
	const now = new Date(2026, 8, 2, 20, 0, 0, 0);
	const todayKey = localDateKey(now);
	const at = (hour) => {
		const date = new Date(now);
		date.setHours(hour, 0, 0, 0);
		return date.toISOString();
	};
	const history = [
		{ id: 'a', occurredAt: at(9) },
		{ id: 'b', occurredAt: at(13) },
		{ id: 'c', occurredAt: new Date(now.getTime() - 86_400_000).toISOString() }
	];

	assert.deepEqual(
		selectTodayHistory(history, { now }).map((entry) => entry.id),
		['a', 'b']
	);
	assert.deepEqual(
		selectTodayHistory(history, { now, clearedAt: at(10) }).map((entry) => entry.id),
		['b']
	);
	assert.deepEqual(selectTodayHistory(history, { now, clearedAt: at(13) }), []);
	assert.equal(localDateKey(at(9)), todayKey);
});

test('오늘 기록은 오전 6시를 하루의 시작으로 본다', () => {
	const at = (day, hour, minute = 0) => new Date(2026, 8, day, hour, minute, 0, 0).toISOString();
	const history = [
		{ id: 'before-start', occurredAt: at(1, 5, 59) },
		{ id: 'day-start', occurredAt: at(1, 6) },
		{ id: 'before-next-start', occurredAt: at(2, 5, 59) },
		{ id: 'next-day-start', occurredAt: at(2, 6) }
	];

	assert.deepEqual(
		selectTodayHistory(history, { now: new Date(at(2, 5, 59)) }).map((entry) => entry.id),
		['day-start', 'before-next-start']
	);
	assert.deepEqual(
		selectTodayHistory(history, { now: new Date(at(2, 6)) }).map((entry) => entry.id),
		['next-day-start']
	);
});

test('참가자별 승리·당첨·패배와 같은 팀 궁합을 센다', () => {
	const history = [
		match(
			1,
			[1, 2],
			[{ members: ['가영', '나연'], picks: ['가영'] }, { members: ['다현', '라희'] }]
		),
		match(
			2,
			[1, 2],
			[{ members: ['가영', '나연'], picks: ['나연', '가영'] }, { members: ['다현', '라희'] }]
		),
		match(3, [1, 2], [{ members: ['가영', '다현'] }, { members: ['나연', '라희'] }])
	];

	const stats = summarizeParticipantStats(history);
	assert.equal(stats.matchCount, 3);
	assert.deepEqual(stats.topWins[0], { name: '가영', count: 3 });
	assert.deepEqual(stats.topPicks[0], { name: '가영', count: 2 });
	assert.deepEqual(stats.topLosses[0], { name: '라희', count: 3 });

	const best = stats.pairs[0];
	assert.deepEqual(best.names, ['가영', '나연']);
	assert.equal(best.together, 2);
	assert.equal(best.wins, 2);
	assert.equal(best.winRate, 1);

	const 가영 = stats.players.find((player) => player.name === '가영');
	assert.equal(가영.matches, 3);
	assert.equal(가영.wins, 3);
	assert.equal(가영.losses, 0);
});

test('궁합은 같은 팀 횟수가 기준에 미치지 못하면 빼고 동점은 이름 순으로 정렬한다', () => {
	const history = [
		match(1, [1, 2], [{ members: ['가영', '나연'] }, { members: ['다현', '라희'] }]),
		match(2, [1, 2], [{ members: ['가영', '마루'] }, { members: ['다현', '바다'] }])
	];
	assert.deepEqual(summarizeParticipantStats(history).pairs, []);
	assert.deepEqual(
		summarizeParticipantStats(history, { minimumTogether: 1 })
			.pairs.map((pair) => pair.names.join('+'))
			.slice(0, 2),
		['가영+나연', '가영+마루']
	);
	assert.deepEqual(
		summarizeParticipantStats(history).topWins.map((item) => item.name),
		['가영', '나연', '마루']
	);
});

test('한 팀에 같은 이름이 두 번 있어도 한 명으로 센다', () => {
	const duplicated = [match(1, [1, 2], [{ members: ['가영', '가영'] }, { members: ['나연'] }])];
	const 가영 = summarizeParticipantStats(duplicated).players.find((item) => item.name === '가영');
	assert.equal(가영.matches, 1);
	assert.equal(가영.wins, 1);

	const legacy = [
		{
			id: 'legacy',
			occurredAt: '2026-09-02T01:00:00.000Z',
			winnerTeamId: 1,
			teams: [
				{ id: 1, name: '1팀', members: ['가영'] },
				{ id: 2, name: '2팀', members: ['나연'] },
				{ id: 3, name: '3팀', members: ['다현'] }
			]
		}
	];
	assert.deepEqual(
		summarizeParticipantStats(legacy).topLosses.map((item) => item.name),
		['나연', '다현']
	);
	assert.equal(summarizeParticipantStats(legacy).topWins[0].name, '가영');
});

test('4팀 경기에서는 1등만 이기고 2등부터 모두 진다', () => {
	const history = [
		match(
			1,
			[2, 4, 1, 3],
			[{ members: ['가영'] }, { members: ['나연'] }, { members: ['다현'] }, { members: ['라희'] }]
		)
	];
	const players = summarizeParticipantStats(history).players;
	assert.deepEqual(
		Object.fromEntries(players.map(({ name, wins, losses }) => [name, [wins, losses]])),
		{ 가영: [0, 1], 나연: [1, 0], 다현: [0, 1], 라희: [0, 1] }
	);
});

test('1등만 정해진 기록과 옛 기록도 나머지 팀을 패배로 센다', () => {
	const teams = [
		{ id: 1, name: '1팀', members: ['가영'] },
		{ id: 2, name: '2팀', members: ['나연'] },
		{ id: 3, name: '3팀', members: ['다현'] }
	];
	for (const entry of [
		{ id: 'ranking', occurredAt: '2026-09-02T01:00:00.000Z', winnerTeamId: 2, ranking: [2], teams },
		{ id: 'legacy', occurredAt: '2026-09-02T02:00:00.000Z', winnerTeamId: 2, teams }
	]) {
		const players = summarizeParticipantStats([entry]).players;
		assert.deepEqual(
			Object.fromEntries(players.map(({ name, wins, losses }) => [name, [wins, losses]])),
			{ 가영: [0, 1], 나연: [1, 0], 다현: [0, 1] }
		);
	}
});

test('유효한 1등이 없으면 승패에 포함하지 않는다', () => {
	const stats = summarizeParticipantStats(
		[
			{
				id: 'invalid',
				occurredAt: '2026-09-02T01:00:00.000Z',
				winnerTeamId: 9,
				ranking: [9],
				teams: [
					{ id: 1, name: '1팀', members: ['가영', '마루'] },
					{ id: 2, name: '2팀', members: ['나연'] },
					{ id: 3, name: '3팀', members: ['다현'] }
				]
			}
		],
		{ minimumTogether: 1 }
	);
	assert.ok(
		stats.players.every(
			(player) =>
				player.matches === 0 && player.wins === 0 && player.losses === 0 && player.winRate === 0
		)
	);
	assert.deepEqual(stats.topWins, []);
	assert.deepEqual(stats.topLosses, []);
	assert.deepEqual(stats.pairs, []);
});

test('1등 확률은 유효한 1등이 있는 참가 경기만 분모로 센다', () => {
	const valid = match(1, [1, 2], [{ members: ['가영'] }, { members: ['나연'] }]);
	const invalid = {
		id: 'invalid',
		occurredAt: '2026-09-02T02:00:00.000Z',
		winnerTeamId: 9,
		ranking: [9],
		teams: [
			{ id: 1, name: '1팀', members: ['가영'] },
			{ id: 2, name: '2팀', members: ['다현'] }
		]
	};
	const player = summarizeParticipantStats([valid, invalid]).players.find(
		(entry) => entry.name === '가영'
	);

	assert.equal(player.matches, 1);
	assert.equal(player.wins, 1);
	assert.equal(player.winRate, 1);
});

test('1등 확률은 화면에 표시하는 승패 합계를 분모로 센다', () => {
	const player = summarizeParticipantStats([
		match(
			1,
			[1, 2, 3],
			[
				{ members: ['가영'] },
				{ members: ['가영'] },
				{ members: ['가영'] }
			]
		)
	]).players.find((entry) => entry.name === '가영');

	assert.equal(player.wins, 1);
	assert.equal(player.losses, 2);
	assert.equal(player.winRate, 1 / 3);
});

test('2팀 경기의 기존 승패 계산을 유지한다', () => {
	const players = summarizeParticipantStats([
		match(1, [2, 1], [{ members: ['가영'] }, { members: ['나연'] }])
	]).players;
	assert.deepEqual(
		Object.fromEntries(players.map(({ name, wins, losses }) => [name, [wins, losses]])),
		{ 가영: [0, 1], 나연: [1, 0] }
	);
});
