<script>
	import { resolve } from '$app/paths';
	import { Button } from '$lib/components/ui';
	import { AUGMENT_PAGE_HOOKS } from '../seo.js';

	// 허브의 증강 공략 링크(꼭 읽어야 할 증강 공략). 이름 아래에 관심을 끄는 한 줄 소개를 둔다. 검색엔진이 증강 공략 페이지를 찾는 길이기도 하다.
	let { ids, guide } = $props();
</script>

<section class="aram-aug-links" aria-labelledby="aram-aug-links-title">
	<h2 id="aram-aug-links-title">꼭 읽어야 할 증강 공략</h2>
	<ul>
		{#each ids as id (id)}
			{@const augment = guide.augments[id]}
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
						<small>{AUGMENT_PAGE_HOOKS[id]}</small>
					</span>
				</Button>
			</li>
		{/each}
	</ul>
</section>
