<script>
	import { blockAngle, arcStart } from '../physics.js';
	import { BLOCKS } from '../catalog.js';
	let { race, view, overview = false, oninspect = () => {}, onleave = () => {} } = $props();
	let map = $state();
	const blockGroups = new WeakMap();
	let groups = $derived.by(() => {
		if (!race) return { connectors: [], finale: [] };
		let groups = blockGroups.get(race.blocks);
		if (!groups) {
			groups = {
				connectors: race.blocks.filter((b) => b.connectorId),
				finale: race.blocks
					.filter((b) => b.zoneId === 'finale')
					.sort((a, b) => (a.type === 'rotor') - (b.type === 'rotor'))
			};
			blockGroups.set(race.blocks, groups);
		}
		return groups;
	});
	let dots = $state();
	let dimensions = $state({ width: 0, height: 0 });
	$effect(() => {
		if (!dots) return;
		const observer = new ResizeObserver(([entry]) => {
			dimensions = { width: entry.contentRect.width, height: entry.contentRect.height };
		});
		observer.observe(dots);
		return () => observer.disconnect();
	});
	$effect(() => {
		if (!dots || !race || !dimensions.width || !dimensions.height) return;
		view; // 표시 좌표가 갱신된 프레임에 구슬도 함께 그린다.
		const ctx = dots.getContext('2d');
		const dpr = Math.min(window.devicePixelRatio || 1, 2);
		const width = Math.round(dimensions.width * dpr),
			height = Math.round(dimensions.height * dpr);
		if (dots.width !== width || dots.height !== height) {
			dots.width = width;
			dots.height = height;
		}
		ctx.setTransform(1, 0, 0, 1, 0, 0);
		ctx.clearRect(0, 0, width, height);
		ctx.scale(width / 720, height / race.layout.height);
		for (const m of race.marbles) {
			if (m.finished) continue;
			ctx.fillStyle = m.color;
			ctx.beginPath();
			ctx.arc(m.x, m.y, 14, 0, Math.PI * 2);
			ctx.fill();
		}
	});
	function arcPath(block) {
		const start = arcStart(block, race.time),
			end = start + block.arc.sweep,
			radius = block.arc.radius;
		return `M ${block.x + Math.cos(start) * radius} ${block.y + Math.sin(start) * radius} A ${radius} ${radius} 0 ${block.arc.sweep > Math.PI ? 1 : 0} 1 ${block.x + Math.cos(end) * radius} ${block.y + Math.sin(end) * radius}`;
	}
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
				{#each groups.connectors.filter((b) => b.alive) as block (block.id)}
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
				{#each groups.finale as block (block.id)}
					{#if block.arc}<path
							d={arcPath(block)}
							fill="none"
							stroke="#edffff"
							stroke-width={block.arc.thickness}
							stroke-linecap="round"
						/>{:else}<rect
							x={block.x - block.w / 2}
							y={block.y - block.h / 2}
							width={block.w}
							height={block.h}
							rx={block.cornerRadius ?? 0}
							fill={block.type === 'rotor' ? '#00e5ed' : '#edffff'}
							transform={`rotate(${(blockAngle(block, race.time) * 180) / Math.PI} ${block.x} ${block.y})`}
						/>
					{/if}{/each}
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
			</svg><canvas bind:this={dots} class="minimap-dots" aria-hidden="true"></canvas></button
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
		position: relative;
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
	.minimap-dots {
		position: absolute;
		inset: 0;
		width: 100%;
		height: 100%;
		pointer-events: none;
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
