<script>
	import { browser } from '$app/environment';
	import { onDestroy, onMount, tick } from 'svelte';
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
	let menuButton;
	let drawer;
	let mediaQuery;
	let locked = false;
	let lockY = 0;

	$: sidebarMode = wide && pinned;
	$: floatingMenu = !sidebarMode && !(variant === 'team-maker' && !wide);
	$: mobileTeamBar = variant === 'team-maker' && !wide;

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
		if (!pinned) menuButton?.focus();
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
		if (restoreFocus) menuButton?.focus();
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
			<button
				bind:this={menuButton}
				type="button"
				on:click={openDrawer}
				aria-label="메뉴 열기"
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
			</button>
		</div>
	{/if}

	<div class="shell-content">
		{#if mobileTeamBar}
			<header class="mobile-team-bar">
				<button
					bind:this={menuButton}
					type="button"
					on:click={openDrawer}
					aria-label="메뉴 열기"
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
				</button>
			</header>
		{/if}

		<slot />
	</div>

	{#if drawerOpen}
		<div class="drawer-layer">
			<button
				class="drawer-backdrop"
				type="button"
				on:click={() => closeDrawer()}
				aria-label="메뉴 닫기"
			></button>
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
		background-color: #f6f5f4;
	}

	:global(html[data-theme='dark'] body:has(.site-shell)) {
		background-color: #1a1918;
	}

	.site-shell {
		--shell-canvas: #f6f5f4;
		--shell-surface: #fff;
		--shell-surface-soft: #f6f5f4;
		--shell-hairline: #e6e6e6;
		--shell-text-heading: rgb(0 0 0 / 95%);
		--shell-text-body: #31302e;
		--shell-text-muted: #615d59;
		--shell-focus: #6e29e7;
		--shell-nav-accent: #6e29e7;
		--shell-nav-wash: rgb(110 41 231 / 9%);
		--shell-row-hover: rgb(0 0 0 / 4%);
		--shell-overlay: rgb(0 0 0 / 40%);
		--shell-menu-shadow: rgb(0 0 0 / 5%) 0 23px 52px;
		--shell-page-background: linear-gradient(
			180deg,
			rgb(110 41 231 / 10%) 0%,
			rgb(110 41 231 / 5%) 42%,
			rgb(110 41 231 / 0%) 100%
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
		--shell-surface-soft: #f9fbfd;
		--shell-hairline: #e7ecf2;
		--shell-text-heading: #1c1e26;
		--shell-text-body: #1c1e26;
		--shell-text-muted: #5b5f6b;
		--shell-overlay: rgb(28 30 38 / 45%);
		--shell-menu-shadow: none;
	}

	.site-shell[data-theme='dark'] {
		--shell-canvas: #1a1918;
		--shell-surface: #262523;
		--shell-surface-soft: #2f2e2b;
		--shell-hairline: #403d3a;
		--shell-text-heading: #fff;
		--shell-text-body: #f2f0ed;
		--shell-text-muted: #c3bdb6;
		--shell-focus: #a97dff;
		--shell-nav-accent: #a97dff;
		--shell-nav-wash: rgb(169 125 255 / 16%);
		--shell-row-hover: rgb(255 255 255 / 7%);
		--shell-overlay: rgb(0 0 0 / 62%);
		--shell-menu-shadow: rgb(0 0 0 / 45%) 0 23px 52px;
		--shell-page-background: linear-gradient(
			180deg,
			rgb(169 125 255 / 16%) 0%,
			rgb(169 125 255 / 7%) 42%,
			rgb(169 125 255 / 0%) 100%
		);
		color-scheme: dark;
	}

	@media (prefers-color-scheme: dark) {
		:global(html[data-theme='auto'] body:has(.site-shell)) {
			background-color: #1a1918;
		}

		.site-shell[data-theme='auto'] {
			--shell-canvas: #1a1918;
			--shell-surface: #262523;
			--shell-surface-soft: #2f2e2b;
			--shell-hairline: #403d3a;
			--shell-text-heading: #fff;
			--shell-text-body: #f2f0ed;
			--shell-text-muted: #c3bdb6;
			--shell-focus: #a97dff;
			--shell-nav-accent: #a97dff;
			--shell-nav-wash: rgb(169 125 255 / 16%);
			--shell-row-hover: rgb(255 255 255 / 7%);
			--shell-overlay: rgb(0 0 0 / 62%);
			--shell-menu-shadow: rgb(0 0 0 / 45%) 0 23px 52px;
			--shell-page-background: linear-gradient(
				180deg,
				rgb(169 125 255 / 16%) 0%,
				rgb(169 125 255 / 7%) 42%,
				rgb(169 125 255 / 0%) 100%
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

	.floating-menu button,
	.mobile-team-bar button {
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

	.floating-menu button:hover,
	.mobile-team-bar button:hover {
		background: var(--shell-surface-soft);
	}

	.floating-menu button:focus-visible,
	.mobile-team-bar button:focus-visible {
		outline: 2px solid var(--shell-focus);
		outline-offset: 2px;
	}

	.mobile-team-bar {
		position: sticky;
		top: 0;
		z-index: 30;
		display: flex;
		flex: none;
		align-items: center;
		height: 56px;
		padding-left: 8px;
		pointer-events: none;
		background: transparent;
	}

	.mobile-team-bar button {
		pointer-events: auto;
		box-shadow: none;
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
			rgb(0 0 0 / 4%) 0 10px 24px,
			rgb(0 0 0 / 5%) 0 23px 52px;
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
