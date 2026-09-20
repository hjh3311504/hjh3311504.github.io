<script>
	let {
		id,
		label,
		help = '',
		error = '',
		helpId = `${id}-help`,
		required = false,
		children
	} = $props();
</script>

<div class="ui-form-field">
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
