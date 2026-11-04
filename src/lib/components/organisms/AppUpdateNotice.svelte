<script>
	import { onMount } from 'svelte';
	import { updated } from '$app/state';
	import Button from '$lib/components/ui/Button.svelte';
	import IconButton from '$lib/components/ui/IconButton.svelte';

	// 탭을 자주 오가도 1분에 한 번만 확인한다.
	const VISIBLE_CHECK_GAP = 60_000;
	let dismissed = $state(false);
	const visible = $derived(updated.current && !dismissed);
	const reload = () => window.location.reload();
	// 안내로 들어오기 직전의 focus 위치를 기억했다가 닫을 때 돌려준다.
	let returnFocus = null;
	const rememberFocus = (event) => {
		const from = event.relatedTarget;
		if (from instanceof HTMLElement && !event.currentTarget.contains(from)) returnFocus = from;
	};
	const dismiss = () => {
		if (returnFocus?.isConnected) {
			returnFocus.focus({ preventScroll: true });
		} else if (returnFocus) {
			// 기억한 요소가 사라졌으면 본문으로 보내 페이지 맨 앞에서 다시 찾지 않게 한다.
			const main = document.querySelector('main');
			if (main && !main.hasAttribute('tabindex')) main.tabIndex = -1;
			main?.focus({ preventScroll: true });
		}
		returnFocus = null;
		dismissed = true;
	};

	onMount(() => {
		let lastCheck = Date.now();
		const checkWhenVisible = () => {
			if (document.visibilityState !== 'visible' || updated.current) return;
			if (Date.now() - lastCheck < VISIBLE_CHECK_GAP) return;
			lastCheck = Date.now();
			updated.check();
		};
		document.addEventListener('visibilitychange', checkWhenVisible);
		return () => document.removeEventListener('visibilitychange', checkWhenVisible);
	});
</script>

<!-- 진행 중인 경기와 입력을 지키기 위해 자동으로 새로고침하지 않고 안내만 한다. -->
<div class="app-update" role="status" aria-live="polite" aria-atomic="true">
	{#if visible}
		<div class="app-update-card" data-app-update-notice onfocusin={rememberFocus}>
			<p>새 버전이 나왔어요. 새로고침하면 바로 적용돼요.</p>
			<div class="app-update-actions">
				<Button variant="primary" size="sm" onclick={reload}>새로고침</Button>
				<IconButton label="안내 닫기" onclick={dismiss}>
					<svg
						viewBox="0 0 15 15"
						width="15"
						height="15"
						fill="none"
						aria-hidden="true"
						focusable="false"
					>
						<path
							d="M3.75 3.75l7.5 7.5m0-7.5-7.5 7.5"
							stroke="currentColor"
							stroke-width="1.8"
							stroke-linecap="round"
						/>
					</svg>
				</IconButton>
			</div>
		</div>
	{/if}
</div>

<style>
	.app-update {
		position: fixed;
		inset-inline: var(--space-16);
		/* 화면 아래에 떠 있는 버튼이 있는 페이지는 --app-update-offset으로 안내를 그 위에 올린다. */
		bottom: calc(
			var(--space-24) + var(--app-update-offset, 0px) + env(safe-area-inset-bottom, 0px)
		);
		z-index: 40;
		display: flex;
		justify-content: center;
		pointer-events: none;
	}
	.app-update-card {
		display: flex;
		align-items: center;
		gap: var(--space-12);
		max-width: min(100%, 480px);
		padding: var(--space-8) var(--space-8) var(--space-8) var(--space-16);
		border: 1px solid var(--ui-border-strong);
		border-radius: var(--ui-radius-md);
		background: var(--ui-surface);
		color: var(--ui-text);
		box-shadow: var(--ui-shadow);
		pointer-events: auto;
	}
	.app-update-actions {
		display: flex;
		flex: none;
		align-items: center;
		gap: var(--space-4);
	}
	p {
		flex: 1 1 auto;
		margin: 0;
		font-size: var(--font-size-14);
		line-height: 1.5;
		overflow-wrap: anywhere;
	}
</style>
