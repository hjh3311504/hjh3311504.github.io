<script>
	import { onMount, onDestroy, tick } from 'svelte';
	import { SvelteMap } from 'svelte/reactivity';
	import SiteShell from '$lib/components/organisms/SiteShell.svelte';
	import ToolPageHeader from '$lib/components/organisms/ToolPageHeader.svelte';
	import ToolPageFooter from '$lib/components/organisms/ToolPageFooter.svelte';
	import RemoveRowButton from '$lib/components/ui/RemoveRowButton.svelte';
	import {
		Button,
		Dialog,
		DisclosureSection,
		Section,
		SectionHeader,
		EmptyState
	} from '$lib/components/ui';
	import { siteBaseUrl, image as shareImage } from '$lib/data/meta.js';
	import QrPreview from '$lib/qr-code/QrPreview.svelte';
	import { prepareTitle } from '$lib/qr-code/title.js';
	import { pendingTitle } from '$lib/qr-code/title-layout.js';
	import { limitTitle } from '$lib/qr-code/title-input.js';
	import {
		BOOKMARK_KEY,
		MAX_BOOKMARKS,
		validateContent,
		validateSingleLine,
		parseBookmarks,
		downloadName,
		createQrGeometry,
		createQrImage
	} from '$lib/qr-code/qr.js';
	import './qr-code.css';

	const pageTitle = '무료 QR 코드 만들기 | 주소·텍스트를 이미지로';
	const description =
		'주소와 텍스트로 QR 코드를 만들고 제목과 함께 PNG·SVG로 저장하세요. SVG 제목은 글꼴 없이 쓸 수 있는 윤곽선으로 만듭니다. 이미지 복사, 인쇄, 크게 보기와 브라우저 북마크를 무료로 제공합니다.';
	let content = $state('');
	let pasteError = $state('');
	let title = $state('');
	let titleField = $state('');
	let ready = $state(false);
	let qr = $state(null);
	let titleState = $state(pendingTitle(''));
	let titleBusy = $state(false);
	let outputAction = $state('');
	let printUrl = $state('');
	let printRoot = $state();
	let printDialog = $state();
	let printError = $state('');
	const printLayouts = [
		{ id: 'single', columns: 1, rows: 1, label: '1열×1행 — 1개' },
		{ id: 'twelve', columns: 3, rows: 4, label: '3열×4행 — 12개' },
		{ id: 'thirty', columns: 5, rows: 6, label: '5열×6행 — 30개' }
	];
	let selectedPrintLayout = $state('single');
	let printedLayout = $state(printLayouts[0]);
	let printRequest = 0;
	let titleWork;
	let disposed = false;
	let busy = $state(false);
	let error = $state('');
	let outputError = $state('');
	let storageError = $state('');
	let bookmarks = $state([]);
	let expandedDialog = $state();
	let deleted = $state(null);
	let retryVersion = $state(0);
	const downloadUrls = new SvelteMap();
	onDestroy(() => {
		disposed = true;
		if (printUrl) URL.revokeObjectURL(printUrl);
		for (const [url, timer] of downloadUrls) {
			clearTimeout(timer);
			URL.revokeObjectURL(url);
		}
	});
	const inputError = $derived(pasteError || (content ? validateContent(content) : ''));
	const qrReady = $derived(Boolean(qr && qr.content === content && !busy && !inputError));
	const displayedTitle = $derived(titleState.title === title ? titleState : pendingTitle(title));
	const svgReady = $derived(qrReady && !titleBusy && !displayedTitle.svgError);
	const saved = $derived(
		bookmarks.some((item) => item.content === content && item.title === title)
	);

	onMount(() => {
		ready = true;
		try {
			bookmarks = parseBookmarks(localStorage.getItem(BOOKMARK_KEY));
		} catch {
			storageError = '북마크를 불러오지 못했습니다. QR 코드는 계속 만들 수 있습니다.';
		}
	});

	$effect(() => {
		const nextContent = content;
		const blockedPaste = pasteError;
		if (!ready) return;
		error = '';
		const shouldGenerate =
			Boolean(nextContent.trim()) && !blockedPaste && !validateContent(nextContent);
		busy = shouldGenerate;
		if (!shouldGenerate) {
			qr = null;
			return;
		}
		const timer = setTimeout(() => {
			try {
				qr = { content: nextContent, path: createQrGeometry(nextContent) };
			} catch {
				qr = null;
				error = 'QR 코드를 만들지 못했습니다. 내용을 줄이거나 다시 입력해 주세요.';
			} finally {
				busy = false;
			}
		}, 200);
		return () => clearTimeout(timer);
	});

	$effect(() => {
		const nextTitle = title;
		retryVersion;
		if (!ready) return;
		let current = true;
		titleBusy = true;
		const promise = prepareTitle(nextTitle);
		titleWork = { title: nextTitle, promise };
		promise.then((prepared) => {
			if (!current) return;
			titleState = prepared;
			titleBusy = false;
		});
		return () => {
			current = false;
		};
	});

	$effect(() => {
		content;
		title;
		outputError = '';
	});

	function persist(next) {
		try {
			localStorage.setItem(BOOKMARK_KEY, JSON.stringify(next));
			bookmarks = next;
			storageError = '';
			return true;
		} catch {
			storageError = '북마크를 저장하지 못했습니다. 브라우저 저장 공간을 확인하세요.';
			return false;
		}
	}

	function checkPastedContent(event) {
		// 한 줄 input이 줄바꿈을 바꾸기 전에 원문을 검사한다.
		const transfer = event.clipboardData ?? event.dataTransfer;
		pasteError = validateSingleLine(transfer?.getData('text/plain') ?? '');
		if (pasteError) event.preventDefault();
	}

	function updateTitle(event) {
		const value = event.currentTarget.value;
		const next = limitTitle(value);
		// 조합 중인 값은 입력창에 그대로 두고 미리보기에는 현재 글자를 즉시 반영한다.
		titleField = event.isComposing ? value : next;
		if (!event.isComposing && value !== next) event.currentTarget.value = next;
		title = next;
	}

	function saveBookmark() {
		if (!qrReady || saved) return;
		if (bookmarks.length >= MAX_BOOKMARKS) {
			storageError = '북마크는 최대 30개까지 저장합니다. 기존 항목을 지운 뒤 다시 저장하세요.';
			return;
		}
		if (persist([{ content, title }, ...bookmarks])) {
			deleted = null;
		}
	}

	function removeBookmark(index) {
		const item = bookmarks[index];
		if (persist(bookmarks.filter((_, i) => i !== index))) {
			deleted = { item, index };
		}
	}

	function undoDelete() {
		if (!deleted) return;
		const next = [...bookmarks];
		next.splice(deleted.index, 0, deleted.item);
		if (persist(next)) {
			deleted = null;
		}
	}

	function outputSnapshot() {
		return {
			path: qr.path,
			title,
			prepared: titleWork?.title === title ? titleWork.promise : prepareTitle(title)
		};
	}

	async function download(format) {
		if (!qrReady || outputAction || (format === 'svg' && !svgReady)) return;
		const snapshot = outputSnapshot();
		outputAction = format;
		outputError = '';
		try {
			const blob = await createQrImage(snapshot.path, await snapshot.prepared, format);
			if (disposed) return;
			const url = URL.createObjectURL(blob);
			const timer = setTimeout(() => {
				URL.revokeObjectURL(url);
				downloadUrls.delete(url);
			}, 1000);
			downloadUrls.set(url, timer);
			const link = document.createElement('a');
			link.href = url;
			link.download = downloadName(snapshot.title, format);
			document.body.append(link);
			link.click();
			link.remove();
		} catch {
			if (!disposed) outputError = '이미지를 저장하지 못했습니다. 다시 시도해 주세요.';
		} finally {
			if (!disposed) outputAction = '';
		}
	}

	async function copyImage() {
		if (!qrReady || outputAction) return;
		if (!navigator.clipboard?.write || typeof ClipboardItem === 'undefined') {
			outputError = '이 브라우저는 이미지 복사를 지원하지 않습니다. PNG 저장을 사용하세요.';
			return;
		}
		const snapshot = outputSnapshot();
		outputAction = 'copy';
		outputError = '';
		const blob = snapshot.prepared.then((prepared) =>
			createQrImage(snapshot.path, prepared, 'png')
		);
		// 클릭한 순간 복사를 요청하고 이미지가 준비되면 전달한다.
		blob.catch(() => {});
		try {
			await navigator.clipboard.write([new ClipboardItem({ 'image/png': blob })]);
		} catch {
			if (!disposed)
				outputError = '이미지를 복사하지 못했습니다. 복사 권한을 허용하거나 PNG 저장을 사용하세요.';
		} finally {
			if (!disposed) outputAction = '';
		}
	}

	function openPrint() {
		if (!qrReady || outputAction) return;
		printError = '';
		printDialog?.showModal();
	}

	function cancelPrint() {
		printRequest++;
		if (outputAction === 'print') outputAction = '';
		printDialog?.close();
	}

	async function printQr() {
		if (!qrReady || outputAction) return;
		const snapshot = outputSnapshot();
		const layout = printLayouts.find((item) => item.id === selectedPrintLayout);
		const request = ++printRequest;
		outputAction = 'print';
		printError = '';
		try {
			const blob = await createQrImage(snapshot.path, await snapshot.prepared, 'png');
			if (disposed || request !== printRequest) return;
			if (printUrl) URL.revokeObjectURL(printUrl);
			printUrl = URL.createObjectURL(blob);
			printedLayout = layout;
			await tick();
			await Promise.all([...printRoot.querySelectorAll('img')].map((image) => image.decode()));
			if (disposed || request !== printRequest) return;
			printDialog.close();
			window.print();
		} catch {
			if (!disposed && request === printRequest) {
				printError = '인쇄 이미지를 준비하지 못했습니다. 다시 시도해 주세요.';
				if (!printDialog.open) printDialog.showModal();
			}
		} finally {
			if (!disposed && request === printRequest) outputAction = '';
		}
	}
