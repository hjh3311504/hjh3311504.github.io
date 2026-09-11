<script>
	let {
		title = '',
		step = undefined,
		titleId = undefined,
		level = 2,
		description = undefined,
		class: className = '',
		actionsClass = '',
		titleSuffixSeparator = ' ',
		titleSuffix = undefined,
		heading = undefined,
		meta = undefined,
		actions = undefined,
		...restProps
	} = $props();

	let headingTag = $derived(`h${Math.min(6, Math.max(1, Number(level) || 2))}`);
</script>

<div
	{...restProps}
	class={['ui-section-header', className].filter(Boolean).join(' ')}
	data-ui-section-header
>
	{#if heading}
		{@render heading()}
	{:else}
		<div class="ui-section-heading-copy">
			<svelte:element this={headingTag} id={titleId} class:ui-step-heading={step !== undefined}>
				{#if step !== undefined}
					<span class="ui-step-number">{step}</span>
					<span
						>{title}{#if titleSuffix}{titleSuffixSeparator}{@render titleSuffix()}{/if}</span
					>
				{:else}
					{title}{#if titleSuffix}{titleSuffixSeparator}{@render titleSuffix()}{/if}
				{/if}
			</svelte:element>
			{#if description}<p>{description}</p>{/if}
		</div>
	{/if}
	{#if meta}<div class="ui-section-meta">{@render meta()}</div>{/if}
	{#if actions}
		<div class={['ui-section-actions', actionsClass].filter(Boolean).join(' ')}>
			{@render actions()}
		</div>
	{/if}
</div>
