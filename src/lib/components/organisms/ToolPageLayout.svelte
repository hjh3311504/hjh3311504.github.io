<script>
	import ToolPageHeader from './ToolPageHeader.svelte';
	let {
		title,
		description,
		maxWidth = '1120px',
		headerClass = '',
		density = 'normal',
		class: className = '',
		children
	} = $props();
</script>

<main class={`tool-page-layout ${className}`} style:max-width={maxWidth} data-density={density}>
	<ToolPageHeader class={headerClass} {title} {description} />
	{@render children?.()}
</main>

<style>
	.tool-page-layout {
		width: 100%;
		margin: 0 auto;
		padding: var(--space-60) var(--space-40) var(--space-32);
		font-family: var(--site-body-font);
		color: var(--shell-text-body);
	}
	.tool-page-layout > :global(.tool-page-header) {
		margin-bottom: var(--space-32);
	}
	@media (max-width: 760px) {
		.tool-page-layout {
			padding: var(--space-72) var(--space-20) var(--space-28);
		}
	}
	.tool-page-layout[data-density='compact'] {
		font-family: inherit;
		width: calc(100% - 32px);
		padding: var(--space-40) 0 var(--space-72);
	}
</style>
