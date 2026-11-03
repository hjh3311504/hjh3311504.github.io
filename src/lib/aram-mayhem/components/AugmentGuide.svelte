<script>
	import { TIER_LABEL } from '../guide.js';
	import AnvilPicks from './AnvilPicks.svelte';
	import ChampionTiles from './ChampionTiles.svelte';
	import CoreItems from './CoreItems.svelte';
	import RichText from './RichText.svelte';

	// 증강 공략: 증강 효과·템트리와 어울리는 챔피언 타일. 타일은 챔피언 공략 페이지 링크다.
	// core: 모든 챔피언이 같은 템트리를 쓰면 위에 한 번만 보여 준다.
	// augment.guide: 챔피언 조합 없이 정리한 1코어 추천과 팁(운명의 무기), 다른 템트리(장갑 충격 모루작 빌드).
	// 팁만 있는 증강(벌이다!!!)은 알아 둘 점만 더한다.
	// 어울리는 증강(떴다, 징크스의 속전속결·보석 건틀릿)은 증강마다 카드 하나에 효과·강조 문장·안내·이동 속도 표를 둔다.
	// 출처는 보여 주지 않는다.
	let { augment, entries, core, guide } = $props();
	let extraBuilds = $derived(augment.guide?.builds ?? []);
	let synergies = $derived(augment.guide?.synergies ?? []);
	// 속전속결: 상대보다 이동 속도가 10 빠를 때마다 피해가 1% 늘어난다.
	// 이동 속도 표는 계산식·표 제목·안내 문장 모두 속전속결·로켓 전용이다.
	const bonus = (own, enemy) => Math.floor((own - enemy) / 10);
</script>

<article class="aram-detail" aria-labelledby="aram-augment-name">
	<header class="aram-champion-head">
		<span class={`aram-ring aram-ring-head aram-ring-${augment.tier}`}>
			<img src={augment.icon} alt="" width="64" height="64" />
		</span>
		<div>
			<h2 id="aram-augment-name">{augment.nameKo}</h2>
			<div class="aram-tags">
				<span class={`aram-tag aram-tier-badge aram-tier-badge-${augment.tier}`}
					>{TIER_LABEL[augment.tier]} 증강</span
				>
			</div>
		</div>
	</header>
	<p class="aram-aug-effect">{augment.effectKo}</p>

	{#if synergies.length}
		<h3>함께 고르면 좋은 증강</h3>
		<ul class="aram-synergies" role="list">
			{#each synergies as synergy (synergy.augment)}
				{@const partner = guide.augments[synergy.augment]}
				<li class="aram-card">
					<div class="aram-synergy-partner">
						<span class={`aram-ring aram-ring-${partner.tier}`}>
							<img src={partner.icon} alt="" width="40" height="40" />
						</span>
						<div>
							<p class="aram-sub-heading">
								{partner.nameKo}
								<span class={`aram-tag aram-tier-badge aram-tier-badge-${partner.tier}`}
									>{TIER_LABEL[partner.tier]} 증강</span
								>
							</p>
							<p>{partner.effectKo}</p>
						</div>
					</div>
					<p class="aram-aug-lead"><RichText parts={synergy.lead} champion={null} {guide} /></p>
					{#if synergy.note.length}
						<p class="aram-hint"><RichText parts={synergy.note} champion={null} {guide} /></p>
					{/if}
					{#if synergy.speedTable}
						<table class="aram-speed-table">
							<caption>로켓 이동 속도 {synergy.speedTable.own}일 때 {partner.nameKo} 효과</caption>
							<thead>
								<tr><th scope="col">상대 이동 속도</th><th scope="col">늘어나는 피해</th></tr>
							</thead>
							<tbody>
								{#each synergy.speedTable.enemies as enemy (enemy)}
									<tr>
										<th scope="row">{enemy}</th>
										<td>+{bonus(synergy.speedTable.own, enemy)}%</td>
									</tr>
								{/each}
							</tbody>
						</table>
						<p class="aram-hint">
							{partner.nameKo}은 상대보다 이동 속도가 10 빠를 때마다 피해가 1% 늘어나요.
						</p>
					{/if}
				</li>
			{/each}
		</ul>
	{/if}

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
			<CoreItems items={build.core} notes={build.notes} joins={build.joins} {guide} />
			{#if build.play.length}
				<ol class="aram-steps">
					{#each build.play as parts, index (index)}
						<li><RichText {parts} champion={null} {guide} /></li>
					{/each}
				</ol>
			{/if}
			<AnvilPicks {build} {guide} />
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
					<div class="aram-role-item-list">
						{#each row.items as item (item)}
							<span class="aram-item">
								{#if guide.items[item]}
									<img src={guide.items[item]} alt="" width="32" height="32" decoding="async" />
								{/if}
								<span>{item}</span>
							</span>
						{/each}
					</div>
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
		<h3>어울리는 챔피언 {entries.length}명</h3>
		<ChampionTiles champions={entries.map(({ champion }) => champion)} label="어울리는 챔피언" />
	{/if}
</article>
