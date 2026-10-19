<script>
	import { onMount, tick } from 'svelte';
	import SiteShell from '$lib/components/organisms/SiteShell.svelte';
	import ToolPageLayout from '$lib/components/organisms/ToolPageLayout.svelte';
	import ToolPageFooter from '$lib/components/organisms/ToolPageFooter.svelte';
	import BracketTeamsSection from '$lib/bracket/components/BracketTeamsSection.svelte';
	import BracketSettingsSection from '$lib/bracket/components/BracketSettingsSection.svelte';
	import BracketBoard from '$lib/bracket/components/BracketBoard.svelte';
	import BracketGuide from '$lib/bracket/components/BracketGuide.svelte';
	import BracketBulkDialog from '$lib/bracket/components/BracketBulkDialog.svelte';
	import BracketConfirmDialog from '$lib/bracket/components/BracketConfirmDialog.svelte';
	import BracketView from '$lib/bracket/components/BracketView.svelte';
	import { siteBaseUrl, image as shareImage } from '$lib/data/meta.js';
	import {
		MAX_TEAMS,
		bracketProgress,
		bracketSummary,
		createBracket,
		deriveRounds,
		isOutdated,
		resultCount,
		bracketMeta,
		statusText
	} from '$lib/bracket/bracket.js';
	import { fitBracket, screenDimensions } from '$lib/bracket/layout.js';
	import {
		TITLE_MAX,
		createTeam,
		moveTeam,
		validateTeams,
		visibleLength
	} from '$lib/bracket/teams.js';
	import { loadState, saveState, takeImport } from '$lib/bracket/storage.js';
	import './bracket.css';

	const pageTitle = '무료 대진표 만들기 | 토너먼트 부전승 자동 배치';
	const description =
		'팀 이름을 넣으면 2~32팀 토너먼트 대진표를 만들고 부전승을 자동으로 배치합니다. 이긴 팀을 눌러 결승까지 기록하고 전체화면과 A4 인쇄로 공유하세요. 팀 메이커 결과를 그대로 가져올 수 있습니다.';
	const SAVE_DELAY = 200;
	// A4 가로에서 여백 10mm를 뺀 인쇄 영역(277mm×190mm)을 CSS px로 바꾼 값이다.
	const PRINT_WIDTH = 1046;
	const PRINT_HEIGHT = 718;
	// 인쇄 사본 위의 제목·진행 문구·보조 정보와 아래 간격을 합친 높이다.
	const PRINT_HEADING_HEIGHT = 112;

	let teams = $state([]);
	let title = $state('');
	let order = $state('input');
	let bracket = $state(null);
	let ready = $state(false);
	let notice = $state('');
	let saveFailed = $state(false);
	let bulkDialog = $state();
	let confirmDialog = $state();

	let validation = $derived(validateTeams(teams));
	let cleanTitle = $derived(title.trim());
	let titleError = $derived(
		visibleLength(cleanTitle) > TITLE_MAX ? `제목은 ${TITLE_MAX}자까지 입력할 수 있어요.` : ''
	);
	let cleanTeams = $derived(teams.map((team) => ({ ...team, name: team.name.trim() })));
	let reason = $derived(validation.reason || titleError);
	let summary = $derived(
		teams.length >= 2 && teams.length <= MAX_TEAMS ? bracketSummary(teams.length) : null
	);
	let outdated = $derived(isOutdated(bracket, { teams: cleanTeams, title: cleanTitle, order }));
	let printLayout = $derived.by(() => {
		if (!bracket) return null;
		const rounds = deriveRounds(bracket);
		const hasMembers = bracket.teams.some((team) => team.members.length);
		const { mirror, zoom } = fitBracket(
			rounds,
			screenDimensions.wide,
			hasMembers,
			PRINT_WIDTH,
			PRINT_HEIGHT - PRINT_HEADING_HEIGHT
		);
		const progress = bracketProgress(bracket);
		return {
			rounds,
			zoom,
			champion: progress.champion,
			nextId: progress.next?.id ?? null,
			mirror,
			status: statusText(bracket),
			meta: bracketMeta(bracket)
		};
	});

	let saveTimer = null;
	let dirty = false;

	function persist() {
		clearTimeout(saveTimer);
		saveTimer = null;
		if (!ready || !dirty) return;
		dirty = false;
		try {
			saveState(localStorage, {
				title,
				order,
				teams: $state.snapshot(teams),
				bracket: $state.snapshot(bracket)
			});
			saveFailed = false;
		} catch {
			if (!saveFailed)
				notice = '브라우저에 저장하지 못했어요. 화면을 닫으면 대진표가 사라질 수 있어요.';
			saveFailed = true;
		}
	}

	$effect(() => {
		// 저장할 값을 읽어 변경을 감지하고 200ms 뒤 한 번에 저장한다.
		JSON.stringify([title, order, teams, bracket]);
		if (!ready) return;
		dirty = true;
		clearTimeout(saveTimer);
		saveTimer = setTimeout(persist, SAVE_DELAY);
	});

	function renameTeam(id, name) {
		teams = teams.map((team) => (team.id === id ? { ...team, name } : team));
	}

	function removeTeam(id) {
		teams = teams.filter((team) => team.id !== id);
	}

	function moveTeamTo(from, to) {
		teams = moveTeam(teams, from, to);
	}

	function requestClear() {
		confirmDialog.open({
			title: '팀 목록을 비울까요?',
			description: `팀 ${teams.length}개를 목록에서 지워요. 만든 대진표와 경기 결과는 그대로 남아요.`,
			confirmLabel: '목록 비우기',
			onconfirm: () => (teams = [])
		});
	}

	function addBulk(names, mode = 'append') {
		const added = names.map((name) => createTeam(name));
		teams = mode === 'replace' ? added : [...teams, ...added];
	}

	async function showBoard() {
		await tick();
		document.getElementById('bracket-board')?.scrollIntoView({ block: 'start' });
	}

	function buildBracket() {
		bracket = createBracket({ teams: cleanTeams, title: cleanTitle, order });
		showBoard();
	}

	function requestBuild() {
		if (reason) return;
		if (bracket && resultCount(bracket)) {
			confirmDialog.open({
				title: '대진표를 다시 만들까요?',
				description: `기록한 경기 결과 ${resultCount(bracket)}개가 지워져요.`,
				confirmLabel: '다시 만들기',
				onconfirm: buildBracket
			});
			return;
		}
		buildBracket();
	}

	function requestNew() {
		const clear = () => (bracket = null);
		if (!bracket || !resultCount(bracket)) {
			clear();
			return;
		}
		confirmDialog.open({
			title: '새 대진표를 시작할까요?',
			description: `팀 목록은 그대로 두고 대진표와 경기 결과 ${resultCount(bracket)}개를 지워요.`,
			confirmLabel: '새 대진표',
			onconfirm: clear
		});
	}

	function applyImport(imported) {
		teams = imported;
		order = 'input';
		bracket = createBracket({
			teams: imported,
			title: titleError ? '' : cleanTitle,
			order: 'input'
		});
		notice = `팀 메이커에서 팀 ${imported.length}개를 가져와 대진표를 만들었어요.`;
		showBoard();
	}

	function flushOnHide() {
		if (document.visibilityState === 'hidden') persist();
	}

	// 저장 공간이 막힌 브라우저는 localStorage를 꺼내기만 해도 예외를 던진다.
	// null을 넘기면 읽기 함수가 읽기 실패로 처리한다.
	function browserStorage() {
		try {
			return localStorage;
		} catch {
			return null;
		}
	}

	onMount(() => {
		const storage = browserStorage();
		const loaded = loadState(storage);
		if (loaded.state) ({ title, order, teams, bracket } = loaded.state);
		if (loaded.error === 'corrupt')
			notice = loaded.state
				? '저장된 대진표를 읽지 못해 지웠어요. 팀 목록은 그대로예요.'
				: '저장된 대진표를 읽지 못해 새로 시작해요.';
		if (loaded.error === 'read')
			notice = '브라우저 저장 공간을 읽지 못했어요. 저장 없이 사용할 수 있어요.';

		const imported = takeImport(storage);
		if (imported.error) notice = imported.error;
		if (imported.teams) {
			if (bracket && resultCount(bracket)) {
				const teamsToImport = imported.teams;
				tick().then(() =>
					confirmDialog.open({
						title: '진행 중인 대진표가 있어요',
						description: `가져온 팀 ${teamsToImport.length}개로 바꾸면 기록한 경기 결과 ${resultCount(bracket)}개가 지워져요.`,
						confirmLabel: '가져온 팀으로 바꾸기',
						cancelLabel: '기존 대진표 유지',
						onconfirm: () => applyImport(teamsToImport)
					})
				);
			} else {
				applyImport(imported.teams);
			}
		}
		// 복원을 마친 뒤부터 저장한다. 먼저 저장하면 기본 팀이 기존 기록을 덮어쓴다.
		ready = true;

		window.addEventListener('pagehide', persist);
		document.addEventListener('visibilitychange', flushOnHide);
		return () => {
			window.removeEventListener('pagehide', persist);
			document.removeEventListener('visibilitychange', flushOnHide);
			// 다른 화면으로 이동해도 마지막 변경을 남긴다.
			persist();
		};
	});
