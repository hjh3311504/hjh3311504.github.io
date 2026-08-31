import {
	SIZE_MODE,
	TEAM_MODE,
	cleanRulesAfterParticipantRemoval,
	getSetupStatus,
	makeTeams,
	parseParticipantNames
} from './core.js';

const STORAGE_KEY = 'team-maker:v1';
const wheelColors = ['#f39a8f', '#f7bd76', '#ecd772', '#9ed48b', '#74c7b4', '#84b5ec', '#b39ce4', '#f0a3c8'];
const teamTones = [
	{ color: '#00734f', soft: '#e6f7f0', line: '#a8e0cd' },
	{ color: '#1b5fbd', soft: '#eaf3ff', line: '#c3ddfb' },
	{ color: '#a83209', soft: '#fff2ea', line: '#ffd9c2' },
	{ color: '#a3187a', soft: '#fdeef7', line: '#f7cee6' },
	{ color: '#0f6470', soft: '#e6f5f7', line: '#b6e0e6' },
	{ color: '#6b6410', soft: '#fbf8e0', line: '#eae3b0' }
];

const $ = (selector) => document.querySelector(selector);
const clone = (value) => JSON.parse(JSON.stringify(value));
const clamp = (value, minimum, maximum) => Math.min(maximum, Math.max(minimum, value));

let sequence = 0;
function createId(prefix) {
	sequence += 1;
	if (globalThis.crypto?.randomUUID) return `${prefix}-${globalThis.crypto.randomUUID()}`;
	return `${prefix}-${Date.now()}-${sequence}`;
}

function defaultState() {
	return {
		version: 1,
		participants: [],
		rules: [],
		rosters: [],
		mode: TEAM_MODE,
		teamCount: 2,
		teamSize: 2,
		history: [],
		soundEnabled: true
	};
}

function cleanParticipants(value) {
	if (!Array.isArray(value)) return [];
	const seen = new Set();
	return value
		.map((participant) => ({
			id: typeof participant?.id === 'string' ? participant.id : createId('person'),
			name: typeof participant?.name === 'string' ? participant.name.trim() : '',
			included: participant?.included !== false
		}))
		.filter((participant) => {
			if (!participant.name || seen.has(participant.id)) return false;
			seen.add(participant.id);
			return true;
		});
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
				participantIds: Array.isArray(rule.participantIds) ? rule.participantIds.filter((id) => typeof id === 'string') : []
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
		.map((entry) => ({
			id: entry.id,
			occurredAt: entry.occurredAt,
			winnerTeamId: entry.winnerTeamId,
			teams: entry.teams
				.filter((team) => team && typeof team.id === 'number' && typeof team.name === 'string' && Array.isArray(team.members))
				.map((team) => ({
					id: team.id,
					name: team.name,
					members: team.members.filter((name) => typeof name === 'string')
				}))
		}));
}

function sanitizeState(value) {
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
		teamSize: clamp(Number.parseInt(value.teamSize, 10) || 2, 1, 20),
		history: cleanHistory(value.history),
		soundEnabled: value.soundEnabled !== false
	};
}

let storageFailed = false;
function loadState() {
	try {
		const saved = localStorage.getItem(STORAGE_KEY);
		return saved ? sanitizeState(JSON.parse(saved)) : defaultState();
	} catch {
		storageFailed = true;
		return defaultState();
	}
}

let state = loadState();
const runtime = {
	teams: [],
	resultError: '',
	resultMessage: '',
	winnerTeamId: null,
	lastHistoryId: null,
	picks: {},
	ruleType: 'together',
	ruleSelection: new Set(),
	wheelTeamId: null,
	wheelRotation: 0,
	wheelSpinning: false,
	confirmAction: null
};

function showStorageFailure() {
	$('#storage-alert').hidden = !storageFailed;
}

function persist() {
	try {
		localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
	} catch {
		storageFailed = true;
		showStorageFailure();
	}
}

function clearResult() {
	runtime.teams = [];
	runtime.resultError = '';
	runtime.resultMessage = '';
	runtime.winnerTeamId = null;
	runtime.lastHistoryId = null;
	runtime.picks = {};
}

function saveAndRender({ clearTeams = true } = {}) {
	if (clearTeams) clearResult();
	persist();
	render();
}

function createRemoveButton(label, dataset = {}) {
	const button = document.createElement('button');
	button.type = 'button';
	button.className = 'remove-row-button';
	button.setAttribute('aria-label', label);
	button.textContent = '×';
	Object.assign(button.dataset, dataset);
	return button;
}

