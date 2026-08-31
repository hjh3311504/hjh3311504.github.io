<script>
	import { page } from '$app/stores';
	import '@fontsource/inter';
	import '@fontsource/inter/600.css';
	import '@fontsource/inter/700.css';
	import '@fontsource/merriweather';
	import '@fontsource/merriweather/900.css';
	import '@fontsource/ubuntu-mono';
	import '$lib/scss/global.scss';

	$: loadSiteScripts = !$page.url.pathname.startsWith('/team-maker');
</script>

<svelte:head>
	{#if loadSiteScripts}
		<link
			href="https://cdn.jsdelivr.net/gh/sun-typeface/SUIT/fonts/static/woff2/SUIT.css"
			rel="stylesheet"
		/>
		<link
			href="https://cdn.jsdelivr.net/gh/sun-typeface/SUITE/fonts/static/woff2/SUITE.css"
			rel="stylesheet"
		/>
		<script
			async
			src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-3102141816876720"
			crossorigin="anonymous"
		></script>
	{/if}
</svelte:head>

<slot />
