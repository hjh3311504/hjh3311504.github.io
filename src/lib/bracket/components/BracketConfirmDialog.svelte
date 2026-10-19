<script>
	import { Button, Dialog } from '$lib/components/ui';

	// 확인이 필요한 작업마다 같은 창을 쓴다. open()으로 내용과 콜백을 넘긴다.
	let { id } = $props();
	let element = $state();
	let request = $state({ title: '', description: '', confirmLabel: '', cancelLabel: '취소' });
	let onconfirm = () => {};
	let oncancel = () => {};
	let opener = null;

	export function open(next) {
		request = { cancelLabel: '취소', ...next };
		onconfirm = next.onconfirm ?? (() => {});
		oncancel = next.oncancel ?? (() => {});
		opener = document.activeElement;
		element?.showModal();
	}

	function finish(confirmed) {
		const action = confirmed ? onconfirm : oncancel;
		onconfirm = () => {};
		oncancel = () => {};
		if (element?.open) element.close();
		action();
		if (opener?.isConnected) opener.focus();
		opener = null;
	}
</script>

<Dialog
	bind:element
	{id}
	title={request.title}
	titleId={`${id}-title`}
	description={request.description}
	descriptionId={`${id}-description`}
	closeLabel="닫기"
	closeAction={() => finish(false)}
	oncancel={(event) => {
		event.preventDefault();
		finish(false);
	}}
>
	{#snippet actions()}
		<Button variant="outline" onclick={() => finish(false)}>{request.cancelLabel}</Button>
		<Button variant="primary" onclick={() => finish(true)}>{request.confirmLabel}</Button>
	{/snippet}
</Dialog>
