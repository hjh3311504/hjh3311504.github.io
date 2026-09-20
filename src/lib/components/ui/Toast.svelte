<script>
	let { notification = null, duration = 3000 } = $props();
	let visible = $state(false);
	$effect(() => {
		visible = Boolean(notification?.message);
		if (!notification?.message) return;
		const timer = setTimeout(() => (visible = false), duration);
		return () => clearTimeout(timer);
	});
</script>

<div class="ui-toast" role="status" aria-live="polite" aria-atomic="true">
	{#if visible}<span>{notification.message}</span>{/if}
</div>

<style>
	.ui-toast {
		position: fixed;
		inset-inline: 16px;
		bottom: calc(24px + env(safe-area-inset-bottom, 0px));
		z-index: 1000;
		display: flex;
		justify-content: center;
		pointer-events: none;
	}
	span {
		max-width: min(100%, 480px);
		padding: var(--space-12) var(--space-20);
		border: 1px solid var(--ui-border-strong);
		border-radius: var(--ui-radius-md);
		background: var(--ui-surface);
		color: var(--ui-text);
		box-shadow: 0 4px 20px var(--color-box-shadow-17);
		font-size: var(--font-size-16);
		line-height: 1.5;
		text-align: center;
		overflow-wrap: anywhere;
	}
</style>
