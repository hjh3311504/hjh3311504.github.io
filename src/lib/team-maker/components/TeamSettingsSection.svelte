<script>
	import { Button, IconButton, Section, SectionHeader } from '$lib/components/ui';
</script>

<Section variant="raised" class="card settings-card" aria-labelledby="settings-title">
	<SectionHeader step={2} title="나누는 방식" titleId="settings-title" />
	<div class="mode-switch" role="radiogroup" aria-label="나누는 방식">
		<Button id="team-mode-button" variant="ghost" role="radio" aria-checked="true"
			>팀 수로 나누기</Button
		>
		<Button id="size-mode-button" variant="ghost" role="radio" aria-checked="false"
			>인원 수로 나누기</Button
		>
	</div>

	<div class="stepper-row">
		<div class="stepper-copy">
			<label id="split-value-label" for="split-value">팀 수</label>
			<p id="setup-hint" role="status">2개부터 20개까지 정할 수 있습니다.</p>
		</div>
		<div class="stepper">
			<IconButton id="decrease-value" variant="outline" label="값 줄이기">−</IconButton>
			<output id="split-value" aria-labelledby="split-value-label">2</output>
			<IconButton id="increase-value" variant="outline" label="값 늘리기">+</IconButton>
		</div>
	</div>
</Section>

<Button
	id="make-teams-button"
	class="primary-button make-button"
	variant="primary"
	size="lg"
	fullWidth
	disabled
	aria-describedby="setup-hint"
>
	팀 만들기
</Button>
