<script>
	import { page } from '$app/stores';
	import '$lib/components/ui/ui.css';
	import '$lib/scss/global.scss';

	$: isTeamMaker = $page.url.pathname.startsWith('/team-maker');
	$: loadSiteFonts = !isTeamMaker;
</script>

<svelte:head>
	{#if loadSiteFonts}
		<link
			href="https://cdn.jsdelivr.net/gh/sun-typeface/SUIT/fonts/static/woff2/SUIT.css"
			rel="stylesheet"
		/>
		<link
			href="https://cdn.jsdelivr.net/gh/sun-typeface/SUITE/fonts/static/woff2/SUITE.css"
			rel="stylesheet"
		/>
	{/if}
</svelte:head>

<slot />
