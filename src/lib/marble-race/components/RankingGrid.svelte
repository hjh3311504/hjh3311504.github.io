<script>
	import { tick } from 'svelte';
	import Button from '$lib/components/ui/Button.svelte';
	import MarbleIcon from './MarbleIcon.svelte';
	let { items = [], selectedId = '-1', resetKey = '', onselect, height = 344 } = $props();
	let root;
	let columns = $state(2);
	let scroll = $state(0);
	let visible = $state(false);
	const rowHeight = 204;
	const nameSegments = new Intl.Segmenter('ko', { granularity: 'grapheme' });
	function displayName(name) {
		let text = '',
			count = 0;
		for (const { segment } of nameSegments.segment(name)) {
			if (count++ === 8) return text + '...';
			text += segment;
		}
		return text;
	}
	let rows = $derived(Math.ceil(items.length / columns));
	let contentHeight = $derived(Math.max(0, rows * rowHeight - 12));
	let first = $derived(Math.max(0, Math.floor(scroll / rowHeight) - 2) * columns);
	let last = $derived(
		Math.min(items.length, first + (Math.ceil(height / rowHeight) + 4) * columns)
	);
	$effect(() => {
		let resizeFrame;
		const visibility = new IntersectionObserver(([entry]) => {
			visible = entry.isIntersecting;
		});
		visibility.observe(root);
		const observer = new ResizeObserver(([entry]) => {
			const next = 2 * Math.max(1, Math.min(3, Math.floor((entry.contentRect.width + 12) / 212)));
			cancelAnimationFrame(resizeFrame);
			// 열 수에 따른 높이 변경은 크기 알림 처리가 끝난 다음 프레임에 적용한다.
			if (next !== columns) resizeFrame = requestAnimationFrame(() => (columns = next));
		});
		observer.observe(root);
		return () => {
			visibility.disconnect();
			observer.disconnect();
			cancelAnimationFrame(resizeFrame);
		};
	});
	$effect(() => {
		resetKey;
		columns;
		selectedId;
		root.scrollTop = 0;
		scroll = 0;
	});
	$effect(() => {
		const maximum = Math.max(0, contentHeight - height);
		if (root.scrollTop > maximum) {
			root.scrollTop = maximum;
			scroll = maximum;
		}
	});
</script>

<!-- svelte-ignore a11y_no_noninteractive_tabindex (스크롤 순위 영역을 키보드로 탐색) -->
<div
	class="ranking-grid"
	bind:this={root}
	role="region"
	aria-label="구슬 도착 순위"
	tabindex="0"
	style:height={`${Math.min(height, Math.max(64, contentHeight))}px`}
	onscroll={(event) => {
		scroll = event.currentTarget.scrollTop;
	}}
