<script>
	import PrivacyDialog from './PrivacyDialog.svelte';
</script>

<footer class="tool-page-footer">
	<span>Lake가 만들고 직접 관리합니다.</span>
	<PrivacyDialog />
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
