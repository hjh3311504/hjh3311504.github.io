<script>
	import { resolve } from '$app/paths';
	import { Button } from '$lib/components/ui';
	import { augmentChampions, displayAlias } from '../seo.js';

	// 허브의 증강별 공략 링크. 검색엔진이 증강 공략 페이지를 찾는 길이기도 하다.
	let { ids, guide } = $props();
</script>

<section class="aram-aug-links" aria-labelledby="aram-aug-links-title">
	<h2 id="aram-aug-links-title">증강별 공략</h2>
	<ul>
		{#each ids as id (id)}
			{@const augment = guide.augments[id]}
			{@const alias = displayAlias(augment.nameKo, augment.aliases)}
			<li>
				<Button
					class="aram-aug-link"
					variant="ghost"
					href={resolve('/aram-mayhem/augments/[augment]', { augment: id })}
				>
					<span class={`aram-ring aram-ring-${augment.tier}`}>
						<img src={augment.icon} alt="" width="36" height="36" decoding="async" />
					</span>
					<span>
						<strong>{augment.nameKo}</strong>
						<small>
							{alias ? `${alias} · ` : ''}챔피언 {augmentChampions(guide, id).length}명
						</small>
					</span>
				</Button>
			</li>
		{/each}
	</ul>
</section>
