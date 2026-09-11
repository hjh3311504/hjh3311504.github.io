<script>
	import { EmptyState } from '$lib/components/ui';
	import { QR_SIZE } from './image-layout.js';

	let { qrPath = '', title = '', busy = false } = $props();

	function fitCaption(node) {
		let active = true;
		const fit = () => {
			if (!active || !node.parentElement.clientWidth) return;
			node.style.fontSize = '';
			const width = node.firstElementChild.getBoundingClientRect().width;
			const available = node.parentElement.clientWidth;
			if (width > available) {
				// 시스템 이모지는 크기가 연속적으로 줄지 않을 수 있어 실제 너비로 확인한다.
				let low = 0;
				let high = parseFloat(getComputedStyle(node).fontSize);
				for (let step = 0; step < 12; step++) {
					const size = (low + high) / 2;
					node.style.fontSize = `${size}px`;
					if (node.firstElementChild.getBoundingClientRect().width <= available) low = size;
					else high = size;
				}
				node.style.fontSize = `${low}px`;
			}
		};
		const observer = new ResizeObserver(fit);
		observer.observe(node.parentElement);
		document.fonts.addEventListener('loadingdone', fit);
		document.fonts.ready.then(fit);
		return {
			update() {
				queueMicrotask(fit);
			},
			destroy() {
				active = false;
				observer.disconnect();
				document.fonts.removeEventListener('loadingdone', fit);
			}
		};
	}
</script>

<div class="qr-preview" aria-busy={busy}>
	<div class="qr-preview-square">
		{#if qrPath}
			<svg
				class="qr-preview-code"
				viewBox={`0 0 ${QR_SIZE} ${QR_SIZE}`}
				role="img"
				aria-label="입력한 주소의 QR 코드"
			>
				<rect width={QR_SIZE} height={QR_SIZE} fill="#fff" />
				<path d={qrPath} fill="#000" />
			</svg>
		{:else}
			<svg
				class="qr-placeholder-icon"
				width="88"
				height="88"
				viewBox="0 0 64 64"
				fill="none"
				stroke="currentColor"
				stroke-width="3"
				aria-hidden="true"
			>
				<rect x="7" y="7" width="18" height="18" rx="2" />
				<rect x="39" y="7" width="18" height="18" rx="2" />
				<rect x="7" y="39" width="18" height="18" rx="2" />
				<path d="M39 39h8v8h10v10H39V47M32 7v25H7M32 39v18M39 32h18" />
			</svg>
		{/if}
		{#if busy}<div class="qr-preview-busy" role="status">QR 코드를 만드는 중입니다</div>{/if}
	</div>
	<div class="qr-caption-space">
		{#if qrPath}
			<p class="qr-preview-caption" use:fitCaption={title}><span>{title}</span></p>
		{:else}
			<EmptyState class="qr-placeholder" title="QR 코드가 여기에 나타납니다" />
		{/if}
	</div>
</div>
