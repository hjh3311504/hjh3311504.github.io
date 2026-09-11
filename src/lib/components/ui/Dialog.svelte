<script>
	import IconButton from './IconButton.svelte';

	let {
		id,
		element = $bindable(),
		title = '',
		titleId,
		description = undefined,
		descriptionId = undefined,
		describedBy = descriptionId,
		showClose = true,
		closeLabel = '닫기',
		closeAction = undefined,
		class: className = '',
		actionsClass = '',
		'aria-labelledby': ariaLabelledBy = undefined,
		'aria-describedby': ariaDescribedBy = undefined,
		descriptionContent = undefined,
		beforeHeader = undefined,
		header = undefined,
		headerActions = undefined,
		children = undefined,
		actions = undefined,
		...restProps
	} = $props();
</script>

<dialog
	bind:this={element}
	{...restProps}
	{id}
	class={['ui-dialog', className].filter(Boolean).join(' ')}
	aria-labelledby={titleId ?? ariaLabelledBy}
	aria-describedby={describedBy ?? ariaDescribedBy}
	data-ui-dialog
>
	{#if beforeHeader}{@render beforeHeader()}{/if}
	{#if header}
		{@render header()}
	{:else}
		<div class="ui-dialog-header dialog-heading">
			<div class="ui-dialog-heading-copy">
				<h2 id={titleId}>{title}</h2>
				{#if descriptionContent}
					<p id={descriptionId}>{@render descriptionContent()}</p>
				{:else if description}
					<p id={descriptionId}>{description}</p>
				{/if}
			</div>
			{#if headerActions || showClose}
				<div class:dialog-heading-actions={Boolean(headerActions)} class="ui-dialog-header-actions">
					{#if headerActions}{@render headerActions()}{/if}
					{#if showClose}
						<IconButton
							class="dialog-close"
							label={closeLabel}
							onclick={closeAction}
							data-close-dialog
						>
							<svg
								width="15"
								height="15"
								viewBox="0 0 24 24"
								fill="none"
								stroke="currentColor"
								stroke-width="2"
								stroke-linecap="round"
								stroke-linejoin="round"
								aria-hidden="true"
							>
								<path d="M18 6 6 18"></path>
								<path d="m6 6 12 12"></path>
							</svg>
						</IconButton>
					{/if}
				</div>
			{/if}
		</div>
	{/if}
	{@render children?.()}
	{#if actions}
		<div class={['ui-dialog-actions', 'dialog-actions', actionsClass].filter(Boolean).join(' ')}>
			{@render actions()}
		</div>
	{/if}
</dialog>
