export const TEAM_MODE = 'teams';
export const SIZE_MODE = 'size';

export class AssignmentError extends Error {
	constructor(code, message) {
		super(message);
		this.name = 'AssignmentError';
		this.code = code;
	}
}

export function parseParticipantNames(value) {
	return String(value ?? '')
		.split(/[\n,]/)
		.map((name) => name.trim())
		.filter(Boolean);
}

export function calculateTeamCount(mode, value, participantCount) {
	if (mode === TEAM_MODE) return value;
	return Math.ceil(participantCount / value);
}

export function rebalanceParticipantColumns(participants) {
	const result = participants.map((participant) => ({
		...participant,
		column: participant.column === 1 ? 1 : 0
	}));

	for (let guard = 0; guard < 200; guard += 1) {
		const left = result.filter((participant) => participant.column === 0);
		const right = result.filter((participant) => participant.column === 1);
		const shouldMoveLeft = right.length > left.length;
		const shouldMoveRight = left.length - right.length >= 2;
		if (!shouldMoveLeft && !shouldMoveRight) break;

		const source = shouldMoveLeft ? right : left;
		const moved = source[source.length - 1];
		const index = result.indexOf(moved);
		result[index] = { ...moved, column: shouldMoveLeft ? 0 : 1 };
	}

	return result;
}

export function calculateWheelTargetRotation(currentRotation, segmentCount, pickedIndex) {
	if (!Number.isInteger(segmentCount) || segmentCount < 1) {
		throw new RangeError('돌림판 조각 수는 1개 이상이어야 합니다.');
	}
	if (!Number.isInteger(pickedIndex) || pickedIndex < 0 || pickedIndex >= segmentCount) {
		throw new RangeError('당첨자 순번이 돌림판 범위를 벗어났습니다.');
	}

	const segmentDegrees = 360 / segmentCount;
	const baseRotation = currentRotation + 360 * 8;
	const pickedCenter = pickedIndex * segmentDegrees + segmentDegrees / 2;
	return baseRotation + ((360 - ((baseRotation + pickedCenter) % 360)) % 360);
}

export function getSetupStatus({ mode, teamCount, teamSize, participantCount }) {
	if (participantCount < 2) {
		return {
			disabled: true,
			reason: '참가자를 두 명 이상 선택해 주세요.',
			teamCount: 0
		};
	}

	if (mode === TEAM_MODE && teamCount > participantCount) {
		return {
			disabled: true,
			reason: '참가자보다 팀 수가 많습니다. 팀 수를 줄여 주세요.',
			teamCount
		};
	}

	if (mode === SIZE_MODE && teamSize > participantCount) {
		return {
			disabled: true,
			reason: '참가자보다 팀당 인원이 많습니다. 인원 수를 줄여 주세요.',
			teamCount: 1
		};
	}

	const resultTeamCount = calculateTeamCount(
		mode,
		mode === TEAM_MODE ? teamCount : teamSize,
		participantCount
	);

	return {
		disabled: false,
		reason: `${participantCount}명을 ${resultTeamCount}개 팀으로 나눕니다.`,
		teamCount: resultTeamCount
	};
}

export function shuffle(items, random = Math.random) {
	const result = [...items];
	for (let index = result.length - 1; index > 0; index -= 1) {
		const picked = Math.floor(random() * (index + 1));
		[result[index], result[picked]] = [result[picked], result[index]];
	}
	return result;
}

export function cleanRulesAfterParticipantRemoval(rules, availableIds) {
	const available = availableIds instanceof Set ? availableIds : new Set(availableIds);
	return rules
		.map((rule) => ({
			...rule,
			participantIds: [...new Set(rule.participantIds)].filter((id) => available.has(id))
		}))
		.filter((rule) => rule.participantIds.length >= 2);
}

class UnionFind {
	constructor(ids) {
		this.parent = new Map(ids.map((id) => [id, id]));
	}

	find(id) {
		const parent = this.parent.get(id);
		if (parent === id) return id;
		const root = this.find(parent);
		this.parent.set(id, root);
		return root;
	}

	union(first, second) {
		const firstRoot = this.find(first);
		const secondRoot = this.find(second);
		if (firstRoot !== secondRoot) this.parent.set(secondRoot, firstRoot);
	}
}

