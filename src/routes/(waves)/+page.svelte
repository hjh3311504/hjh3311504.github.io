<script>
	import { resolve } from '$app/paths';
	import SiteShell from '$lib/components/organisms/SiteShell.svelte';
</script>

<SiteShell active="home" variant="home">
	<div class="home-stage">
		<main class="home-card">
			<section class="home-intro" aria-labelledby="home-intro-title">
				<div class="eyebrow">개발 기록</div>
				<h1 id="home-intro-title">Juno's develog</h1>
				<p>
					개발하며 만든 도구와 프로젝트를 여기에 모아 둡니다.<br />직접 쓰려고 만든 결과물을
					아래에서 살펴볼 수 있습니다.
				</p>
				<div class="intro-links">
					<a
						class="github-link"
						href="https://github.com/hjh3311504/hjh3311504.github.io"
						target="_blank"
						rel="noopener noreferrer"
					>
						<svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
							<path
								d="M12 .5C5.73.5.6 5.63.6 11.9c0 5.02 3.26 9.28 7.78 10.78.57.1.78-.25.78-.55 0-.27-.01-.99-.02-1.94-3.16.69-3.83-1.52-3.83-1.52-.52-1.32-1.27-1.67-1.27-1.67-1.03-.71.08-.69.08-.69 1.14.08 1.74 1.17 1.74 1.17 1.01 1.74 2.66 1.24 3.31.95.1-.73.4-1.24.72-1.52-2.52-.29-5.18-1.26-5.18-5.62 0-1.24.44-2.26 1.16-3.06-.12-.29-.5-1.45.11-3.02 0 0 .95-.3 3.11 1.17.9-.25 1.87-.38 2.83-.38.96 0 1.93.13 2.83.38 2.16-1.47 3.11-1.17 3.11-1.17.61 1.57.23 2.73.11 3.02.72.8 1.16 1.82 1.16 3.06 0 4.37-2.67 5.33-5.2 5.61.41.35.78 1.06.78 2.13 0 1.54-.02 2.78-.02 3.16 0 .3.21.66.79.55 4.51-1.5 7.77-5.76 7.77-10.78C23.4 5.63 18.27.5 12 .5z"
							></path>
						</svg>
						GitHub
					</a>
				</div>
			</section>

			<section class="browse" aria-labelledby="browse-title">
				<h2 id="browse-title">둘러보기</h2>
				<ul>
					<li>
						<a class="project-card" href={resolve('/team-maker/')}>
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
									<span class="project-title">Team Maker</span>
									<span class="project-kind">도구</span>
								</span>
								<span class="project-description">
									스포츠나 게임 모임의 팀짜기·조짜기. 참가자를 조건에 맞춰 고르게 나누고 그날의
									승패를 기록합니다.
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
						</a>
					</li>
				</ul>
			</section>

			<footer><span>© 2026 Juno's develog</span></footer>
		</main>
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
			Inter,
			-apple-system,
			BlinkMacSystemFont,
			'Segoe UI',
			sans-serif;
		font-size: 16px;
		line-height: 1.5;
	}

	.home-card {
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

	.home-intro {
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

	h1,
	h2,
	.project-title {
		color: var(--shell-text-heading);
		font-family: 'SUITE', 'SUIT', sans-serif;
	}

	h1 {
		margin: 0;
		font-size: clamp(30px, 5vw, 36px);
		font-weight: 700;
		line-height: 1.15;
		letter-spacing: -0.75px;
	}

	.home-intro p {
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

	.github-link {
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

	.github-link:hover {
		color: var(--shell-text-heading);
		background: var(--shell-surface-soft);
		box-shadow:
			0 2px 4px rgb(28 30 38 / 6%),
			0 16px 34px -12px rgb(28 30 38 / 26%);
	}

	.github-link:focus-visible,
	.project-card:focus-visible {
		outline: 2px solid var(--shell-focus);
		outline-offset: 2px;
	}

	.browse {
		display: flex;
		flex-direction: column;
		gap: 14px;
		padding-top: 4px;
		border-top: 1px solid var(--shell-hairline);
	}

	.browse h2 {
		padding-top: 20px;
		margin: 0;
		font-size: 17px;
		font-weight: 700;
		line-height: 1.4;
		letter-spacing: -0.2px;
	}

	.browse ul {
		display: flex;
		flex-direction: column;
		gap: 12px;
		padding: 0;
		margin: 0;
		list-style: none;
	}

	.project-card {
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

	.project-card:hover {
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
		font-size: 15px;
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
		background: #6e29e7;
		border-radius: 8px;
		box-shadow:
			0 1px 2px rgb(110 41 231 / 22%),
			0 8px 18px -8px rgb(110 41 231 / 50%);
	}

	footer {
		padding: 16px clamp(24px, 4vw, 36px);
		margin: auto calc(-1 * clamp(24px, 4vw, 36px)) calc(-1 * clamp(24px, 4vw, 36px));
		font-size: 13px;
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
		.project-card {
			align-items: flex-start;
		}

		.open-button {
			width: 100%;
			justify-content: center;
		}
	}
</style>
