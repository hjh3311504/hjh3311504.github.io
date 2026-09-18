<script>
	import ToolPageHeader from './ToolPageHeader.svelte';
	let { title, description, maxWidth = '1120px', class: className = '', children } = $props();
</script>

<main class={`tool-page-layout ${className}`} style:max-width={maxWidth}>
	<ToolPageHeader {title} {description} />
	{@render children?.()}
</main>

<style>
	.tool-page-layout {
		width: 100%;
		margin: 0 auto;
		padding: 60px 40px 32px;
		font-family: var(--site-body-font);
		color: var(--shell-text-body);
	}
	.tool-page-layout > :global(.tool-page-header) {
		margin-bottom: 32px;
	}
	@media (max-width: 760px) {
		.tool-page-layout {
			padding: 72px 18px 28px;
		}
	}
</style>
