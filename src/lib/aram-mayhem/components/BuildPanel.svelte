<script>
	import { Button } from '$lib/components/ui';
	import { buildLabel, coreMarks, isAddedSituational, situationalHeading } from '../guide.js';
	import RichText from './RichText.svelte';
	import AugmentDetail from './AugmentDetail.svelte';

	let { champion, guide } = $props();
	let selectedKey = $state('base');
	let expanded = $state(null);

	let build = $derived(champion.builds.find((b) => b.key === selectedKey) ?? champion.builds[0]);
	// 증강 빌드만 첫 기본 빌드와 비교해 바뀐 아이템을 표시한다.
	let base = $derived(build.trigger ? champion.builds[0] : null);
	let marks = $derived(coreMarks(build, base));
	let skillOrder = $derived(build.skillOrder.filter((key) => champion.skills[key]));

	function selectBuild(key) {
		selectedKey = key;
		expanded = null;
	}
	const toggleAugment = (id) => (expanded = expanded === id ? null : id);
</script>

<div class="aram-card aram-builds">
	<div class="aram-build-tabs" role="group" aria-label="빌드 고르기">
		{#each champion.builds as option (option.key)}
			<Button
				class="aram-build-tab"
				variant="ghost"
				aria-pressed={option === build}
				onclick={() => selectBuild(option.key)}
			>
				{#if option.trigger}
					{#each option.trigger as id, index (id)}
						{#if index}<span class="aram-plus" aria-hidden="true">+</span>{/if}
						<span class="aram-build-tab-aug">
							<span class={`aram-ring aram-ring-tab aram-ring-${guide.augments[id].tier}`}>
								<img
									src={guide.augments[id].icon}
									alt=""
									width="24"
									height="24"
									loading="lazy"
									decoding="async"
								/>
							</span>
							{guide.augments[id].nameKo}
						</span>
					{/each}
				{:else}
					{buildLabel(option, guide.augments)}
				{/if}
			</Button>
		{/each}
	</div>

	<ol class="aram-core" aria-label="코어 아이템 구매 순서">
		{#each build.core as item, index (item)}
			<li>
				<span class="aram-item" class:aram-item-changed={marks[index]}>
					{#if guide.items[item]}
						<img
							src={guide.items[item]}
							alt=""
							width="32"
							height="32"
							loading="lazy"
							decoding="async"
						/>
					{/if}
					<span>{item}</span>
					{#if marks[index]}<span class="aram-mark">{marks[index]}</span>{/if}
				</span>
			</li>
		{/each}
	</ol>

	{#if skillOrder.length}
		<p class="aram-sub-heading">스킬 마스터 순서</p>
		<ol class="aram-skill-order">
			{#each skillOrder as key (key)}
				<li>
					<span class="aram-ic">
						<img
							src={champion.skills[key].icon}
							alt=""
							width="24"
							height="24"
							loading="lazy"
							decoding="async"
						/>
						<span class="aram-key">{key}</span>{champion.skills[key].name}
					</span>
				</li>
			{/each}
		</ol>
	{/if}

	{#if build.situational.length}
		<p class="aram-sub-heading">{situationalHeading(build.core.length)}</p>
		<ul class="aram-situational">
			{#each build.situational as row (row.item)}
				{@const added = isAddedSituational(row, base, build)}
				<li>
					<span class="aram-when">{row.whenKo}</span>
					<span class="aram-ic" class:aram-ic-added={added}>
						{#if guide.items[row.item]}
							<img
								src={guide.items[row.item]}
								alt=""
								width="24"
								height="24"
								loading="lazy"
								decoding="async"
							/>
						{/if}
						{row.item}
						{#if added}<span class="aram-mark">추가</span>{/if}
					</span>
				</li>
			{/each}
		</ul>
	{/if}

	{#if build.play.length}
		<p class="aram-sub-heading">운영 방법</p>
		<ol class="aram-steps">
			{#each build.play as parts, index (index)}
				<li><RichText {parts} {champion} {guide} {expanded} onselect={toggleAugment} /></li>
			{/each}
		</ol>
		<AugmentDetail augment={expanded ? guide.augments[expanded] : null} />
	{/if}
</div>

{#if champion.boots.length}
	<div class="aram-card">
		<ul class="aram-boots" aria-label="상황별 신발">
			{#each champion.boots as boot (boot.item)}
				<li>
					{#if guide.items[boot.item]}
						<img
							src={guide.items[boot.item]}
							alt=""
							width="32"
							height="32"
							loading="lazy"
							decoding="async"
						/>
					{/if}
					<span><strong>{boot.item}</strong><small>{boot.label}</small></span>
				</li>
			{/each}
		</ul>
	</div>
{/if}
