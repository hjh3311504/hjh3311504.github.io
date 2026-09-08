import { createLifetime } from './lifecycle.js';
import { formatTeamResultLabel, formatTeamsText, makeTeams, rankOfTeam } from './core.js';

export function createResults({
	getState,
	runtime,
	$,
	applyUiButton,
	createRemoveButton,
	currentSetup,
	root,
	undoRank,
	recordRank,
	openWheel
}) {
	let resultError = '';
	const lifetime = createLifetime();
	const { on, setTimeout, clearTimeout } = lifetime;
	const state = getState();
	let copyResetTimer = null;
	const currentTeamIds = () => runtime.teams.map((team) => team.id);

	const rankOf = (teamId) => rankOfTeam(runtime.ranking, teamId);

	const placeOf = (rank) => {
		if (rank === null) return 'none';
		if (rank === 1) return 'first';
		return rank === runtime.teams.length ? 'last' : 'middle';
	};

	const remainingMembers = (team) => {
		const picked = new Set((runtime.picks[team.id] ?? []).map((member) => member.id));
		return team.members.filter((member) => !picked.has(member.id));
	};

	function clearResult() {
		runtime.teams = [];
		resultError = '';
		runtime.resultMessage = '';
		runtime.ranking = [];
		runtime.lastHistoryId = null;
		runtime.picks = {};
		runtime.animateTeams = false;
		runtime.animateWinner = false;
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
			if (resultError) {
				empty.dataset.tone = 'error';
				title.textContent = '팀을 만들지 못했습니다';
				description.textContent = resultError;
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
				const rankButton = applyUiButton(document.createElement('button'), { variant: 'primary' });
				rankButton.type = 'button';
				rankButton.classList.add('win-button');
				if (nextRank !== 1) rankButton.classList.add('rank-button');
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
				const draw = applyUiButton(document.createElement('button'), { variant: 'soft' });
				draw.type = 'button';
				draw.classList.add('draw-button');
				draw.dataset.drawTeam = String(team.id);
				if (remaining.length === 0) {
					draw.disabled = true;
					draw.textContent = '모두 뽑음';
					draw.setAttribute('aria-label', `${team.name}은 모두 뽑았습니다`);
				} else {
					draw.textContent = picks.length > 0 ? '다음 당첨자 뽑기' : '뽑기';
					draw.setAttribute(
						'aria-label',
						picks.length > 0 ? `${team.name} 다음 당첨자 뽑기` : `${team.name}에서 한 명 뽑기`
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
			resultError = '';
			runtime.ranking = [];
			runtime.lastHistoryId = null;
			runtime.picks = {};
			runtime.animateTeams = true;
			runtime.animateWinner = false;
			runtime.resultMessage = `${included.length}명을 ${runtime.teams.length}개 팀으로 나눴습니다.`;
		} catch (error) {
			clearResult();
			resultError =
				error instanceof Error ? error.message : '팀을 만들지 못했습니다. 설정을 확인해 주세요.';
			runtime.resultMessage = resultError;
		}
		renderResults();
		setTimeout(() => {
			runtime.animateTeams = false;
		}, 700);
	}

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
		if (!lifetime.active) return;
		if (!copied) copied = copyWithTextarea(value);

		const button = $('#copy-result-button');
		button.textContent = copied ? '복사 완료' : '복사 실패';
		$('#result-live').textContent = copied
			? '팀 결과를 복사했습니다.'
			: '복사하지 못했습니다. 결과를 직접 선택해 복사해 주세요.';
		clearTimeout(copyResetTimer);
		copyResetTimer = setTimeout(() => {
			button.textContent = '명단 복사';
		}, 1600);
	}
	function connect() {
		on($('#make-teams-button'), 'click', makeCurrentTeams);

		on($('#reshuffle-button'), 'click', makeCurrentTeams);

		on($('#undo-win-button'), 'click', undoRank);

		on($('#copy-result-button'), 'click', copyResultText);

		on($('#team-grid'), 'click', (event) => {
			const rankButton = event.target.closest('[data-rank-team]');
			const drawButton = event.target.closest('[data-draw-team]');
			if (rankButton) recordRank(Number(rankButton.dataset.rankTeam));
			if (drawButton && !drawButton.disabled) openWheel(Number(drawButton.dataset.drawTeam));
		});
	}
	function destroy() {
		lifetime.destroy();
	}
	return { connect, destroy, renderResults, clearResult, currentTeamIds, rankOf, remainingMembers };
}
