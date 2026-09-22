<script>
	import { Button, Section, SectionHeader, Surface } from '$lib/components/ui';
	import { BLOCKS, ACTIVE_BLOCK_TYPES, SPECIAL_TYPES } from '../catalog.js';
	import { SKILL_TYPES } from '../skills.js';
	import BlockThumbnail from '../BlockThumbnail.svelte';

	let { selectedLayers, disabled = false, waxHits, onpreview } = $props();
	const groups = [
		{ id: 'basic-blocks-title', title: '기본 블록', types: ACTIVE_BLOCK_TYPES },
		{ id: 'special-blocks-title', title: '특수 블록', types: SPECIAL_TYPES },
		{ id: 'skills-title', title: '스킬', types: SKILL_TYPES, skill: true }
	];
</script>

<Section variant="card" class="block-library library-panel" aria-labelledby="block-library-title">
	<SectionHeader
		title="도감"
		titleId="block-library-title"
		description="미리듣기와 경기에서 같은 소리를 사용해요."
	/>
	<p class="library-legend">
		<span class="inclusion-label">포함</span> 선택한 맵에 들어 있는 블록이에요.
	</p>
	{#each groups as group (group.id)}
		<section class="library-group" aria-labelledby={group.id}>
			<h3 id={group.id} class="group-title">{group.title}<span>{group.types.length}종</span></h3>

			<div class="library-grid">
				{#each group.types as type (type)}
					{@const description =
						type === 'butter' ? `${waxHits}번 닿으면 바삭 깨져요.` : BLOCKS[type].description}
					<Surface
						variant="card"
						class={group.skill ? 'skill-card library-item' : 'block-card library-item'}
					>
						<div class="item-heading">
							<BlockThumbnail {type} />
							<div class="item-title">
								<h4 title={BLOCKS[type].name}>{BLOCKS[type].name}</h4>
								{#if selectedLayers.includes(type)}<span
										class="map-material inclusion-label"
										aria-label="선택 맵에 포함">포함</span
									>{/if}
							</div>
						</div>
						<p class="item-description" title={description}>{description}</p>
						<Button
							size="sm"
							aria-label={`${BLOCKS[type].name} 소리 미리듣기`}
							{disabled}
							onclick={() => onpreview(type)}>소리 듣기 ♫</Button
						>
					</Surface>
				{/each}
			</div>
		</section>
	{/each}
</Section>

<style>
	:global(.library-panel) {
		padding: var(--space-28);
		margin-top: var(--space-36);
	}
	.library-group {
		margin-top: var(--space-24);
		min-width: 0;
	}
	.library-group + .library-group {
		padding-top: var(--space-24);
		border-top: 1px solid var(--ui-border);
	}
	.group-title {
		display: flex;
		align-items: center;
		gap: var(--space-8);
		margin: 0 0 var(--space-16);
		font-size: var(--font-size-18);
	}

	.group-title span {
		color: var(--ui-text-muted);
		font-size: var(--font-size-14);
		font-weight: 400;
	}
	.library-grid {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(min(240px, 100%), 1fr));
		gap: var(--space-16);
	}
	:global(.marble-page .library-panel .library-item) {
		display: grid;
		grid-template-columns: minmax(0, 1fr);
		gap: var(--space-12);
		padding: var(--space-16);
		align-items: start;
		background: var(--shell-surface-soft);
	}
	:global(.marble-page .library-panel .library-item > div) {
		min-width: 0;
	}
	.item-heading {
		display: flex;
		align-items: center;
		gap: var(--space-12);
	}
	.item-heading :global(.block-symbol) {
		width: 48px;
		height: 48px;
		flex: 0 0 48px;
	}
	h4 {
		margin: 0;
		font-size: var(--font-size-16);
		line-height: 1.5;
		min-width: 0;
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}
	.item-title {
		min-width: 0;
		display: flex;
		align-items: center;
		gap: var(--space-8);
	}
	.library-legend {
		display: flex;
		align-items: center;
		gap: var(--space-8);
		margin: var(--space-16) 0 0;
		color: var(--ui-text-muted);
		font-size: var(--font-size-14);
		line-height: 1.6;
	}
	.inclusion-label {
		flex-shrink: 0;
		display: inline-flex;
		align-items: center;
		padding: var(--space-2) var(--space-8);
		border: 1px solid color-mix(in srgb, var(--ui-primary) 30%, transparent);
		border-radius: 6px;
		background: color-mix(in srgb, var(--ui-primary) 10%, var(--ui-surface));
		color: var(--ui-primary);
		font-size: var(--font-size-12);
		line-height: 18px;
		font-weight: 600;
		white-space: nowrap;
	}
	.item-description {
		margin: 0;
		min-width: 0;
		color: var(--ui-text-muted);
		font-size: var(--font-size-14);
		line-height: 1.6;
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}
	@media (max-width: 760px) {
		:global(.library-panel) {
			padding: var(--space-20);
		}
	}
</style>
