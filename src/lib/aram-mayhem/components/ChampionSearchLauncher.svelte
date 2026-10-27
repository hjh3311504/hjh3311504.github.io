<script>
	import { onMount } from 'svelte';
	import { Button, Dialog } from '$lib/components/ui';
	import ChampionSearch from './ChampionSearch.svelte';

	// 화면 오른쪽 아래에 떠 있는 챔피언 검색 버튼. 버튼이나 / 키로 검색 창을 연다.
	let { champions, onselect } = $props();
	let dialog = $state();
	let input = $state();
	let search = $state();
	// JavaScript가 연결되기 전에는 눌러도 동작하지 않으므로 버튼을 숨긴다.
	let ready = $state(false);

	function open() {
		if (dialog.open) return;
		dialog.showModal();
		input?.focus();
	}

	function choose(id) {
		dialog.close();
		onselect(id);
	}

	// 글자를 쓰지 않는 input. 여기에 초점이 있어도 / 로 검색 창을 연다.
	const NON_TEXT_INPUTS = new Set([
		'button',
		'checkbox',
		'color',
		'file',
		'image',
		'radio',
		'range',
		'reset',
		'submit'
	]);

	function isTyping(target) {
		if (!(target instanceof HTMLElement)) return false;
		if (target.isContentEditable || target instanceof HTMLTextAreaElement) return true;
		return target instanceof HTMLInputElement && !NON_TEXT_INPUTS.has(target.type);
	}

	// 글자를 쓰는 중이거나 다른 창·메뉴 서랍이 열려 있을 때는 / 를 그대로 둔다.
	function onkeydown(event) {
		if (event.key !== '/' || event.ctrlKey || event.metaKey || event.altKey) return;
		if (event.isComposing || event.defaultPrevented || isTyping(event.target)) return;
		if (document.querySelector('dialog[open], [aria-modal="true"]')) return;
		event.preventDefault();
		open();
	}

	onMount(() => (ready = true));
</script>

<svelte:window {onkeydown} />

{#if ready}
	<Button class="aram-search-fab" variant="primary" size="sm" onclick={open} aria-haspopup="dialog">
		<svg
			width="16"
			height="16"
			viewBox="0 0 24 24"
			fill="none"
			stroke="currentColor"
			stroke-width="2.4"
			stroke-linecap="round"
			stroke-linejoin="round"
			aria-hidden="true"
		>
			<circle cx="11" cy="11" r="7"></circle>
			<path d="m20 20-3.5-3.5"></path>
		</svg>
		챔피언 검색
		<kbd class="aram-search-key" aria-hidden="true">/</kbd>
	</Button>
{/if}
<!-- 떠 있는 버튼이 맨 아래 고지 글자를 가리지 않도록 끝에 빈 공간을 둔다. -->
<div class="aram-search-fab-space" aria-hidden="true"></div>

<Dialog
	bind:element={dialog}
	class="aram-search-dialog"
	placement="top"
	title="챔피언 검색"
	titleId="aram-search-title"
	closeAction={() => dialog.close()}
	onclose={() => search.reset()}
	data-ready={ready || undefined}
>
	<!-- Escape·닫기 버튼·챔피언 선택 중 어떻게 닫든 다음에 열 때 빈 검색창으로 시작한다. -->
	<ChampionSearch bind:this={search} {champions} onselect={choose} bind:input />
</Dialog>
