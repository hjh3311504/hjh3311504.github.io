<script>
	import { onMount } from 'svelte';
	import { Button, EmptyState, FormField } from '$lib/components/ui';
	import { filterChampions, groupByInitial } from '../guide.js';
	import ChampionTiles from './ChampionTiles.svelte';

	// 허브의 챔피언 목록. 타일은 챔피언 공략 페이지 링크라서 검색엔진도 따라간다.
	let { champions } = $props();
	let query = $state('');
	let visible = $derived(filterChampions(champions, query));
	let groups = $derived(groupByInitial(visible));
	// 색인은 가이드에 있는 초성을 모두 보여 주고, 검색으로 빈 초성은 누를 수 없게 둔다.
	let indexInitials = $derived(groupByInitial(champions).map((group) => group.initial));
	let shownInitials = $derived(new Set(groups.map((group) => group.initial)));
	// 브라우저 검사가 입력 처리가 연결된 뒤에 입력하도록 표시한다.
	let ready = $state(false);
	onMount(() => (ready = true));
</script>

<div class="aram-picker" data-ready={ready || undefined}>
	<FormField id="aram-search" label="챔피언 이름 검색" spacing="none">
		{#snippet children({ describedBy })}
			<input
				class="ui-field"
				id="aram-search"
				type="search"
				placeholder="예: 마이"
				autocomplete="off"
				aria-describedby={describedBy}
				bind:value={query}
			/>
		{/snippet}
	</FormField>
	<!-- 검색 결과가 없어도 색인 자리를 지켜 화면이 움직이지 않게 한다. -->
	<nav class="aram-index" aria-label="초성으로 이동">
		{#each indexInitials as initial (initial)}
			<Button
				class="aram-index-link"
				size="sm"
				variant="ghost"
				href={`#aram-initial-${initial}`}
				disabled={!shownInitials.has(initial)}
			>
				{initial}
			</Button>
		{/each}
	</nav>
	{#if visible.length}
		<!-- 초성 묶음마다 왼쪽에 큰 초성을 두고 오른쪽에 타일을 채운다. Safari는 목록 점을 없앤 ul을 목록으로 읽지 않아 role을 적는다. -->
		<ul class="aram-initials" role="list" aria-label="챔피언 고르기">
			{#each groups as group (group.initial)}
				<li class="aram-initial-row" id={`aram-initial-${group.initial}`}>
					<ChampionTiles
						champions={group.champions}
						label={`${group.initial} 챔피언`}
						initial={group.initial}
					/>
				</li>
			{/each}
		</ul>
	{:else}
		<EmptyState title="찾는 챔피언이 아직 가이드에 없어요." />
	{/if}
</div>