function duplicateCount() {
	const counts = new Map();
	for (const participant of state.participants) {
		counts.set(participant.name, (counts.get(participant.name) || 0) + 1);
	}
	return [...counts.values()].reduce((sum, count) => sum + Math.max(0, count - 1), 0);
}

function renderParticipants() {
	const list = $('#participant-list');
	list.replaceChildren();
	const includedCount = state.participants.filter((participant) => participant.included).length;
	$('#participant-count').textContent = `(전체 ${state.participants.length}명 · 참가 ${includedCount}명)`;
	$('#participant-empty').hidden = state.participants.length > 0;
	$('#toggle-all-button').disabled = state.participants.length === 0;
	$('#toggle-all-button').textContent =
		state.participants.length > 0 && includedCount === state.participants.length ? '전체 해제' : '전체 선택';
	$('#clear-list-button').hidden = state.participants.length === 0;

	for (const [index, participant] of state.participants.entries()) {
		const row = document.createElement('li');
		row.className = 'participant-row';
		row.dataset.included = String(participant.included);

		const checkbox = document.createElement('input');
		checkbox.type = 'checkbox';
		checkbox.checked = participant.included;
		checkbox.dataset.participantToggle = participant.id;
		checkbox.setAttribute('aria-label', `${participant.name} 참가 ${participant.included ? '해제' : '선택'}`);

		const number = document.createElement('span');
		number.className = 'participant-number';
		number.setAttribute('aria-hidden', 'true');
		number.textContent = String(index + 1);

		const input = document.createElement('input');
		input.type = 'text';
		input.className = 'participant-name';
		input.value = participant.name;
		input.dataset.participantName = participant.id;
		input.setAttribute('aria-label', `${index + 1}번째 참가자 이름`);

		row.append(checkbox, number, input, createRemoveButton(`${participant.name} 삭제`, { participantRemove: participant.id }));
		list.append(row);
	}

	const notice = $('#participant-notice');
	const duplicates = duplicateCount();
	if (state.participants.length > 0 && includedCount === 0) {
		notice.textContent = '체크한 참가자가 없습니다. 팀에 넣을 사람을 체크해 주세요.';
		notice.dataset.tone = 'error';
		notice.hidden = false;
	} else if (includedCount === 1) {
		notice.textContent = '체크한 참가자가 한 명입니다. 팀을 나누려면 두 명 이상 필요합니다.';
		notice.dataset.tone = 'error';
		notice.hidden = false;
	} else if (duplicates > 0) {
		notice.textContent = '같은 이름이 2개 이상 있습니다. 그대로 각각 한 명으로 셉니다.';
		notice.dataset.tone = 'warning';
		notice.hidden = false;
	} else {
		notice.hidden = true;
	}

	$('#add-together-rule').disabled = includedCount < 2;
	$('#add-apart-rule').disabled = includedCount < 2;
}

function participantName(id) {
	return state.participants.find((participant) => participant.id === id)?.name || '삭제된 참가자';
}

function renderRules() {
	const list = $('#rules-list');
	list.replaceChildren();
	$('#rules-empty').hidden = state.rules.length > 0;

	for (const rule of state.rules) {
		const row = document.createElement('li');
		row.className = 'rule-row';

		const chip = document.createElement('span');
		chip.className = `rule-chip ${rule.type}`;
		chip.textContent = rule.type === 'together' ? '같은 팀' : '다른 팀';

		const names = document.createElement('span');
		names.className = 'rule-names';
		names.textContent = rule.participantIds.map(participantName).join(rule.type === 'together' ? ' · ' : ' ↔ ');

		row.append(chip, names, createRemoveButton('배정 규칙 삭제', { ruleRemove: rule.id }));
		list.append(row);
	}
}

function currentSetup() {
	return getSetupStatus({
		mode: state.mode,
		teamCount: state.teamCount,
		teamSize: state.teamSize,
		participantCount: state.participants.filter((participant) => participant.included).length
	});
}

