import assert from 'node:assert/strict';
import test from 'node:test';

import {
	AssignmentError,
	SIZE_MODE,
	TEAM_MODE,
	calculateTeamCount,
	cleanRulesAfterParticipantRemoval,
	getSetupStatus,
	makeTeams,
	parseParticipantNames
} from '../../static/team-maker/core.js';

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
	const exact = makeTeams({ participants: people('가', '나', '다', '라'), teamCount: 2, random: steadyRandom });
	assert.deepEqual(
		exact.map((team) => team.members.length).sort(),
		[2, 2]
	);

	const remainder = makeTeams({
		participants: people('가', '나', '다', '라', '마', '바', '사', '아'),
		teamCount: 3,
		random: steadyRandom
	});
	assert.deepEqual(
		remainder.map((team) => team.members.length).sort(),
		[2, 3, 3]
	);
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
	const teamOf = (id) => result.findIndex((team) => team.members.some((member) => member.id === id));
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
		(error) =>
			error instanceof AssignmentError && error.code === 'NOT_ENOUGH_TEAMS_FOR_APART_RULE'
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
	const teamOf = (id) => result.findIndex((team) => team.members.some((member) => member.id === id));

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
