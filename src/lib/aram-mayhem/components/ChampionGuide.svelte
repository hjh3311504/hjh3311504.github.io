<script>
	import BuildPanel from './BuildPanel.svelte';
	import ComboCard from './ComboCard.svelte';
	import AugmentBox from './AugmentBox.svelte';

	// closed: 사용자가 접은 조합 카드. 같은 챔피언으로 돌아와도 접힌 채로 둔다.
	let { champion, guide, closed } = $props();

	const comboKey = (combo) => `${champion.id}:${combo.title}`;
	function toggleCombo(event, combo) {
		if (event.currentTarget.open) closed.delete(comboKey(combo));
		else closed.add(comboKey(combo));
	}
</script>

<article class="aram-detail" aria-labelledby="aram-champion-name">
	<header class="aram-champion-head">
		<img src={champion.icon} alt="" width="64" height="64" />
		<div>
			<h2 id="aram-champion-name">{champion.nameKo}</h2>
			<div class="aram-tags">
				{#each champion.roles as role (role)}<span class="aram-tag">{role}</span>{/each}
				<span class="aram-tag">난이도 {champion.difficulty}</span>
			</div>
		</div>
	</header>

	<h3>아이템 추천</h3>
	<BuildPanel {champion} {guide} />

	<div class="aram-section-head">
		<h3>증강 추천</h3>
		<p class="aram-legend">
			<span class="aram-legend-need" aria-hidden="true"></span>필수 증강
			<span class="aram-legend-opt" aria-hidden="true"></span>선택 증강
		</p>
	</div>
	{#each champion.combos as combo (combo.title)}
		<ComboCard
			{combo}
			{champion}
			{guide}
			open={!closed.has(comboKey(combo))}
			ontoggle={(event) => toggleCombo(event, combo)}
		/>
	{/each}

	<div class="aram-boxes">
		<AugmentBox
			title="이것도 나오면 좋아요"
			ids={champion.good}
			empty="위 조합의 증강을 먼저 챙기세요."
			tone="good"
			{guide}
		/>
		<AugmentBox
			title="이 챔피언에게는 별로예요"
			ids={champion.avoid}
			empty="특별히 피할 증강은 없어요."
			tone="bad"
			{guide}
		/>
	</div>
</article>