function renderSettings() {
	const teamMode = state.mode === TEAM_MODE;
	$('#team-mode-button').setAttribute('aria-checked', String(teamMode));
	$('#size-mode-button').setAttribute('aria-checked', String(!teamMode));
	$('#split-value-label').textContent = teamMode ? '팀 수' : '팀당 인원';
	$('#split-value-description').textContent = teamMode ? '만들 팀의 수를 정해 주세요.' : '한 팀에 들어갈 인원을 정해 주세요.';
	$('#split-unit').textContent = teamMode ? '개' : '명';
	const input = $('#split-value');
	input.min = teamMode ? '2' : '1';
	input.max = '20';
	input.value = String(teamMode ? state.teamCount : state.teamSize);

	const setup = currentSetup();
	const hint = $('#setup-hint');
	hint.textContent = setup.reason;
	hint.dataset.tone = setup.disabled ? 'error' : 'ready';
	$('#make-teams-button').disabled = setup.disabled;
}

function teamTone(index) {
	return teamTones[index % teamTones.length];
}

function renderResults() {
	const grid = $('#team-grid');
	grid.replaceChildren();
	const hasTeams = runtime.teams.length > 0;
	$('.result-actions').hidden = !hasTeams;
	$('#undo-win-button').hidden = runtime.winnerTeamId === null || !runtime.lastHistoryId;

	const empty = $('#result-empty');
	empty.hidden = hasTeams;
	if (!hasTeams) {
		const title = empty.querySelector('strong');
		const description = empty.querySelector('span');
		if (runtime.resultError) {
			empty.dataset.tone = 'error';
			title.textContent = '팀을 만들지 못했습니다';
			description.textContent = runtime.resultError;
		} else {
			delete empty.dataset.tone;
			title.textContent = '아직 만든 팀이 없습니다';
			description.textContent = '참가자를 추가하고 팀 만들기를 눌러 주세요.';
		}
	}

	for (const [index, team] of runtime.teams.entries()) {
		const tone = teamTone(index);
		const card = document.createElement('article');
		card.className = 'team-card';
		card.style.setProperty('--team-color', tone.color);
		card.style.setProperty('--team-soft', tone.soft);
		card.style.setProperty('--team-line', tone.line);
		if (runtime.winnerTeamId !== null) card.dataset.result = runtime.winnerTeamId === team.id ? 'win' : 'lose';

		const heading = document.createElement('div');
		heading.className = 'team-card-heading';
		const name = document.createElement('h3');
		name.textContent = team.name;
		const count = document.createElement('span');
		count.className = 'team-count-chip';
		count.textContent = `${team.members.length}명`;
		heading.append(name, count);

		const members = document.createElement('ol');
		members.className = 'team-members';
		for (const [memberIndex, member] of team.members.entries()) {
			const item = document.createElement('li');
			const number = document.createElement('span');
			number.className = 'member-number';
			number.textContent = String(memberIndex + 1);
			const memberName = document.createElement('span');
			memberName.textContent = member.name;
			item.append(number, memberName);
			members.append(item);
		}

		const footer = document.createElement('div');
		footer.className = 'team-card-footer';
		if (runtime.winnerTeamId === null) {
			const win = document.createElement('button');
			win.type = 'button';
			win.className = 'win-button';
			win.dataset.winnerTeam = String(team.id);
			win.setAttribute('aria-label', `${team.name} 승리 기록`);
			win.textContent = '승리';
			footer.append(win);
		} else {
			const stateLabel = document.createElement('span');
			const won = runtime.winnerTeamId === team.id;
			stateLabel.className = `match-state ${won ? 'win' : 'lose'}`;
			stateLabel.textContent = won ? '승리 팀' : '패배 팀';
			footer.append(stateLabel);

			if (runtime.picks[team.id]) {
				const picked = document.createElement('div');
				picked.className = 'picked-person';
				const label = document.createElement('span');
				label.textContent = '당첨자';
				const pickedName = document.createElement('strong');
				pickedName.textContent = runtime.picks[team.id];
				picked.append(label, pickedName);
				footer.append(picked);
			}

			const draw = document.createElement('button');
			draw.type = 'button';
			draw.className = 'draw-button';
			draw.dataset.drawTeam = String(team.id);
			draw.setAttribute('aria-label', `${team.name} 참가자 추첨`);
			draw.textContent = runtime.picks[team.id] ? '다시 뽑기' : '뽑기';
			footer.append(draw);
		}

		card.append(heading, members, footer);
		grid.append(card);
	}

	$('#result-live').textContent = runtime.resultMessage;
}

function localDateKey(value) {
	const date = new Date(value);
	const year = date.getFullYear();
	const month = String(date.getMonth() + 1).padStart(2, '0');
	const day = String(date.getDate()).padStart(2, '0');
	return `${year}-${month}-${day}`;
}

