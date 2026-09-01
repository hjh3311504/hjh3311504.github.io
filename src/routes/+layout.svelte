<script>
	import { page } from '$app/stores';
	import '@fontsource/inter';
	import '@fontsource/inter/600.css';
	import '@fontsource/inter/700.css';
	import '$lib/scss/global.scss';

	$: isHome = $page.url.pathname === '/';
	$: isTeamMaker = $page.url.pathname.startsWith('/team-maker');
	$: loadSiteFonts = !isTeamMaker;
	$: loadAds = !isHome && !isTeamMaker;
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
	{#if loadAds}
		<script
			async
			src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-3102141816876720"
			crossorigin="anonymous"
		></script>
	{/if}
</svelte:head>

<slot />
