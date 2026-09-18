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
	class="custom-map-dialog"
	title="내 맵 만들기"
	titleId="custom-map-title"
	description="블록4개를 원하는 순서로 골라 주세요."
	descriptionId="custom-map-description"
	closeAction={() => dialog.close()}
>
	<div class="custom-map-body">
		<label for="custom-map-name">맵 이름</label>
		<input id="custom-map-name" class="ui-field map-name-field" bind:value={name} maxlength="40" />
		<div class="layer-list">
			{#each layers as type, index (index)}
				<div class="layer-editor" data-material={type}>
					<label for={`custom-map-layer-${index}`}>{index + 1}구역</label>
					<div class="layer-controls">
						<div class="layer-select">
							<select id={`custom-map-layer-${index}`} class="ui-field" bind:value={layers[index]}>
								{#each ACTIVE_BLOCK_TYPES as value (value)}<option {value}
										>{BLOCKS[value].name}</option
									>{/each}
							</select>
							<svg
								width="16"
								height="16"
								viewBox="0 0 24 24"
								fill="none"
								stroke="currentColor"
								stroke-width="2"
								stroke-linecap="round"
								stroke-linejoin="round"
								aria-hidden="true"><path d="m6 9 6 6 6-6" /></svg
							>
						</div>
						<Button
							size="sm"
							disabled={index === 0}
							onclick={() => {
								[layers[index - 1], layers[index]] = [layers[index], layers[index - 1]];
							}}>위로</Button
						>
						<Button
							size="sm"
							disabled={index === 3}
							onclick={() => {
								[layers[index + 1], layers[index]] = [layers[index], layers[index + 1]];
							}}>아래로</Button
						>
					</div>
				</div>
			{/each}
		</div>
		<p class="map-note">
			같은 블록을 여러 번 고를 수 있어요. 사이에는 얼음 경사판·크랙 왁스·젤리 연못이 들어갑니다.
		</p>
		{#if error}<p class="map-error" role="alert">{error}</p>{/if}
	</div>
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
	.custom-map-row {
		display: flex;
		align-items: center;
		gap: 8px;
	}
	.custom-map-row span {
		flex: 1;
	}
	:global(.custom-map-dialog[open]) {
		display: flex;
		flex-direction: column;
		position: fixed;
		inset: 0;
		width: min(520px, calc(100vw - 32px));
		max-height: calc(100dvh - 32px);
		padding: 0;
		margin: auto;
		overflow: hidden;
	}
	:global(.custom-map-dialog::backdrop) {
		background: rgb(20 24 32 / 52%);
	}
	:global(.custom-map-dialog .ui-dialog-header) {
		flex: none;
		padding: 24px 24px 18px;
		border-bottom: 1px solid var(--ui-border);
	}
	:global(.custom-map-dialog .ui-dialog-header h2) {
		font-size: 22px;
	}
	:global(.custom-map-dialog .ui-dialog-header p) {
		margin-top: 6px;
		color: var(--ui-text-muted);
		font-size: 14px;
		line-height: 1.6;
	}
	:global(.custom-map-dialog .dialog-close) {
		color: var(--ui-text-muted);
		background: transparent;
		border-color: transparent;
	}
	:global(.custom-map-dialog .ui-dialog-actions) {
		flex: none;
		padding: 16px 24px;
		border-top: 1px solid var(--ui-border);
	}
	.custom-map-body {
		min-height: 0;
		padding: 20px 24px;
		overflow-y: auto;
	}
	label {
		display: block;
		font-size: 16px;
		font-weight: 600;
	}
	.map-name-field {
		margin-top: 8px;
	}
	.layer-list {
		display: grid;
		gap: 16px;
		margin-top: 20px;
	}
	.layer-editor {
		display: grid;
		gap: 8px;
	}
	.layer-controls {
		display: grid;
		grid-template-columns: minmax(0, 1fr) auto auto;
		align-items: center;
		gap: 8px;
	}
	.layer-controls :global(.ui-button) {
		height: 44px;
		padding: 0 12px;
	}
	input,
	select {
		width: 100%;
		min-width: 0;
		height: 44px;
		padding: 0 12px;
		font: inherit;
	}
	.layer-select {
		position: relative;
		min-width: 0;
	}
	select {
		appearance: none;
		padding-right: 36px;
		cursor: pointer;
	}
	.layer-select svg {
		position: absolute;
		right: 12px;
		top: 50%;
		transform: translateY(-50%);
		color: var(--ui-text-muted);
		pointer-events: none;
	}
	.map-note,
	.map-error {
		margin: 20px 0 0;
		font-size: 14px;
		line-height: 1.6;
	}
	.map-note {
		color: var(--ui-text-muted);
	}
	.map-error {
		color: var(--ui-danger);
	}
	@media (max-width: 520px) {
		:global(.custom-map-dialog .ui-dialog-header),
		:global(.custom-map-dialog .ui-dialog-actions),
		.custom-map-body {
			padding-left: 16px;
			padding-right: 16px;
		}
	}
</style>