function formatTime(value) {
	return new Intl.DateTimeFormat('ko-KR', { hour: '2-digit', minute: '2-digit', hour12: false }).format(new Date(value));
}

function formatDate(value) {
	return new Intl.DateTimeFormat('ko-KR', {
		year: 'numeric',
		month: 'long',
		day: 'numeric',
		weekday: 'short'
	}).format(new Date(value));
}

function winnerTeam(entry) {
	return entry.teams.find((team) => team.id === entry.winnerTeamId);
}

function renderTodayHistory() {
	const todayKey = localDateKey(new Date());
	const today = state.history.filter((entry) => localDateKey(entry.occurredAt) === todayKey);
	$('#today-history-count').textContent = `${today.length}경기`;
	$('#today-history-empty').hidden = today.length > 0;
	const list = $('#today-history-list');
	list.replaceChildren();

	for (const entry of today.slice(0, 3)) {
		const winner = winnerTeam(entry);
		const row = document.createElement('li');
		row.className = 'history-summary-row';
		const time = document.createElement('span');
		time.className = 'history-time';
		time.textContent = formatTime(entry.occurredAt);
		const chip = document.createElement('span');
		chip.className = 'history-winner-chip';
		chip.textContent = `${winner?.name || '팀'} 승`;
		const summary = document.createElement('span');
		summary.className = 'history-summary';
		summary.textContent = winner?.members.join(', ') || '';
		row.append(time, chip, summary, createRemoveButton(`${formatTime(entry.occurredAt)} 기록 삭제`, { historyRemove: entry.id }));
		list.append(row);
	}
}

function render() {
	showStorageFailure();
	renderParticipants();
	renderRules();
	renderSettings();
	renderResults();
	renderTodayHistory();
}

function addParticipants(names) {
	state.participants.push(
		...names.map((name) => ({
			id: createId('person'),
			name,
			included: true
		}))
	);
	saveAndRender();
}

function makeCurrentTeams() {
	const setup = currentSetup();
	if (setup.disabled) return;
	const included = state.participants.filter((participant) => participant.included);
	try {
		runtime.teams = makeTeams({
			participants: included,
			rules: state.rules,
			teamCount: setup.teamCount
		});
		runtime.resultError = '';
		runtime.winnerTeamId = null;
		runtime.lastHistoryId = null;
		runtime.picks = {};
		runtime.resultMessage = `${included.length}명을 ${runtime.teams.length}개 팀으로 나눴습니다.`;
	} catch (error) {
		clearResult();
		runtime.resultError = error instanceof Error ? error.message : '팀을 만들지 못했습니다. 설정을 확인해 주세요.';
		runtime.resultMessage = runtime.resultError;
	}
	renderResults();
}

function showDialog(dialog, focusSelector) {
	if (!dialog.open) dialog.showModal();
	const focusTarget = focusSelector ? dialog.querySelector(focusSelector) : null;
	setTimeout(() => (focusTarget || dialog.querySelector('button, input, textarea'))?.focus(), 0);
}

function closeDialog(dialog) {
	if (dialog.open) dialog.close();
}

function showConfirm({ title, description, actionLabel = '삭제', action }) {
	$('#confirm-title').textContent = title;
	$('#confirm-description').textContent = description;
	$('#confirm-action-button').textContent = actionLabel;
	runtime.confirmAction = action;
	showDialog($('#confirm-dialog'), '#cancel-confirm-button');
}

function renderBulkPreview() {
	const names = parseParticipantNames($('#bulk-names').value);
	$('#bulk-preview').textContent = names.length ? `빈 칸을 제외하고 ${names.length}명을 추가합니다.` : '추가할 이름을 입력해 주세요.';
	$('#bulk-add-button').disabled = names.length === 0;
}

function openRuleDialog(type) {
	runtime.ruleType = type;
	runtime.ruleSelection = new Set();
	$('#rule-dialog-title').textContent = type === 'together' ? '같은 팀 지정' : '다른 팀 지정';
	$('#rule-dialog-description').textContent =
		type === 'together'
			? '같은 팀에 넣을 참가자를 두 명 이상 골라 주세요.'
			: '서로 다른 팀에 넣을 참가자를 두 명 이상 골라 주세요.';
	renderRulePicker();
	showDialog($('#rule-dialog'), 'input');
}

