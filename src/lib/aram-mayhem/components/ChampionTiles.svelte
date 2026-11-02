<script>
	import { resolve } from '$app/paths';
	import { Button } from '$lib/components/ui';
	import { tileName } from '../guide.js';

	// 챔피언 공략 링크 타일 목록. 허브와 증강 공략의 어울리는 챔피언이 함께 쓴다.
	// initial이 있으면 첫 타일 칸에 초성을 넣는다. 허브 CSS가 그 초성을 목록 왼쪽, 첫 줄 높이의 가운데에 둔다.
	let { champions, label, initial = '' } = $props();
</script>

<!-- Safari는 목록 점을 없앤 ul을 목록으로 읽지 않아 role을 적는다. -->
<ul class="aram-grid" role="list" aria-label={label}>
	{#each champions as champion, index (champion.id)}
		<li>
			{#if initial && index === 0}
				<span class="aram-initial" aria-hidden="true">{initial}</span>
			{/if}
			<Button
				class="aram-pick"
				variant="ghost"
				href={resolve('/aram-mayhem/[champion]', { champion: champion.id })}
				aria-label={tileName(champion) === champion.nameKo
					? undefined
					: `${tileName(champion)} (${champion.nameKo})`}
			>
				<img src={champion.icon} alt="" width="48" height="48" decoding="async" />
				{tileName(champion)}
			</Button>
		</li>
	{/each}
</ul>
