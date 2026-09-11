<script>
	import { description, image, keywords, title, siteBaseUrl } from '$lib/data/meta.js';
	import { resolve } from '$app/paths';
	import PrivacyDialog from '$lib/components/organisms/PrivacyDialog.svelte';
	import SiteShell from '$lib/components/organisms/SiteShell.svelte';
	import { Button, Section, SectionHeader, Surface } from '$lib/components/ui';
</script>

<svelte:head>
	<title>{title}</title>
	<link rel="canonical" href={siteBaseUrl} />
	<meta name="keywords" content={keywords.join(', ')} />
	<meta name="description" content={description} />
	<meta property="og:title" content={title} />
	<meta property="og:description" content={description} />
	<meta property="og:image" content={image} />
	<meta property="og:image:width" content="1200" />
	<meta property="og:image:height" content="630" />
	<meta property="og:image:type" content="image/png" />
	<meta property="og:image:alt" content="Lake의 개발 도구와 프로젝트를 소개하는 사이트" />
	<meta name="twitter:card" content="summary_large_image" />
	<meta name="twitter:title" content={title} />
	<meta name="twitter:description" content={description} />
	<meta name="twitter:image" content={image} />
	<meta name="twitter:image:alt" content="Lake의 개발 도구와 프로젝트를 소개하는 사이트" />
</svelte:head>

<SiteShell active="home" variant="home">
	<div class="home-stage">
		<Surface as="main" variant="raised" class="home-card">
			<Section class="home-intro" aria-labelledby="home-intro-title">
				<div class="eyebrow">개발 기록</div>
				<SectionHeader title="Lake's develog" titleId="home-intro-title" level={1} />
				<p>
					개발하며 만든 도구와 프로젝트를 여기에 모아 둡니다.<br />직접 쓰려고 만든 결과물을
					아래에서 살펴볼 수 있습니다.
				</p>
				<div class="intro-links">
					<Button
						class="github-link"
						href="https://github.com/hjh3311504/hjh3311504.github.io"
						variant="outline"
						size="sm"
					>
						<!-- Bootstrap Icons v1.13.1 (MIT): licenses/Bootstrap-Icons-LICENSE.txt -->
						<svg width="18" height="18" viewBox="0 0 16 16" fill="currentColor" aria-hidden="true">
							<path
								d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27s1.36.09 2 .27c1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.01 8.01 0 0 0 16 8c0-4.42-3.58-8-8-8"
							></path>
						</svg>
						GitHub
					</Button>
				</div>
			</Section>

			<Section class="browse" aria-labelledby="browse-title">
				<SectionHeader title="둘러보기" titleId="browse-title" />
				<ul>
					<li>
						<Surface class="project-card" href={resolve('/team-maker')} variant="interactive">
							<span class="project-icon" aria-hidden="true">
								<svg
									width="26"
									height="26"
									viewBox="0 0 24 24"
									fill="none"
									stroke="currentColor"
									stroke-width="2"
									stroke-linecap="round"
									stroke-linejoin="round"
								>
									<path d="M16 3h5v5M4 20 21 3M21 16v5h-5M15 15l6 6M4 4l5 5"></path>
								</svg>
							</span>
							<span class="project-copy">
								<span class="project-title-row">
									<span class="project-title">팀 메이커</span>
									<span class="project-kind">도구</span>
								</span>
								<span class="project-description">
									스포츠·게임·모임 참가자를 고르게 나누는<br />무료 팀짜기·조짜기 도구입니다.
								</span>
							</span>
							<span class="open-button" aria-hidden="true">
								열기
								<svg
									width="16"
									height="16"
									viewBox="0 0 24 24"
									fill="none"
									stroke="currentColor"
									stroke-width="2"
									stroke-linecap="round"
									stroke-linejoin="round"
								>
									<path d="M5 12h14M12 5l7 7-7 7"></path>
								</svg>
							</span>
						</Surface>
					</li>
					<li>
						<Surface class="project-card" href={resolve('/qr-code')} variant="interactive">
							<span class="project-icon qr-project-icon" aria-hidden="true"
								><svg
									width="26"
									height="26"
									viewBox="0 0 24 24"
									fill="none"
									stroke="currentColor"
									stroke-width="2"
									><path d="M3 3h6v6H3zM15 3h6v6h-6zM3 15h6v6H3zM15 15h3v3h3v3h-6z" /></svg
								></span
							>
							<span class="project-copy"
								><span class="project-title-row"
									><span class="project-title">QR 코드 만들기</span><span class="project-kind"
										>도구</span
									></span
								><span class="project-description"
									>주소와 텍스트를 QR 코드로 만들고<br />저장·복사·인쇄하는 무료 도구입니다.</span
								></span
							>
							<span class="open-button" aria-hidden="true">열기 <span>→</span></span>
						</Surface>
					</li>
				</ul>
			</Section>

			<footer>
				<PrivacyDialog triggerClass="privacy-footer-link" /><span>© 2026 Lake's develog</span>
			</footer>
		</Surface>
	</div>
