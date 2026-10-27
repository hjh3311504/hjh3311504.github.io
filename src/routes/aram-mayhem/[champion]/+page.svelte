<script>
	import { SvelteSet } from 'svelte/reactivity';
	import { goto } from '$app/navigation';
	import { resolve } from '$app/paths';
	import SiteShell from '$lib/components/organisms/SiteShell.svelte';
	import ToolPageLayout from '$lib/components/organisms/ToolPageLayout.svelte';
	import ToolPageFooter from '$lib/components/organisms/ToolPageFooter.svelte';
	import ChampionSearch from '$lib/aram-mayhem/components/ChampionSearch.svelte';
	import ChampionGuide from '$lib/aram-mayhem/components/ChampionGuide.svelte';
	import AramLegal from '$lib/aram-mayhem/components/AramLegal.svelte';
	import guide from '$lib/aram-mayhem/guide-data.json';
	import { HUB_PATH, championPath, championSeo, structuredData } from '$lib/aram-mayhem/seo.js';
	import { siteBaseUrl, image as shareImage } from '$lib/data/meta.js';
	import '../aram-mayhem.css';

	let { data } = $props();
	let champion = $derived(guide.champions.find((c) => c.id === data.championId));
	let seo = $derived(championSeo(champion, guide));
	let pageUrl = $derived(`${siteBaseUrl}${championPath(champion.id)}`);
	let structuredDataScript = $derived(
		structuredData({
			siteBaseUrl,
			path: championPath(champion.id),
			title: seo.title,
			description: seo.description,
			crumbs: [
				{ name: "Lake's develog", path: '/' },
				{ name: '증바람 공략', path: HUB_PATH },
				{ name: seo.heading, path: championPath(champion.id) }
			]
		})
	);
	// 사용자가 접은 조합 카드. 다른 챔피언 페이지로 갔다가 돌아와도 접힌 채로 둔다.
	const closed = new SvelteSet();

	function selectChampion(id) {
		if (id !== champion.id) goto(resolve('/aram-mayhem/[champion]', { champion: id }));
	}
</script>

<svelte:head>
	<title>{seo.title}</title>
	<meta name="description" content={seo.description} />
	<link rel="canonical" href={pageUrl} />
	<meta property="og:title" content={seo.title} />
	<meta property="og:description" content={seo.description} />
	<meta property="og:url" content={pageUrl} />
	<meta property="og:type" content="article" />
	<meta property="og:image" content={shareImage} />
	<meta property="og:image:alt" content="Lake가 만든 무료 온라인 도구" />
	<meta name="twitter:card" content="summary_large_image" />
	<meta name="twitter:title" content={seo.title} />
	<meta name="twitter:description" content={seo.description} />
	<meta name="twitter:image" content={shareImage} />
	<!-- eslint-disable-next-line svelte/no-at-html-tags -->
	{@html structuredDataScript}
</svelte:head>

<SiteShell active="aram-mayhem" variant="aram-mayhem">
	<ToolPageLayout class="aram-page" maxWidth="1040px" title={seo.heading}>
		<p class="aram-patch">{guide.patch} 패치 기준</p>
		<ChampionSearch champions={guide.champions} onselect={selectChampion} />
		{#key champion.id}
			<ChampionGuide {champion} {guide} {closed} />
		{/key}
		<AramLegal />
		<ToolPageFooter />
	</ToolPageLayout>
</SiteShell>
