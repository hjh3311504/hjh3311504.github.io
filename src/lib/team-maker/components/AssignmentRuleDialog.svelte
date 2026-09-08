<script>
	import { Button, Dialog } from '$lib/components/ui';
</script>

<Dialog
	id="rule-dialog"
	class="app-dialog"
	title="같은 팀으로 지정"
	titleId="rule-dialog-title"
	description="고른 사람들은 항상 같은 팀에 배정됩니다."
	descriptionId="rule-dialog-description"
	describedBy="rule-dialog-description"
>
	<ul id="rule-picker-list" class="picker-list"></ul>
	<p id="rule-picker-note" class="dialog-note error-text">두 명 이상 골라 주세요.</p>
	{#snippet actions()}
		<Button class="utility-button" variant="outline" data-close-dialog>취소</Button>
		<Button id="save-rule-button" class="primary-small-button" variant="primary" disabled>
			규칙 추가
		</Button>
	{/snippet}
</Dialog>
