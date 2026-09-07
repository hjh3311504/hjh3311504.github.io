<script>
	let {
		as = 'div',
		tone = 'neutral',
		title = undefined,
		description = undefined,
		class: className = '',
		icon = undefined,
		children = undefined,
		actions = undefined,
		...restProps
	} = $props();
</script>

<svelte:element
	this={as}
	{...restProps}
	class={['ui-empty-state', className].filter(Boolean).join(' ')}
	data-ui-empty-state
	data-tone={tone}
>
	{#if icon}{@render icon()}{/if}
	{#if title}<strong>{title}</strong>{/if}
	{#if description}<span class="ui-empty-state-description">{description}</span>{/if}
	{@render children?.()}
	{#if actions}<div class="ui-empty-state-actions">{@render actions()}</div>{/if}
</svelte:element>
