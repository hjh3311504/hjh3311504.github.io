<script>
	import { resolve } from '$app/paths';
	import { onMount } from 'svelte';
	import SiteShell from '$lib/components/organisms/SiteShell.svelte';
	import { mountTeamMaker } from '$lib/team-maker/app.js';
	import './team-maker.css';

	let pageRoot;

	onMount(() => mountTeamMaker(pageRoot));
</script>

<svelte:head>
	<title>팀 메이커</title>
	<meta
		name="description"
		content="참가자와 규칙을 입력해 고르게 팀을 나누고 승패와 추첨 결과를 기록합니다."
	/>
	<link rel="icon" href={resolve('/team-maker/favicon.svg')} type="image/svg+xml" />
</svelte:head>

<SiteShell active="team-maker" variant="team-maker">
	<div class="team-maker-page" bind:this={pageRoot}>
		<main class="app-shell">
			<header class="page-header">
				<h1>팀 메이커</h1>
			</header>
			<!-- AD_SLOT_TOP: 실제 광고는 별도 디자인 승인 뒤 이 위치에 추가합니다. -->

			<div id="storage-alert" class="storage-alert" role="alert" hidden>
				<span class="alert-mark" aria-hidden="true">!</span>
				<div>
					<strong>저장하지 못했습니다</strong>
					<p>
						이 브라우저의 저장 공간을 사용할 수 없어 입력이 유지되지 않습니다. 창을 닫으면 참가자를
						다시 입력해야 합니다.
					</p>
				</div>
			</div>

			<section class="card participant-card" aria-labelledby="participant-title">
				<div class="section-heading">
					<h2 id="participant-title">
						1. 참가자 입력 <span id="participant-count" class="count-label">(참가자 0명)</span>
					</h2>
					<div class="heading-actions">
						<button id="toggle-all-button" class="utility-button" type="button" hidden
							>전체 선택</button
						>
						<button
							id="open-rosters-button"
							class="icon-button roster-button"
							type="button"
							aria-label="명단 저장·불러오기"
							title="명단 저장·불러오기"
						>
							<svg
								width="17"
								height="17"
								viewBox="0 0 24 24"
								fill="none"
								stroke="currentColor"
								stroke-width="2"
								stroke-linecap="round"
								stroke-linejoin="round"
								aria-hidden="true"
							>
								<path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"></path>
								<path d="M17 21v-8H7v8"></path>
								<path d="M7 3v5h8"></path>
							</svg>
						</button>
						<button
							id="clear-list-button"
							class="icon-button danger-button"
							type="button"
							aria-label="명단 비우기"
							title="명단 비우기"
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
						</button>
					</div>
				</div>
				<p id="participant-help" class="participant-help" role="status">
					이름을 적고 엔터를 누르면 아래 명단에 추가됩니다. 쉼표로 여러 명도 가능합니다.
				</p>

				<form id="add-person-form" class="add-person-form">
					<label class="sr-only" for="person-name">참가자 이름</label>
					<input
						id="person-name"
						name="person-name"
						type="text"
						placeholder="예: 김지원"
						autocomplete="off"
					/>
					<button class="soft-primary-button" type="submit">추가</button>
					<button id="open-bulk-button" class="utility-button" type="button">일괄 추가</button>
				</form>

				<p id="participant-empty" class="empty-box">
					아직 추가한 참가자가 없습니다. 위 칸에 이름을 적고 엔터를 눌러 주세요.
				</p>
				<ul id="participant-list" class="participant-list" aria-label="참가자 목록"></ul>

				<div id="rules-area" class="rules-area" hidden>
					<div class="rules-heading">
						<div class="rules-copy">
							<h3>규칙</h3>
							<p id="rules-summary">
								꼭 같은 팀이거나, 꼭 다른 팀이어야 하는 사람을 지정할 수 있습니다.
							</p>
						</div>
						<div class="rule-actions">
							<button id="add-together-rule" class="rule-button together" type="button"
								>같은 팀 지정</button
							>
							<button id="add-apart-rule" class="rule-button apart" type="button"
								>다른 팀 지정</button
							>
						</div>
					</div>
					<p id="rules-empty" class="subtle-empty" hidden></p>
					<ul id="rules-list" class="rules-list" aria-label="배정 규칙 목록"></ul>
				</div>
			</section>

			<section class="card settings-card" aria-labelledby="settings-title">
				<h2 id="settings-title">2. 나누는 방식</h2>
				<div class="mode-switch" role="radiogroup" aria-label="나누는 방식">
					<button id="team-mode-button" type="button" role="radio" aria-checked="true"
						>팀 수로 나누기</button
					>
					<button id="size-mode-button" type="button" role="radio" aria-checked="false"
						>인원 수로 나누기</button
					>
				</div>

				<div class="stepper-row">
					<div class="stepper-copy">
						<label id="split-value-label" for="split-value">팀 수</label>
						<p id="setup-hint" role="status">2개부터 20개까지 정할 수 있습니다.</p>
					</div>
					<div class="stepper">
						<button id="decrease-value" type="button" aria-label="값 줄이기">−</button>
						<output id="split-value" aria-labelledby="split-value-label">3</output>
						<button id="increase-value" type="button" aria-label="값 늘리기">+</button>
					</div>
				</div>
			</section>

			<button
				id="make-teams-button"
				class="primary-button make-button"
				type="button"
				disabled
				aria-describedby="setup-hint"
			>
				팀 만들기
			</button>

			<section class="results-section" aria-labelledby="results-title">
				<div class="result-heading">
					<h2 id="results-title">3. 결과</h2>
					<div class="result-actions" hidden>
						<button id="undo-win-button" class="pill-button" type="button" hidden>승리 취소</button>
						<button id="reshuffle-button" class="utility-button reshuffle-button" type="button"
							>다시 섞기</button
						>
					</div>
				</div>
				<p id="result-live" class="sr-only" role="status" aria-live="polite"></p>
				<div id="result-empty" class="result-empty" role="status">
					<span class="result-empty-mark" aria-hidden="true"></span>
					<strong>아직 만든 팀이 없습니다</strong>
					<span class="result-empty-description">팀 만들기를 누르면 팀별 명단이 나타납니다.</span>
				</div>
				<div id="team-grid" class="team-grid"></div>
			</section>

			<section id="history-card" class="history-card" aria-labelledby="statistics-title" hidden>
				<h2 id="statistics-title">4. 통계</h2>
				<div class="statistics-content">
					<div class="section-heading">
						<div class="today-heading">
							<h3 id="today-history-title">오늘 기록</h3>
							<p id="today-history-count">0경기</p>
						</div>
						<button id="open-history-button" class="utility-button roster-button" type="button"
							>기록 보기</button
						>
					</div>
					<p id="today-history-empty" class="subtle-empty">오늘 기록한 경기가 없습니다.</p>
					<ul id="today-history-list" class="today-history-list"></ul>
				</div>
			</section>
		</main>
		<dialog
			id="bulk-dialog"
			class="app-dialog"
			aria-labelledby="bulk-title"
			aria-describedby="bulk-description"
		>
			<div class="dialog-heading">
				<div>
					<h2 id="bulk-title">참가자 일괄 추가</h2>
					<p id="bulk-description">한 줄에 한 명씩 붙여넣으세요. 쉼표로 구분해도 됩니다.</p>
				</div>
				<button class="dialog-close" type="button" data-close-dialog aria-label="닫기">
					<svg
						width="15"
						height="15"
						viewBox="0 0 24 24"
						fill="none"
						stroke="currentColor"
						stroke-width="2"
						stroke-linecap="round"
						stroke-linejoin="round"
						aria-hidden="true"
					>
						<path d="M18 6 6 18"></path>
						<path d="m6 6 12 12"></path>
					</svg>
				</button>
			</div>
			<label class="sr-only" for="bulk-names">추가할 참가자 이름</label>
			<textarea id="bulk-names" rows="7" placeholder="김지원&#10;이서준&#10;박하은"></textarea>
			<div class="dialog-actions">
				<button class="utility-button" type="button" data-close-dialog>취소</button>
				<button id="bulk-add-button" class="primary-small-button" type="button" disabled
					>명단에 추가</button
				>
			</div>
		</dialog>

		<dialog
			id="rule-dialog"
			class="app-dialog"
			aria-labelledby="rule-dialog-title"
			aria-describedby="rule-dialog-description"
		>
			<div class="dialog-heading">
				<div>
					<h2 id="rule-dialog-title">같은 팀으로 지정</h2>
					<p id="rule-dialog-description">고른 사람들은 항상 같은 팀에 배정됩니다.</p>
				</div>
				<button class="dialog-close" type="button" data-close-dialog aria-label="닫기">
					<svg
						width="15"
						height="15"
						viewBox="0 0 24 24"
						fill="none"
						stroke="currentColor"
						stroke-width="2"
						stroke-linecap="round"
						stroke-linejoin="round"
						aria-hidden="true"
					>
						<path d="M18 6 6 18"></path>
						<path d="m6 6 12 12"></path>
					</svg>
				</button>
			</div>
			<ul id="rule-picker-list" class="picker-list"></ul>
			<p id="rule-picker-note" class="dialog-note error-text">두 명 이상 골라 주세요.</p>
			<div class="dialog-actions">
				<button class="utility-button" type="button" data-close-dialog>취소</button>
				<button id="save-rule-button" class="primary-small-button" type="button" disabled
					>규칙 추가</button
				>
			</div>
		</dialog>

		<dialog
			id="roster-dialog"
			class="app-dialog roster-dialog"
			aria-labelledby="roster-title"
			aria-describedby="roster-description"
		>
			<div class="dialog-heading">
				<div>
					<h2 id="roster-title">명단 저장·불러오기</h2>
					<p id="roster-description">저장할 이름을 적어 주세요. 이 브라우저에만 보관됩니다.</p>
				</div>
				<button class="dialog-close" type="button" data-close-dialog aria-label="닫기">
					<svg
						width="15"
						height="15"
						viewBox="0 0 24 24"
						fill="none"
						stroke="currentColor"
						stroke-width="2"
						stroke-linecap="round"
						stroke-linejoin="round"
						aria-hidden="true"
					>
						<path d="M18 6 6 18"></path>
						<path d="m6 6 12 12"></path>
					</svg>
				</button>
			</div>
			<form id="save-roster-form" class="roster-save-row">
				<label class="sr-only" for="roster-name">명단 이름</label>
				<input id="roster-name" type="text" placeholder="예: 수요일 풋살" autocomplete="off" />
				<button id="save-roster-button" class="primary-small-button" type="submit" disabled
					>저장</button
				>
			</form>
			<p id="rosters-empty" class="subtle-empty">
				저장한 명단이 없습니다. 이름을 적고 저장을 누르면 여기에 쌓입니다.
			</p>
			<ul id="rosters-list" class="rosters-list"></ul>
		</dialog>

		<dialog
			id="wheel-dialog"
			class="app-dialog wheel-dialog"
			aria-labelledby="wheel-title"
			aria-describedby="wheel-description"
		>
			<div id="celebration-layer" class="celebration-layer" aria-hidden="true" hidden></div>
			<div class="dialog-heading">
				<div>
					<h2 id="wheel-title">1팀 뽑기</h2>
					<p id="wheel-description">이 팀 명단 중 한 명을 무작위로 뽑습니다.</p>
				</div>
				<div class="dialog-heading-actions">
					<button
						id="sound-toggle-button"
						class="dialog-close sound-toggle"
						type="button"
						aria-pressed="true"
						aria-label="효과음 끄기"
						title="효과음 끄기"
					>
						<svg
							width="17"
							height="17"
							viewBox="0 0 24 24"
							fill="none"
							stroke="currentColor"
							stroke-width="2"
							stroke-linecap="round"
							stroke-linejoin="round"
							aria-hidden="true"
						>
							<path d="M11 5 6 9H3v6h3l5 4V5z"></path>
							<path id="sound-wave-path" d="M15.5 8.5a5 5 0 0 1 0 7"></path>
						</svg>
					</button>
					<button class="dialog-close" type="button" data-close-dialog aria-label="닫기">
						<svg
							width="15"
							height="15"
							viewBox="0 0 24 24"
							fill="none"
							stroke="currentColor"
							stroke-width="2"
							stroke-linecap="round"
							stroke-linejoin="round"
							aria-hidden="true"
						>
							<path d="M18 6 6 18"></path>
							<path d="m6 6 12 12"></path>
						</svg>
					</button>
				</div>
			</div>
			<div class="wheel-wrap">
				<span class="wheel-pointer" aria-hidden="true"></span>
				<div id="wheel" class="wheel" aria-hidden="true"></div>
			</div>
			<p id="wheel-result" class="wheel-result" role="status">돌리기를 누르세요.</p>
			<div class="dialog-actions split-actions">
				<button class="utility-button" type="button" data-close-dialog>닫기</button>
				<button id="spin-wheel-button" class="primary-small-button" type="button">돌리기</button>
			</div>
		</dialog>

		<dialog
			id="history-dialog"
			class="app-dialog history-dialog"
			aria-labelledby="history-title"
			aria-describedby="history-description"
		>
			<div class="dialog-heading">
				<div>
					<h2 id="history-title">승패 기록</h2>
					<p id="history-description">기록이 없습니다.</p>
				</div>
				<button class="dialog-close" type="button" data-close-dialog aria-label="닫기">
					<svg
						width="15"
						height="15"
						viewBox="0 0 24 24"
						fill="none"
						stroke="currentColor"
						stroke-width="2"
						stroke-linecap="round"
						stroke-linejoin="round"
						aria-hidden="true"
					>
						<path d="M18 6 6 18"></path>
						<path d="m6 6 12 12"></path>
					</svg>
				</button>
			</div>
			<p id="history-empty" class="subtle-empty">
				아직 기록이 없습니다. 결과 카드의 승리 버튼을 눌러 기록해 보세요.
			</p>
			<div id="history-groups" class="history-groups"></div>
		</dialog>

		<dialog
			id="confirm-dialog"
			class="app-dialog confirm-dialog"
			aria-labelledby="confirm-title"
			aria-describedby="confirm-description"
		>
			<h2 id="confirm-title">삭제하시겠습니까?</h2>
			<p id="confirm-description">삭제할 내용을 확인해 주세요.</p>
			<div class="dialog-actions">
				<button id="cancel-confirm-button" class="utility-button" type="button">취소</button>
				<button id="confirm-action-button" class="danger-filled-button" type="button">삭제</button>
			</div>
		</dialog>
	</div>
</SiteShell>
