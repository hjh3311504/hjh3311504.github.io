<script>
	import { TIER_LABEL } from '../guide.js';

	// 모루작 빌드처럼 모루에 기대는 템트리의 추가 안내와 등급별 추천 모루 선택지.
	// 증강 공략의 템트리 카드와 챔피언 빌드 탭이 함께 쓴다.
	let { build, guide } = $props();
</script>

{#if build.caution}
	<p class="aram-caution">{build.caution}</p>
{/if}
{#if build.anvils?.length}
	<p class="aram-sub-heading">추천 모루 선택지</p>
	<p class="aram-note">위에 있는 선택지부터 고르세요.</p>
	<div class="aram-anvils">
		{#each build.anvils as tier (tier.tier)}
			<section class="aram-anvil-tier" aria-label={`${TIER_LABEL[tier.tier]} 모루`}>
				<p class={`aram-anvil-badge aram-anvil-badge-${tier.tier}`}>{TIER_LABEL[tier.tier]}</p>
				<ol class="aram-anvil-picks">
					{#each tier.picks as pick (pick.stat)}
						<li>
							<span class="aram-anvil-stat">
								{#each pick.icons as key (key)}
									<img src={guide.icons[key]} alt="" width="16" height="16" decoding="async" />
								{/each}
								<strong>{pick.stat}</strong>
								<span class="aram-anvil-value">{pick.value}</span>
							</span>
							<span class="aram-anvil-why">{pick.why}</span>
						</li>
					{/each}
				</ol>
			</section>
		{/each}
	</div>
{/if}
