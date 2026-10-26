<script>
	import { augmentGroups } from '../guide.js';
	import AugmentTile from './AugmentTile.svelte';
	import AugmentDetail from './AugmentDetail.svelte';
	import RichText from './RichText.svelte';

	let { combo, champion, guide, open = true, ontoggle } = $props();
	let expanded = $state(null);
	let groups = $derived(augmentGroups(combo));
	const toggleAugment = (id) => (expanded = expanded === id ? null : id);
</script>

<details class={`aram-combo aram-combo-${combo.level}`} {open} {ontoggle}>
	<summary>
		<span class={`aram-level aram-level-${combo.level}`}>
			{combo.level === 'strong' ? '강력 추천' : '추천'}
		</span>
		<span class="aram-combo-title">{combo.title}</span>
	</summary>
	<div class="aram-augs">
		{#each groups.required as id (id)}
			<AugmentTile
				{id}
				augment={guide.augments[id]}
				kind="need"
				expanded={expanded === id}
				onselect={toggleAugment}
			/>
		{/each}
		{#each groups.optional as id (id)}
			<AugmentTile
				{id}
				augment={guide.augments[id]}
				kind="opt"
				expanded={expanded === id}
				onselect={toggleAugment}
			/>
		{/each}
	</div>
	{#if combo.why.length}
		<p class="aram-why">
			<RichText parts={combo.why} {champion} {guide} {expanded} onselect={toggleAugment} />
		</p>
	{/if}
	{#if combo.steps.length}
		<ol class="aram-steps">
			{#each combo.steps as parts, index (index)}
				<li><RichText {parts} {champion} {guide} {expanded} onselect={toggleAugment} /></li>
			{/each}
		</ol>
	{/if}
	{#if combo.hint}
		<p class="aram-hint">{combo.hint}</p>
	{/if}
	{#if combo.sources.length}
		<p class="aram-sources">
			<span>출처</span>
			{#each combo.sources as source, index (source.url)}
				{#if index}<span aria-hidden="true">·</span>{/if}
				<!-- eslint-disable-next-line svelte/no-navigation-without-resolve -- 외부 출처 링크 -->
				<a href={source.url} target="_blank" rel="noopener noreferrer">{source.label}</a>
			{/each}
		</p>
	{/if}
	<AugmentDetail augment={expanded ? guide.augments[expanded] : null} />
</details>
