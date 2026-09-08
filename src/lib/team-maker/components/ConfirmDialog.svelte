<script>
	import { Button, Dialog } from '$lib/components/ui';
</script>

<Dialog
	id="confirm-dialog"
	class="app-dialog confirm-dialog"
	titleId="confirm-title"
	describedBy="confirm-description confirm-warning"
	showClose={false}
>
	{#snippet header()}
		<h2 id="confirm-title">참가자 명단을 삭제할까요?</h2>
		<p id="confirm-description">삭제할 내용을 확인해 주세요.</p>
	{/snippet}
	<p id="confirm-warning" class="confirm-warning">되돌릴 수 없습니다.</p>
	{#snippet actions()}
		<Button id="cancel-confirm-button" class="utility-button" variant="outline">취소</Button>
		<Button id="confirm-action-button" class="danger-filled-button" variant="danger">삭제</Button>
	{/snippet}
</Dialog>
