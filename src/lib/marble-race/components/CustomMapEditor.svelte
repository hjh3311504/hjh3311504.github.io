<script>
	import { ACTIVE_BLOCK_TYPES, BLOCKS } from '../catalog.js';
	import Button from '$lib/components/ui/Button.svelte';
	import Dialog from '$lib/components/ui/Dialog.svelte';
	let { maps = [], disabled = false, onchange, onselect } = $props();
	let dialog = $state();
	let editing = $state(null),
		name = $state('내 맵'),
		layers = $state(['thock', 'clicky', 'wood', 'popit']),
		error = $state('');
	function open(map) {
		editing = map?.id ?? null;
		name = map?.name ?? `내 맵 ${maps.length + 1}`;
		layers = [...(map?.layers ?? ['thock', 'clicky', 'wood', 'popit'])];
		error = '';
		dialog.showModal();
	}
	function save() {
		if (!name.trim() || name.trim().length > 40) {
			error = '맵 이름을1~40자로 입력해 주세요.';
			return;
		}
		const id = editing ?? `custom-${crypto.randomUUID()}`;
		const map = {
			id,
			name: name.trim(),
			layers: [...layers],
			caption: '내가 고른 네 가지 소리',
			icon: '✦',
			colors: ['#76dbc0', '#bba4f5']
		};
		onchange(editing ? maps.map((m) => (m.id === editing ? map : m)) : [...maps, map]);
		onselect(id);
		dialog.close();
	}
</script>

<div class="custom-map-tools">
	<Button
		onclick={() => open(null)}
		aria-disabled={maps.length >= 10}
		disabled={disabled || maps.length >= 10}>내 맵 만들기 ({maps.length}/10)</Button
	>
	{#each maps as map (map.id)}<div class="custom-map-row">
			<span>{map.name}</span><Button size="sm" {disabled} onclick={() => open(map)}>수정</Button
			><Button
				size="sm"
				variant="danger"
				{disabled}
				onclick={() => onchange(maps.filter((m) => m.id !== map.id))}>삭제</Button
			>
		</div>{/each}
</div>
<Dialog
	bind:element={dialog}
	title="내 맵 만들기"
	titleId="custom-map-title"
	closeAction={() => dialog.close()}
>
	<label>맵 이름<input bind:value={name} maxlength="40" /></label>
	{#each layers as type, index (index)}<div class="layer-editor" data-material={type}>
			<label
				>{index + 1}구역<select bind:value={layers[index]}
					>{#each ACTIVE_BLOCK_TYPES as value (value)}<option {value}>{BLOCKS[value].name}</option
						>{/each}</select
				></label
			><Button
				size="sm"
				disabled={index === 0}
				onclick={() => {
					[layers[index - 1], layers[index]] = [layers[index], layers[index - 1]];
				}}>위로</Button
			><Button
				size="sm"
				disabled={index === 3}
				onclick={() => {
					[layers[index + 1], layers[index]] = [layers[index], layers[index + 1]];
				}}>아래로</Button
			>
		</div>{/each}
	<p>같은 블록을 여러 번 고를 수 있어요. 사이에는 분산 통로·버터·젤리 연못이 들어갑니다.</p>
	<p role="alert">{error}</p>
	{#snippet actions()}<Button onclick={() => dialog.close()}>취소</Button><Button
			variant="primary"
			onclick={save}>저장하고 선택</Button
		>{/snippet}
</Dialog>

<style>
	.custom-map-tools {
		display: grid;
		gap: 8px;
		margin-top: 12px;
	}
	.custom-map-row,
	.layer-editor {
		display: flex;
		align-items: center;
		gap: 8px;
	}
	.custom-map-row span {
		flex: 1;
	}
	.layer-editor {
		margin: 14px 0;
	}
	label {
		display: grid;
		gap: 6px;
		flex: 1;
		font-size: 16px;
	}
	input,
	select {
		padding: 10px;
		font: inherit;
		border: 1px solid #8296a7;
		border-radius: 8px;
		max-width: 100%;
	}
	p {
		font-size: 14px;
	}
</style>
