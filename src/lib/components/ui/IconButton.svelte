<script>
	import Button from './Button.svelte';

	let {
		label = undefined,
		title = undefined,
		variant = 'ghost',
		size = 'icon',
		element = $bindable(),
		class: className = '',
		'aria-label': ariaLabel = undefined,
		children = undefined,
		...restProps
	} = $props();

	let resolvedLabel = $derived(label ?? ariaLabel);
	let resolvedTitle = $derived(title ?? resolvedLabel);
</script>

<Button
	{...restProps}
	{variant}
	{size}
	bind:element
	class={['ui-icon-button', className].filter(Boolean).join(' ')}
	aria-label={resolvedLabel}
	title={resolvedTitle}
	data-ui-icon-button
>
	{@render children?.()}
</Button>
