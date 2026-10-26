<script>
	import { onMount, tick } from 'svelte';
	import { SvelteSet } from 'svelte/reactivity';
	import { replaceState } from '$app/navigation';
	import SiteShell from '$lib/components/organisms/SiteShell.svelte';
	import ToolPageLayout from '$lib/components/organisms/ToolPageLayout.svelte';
	import ToolPageFooter from '$lib/components/organisms/ToolPageFooter.svelte';
	import ChampionPicker from '$lib/aram-mayhem/components/ChampionPicker.svelte';
	import ChampionGuide from '$lib/aram-mayhem/components/ChampionGuide.svelte';
	import AramGuideNotes from '$lib/aram-mayhem/components/AramGuideNotes.svelte';
	import guide from '$lib/aram-mayhem/guide-data.json';
	import { championFromHash } from '$lib/aram-mayhem/guide.js';
	import { siteBaseUrl, image as shareImage } from '$lib/data/meta.js';
	import './aram-mayhem.css';

	const pageTitle = `칼바람 아수라장 증강 가이드 | 챔피언별 증강·아이템 추천 (${guide.patch})`;
	const description = `칼바람 나락 아수라장 ${guide.patch} 패치 기준으로 챔피언 ${guide.champions.length}명의 추천 증강 조합, 코어 아이템 순서, 증강별 빌드를 초보자도 알기 쉽게 정리했습니다.`;

	let selectedId = $state(guide.champions[0].id);
	let detail = $state();
	let ready = $state(false);
	// 사용자가 접은 조합 카드. 다른 챔피언을 봤다가 돌아와도 접힌 채로 둔다.
	const closed = new SvelteSet();
	let champion = $derived(guide.champions.find((c) => c.id === selectedId) ?? guide.champions[0]);

	async function selectChampion(id) {
		if (id === selectedId) return;
		selectedId = id;
		// eslint-disable-next-line svelte/no-navigation-without-resolve -- 같은 페이지의 주소 끝만 바꾼다.
		replaceState(`#${id}`, {});
		await tick();
		// 좁은 화면에서는 챔피언 목록 아래의 설명이 보이도록 내려 준다.
		const top = detail?.getBoundingClientRect().top ?? 0;
		if (top > window.innerHeight * 0.6) {
			const smooth = !window.matchMedia('(prefers-reduced-motion: reduce)').matches;
			detail.scrollIntoView({ block: 'start', behavior: smooth ? 'smooth' : 'auto' });
		}
	}

	onMount(() => {
		const fromHash = () => (selectedId = championFromHash(guide.champions, location.hash).id);
		fromHash();
		ready = true;
		window.addEventListener('hashchange', fromHash);
		return () => window.removeEventListener('hashchange', fromHash);
	});
</script>

<svelte:head>
	<title>{pageTitle}</title>
	<meta name="description" content={description} />
	<link rel="canonical" href={`${siteBaseUrl}/aram-mayhem`} />
	<meta property="og:title" content={pageTitle} />
	<meta property="og:description" content={description} />
	<meta property="og:url" content={`${siteBaseUrl}/aram-mayhem`} />
	<meta property="og:type" content="website" />
	<meta property="og:image" content={shareImage} />
	<meta property="og:image:alt" content="Lake가 만든 무료 온라인 도구" />
	<meta name="twitter:card" content="summary_large_image" />
	<meta name="twitter:title" content={pageTitle} />
	<meta name="twitter:description" content={description} />
	<meta name="twitter:image" content={shareImage} />
</svelte:head>

<SiteShell active="aram-mayhem" variant="aram-mayhem">
	<ToolPageLayout
		class="aram-page"
		maxWidth="1040px"
		title="칼바람 아수라장 증강 가이드"
		description="챔피언을 고르면 어떤 증강을 노리고, 무엇을 사고, 어떻게 싸우면 되는지 알려드려요."
	>
		<p class="aram-patch">{guide.patch} 패치 기준 · 챔피언 {guide.champions.length}명</p>
		<noscript><p>다른 챔피언을 보려면 브라우저에서 JavaScript를 켜세요.</p></noscript>
		<ChampionPicker champions={guide.champions} {selectedId} onselect={selectChampion} />
		<div class="aram-detail-anchor" bind:this={detail} data-ready={ready || undefined}>
			{#key champion.id}
				<ChampionGuide {champion} {guide} {closed} />
			{/key}
		</div>
		<AramGuideNotes patch={guide.patch} championCount={guide.champions.length} />
		<div class="aram-legal">
			<p lang="en">
				칼바람 아수라장 증강 가이드 was created under Riot Games' "Legal Jibber Jabber" policy using
				assets owned by Riot Games. Riot Games does not endorse or sponsor this project.
			</p>
			<p>
				챔피언·아이템·증강 이름과 그림은 Riot Games의 자산입니다. 이 페이지는 Riot Games가 만들거나
				보증하지 않은 팬 가이드입니다.
			</p>
		</div>
		<ToolPageFooter />
	</ToolPageLayout>
</SiteShell>
