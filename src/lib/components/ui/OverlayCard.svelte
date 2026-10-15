<script>
	import Surface from './Surface.svelte';

	let { title, titleId = undefined, class: className = '', children, actions } = $props();
</script>

<Surface class={['ui-overlay-card', className].filter(Boolean).join(' ')}>
	<strong id={titleId} class="ui-overlay-card-title" class:has-body={Boolean(children)}
		>{title}</strong
	>
	{@render children?.()}
	{#if actions}<div class="ui-overlay-card-actions">{@render actions()}</div>{/if}
</Surface>

<style>
	:global(.ui-overlay-card) {
		pointer-events: auto;
		width: min(420px, 100%);
		max-height: 100%;
		padding: var(--space-24);
		overflow-y: auto;
		background: var(--ui-surface);
		color: var(--ui-text);
		border: 1px solid var(--ui-border);
		border-radius: 18px;
		text-align: center;
		box-shadow: 0 12px 36px var(--color-box-shadow-18);
		font-size: var(--font-size-16);
		line-height: 1.55;
		word-break: keep-all;
		overflow-wrap: anywhere;
	}
	.ui-overlay-card-title {
		display: block;
		font-size: var(--font-size-24);
	}
	.ui-overlay-card-title.has-body {
		margin-bottom: var(--space-16);
	}
	:global(.ui-overlay-card p + p) {
		margin-top: var(--space-8);
	}
	.ui-overlay-card-actions {
		display: flex;
		flex-wrap: wrap;
		gap: var(--space-12);
		justify-content: center;
		margin-top: var(--space-20);
	}
</style>