>
	{#if !items.length}<p class="ranking-empty">일치하는 구슬이 없어요.</p>{/if}
	<ol style:height={`${contentHeight}px`}>
		{#each items.slice(first, last) as marble, index (marble.id)}
			<li
				aria-posinset={first + index + 1}
				aria-setsize={items.length}
				style:top={`${Math.floor((first + index) / columns) * rowHeight}px`}
				style:left={`calc(${(((first + index) % columns) * 100) / columns}% + ${(((first + index) % columns) * 12) / columns}px)`}
				style:width={`calc((100% - ${(columns - 1) * 12}px) / ${columns})`}
			>
				<Button
					class="rank-card"
					style={`--marble-color: ${marble.color}`}
					aria-label={`${marble.rank}등 ${marble.name}, ${marble.id + 1}번, ${marble.finished ? '도착' : `${Math.floor(marble.progress)}%`}. ${String(marble.id) === selectedId ? '구슬 추적 해제' : '구슬 따라가기'}`}
					aria-pressed={String(marble.id) === selectedId}
					onclick={async (event) => {
						const clicked = event.currentTarget;
						onselect(marble.id);
						await tick();
						const next = root.querySelector('[aria-pressed="true"]');
						// 해제로 고정 카드가 화면 밖으로 돌아가도 키보드 포커스를 잃지 않는다.
						(next ?? (clicked.isConnected ? clicked : root)).focus({ preventScroll: true });
					}}
					title={marble.name}
				>
					<span class="rank-card-head">
						<b>{marble.rank}등</b>
						<span class="rank-card-status" class:arrived={marble.finished}
							>{marble.finished ? '✓ 도착' : `${Math.floor(marble.progress)}%`}</span
						>
					</span>
					<span class="rank-card-body">
						<MarbleIcon id={marble.id} color={marble.color} active={visible} />
						<span class="rank-card-name">{displayName(marble.name)}</span>
					</span>
					<span class="rank-card-progress" aria-hidden="true">
						<span
							style:width={`${marble.finished ? 100 : Math.max(0, Math.min(100, marble.progress))}%`}
						></span>
					</span>
					{#if String(marble.id) === selectedId}
						<span class="rank-card-tracking" aria-hidden="true">추적</span>
					{/if}
				</Button>
			</li>
		{/each}
	</ol>
</div>

<style>
	.ranking-grid {
		content-visibility: auto;
		overflow: auto;
		overscroll-behavior: contain;
		margin-top: var(--space-12);
	}
	.ranking-grid:focus-visible {
		outline: 2px solid var(--ui-focus);
		outline-offset: 2px;
	}
	ol {
		position: relative;
		margin: 0;
		padding: 0;
		list-style: none;
	}
	li {
		position: absolute;
		height: 192px;
	}
	.ranking-grid :global(.rank-card) {
		position: relative;
		display: grid;
		grid-template-rows: 36px minmax(0, 1fr) 4px;
		align-items: stretch;
		justify-content: stretch;
		gap: 0;
		width: 100%;
		height: 100%;
		min-width: 0;
		padding: 0;
		overflow: hidden;
		border-color: var(--ui-border);
		border-radius: var(--space-12);
		background: var(--ui-surface);
		text-align: center;
	}
	.ranking-grid :global(.rank-card[aria-pressed='true']) {
		border-color: transparent;
		background: var(--shell-nav-wash);
	}
	.ranking-grid :global(.rank-card[aria-pressed='true']::after) {
		content: '';
		position: absolute;
		inset: 0;
		z-index: 1;
		border: 2px solid var(--ui-primary);
		border-radius: inherit;
		pointer-events: none;
	}
	.rank-card-head {
		display: flex;
		justify-content: space-between;
		align-items: center;
		gap: var(--space-4);
		padding: var(--space-8) var(--space-12);
		border-bottom: 1px dashed var(--ui-border);
		background: color-mix(in srgb, var(--marble-color) 12%, var(--ui-surface));
		font-size: var(--font-size-12);
		line-height: 16px;
		white-space: nowrap;
	}
	.rank-card-body {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		gap: var(--space-8);
		min-width: 0;
		padding: var(--space-8);
	}
	.rank-card-name {
		max-width: 100%;
		font-size: var(--font-size-14);
		font-weight: 700;
		line-height: 20px;
		overflow-wrap: anywhere;
		color: var(--ui-text);
	}
	.rank-card-status {
		color: var(--ui-text-muted);
		font-weight: 500;
	}
	.rank-card-status.arrived {
		color: var(--ui-text);
		font-weight: 700;
	}
	.rank-card-progress {
		grid-row: 3;
		display: block;
		background: var(--ui-border);
	}
	.rank-card-progress > span {
		display: block;
		height: 100%;
		background: var(--marble-color);
	}
	.rank-card-tracking {
		position: absolute;
		right: var(--space-8);
		bottom: var(--space-8);
		padding: var(--space-4) var(--space-8);
		border-radius: var(--space-4);
		background: var(--color-primary);
		color: var(--color-white);
		font-size: var(--font-size-12);
		font-weight: 800;
		line-height: 16px;
	}
	.ranking-empty {
		color: var(--ui-text-muted);
		font-size: var(--font-size-14);
	}
</style>
