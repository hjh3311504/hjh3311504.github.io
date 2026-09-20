<script>
	import SectionHeader from '$lib/components/ui/SectionHeader.svelte';
	import Button from '$lib/components/ui/Button.svelte';
	import { Surface, Section } from '$lib/components/ui';
	import CustomMapEditor from '$lib/marble-race/components/CustomMapEditor.svelte';
	let {
		namesText = $bindable(),
		mapId,
		mode = $bindable(),
		rangeText,
		nth = $bindable(),
		customMaps,
		status,
		parsed,
		busy,
		maps,
		range,
		countError,
		modeLabel,
		requestEdit,
		setRangeBoundary,
		selectMap,
		changeMaps
	} = $props();
</script>

<aside class="race-settings" aria-label="경기 설정">
	{#if busy}<Surface variant="card" class="settings-lock" role="status"
			><strong>경기 설정이 잠겨 있어요</strong>
			<p>경기 중에는 참가자·맵·당첨 방식을 변경할 수 없습니다.</p>
			<Button fullWidth onclick={requestEdit}
				>{status === 'loading' ? '준비 취소하고 설정 변경' : '경기 종료하고 설정 변경'}</Button
			></Surface
		>{/if}
	<Section variant="card" padding="compact" class="race-panel"
		><SectionHeader class="panel-title" title="참가자" step={1}>
			{#snippet meta()}<span class="count-badge">{parsed.count.toLocaleString()}개</span>{/snippet}
		</SectionHeader>
		<label for="race-names">참가자 이름</label><textarea
			id="race-names"
			class="ui-field"
			bind:value={namesText}
			disabled={busy}
			rows="7"
			spellcheck="false"
			aria-describedby="names-help names-error"
			aria-invalid={Boolean(parsed.error)}
			placeholder="토끼*10&#10;고양이*5"></textarea>
		<p id="names-help" class="field-help">토끼*10처럼 입력하면 같은 구슬을 여러 개 넣어요.</p>
		<p id="names-error" class="field-error">{parsed.error}</p>
		{#if parsed.count > 1000}<p class="field-help">
				구슬이 많으면 준비와 경기에 시간이 더 걸릴 수 있어요. 준비 중에도 취소할 수 있습니다.
			</p>{/if}
	</Section>
	<Section variant="card" padding="compact" class="race-panel"
		><SectionHeader class="panel-title" title="맵 고르기" step={2} />
		<div class="map-options">
			{#each maps as map (map.id)}<Button
					class={`map-option ${mapId === map.id ? 'selected' : ''}`}
					disabled={busy}
					aria-label={map.name}
					aria-pressed={mapId === map.id}
					onclick={() => selectMap(map.id)}
					title={map.name}
					><span
						class="map-symbol"
						style={`--map-color:${map.colors[0]};--map-second:${map.colors[1]}`}>{map.icon}</span
					><span class="map-name"><strong>{map.name}</strong></span><span aria-hidden="true"
						>{mapId === map.id ? '✓' : ''}</span
					></Button
				>{/each}
		</div>
		<CustomMapEditor
			maps={customMaps}
			disabled={busy}
			onchange={changeMaps}
			onselect={selectMap}
		/></Section
	>
	<Section variant="card" padding="compact" class="race-panel draw-settings"
		><SectionHeader class="panel-title" title="당첨 방식" step={3} />
		<div class="winner-options" role="group" aria-label="당첨 방식">
			{#each [['first', '첫번째'], ['last', '마지막'], ['multiple', '여러명'], ['nth', 'n번째']] as [value, label] (value)}<Button
					class={mode === value ? 'selected' : ''}
					aria-pressed={mode === value}
					disabled={busy}
					onclick={() => (mode = value)}>{label}</Button
				>{/each}
		</div>
		{#if mode === 'multiple' || mode === 'nth'}
			<fieldset class="winner-settings" disabled={busy}>
				<legend>{mode === 'multiple' ? '당첨 순위 범위' : '당첨 순번'}</legend>
				<div class="winner-settings-inputs" class:is-range={mode === 'multiple'}>
					{#if mode === 'multiple'}<label class="sr-only" for="winner-range-start">시작 순위</label>
						<input
							id="winner-range-start"
							class="ui-field"
							type="number"
							inputmode="numeric"
							min="1"
							max={parsed.count}
							step="1"
							value={rangeText.split('~')[0]?.trim() ?? ''}
							oninput={(event) => setRangeBoundary(0, event.currentTarget.value)}
							aria-invalid={Boolean(countError)}
							aria-describedby="winner-input-help winner-error"
						/>
						<span aria-hidden="true">~</span>
						<label class="sr-only" for="winner-range-end">끝 순위</label>
						<input
							id="winner-range-end"
							class="ui-field"
							type="number"
							inputmode="numeric"
							min="1"
							max={parsed.count}
							step="1"
							value={rangeText.split('~')[1]?.trim() ?? ''}
							oninput={(event) => setRangeBoundary(1, event.currentTarget.value)}
							aria-invalid={Boolean(countError)}
							aria-describedby="winner-input-help winner-error"
						/>
					{:else}
						<label class="sr-only" for="winner-nth">당첨 순번</label>
						<input
							id="winner-nth"
							class="ui-field"
							type="number"
							inputmode="numeric"
							min="1"
							max={parsed.count}
							step="1"
							bind:value={nth}
							aria-invalid={Boolean(countError)}
							aria-describedby="winner-input-help winner-error"
						/>
					{/if}
				</div>
			</fieldset>
			<p id="winner-input-help" class="field-help">
				{mode === 'multiple'
					? '시작4, 끝6이면4·5·6번째로 도착한 구슬이 당첨돼요.'
					: '순번4를 입력하면4번째로 도착한 구슬이 당첨돼요.'}
			</p>
		{/if}
		<p id="winner-error" class="field-error">{countError}</p>
		<p class="field-help">
			{mode === 'multiple' && !countError
				? `${range.start}~${range.end}번째로 도착한 구슬 ${range.count}개가 당첨됩니다.`
				: `${modeLabel} 구슬이 당첨됩니다.`}
		</p></Section
	>
</aside>
