<script>
	import { Button } from '$lib/components/ui';
	import { Section } from '$lib/components/ui';
	import { SectionHeader } from '$lib/components/ui';
	import QrPreview from '$lib/qr-code/QrPreview.svelte';
	let {
		title,
		qr,
		titleBusy,
		outputAction,
		busy,
		outputError,
		outputStatus,
		expandedDialog,
		retryVersion = $bindable(),
		qrReady,
		displayedTitle,
		svgReady,
		saved,
		saveBookmark,
		download,
		copyImage,
		openPrint
	} = $props();
</script>

<Section
	variant="card"
	padding="card"
	gap="body"
	class="qr-panel qr-preview-panel"
	aria-labelledby="qr-preview-title"
	aria-busy={busy}
>
	<SectionHeader class="qr-section-header" step={2} title="미리보기" titleId="qr-preview-title"
		>{#snippet meta()}<span class="local-badge">PNG · SVG</span>{/snippet}</SectionHeader
	>
	<QrPreview qrPath={qr?.path} {title} {busy} />
	<div class="qr-download-actions">
		<Button
			variant="primary"
			aria-busy={outputAction === 'png'}
			disabled={!qrReady || Boolean(outputAction)}
			onclick={() => download('png')}>PNG 저장</Button
		>
		<Button
			variant="outline"
			class="qr-svg-download"
			disabled={!svgReady || Boolean(outputAction)}
			aria-busy={outputAction === 'svg'}
			onclick={() => download('svg')}>SVG 저장</Button
		>
	</div>
	<div class="qr-actions">
		<Button
			variant="outline"
			disabled={!qrReady || Boolean(outputAction)}
			aria-busy={outputAction === 'copy'}
			onclick={copyImage}>이미지 복사</Button
		><Button variant="outline" disabled={!qrReady} onclick={() => expandedDialog?.showModal()}
			>크게 보기</Button
		>
	</div>
	<div class="qr-actions qr-secondary-actions">
		<Button class="qr-save" variant="outline" disabled={!qrReady || saved} onclick={saveBookmark}
			>{saved ? '북마크에 저장됨' : '북마크에 저장'}</Button
		>
		<Button
			variant="outline"
			disabled={!qrReady || Boolean(outputAction)}
			aria-busy={outputAction === 'print'}
			onclick={openPrint}>인쇄</Button
		>
	</div>
	{#if outputError || outputStatus || displayedTitle.svgError}
		<div class="qr-svg-notice">
			{#if outputStatus}<p role="status">{outputStatus}</p>{/if}
			{#if outputError}<p role="alert">{outputError}</p>{/if}
			{#if displayedTitle.svgError}<p role="status">{displayedTitle.svgError}</p>{/if}
			{#if displayedTitle.canRetrySvg}<Button
					variant="ghost"
					size="sm"
					disabled={titleBusy}
					aria-busy={titleBusy}
					onclick={() => retryVersion++}>SVG 다시 시도</Button
				>{/if}
		</div>
	{/if}
</Section>
