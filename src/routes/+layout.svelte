<script>
	import { setContext, onDestroy, onMount } from 'svelte';
	import { afterNavigate, beforeNavigate } from '$app/navigation';
	import { page } from '$app/state';
	import { dev } from '$app/environment';
	import * as publicEnv from '$env/static/public';
	import { ANALYTICS_CONTEXT, createAnalytics, isPublicPath } from '$lib/analytics/tracker.js';
	import { adsenseClient, adsenseExcludedPaths } from '$lib/data/meta.js';
	import { markLocalPreview } from '$lib/local-preview.js';
	import '$lib/styles/fonts.css';
	import '$lib/styles/tokens.css';
	import '$lib/styles/site.css';
	import '$lib/components/ui/ui.css';

	let { children } = $props();
	const env = /** @type {Record<string, string>} */ (publicEnv);
	let tracker;
	const analytics = $state({
		enabled: false,
		consent: 'unknown',
		status: 'idle'
	});
	setContext(ANALYTICS_CONTEXT, analytics);
	const showAds = $derived(
		!dev &&
			page.status === 200 &&
			!adsenseExcludedPaths.includes(page.url.pathname) &&
			isPublicPath(page.url.pathname, page.data.analyticsPublicPaths ?? [])
	);
	// 한 번 실행된 광고 코드는 태그를 지워도 남으므로, 광고 제외 경로로 갈 때는 문서를 새로 불러온다.
	let adsLoaded = false;
	$effect(() => {
		if (showAds) adsLoaded = true;
	});
	onMount(() => markLocalPreview({ window, document, dev }));

	const leavesAds = (url) => adsLoaded && adsenseExcludedPaths.includes(url.pathname);

	beforeNavigate(({ to, type, willUnload, cancel }) => {
		if (
			to &&
			!willUnload &&
			(tracker?.requiresDocumentNavigation(to.url) || (type !== 'popstate' && leavesAds(to.url)))
		) {
			cancel();
			window.location.assign(to.url.href);
		}
	});

	afterNavigate(() => {
		// 뒤로·앞으로 가기는 취소하면 주소 복구와 이동이 겹치므로, 도착한 뒤 새로 불러온다.
		if (leavesAds(page.url)) {
			window.location.reload();
			return;
		}
		tracker ??= createAnalytics({
			window,
			document,
			token: env.PUBLIC_CF_WEB_ANALYTICS_TOKEN ?? '',
			publicPaths: page.data.analyticsPublicPaths ?? [],
			origin: env.PUBLIC_ANALYTICS_ORIGIN ?? '',
			production: !dev,
			onChange: (state) => Object.assign(analytics, state)
		});
		tracker.navigate(page.url, page.status);
	});
	onDestroy(() => tracker?.destroy());
</script>

<svelte:head>
	{#if showAds}
		<script
			async
			src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${adsenseClient}`}
			crossorigin="anonymous"
		></script>
	{/if}
</svelte:head>

{@render children()}
