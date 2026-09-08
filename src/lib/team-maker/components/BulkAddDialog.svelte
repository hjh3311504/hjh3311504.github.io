<script>
	import { Button, Dialog } from '$lib/components/ui';
</script>

<Dialog
	id="bulk-dialog"
	class="app-dialog"
	title="참가자 일괄 추가"
	titleId="bulk-title"
	descriptionId="bulk-description"
	describedBy="bulk-description"
>
	{#snippet descriptionContent()}
		<span>한 줄에 한 명씩 붙여넣으세요.</span>
		<span>쉼표로 구분해도 됩니다.</span>
	{/snippet}
	<label class="sr-only" for="bulk-names">추가할 참가자 이름</label>
	<textarea id="bulk-names" rows="7" placeholder="김지원&#10;이서준&#10;박하은"></textarea>
	{#snippet actions()}
		<Button class="utility-button" variant="outline" data-close-dialog>취소</Button>
		<Button id="bulk-add-button" class="primary-small-button" variant="primary" disabled>
			명단에 추가
		</Button>
	{/snippet}
</Dialog>
