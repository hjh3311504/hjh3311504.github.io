<script>
	let {
		href = undefined,
		target = undefined,
		rel = undefined,
		type = 'button',
		variant = 'outline',
		size = 'md',
		fullWidth = false,
		disabled = false,
		element = $bindable(),
		class: className = '',
		'aria-disabled': ariaDisabled = undefined,
		children = undefined,
		...restProps
	} = $props();

	let tag = $derived(href ? 'a' : 'button');
	let external = $derived(Boolean(href && /^(?:https?:)?\/\//.test(href)));
	let resolvedTarget = $derived(target ?? (external ? '_blank' : undefined));
	let resolvedRel = $derived(rel ?? (external ? 'noopener noreferrer' : undefined));
	let resolvedVariant = $derived(
		['primary', 'soft', 'outline', 'ghost', 'danger'].includes(variant) ? variant : 'outline'
	);
	let resolvedSize = $derived(['sm', 'md', 'lg', 'icon'].includes(size) ? size : 'md');
</script>

<svelte:element
	this={tag}
	bind:this={element}
	{...restProps}
	href={disabled && href ? undefined : href}
	target={href ? resolvedTarget : undefined}
	rel={href ? resolvedRel : undefined}
	type={href ? undefined : type}
	disabled={href ? undefined : disabled}
	aria-disabled={href && disabled ? 'true' : ariaDisabled}
	class={['ui-button', className].filter(Boolean).join(' ')}
	data-ui-button
	data-variant={resolvedVariant}
	data-size={resolvedSize}
	data-full-width={fullWidth ? 'true' : undefined}
>
	{@render children?.()}
</svelte:element>
