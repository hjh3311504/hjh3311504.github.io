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
	getSetupStatus,
	makeTeams,
	orderParticipantsForColumns,
	parseParticipantNames,
	planParticipantRemoval,
	rebalanceParticipantColumns
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
