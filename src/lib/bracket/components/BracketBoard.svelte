<script>
	import { onMount, tick } from 'svelte';
	import { Button, EmptyState, IconButton, Section, SectionHeader } from '$lib/components/ui';
	import {
		bracketMeta,
		bracketProgress,
		deriveRounds,
		setWinner,
		statusText
	} from '$lib/bracket/bracket.js';
	import { fitBracket, screenDimensions, shouldMirror } from '$lib/bracket/layout.js';
	import BracketView from './BracketView.svelte';
	import BracketTrophy from './BracketTrophy.svelte';
	import BracketConfirmDialog from './BracketConfirmDialog.svelte';

	let { bracket, onchange, onnew, onprint } = $props();

	let root = $state();
	let scroller = $state();
	let fullscreenButton = $state();
	let confirmDialog = $state();
	let fullscreenSupported = $state(false);
	let fullscreen = $state(false);
	let compact = $state(false);
	let currentColumn = $state(0);
	let fullscreenError = $state('');

	let rounds = $derived(bracket ? deriveRounds(bracket) : []);
	let progress = $derived(bracket ? bracketProgress(bracket) : null);
	let dimensions = $derived(compact ? screenDimensions.compact : screenDimensions.wide);
	let columns = $derived([...rounds.map((round) => round.label), '우승']);
	let hasMembers = $derived(bracket?.teams.some((team) => team.members.length) ?? false);
	// 넓은 화면은 대진표 섹션이 창 높이 안에 들어오도록 줄이고, 덜 줄여도 되는 배치(한 방향·대칭)를 고른다.
	// 좁은 화면은 라운드 탭으로 열을 넘기므로 줄이지 않고 대칭 배치도 쓰지 않는다.
	let area = $state(null);
	let fit = $derived.by(() => {
		if (compact || !rounds.length) return { mirror: false, zoom: 1 };
		if (!area) return { mirror: shouldMirror(rounds), zoom: 1 };
		const result = fitBracket(rounds, dimensions, hasMembers, area.width, area.height);
		return { mirror: result.mirror, zoom: Math.max(MIN_ZOOM, result.zoom) };
	});
	let mirror = $derived(fit.mirror);
	// 사용자가 고른 배율과 그때의 첫 라운드 배치. 배치가 다른 대진표를 만들면 창에 맞춘 배율로 돌아간다.
	// 승자 기록은 첫 라운드 배치를 바꾸지 않으므로 고른 배율을 유지한다.
	let userZoom = $state(null);
	let layoutKey = $derived(bracket?.slots.join('|') ?? '');
	let chosenZoom = $derived(userZoom?.layout === layoutKey ? userZoom.value : null);
	let zoom = $derived(compact ? 1 : (chosenZoom ?? fit.zoom));
	// 버튼으로 배율을 바꿀 때만 화면 낭독기에 알린다. 창 크기에 따라 바뀌는 배율은 읽지 않는다.
	let zoomMessage = $state('');
	// 이 배율보다 작으면 카드 글자가 읽기 어려워 글자 위주 카드로 바꾼다.
	const TEXT_FIRST_BELOW = 0.7;
	let textFirst = $derived(zoom < TEXT_FIRST_BELOW);
	// 경기로 이동으로 포커스를 옮긴 카드. 포커스가 카드를 떠나면 표시를 지운다.
	let focusId = $state(null);
	let status = $derived(bracket ? statusText(bracket) : '');
	let meta = $derived(bracket ? bracketMeta(bracket) : '');

	const matchLabel = (match) => `${rounds[match.round].label} ${match.number}경기`;

	let teamsById = $derived(new Map((bracket?.teams ?? []).map((team) => [team.id, team])));
	let percent = $derived(progress?.total ? Math.round((progress.done / progress.total) * 100) : 0);
	let nextTeams = $derived(
		progress?.next?.sides.map((side) => teamsById.get(side.team)?.name ?? '') ?? []
	);
	let championName = $derived(progress?.champion ? teamsById.get(progress.champion)?.name : '');

	// 페이지는 스크롤하지 않고 다음 경기 카드의 첫 팀 버튼에 포커스를 옮긴다.
	// 마우스로 눌러도 위치가 보이도록 카드에 포커스 표시를 둔다.
	function showNext() {
		const next = progress.next;
		const card = scroller?.querySelector(`[data-match="${next?.id}"]`);
		if (!card) return;
		focusId = next.id;
		revealCard(card, next.round);
		card.querySelector('button')?.focus({ preventScroll: true });
	}

	// 카드가 대진표 영역 밖에 있으면 영역 안에서만 옆으로 넘긴다. 좁은 화면은 그 라운드 탭으로 바꾼다.
	function revealCard(card, round) {
		if (compact) {
			showColumn(round);
			return;
		}
		const view = scroller.getBoundingClientRect();
		const box = card.getBoundingClientRect();
		if (box.left >= view.left && box.right <= view.right) return;
		scroller.scrollTo({
			left: scroller.scrollLeft + box.left - view.left - (view.width - box.width) / 2,
			behavior: scrollBehavior()
		});
	}

	function clearFocus(event) {
		if (focusId && !event.relatedTarget?.closest?.(`[data-match="${focusId}"]`)) focusId = null;
	}

	const ZOOM_STEPS = [0.5, 0.67, 0.8, 1, 1.25, 1.5, 2];
	const zoomPercent = (value) => `${Math.round(value * 100)}%`;

	/** 지금 배율에서 한 단계 크게(1) 또는 작게(-1) 바꾼다. */
	function zoomBy(direction) {
		const next =
			direction > 0
				? ZOOM_STEPS.find((step) => step > zoom + 0.005)
				: ZOOM_STEPS.findLast((step) => step < zoom - 0.005);
		if (next === undefined) return;
		userZoom = { layout: layoutKey, value: next };
		zoomMessage = `대진표 크기 ${zoomPercent(next)}`;
	}

	function fitScreen() {
		userZoom = null;
		zoomMessage = `대진표 크기 화면 맞춤 ${zoomPercent(fit.zoom)}`;
	}

	function pick(match, team) {
		const result = setWinner(bracket, match.id, team);
		if (!result.changed) return;
		if (!result.cleared) {
			onchange(result.bracket);
			return;
		}
		const cancelling = bracket.winners[match.id] === team;
		confirmDialog.open({
			title: cancelling ? '승자를 취소할까요?' : '승자를 바꿀까요?',
			description: `${matchLabel(match)} 결과를 ${cancelling ? '취소하면' : '바꾸면'} 이후 경기 ${result.cleared}개의 결과가 지워져요.`,
			confirmLabel: cancelling ? '취소하기' : '바꾸기',
			cancelLabel: '그대로 두기',
			onconfirm: () => onchange(result.bracket)
		});
	}

	// 이보다 작으면 글자를 읽기 어려워 더 줄이지 않고 스크롤로 본다.
	const MIN_ZOOM = 0.5;
	// 창 위아래에 남길 여백
	const FIT_MARGIN = 16;

	/** 대진표 그림이 쓸 수 있는 폭과 높이를 잰다. 대진표 위 내용과 섹션 아래 여백을 창 높이에서 뺀다. */
	function measure() {
		if (!scroller || compact) return;
		const section = scroller.closest('.bracket-board');
		const own = getComputedStyle(scroller);
		const box = getComputedStyle(section);
		const outer = fullscreen ? getComputedStyle(root) : null;
		const above = scroller.getBoundingClientRect().top - section.getBoundingClientRect().top;
		const below = parseFloat(box.paddingBottom) + parseFloat(box.borderBottomWidth);
		const margin = outer
			? parseFloat(outer.paddingTop) + parseFloat(outer.paddingBottom)
			: FIT_MARGIN * 2;
		const width = Math.floor(
			scroller.clientWidth - parseFloat(own.paddingLeft) - parseFloat(own.paddingRight)
		);
		const height = Math.floor(
			window.innerHeight -
				above -
				below -
				parseFloat(own.paddingTop) -
				parseFloat(own.paddingBottom) -
				margin
		);
		if (area?.width !== width || area?.height !== height) area = { width, height };
	}

	// 대진표 위 내용(제목·안내)이나 화면 모드가 바뀌면 다시 잰다.
	$effect(() => {
		void [scroller, compact, fullscreen, status, bracket?.title];
		tick().then(measure);
	});

	$effect(() => {
		if (!scroller) return;
		const observer = new ResizeObserver(measure);
		observer.observe(scroller);
		window.addEventListener('resize', measure);
		return () => {
			observer.disconnect();
			window.removeEventListener('resize', measure);
		};
	});

	function updateColumn() {
		if (!scroller) return;
		const step = dimensions.cardWidth + dimensions.gap;
		const maxScroll = scroller.scrollWidth - scroller.clientWidth;
		// 끝까지 넘기면 마지막 열이 일부만 보여도 현재 열로 표시한다.
		currentColumn =
			maxScroll > 0 && scroller.scrollLeft >= maxScroll - 2
				? columns.length - 1
				: Math.min(columns.length - 1, Math.round(scroller.scrollLeft / step));
	}

	const scrollBehavior = () =>
		matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth';

	function showColumn(index) {
		scroller?.scrollTo({
			left: index * (dimensions.cardWidth + dimensions.gap),
			behavior: scrollBehavior()
		});
		currentColumn = index;
	}

	async function toggleFullscreen() {
		fullscreenError = '';
		try {
			if (document.fullscreenElement) await document.exitFullscreen();
			else await root.requestFullscreen();
		} catch {
			fullscreenError = '전체화면을 열지 못했어요. 브라우저 설정을 확인해 주세요.';
		}
	}

	onMount(() => {
		fullscreenSupported = Boolean(document.fullscreenEnabled && root?.requestFullscreen);
		const query = matchMedia('(max-width: 960px)');
		const updateCompact = () => (compact = query.matches);
		updateCompact();
		query.addEventListener('change', updateCompact);
		const onFullscreen = () => {
			const active = document.fullscreenElement === root;
			if (fullscreen && !active) fullscreenButton?.focus();
			fullscreen = active;
		};
		document.addEventListener('fullscreenchange', onFullscreen);
		return () => {
			query.removeEventListener('change', updateCompact);
			document.removeEventListener('fullscreenchange', onFullscreen);
			if (document.fullscreenElement === root) document.exitFullscreen().catch(() => {});
		};
	});
