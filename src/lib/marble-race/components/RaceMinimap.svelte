<script>
	import { blockAngle } from '../physics.js';
	import { BLOCKS } from '../catalog.js';
	let { race, view, overview = false, oninspect = () => {}, onleave = () => {} } = $props();
	let map = $state();
	let pressed = $state(false);
	let keyboardY = 0;
	function point(event) {
		if (event.pointerType !== 'mouse' && !pressed) return;
		const bounds = map.getBoundingClientRect();
		keyboardY = Math.max(
			0,
			Math.min(
				race.layout.height,
				((event.clientY - bounds.top) / bounds.height) * race.layout.height
			)
		);
		oninspect(keyboardY);
	}
	function release(event) {
		if (event.pointerType === 'mouse') return;
		pressed = false;
		onleave();
	}
	function keydown(event) {
		if (event.key === 'Escape') {
			event.preventDefault();
			onleave();
			return;
		}
		if (!['ArrowUp', 'ArrowDown', 'Home', 'End'].includes(event.key)) return;
		event.preventDefault();
		keyboardY =
			event.key === 'Home'
				? 0
				: event.key === 'End'
					? race.layout.height
					: Math.max(
							0,
							Math.min(
								race.layout.height,
								keyboardY + ((event.key === 'ArrowDown' ? 1 : -1) * (view.bottom - view.top)) / 2
							)
						);
		oninspect(keyboardY);
	}
</script>

{#if race}
	<div class="race-minimap">
		<button
			class="minimap-control"
			bind:this={map}
			aria-label="전체 경기장 미니맵. 마우스를 올리거나 누르는 동안 탐색합니다. 방향키로 이동하고 Escape로 복귀합니다."
			onpointerenter={point}
			onpointermove={point}
			onpointerdown={(event) => {
				if (event.pointerType !== 'mouse') {
					pressed = true;
					event.currentTarget.setPointerCapture(event.pointerId);
				}
				point(event);
			}}
			onpointerup={release}
			onpointercancel={release}
			onlostpointercapture={release}
			onpointerleave={(event) => {
				if (event.pointerType === 'mouse') onleave();
			}}
			onfocus={() => {
				keyboardY = (view.top + view.bottom) / 2;
			}}
			onblur={() => {
				pressed = false;
				onleave();
			}}
			onkeydown={keydown}
			onclick={(event) => event.stopPropagation()}
		>
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
			</svg></button
		><span aria-hidden="true">구역 탐색</span>
	</div>
{/if}

<style>
	.race-minimap {
		position: absolute;
		left: 10px;
		bottom: 12px;
		width: 100px;
		height: min(300px, calc(100% - 24px));
		pointer-events: auto;
		background: var(--color-background-25);
		border: 1px solid var(--color-border-8);
		border-radius: 8px;
		padding: var(--space-4);
		z-index: 2;
	}
	.minimap-control {
		display: block;
		width: 100%;
		height: calc(100% - 20px);
		padding: 0;
		border: 0;
		background: transparent;
		cursor: crosshair;
		touch-action: none;
	}
	.minimap-control:focus-visible {
		outline: 2px solid var(--ui-focus);
		outline-offset: 2px;
	}
	.race-minimap svg {
		display: block;
		width: 100%;
		height: 100%;
	}
	span {
		display: block;
		text-align: center;
		color: var(--color-white);
		font-size: var(--font-size-12);
	}
	@media (max-width: 600px) {
		.race-minimap {
			width: 64px;
			height: min(220px, calc(100% - 12px));
			left: 5px;
			bottom: 5px;
		}
		span {
			font-size: var(--font-size-12);
		}
	}
</style>
