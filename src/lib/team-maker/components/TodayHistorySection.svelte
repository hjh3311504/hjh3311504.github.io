<script>
	import { Button, EmptyState, Section, SectionHeader } from '$lib/components/ui';
</script>

<Section
	id="history-card"
	variant="raised"
	class="history-card"
	aria-labelledby="statistics-title"
	hidden
>
	<SectionHeader class="section-heading" actionsClass="heading-actions">
		{#snippet heading()}
			<div class="today-heading">
				<h2 id="statistics-title">4. 오늘의 기록</h2>
				<p id="today-history-count">(0경기)</p>
				<p class="won-legend">* 당첨자</p>
			</div>
		{/snippet}
		{#snippet actions()}
			<Button id="clear-today-button" class="utility-button" variant="outline" size="sm" hidden
				>초기화</Button
			>
			<Button id="open-player-stats-button" class="utility-button" variant="outline" size="sm"
				>참가자 통계</Button
			>
			<Button
				id="open-history-button"
				class="utility-button roster-button"
				variant="outline"
				size="sm">전체 기록</Button
			>
		{/snippet}
	</SectionHeader>
	<div class="statistics-content">
		<EmptyState as="p" id="today-history-empty" class="subtle-empty">
			오늘 기록한 경기가 없습니다.
		</EmptyState>
		<ul id="today-history-list" class="today-history-list"></ul>
		<Button
			id="today-history-toggle"
			class="utility-button today-history-toggle"
			variant="outline"
			size="sm"
			aria-controls="today-history-list"
			aria-expanded="false"
			hidden
		>
			펼치기
		</Button>
	</div>
</Section>
