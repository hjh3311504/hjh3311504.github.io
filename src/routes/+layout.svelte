<script>
	import { setContext, onDestroy, onMount } from 'svelte';
	import { afterNavigate, beforeNavigate } from '$app/navigation';
	import { page } from '$app/state';
	import { dev } from '$app/environment';
	import * as publicEnv from '$env/static/public';
	import { ANALYTICS_CONTEXT, createAnalytics } from '$lib/analytics/tracker.js';
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
	onMount(() => markLocalPreview({ window, document, dev }));

	beforeNavigate(({ to, willUnload, cancel }) => {
		if (to && !willUnload && tracker?.requiresDocumentNavigation(to.url)) {
			cancel();
			window.location.assign(to.url.href);
		}
	});

	afterNavigate(() => {
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

{@render children()}
