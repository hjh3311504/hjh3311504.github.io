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
	import { siteBaseUrl } from '$lib/data/meta.js';
	import '../../aram-mayhem.css';
	const shareImage = `${siteBaseUrl}/images/aram-mayhem-open-graph-1200x630.png`;

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
				{ name: 'Seta Lab', path: '/' },
				{ name: '증바람 공략', path: HUB_PATH },
				{ name: seo.heading, path: augmentPath(data.augmentId) }
			],
			// 1코어 추천만 정리한 증강은 챔피언 목록이 없다.
			list: seo.entries.length
				? championList(
						seo.entries.map(({ champion }) => champion),
						`증바람 ${augment.nameKo} 추천 챔피언`
					)
				: undefined
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
	<meta property="og:image:alt" content="칼바람 아수라장 챔피언별 추천 증강 조합 가이드" />
	<meta name="twitter:card" content="summary_large_image" />
	<meta name="twitter:title" content={seo.title} />
	<meta name="twitter:description" content={seo.description} />
	<meta name="twitter:image" content={shareImage} />
	<meta name="twitter:image:alt" content="칼바람 아수라장 챔피언별 추천 증강 조합 가이드" />
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
