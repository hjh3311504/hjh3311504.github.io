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
		padding: 24px;
		overflow-y: auto;
		background: #102635f2;
		color: #fff;
		border: 1px solid #476477;
		border-radius: 18px;
		text-align: center;
		box-shadow: 0 12px 36px #0006;
		font-size: 16px;
		line-height: 1.55;
		word-break: keep-all;
		overflow-wrap: anywhere;
	}
	.ui-overlay-card-title {
		display: block;
		font-size: 24px;
	}
	.ui-overlay-card-title.has-body {
		margin-bottom: 16px;
	}
	:global(.ui-overlay-card p + p) {
		margin-top: 8px;
	}
	.ui-overlay-card-actions {
		display: flex;
		flex-wrap: wrap;
		gap: 10px;
		justify-content: center;
		margin-top: 18px;
	}
</style>
