<script>
	// 코어 아이템 구매 순서. marks: 증강 빌드에서 바뀐 자리의 표시(추가·변경).
	// notes: 아이템 옆의 갯수·구매 방법 표시(예: 6개, 반복 구매).
	let { items, guide, marks = [], notes = [] } = $props();
</script>

<ol class="aram-core" aria-label="코어 아이템 구매 순서">
	{#each items as item, index (item)}
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
				{#if notes[index]}<span class="aram-item-note">{notes[index]}</span>{/if}
				{#if marks[index]}<span class="aram-mark">{marks[index]}</span>{/if}
			</span>
		</li>
	{/each}
</ol>
