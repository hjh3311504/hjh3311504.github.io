import {
	SIZE_MODE,
	TEAM_MODE,
	calculateWheelTargetRotation,
	cleanRulesAfterParticipantRemoval,
	getSetupStatus,
	makeTeams,
	orderParticipantsForColumns,
	parseParticipantNames,
	planParticipantRemoval,
	rebalanceParticipantColumns
} from './core.js';

export function mountTeamMaker(root) {
	if (!root) throw new Error('Team Maker를 연결할 요소가 없습니다.');

	const STORAGE_KEY = 'team-maker:v1';
	const SVG_NAMESPACE = ['http:', '', 'www.w3.org', '2000', 'svg'].join('/');
	const wheelColors = [
		'#f39a8f',
		'#f7bd76',
		'#ecd772',
		'#9ed48b',
		'#74c7b4',
		'#84b5ec',
		'#b39ce4',
		'#f0a3c8'
	];
	const wheelTextColors = [
		'#7a261e',
		'#6b3d0a',
		'#665b09',
		'#285d22',
		'#14574d',
		'#204e83',
		'#4e3880',
		'#70204f'
	];
	const teamTones = [
		{ color: '#00734f', background: '#e6f7f0', border: '#a8e0cd' },
		{ color: '#1b5fbd', background: '#eaf3ff', border: '#c3ddfb' },
		{ color: '#a83209', background: '#fff2ea', border: '#ffd9c2' },
		{ color: '#a3187a', background: '#fdeef7', border: '#f7cee6' },
		{ color: '#0f6470', background: '#e6f5f7', border: '#b6e0e6' },
		{ color: '#6b6410', background: '#fbf8e0', border: '#eae3b0' }
	];

	const $ = (selector) => root.querySelector(selector);
	const clone = (value) => JSON.parse(JSON.stringify(value));
	const clamp = (value, minimum, maximum) => Math.min(maximum, Math.max(minimum, value));
	const prefersReducedMotion = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;
	const participantLayoutQuery = window.matchMedia('(max-width: 640px)');

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
			teamCount: 3,
			teamSize: 4,
			history: [],
			soundEnabled: true
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
				columnOrder: Number.isInteger(participant?.columnOrder)
					? participant.columnOrder
					: undefined,
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
			.map((entry) => ({
				id: entry.id,
				occurredAt: entry.occurredAt,
				winnerTeamId: entry.winnerTeamId,
				teams: entry.teams
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
			teamCount: clamp(Number.parseInt(value.teamCount, 10) || 3, 2, 20),
			teamSize: clamp(Number.parseInt(value.teamSize, 10) || 4, 1, 20),
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
		confirmAction: null,
		animateTeams: false,
		animateWinner: false,
		enteringParticipants: new Set(),
		leavingParticipants: new Set(),
		removingParticipantId: null,
		participantRemovalTimer: null,
		participantMovementTimer: null,
		enteringRules: new Set(),
		leavingRules: new Set(),
		enteringHistory: new Set(),
		leavingHistory: new Set(),
		celebrationTimer: null,
		spinTimer: null,
		audioContext: null,
		audioSources: new Set()
	};

	function markEntering(collection, ids, duration = 420) {
		for (const id of ids) collection.add(id);
		setTimeout(() => {
			for (const id of ids) collection.delete(id);
		}, duration);
	}

	function captureFlipPositions() {
		const positions = new Map();
		for (const element of root.querySelectorAll('[data-flip]')) {
			positions.set(element.dataset.flip, element.getBoundingClientRect());
		}
		return positions;
	}

	function playFlip(previousPositions, movementTypes) {
		if (!previousPositions?.size || prefersReducedMotion()) return 0;
		let movementDuration = 0;
		for (const element of root.querySelectorAll('[data-flip]')) {
			const previous = previousPositions.get(element.dataset.flip);
			if (!previous) continue;
			const current = element.getBoundingClientRect();
			const deltaX = previous.left - current.left;
			const deltaY = previous.top - current.top;
			if (Math.abs(deltaX) < 1 && Math.abs(deltaY) < 1) continue;
			const movementType = movementTypes?.get(element.dataset.flip) || 'layout';
			movementDuration = 300;
			if (movementTypes) {
				element.dataset.removalMovement = movementType;
			}
			element.style.transition = 'none';
			element.style.transform = `translate(${deltaX.toFixed(1)}px, ${deltaY.toFixed(1)}px)`;
			requestAnimationFrame(() => {
				element.style.transition = 'transform 300ms cubic-bezier(0.2, 0, 0.2, 1)';
				element.style.transform = '';
			});
		}
		return movementDuration;
	}

	function teamTone(teamId) {
		const index = Math.max(0, Number(teamId) - 1) % teamTones.length;
		return teamTones[index];
	}

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
		runtime.animateTeams = false;
		runtime.animateWinner = false;
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
		Object.assign(button.dataset, dataset);

		const svg = document.createElementNS(SVG_NAMESPACE, 'svg');
		svg.setAttribute('viewBox', '0 0 15 15');
		svg.setAttribute('width', '15');
		svg.setAttribute('height', '15');
		svg.setAttribute('fill', 'none');
		svg.setAttribute('aria-hidden', 'true');
		svg.setAttribute('focusable', 'false');
		const path = document.createElementNS(SVG_NAMESPACE, 'path');
		path.setAttribute('d', 'M3.75 3.75l7.5 7.5m0-7.5-7.5 7.5');
		path.setAttribute('stroke', 'currentColor');
		path.setAttribute('stroke-width', '1.8');
		path.setAttribute('stroke-linecap', 'round');
		svg.append(path);
		button.append(svg);
		return button;
	}

	function duplicateCount() {
		const counts = new Map();
		for (const participant of state.participants.filter((item) => item.included)) {
			counts.set(participant.name, (counts.get(participant.name) || 0) + 1);
		}
		return [...counts.values()].reduce((sum, count) => sum + Math.max(0, count - 1), 0);
	}

	function renderParticipants() {
		const list = $('#participant-list');
		list.replaceChildren();
		const includedCount = state.participants.filter((participant) => participant.included).length;
		const participantCount = state.participants.length;
		$('#participant-count').textContent =
			participantCount === 0
				? '(참가자 0명)'
				: includedCount === participantCount
					? `(${participantCount}명)`
					: `(${participantCount}명 중 ${includedCount}명 참가)`;
		$('#participant-empty').hidden = state.participants.length > 0;
		list.hidden = state.participants.length === 0;
		$('#toggle-all-button').hidden = state.participants.length === 0;
		$('#toggle-all-button').textContent =
			state.participants.length > 0 && includedCount === state.participants.length
				? '전체 해제'
				: '전체 선택';
		$('#clear-list-button').hidden = state.participants.length === 0;
		$('#rules-area').hidden = state.participants.length === 0;

		const displayedParticipants = participantLayoutQuery.matches
			? state.participants
			: orderParticipantsForColumns(state.participants);
		for (const [index, participant] of displayedParticipants.entries()) {
			const displayNumber = index + 1;
			const row = document.createElement('li');
			row.className = 'participant-row';
			row.dataset.flip = `participant-${participant.id}`;
			row.dataset.included = String(participant.included);
			row.classList.toggle('is-entering', runtime.enteringParticipants.has(participant.id));
			row.classList.toggle('is-leaving', runtime.leavingParticipants.has(participant.id));
			const checkbox = document.createElement('input');
			checkbox.type = 'checkbox';
			checkbox.checked = participant.included;
			checkbox.dataset.participantToggle = participant.id;
			checkbox.setAttribute(
				'aria-label',
				`${participant.name} 참가 ${participant.included ? '해제' : '선택'}`
			);

			const number = document.createElement('span');
			number.className = 'participant-number';
			number.setAttribute('aria-hidden', 'true');
			number.textContent = String(displayNumber);

			const input = document.createElement('input');
			input.type = 'text';
			input.className = 'participant-name';
			input.value = participant.name;
			input.dataset.participantName = participant.id;
			input.setAttribute('aria-label', `${displayNumber}번째 참가자 이름`);

			const removeButton = createRemoveButton(`${participant.name} 삭제`, {
				participantRemove: participant.id
			});
			removeButton.disabled = runtime.removingParticipantId !== null;
			row.append(checkbox, number, input, removeButton);
			list.append(row);
		}

		const help = $('#participant-help');
		const duplicates = duplicateCount();
		if (state.participants.length > 0 && includedCount === 0) {
			help.textContent = '체크한 참가자가 없습니다. 팀에 넣을 사람을 체크해 주세요.';
			help.dataset.tone = 'error';
		} else if (includedCount === 1) {
			help.textContent = '체크한 참가자가 한 명입니다. 팀을 나누려면 두 명 이상 필요합니다.';
			help.dataset.tone = 'error';
		} else if (duplicates > 0) {
			help.textContent = `같은 이름이 ${duplicates}개 있습니다. 그대로 각각 한 명으로 셉니다.`;
			help.dataset.tone = 'warning';
		} else {
			help.textContent =
				'이름을 적고 엔터를 누르면 아래 명단에 추가됩니다. 쉼표로 여러 명도 가능합니다.';
			delete help.dataset.tone;
		}
	}

	function participantName(id) {
		return state.participants.find((participant) => participant.id === id)?.name || '삭제된 참가자';
	}

	function renderRules() {
		const list = $('#rules-list');
		list.replaceChildren();
		list.hidden = state.rules.length === 0;
		$('#rules-empty').hidden = true;
		const togetherCount = state.rules.filter((rule) => rule.type === 'together').length;
		const apartCount = state.rules.filter((rule) => rule.type === 'apart').length;
		$('#rules-summary').textContent = state.rules.length
			? `같은 팀 ${togetherCount}개 · 다른 팀 ${apartCount}개`
			: '꼭 같은 팀이거나, 꼭 다른 팀이어야 하는 사람을 지정할 수 있습니다.';

		const orderedRules = [...state.rules].sort((first, second) => {
			return Number(first.type === 'apart') - Number(second.type === 'apart');
		});

		for (const rule of orderedRules) {
			const row = document.createElement('li');
			row.className = `rule-row ${rule.type}`;
			row.dataset.flip = `rule-${rule.id}`;
			row.classList.toggle('is-entering', runtime.enteringRules.has(rule.id));
			row.classList.toggle('is-leaving', runtime.leavingRules.has(rule.id));

			const chip = document.createElement('span');
			chip.className = `rule-chip ${rule.type}`;
			chip.textContent = rule.type === 'together' ? '같은 팀' : '다른 팀';

			const names = document.createElement('span');
			names.className = 'rule-names';
			const participantNames = rule.participantIds.map(participantName);
			const separatorText = rule.type === 'together' ? '+' : '↔';
			names.setAttribute('aria-label', participantNames.join(` ${separatorText} `));
			for (const [index, participant] of participantNames.entries()) {
				const part = document.createElement('span');
				part.className = 'rule-name-part';
				if (index > 0) {
					const separator = document.createElement('span');
					separator.className = 'rule-separator';
					separator.setAttribute('aria-hidden', 'true');
					separator.textContent = separatorText;
					part.append(separator);
				}
				const name = document.createElement('span');
				name.setAttribute('aria-hidden', 'true');
				name.textContent = participant;
				part.append(name);
				names.append(part);
			}

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
		$('.mode-switch').dataset.mode = teamMode ? 'teams' : 'size';
		$('#team-mode-button').setAttribute('aria-checked', String(teamMode));
		$('#size-mode-button').setAttribute('aria-checked', String(!teamMode));
		$('#split-value-label').textContent = teamMode ? '팀 수' : '인원 수';
		$('#split-value').textContent = String(teamMode ? state.teamCount : state.teamSize);

		const setup = currentSetup();
		const hint = $('#setup-hint');
		const participantCount = state.participants.filter(
			(participant) => participant.included
		).length;
		if (participantCount < 2) {
			hint.textContent = teamMode
				? '2개부터 20개까지 정할 수 있습니다.'
				: '1명부터 20명까지 정할 수 있습니다.';
			delete hint.dataset.tone;
		} else {
			if (teamMode && state.teamCount > participantCount) {
				hint.textContent = `팀 수를 ${participantCount}개 이하로 줄여 주세요.`;
			} else if (!teamMode && state.teamSize > participantCount) {
				hint.textContent = `인원 수를 ${participantCount}명 이하로 줄여 주세요.`;
			} else if (teamMode) {
				hint.textContent = `${participantCount}명을 ${setup.teamCount}개 팀으로 나눕니다.`;
			} else {
				hint.textContent = `${participantCount}명이면 ${setup.teamCount}개 팀이 만들어집니다.`;
			}
			if (setup.disabled) hint.dataset.tone = 'error';
			else delete hint.dataset.tone;
		}
		$('#make-teams-button').disabled = setup.disabled;
	}

	function renderResults() {
		const grid = $('#team-grid');
		grid.replaceChildren();
		const hasTeams = runtime.teams.length > 0;
		$('#make-teams-button').dataset.hasResult = String(hasTeams);
		$('.results-section').dataset.hasResult = String(hasTeams);
		grid.hidden = !hasTeams;
		$('.result-actions').hidden = !hasTeams;
		$('#undo-win-button').hidden = runtime.winnerTeamId === null || !runtime.lastHistoryId;

		const empty = $('#result-empty');
		empty.hidden = hasTeams;
		if (!hasTeams) {
			const title = empty.querySelector('strong');
			const description = empty.querySelector('.result-empty-description');
			if (runtime.resultError) {
				empty.dataset.tone = 'error';
				title.textContent = '팀을 만들지 못했습니다';
				description.textContent = runtime.resultError;
			} else {
				delete empty.dataset.tone;
				title.textContent = '아직 만든 팀이 없습니다';
				description.textContent = '팀 만들기를 누르면 팀별 명단이 나타납니다.';
			}
		}

		for (const [teamIndex, team] of runtime.teams.entries()) {
			const card = document.createElement('article');
			card.className = 'team-card';
			if (runtime.animateTeams) {
				card.classList.add('animate-team');
				card.style.setProperty('--team-delay', `${teamIndex * 90}ms`);
			}
			if (runtime.winnerTeamId !== null) {
				const won = runtime.winnerTeamId === team.id;
				card.dataset.result = won ? 'win' : 'lose';
				if (runtime.animateWinner) card.classList.add(won ? 'animate-win' : 'animate-lose');
			}

			const heading = document.createElement('div');
			heading.className = 'team-card-heading';
			const name = document.createElement('h3');
			name.textContent = team.name;
			const count = document.createElement('span');
			count.className = 'team-count-chip';
			if (runtime.winnerTeamId === null) count.textContent = `${team.members.length}명`;
			else {
				const won = runtime.winnerTeamId === team.id;
				count.textContent = `${team.name}${won ? '승' : '패'}`;
				count.dataset.result = won ? 'win' : 'lose';
				if (runtime.animateWinner) {
					count.classList.add('animate-result-chip');
					count.style.setProperty('--chip-delay', won ? '120ms' : '200ms');
				}
			}
			heading.append(name, count);

			const members = document.createElement('ol');
			members.className = 'team-members';
			for (const [memberIndex, member] of team.members.entries()) {
				const item = document.createElement('li');
				const number = document.createElement('span');
				number.className = 'member-number';
				number.textContent = String(memberIndex + 1);
				const memberName = document.createElement('span');
				memberName.className = 'member-name';
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
				draw.setAttribute('aria-label', `${team.name}에서 한 명 뽑기`);
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
		return new Intl.DateTimeFormat('ko-KR', {
			hour: '2-digit',
			minute: '2-digit',
			hour12: false
		}).format(new Date(value));
	}

	function formatDate(value) {
		return localDateKey(value).replace(/^(\d{4})-(\d{2})-(\d{2})$/, '$1년 $2월 $3일');
	}

	function winnerTeam(entry) {
		return entry.teams.find((team) => team.id === entry.winnerTeamId);
	}

	function renderTodayHistory() {
		const todayKey = localDateKey(new Date());
		const today = state.history.filter((entry) => localDateKey(entry.occurredAt) === todayKey);
		$('#history-card').hidden = today.length === 0;
		$('#today-history-count').textContent = `${today.length}경기`;
		$('#today-history-empty').hidden = today.length > 0;
		const list = $('#today-history-list');
		list.replaceChildren();

		for (const entry of today.slice(0, 3)) {
			const winner = winnerTeam(entry);
			const row = document.createElement('li');
			row.className = 'history-summary-row';
			row.dataset.flip = `today-history-${entry.id}`;
			row.classList.toggle('is-entering', runtime.enteringHistory.has(entry.id));
			row.classList.toggle('is-leaving', runtime.leavingHistory.has(entry.id));
			const time = document.createElement('span');
			time.className = 'history-time';
			time.textContent = formatTime(entry.occurredAt);
			const chip = document.createElement('span');
			chip.className = 'history-winner-chip';
			chip.textContent = `${winner?.name || '팀'}승`;
			const tone = teamTone(winner?.id || 1);
			chip.style.color = tone.color;
			chip.style.background = tone.background;
			chip.style.borderColor = tone.border;
			const summary = document.createElement('span');
			summary.className = 'history-summary';
			summary.textContent = winner?.members.join(', ') || '';
			row.append(
				time,
				chip,
				summary,
				createRemoveButton(`${formatTime(entry.occurredAt)} 기록 삭제`, { historyRemove: entry.id })
			);
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
		const added = names.map((name, index) => {
			return {
				id: createId('person'),
				name,
				included: true,
				column: (state.participants.length + index) % 2
			};
		});
		state.participants = rebalanceParticipantColumns(state.participants.concat(added));
		markEntering(
			runtime.enteringParticipants,
			added.map((participant) => participant.id)
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
			runtime.animateTeams = true;
			runtime.animateWinner = false;
			runtime.resultMessage = `${included.length}명을 ${runtime.teams.length}개 팀으로 나눴습니다.`;
		} catch (error) {
			clearResult();
			runtime.resultError =
				error instanceof Error ? error.message : '팀을 만들지 못했습니다. 설정을 확인해 주세요.';
			runtime.resultMessage = runtime.resultError;
		}
		renderResults();
		setTimeout(() => {
			runtime.animateTeams = false;
		}, 700);
	}

	function showDialog(dialog, focusSelector) {
		if (!dialog.open) dialog.showModal();
		const focusTarget = focusSelector ? dialog.querySelector(focusSelector) : null;
		setTimeout(() => (focusTarget || dialog.querySelector('button, input, textarea'))?.focus(), 0);
	}

	function cancelWheelSpin() {
		clearTimeout(runtime.spinTimer);
		runtime.spinTimer = null;
		runtime.wheelSpinning = false;
		$('#spin-wheel-button').disabled = false;
		stopSounds();
	}

	function closeDialog(dialog) {
		if (!dialog) return;
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
		$('#bulk-add-button').textContent = names.length
			? `명단에 ${names.length}명 추가`
			: '명단에 추가';
		$('#bulk-add-button').disabled = names.length === 0;
	}

	function openRuleDialog(type) {
		runtime.ruleType = type;
		runtime.ruleSelection = new Set();
		$('#rule-dialog-title').textContent =
			type === 'together' ? '같은 팀으로 지정' : '다른 팀으로 지정';
		$('#rule-dialog-description').textContent =
			type === 'together'
				? '고른 사람들은 항상 같은 팀에 배정됩니다.'
				: '고른 사람들은 서로 다른 팀에 배정됩니다.';
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
		$('#rule-picker-note').textContent = count < 2 ? '두 명 이상 골라 주세요.' : `${count}명 선택`;
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
			row.append(
				info,
				loadButton,
				createRemoveButton(`${roster.name} 저장 명단 삭제`, { rosterRemove: roster.id })
			);
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
		$('#result-live').textContent = existing
			? `${name} 명단을 현재 내용으로 덮어썼습니다.`
			: `${name} 명단을 저장했습니다.`;
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
		runtime.animateTeams = false;
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
		runtime.animateWinner = true;
		markEntering(runtime.enteringHistory, [entry.id]);
		persist();
		runtime.resultMessage = `${runtime.teams.find((team) => team.id === teamId)?.name || '팀'}의 승리를 기록했습니다.`;
		renderResults();
		renderTodayHistory();
		setTimeout(() => {
			runtime.animateWinner = false;
		}, 900);
	}

	function undoWinner() {
		if (!runtime.lastHistoryId) return;
		state.history = state.history.filter((entry) => entry.id !== runtime.lastHistoryId);
		runtime.winnerTeamId = null;
		runtime.lastHistoryId = null;
		runtime.picks = {};
		runtime.animateWinner = false;
		runtime.resultMessage = '방금 기록한 승리를 취소했습니다.';
		persist();
		renderResults();
		renderTodayHistory();
	}

	function deleteHistory(id) {
		const entry = state.history.find((item) => item.id === id);
		if (!entry) return;
		showConfirm({
			title: '삭제하시겠습니까?',
			description: `${localDateKey(entry.occurredAt)} ${formatTime(entry.occurredAt)} · ${winnerTeam(entry)?.name || '팀'}승 기록이 삭제됩니다.`,
			action: () => removeHistoryAnimated(id)
		});
	}

	function removeHistoryAnimated(id) {
		if (runtime.leavingHistory.has(id)) return;
		runtime.leavingHistory.add(id);
		renderTodayHistory();
		renderHistoryDialog();
		setTimeout(() => {
			const previousPositions = captureFlipPositions();
			state.history = state.history.filter((item) => item.id !== id);
			runtime.leavingHistory.delete(id);
			if (runtime.lastHistoryId === id) {
				runtime.winnerTeamId = null;
				runtime.lastHistoryId = null;
				runtime.picks = {};
				runtime.animateWinner = false;
			}
			persist();
			renderResults();
			renderTodayHistory();
			renderHistoryDialog();
			playFlip(previousPositions);
		}, 220);
	}

	function renderHistoryDialog() {
		const container = $('#history-groups');
		container.replaceChildren();
		$('#history-empty').hidden = state.history.length > 0;
		$('#history-description').textContent = state.history.length
			? `전체 ${state.history.length}경기`
			: '기록이 없습니다.';
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
				item.dataset.flip = `history-dialog-${entry.id}`;
				item.classList.toggle('is-leaving', runtime.leavingHistory.has(entry.id));
				const time = document.createElement('span');
				time.className = 'history-time';
				time.textContent = formatTime(entry.occurredAt);
				const teams = document.createElement('div');
				teams.className = 'history-teams';
				for (const team of entry.teams) {
					const line = document.createElement('div');
					line.className = 'history-team-line';
					line.dataset.win = String(team.id === entry.winnerTeamId);
					const won = team.id === entry.winnerTeamId;
					const label = document.createElement('span');
					label.className = 'history-team-label';
					label.textContent = `${team.name}${won ? '승' : '패'}`;
					const tone = won
						? teamTone(team.id)
						: { color: '#c2333c', background: '#fff5f5', border: '#ffd6d8' };
					label.style.setProperty('--label-color', tone.color);
					label.style.setProperty('--label-background', tone.background);
					label.style.setProperty('--label-border', tone.border);
					const names = document.createElement('span');
					names.className = 'history-team-names';
					names.textContent = team.members.join(', ');
					line.append(label, names);
					teams.append(line);
				}
				item.append(
					time,
					teams,
					createRemoveButton(`${formatTime(entry.occurredAt)} 기록 삭제`, {
						historyRemove: entry.id
					})
				);
				list.append(item);
			}
			section.append(heading, list);
			container.append(section);
		}
	}

	function openWheel(teamId) {
		const team = runtime.teams.find((item) => item.id === teamId);
		if (!team || runtime.winnerTeamId === null) return;
		getAudioContext();
		runtime.wheelTeamId = teamId;
		runtime.wheelSpinning = false;
		$('#wheel-title').textContent = `${team.name} 뽑기`;
		$('#wheel-description').textContent = '이 팀 명단 중 한 명을 무작위로 뽑습니다.';
		const gradient = team.members
			.map((_, index) => {
				const start = (index / team.members.length) * 100;
				const end = ((index + 1) / team.members.length) * 100;
				return `${wheelColors[index % wheelColors.length]} ${start}% ${end}%`;
			})
			.join(', ');
		$('#wheel').style.setProperty('--wheel-gradient', `conic-gradient(${gradient})`);
		const wheel = $('#wheel');
		wheel.replaceChildren();
		for (const [index, member] of team.members.entries()) {
			const label = document.createElement('span');
			const angle = (index * 360) / team.members.length + 180 / team.members.length;
			label.className = 'wheel-label';
			label.textContent = member.name;
			label.style.color = wheelTextColors[index % wheelTextColors.length];
			label.dataset.angle = String(angle);
			label.style.setProperty('--label-angle', `${angle}deg`);
			label.style.setProperty('--label-counter-angle', `${-(angle + runtime.wheelRotation)}deg`);
			wheel.append(label);
		}
		wheel.style.transform = `rotate(${runtime.wheelRotation}deg)`;
		const previous = runtime.picks[teamId];
		const result = $('#wheel-result');
		result.textContent = previous ? `당첨자 · ${previous}` : '돌리기를 누르세요.';
		result.dataset.picked = String(Boolean(previous));
		const spinButton = $('#spin-wheel-button');
		spinButton.disabled = false;
		spinButton.textContent = previous ? '다시 뽑기' : '돌리기';
		renderSoundButton();
		showDialog($('#wheel-dialog'), '#spin-wheel-button');
	}

	function renderSoundButton() {
		const button = $('#sound-toggle-button');
		button.setAttribute('aria-pressed', String(state.soundEnabled));
		button.setAttribute('aria-label', state.soundEnabled ? '효과음 끄기' : '효과음 켜기');
		button.title = state.soundEnabled ? '효과음 끄기' : '효과음 켜기';
		$('#sound-wave-path').setAttribute(
			'd',
			state.soundEnabled ? 'M15.5 8.5a5 5 0 0 1 0 7' : 'M22 9l-6 6M16 9l6 6'
		);
	}

	function getAudioContext() {
		if (!state.soundEnabled) return null;
		try {
			const AudioContext = window.AudioContext || window.webkitAudioContext;
			if (!AudioContext) return null;
			if (!runtime.audioContext || runtime.audioContext.state === 'closed') {
				runtime.audioContext = new AudioContext();
			}
			if (runtime.audioContext.state === 'suspended') {
				runtime.audioContext.resume().catch(() => {});
			}
			return runtime.audioContext;
		} catch {
			return null;
		}
	}

	function trackAudioSource(source) {
		runtime.audioSources.add(source);
		source.addEventListener(
			'ended',
			() => {
				runtime.audioSources.delete(source);
			},
			{ once: true }
		);
	}

	function stopSounds() {
		for (const source of runtime.audioSources) {
			try {
				source.stop();
			} catch {
				// 이미 끝난 효과음은 무시한다.
			}
		}
		runtime.audioSources.clear();
	}

	function playSpinTicks(totalDegrees, segmentDegrees, durationMilliseconds) {
		const context = getAudioContext();
		if (!context) return;
		const duration = durationMilliseconds / 1000;
		const startTime = context.currentTime;
		const startFrequency = 1420;
		const ratchetDegrees = Math.min(segmentDegrees, 120);
		const count = Math.min(Math.max(Math.floor(totalDegrees / ratchetDegrees) * 2, 50), 66);
		const tickDuration = Math.max(0.1, duration);
		const rapidTickCount = Math.min(Math.round(count * 0.56), count - 1);
		const rapidDuration = Math.min(0.87, tickDuration * 0.24);
		const slowTickCount = count - rapidTickCount;

		for (let index = 0; index < count - 1; index += 1) {
			const isFirstTick = index === 0;
			const progress = count === 1 ? 0 : index / (count - 1);
			let offset;
			if (index < rapidTickCount) {
				offset = rapidDuration * (index / (rapidTickCount - 1));
			} else {
				const slowProgress = (index - rapidTickCount + 1) / slowTickCount;
				const slowCurve = 0.1 * slowProgress + 0.9 * slowProgress ** 3.5;
				offset = rapidDuration + (tickDuration - rapidDuration) * slowCurve;
			}
			const time = startTime + offset;
			const oscillator = context.createOscillator();
			const gain = context.createGain();
			const frequency = startFrequency - 620 * progress;
			const peak = 0.24 + 0.04 * progress;
			const decayDuration = 0.09;
			oscillator.type = 'square';
			oscillator.frequency.setValueAtTime(frequency, time);
			if (isFirstTick) {
				gain.gain.setValueAtTime(peak, time);
			} else {
				gain.gain.setValueAtTime(0.0001, time);
				gain.gain.exponentialRampToValueAtTime(peak, time + 0.003);
			}
			gain.gain.exponentialRampToValueAtTime(0.0001, time + decayDuration);
			oscillator.connect(gain).connect(context.destination);
			if (isFirstTick) oscillator.start();
			else oscillator.start(time);
			oscillator.stop(time + decayDuration + 0.02);
			trackAudioSource(oscillator);
		}
	}

	function playFanfare() {
		const context = getAudioContext();
		if (!context) return;
		const startTime = context.currentTime + 0.03;
		const motif = [
			{ frequency: 523.25, offset: 0, duration: 0.16 },
			{ frequency: 659.25, offset: 0.11, duration: 0.16 },
			{ frequency: 783.99, offset: 0.22, duration: 0.16 },
			{ frequency: 1046.5, offset: 0.34, duration: 0.75 }
		];

		for (const [noteIndex, note] of motif.entries()) {
			const noteStart = startTime + note.offset;
			const peak = noteIndex === motif.length - 1 ? 0.18 : 0.13;
			for (const [harmonicIndex, multiplier] of [1, 2].entries()) {
				const oscillator = context.createOscillator();
				const gain = context.createGain();
				oscillator.type = 'triangle';
				oscillator.frequency.value = note.frequency * multiplier;
				gain.gain.setValueAtTime(0.0001, noteStart);
				gain.gain.exponentialRampToValueAtTime(peak / (harmonicIndex + 1.2), noteStart + 0.015);
				gain.gain.exponentialRampToValueAtTime(0.0001, noteStart + note.duration);
				oscillator.connect(gain).connect(context.destination);
				oscillator.start(noteStart);
				oscillator.stop(noteStart + note.duration + 0.05);
				trackAudioSource(oscillator);
			}
		}

		for (const [index, frequency] of [1046.5, 1318.51, 1567.98].entries()) {
			const oscillator = context.createOscillator();
			const gain = context.createGain();
			const chordStart = startTime + 0.34;
			oscillator.type = 'sine';
			oscillator.frequency.value = frequency;
			gain.gain.setValueAtTime(0.0001, chordStart);
			gain.gain.exponentialRampToValueAtTime(0.09 / (index + 1), chordStart + 0.03);
			gain.gain.exponentialRampToValueAtTime(0.0001, chordStart + 1.1);
			oscillator.connect(gain).connect(context.destination);
			oscillator.start(chordStart);
			oscillator.stop(chordStart + 1.2);
			trackAudioSource(oscillator);
		}

		for (const [index, frequency] of [1568, 2093, 2637].entries()) {
			const oscillator = context.createOscillator();
			const gain = context.createGain();
			const bellStart = startTime + 0.5 + index * 0.09;
			oscillator.type = 'sine';
			oscillator.frequency.value = frequency;
			gain.gain.setValueAtTime(0.0001, bellStart);
			gain.gain.exponentialRampToValueAtTime(0.05, bellStart + 0.01);
			gain.gain.exponentialRampToValueAtTime(0.0001, bellStart + 0.5);
			oscillator.connect(gain).connect(context.destination);
			oscillator.start(bellStart);
			oscillator.stop(bellStart + 0.55);
			trackAudioSource(oscillator);
		}
	}

	function celebrate() {
		if (prefersReducedMotion()) return;
		const layer = $('#celebration-layer');
		const colors = ['#6e29e7', '#ff571a', '#009f70', '#3b6fe0', '#f2a20c'];
		const particles = document.createDocumentFragment();
		for (let index = 0; index < 160; index += 1) {
			const particle = document.createElement('span');
			const angle = Math.random() * Math.PI * 2;
			const distance = 140 + Math.random() * 300;
			const size = 8 + Math.random() * 12;
			particle.className = 'celebration-particle';
			particle.style.width = `${size.toFixed(1)}px`;
			particle.style.height = `${(size * (Math.random() < 0.4 ? 1 : 0.45)).toFixed(1)}px`;
			particle.style.background = colors[index % colors.length];
			particle.style.borderRadius = Math.random() < 0.3 ? '50%' : '2px';
			particle.style.setProperty('--dx', `${(Math.cos(angle) * distance).toFixed(1)}px`);
			particle.style.setProperty('--dy', `${(Math.sin(angle) * distance + 110).toFixed(1)}px`);
			particle.style.setProperty('--rot', `${Math.round(Math.random() * 720 - 360)}deg`);
			particle.style.setProperty('--duration', `${Math.round(1100 + Math.random() * 800)}ms`);
			particle.style.setProperty('--delay', `${Math.round(Math.random() * 180)}ms`);
			particles.append(particle);
		}
		layer.replaceChildren(particles);
		layer.hidden = false;
		clearTimeout(runtime.celebrationTimer);
		runtime.celebrationTimer = setTimeout(() => {
			layer.replaceChildren();
			layer.hidden = true;
		}, 2300);
	}

	function spinWheel() {
		if (runtime.wheelSpinning) return;
		const team = runtime.teams.find((item) => item.id === runtime.wheelTeamId);
		if (!team?.members.length) return;
		const pickedIndex = Math.floor(Math.random() * team.members.length);
		const segmentDegrees = 360 / team.members.length;
		const previousRotation = runtime.wheelRotation;
		const targetRotation = calculateWheelTargetRotation(
			previousRotation,
			team.members.length,
			pickedIndex
		);
		runtime.wheelSpinning = true;
		const button = $('#spin-wheel-button');
		button.disabled = true;
		button.textContent = '돌리는 중…';
		const result = $('#wheel-result');
		result.textContent = '돌리는 중…';
		result.dataset.picked = 'false';
		runtime.wheelRotation = targetRotation;
		const wheel = $('#wheel');
		wheel.style.transform = `rotate(${runtime.wheelRotation}deg)`;
		for (const label of wheel.querySelectorAll('.wheel-label')) {
			const angle = Number(label.dataset.angle);
			label.style.setProperty('--label-counter-angle', `${-(angle + runtime.wheelRotation)}deg`);
		}
		stopSounds();
		playSpinTicks(targetRotation - previousRotation, segmentDegrees, 6500);

		clearTimeout(runtime.spinTimer);
		runtime.spinTimer = setTimeout(() => {
			runtime.spinTimer = null;
			if (!$('#wheel-dialog').open) {
				cancelWheelSpin();
				return;
			}
			const picked = team.members[pickedIndex];
			runtime.picks[team.id] = picked.name;
			runtime.wheelSpinning = false;
			button.disabled = false;
			button.textContent = '다시 뽑기';
			result.textContent = `당첨자 · ${picked.name}`;
			result.dataset.picked = 'true';
			result.classList.remove('animate-pop');
			void result.offsetWidth;
			result.classList.add('animate-pop');
			playFanfare();
			celebrate();
			renderResults();
		}, 6600);
	}

	$('#add-person-form').addEventListener('submit', (event) => {
		event.preventDefault();
		const input = $('#person-name');
		const names = parseParticipantNames(input.value);
		if (!names.length) {
			input.focus();
			return;
		}
		addParticipants(names);
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
		const id = event.target.closest('[data-participant-remove]')?.dataset.participantRemove;
		if (!id || runtime.removingParticipantId !== null) return;
		const initialPlan = planParticipantRemoval(state.participants, id);
		if (!initialPlan) return;
		runtime.removingParticipantId = id;
		runtime.leavingParticipants.add(id);
		renderParticipants();
		runtime.participantRemovalTimer = setTimeout(() => {
			runtime.participantRemovalTimer = null;
			const previousPositions = captureFlipPositions();
			const plan = planParticipantRemoval(state.participants, id);
			if (!plan) {
				runtime.leavingParticipants.delete(id);
				runtime.removingParticipantId = null;
				renderParticipants();
				return;
			}
			state.participants = plan.nextParticipants;
			state.rules = cleanRulesAfterParticipantRemoval(
				state.rules,
				new Set(state.participants.map((participant) => participant.id))
			);
			runtime.leavingParticipants.delete(id);
			saveAndRender();
			const movementTypes = new Map(
				plan.shiftingParticipantIds.map((participantId) => [
					`participant-${participantId}`,
					'shift'
				])
			);
			if (plan.crossingParticipantId) {
				movementTypes.set(`participant-${plan.crossingParticipantId}`, 'cross');
			}
			const movementDuration = playFlip(previousPositions, movementTypes);
			const finishRemoval = () => {
				runtime.participantMovementTimer = null;
				runtime.removingParticipantId = null;
				for (const row of root.querySelectorAll('[data-removal-movement]')) {
					delete row.dataset.removalMovement;
					row.style.removeProperty('transition');
					row.style.removeProperty('transform');
				}
				for (const button of root.querySelectorAll('[data-participant-remove]')) {
					button.disabled = false;
				}
			};
			if (movementDuration) {
				runtime.participantMovementTimer = setTimeout(finishRemoval, movementDuration + 20);
			} else finishRemoval();
		}, 220);
	});

	$('#clear-list-button').addEventListener('click', () => {
		showConfirm({
			title: '정말 비우시겠습니까?',
			description: `명단에 있는 ${state.participants.length}명이 모두 지워집니다. 저장한 명단은 그대로 남습니다.`,
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
		const previousPositions = captureFlipPositions();
		const rule = {
			id: createId('rule'),
			type: runtime.ruleType,
			participantIds: [...runtime.ruleSelection]
		};
		state.rules.push(rule);
		markEntering(runtime.enteringRules, [rule.id]);
		closeDialog($('#rule-dialog'));
		saveAndRender();
		playFlip(previousPositions);
	});
	$('#rules-list').addEventListener('click', (event) => {
		const id = event.target.closest('[data-rule-remove]')?.dataset.ruleRemove;
		if (!id || runtime.leavingRules.has(id)) return;
		runtime.leavingRules.add(id);
		renderRules();
		setTimeout(() => {
			const previousPositions = captureFlipPositions();
			state.rules = state.rules.filter((rule) => rule.id !== id);
			runtime.leavingRules.delete(id);
			saveAndRender();
			playFlip(previousPositions);
		}, 220);
	});

	function selectMode(mode) {
		if (state.mode === mode) return;
		state.mode = mode;
		saveAndRender({ clearTeams: false });
	}
	$('#team-mode-button').addEventListener('click', () => selectMode(TEAM_MODE));
	$('#size-mode-button').addEventListener('click', () => selectMode(SIZE_MODE));
	const handleParticipantLayoutChange = () => renderParticipants();
	participantLayoutQuery.addEventListener('change', handleParticipantLayoutChange);

	function setSplitValue(value) {
		if (state.mode === TEAM_MODE) state.teamCount = clamp(value, 2, 20);
		else state.teamSize = clamp(value, 1, 20);
		saveAndRender({ clearTeams: false });
	}
	$('#decrease-value').addEventListener('click', () => {
		setSplitValue((state.mode === TEAM_MODE ? state.teamCount : state.teamSize) - 1);
	});
	$('#increase-value').addEventListener('click', () => {
		setSplitValue((state.mode === TEAM_MODE ? state.teamCount : state.teamSize) + 1);
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
		renderRosters();
		showDialog($('#roster-dialog'), '#roster-name');
	});
	$('#roster-name').addEventListener('input', updateRosterSaveButton);
	$('#save-roster-form').addEventListener('submit', (event) => {
		event.preventDefault();
		saveRoster();
	});
	$('#rosters-list').addEventListener('click', (event) => {
		const loadId = event.target.closest('[data-roster-load]')?.dataset.rosterLoad;
		const removeId = event.target.closest('[data-roster-remove]')?.dataset.rosterRemove;
		if (loadId) loadRoster(loadId);
		if (removeId) {
			const roster = state.rosters.find((item) => item.id === removeId);
			if (!roster) return;
			showConfirm({
				title: '삭제하시겠습니까?',
				description: `저장한 명단 "${roster.name}"(${roster.participants.length}명)이 삭제됩니다.`,
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
		const id = event.target.closest('[data-history-remove]')?.dataset.historyRemove;
		if (id) deleteHistory(id);
	});
	$('#history-groups').addEventListener('click', (event) => {
		const id = event.target.closest('[data-history-remove]')?.dataset.historyRemove;
		if (id) deleteHistory(id);
	});

	$('#sound-toggle-button').addEventListener('click', () => {
		state.soundEnabled = !state.soundEnabled;
		if (state.soundEnabled) getAudioContext();
		else stopSounds();
		persist();
		renderSoundButton();
	});
	$('#spin-wheel-button').addEventListener('click', spinWheel);

	root.addEventListener('click', (event) => {
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
	$('#wheel-dialog').addEventListener('close', cancelWheelSpin);

	showStorageFailure();
	render();

	return () => {
		cancelWheelSpin();
		participantLayoutQuery.removeEventListener('change', handleParticipantLayoutChange);
		clearTimeout(runtime.celebrationTimer);
		clearTimeout(runtime.participantRemovalTimer);
		clearTimeout(runtime.participantMovementTimer);
		try {
			runtime.audioContext?.close?.();
		} catch {
			// 이미 닫힌 AudioContext는 무시한다.
		}
	};
}
