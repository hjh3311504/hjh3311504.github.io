<script>
	import { Button, Dialog, EmptyState } from '$lib/components/ui';
</script>

<Dialog
	id="roster-dialog"
	class="app-dialog roster-dialog"
	title="명단 저장·불러오기"
	titleId="roster-title"
	description="저장할 이름을 적어 주세요. 이 브라우저에만 보관됩니다."
	descriptionId="roster-description"
	describedBy="roster-description"
>
	<form id="save-roster-form" class="roster-save-row">
		<label class="sr-only" for="roster-name">명단 이름</label>
		<input id="roster-name" type="text" placeholder="예: 수요일 풋살" autocomplete="off" />
		<Button
			id="save-roster-button"
			class="primary-small-button"
			type="submit"
			variant="primary"
			disabled>저장</Button
		>
	</form>
	<EmptyState as="p" id="rosters-empty" class="subtle-empty">
		저장한 명단이 없습니다. 이름을 적고 저장을 누르면 여기에 쌓입니다.
	</EmptyState>
	<ul id="rosters-list" class="rosters-list"></ul>
</Dialog>
