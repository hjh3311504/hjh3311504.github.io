import { MAX_TEAMS, MIN_TEAMS } from './bracket.js';

export const TEAM_NAME_MAX = 16;
export const TITLE_MAX = 20;

const segmenter = new Intl.Segmenter('ko', { granularity: 'grapheme' });

/** 이모지와 결합 문자를 한 글자로 센다. */
export function visibleLength(text) {
	return [...segmenter.segment(text)].length;
}

export function limitVisible(text, max) {
	const parts = [...segmenter.segment(text)];
	return parts.length > max
		? parts
				.slice(0, max)
				.map((part) => part.segment)
				.join('')
		: text;
}

let sequence = 0;
export function createTeamId() {
	sequence += 1;
	return `team-${Date.now().toString(36)}-${sequence.toString(36)}`;
}

export function createTeam(name, members = []) {
	return { id: createTeamId(), name, members };
}

export function teamNameError(name) {
	const trimmed = name.trim();
	if (!trimmed) return '팀 이름을 입력하세요.';
	if (visibleLength(trimmed) > TEAM_NAME_MAX)
		return `팀 이름은 ${TEAM_NAME_MAX}자까지 입력할 수 있어요.`;
	return '';
}

/** 팀별 이름 오류와 대진표를 만들 수 없는 이유를 함께 계산한다. 중복은 뒤에 나온 팀에 표시한다. */
export function validateTeams(teams) {
	const errors = {};
	const seen = new Set();
	for (const team of teams) {
		const name = team.name.trim();
		const error = teamNameError(team.name);
		if (error) errors[team.id] = error;
		else if (seen.has(name)) errors[team.id] = '같은 이름의 팀이 있어요.';
		seen.add(name);
	}
	let reason = '';
	if (teams.length < MIN_TEAMS) reason = `팀을 ${MIN_TEAMS}개 이상 넣어 주세요.`;
	else if (teams.length > MAX_TEAMS) reason = `팀은 ${MAX_TEAMS}개까지 넣을 수 있어요.`;
	else if (Object.keys(errors).length) reason = '팀 이름 오류를 먼저 고쳐 주세요.';
	return { errors, reason, valid: !reason };
}

/** 쉼표나 줄바꿈으로 나눈 팀 이름 목록. 빈 칸은 건너뛴다. */
export function splitTeamNames(text) {
	return text
		.split(/[\r\n,]+/)
		.map((name) => name.trim())
		.filter(Boolean);
}

/**
 * 쉼표나 줄바꿈으로 여러 팀을 붙여 넣은 글을 해석한다.
 * 너무 긴 이름, 겹치는 이름, 팀 수 초과가 있으면 아무것도 추가하지 않고 이유를 돌려준다.
 * mode가 append면 existing(지금 팀 이름 목록)과 겹치는지도 확인한다.
 */
export function parseBulkTeams(text, { existing = [], mode = 'append' } = {}) {
	const names = splitTeamNames(text);
	if (!names.length) return { names, error: '추가할 팀 이름을 입력하세요.' };
	const tooLong = names.filter((name) => visibleLength(name) > TEAM_NAME_MAX);
	if (tooLong.length) {
		return {
			names,
			error: `${TEAM_NAME_MAX}자를 넘는 이름이 ${tooLong.length}개 있어요: ${tooLong[0]}`
		};
	}
	const kept = mode === 'append' ? existing.map((name) => name.trim()) : [];
	const seen = new Set(kept);
	const duplicate = names.find((name) => seen.has(name) || !seen.add(name));
	if (duplicate) return { names, error: `같은 이름의 팀이 있어요: ${duplicate}` };
	const total = kept.length + names.length;
	if (total > MAX_TEAMS) {
		return {
			names,
			error: `팀은 ${MAX_TEAMS}개까지 넣을 수 있어요. 지금 추가하면 ${total}개가 돼요.`
		};
	}
	return { names, error: '' };
}

/** from 위치의 팀을 to 위치로 옮긴 새 목록을 돌려준다. */
export function moveTeam(teams, from, to) {
	if (from === to || to < 0 || to >= teams.length) return teams;
	const next = [...teams];
	const [team] = next.splice(from, 1);
	next.splice(to, 0, team);
	return next;
}
