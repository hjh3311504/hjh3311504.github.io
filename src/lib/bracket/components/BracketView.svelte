<script>
	import { Button } from '$lib/components/ui';
	import { CARD_HEADER, layoutBracket } from '$lib/bracket/layout.js';
	import BracketTrophy from './BracketTrophy.svelte';

	// interactive가 false면 인쇄용으로 그린다. 버튼 대신 글자를 쓰고 모양은 화면과 같게 둔다.
	// zoom은 넓은 화면에서 창 높이에 맞춰 줄이는 배율이다.
	// textFirst면 많이 줄었을 때 읽히도록 카드 제목·보조 글자를 숨기고 팀 이름을 키운다.
	let {
		rounds,
		teams,
		dimensions,
		champion = null,
		nextId = null,
		mirror = false,
		zoom = 1,
		focusId = null,
		textFirst = false,
		interactive = true,
		onpick = () => {},
		pickLabel = () => ''
	} = $props();

	let teamsById = $derived(new Map(teams.map((team) => [team.id, team])));
	let hasMembers = $derived(teams.some((team) => team.members.length));
	let layout = $derived(layoutBracket(rounds, dimensions, hasMembers, { mirror }));
	let championTeam = $derived(champion ? teamsById.get(champion) : null);

	/** 카드 위 경기 이름. 결승은 경기가 하나뿐이라 라운드 이름을 쓴다. */
	function matchTitle(match) {
		if (match.auto) return '부전승';
		return match.next === null ? rounds[match.round].label : `${match.number}경기`;
	}

	/** 아직 정해지지 않은 자리가 어느 경기의 승자를 기다리는지 알려 준다. */
	function sourceLabel(match, side) {
		const round = rounds[match.round - 1];
		const source = round?.matches[side.from];
		if (!source) return '';
		return source.auto ? `${round.label} 부전승` : `${round.label} ${source.number}경기`;
	}

	// 글자 위주 카드는 팀원 줄을 숨기므로 팀 이름에 올리면 보이게 한다.
	function memberTitle(team) {
		return textFirst && team.members.length
			? `${team.name}: ${team.members.join(', ')}`
			: undefined;
	}

	function byeNote(match) {
		const next = rounds[match.round + 1];
		return next ? `${next.label} 직행` : '다음 라운드로';
	}
</script>

{#snippet pickMark(won)}
	<span class="bracket-pick" class:bracket-pick-on={won} aria-hidden="true">
		{#if won}<svg viewBox="0 0 24 24"><path d="M6 12.5l4 4 8-9" /></svg>{/if}
	</span>
{/snippet}

<div
	class="bracket-view"
	class:bracket-view-print={!interactive}
	class:bracket-view-members={hasMembers}
	class:bracket-view-mirror={layout.mirror}
	class:bracket-view-text-first={textFirst}
	style:width={`${layout.width}px`}
	style:height={`${layout.height}px`}
	style:zoom={zoom === 1 ? undefined : zoom}
	style:--bracket-card-width={`${dimensions.cardWidth}px`}
	style:--bracket-card-height={`${layout.cardHeight}px`}
	style:--bracket-card-header={`${CARD_HEADER}px`}
	style:--bracket-row-height={`${layout.row}px`}
>
	<svg class="bracket-lines" width={layout.width} height={layout.height} aria-hidden="true">
		{#each layout.paths as path (path.id)}
			<path d={path.d} class:bracket-line-done={path.done} />
		{/each}
	</svg>
	{#each layout.columns as column, index (index)}
		<div class="bracket-round-label" style:left={`${column.x}px`} data-column={index}>
			{column.label}
		</div>
	{/each}
	{#each layout.cards as { match, x, y } (match.id)}
		{@const next = match.id === nextId}
		<div
			class="bracket-match"
			class:bracket-match-bye={match.auto}
			class:bracket-match-next={next}
			class:bracket-match-focus={match.id === focusId}
			style:left={`${x}px`}
			style:top={`${y}px`}
			data-match={match.id}
		>
			<div class="bracket-match-head">
				<span class="bracket-match-title">{matchTitle(match)}</span>
				{#if next}<span class="bracket-match-badge">다음 경기</span>{/if}
			</div>
			{#each match.sides as side, sideIndex (sideIndex)}
				{@const team = side.kind === 'team' ? teamsById.get(side.team) : null}
				{@const won = match.winner !== undefined && side.team === match.winner}
				{@const lost = match.winner !== undefined && side.kind === 'team' && !won}
				{#if team && interactive && match.playable}
					<Button
						variant="ghost"
						class={['bracket-side', won && 'bracket-side-won', lost && 'bracket-side-lost']
							.filter(Boolean)
							.join(' ')}
						aria-pressed={won}
						aria-label={pickLabel(match, team)}
						onclick={() => onpick(match, team.id)}
					>
						<span class="bracket-side-text">
							<span class="bracket-side-name" title={memberTitle(team)}>{team.name}</span>
							{#if team.members.length}<span
									class="bracket-side-members"
									title={team.members.join(', ')}>{team.members.join(', ')}</span
								>{/if}
						</span>
						{@render pickMark(won)}
					</Button>
				{:else}
					<div
						class="bracket-side"
						class:bracket-side-won={won}
						class:bracket-side-lost={lost}
						class:bracket-side-empty={side.kind === 'pending'}
						class:bracket-side-bye={side.kind === 'bye'}
					>
						<span class="bracket-side-text">
							{#if team}
								<span class="bracket-side-name" title={memberTitle(team)}>{team.name}</span>
								{#if team.members.length}<span class="bracket-side-members"
										>{team.members.join(', ')}</span
									>{/if}
							{:else if side.kind === 'bye'}
								<span class="bracket-side-name">부전승</span>
								<span class="bracket-side-members">{byeNote(match)}</span>
							{:else}
								{#if textFirst}
									<span class="bracket-side-name" aria-hidden="true">—</span>
									<span class="bracket-sr-only">앞 경기 승자 {sourceLabel(match, side)}</span>
								{:else}
									<span class="bracket-side-name">앞 경기 승자</span>
									<span class="bracket-side-members">{sourceLabel(match, side)}</span>
								{/if}
							{/if}
						</span>
						{#if team && (match.playable || won)}{@render pickMark(won)}{/if}
					</div>
				{/if}
			{/each}
		</div>
	{/each}
	<div
		class="bracket-champion"
		class:bracket-champion-decided={championTeam}
		style:left={`${layout.champion.x}px`}
		style:top={`${layout.champion.y}px`}
		style:height={`${layout.champion.height}px`}
	>
		<BracketTrophy />
		<span class="bracket-champion-name">{championTeam?.name ?? '–'}</span>
		<span class="bracket-champion-label">{championTeam ? '우승' : '결승 승자'}</span>
	</div>
</div>
