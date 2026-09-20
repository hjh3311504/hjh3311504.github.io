<script>
	import { Button } from '$lib/components/ui';
	import { Dialog } from '$lib/components/ui';
	import QrPreview from '$lib/qr-code/QrPreview.svelte';
	let {
		title,
		qr,
		outputAction,
		printUrl,
		printRoot = $bindable(),
		printDialog = $bindable(),
		printError,
		printLayouts,
		selectedPrintLayout = $bindable(),
		printedLayout,
		busy,
		expandedDialog = $bindable(),
		qrReady,
		cancelPrint,
		printQr
	} = $props();
</script>

<Dialog
	bind:element={expandedDialog}
	id="qr-expanded"
	size="wide"
	class="qr-expanded"
	title="QR 코드 크게 보기"
	titleId="qr-expanded-title"
	description="휴대폰 카메라로 QR 코드를 스캔하세요."
	descriptionId="qr-expanded-help"
	closeLabel="크게 보기 닫기"
	closeAction={() => expandedDialog.close()}
>
	<QrPreview qrPath={qr?.path} {title} {busy} />
</Dialog>
<Dialog
	bind:element={printDialog}
	id="qr-print-settings"
	class="qr-print-settings"
	title="QR 코드 인쇄"
	titleId="qr-print-title"
	description="A4 세로 1장에 같은 QR 코드와 제목을 반복해서 인쇄합니다."
	descriptionId="qr-print-help"
	closeLabel="인쇄 설정 닫기"
	closeAction={cancelPrint}
	oncancel={(event) => {
		event.preventDefault();
		cancelPrint();
	}}
>
	<fieldset class="qr-print-options" disabled={outputAction === 'print'}>
		<legend>인쇄 배열</legend>
		{#each printLayouts as layout (layout.id)}
			<label
				><input
					type="radio"
					name="qr-print-layout"
					value={layout.id}
					bind:group={selectedPrintLayout}
				/>{layout.label}</label
			>
		{/each}
	</fieldset>
	{#if printError}<p class="qr-error" role="alert">{printError}</p>{/if}
	{#snippet actions()}
		<Button variant="outline" onclick={cancelPrint}>취소</Button>
		<Button
			variant="primary"
			disabled={!qrReady || Boolean(outputAction)}
			aria-busy={outputAction === 'print'}
			onclick={printQr}>인쇄하기</Button
		>
	{/snippet}
</Dialog>
{#if printUrl}<div
		bind:this={printRoot}
		class="qr-print"
		class:qr-print-single={printedLayout.id === 'single'}
		style:--print-columns={printedLayout.columns}
		style:--print-rows={printedLayout.rows}
	>
		{#each Array.from({ length: printedLayout.columns * printedLayout.rows }, (_, index) => index) as index (index)}
			<div class="qr-print-cell"><img src={printUrl} alt="제목을 포함한 인쇄할 QR 코드" /></div>
		{/each}
	</div>{/if}
