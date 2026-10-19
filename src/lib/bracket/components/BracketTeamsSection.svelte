<script>
	import { tick } from 'svelte';
	import { flip } from 'svelte/animate';
	import { Button, EmptyState, IconButton, Section, SectionHeader } from '$lib/components/ui';
	import RemoveRowButton from '$lib/components/ui/RemoveRowButton.svelte';
	import { MAX_TEAMS } from '$lib/bracket/bracket.js';
	import { parseBulkTeams } from '$lib/bracket/teams.js';

	let { teams, errors, onrename, onremove, onadd, onmove, onclear, onbulk } = $props();
	let full = $derived(teams.length >= MAX_TEAMS);
	let draft = $state('');
	let addError = $state('');
	let announcement = $state('');
	let dragging = $state(null);
	let list = $state();
	let input = $state();
	let reduceMotion = $state(false);

	$effect(() => {
		const query = window.matchMedia('(prefers-reduced-motion: reduce)');
		reduceMotion = query.matches;
		const update = () => (reduceMotion = query.matches);
		query.addEventListener('change', update);
		return () => query.removeEventListener('change', update);
	});

	const teamLabel = (team, index) => team.name.trim() || `${index + 1}번 팀`;

	async function submit(event) {
		event.preventDefault();
		const result = parseBulkTeams(draft, { existing: teams.map((team) => team.name) });
		if (result.error) {
			addError = result.error;
			return;
		}
		onadd(result.names);
		announcement = `팀 ${result.names.length}개를 추가했어요.`;
		draft = '';
		addError = '';
		// 목록이 길면 안에서 스크롤되므로 방금 넣은 팀이 보이게 맨 아래로 내린다.
		await tick();
		list?.scrollTo({ top: list.scrollHeight });
		// 추가 버튼을 눌러도 바로 다음 팀을 입력하게 한다. 32팀이 차서 입력칸이 꺼지면 두지 않는다.
		if (!input?.disabled) input?.focus({ preventScroll: true });
	}

	async function move(id, to) {
		const from = teams.findIndex((team) => team.id === id);
		if (from === -1 || to < 0 || to >= teams.length || from === to) return;
		const label = teamLabel(teams[from], from);
		onmove(from, to);
		announcement = `${label}을(를) ${to + 1}번으로 옮겼어요.`;
		// 행이 옮겨지면 포커스가 풀리므로 손잡이에 다시 둔다.
		await tick();
		document.getElementById(`bracket-team-handle-${id}`)?.focus();
	}

	function handleKey(event, id, index) {
		const to = {
			ArrowUp: index - 1,
			ArrowDown: index + 1,
			Home: 0,
			End: teams.length - 1
		}[event.key];
		if (to === undefined) return;
		event.preventDefault();
		move(id, to);
	}

	// 끄는 동안 손가락 위치보다 가운데가 위에 있는 다른 행 수가 새 위치다.
	// 이동 효과의 transform에 흔들리지 않도록 offsetTop으로 계산하고, 목록 안 스크롤 양을 더한다.
	function dropIndex(clientY) {
		const y = clientY - list.getBoundingClientRect().top - list.clientTop + list.scrollTop;
		const rows = [...list.children].filter((row) => row.dataset.id !== dragging);
		return rows.filter((row) => row.offsetTop + row.offsetHeight / 2 < y).length;
	}

	// 행이 DOM에서 옮겨지면 손잡이의 pointer capture가 풀리므로 window에서 움직임을 받는다.
	function startDrag(event, id) {
		if (event.button !== 0) return;
		event.preventDefault();
		dragging = id;
		window.addEventListener('pointermove', dragMove);
		window.addEventListener('pointerup', endDrag);
		window.addEventListener('pointercancel', endDrag);
	}

	function reorderAt(clientY) {
		const to = dropIndex(clientY);
		const from = teams.findIndex((team) => team.id === dragging);
		if (from !== -1 && to !== from) onmove(from, to);
	}

	function dragMove(event) {
		if (!dragging) return;
		pointerY = event.clientY;
		reorderAt(pointerY);
		if (!frame) frame = requestAnimationFrame(autoScroll);
	}

	// 목록 위·아래 가장자리 근처로 끌면 목록을 조금씩 스크롤해 가려진 자리로도 옮길 수 있게 한다.
	const SCROLL_EDGE = 40;
	const SCROLL_MAX = 16;
	let pointerY = 0;
	let frame = 0;
	function autoScroll() {
		frame = 0;
		if (!dragging || !list) return;
		const box = list.getBoundingClientRect();
		const over =
			pointerY < box.top + SCROLL_EDGE
				? pointerY - (box.top + SCROLL_EDGE)
				: pointerY > box.bottom - SCROLL_EDGE
					? pointerY - (box.bottom - SCROLL_EDGE)
					: 0;
		if (!over) return;
		const before = list.scrollTop;
		list.scrollTop += Math.max(-SCROLL_MAX, Math.min(SCROLL_MAX, over / 2));
		if (list.scrollTop === before) return;
		reorderAt(pointerY);
		frame = requestAnimationFrame(autoScroll);
	}

	function endDrag() {
		cancelAnimationFrame(frame);
		frame = 0;
		window.removeEventListener('pointermove', dragMove);
		window.removeEventListener('pointerup', endDrag);
		window.removeEventListener('pointercancel', endDrag);
		if (!dragging) return;
		const index = teams.findIndex((team) => team.id === dragging);
		if (index !== -1) {
			announcement = `${teamLabel(teams[index], index)}을(를) ${index + 1}번에 두었어요.`;
		}
		dragging = null;
	}

	// 끄는 도중 화면을 떠나도 window 이벤트를 남기지 않는다.
	$effect(() => endDrag);
