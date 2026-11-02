<script>
	import { resolve } from '$app/paths';
	import { Button } from '$lib/components/ui';
	import { tileName } from '../guide.js';

	// 챔피언 공략 링크 타일 목록. 허브와 증강 공략의 어울리는 챔피언이 함께 쓴다.
	let { champions, label } = $props();
</script>

<ul class="aram-grid" aria-label={label}>
	{#each champions as champion (champion.id)}
		<li>
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
