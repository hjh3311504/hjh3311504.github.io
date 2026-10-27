<script>
	import { goto } from '$app/navigation';
	import { resolve } from '$app/paths';
	import SiteShell from '$lib/components/organisms/SiteShell.svelte';
	import ToolPageLayout from '$lib/components/organisms/ToolPageLayout.svelte';
	import ToolPageFooter from '$lib/components/organisms/ToolPageFooter.svelte';
	import ChampionSearchLauncher from '$lib/aram-mayhem/components/ChampionSearchLauncher.svelte';
	import AugmentGuide from '$lib/aram-mayhem/components/AugmentGuide.svelte';
	import AramLegal from '$lib/aram-mayhem/components/AramLegal.svelte';
	import guide from '$lib/aram-mayhem/guide-data.json';
	import {
		HUB_PATH,
		augmentPath,
		augmentSeo,
		championList,
		structuredData
	} from '$lib/aram-mayhem/seo.js';
	import { siteBaseUrl, image as shareImage } from '$lib/data/meta.js';
	import '../../aram-mayhem.css';

	let { data } = $props();
	let augment = $derived(guide.augments[data.augmentId]);
	let seo = $derived(augmentSeo(data.augmentId, guide));
	let pageUrl = $derived(`${siteBaseUrl}${augmentPath(data.augmentId)}`);
	let structuredDataScript = $derived(
		structuredData({
			siteBaseUrl,
			path: augmentPath(data.augmentId),
			title: seo.title,
			description: seo.description,
			crumbs: [
				{ name: "Lake's develog", path: '/' },
				{ name: '증바람 공략', path: HUB_PATH },
				{ name: seo.heading, path: augmentPath(data.augmentId) }
			],
			list: championList(
				seo.entries.map(({ champion }) => champion),
				`증바람 ${augment.nameKo} 추천 챔피언`
			)
		})
	);

	function selectChampion(id) {
		goto(resolve('/aram-mayhem/[champion]', { champion: id }));
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
		{#key data.augmentId}
			<AugmentGuide {augment} entries={seo.entries} core={seo.core} {guide} />
		{/key}
		<AramLegal />
		<ToolPageFooter />
		<ChampionSearchLauncher champions={guide.champions} onselect={selectChampion} />
	</ToolPageLayout>
</SiteShell>
