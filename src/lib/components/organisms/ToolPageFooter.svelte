<script>
	import PrivacyDialog from './PrivacyDialog.svelte';
</script>

<footer class="tool-page-footer">
	<PrivacyDialog />
	<span>© 2026 Lake's develog</span>
</footer>

<style>
	.tool-page-footer {
		display: flex;
		flex-wrap: wrap;
		justify-content: space-between;
		align-items: center;
		gap: var(--space-12);
		margin-top: var(--space-32);
		color: var(--shell-text-muted);
		font-size: var(--font-size-12);
		line-height: 1.7;
	}
</style>
