import { createLifetime } from './lifecycle.js';
import { clone, createId } from './utils.js';

export function createRosters({
	getState,
	$,
	applyUiButton,
	createRemoveButton,
	persist,
	closeDialog,
	saveAndRender,
	showDialog,
	showConfirm
}) {
	const lifetime = createLifetime();
	const { on } = lifetime;
	const state = getState();
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
			const loadButton = applyUiButton(document.createElement('button'), { variant: 'soft' });
			loadButton.type = 'button';
			loadButton.classList.add('roster-load-button');
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
	function connect() {
		on($('#open-rosters-button'), 'click', () => {
			$('#roster-name').value = '';
			renderRosters();
			showDialog($('#roster-dialog'), '#roster-name');
		});

		on($('#roster-name'), 'input', updateRosterSaveButton);

		on($('#save-roster-form'), 'submit', (event) => {
			event.preventDefault();
			saveRoster();
		});

		on($('#rosters-list'), 'click', (event) => {
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
	}
	function destroy() {
		lifetime.destroy();
	}
	return { connect, destroy };
}
