<script>
	import { onMount } from 'svelte';
	import { resolve } from '$app/paths';
	import { Button, EmptyState, FormField } from '$lib/components/ui';
	import { ALL_ROLES, filterChampions, roleOptions } from '../guide.js';

	// 허브의 챔피언 목록. 타일은 챔피언 공략 페이지 링크라서 검색엔진도 따라간다.
	let { champions } = $props();
	let query = $state('');
	let role = $state(ALL_ROLES);
	let roles = $derived(roleOptions(champions));
	let visible = $derived(filterChampions(champions, role, query));
	// 브라우저 검사가 입력 처리가 연결된 뒤에 입력하도록 표시한다.
	let ready = $state(false);
	onMount(() => (ready = true));
</script>

<div class="aram-picker" data-ready={ready || undefined}>
	<FormField id="aram-search" label="챔피언 이름 검색" spacing="none">
		{#snippet children({ describedBy })}
			<input
				class="ui-field"
				id="aram-search"
				type="search"
				placeholder="예: 마이"
				autocomplete="off"
				aria-describedby={describedBy}
				bind:value={query}
			/>
		{/snippet}
	</FormField>
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
						href={resolve('/aram-mayhem/[champion]', { champion: champion.id })}
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
