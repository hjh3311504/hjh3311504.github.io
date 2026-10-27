<script>
	import { resolve } from '$app/paths';
	import { TIER_LABEL } from '../guide.js';
	import CoreItems from './CoreItems.svelte';
	import ComboCard from './ComboCard.svelte';
	import ComboLegend from './ComboLegend.svelte';

	// 증강 공략: 증강 효과와 어울리는 챔피언별 템트리·조합. 챔피언 이름은 챔피언 공략 페이지 링크다.
	// core: 모든 챔피언이 같은 템트리를 쓰면 위에 한 번만 보여 준다.
	let { augment, entries, core, guide } = $props();
</script>

<article class="aram-detail" aria-labelledby="aram-augment-name">
	<header class="aram-champion-head">
		<span class={`aram-ring aram-ring-head aram-ring-${augment.tier}`}>
			<img src={augment.icon} alt="" width="64" height="64" />
		</span>
		<div>
			<h2 id="aram-augment-name">{augment.nameKo}</h2>
			<div class="aram-tags">
				<span class="aram-tag">{TIER_LABEL[augment.tier]} 증강</span>
			</div>
		</div>
	</header>
	<p class="aram-aug-effect">{augment.effectKo}</p>

	{#if core}
		<h3>{augment.nameKo} 템트리</h3>
		<div class="aram-card">
			<CoreItems items={core} {guide} />
		</div>
	{/if}

	<div class="aram-section-head">
		<h3>어울리는 챔피언 {entries.length}명</h3>
		<ComboLegend />
	</div>
	{#each entries as { champion, combos, build } (champion.id)}
		<section class="aram-aug-champ" aria-labelledby={`aram-aug-champ-${champion.id}`}>
			<h4 id={`aram-aug-champ-${champion.id}`}>
				<a href={resolve('/aram-mayhem/[champion]', { champion: champion.id })}>
					<img src={champion.icon} alt="" width="40" height="40" loading="lazy" decoding="async" />
					{champion.nameKo}
				</a>
			</h4>
			{#if build && !core}
				<div class="aram-card">
					<p class="aram-sub-heading">{augment.nameKo} 템트리</p>
					<CoreItems items={build.core} {guide} />
				</div>
			{/if}
			{#each combos as combo (combo.title)}
				<ComboCard {combo} {champion} {guide} />
			{/each}
		</section>
	{/each}
</article>
