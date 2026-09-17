<script>
	import Surface from '$lib/components/ui/Surface.svelte';
	let { title, children, actions } = $props();
</script>

<div class="stage-overlay">
	<Surface class="stage-overlay-card"
		><strong>{title}</strong>{@render children?.()}
		<div class="stage-overlay-actions">{@render actions?.()}</div></Surface
	>
</div>

<style>
	.stage-overlay {
		position: absolute;
		inset: 0;
		display: flex;
		align-items: center;
		justify-content: center;
		pointer-events: none;
		z-index: 4;
		padding: 20px;
	}
	.stage-overlay :global(.stage-overlay-card) {
		pointer-events: auto;
		width: min(420px, 100%);
		padding: 24px;
		background: #102635f2;
		color: #fff;
		border: 1px solid #476477;
		border-radius: 18px;
		text-align: center;
		box-shadow: 0 12px 36px #0006;
	}
	strong {
		font-size: 24px;
	}
	.stage-overlay-actions {
		display: flex;
		flex-wrap: wrap;
		gap: 10px;
		justify-content: center;
		margin-top: 18px;
	}
</style>