function renderRulePicker() {
	const list = $('#rule-picker-list');
	list.replaceChildren();
	for (const participant of state.participants.filter((item) => item.included)) {
		const row = document.createElement('li');
		row.className = 'picker-row';
		const checkbox = document.createElement('input');
		checkbox.type = 'checkbox';
		checkbox.id = `rule-${participant.id}`;
		checkbox.checked = runtime.ruleSelection.has(participant.id);
		checkbox.dataset.rulePick = participant.id;
		const label = document.createElement('label');
		label.htmlFor = checkbox.id;
		label.textContent = participant.name;
		row.append(checkbox, label);
		list.append(row);
	}
	const count = runtime.ruleSelection.size;
	$('#rule-picker-note').textContent = count < 2 ? '두 명 이상 골라 주세요.' : `${count}명을 선택했습니다.`;
	$('#rule-picker-note').classList.toggle('error-text', count < 2);
	$('#save-rule-button').disabled = count < 2;
}

function renderRosters() {
	const list = $('#rosters-list');
	list.replaceChildren();
	$('#rosters-empty').hidden = state.rosters.length > 0;
	for (const roster of state.rosters) {
		const row = document.createElement('li');
		row.className = 'roster-row';
		const info = document.createElement('div');
		const name = document.createElement('strong');
		name.textContent = roster.name;
		const meta = document.createElement('span');
		meta.textContent = `전체 ${roster.participants.length}명 · 참가 ${roster.participants.filter((person) => person.included).length}명`;
		info.append(name, meta);
		const loadButton = document.createElement('button');
		loadButton.type = 'button';
		loadButton.className = 'roster-load-button';
		loadButton.dataset.rosterLoad = roster.id;
		loadButton.textContent = '불러오기';
		row.append(info, loadButton, createRemoveButton(`${roster.name} 저장 명단 삭제`, { rosterRemove: roster.id }));
		list.append(row);
	}
	updateRosterSaveButton();
}

function updateRosterSaveButton() {
	const hasName = $('#roster-name').value.trim().length > 0;
	$('#save-roster-button').disabled = !hasName || state.participants.length === 0;
}

function saveRoster() {
	const name = $('#roster-name').value.trim();
	if (!name || state.participants.length === 0) return;
	const existing = state.rosters.find((roster) => roster.name === name);
	const roster = {
		id: existing?.id || createId('roster'),
		name,
		participants: clone(state.participants),
		rules: clone(state.rules),
		updatedAt: new Date().toISOString()
	};
	if (existing) state.rosters[state.rosters.indexOf(existing)] = roster;
	else state.rosters.unshift(roster);
	persist();
	$('#roster-status').textContent = existing ? `${name} 명단을 현재 내용으로 덮어썼습니다.` : `${name} 명단을 저장했습니다.`;
	$('#roster-name').value = '';
	renderRosters();
}

function loadRoster(id) {
	const roster = state.rosters.find((item) => item.id === id);
	if (!roster) return;
	state.participants = clone(roster.participants);
	state.rules = clone(roster.rules);
	closeDialog($('#roster-dialog'));
	saveAndRender();
	$('#result-live').textContent = `${roster.name} 명단을 불러왔습니다.`;
}

function recordWinner(teamId) {
	if (runtime.winnerTeamId !== null) return;
	const now = new Date().toISOString();
	const entry = {
		id: createId('match'),
		occurredAt: now,
		winnerTeamId: teamId,
		teams: runtime.teams.map((team) => ({
			id: team.id,
			name: team.name,
			members: team.members.map((member) => member.name)
		}))
	};
	state.history.unshift(entry);
	runtime.winnerTeamId = teamId;
	runtime.lastHistoryId = entry.id;
	runtime.picks = {};
	persist();
	runtime.resultMessage = `${runtime.teams.find((team) => team.id === teamId)?.name || '팀'}의 승리를 기록했습니다.`;
	renderResults();
	renderTodayHistory();
}

function undoWinner() {
	if (!runtime.lastHistoryId) return;
	state.history = state.history.filter((entry) => entry.id !== runtime.lastHistoryId);
	runtime.winnerTeamId = null;
	runtime.lastHistoryId = null;
	runtime.picks = {};
	runtime.resultMessage = '방금 기록한 승리를 취소했습니다.';
	persist();
	renderResults();
	renderTodayHistory();
}

