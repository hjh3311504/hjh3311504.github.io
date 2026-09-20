<script>
	import Surface from './Surface.svelte';

	let {
		variant = 'plain',
		padding = 'none',
		gap = 'none',
		class: className = '',
		children = undefined,
		...restProps
	} = $props();
</script>

<Surface
	as="section"
	{variant}
	class={['ui-section', className].filter(Boolean).join(' ')}
	data-ui-section
	data-padding={padding}
	data-gap={gap}
	{...restProps}
>
	{@render children?.()}
</Surface>
