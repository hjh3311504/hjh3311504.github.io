<script>
	import Section from './Section.svelte';

	let {
		title,
		titleId,
		open = true,
		variant = 'card',
		class: className = '',
		detailsClass = '',
		children = undefined,
		...restProps
	} = $props();
</script>

<Section
	{...restProps}
	{variant}
	class={['ui-disclosure-section', className].filter(Boolean).join(' ')}
	aria-labelledby={titleId}
	data-ui-disclosure-section
>
	<details
		class={['ui-disclosure', detailsClass].filter(Boolean).join(' ')}
		{open}
		data-ui-disclosure
	>
		<summary><h2 id={titleId}>{title}</h2></summary>
		<div class="ui-disclosure-content">{@render children?.()}</div>
	</details>
</Section>
