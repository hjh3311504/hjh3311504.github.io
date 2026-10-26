<script>
	import AugmentTile from './AugmentTile.svelte';
	import AugmentDetail from './AugmentDetail.svelte';

	// tone: good(나오면 좋은 증강) | bad(피할 증강)
	let { title, ids, empty, tone, guide } = $props();
	let expanded = $state(null);
	const toggleAugment = (id) => (expanded = expanded === id ? null : id);
</script>

<section class={`aram-box aram-box-${tone}`}>
	<h4>{title}</h4>
	{#if ids.length}
		<div class="aram-augs">
			{#each ids as id (id)}
				<AugmentTile
					{id}
					augment={guide.augments[id]}
					small
					expanded={expanded === id}
					onselect={toggleAugment}
				/>
			{/each}
		</div>
		<AugmentDetail augment={expanded ? guide.augments[expanded] : null} />
	{:else}
		<p class="aram-note">{empty}</p>
	{/if}
</section>
