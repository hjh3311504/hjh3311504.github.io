<script>
	import Surface from './Surface.svelte';

	let { variant = 'plain', class: className = '', children = undefined, ...restProps } = $props();
</script>

<Surface
	as="section"
	{variant}
	class={['ui-section', className].filter(Boolean).join(' ')}
	data-ui-section
	{...restProps}
>
	{@render children?.()}
</Surface>
