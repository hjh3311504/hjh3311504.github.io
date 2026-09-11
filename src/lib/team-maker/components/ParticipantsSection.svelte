<script>
	import { Button, EmptyState, IconButton, Section, SectionHeader } from '$lib/components/ui';
</script>

<Section variant="raised" class="card participant-card" aria-labelledby="participant-title">
	<SectionHeader
		step={1}
		title="참가자 입력"
		titleId="participant-title"
		class="section-heading"
		actionsClass="heading-actions"
	>
		{#snippet titleSuffix()}
			<span id="participant-count" class="count-label">(0명)</span>
		{/snippet}
		{#snippet actions()}
			<Button id="toggle-all-button" class="utility-button" variant="outline" size="sm" hidden>
				전체 선택
			</Button>
			<IconButton
				id="open-rosters-button"
				class="icon-button roster-button"
				variant="outline"
				label="명단 저장·불러오기"
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
			</IconButton>
			<IconButton
				id="clear-list-button"
				class="icon-button danger-button"
				variant="outline"
				label="명단 삭제"
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
		<Button class="soft-primary-button" type="submit" variant="soft" size="sm">추가</Button>
		<Button id="open-bulk-button" class="utility-button" variant="outline" size="sm">
			일괄 추가
		</Button>
	</form>

	<EmptyState as="p" id="participant-empty" class="empty-box">
		아직 추가한 참가자가 없습니다. 위 칸에 이름을 적고 엔터를 눌러 주세요.
	</EmptyState>
	<ul id="participant-list" class="participant-list" aria-label="참가자 목록"></ul>

	<div id="rules-area" class="rules-area" hidden>
		<div class="rules-heading">
			<div class="rules-copy">
				<h3>규칙</h3>
				<p id="rules-summary">꼭 같은 팀이거나, 꼭 다른 팀이어야 하는 사람을 지정할 수 있습니다.</p>
			</div>
			<div class="rule-actions">
				<Button id="add-together-rule" class="rule-button together" variant="outline" size="sm"
					>같은 팀 지정</Button
				>
				<Button id="add-apart-rule" class="rule-button apart" variant="outline" size="sm"
					>다른 팀 지정</Button
				>
			</div>
		</div>
		<EmptyState as="p" id="rules-empty" class="subtle-empty" hidden></EmptyState>
		<ul id="rules-list" class="rules-list" aria-label="배정 규칙 목록"></ul>
	</div>
</Section>
