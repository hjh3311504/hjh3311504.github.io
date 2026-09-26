<script>
	import { onDestroy } from 'svelte';
	import { SvelteMap } from 'svelte/reactivity';
	import { Button, Dialog } from '$lib/components/ui';
	import { createQrImage, downloadName } from '$lib/qr-code/qr.js';

	let dialog = $state();
	let imageUrl = $state('');
	let fileName = $state('');
	let busy = $state(false);
	let sharing = $state(false);
	let canShare = $state(false);
	let notice = $state('');
	let error = $state('');
	let imageFailed = $state(false);
	let snapshot;
	let file;
	let request = 0;
	let disposed = false;
	const retiredUrls = new SvelteMap();

	function releaseImage() {
		if (!imageUrl) return;
		const url = imageUrl;
		// 창을 닫아도 방금 시작한 다운로드가 파일을 읽을 시간을 준다.
		retiredUrls.set(
			url,
			setTimeout(() => {
				URL.revokeObjectURL(url);
				retiredUrls.delete(url);
			}, 60_000)
		);
		imageUrl = '';
	}

	function clear() {
		request++;
		releaseImage();
		file = undefined;
		snapshot = undefined;
		busy = false;
		sharing = false;
		canShare = false;
	}

	function close() {
		clear();
		dialog.close();
	}

	onDestroy(() => {
		disposed = true;
		clear();
		for (const [url, timer] of retiredUrls) {
			clearTimeout(timer);
			URL.revokeObjectURL(url);
		}
	});

	export function open(nextSnapshot, initialImage, message = '') {
		clear();
		snapshot = nextSnapshot;
		fileName = downloadName(snapshot.title, 'png');
		notice = message;
		dialog.showModal();
		void prepare(initialImage);
	}

	async function prepare(initialImage) {
		const current = ++request;
		const captured = snapshot;
		busy = true;
		error = '';
		imageFailed = false;
		try {
			const blob = await (initialImage ??
				captured.prepared.then((prepared) => createQrImage(captured.path, prepared, 'png')));
			if (disposed || current !== request) return;
			releaseImage();
			imageUrl = URL.createObjectURL(blob);
			// 파일 공유 지원 여부는 다운로드와 독립적으로 확인한다.
			try {
				file = new File([blob], fileName, { type: 'image/png' });
				canShare = Boolean(navigator.share && navigator.canShare?.({ files: [file] }));
			} catch {
				canShare = false;
			}
		} catch {
			if (!disposed && current === request) {
				imageFailed = true;
				error = '이미지를 준비하지 못했습니다. 다시 시도해 주세요.';
			}
		} finally {
			if (!disposed && current === request) busy = false;
		}
	}

	async function share() {
		if (!file || !canShare || sharing) return;
		const current = request;
		sharing = true;
		error = '';
		try {
			// 이미지 준비를 기다리지 않고 이 클릭에서 바로 공유를 요청한다.
			await navigator.share({ files: [file] });
		} catch (cause) {
			if (!disposed && current === request && cause?.name !== 'AbortError') {
				error = '공유하지 못했습니다. 파일 다운로드나 이미지 길게 누르기를 사용하세요.';
			}
		} finally {
			if (!disposed && current === request) sharing = false;
		}
	}
</script>

<Dialog
	bind:element={dialog}
	id="qr-save-image"
	class="qr-save-image"
	scroll="body"
	title="QR 이미지 저장"
	titleId="qr-save-image-title"
	description="이미지를 길게 눌러 저장하거나 아래 버튼을 사용하세요."
	descriptionId="qr-save-image-help"
	closeLabel="이미지 저장 닫기"
	closeAction={close}
	oncancel={(event) => {
		event.preventDefault();
		close();
	}}
>
	<div class="qr-save-content" data-ui-dialog-body aria-busy={busy}>
		{#if notice}<p role="status">{notice}</p>{/if}
		{#if busy}<p role="status">이미지를 준비하는 중입니다.</p>{/if}
		{#if imageUrl}
			<img src={imageUrl} alt="제목을 포함한 저장할 QR 코드" />
		{/if}
		{#if error}<p class="qr-error" role="alert">{error}</p>{/if}
		<p>
			저장 메뉴가 나오지 않으면 앱 메뉴에서 ‘다른 브라우저로 열기’를 찾아 Chrome이나 Safari에서 다시
			시도하세요.
		</p>
	</div>
	{#snippet actions()}
		{#if imageFailed}<Button onclick={() => prepare()}>다시 시도</Button>{/if}
		{#if imageUrl}
			<Button variant="primary" href={imageUrl} download={fileName}>파일 다운로드</Button>
			{#if canShare}<Button disabled={sharing} aria-busy={sharing} onclick={share}>공유하기</Button
				>{/if}
		{/if}
	{/snippet}
</Dialog>
