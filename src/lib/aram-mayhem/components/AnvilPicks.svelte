<script>
	import { TIER_LABEL } from '../guide.js';

	// 모루작 빌드처럼 모루에 기대는 템트리의 추가 안내와 등급별 추천 모루(1순위·2순위).
	// 증강 공략의 템트리 카드와 챔피언 빌드 탭이 함께 쓴다.
	let { build, guide } = $props();
	const tierNames = (tiers) => tiers.map((tier) => TIER_LABEL[tier]).join('·');
</script>

{#if build.caution}
	<p class="aram-caution">{build.caution}</p>
{/if}
{#if build.anvils?.length}
	<p class="aram-sub-heading">추천 모루 선택지</p>
	<!-- 줄은 등급, 칸은 1순위·2순위. 좁은 화면에서는 줄마다 한 열로 쌓는다. -->
	<table class="aram-anvils">
		<thead>
			<tr>
				<th scope="col">등급</th>
				<th scope="col">1순위</th>
				<th scope="col">2순위</th>
			</tr>
		</thead>
		<tbody>
			{#each build.anvils as group (group.tiers.join())}
				<tr aria-label={`${tierNames(group.tiers)} 모루`}>
					<th scope="row">
						<span class="aram-anvil-badges">
							{#each group.tiers as tier (tier)}
								<span class={`aram-anvil-badge aram-anvil-badge-${tier}`}>{TIER_LABEL[tier]}</span>
							{/each}
						</span>
					</th>
					{#each group.priorities as stats, index (index)}
						<td class="aram-anvil-rank" class:aram-anvil-first={index === 0}>
							<span class="aram-anvil-rank-name">{index + 1}순위</span>
							<span class="aram-anvil-stats">
								{#each stats as pick (pick.stat)}
									<span class="aram-anvil-stat">
										{#each pick.icons as key (key)}
											<span class="aram-stat-icon"
												><img
													src={guide.icons[key]}
													alt=""
													width="16"
													height="16"
													decoding="async"
												/></span
											>
										{/each}
										{pick.stat}
									</span>
								{/each}
							</span>
						</td>
					{/each}
				</tr>
			{/each}
		</tbody>
	</table>
{/if}