</script>

<div class="bracket-board-root" class:bracket-board-fullscreen={fullscreen} bind:this={root}>
	<Section
		variant="card"
		padding="card"
		gap="body"
		class="bracket-board"
		id="bracket-board"
		aria-labelledby="bracket-board-title"
	>
		<SectionHeader
			step={3}
			title="대진표"
			titleId="bracket-board-title"
			actionsClass="bracket-board-actions"
		>
			{#snippet titleSuffix()}
				{#if bracket}<span class="bracket-team-count">{meta}</span>{/if}
			{/snippet}
			{#snippet actions()}
				{#if bracket && fullscreenSupported}
					<Button size="sm" bind:element={fullscreenButton} onclick={toggleFullscreen}>
						<svg class="bracket-button-icon" viewBox="0 0 24 24" aria-hidden="true">
							{#if fullscreen}
								<path d="M9 4v5H4M15 4v5h5M9 20v-5H4M15 20v-5h5" />
							{:else}
								<path d="M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5" />
							{/if}
						</svg>
						{fullscreen ? '전체화면 닫기' : '전체화면'}
					</Button>
				{/if}
				{#if bracket && !fullscreen}
					<Button size="sm" onclick={onprint}>
						<svg class="bracket-button-icon" viewBox="0 0 24 24" aria-hidden="true">
							<path
								d="M7 9V4h10v5M7 17H5a2 2 0 0 1-2-2v-4a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v4a2 2 0 0 1-2 2h-2"
							/>
							<path d="M7 14h10v6H7z" />
						</svg>
						인쇄
					</Button>
					<Button size="sm" onclick={onnew}>
						<svg class="bracket-button-icon" viewBox="0 0 24 24" aria-hidden="true">
							<path d="M12 5v14M5 12h14" />
						</svg>
						새 대진표
					</Button>
				{/if}
			{/snippet}
		</SectionHeader>
		{#if fullscreenError}<p class="bracket-note" role="alert">{fullscreenError}</p>{/if}
		{#if bracket}
			<div class="bracket-board-heading">
				{#if bracket.title}<p class="bracket-board-name">{bracket.title}</p>{/if}
				<p class="bracket-status bracket-sr-only" aria-live="polite">{status}</p>
				<div class="bracket-progress">
					<div class="bracket-progress-overall" aria-hidden="true">
						<p class="bracket-progress-title">전체 진행</p>
						<div class="bracket-progress-line">
							<span class="bracket-progress-count"
								>전체 경기({progress.done}/{progress.total}) · {progress.champion
									? '모든 경기 끝남'
									: `${progress.round?.label} 진행 중`}</span
							>
							<span class="bracket-progress-bar">
								<span style:width={`${(progress.done / progress.total) * 100}%`}></span>
							</span>
							<strong class="bracket-progress-percent">{percent}%</strong>
						</div>
					</div>
					{#if championName}
						<div class="bracket-progress-side">
							<p class="bracket-progress-title">우승</p>
							<p class="bracket-progress-teams bracket-progress-champion">
								<BracketTrophy class="bracket-progress-trophy" />{championName}
							</p>
						</div>
					{:else if progress.next}
						<div class="bracket-progress-side">
							<p class="bracket-progress-title">
								다음 경기 · {progress.next.label}
								{progress.next.number}경기({progress.round.done}/{progress.round.total})
							</p>
							<div class="bracket-progress-match">
								<p class="bracket-progress-teams" title={nextTeams.join(' vs ')}>
									{nextTeams[0]} <span class="bracket-progress-vs">vs</span>
									{nextTeams[1]}
								</p>
								<Button
									variant="ghost"
									size="sm"
									class="bracket-progress-go"
									aria-label={`다음 경기 ${progress.next.label} ${progress.next.number}경기로 이동`}
									onclick={showNext}
								>
									경기로 이동
									<svg class="bracket-button-icon" viewBox="0 0 24 24" aria-hidden="true">
										<path d="M5 12h14M13 6l6 6-6 6" />
									</svg>
								</Button>
							</div>
						</div>
					{/if}
				</div>
				<div class="bracket-board-tools">
					{#if !compact}
						<div class="bracket-zoom" role="group" aria-label="대진표 크기">
							<IconButton
								variant="outline"
								label="대진표 축소"
								disabled={zoom <= ZOOM_STEPS[0] + 0.005}
								onclick={() => zoomBy(-1)}
							>
								<svg class="bracket-button-icon" viewBox="0 0 24 24" aria-hidden="true">
									<path d="M5 12h14" />
								</svg>
							</IconButton>
							<span class="bracket-zoom-value">{zoomPercent(zoom)}</span>
							<IconButton
								variant="outline"
								label="대진표 확대"
								disabled={zoom >= ZOOM_STEPS.at(-1) - 0.005}
								onclick={() => zoomBy(1)}
							>
								<svg class="bracket-button-icon" viewBox="0 0 24 24" aria-hidden="true">
									<path d="M12 5v14M5 12h14" />
								</svg>
							</IconButton>
							<Button variant="ghost" size="sm" disabled={chosenZoom === null} onclick={fitScreen}
								>화면 맞춤</Button
							>
							<span class="bracket-sr-only" aria-live="polite">{zoomMessage}</span>
						</div>
					{/if}
					{#if !progress.champion}
						<p class="bracket-board-hint">
							<svg class="bracket-button-icon" viewBox="0 0 24 24" aria-hidden="true">
								<circle cx="12" cy="12" r="9" />
								<path d="M12 11v5M12 8h.01" />
							</svg>
							이긴 팀을 눌러 승자를 기록하세요.
						</p>
					{/if}
				</div>
			</div>
			{#if compact}
				<div class="bracket-tabs" role="group" aria-label="라운드로 이동">
					{#each columns as label, index (index)}
						<Button
							size="sm"
							variant={currentColumn === index ? 'primary' : 'outline'}
							aria-current={currentColumn === index ? 'true' : undefined}
							onclick={() => showColumn(index)}>{label}</Button
						>
					{/each}
				</div>
			{/if}
			<div
				class="bracket-scroller"
				bind:this={scroller}
				onscroll={updateColumn}
				onfocusout={clearFocus}
			>
				<BracketView
					{rounds}
					teams={bracket.teams}
					{dimensions}
					champion={progress.champion}
					nextId={progress.next?.id ?? null}
					{mirror}
					{zoom}
					{focusId}
					{textFirst}
					onpick={pick}
					pickLabel={(match, team) => `${matchLabel(match)}, ${team.name}을(를) 승자로 정하기`}
				/>
			</div>
		{:else}
			<EmptyState title="아직 대진표가 없어요" description="팀을 넣고 대진표를 만들어 보세요." />
		{/if}
	</Section>
	<BracketConfirmDialog id="bracket-winner-confirm" bind:this={confirmDialog} />
</div>
