import { createLifetime } from './lifecycle.js';
import {
	SIZE_MODE,
	TEAM_MODE,
	cleanRulesAfterParticipantRemoval,
	getSetupStatus,
	orderParticipantsForColumns,
	parseParticipantNames,
	planParticipantRemoval,
	rebalanceParticipantColumns
} from './core.js';
import { clamp, createId } from './utils.js';

export function createParticipants({
	getState,
	root,
	$,
	createRemoveButton,
	markEntering,
	saveAndRender,
	showDialog,
	closeDialog,
	captureFlipPositions,
	playFlip,
	showConfirm
}) {
	let removingParticipantId = null;
	const leavingParticipants = new Set();
	let ruleType = 'together';
	const enteringParticipants = new Set();
	const leavingRules = new Set();
	let checkboxAnimationKey = null;
	let ruleSelection = new Set();
	const enteringRules = new Set();
	const lifetime = createLifetime();
	const { on, setTimeout, clearTimeout } = lifetime;
	const state = getState();
	let checkboxAnimationTimer = null;
	const participantLayoutQuery = window.matchMedia('(max-width: 640px)');

	const useFullParticipantFont = () => root.classList.add('team-maker-font-expanded');

	function markCheckboxAnimation(key) {
		clearTimeout(checkboxAnimationTimer);
		checkboxAnimationKey = key;
		checkboxAnimationTimer = setTimeout(() => {
			checkboxAnimationKey = null;
			checkboxAnimationTimer = null;
		}, 220);
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
			row.classList.toggle('is-entering', enteringParticipants.has(participant.id));
			row.classList.toggle('is-leaving', leavingParticipants.has(participant.id));
			const checkbox = document.createElement('input');
			checkbox.type = 'checkbox';
			checkbox.className = 'team-maker-checkbox';
			checkbox.checked = participant.included;
			checkbox.classList.toggle(
				'is-animating',
				checkboxAnimationKey === `participant:${participant.id}`
			);
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
			removeButton.disabled = removingParticipantId !== null;
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
			row.classList.toggle('is-entering', enteringRules.has(rule.id));
			row.classList.toggle('is-leaving', leavingRules.has(rule.id));

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
			enteringParticipants,
			added.map((participant) => participant.id)
		);
		saveAndRender();
	}

	function renderBulkPreview() {
		const names = parseParticipantNames($('#bulk-names').value);
		$('#bulk-add-button').textContent = names.length
			? `명단에 ${names.length}명 추가`
			: '명단에 추가';
		$('#bulk-add-button').disabled = names.length === 0;
	}

	function openRuleDialog(type) {
		ruleType = type;
		ruleSelection = new Set();
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
			checkbox.className = 'team-maker-checkbox';
			checkbox.id = `rule-${participant.id}`;
			checkbox.checked = ruleSelection.has(participant.id);
			checkbox.classList.toggle('is-animating', checkboxAnimationKey === `rule:${participant.id}`);
			checkbox.dataset.rulePick = participant.id;
			const label = document.createElement('label');
			label.htmlFor = checkbox.id;
			label.textContent = participant.name;
			row.append(checkbox, label);
			list.append(row);
		}
		const count = ruleSelection.size;
		$('#rule-picker-note').textContent = count < 2 ? '두 명 이상 골라 주세요.' : `${count}명 선택`;
		$('#rule-picker-note').classList.toggle('error-text', count < 2);
		$('#save-rule-button').disabled = count < 2;
	}

	function selectMode(mode) {
		if (state.mode === mode) return;
		state.mode = mode;
		saveAndRender({ clearTeams: false });
	}

	const handleParticipantLayoutChange = () => renderParticipants();

	function setSplitValue(value) {
		if (state.mode === TEAM_MODE) state.teamCount = clamp(value, 2, 20);
		else state.teamSize = clamp(value, 1, 20);
		saveAndRender({ clearTeams: false });
	}
	function connect() {
		on($('#person-name'), 'input', useFullParticipantFont, { once: true });

		on($('#bulk-names'), 'input', useFullParticipantFont, { once: true });

		on($('#add-person-form'), 'submit', (event) => {
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

		on($('#open-bulk-button'), 'click', () => {
			$('#bulk-names').value = '';
			renderBulkPreview();
			showDialog($('#bulk-dialog'), '#bulk-names');
		});

		on($('#bulk-names'), 'input', renderBulkPreview);

		on($('#bulk-add-button'), 'click', () => {
			const names = parseParticipantNames($('#bulk-names').value);
			if (!names.length) return;
			closeDialog($('#bulk-dialog'));
			addParticipants(names);
		});

		on($('#toggle-all-button'), 'click', () => {
			const allIncluded = state.participants.every((participant) => participant.included);
			state.participants.forEach((participant) => {
				participant.included = !allIncluded;
			});
			saveAndRender();
		});

		on($('#participant-list'), 'change', (event) => {
			const toggleId = event.target.dataset.participantToggle;
			const nameId = event.target.dataset.participantName;
			if (toggleId) {
				const participant = state.participants.find((item) => item.id === toggleId);
				if (participant) participant.included = event.target.checked;
				markCheckboxAnimation(`participant:${toggleId}`);
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

		on($('#participant-list'), 'click', (event) => {
			const id = event.target.closest('[data-participant-remove]')?.dataset.participantRemove;
			if (!id || removingParticipantId !== null) return;
			const initialPlan = planParticipantRemoval(state.participants, id);
			if (!initialPlan) return;
			removingParticipantId = id;
			leavingParticipants.add(id);
			renderParticipants();
			setTimeout(() => {
				const previousPositions = captureFlipPositions();
				const plan = planParticipantRemoval(state.participants, id);
				if (!plan) {
					leavingParticipants.delete(id);
					removingParticipantId = null;
					renderParticipants();
					return;
				}
				state.participants = plan.nextParticipants;
				state.rules = cleanRulesAfterParticipantRemoval(
					state.rules,
					new Set(state.participants.map((participant) => participant.id))
				);
				leavingParticipants.delete(id);
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
					removingParticipantId = null;
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
					setTimeout(finishRemoval, movementDuration + 20);
				} else finishRemoval();
			}, 220);
		});

		on($('#clear-list-button'), 'click', () => {
			showConfirm({
				title: '참가자 명단을 삭제할까요?',
				description: `명단에 있는 ${state.participants.length}명이 모두 지워집니다.\n저장한 명단은 그대로 남습니다.`,
				action: () => {
					state.participants = [];
					state.rules = [];
					saveAndRender();
				}
			});
		});

		on($('#add-together-rule'), 'click', () => openRuleDialog('together'));

		on($('#add-apart-rule'), 'click', () => openRuleDialog('apart'));

		on($('#rule-picker-list'), 'change', (event) => {
			const id = event.target.dataset.rulePick;
			if (!id) return;
			if (event.target.checked) ruleSelection.add(id);
			else ruleSelection.delete(id);
			markCheckboxAnimation(`rule:${id}`);
			renderRulePicker();
		});

		on($('#save-rule-button'), 'click', () => {
			if (ruleSelection.size < 2) return;
			const previousPositions = captureFlipPositions();
			const rule = {
				id: createId('rule'),
				type: ruleType,
				participantIds: [...ruleSelection]
			};
			state.rules.push(rule);
			markEntering(enteringRules, [rule.id]);
			closeDialog($('#rule-dialog'));
			saveAndRender();
			playFlip(previousPositions);
		});

		on($('#rules-list'), 'click', (event) => {
			const id = event.target.closest('[data-rule-remove]')?.dataset.ruleRemove;
			if (!id || leavingRules.has(id)) return;
			leavingRules.add(id);
			renderRules();
			setTimeout(() => {
				const previousPositions = captureFlipPositions();
				state.rules = state.rules.filter((rule) => rule.id !== id);
				leavingRules.delete(id);
				saveAndRender();
				playFlip(previousPositions);
			}, 220);
		});

		on($('#team-mode-button'), 'click', () => selectMode(TEAM_MODE));

		on($('#size-mode-button'), 'click', () => selectMode(SIZE_MODE));

		on(participantLayoutQuery, 'change', handleParticipantLayoutChange);

		on($('#decrease-value'), 'click', () => {
			setSplitValue((state.mode === TEAM_MODE ? state.teamCount : state.teamSize) - 1);
		});

		on($('#increase-value'), 'click', () => {
			setSplitValue((state.mode === TEAM_MODE ? state.teamCount : state.teamSize) + 1);
		});
		if (state.participants.length || state.rosters.length || state.history.length)
			useFullParticipantFont();
	}
	function destroy() {
		lifetime.destroy();
	}
	return { connect, destroy, renderParticipants, renderRules, renderSettings, currentSetup };
}