function deleteHistory(id) {
	const entry = state.history.find((item) => item.id === id);
	if (!entry) return;
	showConfirm({
		title: '기록을 삭제하시겠습니까?',
		description: `${formatDate(entry.occurredAt)} ${formatTime(entry.occurredAt)} 기록만 삭제합니다.`,
		action: () => {
			state.history = state.history.filter((item) => item.id !== id);
			if (runtime.lastHistoryId === id) {
				runtime.winnerTeamId = null;
				runtime.lastHistoryId = null;
				runtime.picks = {};
			}
			persist();
			renderResults();
			renderTodayHistory();
			renderHistoryDialog();
		}
	});
}

function renderHistoryDialog() {
	const container = $('#history-groups');
	container.replaceChildren();
	$('#history-empty').hidden = state.history.length > 0;
	const groups = new Map();
	for (const entry of state.history) {
		const key = localDateKey(entry.occurredAt);
		if (!groups.has(key)) groups.set(key, []);
		groups.get(key).push(entry);
	}

	for (const entries of groups.values()) {
		const section = document.createElement('section');
		const heading = document.createElement('div');
		heading.className = 'history-date-heading';
		const title = document.createElement('h3');
		title.textContent = formatDate(entries[0].occurredAt);
		const count = document.createElement('span');
		count.textContent = `${entries.length}경기`;
		heading.append(title, count);

		const list = document.createElement('ul');
		list.className = 'history-match-list';
		for (const entry of entries) {
			const item = document.createElement('li');
			item.className = 'history-match';
			const time = document.createElement('span');
			time.className = 'history-time';
			time.textContent = formatTime(entry.occurredAt);
			const teams = document.createElement('div');
			teams.className = 'history-teams';
			for (const team of entry.teams) {
				const line = document.createElement('div');
				line.className = 'history-team-line';
				line.dataset.win = String(team.id === entry.winnerTeamId);
				const label = document.createElement('strong');
				label.textContent = `${team.name} ${team.id === entry.winnerTeamId ? '승' : '패'}`;
				const names = document.createElement('span');
				names.textContent = team.members.join(', ');
				line.append(label, names);
				teams.append(line);
			}
			item.append(time, teams, createRemoveButton(`${formatTime(entry.occurredAt)} 기록 삭제`, { historyRemove: entry.id }));
			list.append(item);
		}
		section.append(heading, list);
		container.append(section);
	}
}

function openWheel(teamId) {
	const team = runtime.teams.find((item) => item.id === teamId);
	if (!team || runtime.winnerTeamId === null) return;
	runtime.wheelTeamId = teamId;
	runtime.wheelSpinning = false;
	$('#wheel-title').textContent = `${team.name} 돌림판`;
	const gradient = team.members
		.map((_, index) => {
			const start = (index / team.members.length) * 100;
			const end = ((index + 1) / team.members.length) * 100;
			return `${wheelColors[index % wheelColors.length]} ${start}% ${end}%`;
		})
		.join(', ');
	$('#wheel').style.setProperty('--wheel-gradient', `conic-gradient(${gradient})`);
	const legend = $('#wheel-legend');
	legend.replaceChildren();
	for (const [index, member] of team.members.entries()) {
		const item = document.createElement('li');
		const marker = document.createElement('i');
		marker.style.setProperty('--legend-color', wheelColors[index % wheelColors.length]);
		const name = document.createElement('span');
		name.textContent = member.name;
		item.append(marker, name);
		legend.append(item);
	}
	const previous = runtime.picks[teamId];
	const result = $('#wheel-result');
	result.textContent = previous ? `현재 당첨자는 ${previous}입니다.` : '돌리기를 누르면 당첨자를 뽑습니다.';
	result.dataset.picked = String(Boolean(previous));
	$('#spin-wheel-button').textContent = previous ? '다시 뽑기' : '돌리기';
	renderSoundButton();
	showDialog($('#wheel-dialog'), '#spin-wheel-button');
}

function renderSoundButton() {
	const button = $('#sound-toggle-button');
	button.setAttribute('aria-pressed', String(state.soundEnabled));
	button.setAttribute('aria-label', state.soundEnabled ? '효과음 끄기' : '효과음 켜기');
	button.title = state.soundEnabled ? '효과음 끄기' : '효과음 켜기';
}

function playSound() {
	if (!state.soundEnabled) return;
	try {
		const AudioContext = window.AudioContext || window.webkitAudioContext;
		if (!AudioContext) return;
		const context = new AudioContext();
		const oscillator = context.createOscillator();
		const gain = context.createGain();
		oscillator.frequency.value = 620;
		gain.gain.setValueAtTime(0.06, context.currentTime);
		gain.gain.exponentialRampToValueAtTime(0.001, context.currentTime + 0.16);
		oscillator.connect(gain);
		gain.connect(context.destination);
		oscillator.start();
		oscillator.stop(context.currentTime + 0.16);
		oscillator.addEventListener('ended', () => context.close());
	} catch {
		// 효과음을 재생하지 못해도 추첨은 계속한다.
	}
}

