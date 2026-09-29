<script>
	import { setContext, onDestroy } from 'svelte';
	import { afterNavigate } from '$app/navigation';
	import { page } from '$app/state';
	import { dev } from '$app/environment';
	import * as publicEnv from '$env/static/public';
	import { ANALYTICS_CONTEXT, createAnalytics } from '$lib/analytics/tracker.js';
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
		setConsent: (value) => tracker?.setConsent(value)
	});
	setContext(ANALYTICS_CONTEXT, analytics);

	afterNavigate(() => {
		tracker ??= createAnalytics({
			window,
			document,
			measurementId: env.PUBLIC_GA_MEASUREMENT_ID ?? '',
			origin: env.PUBLIC_ANALYTICS_ORIGIN ?? '',
			production: !dev,
			onChange: (state) => Object.assign(analytics, state)
		});
		tracker.navigate(page.url, page.status);
	});
	onDestroy(() => tracker?.destroy());
</script>

{@render children()}
