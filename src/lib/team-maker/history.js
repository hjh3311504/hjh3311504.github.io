import { createLifetime } from './lifecycle.js';
import {
	HISTORY_DAY_START_HOUR,
	appendTeamRank,
	formatTeamResultLabel,
	localDateKey,
	rankOfTeam,
	removeLastTeamRank,
	resolveTeamRanking,
	selectTodayHistory,
	summarizeParticipantStats
} from './core.js';
import { formatPercent, createId } from './utils.js';

export function createHistory({
	getState,
	runtime,
	$,
	createRemoveButton,
	currentTeamIds,
	markEntering,
	persist,
	rankOf,
	renderResults,
	closeDialog,
	showConfirm,
	captureFlipPositions,
	playFlip,
	assetUrl,
	root,
	showDialog
}) {
	const statsImageFallbacks = new WeakMap();
	let historySort = 'wins';
	let historySearch = '';
	const enteringHistory = new Set();
	let historyTab = 'log';
	const leavingHistory = new Set();
	let todayHistoryExpanded = false;
	const lifetime = createLifetime();
	const { on, setTimeout, clearTimeout } = lifetime;
	const state = getState();
	let todayHistoryResetTimer = null;
	const currentEntry = () =>
		state.history.find((entry) => entry.id === runtime.lastHistoryId) ?? null;

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
			label.textContent =
				rank === null
					? team.name
					: formatTeamResultLabel({
							teamName: team.name,
							rank,
							teamCount: entry.teams.length
						});

			const names = document.createElement('span');
			names.className = compact ? 'history-team-names history-summary' : 'history-team-names';
			const pickedNames = new Set(team.picks ?? []);
			const orderedNames = [
				...team.members.filter((name) => pickedNames.has(name)),
				...team.members.filter((name) => !pickedNames.has(name))
			];
			for (const memberName of orderedNames) {
				const item = document.createElement('span');
				item.className = 'history-person-name';
				item.textContent = memberName;
				if (pickedNames.has(memberName)) {
					item.classList.add('is-picked');
					const pickedDescription = document.createElement('span');
					pickedDescription.className = 'sr-only';
					pickedDescription.textContent = ' 당첨';
					item.append(pickedDescription);
				}
				names.append(item);
			}
			line.append(label, names);

			teams.append(line);
		}
		return teams;
	}

	function renderTodayHistory() {
		const now = new Date();
		const todayAll = selectTodayHistory(state.history, { now });
		const today = selectTodayHistory(state.history, {
			now,
			clearedAt: state.todayClearedAt
		});
		$('#history-card').hidden = state.history.length === 0;
		$('#today-history-count').textContent = `(${today.length}경기)`;
		$('#today-history-empty').hidden = today.length > 0;
		$('#today-history-empty').textContent =
			today.length === 0 && todayAll.length > 0
				? '오늘 기록을 화면에서 지웠습니다. 전체 기록에는 그대로 남아 있습니다.'
				: '오늘 기록한 경기가 없습니다.';
		$('#clear-today-button').hidden = today.length === 0;
		const list = $('#today-history-list');
		list.replaceChildren();
		const toggle = $('#today-history-toggle');
		if (today.length <= 3) todayHistoryExpanded = false;
		toggle.hidden = today.length <= 3;
		toggle.textContent = todayHistoryExpanded ? '접기' : '펼치기';
		toggle.setAttribute('aria-expanded', String(todayHistoryExpanded));
		const visibleToday = todayHistoryExpanded ? today : today.slice(0, 3);

		for (const entry of visibleToday) {
			const row = document.createElement('li');
			row.className = 'history-summary-row';
			row.dataset.flip = `today-history-${entry.id}`;
			row.classList.toggle('is-entering', enteringHistory.has(entry.id));
			row.classList.toggle('is-leaving', leavingHistory.has(entry.id));
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

	function scheduleTodayHistoryReset() {
		clearTimeout(todayHistoryResetTimer);
		const now = new Date();
		const nextReset = new Date(now);
		nextReset.setHours(HISTORY_DAY_START_HOUR, 0, 0, 0);
		if (nextReset <= now) nextReset.setDate(nextReset.getDate() + 1);
		todayHistoryResetTimer = setTimeout(() => {
			todayHistoryExpanded = false;
			renderTodayHistory();
			if ($('#player-stats-dialog').open) renderPlayerStats();
			scheduleTodayHistoryReset();
		}, nextReset.getTime() - now.getTime());
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
			markEntering(enteringHistory, [created.id]);
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
		if (leavingHistory.has(id)) return;
		leavingHistory.add(id);
		renderTodayHistory();
		renderHistoryDialog();
		setTimeout(() => {
			const previousPositions = captureFlipPositions();
			state.history = state.history.filter((item) => item.id !== id);
			leavingHistory.delete(id);
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
		const hasHistory = state.history.length > 0;
		$('#history-description-count').textContent = hasHistory
			? `전체 ${state.history.length}경기`
			: '기록이 없습니다.';
		$('#history-description-legend').hidden = !hasHistory;
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
				item.classList.toggle('is-leaving', leavingHistory.has(entry.id));
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

	function setHistoryTab(tab) {
		historyTab = tab === 'stats' ? 'stats' : 'log';
		const isStats = historyTab === 'stats';
		$('#history-log-tab').setAttribute('aria-selected', String(!isStats));
		$('#history-stats-tab').setAttribute('aria-selected', String(isStats));
		$('#history-log-panel').hidden = isStats;
		$('#history-stats-panel').hidden = !isStats;
		if (isStats) renderHistoryOverview();
	}

	const historySortOptions = {
		wins: { label: '승리순', title: '승리 순위', field: 'wins' },
		rate: { label: '1등 확률순', title: '1등 확률 순위', field: 'winRate' },
		picks: { label: '당첨순', title: '당첨 순위', field: 'picks' }
	};

	function sortedHistoryPlayers(players) {
		const field = historySortOptions[historySort]?.field ?? 'wins';
		return [...players].sort(
			(first, second) =>
				second[field] - first[field] ||
				second.wins - first.wins ||
				second.matches - first.matches ||
				first.name.localeCompare(second.name, 'ko')
		);
	}

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
			{ label: '전체 경기', value: `${stats.matchCount}경기`, icon: 'stat-games.png' },
			{ label: '기록 일수', value: `${days}일`, icon: 'stat-days.png', tone: 'green' },
			{
				label: '참가자',
				value: `${stats.players.length}명`,
				icon: 'stat-people.png',
				tone: 'violet'
			}
		];
		for (const fact of factList) {
			const item = document.createElement('li');
			item.className = 'overview-fact';
			const icon = document.createElement('span');
			icon.className = 'overview-fact-icon';
			if (fact.tone) icon.dataset.tone = fact.tone;
			const image = document.createElement('img');
			image.src = assetUrl(fact.icon);
			image.alt = '';
			icon.append(image);
			const text = document.createElement('span');
			text.className = 'overview-fact-text';
			const label = document.createElement('span');
			label.className = 'overview-fact-label';
			label.textContent = fact.label;
			const value = document.createElement('strong');
			value.className = 'overview-fact-value';
			value.textContent = fact.value;
			text.append(label, value);
			item.append(icon, text);
			facts.append(item);
		}

		const option = historySortOptions[historySort] ?? historySortOptions.wins;
		$('#history-overview-title').textContent = option.title;
		$('#history-sort-button').textContent = option.label;
		for (const button of root.querySelectorAll('[data-history-sort]')) {
			button.setAttribute('aria-checked', String(button.dataset.historySort === historySort));
		}

		const allPlayers = sortedHistoryPlayers(stats.players);
		const podium = $('#history-overview-podium');
		podium.replaceChildren();
		for (const [index, player] of allPlayers.slice(0, 3).entries()) {
			const item = document.createElement('li');
			item.className = 'podium-card';
			item.dataset.rank = String(index + 1);
			const laurel = document.createElement('img');
			laurel.className = 'podium-laurel';
			laurel.src = assetUrl(`laurel-${index + 1}.png`);
			laurel.alt = `${index + 1}위`;
			const name = document.createElement('strong');
			name.className = 'podium-name';
			name.textContent = player.name;
			const detail = document.createElement('span');
			detail.className = 'podium-detail';
			detail.textContent = `${player.wins}승 ${player.losses}패 · ${formatPercent(player.winRate)}`;
			const picks = document.createElement('span');
			picks.className = 'pick-chip';
			picks.dataset.zero = String(player.picks === 0);
			picks.textContent = `당첨 ${player.picks}회`;
			const bar = document.createElement('span');
			bar.className = 'podium-bar';
			bar.setAttribute('aria-hidden', 'true');
			const fill = document.createElement('span');
			fill.className = 'podium-bar-fill';
			fill.style.width = formatPercent(player.winRate);
			bar.append(fill);
			item.append(laurel, name, detail, picks, bar);
			podium.append(item);
		}

		const query = historySearch.trim().toLocaleLowerCase('ko');
		const visiblePlayers = allPlayers
			.map((player, index) => ({ ...player, place: index + 1 }))
			.filter((player) => !query || player.name.toLocaleLowerCase('ko').includes(query))
			.filter((player) => query || player.place > 3);
		const ranking = $('#history-overview-ranking');
		ranking.replaceChildren();
		for (const player of visiblePlayers) {
			const row = document.createElement('tr');
			const place = document.createElement('td');
			place.textContent = String(player.place);
			const name = document.createElement('th');
			name.scope = 'row';
			name.textContent = player.name;
			const record = document.createElement('td');
			record.textContent = `${player.wins}승 ${player.losses}패`;
			const rate = document.createElement('td');
			const rateCell = document.createElement('span');
			rateCell.className = 'rate-cell';
			const rateNumber = document.createElement('span');
			rateNumber.className = 'rate-num';
			rateNumber.textContent = formatPercent(player.winRate);
			const rateBar = document.createElement('span');
			rateBar.className = 'rate-bar';
			rateBar.setAttribute('aria-hidden', 'true');
			const rateFill = document.createElement('span');
			rateFill.className = 'rate-bar-fill';
			rateFill.style.width = formatPercent(player.winRate);
			rateBar.append(rateFill);
			rateCell.append(rateNumber, rateBar);
			rate.append(rateCell);
			const picks = document.createElement('td');
			if (player.picks > 0) picks.className = 'num-pick';
			picks.textContent = `${player.picks}회`;
			row.append(place, name, record, rate, picks);
			ranking.append(row);
		}
		if (visiblePlayers.length === 0) {
			const row = document.createElement('tr');
			const empty = document.createElement('td');
			empty.colSpan = 5;
			empty.className = 'rank-table-empty';
			empty.textContent = query ? '검색 결과가 없습니다.' : '4위 이하 참가자가 없습니다.';
			row.append(empty);
			ranking.append(row);
		}
	}

	function clearTodayHistory() {
		const today = selectTodayHistory(state.history, { clearedAt: state.todayClearedAt });
		if (today.length === 0) return;
		showConfirm({
			title: '오늘 기록을 화면에서 지울까요?',
			description: `오늘 기록 ${today.length}경기가 이 화면에서만 사라집니다.`,
			warning: '전체 기록에는 그대로 남습니다.',
			actionLabel: '지우기',
			action: () => {
				state.todayClearedAt = new Date().toISOString();
				todayHistoryExpanded = false;
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
			{ label: '최다 승리', unit: '승', items: stats.topWins, tone: 'win', icon: 'stat-win.png' },
			{
				label: '최다 당첨',
				unit: '번',
				items: stats.topPicks,
				tone: 'pick',
				icon: 'stat-pick.png'
			},
			{
				label: '최다 패배',
				unit: '패',
				items: stats.topLosses,
				tone: 'lose',
				icon: 'stat-lose.png'
			}
		];
		for (const group of groups) {
			const item = document.createElement('li');
			item.className = 'stats-leader';
			item.dataset.tone = group.tone;
			if (group.tone === 'win') item.dataset.lead = 'true';
			const top = document.createElement('span');
			top.className = 'stats-leader-top';
			const icon = document.createElement('span');
			icon.className = 'stats-leader-icon';
			const image = document.createElement('img');
			const imageUrl = assetUrl(
				import.meta.env.DEV ? group.icon : group.icon.replace(/\.png$/, '.webp')
			);
			if (!import.meta.env.DEV) statsImageFallbacks.set(image, assetUrl(group.icon));
			icon.style.setProperty('--stats-leader-icon-image', `url("${imageUrl}")`);
			image.src = imageUrl;
			image.alt = '';
			icon.append(image);
			const text = document.createElement('span');
			text.className = 'stats-leader-text';
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
			text.append(label, name, count);
			top.append(icon, text);
			const bar = document.createElement('span');
			bar.className = 'stats-leader-bar';
			bar.setAttribute('aria-hidden', 'true');
			const fill = document.createElement('span');
			fill.className = 'stats-leader-bar-fill';
			fill.style.width = best ? '100%' : '0%';
			bar.append(fill);
			item.append(top, bar);
			leaders.append(item);
		}

		const pairs = $('#player-stats-pairs');
		pairs.replaceChildren();
		$('#player-stats-pairs-empty').hidden = stats.pairs.length > 0;
		for (const [index, pair] of stats.pairs.slice(0, 3).entries()) {
			const item = document.createElement('li');
			item.className = 'stats-pair';
			item.setAttribute(
				'aria-label',
				`${pair.names.join('과 ')}: 같은 팀 ${pair.together}번 중 ${pair.wins}번 승리`
			);
			const rank = document.createElement('span');
			rank.className = 'stats-pair-rank';
			rank.setAttribute('aria-hidden', 'true');
			rank.textContent = String(index + 1);
			const faces = document.createElement('span');
			faces.className = 'stats-pair-faces';
			faces.setAttribute('aria-hidden', 'true');
			for (const [faceIndex, pairName] of pair.names.entries()) {
				const face = document.createElement('span');
				face.className = 'stats-face';
				face.dataset.tone = ['blue', 'green', 'orange'][faceIndex % 3];
				face.textContent = pairName.slice(0, 1);
				faces.append(face);
			}
			const names = document.createElement('strong');
			names.className = 'stats-pair-names';
			names.textContent = pair.names.join(' + ');
			const record = document.createElement('span');
			record.className = 'stats-pair-record';
			record.textContent = `${pair.wins}승 ${pair.losses}패`;
			const rate = document.createElement('span');
			rate.className = 'stats-pair-rate';
			const rateText = document.createElement('strong');
			rateText.textContent = formatPercent(pair.winRate);
			const rateBar = document.createElement('span');
			rateBar.className = 'stats-pair-bar';
			rateBar.setAttribute('aria-hidden', 'true');
			const rateFill = document.createElement('span');
			rateFill.style.width = formatPercent(pair.winRate);
			rateBar.append(rateFill);
			rate.append(rateText, rateBar);
			item.append(rank, faces, names, record, rate);
			pairs.append(item);
		}

		const rows = $('#player-stats-rows');
		rows.replaceChildren();
		for (const [index, player] of stats.players.entries()) {
			const row = document.createElement('tr');
			const rank = document.createElement('td');
			rank.className = 'col-rank';
			if (index < 3) {
				const image = document.createElement('img');
				image.className = 'rank-laurel';
				image.src = assetUrl(`laurel-${index + 1}.png`);
				image.alt = `${index + 1}위`;
				rank.append(image);
			} else {
				rank.textContent = String(index + 1);
			}
			const name = document.createElement('th');
			name.scope = 'row';
			name.textContent = player.name;
			row.append(rank, name);
			for (const [valueIndex, value] of [
				player.matches,
				player.wins,
				player.losses,
				player.picks
			].entries()) {
				const cell = document.createElement('td');
				if (valueIndex === 1) cell.className = 'num-win';
				if (valueIndex === 2) cell.className = 'num-lose';
				if (valueIndex === 3 && value > 0) cell.className = 'num-pick';
				cell.textContent = valueIndex === 3 ? `${value}회` : String(value);
				row.append(cell);
			}
			rows.append(row);
		}
	}
	function connect() {
		// error는 버블링하지 않으므로 캡처 단계에서 처리합니다.
		on(
			root,
			'error',
			(event) => {
				const image = event.target;
				const fallbackUrl = statsImageFallbacks.get(image);
				if (!fallbackUrl) return;
				statsImageFallbacks.delete(image);
				image.parentElement.style.setProperty('--stats-leader-icon-image', `url("${fallbackUrl}")`);
				image.src = fallbackUrl;
			},
			true
		);

		on($('#open-player-stats-button'), 'click', () => {
			renderPlayerStats();
			showDialog($('#player-stats-dialog'), '.dialog-close');
		});

		on($('#clear-today-button'), 'click', clearTodayHistory);

		on($('#today-history-toggle'), 'click', () => {
			todayHistoryExpanded = !todayHistoryExpanded;
			renderTodayHistory();
		});

		on($('#open-history-button'), 'click', () => {
			renderHistoryDialog();
			setHistoryTab(historyTab);
			showDialog($('#history-dialog'), '.dialog-close');
		});

		on($('#history-log-tab'), 'click', () => setHistoryTab('log'));

		on($('#history-stats-tab'), 'click', () => setHistoryTab('stats'));

		on($('#history-sort-button'), 'click', () => {
			const menu = $('#history-sort-menu');
			menu.hidden = !menu.hidden;
			$('#history-sort-button').setAttribute('aria-expanded', String(!menu.hidden));
		});

		on($('#history-sort-menu'), 'click', (event) => {
			const button = event.target.closest('[data-history-sort]');
			if (!button) return;
			historySort = button.dataset.historySort;
			$('#history-sort-menu').hidden = true;
			$('#history-sort-button').setAttribute('aria-expanded', 'false');
			renderHistoryOverview();
		});

		on($('#history-search'), 'input', (event) => {
			historySearch = event.target.value;
			renderHistoryOverview();
		});

		on($('#today-history-list'), 'click', (event) => {
			const id = event.target.closest('[data-history-remove]')?.dataset.historyRemove;
			if (id) deleteHistory(id);
		});

		on($('#history-groups'), 'click', (event) => {
			const id = event.target.closest('[data-history-remove]')?.dataset.historyRemove;
			if (id) deleteHistory(id);
		});
		scheduleTodayHistoryReset();
		on(root, 'click', (event) => {
			if (!event.target.closest('.overview-sort-wrap')) {
				$('#history-sort-menu').hidden = true;
				$('#history-sort-button').setAttribute('aria-expanded', 'false');
			}
		});
	}
	function destroy() {
		lifetime.destroy();
	}
	return {
		connect,
		destroy,
		renderTodayHistory,
		renderHistoryDialog,
		recordRank,
		undoRank,
		syncPicksToHistory
	};
}
