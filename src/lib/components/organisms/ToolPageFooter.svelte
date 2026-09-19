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
		gap: 12px;
		margin-top: 32px;
		color: var(--shell-text-muted);
		font-size: 12px;
		line-height: 1.7;
	}
</style>
