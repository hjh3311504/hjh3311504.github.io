<script>
	import { resolve } from '$app/paths';
	import { TIER_LABEL } from '../guide.js';
	import CoreItems from './CoreItems.svelte';
	import ComboCard from './ComboCard.svelte';
	import ComboLegend from './ComboLegend.svelte';
	import RichText from './RichText.svelte';

	// 증강 공략: 증강 효과와 어울리는 챔피언별 템트리·조합. 챔피언 이름은 챔피언 공략 페이지 링크다.
	// core: 모든 챔피언이 같은 템트리를 쓰면 위에 한 번만 보여 준다.
	// augment.guide: 챔피언 조합 없이 정리한 1코어 추천과 팁(운명의 무기), 다른 템트리(장갑 충격 쇠사슬 조끼).
	// 출처는 보여 주지 않는다.
	let { augment, entries, core, guide } = $props();
	let extraBuilds = $derived(augment.guide?.builds ?? []);
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

	{#if core || extraBuilds.length}
		<h3>{augment.nameKo} 템트리</h3>
	{/if}
	{#if core}
		<div class="aram-card">
			{#if extraBuilds.length}<p class="aram-sub-heading">기본 빌드</p>{/if}
			<CoreItems items={core} {guide} />
			{#if augment.guide?.coreWhy.length}
				<p class="aram-why"><RichText parts={augment.guide.coreWhy} champion={null} {guide} /></p>
			{/if}
		</div>
	{/if}
	{#each extraBuilds as build (build.key)}
		<div class="aram-card">
			<p class="aram-sub-heading">{build.label}</p>
			<CoreItems items={build.core} notes={build.notes} {guide} />
			{#if build.play.length}
				<ol class="aram-steps">
					{#each build.play as parts, index (index)}
						<li><RichText {parts} champion={null} {guide} /></li>
					{/each}
				</ol>
			{/if}
		</div>
	{/each}

	{#if augment.guide?.roleItems.length}
		<h3>1코어 추천</h3>
		{#if augment.guide.lead.length}
			<p class="aram-aug-lead"><RichText parts={augment.guide.lead} champion={null} {guide} /></p>
		{/if}
		<ul class="aram-role-items">
			{#each augment.guide.roleItems as row (row.role)}
				<li class="aram-card">
					<p class="aram-sub-heading">{row.role}</p>
					<span class="aram-item">
						{#if guide.items[row.item]}
							<img src={guide.items[row.item]} alt="" width="32" height="32" decoding="async" />
						{/if}
						<span>{row.item}</span>
					</span>
					<p class="aram-why"><RichText parts={row.why} champion={null} {guide} /></p>
				</li>
			{/each}
		</ul>
	{/if}
	{#if augment.guide?.tips.length}
		<h3>알아 둘 점</h3>
		<div class="aram-card">
			<ul class="aram-steps">
				{#each augment.guide.tips as parts, index (index)}
					<li><RichText {parts} champion={null} {guide} /></li>
				{/each}
			</ul>
		</div>
	{/if}

	{#if entries.length}
		<div class="aram-section-head">
			<h3>어울리는 챔피언 {entries.length}명</h3>
			<ComboLegend />
		</div>
	{/if}
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