function createGroups(participants, rules, teamCount) {
	const ids = participants.map((participant) => participant.id);
	const available = new Set(ids);
	const unionFind = new UnionFind(ids);

	for (const rule of rules.filter((item) => item.type === 'together')) {
		const selected = rule.participantIds.filter((id) => available.has(id));
		for (let index = 1; index < selected.length; index += 1) {
			unionFind.union(selected[0], selected[index]);
		}
	}

	const groupsByRoot = new Map();
	for (const participant of participants) {
		const root = unionFind.find(participant.id);
		if (!groupsByRoot.has(root)) groupsByRoot.set(root, []);
		groupsByRoot.get(root).push(participant);
	}

	const conflicts = new Map([...groupsByRoot.keys()].map((root) => [root, new Set()]));
	for (const rule of rules.filter((item) => item.type === 'apart')) {
		const roots = [
			...new Set(
				rule.participantIds.filter((id) => available.has(id)).map((id) => unionFind.find(id))
			)
		];
		const includedCount = rule.participantIds.filter((id) => available.has(id)).length;

		if (roots.length !== includedCount) {
			throw new AssignmentError(
				'RULE_CONFLICT',
				'같은 팀 규칙과 다른 팀 규칙이 서로 충돌합니다. 규칙을 확인해 주세요.'
			);
		}

		if (roots.length > teamCount) {
			throw new AssignmentError(
				'NOT_ENOUGH_TEAMS_FOR_APART_RULE',
				'서로 다른 팀으로 나눌 참가자보다 팀 수가 적습니다. 팀 수나 규칙을 고쳐 주세요.'
			);
		}

		for (let first = 0; first < roots.length; first += 1) {
			for (let second = first + 1; second < roots.length; second += 1) {
				conflicts.get(roots[first]).add(roots[second]);
				conflicts.get(roots[second]).add(roots[first]);
			}
		}
	}

	return [...groupsByRoot.entries()].map(([root, members]) => ({
		root,
		members,
		conflicts: conflicts.get(root)
	}));
}

function buildCapacities(participantCount, teamCount, random) {
	const minimum = Math.floor(participantCount / teamCount);
	const largerTeams = participantCount % teamCount;
	return shuffle(
		Array.from({ length: teamCount }, (_, index) => minimum + (index < largerTeams ? 1 : 0)),
		random
	);
}

function assignGroups(groups, capacities, random) {
	const ordered = shuffle(groups, random).sort((first, second) => {
		return (
			second.members.length - first.members.length || second.conflicts.size - first.conflicts.size
		);
	});
	const assignedTeam = new Map();
	const teams = capacities.map(() => []);
	const used = capacities.map(() => 0);
	let visited = 0;

	function place(groupIndex) {
		visited += 1;
		if (visited > 200000) return false;
		if (groupIndex === ordered.length) return true;

		const group = ordered[groupIndex];
		const candidates = shuffle(
			capacities
				.map((capacity, teamIndex) => ({
					teamIndex,
					space: capacity - used[teamIndex] - group.members.length
				}))
				.filter(({ teamIndex, space }) => {
					if (space < 0) return false;
					return !teams[teamIndex].some((placedRoot) => group.conflicts.has(placedRoot));
				}),
			random
		).sort((first, second) => first.space - second.space);

		for (const { teamIndex } of candidates) {
			assignedTeam.set(group.root, teamIndex);
			teams[teamIndex].push(group.root);
			used[teamIndex] += group.members.length;

			if (place(groupIndex + 1)) return true;

			assignedTeam.delete(group.root);
			teams[teamIndex].pop();
			used[teamIndex] -= group.members.length;
		}

		return false;
	}

	return place(0) ? assignedTeam : null;
}

export function makeTeams({ participants, rules = [], teamCount, random = Math.random }) {
	if (participants.length < 2) {
		throw new AssignmentError('NOT_ENOUGH_PARTICIPANTS', '참가자를 두 명 이상 선택해 주세요.');
	}
	if (!Number.isInteger(teamCount) || teamCount < 1 || teamCount > participants.length) {
		throw new AssignmentError('INVALID_TEAM_COUNT', '참가자 수에 맞게 팀 수를 고쳐 주세요.');
	}

	const groups = createGroups(participants, rules, teamCount);
	const maximumTeamSize = Math.ceil(participants.length / teamCount);
	const oversized = groups.find((group) => group.members.length > maximumTeamSize);
	if (oversized) {
		throw new AssignmentError(
			'TOGETHER_GROUP_TOO_LARGE',
			`같은 팀으로 지정한 인원이 한 팀 정원(${maximumTeamSize}명)보다 많습니다.`
		);
	}

	for (let attempt = 0; attempt < 30; attempt += 1) {
		const capacities = buildCapacities(participants.length, teamCount, random);
		const assignment = assignGroups(groups, capacities, random);
		if (!assignment) continue;

		const teams = capacities.map(() => []);
		for (const group of groups) {
			teams[assignment.get(group.root)].push(...shuffle(group.members, random));
		}

		return teams.map((members, index) => ({
			id: index + 1,
			name: `${index + 1}팀`,
			members: shuffle(members, random)
		}));
	}

	throw new AssignmentError(
		'NO_VALID_ASSIGNMENT',
		'현재 규칙으로 고르게 나눌 수 없습니다. 규칙이나 팀 수를 고쳐 주세요.'
	);
}
