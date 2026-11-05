<script>
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { resolve } from '$app/paths';
	import SiteShell from '$lib/components/organisms/SiteShell.svelte';
	import ToolPageLayout from '$lib/components/organisms/ToolPageLayout.svelte';
	import ToolPageFooter from '$lib/components/organisms/ToolPageFooter.svelte';
	import ChampionPicker from '$lib/aram-mayhem/components/ChampionPicker.svelte';
	import AramGuideNotes from '$lib/aram-mayhem/components/AramGuideNotes.svelte';
	import AramLegal from '$lib/aram-mayhem/components/AramLegal.svelte';
	import AugmentLinks from '$lib/aram-mayhem/components/AugmentLinks.svelte';
	import guide from '$lib/aram-mayhem/guide-data.json';
	import { championFromHash } from '$lib/aram-mayhem/guide.js';
	import {
		AUGMENT_PAGE_IDS,
		HUB_PATH,
		championList,
		hubSeo,
		structuredData
	} from '$lib/aram-mayhem/seo.js';
	import { siteBaseUrl } from '$lib/data/meta.js';
	import './aram-mayhem.css';
	const shareImage = `${siteBaseUrl}/images/aram-mayhem-open-graph-1200x630.png`;

	const seo = hubSeo(guide);
	const pageUrl = `${siteBaseUrl}${HUB_PATH}`;
	const structuredDataScript = structuredData({
		siteBaseUrl,
		path: HUB_PATH,
		title: seo.title,
		description: seo.description,
		crumbs: [
			{ name: 'Seta Lab', path: '/' },
			{ name: '증바람 공략', path: HUB_PATH }
		],
		list: championList(guide.champions)
	});

	onMount(() => {
		// 예전 공유 주소(/aram-mayhem#teemo)는 챔피언 공략 페이지로 옮긴다.
		const champion = championFromHash(guide.champions, location.hash);
		if (champion) {
			goto(resolve('/aram-mayhem/[champion]', { champion: champion.id }), { replaceState: true });
		}
	});
</script>

<svelte:head>
	<title>{seo.title}</title>
	<meta name="description" content={seo.description} />
	<link rel="canonical" href={pageUrl} />
	<meta property="og:title" content={seo.title} />
	<meta property="og:description" content={seo.description} />
	<meta property="og:url" content={pageUrl} />
	<meta property="og:type" content="website" />
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
	<ToolPageLayout class="aram-page" maxWidth="1040px" title={seo.heading} description={seo.intro}>
		<p class="aram-patch">{guide.patch} 패치 기준</p>
		<AugmentLinks ids={AUGMENT_PAGE_IDS} {guide} />
		<ChampionPicker champions={guide.champions} />
		<AramGuideNotes patch={guide.patch} championCount={guide.champions.length} />
		<AramLegal />
		<ToolPageFooter />
	</ToolPageLayout>
</SiteShell>
