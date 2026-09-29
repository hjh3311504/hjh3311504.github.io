<script>
	import { resolve } from '$app/paths';
	let { showRss = false } = $props();
	import PrivacyDialog from './PrivacyDialog.svelte';
</script>

<footer class="tool-page-footer">
	<div class="footer-links">
		<PrivacyDialog />
		{#if showRss}<a href={resolve('/rss.xml')} data-sveltekit-reload>RSS 구독</a>{/if}
	</div>
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
		font-family: var(--site-body-font);
		font-size: var(--font-size-12);
		font-weight: 400;
		line-height: 1.7;
	}
	.footer-links {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		gap: var(--space-16);
	}
	.footer-links > a {
		color: inherit;
		text-decoration: underline;
		text-decoration-color: currentColor;
		text-decoration-thickness: auto;
		text-underline-offset: 3px;
		white-space: nowrap;
	}
	a:focus-visible {
		outline: 2px solid var(--ui-focus);
		outline-offset: 2px;
	}
</style>
