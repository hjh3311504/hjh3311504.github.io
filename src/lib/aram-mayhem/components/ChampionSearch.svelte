<script>
	import { FormField } from '$lib/components/ui';
	import { searchChampions } from '../guide.js';

	// 다른 챔피언 찾기. 입력할 때만 자동완성 목록을 보여 준다. 검색 창(ChampionSearchLauncher) 안에서 쓴다.
	let { champions, onselect, input = $bindable() } = $props();
	let query = $state('');
	let focused = $state(false);
	let active = $state(0);
	let results = $derived(searchChampions(champions, query));
	let open = $derived(focused && query.trim() !== '');
	const optionId = (id) => `aram-suggest-${id}`;

	/** 검색어와 고른 항목을 처음으로 돌린다. 검색 창이 닫힐 때 부른다. */
	export function reset() {
		query = '';
		active = 0;
	}

	function choose(champion) {
		onselect(champion.id);
	}

	function onkeydown(event) {
		// 검색 입력창은 글자가 남아 있으면 첫 Escape를 글자 지우기에 쓴다. 미리 비워 한 번에 창을 닫는다.
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
</script>

<div class="aram-search">
	<FormField id="aram-champion-search" label="다른 챔피언 찾기" labelHidden>
		<input
			bind:this={input}
			class="ui-field"
			id="aram-champion-search"
			type="search"
			role="combobox"
			placeholder="다른 챔피언 찾기"
			autocomplete="off"
			aria-autocomplete="list"
			aria-expanded={open}
			aria-controls="aram-suggest"
			aria-activedescendant={open && results[active] ? optionId(results[active].id) : undefined}
			bind:value={query}
			oninput={() => (active = 0)}
			onfocus={() => (focused = true)}
			onblur={() => (focused = false)}
			{onkeydown}
		/>
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
