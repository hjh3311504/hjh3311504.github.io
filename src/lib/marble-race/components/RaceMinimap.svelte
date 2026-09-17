<script>
	import { blockAngle } from '../physics.js';
	import { BLOCKS } from '../catalog.js';
	let { race, view, overview = false } = $props();
</script>

{#if race}
	<div class="race-minimap" aria-label="전체 경기장 미니맵">
		<svg
			viewBox={`0 0 720 ${race.layout.height}`}
			preserveAspectRatio="none"
			role="img"
			aria-label="흰색 사각형이 현재 보고 있는 위치입니다"
		>
			<rect width="720" height={race.layout.height} fill="#0a1520" />
			{#each race.zones as zone (zone.id)}<rect
					x="12"
					y={zone.start}
					width="696"
					height={zone.end - zone.start}
					fill={BLOCKS[zone.type].color}
					opacity=".75"
				/>{/each}
			{#each [...race.layout.connectors, race.layout.finalApproach] as zone (zone.id)}<rect
					x="12"
					y={zone.start}
					width="696"
					height={zone.end - zone.start}
					fill={BLOCKS[zone.kind].color}
					opacity=".25"
				/>{/each}
			{#each race.blocks.filter((b) => b.connectorId && b.alive) as block (block.id)}
				<rect
					x={block.x - block.w / 2}
					y={block.y - block.h / 2}
					width={block.w}
					height={block.h}
					rx={block.cornerRadius ?? 0}
					fill={BLOCKS[block.type]?.color ?? '#adc7db'}
					transform={`rotate(${(block.angle * 180) / Math.PI} ${block.x} ${block.y})`}
				/>
			{/each}
			{#each race.blocks
				.filter((b) => b.zoneId === 'finale')
				.sort((a, b) => (a.type === 'rotor') - (b.type === 'rotor')) as block (block.id)}
				<rect
					x={block.x - block.w / 2}
					y={block.y - block.h / 2}
					width={block.w}
					height={block.h}
					rx={block.cornerRadius ?? 0}
					fill={block.type === 'rotor' ? '#00e5ed' : '#edffff'}
					transform={`rotate(${(blockAngle(block, race.time) * 180) / Math.PI} ${block.x} ${block.y})`}
				/>
			{/each}
			{#each race.marbles as m (m.id)}{#if !m.finished}<circle
						cx={m.x}
						cy={m.y}
						r="14"
						fill={m.color}
					/>{/if}{/each}
			<rect
				x={overview ? 0 : Math.max(0, view.left)}
				y={overview ? 0 : view.top}
				width={overview ? 720 : Math.min(720, view.right) - Math.max(0, view.left)}
				height={overview
					? race.layout.height
					: Math.min(race.layout.height, view.bottom) - view.top}
				fill="none"
				stroke="white"
				stroke-width="2"
				vector-effect="non-scaling-stroke"
			/>
		</svg><span>현재 위치</span>
	</div>
{/if}

<style>
	.race-minimap {
		position: absolute;
		left: 10px;
		bottom: 12px;
		width: 66px;
		height: 210px;
		pointer-events: none;
		background: #0a1520d9;
		border: 1px solid #64748b;
		border-radius: 7px;
		padding: 5px;
		z-index: 2;
	}
	.race-minimap svg {
		width: 100%;
		height: calc(100% - 20px);
	}
	span {
		display: block;
		text-align: center;
		color: #fff;
		font-size: 12px;
	}
	@media (max-width: 600px) {
		.race-minimap {
			width: 43px;
			height: 148px;
			left: 5px;
			bottom: 5px;
		}
		span {
			font-size: 10px;
		}
	}
</style>
