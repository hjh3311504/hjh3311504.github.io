<script>
	let {
		id,
		label,
		help = '',
		error = '',
		helpId = `${id}-help`,
		required = false,
		spacing = 'stack',
		// true: placeholder로 뜻이 보이는 검색창처럼 label을 화면에서 숨기고 화면 낭독기에만 읽힌다.
		labelHidden = false,
		children
	} = $props();
</script>

<div class="ui-form-field" data-spacing={spacing} data-label={labelHidden ? 'hidden' : undefined}>
	<label for={id}
		>{label}{#if required}<span class="ui-required" aria-label="필수"> *</span>{/if}</label
	>
	{@render children({ describedBy: help || error ? helpId : undefined, invalid: Boolean(error) })}
	{#if help || error}
		<p
			id={helpId}
			class="ui-field-help"
			class:ui-field-error={Boolean(error)}
			role={error ? 'alert' : undefined}
		>
			{error || help}
		</p>
	{/if}
</div>
