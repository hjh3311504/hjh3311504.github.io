<script>
	import { browser } from '$app/environment';
	import { onDestroy, onMount, tick } from 'svelte';
	import { Button, IconButton } from '$lib/components/ui';
	import { theme } from '$lib/stores/theme.js';
	import SiteNav from './SiteNav.svelte';

	export let active = 'home';
	export let variant = 'home';

	const pinKey = 'juno.develog.sidebar-pinned';
	const focusableSelector =
		'a[href], button:not([disabled]), input, select, textarea, [tabindex]:not([tabindex="-1"])';

	let wide = true;
	let pinned = true;
	let drawerOpen = false;
	let floatingMenuButton;
	let mobileMenuButton;
	let drawer;
	let mediaQuery;
	let locked = false;
	let lockY = 0;

	$: sidebarMode = wide && pinned;
	$: floatingMenu = !sidebarMode && !(variant === 'team-maker' && !wide);

	function getMenuButton() {
		return variant === 'team-maker' && !wide ? mobileMenuButton : floatingMenuButton;
	}

	function cycleTheme() {
		const order = ['auto', 'light', 'dark'];
		theme.set(order[(order.indexOf($theme) + 1) % order.length]);
	}

	async function togglePin() {
		pinned = !pinned;
		drawerOpen = false;
		try {
			localStorage.setItem(pinKey, pinned ? '1' : '0');
		} catch {
			// 저장할 수 없어도 현재 화면에서는 고정 상태를 바꾼다.
		}
		await tick();
		if (!pinned) getMenuButton()?.focus();
	}

	async function openDrawer() {
		drawerOpen = true;
		await tick();
		const first = drawer?.querySelector('nav a[href]') ?? drawer?.querySelector(focusableSelector);
		first?.focus();
	}

	async function closeDrawer({ restoreFocus = true } = {}) {
		if (!drawerOpen) return;
		drawerOpen = false;
		await tick();
		if (restoreFocus) getMenuButton()?.focus();
	}

	function trapDrawerFocus(event) {
		if (event.key !== 'Tab' || !drawer) return;
		const items = [...drawer.querySelectorAll(focusableSelector)].filter(
			(item) => item.offsetParent !== null
		);
		if (!items.length) return;
		const first = items[0];
		const last = items[items.length - 1];
		if (event.shiftKey && document.activeElement === first) {
			event.preventDefault();
			last.focus();
		} else if (!event.shiftKey && document.activeElement === last) {
			event.preventDefault();
			first.focus();
		}
	}

	function handleKeydown(event) {
		if (event.key === 'Escape' && drawerOpen) closeDrawer();
	}

	function lockBody() {
		if (!browser || locked) return;
		locked = true;
		lockY = window.scrollY;
		Object.assign(document.body.style, {
			position: 'fixed',
			top: `${-lockY}px`,
			left: '0',
			right: '0',
			width: '100%',
			overflowY: 'scroll',
			overflowX: 'hidden',
			touchAction: 'none'
		});
	}

	function unlockBody() {
		if (!browser || !locked) return;
		locked = false;
		Object.assign(document.body.style, {
			position: '',
			top: '',
			left: '',
			right: '',
			width: '',
			overflowY: '',
			overflowX: '',
			touchAction: ''
		});
		window.scrollTo(0, lockY);
	}

	$: if (browser) {
		if (drawerOpen) lockBody();
		else unlockBody();
	}

	onMount(() => {
		try {
			pinned = localStorage.getItem(pinKey) !== '0';
		} catch {
			pinned = true;
		}
		mediaQuery = window.matchMedia('(min-width: 1201px)');
		const updateWidth = () => {
			wide = mediaQuery.matches;
			drawerOpen = false;
		};
		updateWidth();
		mediaQuery.addEventListener?.('change', updateWidth);
		window.addEventListener('keydown', handleKeydown);

		return () => {
			mediaQuery?.removeEventListener?.('change', updateWidth);
			window.removeEventListener('keydown', handleKeydown);
		};
	});

	onDestroy(unlockBody);
</script>

