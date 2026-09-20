<script>
	import QrDialogs from '$lib/qr-code/components/QrDialogs.svelte';
	import QrGuide from '$lib/qr-code/components/QrGuide.svelte';
	import QrPreviewSection from '$lib/qr-code/components/QrPreviewSection.svelte';
	import QrBookmarksSection from '$lib/qr-code/components/QrBookmarksSection.svelte';
	import QrInputSection from '$lib/qr-code/components/QrInputSection.svelte';
	import { onMount, onDestroy, tick } from 'svelte';
	import { SvelteMap } from 'svelte/reactivity';
	import SiteShell from '$lib/components/organisms/SiteShell.svelte';
	import ToolPageLayout from '$lib/components/organisms/ToolPageLayout.svelte';
	import ToolPageFooter from '$lib/components/organisms/ToolPageFooter.svelte';

	import { siteBaseUrl, image as shareImage } from '$lib/data/meta.js';

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

	function openBookmark(item) {
		pasteError = '';
		content = item.content;
		title = item.title;
		titleField = item.title;
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
	<ToolPageLayout
		class="qr-page"
		headerClass="qr-heading"
		title="QR 코드 만들기"
		description="긴 주소도, 짧은 메모도. 스캔 한 번으로 전달하세요."
	>
		<noscript><p>QR 코드를 만들려면 브라우저에서 JavaScript를 켜세요.</p></noscript>
		<div class="qr-workspace">
			<div class="qr-editor">
				<QrInputSection
					bind:content
					onContentInput={() => (pasteError = '')}
					{titleField}
					{error}
					{inputError}
					{checkPastedContent}
					{updateTitle}
				/>
				<QrBookmarksSection
					onopen={openBookmark}
					{storageError}
					{bookmarks}
					{deleted}
					{removeBookmark}
					{undoDelete}
				/>
			</div>
			<QrPreviewSection
				{title}
				{qr}
				{titleBusy}
				{outputAction}
				{busy}
				{outputError}
				{expandedDialog}
				bind:retryVersion
				{qrReady}
				{displayedTitle}
				{svgReady}
				{saved}
				{saveBookmark}
				{download}
				{copyImage}
				{openPrint}
			/>
		</div>
		<QrGuide />
		<ToolPageFooter />
	</ToolPageLayout>
	<QrDialogs
		{title}
		{qr}
		{outputAction}
		{printUrl}
		bind:printRoot
		bind:printDialog
		{printError}
		{printLayouts}
		bind:selectedPrintLayout
		{printedLayout}
		{busy}
		bind:expandedDialog
		{qrReady}
		{cancelPrint}
		{printQr}
	/></SiteShell
>
