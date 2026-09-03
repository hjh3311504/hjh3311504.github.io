import {
	SIZE_MODE,
	TEAM_MODE,
	WHEEL_SPIN_DURATION,
	WHEEL_SPIN_EASING,
	WHEEL_SPIN_SETTLE,
	appendTeamRank,
	calculateWheelTargetRotation,
	cleanRulesAfterParticipantRemoval,
	formatTeamResultLabel,
	formatTeamsText,
	getSetupStatus,
	localDateKey,
	makeTeams,
	orderParticipantsForColumns,
	parseParticipantNames,
	planParticipantRemoval,
	rankOfTeam,
	rebalanceParticipantColumns,
	removeLastTeamRank,
	resolveTeamRanking,
	selectTodayHistory,
	summarizeParticipantStats
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
			teamSize: clamp(Number.parseInt(value.teamSize, 10) || 4, 1, 20),
			history: cleanHistory(value.history),
			soundEnabled: value.soundEnabled !== false,
			todayClearedAt: typeof value.todayClearedAt === 'string' ? value.todayClearedAt : null
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
		ranking: [],
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
		wheelRedrawTimer: null,
		copyResetTimer: null,
		audioContext: null,
		audioSources: new Set()
	};

	const currentTeamIds = () => runtime.teams.map((team) => team.id);
	const rankOf = (teamId) => rankOfTeam(runtime.ranking, teamId);
	const currentEntry = () =>
		state.history.find((entry) => entry.id === runtime.lastHistoryId) ?? null;
	const placeOf = (rank) => {
		if (rank === null) return 'none';
		if (rank === 1) return 'first';
		return rank === runtime.teams.length ? 'last' : 'middle';
	};
	const remainingMembers = (team) => {
		const picked = new Set((runtime.picks[team.id] ?? []).map((member) => member.id));
		return team.members.filter((member) => !picked.has(member.id));
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
		runtime.ranking = [];
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
				? '(0명)'
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
		const undo = $('#undo-win-button');
		undo.hidden = runtime.ranking.length === 0 || !runtime.lastHistoryId;
		undo.textContent = runtime.teams.length === 2 ? '승리 취소' : '순위 취소';

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
			const rank = rankOf(team.id);
			const place = placeOf(rank);
			if (rank !== null) {
				card.dataset.place = place;
				if (place === 'middle') {
					card.style.setProperty(
						'--rank-progress',
						String((rank - 2) / Math.max(1, runtime.teams.length - 3))
					);
				}
				if (runtime.animateWinner) card.classList.add(rank === 1 ? 'animate-win' : 'animate-lose');
			}

			const heading = document.createElement('div');
			heading.className = 'team-card-heading';
			const name = document.createElement('h3');
			name.textContent = team.name;
			const count = document.createElement('span');
			count.className = 'team-count-chip';
			if (runtime.ranking.length === 0) count.textContent = `${team.members.length}명`;
			else {
				count.textContent = formatTeamResultLabel({
					teamName: team.name,
					rank,
					teamCount: runtime.teams.length,
					compact: true
				});
				count.dataset.place = place;
				if (runtime.animateWinner && rank !== null) {
					count.classList.add('animate-result-chip');
					count.style.setProperty('--chip-delay', rank === 1 ? '120ms' : '200ms');
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
			if (rank === null) {
				const nextRank = runtime.ranking.length + 1;
				const rankButton = document.createElement('button');
				rankButton.type = 'button';
				rankButton.className = nextRank === 1 ? 'win-button' : 'win-button rank-button';
				rankButton.dataset.rankTeam = String(team.id);
				if (runtime.teams.length === 2) {
					rankButton.textContent = '승리';
					rankButton.setAttribute('aria-label', `${team.name} 승리 기록`);
				} else {
					rankButton.textContent = `${nextRank}등`;
					rankButton.setAttribute('aria-label', `${team.name} ${nextRank}등 기록`);
				}
				footer.append(rankButton);
			} else {
				const picks = runtime.picks[team.id] ?? [];
				const remaining = remainingMembers(team);
				const draw = document.createElement('button');
				draw.type = 'button';
				draw.className = 'draw-button';
				draw.dataset.drawTeam = String(team.id);
				if (remaining.length === 0) {
					draw.disabled = true;
					draw.textContent = '모두 뽑음';
					draw.setAttribute('aria-label', `${team.name}은 모두 뽑았습니다`);
				} else {
					draw.textContent = picks.length > 0 ? '한 번 더 뽑기' : '뽑기';
					draw.setAttribute(
						'aria-label',
						picks.length > 0 ? `${team.name}에서 한 명 더 뽑기` : `${team.name}에서 한 명 뽑기`
					);
				}
				footer.append(draw);
			}

			card.append(heading, members, footer);
			grid.append(card);
		}

		renderPickedSection();
		$('#result-live').textContent = runtime.resultMessage;
	}

	// 당첨자는 팀 카드 안이 아니라 결과 격자 아래 한 곳에 모아 보여 준다.
	function renderPickedSection() {
		const section = $('#picked-section');
		const groups = $('#picked-groups');
		groups.replaceChildren();
		const teamsWithPicks = runtime.teams.filter(
			(team) => (runtime.picks[team.id] ?? []).length > 0
		);
		section.hidden = teamsWithPicks.length === 0;
		if (section.hidden) return;

		for (const team of teamsWithPicks) {
			const picks = runtime.picks[team.id];
			const rank = rankOf(team.id);
			const group = document.createElement('div');
			group.className = 'picked-person';
			group.dataset.place = placeOf(rank);

			const label = document.createElement('span');
			label.className = 'picked-label';
			label.textContent = team.name;

			const list = document.createElement('ol');
			list.className = 'picked-list';
			for (const [pickIndex, member] of picks.entries()) {
				const row = document.createElement('li');
				row.className = 'picked-row';
				const number = document.createElement('span');
				number.className = 'picked-number';
				number.setAttribute('aria-hidden', 'true');
				number.textContent = String(pickIndex + 1);
				const pickedName = document.createElement('strong');
				pickedName.className = 'picked-name';
				pickedName.textContent = member.name;
				row.append(
					number,
					pickedName,
					createRemoveButton(`${team.name} ${pickIndex + 1}번째 당첨자 ${member.name} 취소`, {
						pickRemove: String(team.id),
						pickIndex: String(pickIndex)
					})
				);
				list.append(row);
			}

			group.append(label, list);
			groups.append(group);
		}
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
		const { ranking } = resolveTeamRanking(entry);
		return entry.teams.find((team) => team.id === ranking[0]);
	}

	function createHistoryTeamsElement(entry, { compact = false } = {}) {
		const { ranking, complete } = resolveTeamRanking(entry);
		const teams = document.createElement('div');
		teams.className = 'history-teams';

		for (const team of entry.teams) {
			const rank = rankOfTeam(ranking, team.id);
			const line = document.createElement('div');
			line.className = 'history-team-line';
			line.dataset.place =
				rank === null
					? 'none'
					: rank === 1
						? 'first'
						: complete && rank === entry.teams.length
							? 'last'
							: 'middle';

			const label = document.createElement('span');
			label.className = 'history-team-label';
			label.textContent = formatTeamResultLabel({
				teamName: team.name,
				rank,
				teamCount: entry.teams.length
			});

			const names = document.createElement('span');
			names.className = compact ? 'history-team-names history-summary' : 'history-team-names';
			names.textContent = team.members.join(', ');
			line.append(label, names);

			if (team.picks?.length) {
				const picks = document.createElement('span');
				picks.className = 'history-team-picks';
				picks.textContent = `당첨 ${team.picks.join(', ')}`;
				line.append(picks);
			}

			teams.append(line);
		}
		return teams;
	}

	function renderTodayHistory() {
		const todayAll = selectTodayHistory(state.history);
		const today = selectTodayHistory(state.history, { clearedAt: state.todayClearedAt });
		$('#history-card').hidden = state.history.length === 0;
		$('#today-history-count').textContent = `${today.length}경기`;
		$('#today-history-empty').hidden = today.length > 0;
		$('#today-history-empty').textContent =
			today.length === 0 && todayAll.length > 0
				? '오늘 기록을 화면에서 지웠습니다. 기록 보기에는 그대로 남아 있습니다.'
				: '오늘 기록한 경기가 없습니다.';
		$('#clear-today-button').hidden = today.length === 0;
		const list = $('#today-history-list');
		list.replaceChildren();

		for (const entry of today.slice(0, 3)) {
			const row = document.createElement('li');
			row.className = 'history-summary-row';
			row.dataset.flip = `today-history-${entry.id}`;
			row.classList.toggle('is-entering', runtime.enteringHistory.has(entry.id));
			row.classList.toggle('is-leaving', runtime.leavingHistory.has(entry.id));
			const time = document.createElement('span');
			time.className = 'history-time';
			time.textContent = formatTime(entry.occurredAt);
			row.append(
				time,
				createHistoryTeamsElement(entry, { compact: true }),
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
			runtime.ranking = [];
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
		clearTimeout(runtime.wheelRedrawTimer);
		runtime.spinTimer = null;
		runtime.wheelRedrawTimer = null;
		runtime.wheelSpinning = false;
		$('#spin-wheel-button').disabled = false;
		stopSounds();
	}

	function closeDialog(dialog) {
		if (!dialog) return;
		if (dialog.open) dialog.close();
	}

	function showConfirm({
		title,
		description,
		warning = '되돌릴 수 없습니다.',
		actionLabel = '삭제',
		action
	}) {
		$('#confirm-title').textContent = title;
		$('#confirm-description').textContent = description;
		$('#confirm-warning').textContent = warning;
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

	function recordRank(teamId) {
		const nextRanking = appendTeamRank(runtime.ranking, teamId, currentTeamIds());
		if (nextRanking === runtime.ranking) return;
		runtime.animateTeams = false;
		runtime.ranking = nextRanking;

		const entry = currentEntry();
		if (entry) {
			entry.ranking = [...nextRanking];
			entry.winnerTeamId = nextRanking[0];
		} else {
			const created = {
				id: createId('match'),
				occurredAt: new Date().toISOString(),
				winnerTeamId: nextRanking[0],
				ranking: [...nextRanking],
				teams: runtime.teams.map((team) => ({
					id: team.id,
					name: team.name,
					members: team.members.map((member) => member.name),
					picks: []
				}))
			};
			state.history.unshift(created);
			runtime.lastHistoryId = created.id;
			runtime.picks = {};
			markEntering(runtime.enteringHistory, [created.id]);
		}

		runtime.animateWinner = true;
		persist();
		const teamName = runtime.teams.find((team) => team.id === teamId)?.name || '팀';
		runtime.resultMessage =
			runtime.teams.length === 2
				? `${teamName}의 승리를 기록했습니다.`
				: `${teamName}을 ${rankOf(teamId)}등으로 기록했습니다.`;
		renderResults();
		renderTodayHistory();
		setTimeout(() => {
			runtime.animateWinner = false;
		}, 900);
	}

	function undoRank() {
		if (!runtime.lastHistoryId || runtime.ranking.length === 0) return;
		const nextRanking = removeLastTeamRank(runtime.ranking, currentTeamIds());
		const dropped = runtime.ranking.filter((teamId) => !nextRanking.includes(teamId));
		runtime.ranking = nextRanking;

		if (nextRanking.length === 0) {
			state.history = state.history.filter((entry) => entry.id !== runtime.lastHistoryId);
			runtime.lastHistoryId = null;
			runtime.picks = {};
			runtime.resultMessage = '방금 기록한 승리를 취소했습니다.';
		} else {
			const entry = currentEntry();
			if (entry) {
				entry.ranking = [...nextRanking];
				entry.winnerTeamId = nextRanking[0];
			}
			for (const teamId of dropped) {
				delete runtime.picks[teamId];
				const team = entry?.teams.find((item) => item.id === teamId);
				if (team) team.picks = [];
			}
			runtime.resultMessage = '마지막 순위를 취소했습니다.';
		}

		if (dropped.includes(runtime.wheelTeamId)) closeDialog($('#wheel-dialog'));
		runtime.animateWinner = false;
		persist();
		renderResults();
		renderTodayHistory();
	}

	function recordPick(teamId, member) {
		if (!runtime.lastHistoryId) return;
		runtime.picks[teamId] = [
			...(runtime.picks[teamId] ?? []),
			{ id: member.id, name: member.name }
		];
		syncPicksToHistory();
	}

	function removePick(teamId, index) {
		const picks = runtime.picks[teamId];
		if (!picks || index < 0 || index >= picks.length) return;
		runtime.picks[teamId] = picks.filter((_, pickIndex) => pickIndex !== index);
		syncPicksToHistory();
		if (runtime.wheelTeamId === teamId && $('#wheel-dialog').open) openWheel(teamId);
	}

	function clearTeamPicks(teamId) {
		if (!runtime.picks[teamId]?.length) return;
		delete runtime.picks[teamId];
		syncPicksToHistory();
		if (runtime.wheelTeamId === teamId && $('#wheel-dialog').open) openWheel(teamId);
	}

	function syncPicksToHistory() {
		const entry = currentEntry();
		if (entry) {
			for (const team of entry.teams) {
				team.picks = (runtime.picks[team.id] ?? []).map((member) => member.name);
			}
		}
		persist();
		renderResults();
		renderTodayHistory();
		renderHistoryDialog();
	}

	function deleteHistory(id) {
		const entry = state.history.find((item) => item.id === id);
		if (!entry) return;
		showConfirm({
			title: '이 기록을 삭제할까요?',
			description: `${localDateKey(entry.occurredAt)} ${formatTime(entry.occurredAt)} · ${formatTeamResultLabel(
				{
					teamName: winnerTeam(entry)?.name || '팀',
					rank: 1,
					teamCount: entry.teams.length
				}
			)} 기록이 삭제됩니다.`,
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
				runtime.ranking = [];
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
		renderHistoryOverview();
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
				item.append(
					time,
					createHistoryTeamsElement(entry),
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

	// 참가자 통계가 오늘만 세는 대신, 전체는 여기서 승률 막대로 한눈에 보여 준다.
	function renderHistoryOverview() {
		const overview = $('#history-overview');
		const stats = summarizeParticipantStats(state.history, { limit: 1 });
		const hasData = stats.matchCount > 0 && stats.players.length > 0;
		overview.hidden = !hasData;
		if (!hasData) return;

		const days = new Set(state.history.map((entry) => localDateKey(entry.occurredAt))).size;
		const facts = $('#history-overview-facts');
		facts.replaceChildren();
		const factList = [
			{ label: '전체 경기', value: `${stats.matchCount}경기` },
			{ label: '기록한 날', value: `${days}일` },
			{ label: '참가자', value: `${stats.players.length}명` }
		];
		for (const fact of factList) {
			const item = document.createElement('li');
			item.className = 'overview-fact';
			const label = document.createElement('span');
			label.className = 'overview-fact-label';
			label.textContent = fact.label;
			const value = document.createElement('strong');
			value.className = 'overview-fact-value';
			value.textContent = fact.value;
			item.append(label, value);
			facts.append(item);
		}

		const ranking = $('#history-overview-ranking');
		ranking.replaceChildren();
		for (const [index, player] of stats.players.slice(0, 8).entries()) {
			const row = document.createElement('li');
			row.className = 'overview-row';
			const place = document.createElement('span');
			place.className = 'overview-place';
			place.textContent = String(index + 1);
			const name = document.createElement('span');
			name.className = 'overview-name';
			name.textContent = player.name;
			const bar = document.createElement('span');
			bar.className = 'overview-bar';
			bar.setAttribute('aria-hidden', 'true');
			const fill = document.createElement('span');
			fill.className = 'overview-bar-fill';
			fill.style.width = `${Math.round(player.winRate * 100)}%`;
			bar.append(fill);
			const detail = document.createElement('span');
			detail.className = 'overview-detail';
			detail.textContent = `${player.wins}승 ${player.losses}패 · ${Math.round(player.winRate * 100)}%`;
			row.append(place, name, bar, detail);
			ranking.append(row);
		}
	}

	function openWheel(teamId) {
		const team = runtime.teams.find((item) => item.id === teamId);
		if (!team || rankOf(teamId) === null) return;
		getAudioContext();
		runtime.wheelTeamId = teamId;
		runtime.wheelSpinning = false;

		const picks = runtime.picks[teamId] ?? [];
		const remaining = remainingMembers(team);
		$('#wheel-title').textContent = `${team.name} 뽑기`;
		$('#wheel-description').textContent =
			picks.length > 0
				? '이미 당첨된 사람은 빼고 남은 사람 중에서 뽑습니다.'
				: '이 팀 명단 중 한 명을 무작위로 뽑습니다.';
		drawWheel(remaining);

		const pickedList = $('#wheel-picked-list');
		pickedList.replaceChildren();
		$('#wheel-side').hidden = picks.length === 0;
		$('#wheel-dialog').classList.toggle('has-picks', picks.length > 0);
		for (const [index, member] of picks.entries()) {
			const item = document.createElement('li');
			item.className = 'wheel-picked-item';
			item.textContent = `${index + 1}. ${member.name}`;
			pickedList.append(item);
		}

		const result = $('#wheel-result');
		const lastPick = picks.at(-1);
		result.textContent =
			remaining.length === 0
				? '이 팀은 모두 뽑았습니다.'
				: lastPick
					? `당첨자 · ${lastPick.name}`
					: '돌리기를 누르세요.';
		result.dataset.picked = String(Boolean(lastPick));

		const spinButton = $('#spin-wheel-button');
		spinButton.disabled = remaining.length === 0;
		if (remaining.length === 0) spinButton.textContent = '모두 뽑음';
		else spinButton.textContent = picks.length > 0 ? '한 번 더 뽑기' : '돌리기';
		$('#clear-picks-button').hidden = picks.length === 0;
		renderSoundButton();
		showDialog($('#wheel-dialog'), '#spin-wheel-button');
	}

	function drawWheel(members) {
		const wheel = $('#wheel');
		const count = Math.max(1, members.length);
		const gradient = members
			.map((_, index) => {
				const start = (index / count) * 100;
				const end = ((index + 1) / count) * 100;
				return `${wheelColors[index % wheelColors.length]} ${start}% ${end}%`;
			})
			.join(', ');
		wheel.style.setProperty(
			'--wheel-gradient',
			members.length > 0 ? `conic-gradient(${gradient})` : 'var(--surface-soft)'
		);
		wheel.replaceChildren();
		for (const [index, member] of members.entries()) {
			const label = document.createElement('span');
			const angle = (index * 360) / count + 180 / count;
			label.className = 'wheel-label';
			label.textContent = member.name;
			label.style.color = wheelTextColors[index % wheelTextColors.length];
			label.dataset.angle = String(angle);
			label.style.setProperty('--label-angle', `${angle}deg`);
			label.style.setProperty('--label-counter-angle', `${-(angle + runtime.wheelRotation)}deg`);
			wheel.append(label);
		}
		wheel.style.transform = `rotate(${runtime.wheelRotation}deg)`;
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
		if (!team) return;
		const candidates = remainingMembers(team);
		if (!candidates.length) return;
		const pickedIndex = Math.floor(Math.random() * candidates.length);
		const previousRotation = runtime.wheelRotation;
		const targetRotation = calculateWheelTargetRotation(
			previousRotation,
			candidates.length,
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

		clearTimeout(runtime.spinTimer);
		runtime.spinTimer = setTimeout(() => {
			runtime.spinTimer = null;
			if (!$('#wheel-dialog').open) {
				cancelWheelSpin();
				return;
			}
			const picked = candidates[pickedIndex];
			recordPick(team.id, picked);
			runtime.wheelSpinning = false;
			const stillRemaining = remainingMembers(team);
			button.disabled = stillRemaining.length === 0;
			button.textContent = stillRemaining.length === 0 ? '모두 뽑음' : '한 번 더 뽑기';
			result.textContent = `당첨자 · ${picked.name}`;
			result.dataset.picked = 'true';
			result.classList.remove('animate-pop');
			void result.offsetWidth;
			result.classList.add('animate-pop');
			playFanfare();
			celebrate();
			redrawWheelAfterPick(team);
		}, WHEEL_SPIN_DURATION + WHEEL_SPIN_SETTLE);
	}

	function redrawWheelAfterPick(team) {
		clearTimeout(runtime.wheelRedrawTimer);
		runtime.wheelRedrawTimer = setTimeout(() => {
			runtime.wheelRedrawTimer = null;
			if (!$('#wheel-dialog').open || runtime.wheelTeamId !== team.id || runtime.wheelSpinning) {
				return;
			}
			openWheel(team.id);
		}, 1000);
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
			title: '참가자 명단을 삭제할까요?',
			description: `명단에 있는 ${state.participants.length}명이 모두 지워집니다. 저장한 명단은 그대로 남습니다.`,
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
	$('#undo-win-button').addEventListener('click', undoRank);
	$('#copy-result-button').addEventListener('click', copyResultText);
	$('#team-grid').addEventListener('click', (event) => {
		const rankButton = event.target.closest('[data-rank-team]');
		const drawButton = event.target.closest('[data-draw-team]');
		if (rankButton) recordRank(Number(rankButton.dataset.rankTeam));
		if (drawButton && !drawButton.disabled) openWheel(Number(drawButton.dataset.drawTeam));
	});

	$('#picked-groups').addEventListener('click', (event) => {
		const pickButton = event.target.closest('[data-pick-remove]');
		if (pickButton) {
			removePick(Number(pickButton.dataset.pickRemove), Number(pickButton.dataset.pickIndex));
		}
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
				title: '저장한 명단을 삭제할까요?',
				description: `저장한 명단 "${roster.name}"(${roster.participants.length}명)이 삭제됩니다.`,
				action: () => {
					state.rosters = state.rosters.filter((item) => item.id !== removeId);
					persist();
					renderRosters();
				}
			});
		}
	});

	$('#open-player-stats-button').addEventListener('click', () => {
		renderPlayerStats();
		showDialog($('#player-stats-dialog'), '.dialog-close');
	});
	$('#clear-today-button').addEventListener('click', clearTodayHistory);
	$('#clear-picks-button').addEventListener('click', () => {
		if (runtime.wheelTeamId !== null) clearTeamPicks(runtime.wheelTeamId);
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

	function copyWithTextarea(value) {
		const textarea = document.createElement('textarea');
		textarea.value = value;
		textarea.setAttribute('readonly', '');
		textarea.setAttribute('aria-hidden', 'true');
		textarea.style.cssText = 'position:fixed;top:-1000px;left:0;opacity:0';
		root.append(textarea);
		textarea.select();
		let copied = false;
		try {
			copied = document.execCommand('copy');
		} catch {
			// 복사를 막는 브라우저에서는 실패로 둔다.
		}
		textarea.remove();
		return copied;
	}

	async function copyResultText() {
		if (!runtime.teams.length) return;
		const value = formatTeamsText(runtime.teams);
		let copied = false;
		if (navigator.clipboard?.writeText) {
			try {
				await navigator.clipboard.writeText(value);
				copied = true;
			} catch {
				// 권한이 없으면 아래 대체 수단으로 넘어간다.
			}
		}
		if (!copied) copied = copyWithTextarea(value);

		const button = $('#copy-result-button');
		button.textContent = copied ? '복사함' : '복사 실패';
		$('#result-live').textContent = copied
			? '팀 결과를 복사했습니다.'
			: '복사하지 못했습니다. 결과를 직접 선택해 복사해 주세요.';
		clearTimeout(runtime.copyResetTimer);
		runtime.copyResetTimer = setTimeout(() => {
			button.textContent = '결과 복사';
		}, 1600);
	}

	function clearTodayHistory() {
		const today = selectTodayHistory(state.history, { clearedAt: state.todayClearedAt });
		if (today.length === 0) return;
		showConfirm({
			title: '오늘 기록을 화면에서 지울까요?',
			description: `오늘 기록 ${today.length}경기가 이 화면에서만 사라집니다.`,
			warning: '기록 보기에는 그대로 남습니다.',
			actionLabel: '지우기',
			action: () => {
				state.todayClearedAt = new Date().toISOString();
				persist();
				renderTodayHistory();
				$('#result-live').textContent = '오늘 기록을 화면에서 지웠습니다.';
			}
		});
	}

	function renderPlayerStats() {
		const today = selectTodayHistory(state.history, { clearedAt: state.todayClearedAt });
		const stats = summarizeParticipantStats(today);
		const hasData = stats.matchCount > 0 && stats.players.length > 0;
		$('#player-stats-description').textContent = hasData
			? `오늘 ${stats.matchCount}경기 · 참가자 ${stats.players.length}명`
			: '오늘 기록이 없습니다.';
		$('#player-stats-empty').hidden = hasData;
		$('#player-stats-body').hidden = !hasData;
		if (!hasData) return;

		const leaders = $('#player-stats-leaders');
		leaders.replaceChildren();
		const groups = [
			{ label: '최다 승리', unit: '승', items: stats.topWins },
			{ label: '최다 당첨', unit: '번', items: stats.topPicks },
			{ label: '최다 패배', unit: '패', items: stats.topLosses }
		];
		for (const group of groups) {
			const item = document.createElement('li');
			item.className = 'stats-leader';
			const label = document.createElement('span');
			label.className = 'stats-leader-label';
			label.textContent = group.label;
			const name = document.createElement('strong');
			name.className = 'stats-leader-name';
			const count = document.createElement('span');
			count.className = 'stats-leader-count';
			const best = group.items[0];
			if (best) {
				const shared = group.items.filter((entry) => entry.count === best.count);
				name.textContent = best.name;
				count.textContent =
					shared.length > 1
						? `${best.count}${group.unit} · 공동 ${shared.length}명`
						: `${best.count}${group.unit}`;
			} else {
				name.textContent = '기록 없음';
				count.textContent = '';
			}
			item.append(label, name, count);
			leaders.append(item);
		}

		const pairs = $('#player-stats-pairs');
		pairs.replaceChildren();
		$('#player-stats-pairs-empty').hidden = stats.pairs.length > 0;
		for (const pair of stats.pairs) {
			const item = document.createElement('li');
			item.className = 'stats-pair';
			const names = document.createElement('strong');
			names.textContent = pair.names.join(' + ');
			const detail = document.createElement('span');
			detail.textContent = `같은 팀 ${pair.together}번 중 ${pair.wins}번 승리`;
			item.append(names, detail);
			pairs.append(item);
		}

		const rows = $('#player-stats-rows');
		rows.replaceChildren();
		for (const player of stats.players) {
			const row = document.createElement('tr');
			const name = document.createElement('th');
			name.scope = 'row';
			name.textContent = player.name;
			row.append(name);
			for (const value of [player.matches, player.wins, player.losses, player.picks]) {
				const cell = document.createElement('td');
				cell.textContent = String(value);
				row.append(cell);
			}
			rows.append(row);
		}
	}

	root.style.setProperty('--wheel-spin-duration', `${WHEEL_SPIN_DURATION}ms`);
	root.style.setProperty('--wheel-spin-easing', `cubic-bezier(${WHEEL_SPIN_EASING.join(', ')})`);
	showStorageFailure();
	render();

	return () => {
		cancelWheelSpin();
		participantLayoutQuery.removeEventListener('change', handleParticipantLayoutChange);
		clearTimeout(runtime.celebrationTimer);
		clearTimeout(runtime.participantRemovalTimer);
		clearTimeout(runtime.participantMovementTimer);
		clearTimeout(runtime.copyResetTimer);
		try {
			runtime.audioContext?.close?.();
		} catch {
			// 이미 닫힌 AudioContext는 무시한다.
		}
	};
}
