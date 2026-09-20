<script>
	import { OverlayCard } from '$lib/components/ui';
	let { title, titleId = undefined, children, actions } = $props();
</script>

<div class="stage-overlay" role={titleId ? 'region' : undefined} aria-labelledby={titleId}>
	<OverlayCard class="stage-overlay-card" {title} {titleId} {children} {actions} />
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
		padding: var(--space-20);
	}
</style>
