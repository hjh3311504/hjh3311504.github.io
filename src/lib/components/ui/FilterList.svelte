<script>
	import Button from './Button.svelte';

	let { items, value, onchange, disabled = false, labelledBy } = $props();
</script>

<div class="ui-filter-list" role="group" aria-labelledby={labelledBy}>
	{#each items as item (item.value)}
		<Button
			fullWidth
			variant={value === item.value ? 'soft' : 'ghost'}
			aria-pressed={value === item.value}
			{disabled}
			onclick={() => onchange(item.value)}
		>
			<span class="ui-filter-label">{item.label}</span>
			{#if item.count !== undefined}<span>{item.count}</span>{/if}
		</Button>
	{/each}
</div>