</script>

<Section
	variant="card"
	padding="card"
	gap="body"
	class="bracket-panel"
	aria-labelledby="bracket-teams-title"
>
	<SectionHeader step={1} title="팀 입력" titleId="bracket-teams-title">
		{#snippet titleSuffix()}
			<span class="bracket-team-count">({teams.length}/{MAX_TEAMS}팀)</span>
		{/snippet}
		{#snippet actions()}
			<IconButton
				class="bracket-clear-button"
				variant="outline"
				label="팀 목록 비우기"
				disabled={!teams.length}
				onclick={onclear}
			>
				<svg
					width="16"
					height="16"
					viewBox="0 0 24 24"
					fill="none"
					stroke="currentColor"
					stroke-width="2"
					stroke-linecap="round"
					stroke-linejoin="round"
					aria-hidden="true"
				>
					<path d="M3 6h18"></path>
					<path d="M8 6V4a1 1 0 0 1 1-1h6a1 1 0 0 1 1 1v2"></path>
					<path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"></path>
					<path d="M10 11v6"></path>
					<path d="M14 11v6"></path>
				</svg>
			</IconButton>
		{/snippet}
	</SectionHeader>
	<p class="bracket-help" id="bracket-team-help">
		팀 이름을 적고 엔터를 누르면 목록에 추가돼요. 쉼표로 여러 팀도 넣을 수 있어요.
	</p>
	<form class="bracket-add-form" onsubmit={submit}>
		<label class="bracket-sr-only" for="bracket-team-name">새 팀 이름</label>
		<input
			class="ui-field"
			id="bracket-team-name"
			type="text"
			bind:this={input}
			bind:value={draft}
			oninput={() => (addError = '')}
			placeholder={full ? `팀은 ${MAX_TEAMS}개까지예요` : '예: 호랑이, 늑대'}
			autocomplete="off"
			disabled={full}
			aria-invalid={Boolean(addError)}
			aria-describedby={addError
				? 'bracket-team-help bracket-team-name-error'
				: 'bracket-team-help'}
		/>
		<Button type="submit" variant="soft" size="sm" disabled={full}>추가</Button>
		<Button size="sm" onclick={onbulk}>일괄 추가</Button>
	</form>
	{#if addError}
		<p class="ui-field-help ui-field-error bracket-add-error" id="bracket-team-name-error">
			{addError}
		</p>
	{/if}
	{#if teams.length}
		<p class="bracket-note" id="bracket-team-order-help">
			번호가 시드예요. 손잡이를 끌거나 손잡이에서 위·아래 화살표 키로 순서를 바꿀 수 있어요.
		</p>
		<ol class="bracket-team-list" class:is-sorting={dragging} bind:this={list} aria-label="팀 목록">
			{#each teams as team, index (team.id)}
				<li
					class="bracket-team-row"
					class:is-dragging={dragging === team.id}
					data-id={team.id}
					animate:flip={{ duration: reduceMotion ? 0 : 180 }}
				>
					<IconButton
						class="bracket-team-handle"
						id={`bracket-team-handle-${team.id}`}
						label={`${teamLabel(team, index)} 순서 바꾸기, 지금 ${index + 1}번`}
						aria-describedby="bracket-team-order-help"
						title="끌어서 순서 바꾸기"
						onkeydown={(event) => handleKey(event, team.id, index)}
						onpointerdown={(event) => startDrag(event, team.id)}
					>
						<svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor" aria-hidden="true">
							<circle cx="5.5" cy="3.5" r="1.25" />
							<circle cx="10.5" cy="3.5" r="1.25" />
							<circle cx="5.5" cy="8" r="1.25" />
							<circle cx="10.5" cy="8" r="1.25" />
							<circle cx="5.5" cy="12.5" r="1.25" />
							<circle cx="10.5" cy="12.5" r="1.25" />
						</svg>
					</IconButton>
					<span class="bracket-team-number" aria-hidden="true">{index + 1}</span>
					<div class="bracket-team-field">
						<input
							class="ui-field"
							id={`bracket-team-${team.id}`}
							value={team.name}
							oninput={(event) => onrename(team.id, event.currentTarget.value)}
							placeholder="팀 이름"
							aria-label={`${index + 1}번 팀 이름`}
							aria-invalid={Boolean(errors[team.id])}
							aria-describedby={[
								errors[team.id] && `bracket-team-${team.id}-error`,
								team.members.length && `bracket-team-${team.id}-members`
							]
								.filter(Boolean)
								.join(' ') || undefined}
						/>
						{#if team.members.length}
							<p
								class="bracket-team-members"
								id={`bracket-team-${team.id}-members`}
								title={team.members.join(', ')}
							>
								팀원 {team.members.join(', ')}
							</p>
						{/if}
						{#if errors[team.id]}
							<p class="ui-field-help ui-field-error" id={`bracket-team-${team.id}-error`}>
								{errors[team.id]}
							</p>
						{/if}
					</div>
					<RemoveRowButton
						label={`${teamLabel(team, index)} 삭제`}
						onclick={() => onremove(team.id)}
					/>
				</li>
			{/each}
		</ol>
	{:else}
		<EmptyState as="p" class="bracket-team-empty">
			아직 팀이 없어요. 위 칸에 팀 이름을 적고 엔터를 누르세요.
		</EmptyState>
	{/if}
	{#if full}<p class="bracket-note">팀은 {MAX_TEAMS}개까지 넣을 수 있어요.</p>{/if}
	<p class="bracket-sr-only" role="status">{announcement}</p>
</Section>