<div class="site-shell {variant}" data-theme={$theme}>
	{#if sidebarMode}
		<aside class="site-sidebar">
			<SiteNav {active} themeMode={$theme} onTheme={cycleTheme} {pinned} onPin={togglePin} />
		</aside>
	{/if}

	{#if floatingMenu}
		<div class="floating-menu">
			<IconButton
				bind:element={floatingMenuButton}
				onclick={openDrawer}
				label="메뉴 열기"
				aria-expanded={drawerOpen}
				aria-controls="site-drawer"
			>
				<svg
					width="20"
					height="20"
					viewBox="0 0 24 24"
					fill="none"
					stroke="currentColor"
					stroke-width="2"
					stroke-linecap="round"
					stroke-linejoin="round"
					aria-hidden="true"
				>
					<path d="M4 6h16M4 12h16M4 18h16"></path>
				</svg>
			</IconButton>
		</div>
	{/if}

	<div class="shell-content">
		{#if variant === 'team-maker'}
			<header class="mobile-team-bar">
				<IconButton
					bind:element={mobileMenuButton}
					onclick={openDrawer}
					label="메뉴 열기"
					aria-expanded={drawerOpen}
					aria-controls="site-drawer"
				>
					<svg
						width="20"
						height="20"
						viewBox="0 0 24 24"
						fill="none"
						stroke="currentColor"
						stroke-width="2"
						stroke-linecap="round"
						stroke-linejoin="round"
						aria-hidden="true"
					>
						<path d="M4 6h16M4 12h16M4 18h16"></path>
					</svg>
				</IconButton>
			</header>
		{/if}

		<slot />
	</div>

	{#if drawerOpen}
		<div class="drawer-layer">
			<Button
				class="drawer-backdrop"
				variant="ghost"
				onclick={() => closeDrawer()}
				aria-label="메뉴 닫기"
			></Button>
			<div
				id="site-drawer"
				class="site-drawer"
				bind:this={drawer}
				role="dialog"
				aria-modal="true"
				aria-label="사이트 내비게이션"
				tabindex="-1"
				on:keydown={trapDrawerFocus}
			>
				<SiteNav
					{active}
					themeMode={$theme}
					onTheme={cycleTheme}
					showPin={wide}
					pinned={false}
					onPin={togglePin}
					showClose={true}
					onClose={() => closeDrawer()}
				/>
			</div>
		</div>
	{/if}
</div>

<style>
	:global(body:has(.site-shell)) {
		background-color: var(--color-canvas-light);
	}

	:global(html[data-theme='dark'] body:has(.site-shell)) {
		background-color: var(--color-canvas-dark);
	}

	.site-shell {
		--shell-canvas: var(--color-canvas-light);
		--shell-surface: var(--color-white);
		--shell-surface-soft: var(--color-canvas-light);
		--shell-hairline: var(--color-shell-hairline);
		--shell-text-heading: var(--color-shell-text-heading);
		--shell-text-body: var(--color-text-light);
		--shell-text-muted: var(--color-shell-text-muted);
		--shell-focus: var(--color-primary);
		--shell-nav-accent: var(--color-primary);
		--shell-nav-wash: var(--color-shell-nav-wash);
		--shell-row-hover: var(--color-shell-row-hover);
		--shell-overlay: var(--color-shell-overlay);
		--shell-menu-shadow: var(--color-shell-menu-shadow) 0 23px 52px;
		--ui-canvas: var(--shell-canvas);
		--ui-surface: var(--shell-surface);
		--ui-surface-soft: var(--shell-surface-soft);
		--ui-text: var(--shell-text-body);
		--ui-text-muted: var(--shell-text-muted);
		--ui-border: var(--shell-hairline);
		--ui-border-strong: color-mix(in srgb, var(--shell-text-muted), transparent 65%);
		--ui-primary: var(--shell-nav-accent);
		--ui-primary-hover: color-mix(in srgb, var(--shell-nav-accent), var(--color-black) 18%);
		--ui-on-primary: var(--color-white);
		--ui-focus: var(--shell-focus);
		--shell-page-background: linear-gradient(
			180deg,
			var(--color-shell-page-background) 0%,
			var(--color-shell-page-background-2) 42%,
			var(--color-shell-page-background-3) 100%
		);
		display: flex;
		align-items: flex-start;
		min-height: 100vh;
		color: var(--shell-text-body);
		background-color: var(--shell-canvas);
		background-image: var(--shell-page-background);
		background-repeat: no-repeat;
		background-size: 100% 100vh;
	}

	.site-shell.team-maker {
		--shell-surface-soft: var(--color-shell-surface-soft);
		--shell-hairline: var(--color-shell-hairline-2);
		--shell-text-heading: var(--color-shell-text-heading-2);
		--shell-text-body: var(--color-shell-text-heading-2);
		--shell-text-muted: var(--color-shell-text-muted-2);
		--shell-overlay: var(--color-shell-overlay-2);
		--shell-menu-shadow: none;
	}

	.site-shell[data-theme='dark'] {
		--shell-canvas: var(--color-canvas-dark);
		--shell-surface: var(--color-shell-surface);
		--shell-surface-soft: var(--color-shell-surface-soft-2);
		--shell-hairline: var(--color-shell-hairline-3);
		--shell-text-heading: var(--color-white);
		--shell-text-body: var(--color-text-dark);
		--shell-text-muted: var(--color-shell-text-muted-3);
		--shell-focus: var(--color-shell-focus);
		--shell-nav-accent: var(--color-shell-focus);
		--shell-nav-wash: var(--color-shell-nav-wash-2);
		--shell-row-hover: var(--color-shell-row-hover-2);
		--shell-overlay: var(--color-shell-overlay-3);
		--shell-menu-shadow: var(--color-shell-menu-shadow-2) 0 23px 52px;
		--shell-page-background: linear-gradient(
			180deg,
			var(--color-shell-page-background-4) 0%,
			var(--color-shell-page-background-5) 42%,
			var(--color-shell-page-background-6) 100%
		);
		color-scheme: dark;
	}

	@media (prefers-color-scheme: dark) {
		:global(html[data-theme='auto'] body:has(.site-shell)) {
			background-color: var(--color-canvas-dark);
		}

		.site-shell[data-theme='auto'] {
			--shell-canvas: var(--color-canvas-dark);
			--shell-surface: var(--color-shell-surface);
			--shell-surface-soft: var(--color-shell-surface-soft-2);
			--shell-hairline: var(--color-shell-hairline-3);
			--shell-text-heading: var(--color-white);
			--shell-text-body: var(--color-text-dark);
			--shell-text-muted: var(--color-shell-text-muted-3);
			--shell-focus: var(--color-shell-focus);
			--shell-nav-accent: var(--color-shell-focus);
			--shell-nav-wash: var(--color-shell-nav-wash-2);
			--shell-row-hover: var(--color-shell-row-hover-2);
			--shell-overlay: var(--color-shell-overlay-3);
			--shell-menu-shadow: var(--color-shell-menu-shadow-2) 0 23px 52px;
			--shell-page-background: linear-gradient(
				180deg,
				var(--color-shell-page-background-4) 0%,
				var(--color-shell-page-background-5) 42%,
				var(--color-shell-page-background-6) 100%
			);
			color-scheme: dark;
		}
	}

	.site-sidebar {
		position: sticky;
		top: 0;
		flex: none;
		width: 300px;
		height: 100vh;
		overflow: auto;
		background: var(--shell-surface);
		border-right: 1px solid var(--shell-hairline);
	}

	.shell-content {
		display: flex;
		flex: 1 1 auto;
		flex-direction: column;
		min-width: 0;
		min-height: 100vh;
	}

	.floating-menu {
		position: fixed;
		top: 8px;
		left: 8px;
		z-index: 30;
	}

	.floating-menu :global(button),
	.mobile-team-bar :global(button) {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 44px;
		height: 44px;
		padding: 0;
		cursor: pointer;
		color: var(--shell-text-heading);
		background: var(--shell-surface);
		border: 1px solid var(--shell-hairline);
		border-radius: 8px;
		box-shadow: var(--shell-menu-shadow);
	}

	.floating-menu :global(button:hover),
	.mobile-team-bar :global(button:hover) {
		background: var(--shell-surface-soft);
	}

	.floating-menu :global(button:focus-visible),
	.mobile-team-bar :global(button:focus-visible) {
		outline: 2px solid var(--shell-focus);
		outline-offset: 2px;
	}

	.mobile-team-bar {
		position: sticky;
		top: 0;
		z-index: 30;
		display: none;
		flex: none;
		align-items: center;
		height: 56px;
		padding-left: var(--space-8);
		pointer-events: none;
		background: transparent;
	}

	.mobile-team-bar :global(button) {
		pointer-events: auto;
		box-shadow: none;
	}

	@media (max-width: 1200px) {
		.site-sidebar {
			display: none;
		}

		.mobile-team-bar {
			display: flex;
		}
	}

	.drawer-layer {
		position: fixed;
		inset: 0;
		z-index: 60;
	}

	.drawer-backdrop {
		position: absolute;
		inset: 0;
		width: 100%;
		height: 100%;
		padding: 0;
		cursor: default;
		background: var(--shell-overlay);
		border: 0;
		animation: shell-scrim 200ms cubic-bezier(0.2, 0, 0.2, 1) both;
	}

	.site-drawer {
		position: absolute;
		top: 0;
		bottom: 0;
		left: 0;
		width: min(300px, 86vw);
		overflow: auto;
		background: var(--shell-surface);
		border-right: 1px solid var(--shell-hairline);
		box-shadow:
			var(--color-shell-row-hover) 0 10px 24px,
			var(--color-shell-menu-shadow) 0 23px 52px;
		animation: shell-slide 200ms cubic-bezier(0.2, 0, 0.2, 1) both;
	}

	@keyframes shell-scrim {
		from {
			opacity: 0;
		}
		to {
			opacity: 1;
		}
	}

	@keyframes shell-slide {
		from {
			transform: translateX(-100%);
		}
		to {
			transform: none;
		}
	}

	@media (prefers-reduced-motion: reduce) {
		.drawer-backdrop,
		.site-drawer {
			animation-duration: 0.01ms;
		}
	}
</style>
