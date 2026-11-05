<script>
	import { onMount } from 'svelte';
	import { replaceState } from '$app/navigation';
	import { resolve } from '$app/paths';
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
	// 색인으로 고른 초성. 그 묶음을 붉은 테두리 카드로 감싸고 색인 버튼을 붉게 채운다.
	let activeInitial = $state('');
	let indexNav = $state();

	// 고른 묶음을 화면 세로 가운데로 옮긴다. 묶음이 길어 위쪽이 붙어 있는 색인에 가려지면 색인 바로 아래에 맞춘다.
	function jumpTo(event, initial) {
		// 보조 키를 누른 클릭(새 탭·새 창 열기)은 브라우저에 맡긴다.
		if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) {
			return;
		}
		const row = document.getElementById(`aram-initial-${initial}`);
		if (!row) return;
		event.preventDefault();
		activeInitial = initial;
		const rect = row.getBoundingClientRect();
		// 색인이 붙는 위치 + 색인 높이 + 여유 8px. CSS의 --aram-index-offset과 같은 거리다.
		const indexBottom =
			parseFloat(getComputedStyle(indexNav).top) + indexNav.getBoundingClientRect().height + 8;
		const top = Math.max((window.innerHeight - rect.height) / 2, indexBottom);
		window.scrollTo({ top: window.scrollY + rect.top - top });
		// 주소의 #초성은 남기되 방문 기록은 늘리지 않는다. 키보드 사용자는 그 묶음의 첫 타일부터 이어 간다.
		// eslint-disable-next-line svelte/no-navigation-without-resolve -- resolve()로 만든 허브 주소에 #초성만 붙인다.
		replaceState(`${resolve('/aram-mayhem')}#aram-initial-${initial}`, {});
		row.querySelector('a')?.focus({ preventScroll: true });
	}

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
	<nav class="aram-index" aria-label="초성으로 이동" bind:this={indexNav}>
		{#each indexInitials as initial (initial)}
			<Button
				class="aram-index-link"
				size="sm"
				variant="ghost"
				href={`#aram-initial-${initial}`}
				disabled={!shownInitials.has(initial)}
				aria-current={initial === activeInitial && shownInitials.has(initial)
					? 'location'
					: undefined}
				onclick={(event) => jumpTo(event, initial)}
			>
				{initial}
			</Button>
		{/each}
	</nav>
	{#if visible.length}
		<!-- 초성 묶음마다 왼쪽에 큰 초성을 두고 오른쪽에 타일을 채운다. Safari는 목록 점을 없앤 ul을 목록으로 읽지 않아 role을 적는다. -->
		<ul class="aram-initials" role="list" aria-label="챔피언 고르기">
			{#each groups as group (group.initial)}
				<li
					class="aram-initial-row"
					id={`aram-initial-${group.initial}`}
					data-active={group.initial === activeInitial || undefined}
				>
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
