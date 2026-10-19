<script>
	import { Button, FormField, Section, SectionHeader } from '$lib/components/ui';

	let {
		title = $bindable(),
		order = $bindable(),
		titleError,
		summary,
		reason,
		hasBracket,
		outdated,
		onbuild
	} = $props();
</script>

<Section
	variant="card"
	padding="card"
	gap="body"
	class="bracket-panel"
	aria-labelledby="bracket-settings-title"
>
	<SectionHeader step={2} title="대진 설정" titleId="bracket-settings-title" />
	<FormField
		id="bracket-title"
		label="대진표 제목 (선택)"
		help="대진표 위와 인쇄물에 표시돼요(최대 20자)."
		error={titleError}
	>
		{#snippet children({ describedBy, invalid })}
			<input
				class="ui-field"
				id="bracket-title"
				bind:value={title}
				placeholder="예: 10월 사내 풋살 대회"
				aria-describedby={describedBy}
				aria-invalid={invalid}
			/>
		{/snippet}
	</FormField>
	<fieldset class="bracket-choice-group bracket-order">
		<legend>배치 순서</legend>
		<label class="bracket-choice"
			><input type="radio" name="bracket-order" value="input" bind:group={order} />
			<span>입력 순서<small>위에서부터 1번 시드</small></span></label
		>
		<label class="bracket-choice"
			><input type="radio" name="bracket-order" value="random" bind:group={order} />
			<span>무작위<small>팀 순서를 섞어서 배치</small></span></label
		>
	</fieldset>
	{#if summary}
		<p class="bracket-summary">
			<strong>{summary.teams}팀</strong> · 라운드 {summary.rounds}개 · 부전승 {summary.byes}개 ·
			경기
			{summary.matches}개
		</p>
	{/if}
	{#if hasBracket && outdated}
		<p class="bracket-note" role="status">팀 목록이 바뀌었어요. 다시 만들면 대진표에 반영돼요.</p>
	{/if}
	<Button
		variant="primary"
		size="lg"
		fullWidth
		disabled={Boolean(reason)}
		aria-describedby={reason ? 'bracket-build-reason' : undefined}
		onclick={onbuild}
	>
		{hasBracket && outdated ? '대진표 다시 만들기' : '대진표 만들기'}
	</Button>
	{#if reason}<p class="bracket-note" id="bracket-build-reason">{reason}</p>{/if}
</Section>
