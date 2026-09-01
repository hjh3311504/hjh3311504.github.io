<script>
	import { resolve } from '$app/paths';

	export let active = 'home';
	export let themeMode = 'auto';
	export let onTheme = () => {};
	export let showTheme = true;
	export let showPin = true;
	export let pinned = true;
	export let onPin = () => {};
	export let showClose = false;
	export let onClose = () => {};

	const themeLabels = { auto: '자동', light: '밝게', dark: '어둡게' };

	$: themeLabel = themeLabels[themeMode] ?? themeLabels.auto;
	$: pinLabel = pinned ? '사이드바 고정 해제' : '사이드바 고정';
</script>

<div class="site-nav">
	<div class="site-nav-heading">
		<a class="site-name" href={resolve('/')}>Juno's develog</a>

		{#if showTheme}
			<button
				class="nav-icon-button"
				type="button"
				on:click={onTheme}
				aria-label={`테마 변경, 현재 ${themeLabel}`}
				title={`테마 변경, 현재 ${themeLabel}`}
			>
				{#if themeMode === 'light'}
					<svg
						width="17"
						height="17"
						viewBox="0 0 24 24"
						fill="none"
						stroke="currentColor"
						stroke-width="2"
						stroke-linecap="round"
						stroke-linejoin="round"
						aria-hidden="true"
					>
						<circle cx="12" cy="12" r="4"></circle>
						<path
							d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M6.3 17.7l-1.4 1.4M19.1 4.9l-1.4 1.4"
						></path>
					</svg>
				{:else if themeMode === 'dark'}
					<svg
						width="17"
						height="17"
						viewBox="0 0 24 24"
						fill="none"
						stroke="currentColor"
						stroke-width="2"
						stroke-linecap="round"
						stroke-linejoin="round"
						aria-hidden="true"
					>
						<path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9z"></path>
					</svg>
				{:else}
					<svg
						width="17"
						height="17"
						viewBox="0 0 24 24"
						fill="none"
						stroke="currentColor"
						stroke-width="2"
						stroke-linecap="round"
						stroke-linejoin="round"
						aria-hidden="true"
					>
						<circle cx="12" cy="12" r="9"></circle>
						<path d="M12 3a9 9 0 0 1 0 18z" fill="currentColor" stroke="none"></path>
					</svg>
				{/if}
			</button>
		{/if}

		{#if showPin}
			<button
				class="nav-icon-button"
				type="button"
				on:click={onPin}
				aria-pressed={pinned}
				aria-label={pinLabel}
				title={pinLabel}
			>
				{#if pinned}
					<svg
						width="17"
						height="17"
						viewBox="0 0 24 24"
						fill="none"
						stroke="currentColor"
						stroke-width="2"
						stroke-linecap="round"
						stroke-linejoin="round"
						aria-hidden="true"
					>
						<rect width="18" height="18" x="3" y="3" rx="2"></rect>
						<path d="M9 3v18M16 15l-3-3 3-3"></path>
					</svg>
				{:else}
					<svg
						width="17"
						height="17"
						viewBox="0 0 24 24"
						fill="none"
						stroke="currentColor"
						stroke-width="2"
						stroke-linecap="round"
						stroke-linejoin="round"
						aria-hidden="true"
					>
						<rect width="18" height="18" x="3" y="3" rx="2"></rect>
						<path d="M9 3v18M14 9l3 3-3 3"></path>
					</svg>
				{/if}
			</button>
		{/if}

		{#if showClose}
			<button
				class="nav-icon-button"
				type="button"
				on:click={onClose}
				aria-label="메뉴 닫기"
				title="메뉴 닫기"
			>
				<svg
					width="18"
					height="18"
					viewBox="0 0 24 24"
					fill="none"
					stroke="currentColor"
					stroke-width="2"
					stroke-linecap="round"
					stroke-linejoin="round"
					aria-hidden="true"
				>
					<path d="M18 6 6 18M6 6l12 12"></path>
				</svg>
			</button>
		{/if}
	</div>

	<nav aria-label="사이트 메뉴">
		<a
			class:active={active === 'home'}
			href={resolve('/')}
			aria-current={active === 'home' ? 'page' : undefined}
		>
			<svg
				width="16"
				height="16"
				viewBox="0 0 24 24"
				fill="none"
				stroke="currentColor"
				stroke-width="2"
				stroke-linecap="round"
				stroke-linejoin="round"
				aria-hidden="true"
			>
				<path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
				<path d="M9 22V12h6v10"></path>
			</svg>
			<span>홈</span>
			{#if active === 'home'}<span class="current-badge">현재</span>{/if}
		</a>

		<div class="nav-group-label">프로젝트</div>
		<div class="project-links">
			<a
				class:active={active === 'team-maker'}
				href={resolve('/team-maker/')}
				aria-current={active === 'team-maker' ? 'page' : undefined}
			>
				<svg
					width="16"
					height="16"
					viewBox="0 0 24 24"
					fill="none"
					stroke="currentColor"
					stroke-width="2"
					stroke-linecap="round"
					stroke-linejoin="round"
					aria-hidden="true"
				>
					<path d="M16 3h5v5M4 20 21 3M21 16v5h-5M15 15l6 6M4 4l5 5"></path>
				</svg>
				<span>Team Maker</span>
				{#if active === 'team-maker'}<span class="current-badge">현재</span>{/if}
			</a>
		</div>
	</nav>
</div>

<style>
	.site-nav {
		display: flex;
		flex-direction: column;
		height: 100%;
		min-height: 0;
		padding: 18px 14px 14px;
		font-family:
			'SUIT',
			Inter,
			-apple-system,
			BlinkMacSystemFont,
			'Segoe UI',
			sans-serif;
		color: var(--shell-text-body);
	}

	.site-nav-heading {
		display: flex;
		align-items: center;
		gap: 2px;
		min-height: 36px;
		padding: 0 2px 0 10px;
	}

	.site-name {
		flex: 1 1 auto;
		min-width: 0;
		height: 36px;
		display: flex;
		align-items: center;
		overflow: hidden;
		color: var(--shell-text-heading);
		font-family: 'SUITE', 'SUIT', sans-serif;
		font-size: 18px;
		font-weight: 700;
		line-height: 1;
		letter-spacing: -0.3px;
		text-decoration: none;
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	.nav-icon-button {
		display: flex;
		flex: none;
		align-items: center;
		justify-content: center;
		width: 36px;
		height: 36px;
		padding: 0;
		cursor: pointer;
		color: var(--shell-text-muted);
		background: transparent;
		border: 0;
		border-radius: 8px;
	}

	.nav-icon-button:hover {
		color: var(--shell-text-heading);
		background: var(--shell-row-hover);
	}

	.nav-icon-button:focus-visible,
	.site-name:focus-visible,
	nav a:focus-visible {
		outline: 2px solid var(--shell-focus);
		outline-offset: 2px;
	}

	nav {
		display: flex;
		flex-direction: column;
		gap: 2px;
		margin-top: 18px;
	}

	nav a {
		display: flex;
		align-items: center;
		gap: 10px;
		height: 38px;
		padding: 0 10px 0 7px;
		color: var(--shell-text-body);
		font-size: 15px;
		font-weight: 500;
		text-decoration: none;
		background: transparent;
		border-left: 3px solid transparent;
		border-radius: 5px;
	}

	nav a:hover {
		background: var(--shell-row-hover);
	}

	nav a.active {
		color: var(--shell-nav-accent);
		font-weight: 700;
		background: var(--shell-nav-wash);
		border-left-color: var(--shell-nav-accent);
	}

	nav a span:not(.current-badge) {
		flex: 1;
	}

	.current-badge {
		flex: none;
		padding: 3px 7px;
		font-size: 11px;
		font-weight: 600;
		line-height: 1;
		border: 1px solid currentColor;
		border-radius: 9999px;
	}

	.nav-group-label {
		padding: 18px 10px 6px;
		color: var(--shell-text-muted);
		font-size: 12px;
		font-weight: 600;
		letter-spacing: 0.4px;
	}

	.project-links {
		display: flex;
		flex-direction: column;
		gap: 2px;
		padding-left: 13px;
		margin-left: 10px;
		border-left: 1px solid var(--shell-hairline);
	}
</style>
