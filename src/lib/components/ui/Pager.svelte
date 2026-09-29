<script>
	import Button from './Button.svelte';

	let { currentPage, pageCount, pages, onchange, label = '페이지 이동' } = $props();
</script>

<nav class="ui-pager" aria-label={label}>
	<Button
		size="sm"
		disabled={currentPage === 1}
		aria-label="이전 페이지"
		onclick={() => onchange(currentPage - 1)}>이전</Button
	>
	{#each pages as number (number)}
		<Button
			size="sm"
			variant={number === currentPage ? 'primary' : 'ghost'}
			aria-label={`${number}페이지`}
			aria-current={number === currentPage ? 'page' : undefined}
			onclick={() => onchange(number)}><span class="ui-page-number">{number}</span></Button
		>
	{/each}
	<Button
		size="sm"
		disabled={currentPage === pageCount}
		aria-label="다음 페이지"
		onclick={() => onchange(currentPage + 1)}>다음</Button
	>
</nav>
