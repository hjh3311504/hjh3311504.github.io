<script>
	import { Section, FormField } from '$lib/components/ui';
	import { SectionHeader } from '$lib/components/ui';
	let {
		content = $bindable(),
		onContentInput,
		titleField,
		error,
		inputError,
		checkPastedContent,
		updateTitle
	} = $props();
</script>

<Section variant="card" padding="card" gap="body" class="qr-panel" aria-labelledby="qr-input-title">
	<SectionHeader
		class="qr-section-header"
		step={1}
		title="내용을 입력하세요"
		titleId="qr-input-title"
	/>
	<FormField
		id="qr-content"
		label="웹페이지 주소"
		required
		help="웹페이지는 https://를 포함한 전체 주소를 넣으세요."
		error={inputError || error}
	>
		{#snippet children({ describedBy, invalid })}
			<input
				class="ui-field"
				type="url"
				id="qr-content"
				bind:value={content}
				oninput={onContentInput}
				onpaste={checkPastedContent}
				ondrop={checkPastedContent}
				placeholder="https://example.com"
				aria-describedby={describedBy}
				aria-invalid={invalid}
				spellcheck="false"
			/>
		{/snippet}
	</FormField>
	<FormField id="qr-title" label="제목" help="QR 이미지 아래에 한 줄로 표시됩니다(최대 10자).">
		{#snippet children({ describedBy })}
			<input
				class="ui-field"
				id="qr-title"
				value={titleField}
				oninput={updateTitle}
				oncompositionend={updateTitle}
				placeholder="예: 오늘의 수업 자료"
				aria-describedby={describedBy}
			/>
		{/snippet}
	</FormField>
</Section>
