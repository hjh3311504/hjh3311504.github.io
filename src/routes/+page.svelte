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
						<Surface class="project-card" href={resolve('/marble-race')} variant="interactive">
							<span class="project-icon marble-project-icon" aria-hidden="true"
								><svg
									width="26"
									height="26"
									viewBox="0 0 24 24"
									fill="none"
									stroke="currentColor"
									stroke-width="1.8"
									stroke-linecap="round"
									stroke-linejoin="round"
									><circle cx="7" cy="16" r="4" /><path
										d="M5.5 15l1-1M15 21V3m0 0h7v8h-7M18.5 3v8M15 7h7"
									/></svg
								></span
							>
							<span class="project-copy"
								><span class="project-title-row"
									><span class="project-title">ASMR 구슬 레이스</span><span class="project-kind"
										>도구</span
									></span
								><span class="project-description"
									>이름을 넣고 블록을 깨며 내려가는 구슬 경기.<br />소리와 함께 즐기는 무료 ASMR
									추첨입니다.</span
								></span
							>
							<span class="open-button" aria-hidden="true">열기 <span>→</span></span>
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

			<Section class="home-guide" aria-labelledby="choose-tool-title">
				<SectionHeader title="어떤 도구를 쓰면 될까요?" titleId="choose-tool-title" />
				<p>모임을 준비할 때는 나눌 대상과 필요한 결과에 따라 도구를 고르세요.</p>
				<dl>
					<dt>참가자를 여러 팀으로 나누기</dt>
					<dd>
						<a href={resolve('/team-maker')}>팀 메이커</a>는 참가자 전원을 여러 팀으로 나눕니다.
						팀별 인원을 고르게 맞추고, 함께하거나 떨어져야 하는 사람을 규칙으로 정할 수 있습니다.
						실력을 평가해 팀을 나누는 기능은 아닙니다.
					</dd>
					<dt>발표자나 당첨자 뽑기</dt>
					<dd>
						<a href={resolve('/marble-race')}>ASMR 구슬 레이스</a>는 구슬의 도착 순서로 당첨자를
						정합니다. 팀 전체를 나누는 대신 원하는 도착 순위를 고르고, 경기 화면과 소리로 진행
						과정을 함께 볼 수 있습니다.
					</dd>
					<dt>QR 코드로 링크 공유하기</dt>
					<dd>
						<a href={resolve('/qr-code')}>QR 코드 만들기</a>는 이미 있는 신청서나 안내 페이지의
						주소를 QR 이미지로 바꿉니다. 제목을 붙여 저장하거나 한 장에 여러 개 인쇄할 수 있습니다.
						신청서 자체를 만드는 도구는 아닙니다.
					</dd>
				</dl>
				<p>
					예를 들어 모임 신청 주소는 QR로 나누고, 모인 참가자는 팀 메이커로 배정한 뒤, 발표 순서는
					구슬 레이스로 정할 수 있습니다. 도구 사이에 입력한 명단이 자동으로 전달되지는 않습니다.
				</p>
			</Section>

			<Section class="home-guide" aria-labelledby="site-author-title">
				<SectionHeader title="만든 사람과 문의" titleId="site-author-title" />
				<p>
					운영자 Lake가 직접 쓰려고 만든 도구를 공개하는 공간입니다. 설치나 로그인 없이 사용할 수
					있도록 브라우저에서 입력과 계산을 처리합니다. 각 도구 아래에서 사용 예제와 저장 방식,
					기능의 한계를 확인하세요.
				</p>
				<p>
					<a href="https://github.com/hjh3311504/hjh3311504.github.io">공개 소스와 변경 기록</a>에서
					구현을 확인할 수 있습니다. 사용한 외부 자료는
					<a
						href="https://github.com/hjh3311504/hjh3311504.github.io/blob/main/THIRD_PARTY_NOTICES.md"
						>출처·라이선스 목록</a
					>에 구분해 적었습니다.
				</p>
				<p>
					사용 중 불편하거나 잘못된 안내를 발견하면 <a
						href="https://github.com/hjh3311504/hjh3311504.github.io/issues/new?template=feedback.yml"
						>개선·버그 제보</a
					>로 알려 주세요. GitHub 계정이 필요하며 제보 내용은 공개됩니다. 실제 참가자 명단 대신 가상
					이름으로 상황을 설명해 주세요.
				</p>
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
		padding: var(--space-80) var(--space-40);
		font-family:
			'SUIT',
			'SUIT Full',
			-apple-system,
			BlinkMacSystemFont,
			'Segoe UI',
			sans-serif;
		font-size: var(--font-size-16);
		line-height: 1.5;
	}

	:global(.home-card) {
		display: flex;
		flex-direction: column;
		gap: var(--space-28);
		width: 100%;
		max-width: 720px;
		padding: var(--space-24);
		overflow: hidden;
		color: var(--shell-text-body);
		background: var(--shell-surface);
		border: 1px solid var(--shell-hairline);
		border-radius: 14px;
		box-shadow:
			inset 0 1px 0 var(--color-box-shadow),
			0 1px 2px var(--color-box-shadow-2),
			0 14px 32px -12px var(--color-box-shadow-3);
	}

	:global(.home-intro) {
		display: flex;
		flex-direction: column;
		gap: var(--space-12);
	}

	.eyebrow,
	.project-kind {
		color: var(--shell-text-muted);
		font-size: var(--font-size-12);
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
		font-size: var(--font-size-44);
		font-weight: 700;
		line-height: 1.15;
		letter-spacing: -0.75px;
	}

	:global(.home-intro) p {
		max-width: 46ch;
		margin: 0;
		color: var(--shell-text-muted);
		font-size: var(--font-size-16);
		line-height: 1.65;
		word-break: keep-all;
	}

	.intro-links {
		display: flex;
		align-items: center;
		gap: var(--space-8);
		margin-top: var(--space-8);
	}

	:global(.github-link) {
		display: inline-flex;
		align-items: center;
		gap: var(--space-8);
		height: 40px;
		padding: 0 var(--space-16);
		color: var(--shell-text-body);
		font-size: var(--font-size-14);
		font-weight: 600;
		text-decoration: none;
		background: var(--shell-surface);
		border: 1px solid color-mix(in srgb, var(--shell-hairline), var(--shell-text-muted) 20%);
		border-radius: 8px;
		box-shadow:
			0 1px 2px var(--color-box-shadow-4),
			0 4px 12px -4px var(--color-box-shadow-5);
	}

	:global(.github-link:hover) {
		color: var(--shell-text-heading);
		background: var(--shell-surface-soft);
		box-shadow:
			0 2px 4px var(--color-box-shadow-2),
			0 16px 34px -12px var(--color-box-shadow-6);
	}

	:global(.github-link:focus-visible),
	:global(.project-card:focus-visible) {
		outline: 2px solid var(--shell-focus);
		outline-offset: 2px;
	}

	:global(.browse) {
		display: flex;
		flex-direction: column;
		gap: var(--space-16);
		padding-top: var(--space-4);
		border-top: 1px solid var(--shell-hairline);
	}

	:global(.browse) :global(h2) {
		padding-top: var(--space-20);
		margin: 0;
		font-size: var(--font-size-18);
		font-weight: 700;
		line-height: 1.4;
		letter-spacing: -0.2px;
	}

	:global(.browse) ul {
		display: flex;
		flex-direction: column;
		gap: var(--space-12);
		padding: 0;
		margin: 0;
		list-style: none;
	}

	:global(.project-card) {
		display: flex;
		flex-wrap: wrap;
		gap: var(--space-20);
		align-items: center;
		padding: var(--space-20);
		color: var(--shell-text-body);
		text-decoration: none;
		background: var(--shell-surface);
		border: 1px solid var(--shell-hairline);
		border-radius: 14px;
		box-shadow:
			0 1px 2px var(--color-box-shadow-4),
			0 4px 12px -4px var(--color-box-shadow-5);
		transition:
			border-color 200ms cubic-bezier(0.2, 0, 0.2, 1),
			box-shadow 260ms cubic-bezier(0.2, 0, 0.2, 1);
	}

	:global(.project-card:hover) {
		text-decoration: none;
		border-color: var(--shell-nav-accent);
		box-shadow:
			0 2px 4px var(--color-box-shadow-2),
			0 16px 34px -12px var(--color-box-shadow-6);
	}

	.project-icon {
		display: flex;
		flex: none;
		align-items: center;
		justify-content: center;
		width: 56px;
		height: 56px;
		color: var(--color-white);
		background: var(--color-background);
		border-radius: 12px;
		box-shadow: 0 6px 16px -6px var(--color-box-shadow-7);
	}

	.qr-project-icon {
		background: var(--color-background-2);
		box-shadow: 0 6px 16px -6px var(--color-box-shadow-8);
	}

	.marble-project-icon {
		background: var(--color-background-3);
		box-shadow: 0 6px 16px -6px var(--color-box-shadow-9);
	}

	.project-copy {
		display: flex;
		flex: 1 1 260px;
		flex-direction: column;
		gap: var(--space-8);
		min-width: 0;
	}

	.project-title-row {
		display: flex;
		flex-wrap: wrap;
		gap: var(--space-12);
		align-items: baseline;
	}

	.project-title {
		font-size: var(--font-size-20);
		font-weight: 700;
		line-height: 1.3;
		letter-spacing: -0.4px;
	}

	.project-description {
		color: var(--shell-text-muted);
		font-size: var(--font-size-16);
		line-height: 1.65;
		word-break: keep-all;
	}

	.open-button {
		display: inline-flex;
		flex: none;
		align-items: center;
		gap: var(--space-8);
		height: 40px;
		padding: 0 var(--space-16);
		color: var(--color-white);
		font-size: var(--font-size-14);
		font-weight: 700;
		line-height: 1;
		background: var(--color-primary);
		border-radius: 8px;
		box-shadow:
			0 1px 2px var(--color-box-shadow-10),
			0 8px 18px -8px var(--color-box-shadow-11);
	}

	:global(.privacy-footer-link) {
		color: var(--shell-text-heading);
	}

	:global(.home-guide) {
		display: grid;
		gap: var(--space-16);
		padding-top: var(--space-24);
		border-top: 1px solid var(--shell-hairline);
		line-height: 1.75;
		word-break: keep-all;
		overflow-wrap: anywhere;
	}

	:global(.home-guide) :global(h2) {
		margin: 0;
		font-size: var(--font-size-20);
	}

	:global(.home-guide) p,
	:global(.home-guide) dl,
	:global(.home-guide) dd {
		margin: 0;
		color: var(--shell-text-muted);
	}

	:global(.home-guide) dt {
		margin: var(--space-16) 0 var(--space-4);
		font-weight: 700;
	}

	:global(.home-guide) dt:first-child {
		margin-top: 0;
	}

	:global(.home-guide) a {
		color: var(--shell-text-heading);
		text-decoration: underline;
		text-underline-offset: 3px;
	}

	footer {
		display: flex;
		flex-wrap: wrap;
		justify-content: space-between;
		gap: var(--space-12);
		padding: var(--space-16) var(--space-24);
		margin: auto calc(-1 * var(--space-24)) calc(-1 * var(--space-24));
		font-size: var(--font-size-14);
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
	@media (max-width: 1024px) {
		.home-stage {
			padding: var(--space-64) var(--space-32) var(--space-80);
		}
	}
	@media (max-width: 760px) {
		.home-stage {
			padding: var(--space-40) var(--space-16) var(--space-60);
		}
		:global(.home-card) {
			padding: var(--space-16);
		}
		footer {
			padding: var(--space-16);
			margin: auto calc(-1 * var(--space-16)) calc(-1 * var(--space-16));
		}

		.home-stage :global(h1) {
			font-size: var(--font-size-36);
		}
	}
</style>