</script>

<svelte:head>
	<title>{pageTitle}</title>
	<meta name="description" content={description} />
	<link rel="canonical" href={`${siteBaseUrl}/qr-code`} />
	<meta property="og:title" content={pageTitle} />
	<meta property="og:description" content={description} />
	<meta property="og:url" content={`${siteBaseUrl}/qr-code`} />
	<meta property="og:type" content="website" />
	<meta property="og:image" content={shareImage} />
	<meta property="og:image:alt" content="Lake가 만든 무료 온라인 도구" />
	<meta name="twitter:card" content="summary_large_image" />
	<meta name="twitter:title" content={pageTitle} />
	<meta name="twitter:description" content={description} />
	<meta name="twitter:image" content={shareImage} />
</svelte:head>

<SiteShell active="qr-code" variant="qr-code">
	<main class="qr-page">
		<ToolPageHeader
			class="qr-heading"
			title="QR 코드 만들기"
			description="긴 주소도, 짧은 메모도. 스캔 한 번으로 전달하세요."
		/>
		<noscript><p>QR 코드를 만들려면 브라우저에서 JavaScript를 켜세요.</p></noscript>
		<div class="qr-workspace">
			<div class="qr-editor">
				<Section variant="card" class="qr-panel" aria-labelledby="qr-input-title">
					<SectionHeader
						class="qr-section-header"
						step={1}
						title="내용을 입력하세요"
						titleId="qr-input-title"
					/>
					<label for="qr-content"
						>웹페이지 주소 <span class="required-label" aria-label="필수">*</span></label
					>
					<input
						type="url"
						id="qr-content"
						bind:value={content}
						oninput={() => (pasteError = '')}
						onpaste={checkPastedContent}
						ondrop={checkPastedContent}
						placeholder="https://example.com"
						aria-describedby="qr-content-help"
						aria-invalid={Boolean(inputError || error)}
						spellcheck="false"
					/>
					<p
						id="qr-content-help"
						class="field-help"
						class:qr-field-error={Boolean(inputError || error)}
						role={inputError || error ? 'alert' : undefined}
					>
						{inputError || error || '웹페이지는 https://를 포함한 전체 주소를 넣으세요.'}
					</p>
					<label for="qr-title">제목</label>
					<input
						id="qr-title"
						value={titleField}
						oninput={updateTitle}
						oncompositionend={updateTitle}
						placeholder="예: 오늘의 수업 자료"
						aria-describedby="qr-title-help"
					/>
					<p id="qr-title-help" class="field-help">
						QR 이미지 아래에 한 줄로 표시됩니다(최대 10자).
					</p>
				</Section>
				<Section variant="card" class="qr-panel qr-bookmarks" aria-labelledby="qr-bookmarks-title">
					<SectionHeader class="qr-section-header" title="내 북마크" titleId="qr-bookmarks-title"
						>{#snippet titleSuffix()}<span class="count">{bookmarks.length}</span
							>{/snippet}</SectionHeader
					>
					<div class="qr-bookmark-content">
						{#if bookmarks.length}
							<ul>
								{#each bookmarks as item, index (index)}<li>
										<Button
											variant="ghost"
											class="bookmark-open"
											onclick={() => {
												pasteError = '';
												content = item.content;
												title = item.title;
												titleField = item.title;
											}}
											><strong>{item.title || '제목 없는 QR 코드'}</strong><span
												>{item.content}</span
											></Button
										><RemoveRowButton
											label={`${item.title || '제목 없는 QR 코드'} 북마크 삭제`}
											onclick={() => removeBookmark(index)}
										/>
									</li>{/each}
							</ul>
						{:else}<EmptyState
								class="bookmark-empty"
								title="자주 쓰는 QR 코드를 모아 두세요."
								description="만든 뒤 ‘북마크에 저장’을 누르면 다시 꺼내 쓸 수 있습니다."
							/>{/if}
					</div>
					{#if deleted}<Button variant="ghost" size="sm" onclick={undoDelete}
							>북마크 삭제 취소</Button
						>{/if}
					{#if storageError}<p class="qr-error" role="alert">{storageError}</p>{/if}
				</Section>
			</div>
			<Section
				variant="card"
				class="qr-panel qr-preview-panel"
				aria-labelledby="qr-preview-title"
				aria-busy={busy}
			>
				<SectionHeader
					class="qr-section-header"
					step={2}
					title="미리보기"
					titleId="qr-preview-title"
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
					<Button
						class="qr-save"
						variant="outline"
						disabled={!qrReady || saved}
						onclick={saveBookmark}>{saved ? '북마크에 저장됨' : '북마크에 저장'}</Button
					>
					<Button
						variant="outline"
						disabled={!qrReady || Boolean(outputAction)}
						aria-busy={outputAction === 'print'}
						onclick={openPrint}>인쇄</Button
					>
				</div>
				{#if outputError || displayedTitle.svgError}
					<div class="qr-svg-notice">
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
		</div>
		<div class="qr-guide">
			<DisclosureSection title="QR 코드, 이렇게 사용하세요" titleId="qr-guide-title">
				<ol class="qr-guide-steps">
					<li>
						<h3>1. 주소와 제목 입력</h3>
						<p>
							https://를 포함한 웹페이지 주소를 넣으세요. 제목은 선택 사항이며 최대 10자로 QR 아래에
							표시됩니다.
						</p>
					</li>
					<li>
						<h3>2. 스캔 확인</h3>
						<p>
							휴대폰 카메라로 QR을 비춰 원하는 페이지가 열리는지 확인하세요. 크게 보기로 확대할 수
							있습니다.
						</p>
					</li>
					<li>
						<h3>3. 저장·복사·인쇄</h3>
						<p>
							PNG·SVG로 저장하거나 이미지를 복사하세요. 인쇄는 A4 한 장에 같은 QR과 제목을
							1개·12개·30개로 배치합니다.
						</p>
					</li>
				</ol>
			</DisclosureSection>
			<DisclosureSection title="자주 묻는 질문" titleId="qr-faq-title">
				<div class="qr-faq">
					<article>
						<h3>유효기간이나 주소 변경은 어떻게 되나요?</h3>
						<p>
							만료일은 없지만 연결한 페이지는 유지되어야 합니다. 주소를 바꾸면 새 QR을 저장해 기존
							이미지를 교체하세요.
						</p>
					</article>
					<article>
						<h3>PNG와 SVG는 어떻게 다른가요?</h3>
						<p>
							PNG는 문서에 넣기 편하고, SVG는 확대해도 선명하며 제목을 도형으로 저장합니다. SVG에서
							지원하지 않는 이모지 등은 PNG를 사용하세요.
						</p>
					</article>
					<article>
						<h3>QR이 잘 읽히지 않아요.</h3>
						<p>
							QR을 크게 표시하고 주변의 흰 여백을 유지하세요. 인쇄할 때는 가로세로 비율을 바꾸지
							마세요.
						</p>
					</article>
					<article>
						<h3>북마크는 어디에 저장되나요?</h3>
						<p>
							현재 브라우저에만 저장되며 다른 기기와 공유되지 않습니다. 브라우저 데이터를 지우면
							함께 삭제됩니다.
						</p>
					</article>
				</div>
			</DisclosureSection>
		</div>
		<ToolPageFooter />
	</main>
	<Dialog
		bind:element={expandedDialog}
		id="qr-expanded"
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
</SiteShell>
