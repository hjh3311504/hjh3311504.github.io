<script>
	let { title, description, class: className = '' } = $props();
</script>

<header class={`tool-page-header ${className}`}>
	<h1>{title}</h1>
	<p>{description}</p>
</header>

<style>
	.tool-page-header {
		padding: 0 var(--space-4);
	}
	h1 {
		margin: 0;
		font-size: var(--font-size-28);
		font-weight: 800;
		line-height: 1.25;
		letter-spacing: -0.5px;
	}
	p {
		margin: var(--space-8) 0 0;
		color: var(--muted, var(--shell-text-muted));
		font-size: var(--font-size-14);
		line-height: 1.65;
		word-break: keep-all;
	}
</style>
