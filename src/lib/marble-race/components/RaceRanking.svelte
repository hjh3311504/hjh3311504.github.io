<script>
	import Button from '$lib/components/ui/Button.svelte';
	import { Section, SectionHeader } from '$lib/components/ui';
	import RankingGrid from '$lib/marble-race/components/RankingGrid.svelte';
	let {
		status,
		focusId,
		onselect,
		race,
		query = $bindable(),
		visibleOrder,
		copyResult,
		stopInspecting
	} = $props();
</script>

<Section variant="card" padding="compact" class="race-panel"
	><SectionHeader class="panel-title" title="도착 순위"
		>{#snippet actions()}
			{#if status === 'finished'}<Button onclick={copyResult}>결과 복사</Button>{/if}
		{/snippet}</SectionHeader
	>
	<label for="marble-search">구슬 찾기</label><input
		id="marble-search"
		class="ui-field"
		type="search"
		bind:value={query}
		placeholder="이름 또는 구슬 번호"
	/>
	<Button variant="ghost" onclick={stopInspecting}>자동으로 따라가기</Button>
	{#key race?.identity}<RankingGrid
			items={visibleOrder}
			selectedId={focusId}
			resetKey={query}
			{onselect}
		/>{/key}
</Section>
