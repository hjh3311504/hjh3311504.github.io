import {
	SIZE_MODE,
	TEAM_MODE,
	cleanRulesAfterParticipantRemoval,
	rebalanceParticipantColumns,
	resolveTeamRanking
} from './core.js';
import { clamp, createId } from './utils.js';

export const STORAGE_KEY = 'team-maker:v1';

export function defaultState() {
	return {
		version: 2,
		participants: [],
		rules: [],
		rosters: [],
		mode: TEAM_MODE,
		teamCount: 2,
		teamSize: 4,
		history: [],
		soundEnabled: true,
		todayClearedAt: null
	};
}

function cleanParticipants(value) {
	if (!Array.isArray(value)) return [];
	const seen = new Set();
	const participants = value
		.map((participant, index) => ({
			id: typeof participant?.id === 'string' ? participant.id : createId('person'),
			name: typeof participant?.name === 'string' ? participant.name.trim() : '',
			included: participant?.included !== false,
			columnOrder: Number.isInteger(participant?.columnOrder) ? participant.columnOrder : undefined,
			column:
				participant?.column === 1 || participant?.col === 1
					? 1
					: participant?.column === 0 || participant?.col === 0
						? 0
						: index % 2
		}))
		.filter((participant) => {
			if (!participant.name || seen.has(participant.id)) return false;
			seen.add(participant.id);
			return true;
		});
	return rebalanceParticipantColumns(participants);
}

function cleanRules(value, participants) {
	if (!Array.isArray(value)) return [];
	const availableIds = new Set(participants.map((participant) => participant.id));
	return cleanRulesAfterParticipantRemoval(
		value
			.filter((rule) => rule?.type === 'together' || rule?.type === 'apart')
			.map((rule) => ({
				id: typeof rule.id === 'string' ? rule.id : createId('rule'),
				type: rule.type,
				participantIds: Array.isArray(rule.participantIds)
					? rule.participantIds.filter((id) => typeof id === 'string')
					: []
			})),
		availableIds
	);
}

function cleanRoster(value) {
	if (!value || typeof value.name !== 'string' || !value.name.trim()) return null;
	const participants = cleanParticipants(value.participants);
	if (!participants.length) return null;
	return {
		id: typeof value.id === 'string' ? value.id : createId('roster'),
		name: value.name.trim(),
		participants,
		rules: cleanRules(value.rules, participants),
		updatedAt: typeof value.updatedAt === 'string' ? value.updatedAt : new Date().toISOString()
	};
}

function cleanHistory(value) {
	if (!Array.isArray(value)) return [];
	return value
		.filter((entry) => {
			return (
				entry &&
				typeof entry.id === 'string' &&
				typeof entry.occurredAt === 'string' &&
				typeof entry.winnerTeamId === 'number' &&
				Array.isArray(entry.teams)
			);
		})
		.map((entry) => {
			const teams = entry.teams
				.filter(
					(team) =>
						team &&
						typeof team.id === 'number' &&
						typeof team.name === 'string' &&
						Array.isArray(team.members)
				)
				.map((team) => ({
					id: team.id,
					name: team.name,
					members: team.members.filter((name) => typeof name === 'string'),
					picks: Array.isArray(team.picks)
						? team.picks.filter((name) => typeof name === 'string')
						: []
				}));
			const { ranking } = resolveTeamRanking({ ...entry, teams });
			return {
				id: entry.id,
				occurredAt: entry.occurredAt,
				winnerTeamId: ranking[0] ?? entry.winnerTeamId,
				ranking,
				teams
			};
		});
}

export function sanitizeState(value) {
	const defaults = defaultState();
	if (!value || typeof value !== 'object') return defaults;
	const participants = cleanParticipants(value.participants);
	return {
		...defaults,
		participants,
		rules: cleanRules(value.rules, participants),
		rosters: Array.isArray(value.rosters) ? value.rosters.map(cleanRoster).filter(Boolean) : [],
		mode: value.mode === SIZE_MODE ? SIZE_MODE : TEAM_MODE,
		teamCount: clamp(Number.parseInt(value.teamCount, 10) || 2, 2, 20),
		teamSize: clamp(Number.parseInt(value.teamSize, 10) || 4, 1, 20),
		history: cleanHistory(value.history),
		soundEnabled: value.soundEnabled !== false,
		todayClearedAt: typeof value.todayClearedAt === 'string' ? value.todayClearedAt : null
	};
}

export function createStorage({
	getStorage = () => globalThis.localStorage,
	onFailure = () => {}
} = {}) {
	function loadState() {
		try {
			const saved = getStorage().getItem(STORAGE_KEY);
			return saved ? sanitizeState(JSON.parse(saved)) : defaultState();
		} catch {
			onFailure();
			return defaultState();
		}
	}
	function saveState(state) {
		try {
			getStorage().setItem(STORAGE_KEY, JSON.stringify(state));
			return true;
		} catch {
			onFailure();
			return false;
		}
	}
	return { loadState, saveState };
}
