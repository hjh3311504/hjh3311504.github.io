<script>
	import { Button, EmptyState } from '$lib/components/ui';
	import { ALL_ROLES, filterChampions, roleOptions } from '../guide.js';

	let { champions, selectedId, onselect } = $props();
	let query = $state('');
	let role = $state(ALL_ROLES);
	let roles = $derived(roleOptions(champions));
	let visible = $derived(filterChampions(champions, role, query));
</script>

<div class="aram-picker">
	<input
		class="ui-field aram-search"
		type="search"
		placeholder="챔피언 이름 검색"
		aria-label="챔피언 이름 검색"
		autocomplete="off"
		bind:value={query}
	/>
	<div class="aram-roles" role="group" aria-label="역할로 거르기">
		{#each roles as option (option)}
			<Button
				size="sm"
				variant={option === role ? 'soft' : 'outline'}
				aria-pressed={option === role}
				onclick={() => (role = option)}
			>
				{option}
			</Button>
		{/each}
	</div>
	{#if visible.length}
		<ul class="aram-grid" aria-label="챔피언 고르기">
			{#each visible as champion (champion.id)}
				<li>
					<Button
						class="aram-pick"
						variant="ghost"
						aria-pressed={champion.id === selectedId}
						onclick={() => onselect(champion.id)}
					>
						<img src={champion.icon} alt="" width="48" height="48" decoding="async" />
						{champion.nameKo}
					</Button>
				</li>
			{/each}
		</ul>
	{:else}
		<EmptyState title="찾는 챔피언이 아직 가이드에 없어요." />
	{/if}
</div>
