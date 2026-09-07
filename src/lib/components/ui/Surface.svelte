<script>
	let {
		as = 'div',
		href = undefined,
		variant = 'plain',
		class: className = '',
		children = undefined,
		...restProps
	} = $props();

	let tag = $derived(href ? 'a' : as);
</script>

<svelte:element
	this={tag}
	{...restProps}
	{href}
	class={['ui-surface', className].filter(Boolean).join(' ')}
	data-ui-surface
	data-variant={variant}
>
	{@render children?.()}
</svelte:element>
