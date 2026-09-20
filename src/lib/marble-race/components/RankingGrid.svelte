<script>
	import Button from '$lib/components/ui/Button.svelte';
	let { items = [], selectedId = '-1', resetKey = '', onselect, height = 344 } = $props();
	let root;
	let columns = $state(1);
	let scroll = $state(0);
	const rowHeight = 116;
	let rows = $derived(Math.ceil(items.length / columns));
	let contentHeight = $derived(Math.max(0, rows * rowHeight - 12));
	let first = $derived(Math.max(0, Math.floor(scroll / rowHeight) - 2) * columns);
	let last = $derived(
		Math.min(items.length, first + (Math.ceil(height / rowHeight) + 4) * columns)
	);
	$effect(() => {
		const observer = new ResizeObserver(([entry]) => {
			columns = Math.max(1, Math.min(3, Math.floor((entry.contentRect.width + 12) / 212)));
		});
		observer.observe(root);
		return () => observer.disconnect();
	});
	$effect(() => {
		resetKey;
		columns;
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
					aria-label={`${marble.rank}등 ${marble.name}, ${marble.id + 1}번, ${marble.finished ? '도착' : `${Math.floor(marble.progress)}%`}. 구슬 따라가기`}
					aria-pressed={String(marble.id) === selectedId}
					onclick={() => onselect(marble.id)}
					title={marble.name}
				>
					<span class="rank-card-head"
						><b>{marble.rank}등</b><i style:background={marble.color}></i><small
							>{marble.id + 1}번</small
						></span
					>
					<span class="rank-card-name">{marble.name}</span>
					<span class="rank-card-status"
						>{marble.finished ? '도착' : `${Math.floor(marble.progress)}% 진행`}</span
					>
				</Button>
			</li>
		{/each}
	</ol>
</div>

<style>
	.ranking-grid {
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
		height: 104px;
	}
	.ranking-grid :global(.rank-card) {
		display: grid;
		grid-template-rows: 20px 40px 20px;
		justify-content: stretch;
		gap: var(--space-2);
		width: 100%;
		height: 100%;
		min-width: 0;
		padding: var(--space-8) var(--space-12);
		border-color: var(--ui-border);
		background: var(--ui-surface-soft);
		text-align: left;
	}
	.ranking-grid :global(.rank-card[aria-pressed='true']) {
		border-color: var(--ui-primary);
		background: var(--shell-nav-wash);
	}
	.rank-card-head {
		display: flex;
		gap: var(--space-8);
		align-items: center;
		font-size: var(--font-size-14);
	}
	i {
		width: 16px;
		height: 16px;
		border-radius: 50%;
		flex: none;
	}
	small {
		margin-left: auto;
		font-size: var(--font-size-14);
	}
	.rank-card-name {
		font-size: var(--font-size-16);
		line-height: 20px;
		overflow: hidden;
		display: -webkit-box;
		-webkit-line-clamp: 2;
		line-clamp: 2;
		-webkit-box-orient: vertical;
		overflow-wrap: anywhere;
		color: var(--ui-text);
	}
	.rank-card-status {
		color: var(--ui-text-muted);
		font-size: var(--font-size-14);
		line-height: 20px;
	}
	.ranking-empty {
		color: var(--ui-text-muted);
		font-size: var(--font-size-14);
	}
</style>
