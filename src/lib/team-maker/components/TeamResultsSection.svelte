<script>
	import { Button, EmptyState, Section, SectionHeader } from '$lib/components/ui';

	let { assetsBase } = $props();
</script>

<Section variant="raised" class="results-section" aria-labelledby="results-title">
	<SectionHeader
		title="3. 결과"
		titleId="results-title"
		class="result-heading"
		actionsClass="result-actions"
	>
		{#snippet actions()}
			<Button id="undo-win-button" class="utility-button" variant="outline" size="sm" hidden
				>승리 취소</Button
			>
			<Button id="copy-result-button" class="utility-button" variant="outline" size="sm"
				>명단 복사</Button
			>
			<Button
				id="reshuffle-button"
				class="utility-button reshuffle-button"
				variant="primary"
				size="sm">다시 섞기</Button
			>
		{/snippet}
	</SectionHeader>
	<p id="result-live" class="sr-only" role="status" aria-live="polite"></p>
	<EmptyState id="result-empty" class="result-empty" role="status">
		<span
			class="result-empty-mark"
			style={`--result-empty-mark-image: url('${assetsBase}/stat-people.png')`}
			aria-hidden="true"
		></span>
		<strong>아직 만든 팀이 없습니다</strong>
		<span class="result-empty-description">팀 만들기를 누르면 팀별 명단이 나타납니다.</span>
	</EmptyState>
	<div id="team-grid" class="team-grid"></div>
	<section id="picked-section" class="picked-section" aria-labelledby="picked-section-title" hidden>
		<h3 id="picked-section-title" class="picked-section-title">당첨자</h3>
		<div id="picked-groups" class="picked-groups"></div>
	</section>
</Section>