</script>

<svelte:head>
	<title>{pageTitle}</title>
	<meta name="description" content={description} />
	<link rel="canonical" href={`${siteBaseUrl}/bracket`} />
	<meta property="og:title" content={pageTitle} />
	<meta property="og:description" content={description} />
	<meta property="og:url" content={`${siteBaseUrl}/bracket`} />
	<meta property="og:type" content="website" />
	<meta property="og:image" content={shareImage} />
	<meta property="og:image:alt" content="Lake가 만든 무료 온라인 도구" />
	<meta name="twitter:card" content="summary_large_image" />
	<meta name="twitter:title" content={pageTitle} />
	<meta name="twitter:description" content={description} />
	<meta name="twitter:image" content={shareImage} />
</svelte:head>

<SiteShell active="bracket" variant="bracket">
	<ToolPageLayout
		class="bracket-page"
		maxWidth="1550px"
		title="대진표 만들기"
		description="팀을 넣고 토너먼트 대진표를 만들어 승자를 기록해요."
	>
		<noscript><p>대진표를 만들려면 브라우저에서 JavaScript를 켜세요.</p></noscript>
		{#if notice}<p class="bracket-notice" role="status">{notice}</p>{/if}
		<div class="bracket-setup" data-ready={ready || undefined}>
			<BracketTeamsSection
				{teams}
				errors={validation.errors}
				onrename={renameTeam}
				onremove={removeTeam}
				onadd={addBulk}
				onmove={moveTeamTo}
				onclear={requestClear}
				onbulk={() => bulkDialog.open()}
			/>
			<BracketSettingsSection
				bind:title
				bind:order
				{titleError}
				{summary}
				{reason}
				hasBracket={Boolean(bracket)}
				{outdated}
				onbuild={requestBuild}
			/>
		</div>
		<BracketBoard
			{bracket}
			onchange={(next) => (bracket = next)}
			onnew={requestNew}
			onprint={() => window.print()}
		/>
		<BracketGuide />
		<ToolPageFooter />
	</ToolPageLayout>
	<BracketBulkDialog
		bind:this={bulkDialog}
		existing={teams.map((team) => team.name)}
		onadd={addBulk}
	/>
	<BracketConfirmDialog id="bracket-confirm" bind:this={confirmDialog} />
	{#if bracket && printLayout}
		<div class="bracket-print" aria-hidden="true">
			<div class="bracket-board-heading">
				<p class="bracket-board-name">{bracket.title || '대진표'}</p>
				<p class="bracket-status">{printLayout.status}</p>
				<div class="bracket-board-meta"><span>{printLayout.meta}</span></div>
			</div>
			<div class="bracket-print-view" style:--bracket-print-zoom={printLayout.zoom}>
				<BracketView
					rounds={printLayout.rounds}
					teams={bracket.teams}
					dimensions={screenDimensions.wide}
					champion={printLayout.champion}
					nextId={printLayout.nextId}
					mirror={printLayout.mirror}
					interactive={false}
				/>
			</div>
		</div>
	{/if}
</SiteShell>
