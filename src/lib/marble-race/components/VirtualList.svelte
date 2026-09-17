<script>
	let { items = [], height = 280, rowHeight = 48, label = '목록', children } = $props();
	let scroll = $state(0);
	let start = $derived(Math.max(0, Math.min(items.length - 1, Math.floor(scroll / rowHeight) - 3)));
	let end = $derived(Math.min(items.length, start + Math.ceil(height / rowHeight) + 6));
</script>

<!-- svelte-ignore a11y_no_noninteractive_tabindex (스크롤 목록을 키보드로 탐색) -->
<div
	class="virtual-list"
	style:height={`${Math.min(height, Math.max(rowHeight, items.length * rowHeight))}px`}
	onscroll={(event) => (scroll = event.currentTarget.scrollTop)}
	role="region"
	aria-label={label}
	tabindex="0"
>
	<ol style:height={`${items.length * rowHeight}px`}>
		{#each items.slice(start, end) as item, index (item.id)}<li
				style:top={`${(start + index) * rowHeight}px`}
				style:height={`${rowHeight}px`}
				aria-posinset={start + index + 1}
				aria-setsize={items.length}
			>
				{@render children(item, start + index)}
			</li>{/each}
	</ol>
</div>

<style>
	.virtual-list {
		overflow: auto;
		overscroll-behavior: contain;
	}
	ol {
		position: relative;
		margin: 0;
		padding: 0;
		list-style: none;
	}
	li {
		position: absolute;
		left: 0;
		right: 0;
		display: flex;
		align-items: center;
		gap: 8px;
		padding: 4px 8px;
		box-sizing: border-box;
		font-size: 14px;
	}
</style>