function spinWheel() {
	if (runtime.wheelSpinning) return;
	const team = runtime.teams.find((item) => item.id === runtime.wheelTeamId);
	if (!team?.members.length) return;
	runtime.wheelSpinning = true;
	const button = $('#spin-wheel-button');
	button.disabled = true;
	button.textContent = '돌리는 중…';
	const result = $('#wheel-result');
	result.textContent = '당첨자를 뽑고 있습니다.';
	result.dataset.picked = 'false';
	runtime.wheelRotation += 1440 + Math.floor(Math.random() * 360);
	$('#wheel').style.transform = `rotate(${runtime.wheelRotation}deg)`;

	setTimeout(() => {
		if (!$('#wheel-dialog').open) {
			runtime.wheelSpinning = false;
			return;
		}
		const picked = team.members[Math.floor(Math.random() * team.members.length)];
		runtime.picks[team.id] = picked.name;
		runtime.wheelSpinning = false;
		button.disabled = false;
		button.textContent = '다시 뽑기';
		result.textContent = `당첨자는 ${picked.name}입니다.`;
		result.dataset.picked = 'true';
		playSound();
		renderResults();
	}, 950);
}

$('#add-person-form').addEventListener('submit', (event) => {
	event.preventDefault();
	const input = $('#person-name');
	const name = input.value.trim();
	if (!name) {
		input.focus();
		return;
	}
	addParticipants([name]);
	input.value = '';
	input.focus();
});

$('#open-bulk-button').addEventListener('click', () => {
	$('#bulk-names').value = '';
	renderBulkPreview();
	showDialog($('#bulk-dialog'), '#bulk-names');
});

$('#bulk-names').addEventListener('input', renderBulkPreview);
$('#bulk-add-button').addEventListener('click', () => {
	const names = parseParticipantNames($('#bulk-names').value);
	if (!names.length) return;
	closeDialog($('#bulk-dialog'));
	addParticipants(names);
});

$('#toggle-all-button').addEventListener('click', () => {
	const allIncluded = state.participants.every((participant) => participant.included);
	state.participants.forEach((participant) => {
		participant.included = !allIncluded;
	});
	saveAndRender();
});

$('#participant-list').addEventListener('change', (event) => {
	const toggleId = event.target.dataset.participantToggle;
	const nameId = event.target.dataset.participantName;
	if (toggleId) {
		const participant = state.participants.find((item) => item.id === toggleId);
		if (participant) participant.included = event.target.checked;
		saveAndRender();
	}
	if (nameId) {
		const participant = state.participants.find((item) => item.id === nameId);
		const name = event.target.value.trim();
		if (!participant) return;
		if (!name) {
			event.target.value = participant.name;
			$('#result-live').textContent = '참가자 이름은 비울 수 없습니다.';
			return;
		}
		participant.name = name;
		saveAndRender();
	}
});

$('#participant-list').addEventListener('click', (event) => {
	const id = event.target.dataset.participantRemove;
	if (!id) return;
	state.participants = state.participants.filter((participant) => participant.id !== id);
	state.rules = cleanRulesAfterParticipantRemoval(state.rules, new Set(state.participants.map((participant) => participant.id)));
	saveAndRender();
});

$('#clear-list-button').addEventListener('click', () => {
	showConfirm({
		title: '정말 명단을 비우시겠습니까?',
		description: '현재 참가자, 배정 규칙과 팀 결과만 지웁니다. 저장 명단과 승패 기록은 남습니다.',
		actionLabel: '비우기',
		action: () => {
			state.participants = [];
			state.rules = [];
			saveAndRender();
		}
	});
});

