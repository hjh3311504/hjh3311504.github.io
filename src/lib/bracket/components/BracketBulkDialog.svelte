<script>
	import { Button, Dialog, FormField } from '$lib/components/ui';
	import { MAX_TEAMS } from '$lib/bracket/bracket.js';
	import { TEAM_NAME_MAX, parseBulkTeams } from '$lib/bracket/teams.js';

	let { existing, onadd } = $props();
	let element = $state();
	let text = $state('');
	let mode = $state('append');
	let error = $state('');

	export function open() {
		text = '';
		mode = existing.length ? 'append' : 'replace';
		error = '';
		element?.showModal();
	}

	function close() {
		element?.close();
	}

	function submit() {
		const result = parseBulkTeams(text, { existing, mode });
		if (result.error) {
			error = result.error;
			return;
		}
		onadd(result.names, mode);
		close();
	}
</script>

<Dialog
	bind:element
	id="bracket-bulk"
	title="여러 팀 한 번에 추가"
	titleId="bracket-bulk-title"
	description="한 줄에 한 팀씩 입력하세요. 쉼표로 나눠도 되고 빈 줄은 건너뛰어요."
	descriptionId="bracket-bulk-description"
	closeLabel="여러 팀 추가 닫기"
	closeAction={close}
>
	<FormField
		id="bracket-bulk-text"
		label="팀 이름"
		{error}
		help={`팀 이름은 ${TEAM_NAME_MAX}자, 팀은 ${MAX_TEAMS}개까지예요.`}
	>
		{#snippet children({ describedBy, invalid })}
			<textarea
				class="ui-field bracket-bulk-text"
				id="bracket-bulk-text"
				rows="8"
				bind:value={text}
				oninput={() => (error = '')}
				placeholder="호랑이&#10;늑대&#10;여우&#10;독수리"
				aria-describedby={describedBy}
				aria-invalid={invalid}></textarea>
		{/snippet}
	</FormField>
	<fieldset class="bracket-choice-group">
		<legend>추가 방식</legend>
		<label class="bracket-choice"
			><input type="radio" name="bracket-bulk-mode" value="append" bind:group={mode} />
			<span>지금 목록 뒤에 덧붙이기</span></label
		>
		<label class="bracket-choice"
			><input type="radio" name="bracket-bulk-mode" value="replace" bind:group={mode} />
			<span>지금 목록을 바꾸기</span></label
		>
	</fieldset>
	{#snippet actions()}
		<Button variant="outline" onclick={close}>취소</Button>
		<Button variant="primary" onclick={submit}>추가하기</Button>
	{/snippet}
</Dialog>
