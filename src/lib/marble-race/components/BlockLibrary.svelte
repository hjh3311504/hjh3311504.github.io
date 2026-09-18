<script>
	import { Button, Section, SectionHeader, Surface } from '$lib/components/ui';
	import { BLOCKS, ACTIVE_BLOCK_TYPES, SPECIAL_TYPES } from '../catalog.js';
	import BlockThumbnail from '../BlockThumbnail.svelte';

	let { selectedLayers, disabled = false, waxHits, onpreview } = $props();
	const groups = [
		{ id: 'basic-blocks-title', title: '기본 블록', types: ACTIVE_BLOCK_TYPES },
		{ id: 'special-blocks-title', title: '특수 블록', types: SPECIAL_TYPES },
		{ id: 'skills-title', title: '스킬', types: ['pulse'], skill: true }
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
		padding: 28px;
		margin-top: 36px;
	}
	:global(.library-panel .ui-section-header h2) {
		margin: 0;
		font-size: 22px;
	}
	:global(.library-panel .ui-section-header p) {
		margin-top: 8px;
		font-size: 14px;
	}
	.library-group {
		margin-top: 24px;
		min-width: 0;
	}
	.library-group + .library-group {
		padding-top: 24px;
		border-top: 1px solid var(--ui-border);
	}
	.group-title {
		display: flex;
		align-items: center;
		gap: 8px;
		margin: 0 0 14px;
		font-size: 18px;
	}

	.group-title span {
		color: var(--ui-text-muted);
		font-size: 14px;
		font-weight: 400;
	}
	.library-grid {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(min(240px, 100%), 1fr));
		gap: 14px;
	}
	:global(.marble-page .library-panel .library-item) {
		display: grid;
		grid-template-columns: minmax(0, 1fr);
		gap: 10px;
		padding: 16px;
		align-items: start;
		background: var(--shell-surface-soft);
	}
	:global(.marble-page .library-panel .library-item > div) {
		min-width: 0;
	}
	.item-heading {
		display: flex;
		align-items: center;
		gap: 12px;
	}
	.item-heading :global(.block-symbol) {
		width: 48px;
		height: 48px;
		flex: 0 0 48px;
	}
	h4 {
		margin: 0;
		font-size: 16px;
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
		gap: 6px;
	}
	.library-legend {
		display: flex;
		align-items: center;
		gap: 8px;
		margin: 14px 0 0;
		color: var(--ui-text-muted);
		font-size: 14px;
		line-height: 1.6;
	}
	.inclusion-label {
		flex-shrink: 0;
		display: inline-flex;
		align-items: center;
		padding: 2px 8px;
		border: 1px solid color-mix(in srgb, var(--ui-primary) 30%, transparent);
		border-radius: 6px;
		background: color-mix(in srgb, var(--ui-primary) 10%, var(--ui-surface));
		color: var(--ui-primary);
		font-size: 12px;
		line-height: 18px;
		font-weight: 600;
		white-space: nowrap;
	}
	.item-description {
		margin: 0;
		min-width: 0;
		color: var(--ui-text-muted);
		font-size: 14px;
		line-height: 1.6;
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}
	@media (max-width: 760px) {
		:global(.library-panel) {
			padding: 18px;
		}
	}
</style>