$('#add-together-rule').addEventListener('click', () => openRuleDialog('together'));
$('#add-apart-rule').addEventListener('click', () => openRuleDialog('apart'));
$('#rule-picker-list').addEventListener('change', (event) => {
	const id = event.target.dataset.rulePick;
	if (!id) return;
	if (event.target.checked) runtime.ruleSelection.add(id);
	else runtime.ruleSelection.delete(id);
	renderRulePicker();
});
$('#save-rule-button').addEventListener('click', () => {
	if (runtime.ruleSelection.size < 2) return;
	state.rules.push({
		id: createId('rule'),
		type: runtime.ruleType,
		participantIds: [...runtime.ruleSelection]
	});
	closeDialog($('#rule-dialog'));
	saveAndRender();
});
$('#rules-list').addEventListener('click', (event) => {
	const id = event.target.dataset.ruleRemove;
	if (!id) return;
	state.rules = state.rules.filter((rule) => rule.id !== id);
	saveAndRender();
});

function selectMode(mode) {
	if (state.mode === mode) return;
	state.mode = mode;
	saveAndRender();
}
$('#team-mode-button').addEventListener('click', () => selectMode(TEAM_MODE));
$('#size-mode-button').addEventListener('click', () => selectMode(SIZE_MODE));

function setSplitValue(value) {
	if (state.mode === TEAM_MODE) state.teamCount = clamp(value, 2, 20);
	else state.teamSize = clamp(value, 1, 20);
	saveAndRender();
}
$('#decrease-value').addEventListener('click', () => {
	setSplitValue((state.mode === TEAM_MODE ? state.teamCount : state.teamSize) - 1);
});
$('#increase-value').addEventListener('click', () => {
	setSplitValue((state.mode === TEAM_MODE ? state.teamCount : state.teamSize) + 1);
});
$('#split-value').addEventListener('change', (event) => {
	setSplitValue(Number.parseInt(event.target.value, 10) || (state.mode === TEAM_MODE ? 2 : 1));
});

$('#make-teams-button').addEventListener('click', makeCurrentTeams);
$('#reshuffle-button').addEventListener('click', makeCurrentTeams);
$('#undo-win-button').addEventListener('click', undoWinner);
$('#team-grid').addEventListener('click', (event) => {
	const winnerId = event.target.dataset.winnerTeam;
	const drawId = event.target.dataset.drawTeam;
	if (winnerId) recordWinner(Number(winnerId));
	if (drawId) openWheel(Number(drawId));
});

$('#open-rosters-button').addEventListener('click', () => {
	$('#roster-name').value = '';
	$('#roster-status').textContent = '같은 이름은 현재 명단으로 덮어씁니다.';
	renderRosters();
	showDialog($('#roster-dialog'), '#roster-name');
});
$('#roster-name').addEventListener('input', updateRosterSaveButton);
$('#save-roster-form').addEventListener('submit', (event) => {
	event.preventDefault();
	saveRoster();
});
$('#rosters-list').addEventListener('click', (event) => {
	const loadId = event.target.dataset.rosterLoad;
	const removeId = event.target.dataset.rosterRemove;
	if (loadId) loadRoster(loadId);
	if (removeId) {
		const roster = state.rosters.find((item) => item.id === removeId);
		if (!roster) return;
		showConfirm({
			title: '저장 명단을 삭제하시겠습니까?',
			description: `${roster.name} 저장 명단만 삭제합니다. 현재 참가자는 그대로 남습니다.`,
			action: () => {
				state.rosters = state.rosters.filter((item) => item.id !== removeId);
				persist();
				renderRosters();
			}
		});
	}
});

$('#open-history-button').addEventListener('click', () => {
	renderHistoryDialog();
	showDialog($('#history-dialog'), '.dialog-close');
});
$('#today-history-list').addEventListener('click', (event) => {
	if (event.target.dataset.historyRemove) deleteHistory(event.target.dataset.historyRemove);
});
$('#history-groups').addEventListener('click', (event) => {
	if (event.target.dataset.historyRemove) deleteHistory(event.target.dataset.historyRemove);
});

$('#sound-toggle-button').addEventListener('click', () => {
	state.soundEnabled = !state.soundEnabled;
	persist();
	renderSoundButton();
});
$('#spin-wheel-button').addEventListener('click', spinWheel);

document.addEventListener('click', (event) => {
	const closeButton = event.target.closest('[data-close-dialog]');
	if (closeButton) closeDialog(closeButton.closest('dialog'));
});

$('#cancel-confirm-button').addEventListener('click', () => closeDialog($('#confirm-dialog')));
$('#confirm-action-button').addEventListener('click', () => {
	const action = runtime.confirmAction;
	closeDialog($('#confirm-dialog'));
	runtime.confirmAction = null;
	action?.();
});
$('#confirm-dialog').addEventListener('close', () => {
	runtime.confirmAction = null;
});

showStorageFailure();
render();
