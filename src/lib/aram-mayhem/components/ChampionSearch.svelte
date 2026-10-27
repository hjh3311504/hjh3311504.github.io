<script>
	import { onMount } from 'svelte';
	import { FormField } from '$lib/components/ui';
	import { searchChampions } from '../guide.js';

	// 챔피언 페이지의 다른 챔피언 찾기. 입력할 때만 자동완성 목록을 보여 준다.
	let { champions, onselect } = $props();
	let query = $state('');
	let focused = $state(false);
	let active = $state(0);
	let results = $derived(searchChampions(champions, query));
	let open = $derived(focused && query.trim() !== '');
	const optionId = (id) => `aram-suggest-${id}`;

	function choose(champion) {
		query = '';
		active = 0;
		onselect(champion.id);
	}

	function onkeydown(event) {
		if (event.key === 'Escape') {
			query = '';
			return;
		}
		if (!open || !results.length) return;
		if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
			event.preventDefault();
			const step = event.key === 'ArrowDown' ? 1 : -1;
			active = (active + step + results.length) % results.length;
		} else if (event.key === 'Enter') {
			event.preventDefault();
			choose(results[active] ?? results[0]);
		}
	}
	// 브라우저 검사가 입력 처리가 연결된 뒤에 입력하도록 표시한다.
	let ready = $state(false);
	onMount(() => (ready = true));
</script>

<div class="aram-search" data-ready={ready || undefined}>
	<FormField id="aram-champion-search" label="다른 챔피언 찾기" spacing="none">
		{#snippet children({ describedBy })}
			<input
				class="ui-field"
				id="aram-champion-search"
				type="search"
				role="combobox"
				placeholder="이름·별명·초성 (예: 마이, ㅌㅁ)"
				autocomplete="off"
				aria-autocomplete="list"
				aria-expanded={open}
				aria-controls="aram-suggest"
				aria-activedescendant={open && results[active] ? optionId(results[active].id) : undefined}
				aria-describedby={describedBy}
				bind:value={query}
				oninput={() => (active = 0)}
				onfocus={() => (focused = true)}
				onblur={() => (focused = false)}
				{onkeydown}
			/>
		{/snippet}
	</FormField>
	<!-- 목록을 누르는 동안 입력창의 포커스를 유지해 목록이 먼저 닫히지 않게 한다. -->
	<ul
		class="aram-suggest"
		id="aram-suggest"
		role="listbox"
		aria-label="찾은 챔피언"
		hidden={!open || !results.length}
		onmousedown={(event) => event.preventDefault()}
	>
		{#each results as champion, index (champion.id)}
			<!-- 키보드 선택은 입력창(combobox)이 방향키·Enter로 처리한다. 항목은 포커스를 받지 않는다. -->
			<!-- svelte-ignore a11y_click_events_have_key_events -->
			<li
				id={optionId(champion.id)}
				role="option"
				aria-selected={index === active}
				onclick={() => choose(champion)}
				onmouseenter={() => (active = index)}
			>
				<img src={champion.icon} alt="" width="28" height="28" decoding="async" />
				<span>{champion.nameKo}</span>
				{#if champion.aliases?.length}
					<span class="aram-suggest-alias">{champion.aliases.join(', ')}</span>
				{/if}
			</li>
		{/each}
	</ul>
	{#if open && !results.length}
		<p class="aram-suggest-empty" role="status">찾는 챔피언이 아직 가이드에 없어요.</p>
	{/if}
</div>
