import { MAX_TEAMS, MIN_TEAMS, deriveRounds, effectiveWinners } from './bracket.js';
import { TEAM_NAME_MAX, createTeamId, visibleLength } from './teams.js';

export const STORAGE_KEY = 'lake.bracket.v1';
// Team Maker 결과를 넘겨받는 임시 키. 대진표 화면이 읽은 뒤 바로 지운다.
export const IMPORT_KEY = 'lake.bracket.import.v1';
const VERSION = 1;

function cleanText(value, max) {
	if (typeof value !== 'string') return null;
	const text = value.trim();
	return text && visibleLength(text) <= max ? text : null;
}

function cleanMembers(value) {
	return Array.isArray(value)
		? value.filter((name) => typeof name === 'string' && name.trim())
		: [];
}

// strict는 대진표에 들어간 팀처럼 이름이 확정된 목록에 쓴다.
// 입력 중인 목록은 빈 이름이나 긴 이름도 그대로 복원해 사용자가 고칠 수 있게 한다.
function cleanTeams(value, { strict = true, requireId = true } = {}) {
	if (!Array.isArray(value)) return null;
	const ids = new Set();
	const teams = [];
	for (const item of value) {
		const name = strict
			? cleanText(item?.name, TEAM_NAME_MAX)
			: typeof item?.name === 'string'
				? item.name.slice(0, 200)
				: null;
		const id = requireId ? item?.id : createTeamId();
		if (name === null || typeof id !== 'string' || ids.has(id)) return null;
		ids.add(id);
		teams.push({ id, name, members: cleanMembers(item.members) });
	}
	return teams;
}

function cleanBracket(value) {
	if (value === null || value === undefined) return null;
	const teams = cleanTeams(value.teams);
	if (!teams || teams.length < MIN_TEAMS || teams.length > MAX_TEAMS)
		throw new TypeError('bracket');
	if (new Set(teams.map((team) => team.name)).size !== teams.length) throw new TypeError('bracket');
	// 첫 라운드 순서는 모든 팀을 한 번씩 담아야 한다. 부전승 자리는 팀 수로 다시 계산한다.
	const slots = value.slots;
	if (!Array.isArray(slots) || slots.length !== teams.length) throw new TypeError('bracket');
	const ids = new Set(teams.map((team) => team.id));
	if (new Set(slots).size !== slots.length || !slots.every((slot) => ids.has(slot)))
		throw new TypeError('bracket');
	const winners = {};
	if (value.winners && typeof value.winners === 'object') {
		for (const [id, team] of Object.entries(value.winners)) {
			if (typeof team === 'string') winners[id] = team;
		}
	}
	const bracket = {
		title: typeof value.title === 'string' ? value.title.slice(0, 200) : '',
		order: value.order === 'random' ? 'random' : 'input',
		teams,
		slots: [...slots],
		winners
	};
	bracket.winners = effectiveWinners(deriveRounds(bracket));
	return bracket;
}

/**
 * 저장된 상태를 읽는다. 없으면 state가 null이고, 손상됐으면 error가 'corrupt'다.
 * 저장 공간을 쓸 수 없어 storage가 null이면 error가 'read'다.
 */
export function loadState(storage) {
	if (!storage) return { state: null, error: 'read' };
	let raw;
	try {
		raw = storage.getItem(STORAGE_KEY);
	} catch {
		return { state: null, error: 'read' };
	}
	if (raw === null) return { state: null, error: '' };
	try {
		const data = JSON.parse(raw);
		if (data?.version !== VERSION) throw new TypeError('version');
		const teams = cleanTeams(data.teams, { strict: false });
		if (!teams || teams.length > MAX_TEAMS) throw new TypeError('teams');
		const state = {
			title: typeof data.title === 'string' ? data.title.slice(0, 200) : '',
			order: data.order === 'random' ? 'random' : 'input',
			teams,
			bracket: null
		};
		// 대진표만 손상됐으면 팀 목록은 살리고 대진표만 버린다.
		try {
			state.bracket = cleanBracket(data.bracket);
		} catch {
			return { state, error: 'corrupt' };
		}
		return { state, error: '' };
	} catch {
		return { state: null, error: 'corrupt' };
	}
}

export function saveState(storage, { title, order, teams, bracket }) {
	storage.setItem(STORAGE_KEY, JSON.stringify({ version: VERSION, title, order, teams, bracket }));
}

/** Team Maker 결과를 넘긴다. 저장에 실패하면 예외를 그대로 던진다. */
export function writeImport(storage, teams) {
	storage.setItem(
		IMPORT_KEY,
		JSON.stringify({
			version: VERSION,
			teams: teams.map((team) => ({ name: team.name, members: [...team.members] }))
		})
	);
}

/**
 * 넘겨받은 팀을 읽고 임시 키를 지운다. 팀 수가 2~32개가 아니거나 형식이 틀리면 error를 돌려준다.
 * 키가 없거나 storage가 null이면 teams와 error가 모두 비어 있다.
 */
export function takeImport(storage) {
	if (!storage) return { teams: null, error: '' };
	let raw;
	try {
		raw = storage.getItem(IMPORT_KEY);
		if (raw !== null) storage.removeItem(IMPORT_KEY);
	} catch {
		return { teams: null, error: '' };
	}
	if (raw === null) return { teams: null, error: '' };
	try {
		const data = JSON.parse(raw);
		if (data?.version !== VERSION) throw new TypeError('version');
		const teams = cleanTeams(data.teams, { requireId: false });
		if (!teams) throw new TypeError('teams');
		if (new Set(teams.map((team) => team.name)).size !== teams.length) throw new TypeError('names');
		if (teams.length < MIN_TEAMS || teams.length > MAX_TEAMS) {
			return {
				teams: null,
				error: `대진표는 ${MIN_TEAMS}~${MAX_TEAMS}팀만 만들 수 있어요. 가져온 팀은 ${teams.length}개예요.`
			};
		}
		return { teams, error: '' };
	} catch {
		return { teams: null, error: '팀 메이커에서 가져온 팀 정보를 읽지 못했어요.' };
	}
}