</SiteShell>

<style>
	.home-stage {
		position: relative;
		z-index: 1;
		display: flex;
		flex: 1 1 auto;
		justify-content: center;
		width: 100%;
		padding: clamp(40px, 7vw, 88px) clamp(16px, 4vw, 40px) clamp(56px, 9vw, 96px);
		font-family:
			'SUIT',
			'SUIT Full',
			-apple-system,
			BlinkMacSystemFont,
			'Segoe UI',
			sans-serif;
		font-size: 16px;
		line-height: 1.5;
	}

	:global(.home-card) {
		display: flex;
		flex-direction: column;
		gap: 28px;
		width: 100%;
		max-width: 720px;
		padding: clamp(24px, 4vw, 36px);
		overflow: hidden;
		color: var(--shell-text-body);
		background: var(--shell-surface);
		border: 1px solid var(--shell-hairline);
		border-radius: 14px;
		box-shadow:
			inset 0 1px 0 rgb(255 255 255 / 90%),
			0 1px 2px rgb(28 30 38 / 6%),
			0 14px 32px -12px rgb(28 30 38 / 20%);
	}

	:global(.home-intro) {
		display: flex;
		flex-direction: column;
		gap: 12px;
	}

	.eyebrow,
	.project-kind {
		color: var(--shell-text-muted);
		font-size: 12px;
		font-weight: 600;
		line-height: 1.33;
		letter-spacing: 0.125px;
	}

	.home-stage :global(h1),
	.home-stage :global(h2),
	.project-title {
		color: var(--shell-text-heading);
		font-family: 'SUITE', 'SUITE Full', 'SUIT', sans-serif;
	}

	.home-stage :global(h1) {
		margin: 0;
		font-size: clamp(36px, 5vw, 45px);
		font-weight: 700;
		line-height: 1.15;
		letter-spacing: -0.75px;
	}

	:global(.home-intro) p {
		max-width: 46ch;
		margin: 0;
		color: var(--shell-text-muted);
		font-size: 16px;
		line-height: 1.65;
		word-break: keep-all;
	}

	.intro-links {
		display: flex;
		align-items: center;
		gap: 8px;
		margin-top: 8px;
	}

	:global(.github-link) {
		display: inline-flex;
		align-items: center;
		gap: 8px;
		height: 40px;
		padding: 0 14px;
		color: var(--shell-text-body);
		font-size: 14px;
		font-weight: 600;
		text-decoration: none;
		background: var(--shell-surface);
		border: 1px solid color-mix(in srgb, var(--shell-hairline), var(--shell-text-muted) 20%);
		border-radius: 8px;
		box-shadow:
			0 1px 2px rgb(28 30 38 / 5%),
			0 4px 12px -4px rgb(28 30 38 / 12%);
	}

	:global(.github-link:hover) {
		color: var(--shell-text-heading);
		background: var(--shell-surface-soft);
		box-shadow:
			0 2px 4px rgb(28 30 38 / 6%),
			0 16px 34px -12px rgb(28 30 38 / 26%);
	}

	:global(.github-link:focus-visible),
	:global(.project-card:focus-visible) {
		outline: 2px solid var(--shell-focus);
		outline-offset: 2px;
	}

	:global(.browse) {
		display: flex;
		flex-direction: column;
		gap: 14px;
		padding-top: 4px;
		border-top: 1px solid var(--shell-hairline);
	}

	:global(.browse) :global(h2) {
		padding-top: 20px;
		margin: 0;
		font-size: 18px;
		font-weight: 700;
		line-height: 1.4;
		letter-spacing: -0.2px;
	}

	:global(.browse) ul {
		display: flex;
		flex-direction: column;
		gap: 12px;
		padding: 0;
		margin: 0;
		list-style: none;
	}

	:global(.project-card) {
		display: flex;
		flex-wrap: wrap;
		gap: 18px;
		align-items: center;
		padding: 20px;
		color: var(--shell-text-body);
		text-decoration: none;
		background: var(--shell-surface);
		border: 1px solid var(--shell-hairline);
		border-radius: 14px;
		box-shadow:
			0 1px 2px rgb(28 30 38 / 5%),
			0 4px 12px -4px rgb(28 30 38 / 12%);
		transition:
			border-color 200ms cubic-bezier(0.2, 0, 0.2, 1),
			box-shadow 260ms cubic-bezier(0.2, 0, 0.2, 1);
	}

	:global(.project-card:hover) {
		text-decoration: none;
		border-color: var(--shell-nav-accent);
		box-shadow:
			0 2px 4px rgb(28 30 38 / 6%),
			0 16px 34px -12px rgb(28 30 38 / 26%);
	}

	.project-icon {
		display: flex;
		flex: none;
		align-items: center;
		justify-content: center;
		width: 56px;
		height: 56px;
		color: #fff;
		background: #2a9d99;
		border-radius: 12px;
		box-shadow: 0 6px 16px -6px rgb(42 157 153 / 70%);
	}

	.qr-project-icon {
		background: #6d4bc3;
		box-shadow: 0 6px 16px -6px rgb(109 75 195 / 70%);
	}

	.project-copy {
		display: flex;
		flex: 1 1 260px;
		flex-direction: column;
		gap: 6px;
		min-width: 0;
	}

	.project-title-row {
		display: flex;
		flex-wrap: wrap;
		gap: 12px;
		align-items: baseline;
	}

	.project-title {
		font-size: 20px;
		font-weight: 700;
		line-height: 1.3;
		letter-spacing: -0.4px;
	}

	.project-description {
		color: var(--shell-text-muted);
		font-size: 16px;
		line-height: 1.65;
		word-break: keep-all;
	}

	.open-button {
		display: inline-flex;
		flex: none;
		align-items: center;
		gap: 8px;
		height: 40px;
		padding: 0 16px;
		color: #fff;
		font-size: 14px;
		font-weight: 700;
		line-height: 1;
		background: #0075de;
		border-radius: 8px;
		box-shadow:
			0 1px 2px rgb(0 117 222 / 22%),
			0 8px 18px -8px rgb(0 117 222 / 50%);
	}

	:global(.privacy-footer-link) {
		color: var(--shell-text-heading);
	}

	footer {
		display: flex;
		flex-wrap: wrap;
		justify-content: space-between;
		gap: 12px;
		padding: 16px clamp(24px, 4vw, 36px);
		margin: auto calc(-1 * clamp(24px, 4vw, 36px)) calc(-1 * clamp(24px, 4vw, 36px));
		font-size: 14px;
		line-height: 1.6;
		background: var(--shell-surface);
		border-top: 1px solid var(--shell-hairline);
		border-radius: 0 0 13px 13px;
	}

	footer span {
		display: block;
		color: var(--shell-text-muted);
		text-align: right;
	}

	@media (max-width: 460px) {
		:global(.project-card) {
			align-items: flex-start;
		}

		.open-button {
			width: 100%;
			justify-content: center;
		}
	}
</style>
