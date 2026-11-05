<script>
	import {
		description,
		image,
		imageAlt,
		keywords,
		title,
		siteBaseUrl,
		websiteNode
	} from '$lib/data/meta.js';
	import { resolve } from '$app/paths';
	import SiteShell from '$lib/components/organisms/SiteShell.svelte';
	import { Button, Section, SectionHeader, Surface } from '$lib/components/ui';
	import { categories, formatDate } from '$lib/blog/catalog.js';
	import setaTitleFont from '$lib/team-maker/fonts/seta-title.woff2?url';

	let { data } = $props();

	// 둘러보기 카드. 새 도구는 블로그 카드 앞에 추가한다.
	const tools = [
		{
			href: resolve('/team-maker'),
			title: '팀 메이커',
			kind: '도구',
			icon: 'team',
			iconClass: '',
			description: '스포츠·게임·모임 참가자를 고르게 나누는 무료 팀짜기·조짜기 도구입니다.'
		},
		{
			href: resolve('/bracket'),
			title: '대진표 만들기',
			kind: '도구',
			icon: 'bracket',
			iconClass: 'bracket-project-icon',
			description:
				'2~32팀 토너먼트 대진표를 만들고 이긴 팀을 눌러 우승까지 기록하는 무료 도구입니다.'
		},
		{
			href: resolve('/marble-race'),
			title: 'ASMR 구슬 레이스',
			kind: '도구',
			icon: 'marble',
			iconClass: 'marble-project-icon',
			description:
				'이름이 적힌 구슬을 굴려 당첨자를 뽑아 보세요. 소리와 함께 보는 무료 추첨 도구입니다.'
		},
		{
			href: resolve('/qr-code'),
			title: 'QR 코드 만들기',
			kind: '도구',
			icon: 'qr',
			iconClass: 'qr-project-icon',
			description: '주소와 텍스트를 QR 코드로 만들고 저장·복사·인쇄하는 무료 도구입니다.'
		},
		{
			href: resolve('/aram-mayhem'),
			title: '칼바람 아수라장',
			kind: '가이드',
			icon: 'aram',
			iconClass: 'aram-project-icon',
			description: '챔피언별 추천 증강 조합과 코어 아이템 순서를 정리한 초보자용 가이드입니다.'
		},
		{
			href: resolve('/blog'),
			title: '블로그',
			kind: '가이드',
			icon: 'blog',
			iconClass: 'blog-project-icon',
			description: '파일·이미지·데이터 문제를 직접 실험하고 확인 순서로 정리한 글입니다.'
		}
	];

	const structuredData = JSON.stringify({
		'@context': 'https://schema.org',
		...websiteNode,
		description
	}).replaceAll('<', '\\u003c');
	const structuredDataScript = `<script type="application/ld+json">${structuredData}<` + '/script>';
</script>

<svelte:head>
	<link rel="preload" href={setaTitleFont} as="font" type="font/woff2" crossorigin="anonymous" />
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
	<meta property="og:image:alt" content={imageAlt} />
	<meta name="twitter:card" content="summary_large_image" />
	<meta name="twitter:title" content={title} />
	<meta name="twitter:description" content={description} />
	<meta name="twitter:image" content={image} />
	<meta name="twitter:image:alt" content={imageAlt} />
	<!-- eslint-disable-next-line svelte/no-at-html-tags -->
	{@html structuredDataScript}
</svelte:head>

{#snippet toolIcon(name, size)}
	<svg
		width={size}
		height={size}
		viewBox="0 0 24 24"
		fill="none"
		stroke="currentColor"
		stroke-width={name === 'marble' ? 1.8 : 2}
		stroke-linecap="round"
		stroke-linejoin="round"
	>
		{#if name === 'team'}
			<path d="M16 3h5v5M4 20 21 3M21 16v5h-5M15 15l6 6M4 4l5 5" />
		{:else if name === 'bracket'}
			<path d="M3 3h5v6H3" /><path d="M3 15h5v6H3" /><path d="M8 6h7v12H8M15 12h6" />
		{:else if name === 'marble'}
			<circle cx="7" cy="16" r="4" /><path d="M5.5 15l1-1M15 21V3m0 0h7v8h-7M18.5 3v8M15 7h7" />
		{:else if name === 'qr'}
			<path d="M3 3h6v6H3zM15 3h6v6h-6zM3 15h6v6H3zM15 15h3v3h3v3h-6z" />
		{:else if name === 'aram'}
			<path d="M12 3l2.6 5.3 5.9.9-4.3 4.1 1 5.8L12 16.4 6.8 19.1l1-5.8-4.3-4.1 5.9-.9z" />
		{:else}
			<path d="M12 5v16M12 5C9 3 5 3 2 4v15c3-1 7-1 10 2 3-3 7-3 10-2V4c-3-1-7-1-10 1Z" />
		{/if}
	</svg>
{/snippet}

{#snippet arrowIcon(size)}
	<svg
		width={size}
		height={size}
		viewBox="0 0 24 24"
		fill="none"
		stroke="currentColor"
		stroke-width="2"
		stroke-linecap="round"
		stroke-linejoin="round"><path d="M5 12h14M12 5l7 7-7 7" /></svg
	>
{/snippet}

<SiteShell active="home" variant="home">
	<div class="home-stage">
		<main class="home-column">
			<section class="home-hero" aria-labelledby="home-intro-title">
				<div class="home-hero-copy">
					<p class="home-hero-eyebrow">필요한 도구를 한곳에</p>
					<h1 id="home-intro-title">Seta Lab</h1>
					<p class="home-hero-description">
						설치나 가입 없이 브라우저에서 바로 쓰는 무료 도구를 만듭니다.
					</p>
					<p class="home-hero-story">
						잠깐 필요한 일 때문에 앱을 찾아 설치하고, 회원가입까지 하는 번거로움을 줄이고
						싶었습니다. 직접 써 보며 불편한 점을 찾고, 보내 주신 의견을 살펴 조금씩 고쳐 나갑니다.
					</p>
					<div class="intro-links">
						<Button
							class="github-link"
							href="https://github.com/hjh3311504/hjh3311504.github.io"
							variant="outline"
							size="sm"
						>
							<!-- Bootstrap Icons v1.13.1 (MIT): licenses/Bootstrap-Icons-LICENSE.txt -->
							<svg
								width="18"
								height="18"
								viewBox="0 0 16 16"
								fill="currentColor"
								aria-hidden="true"
							>
								<path
									d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27s1.36.09 2 .27c1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.01 8.01 0 0 0 16 8c0-4.42-3.58-8-8-8"
								></path>
							</svg>
							GitHub
						</Button>
					</div>
				</div>
				<img
					class="home-hero-art"
					src={resolve('/images/home/seta-lab-hero.svg')}
					alt=""
					width="400"
					height="320"
				/>
			</section>
			<Surface variant="raised" class="home-card">
				<Section class="browse" aria-labelledby="browse-title">
					<SectionHeader title="둘러보기" titleId="browse-title" />
					<ul>
						{#each tools as tool (tool.href)}
							<li>
								<Surface class="project-card" href={tool.href} variant="interactive">
									<span
										class={['project-icon', tool.iconClass].filter(Boolean).join(' ')}
										aria-hidden="true">{@render toolIcon(tool.icon, 22)}</span
									>
									<span class="project-copy">
										<span class="project-title-row">
											<span class="project-title">{tool.title}</span>
											<span class="project-kind">{tool.kind}</span>
										</span>
										<span class="project-description">{tool.description}</span>
									</span>
									<span class="project-arrow" aria-hidden="true">{@render arrowIcon(18)}</span>
								</Surface>
							</li>
						{/each}
					</ul>
				</Section>
			</Surface>

			<Section class="home-section latest-posts" aria-labelledby="latest-posts-title">
				<SectionHeader title="최신 블로그 글" titleId="latest-posts-title">
					{#snippet actions()}<Button href={resolve('/blog')} variant="outline" size="sm"
							>전체 글 보기</Button
						>{/snippet}
				</SectionHeader>
				{#if data.latestPosts.length}
					<ul class="latest-post-list">
						{#each data.latestPosts as post, index (post.slug)}
							<li class:featured={index === 0}>
								<Section variant="card" class="latest-post-card" padding="card" gap="body">
									<div class="ui-meta">
										<span class="latest-post-category">{categories[post.category]}</span><time
											datetime={post.publishedAt}>{formatDate(post.publishedAt)}</time
										>
									</div>
									<div class="latest-post-copy">
										<SectionHeader>
											{#snippet heading()}<h3>
													<a href={resolve('/blog/[slug]', { slug: post.slug })}>{post.title}</a>
												</h3>{/snippet}
										</SectionHeader>
										<p>{post.summary}</p>
									</div>
									{#if index === 0}
										<span class="latest-post-arrow" aria-hidden="true">{@render arrowIcon(20)}</span
										>
									{/if}
								</Section>
							</li>
						{/each}
					</ul>
				{:else}
					<p class="latest-posts-empty">
						첫 이야기를 준비하고 있어요. 새로운 글로 곧 찾아뵙겠습니다.
					</p>
				{/if}
			</Section>

			<Section class="home-section home-guide" aria-labelledby="choose-tool-title">
				<SectionHeader title="어떤 도구를 쓰면 될까요?" titleId="choose-tool-title" />
				<p class="home-guide-intro">
					모임을 준비할 때는 나눌 대상과 필요한 결과에 따라 도구를 고르세요.
				</p>
				<dl class="use-list">
					<div class="use-item">
						<dt>
							<span class="use-icon" aria-hidden="true">{@render toolIcon('team', 22)}</span
							>참가자를 여러 팀으로 나누기
						</dt>
						<dd>
							<a href={resolve('/team-maker')}>팀 메이커</a>는 참가자 전원을 여러 팀으로 나눕니다.
							팀별 인원을 고르게 맞추고, 함께하거나 떨어져야 하는 사람을 규칙으로 정할 수 있습니다.
							실력을 평가해 팀을 나누는 기능은 아닙니다.
						</dd>
					</div>
					<div class="use-item">
						<dt>
							<span class="use-icon" aria-hidden="true">{@render toolIcon('marble', 22)}</span
							>발표자나 당첨자 뽑기
						</dt>
						<dd>
							<a href={resolve('/marble-race')}>ASMR 구슬 레이스</a>는 이름이 적힌 구슬을 굴려
							결승선 도착 순서로 당첨자를 뽑습니다. 원하는 도착 순위를 고르고 경기 화면과 소리로
							추첨 과정을 함께 볼 수 있습니다.
						</dd>
					</div>
					<div class="use-item">
						<dt>
							<span class="use-icon" aria-hidden="true">{@render toolIcon('qr', 22)}</span>QR 코드로
							링크 공유하기
						</dt>
						<dd>
							<a href={resolve('/qr-code')}>QR 코드 만들기</a>는 이미 있는 신청서나 안내 페이지의
							주소를 QR 이미지로 바꿉니다. 제목을 붙여 저장하거나 한 장에 여러 개 인쇄할 수
							있습니다. 신청서 자체를 만드는 도구는 아닙니다.
						</dd>
					</div>
					<div class="use-item">
						<dt>
							<span class="use-icon" aria-hidden="true">{@render toolIcon('bracket', 22)}</span
							>팀끼리 토너먼트 경기하기
						</dt>
						<dd>
							<a href={resolve('/bracket')}>대진표 만들기</a>는 2~32팀의 토너먼트 대진표를 만듭니다.
							팀 수가 맞지 않으면 부전승을 자동으로 배치합니다. 이긴 팀을 눌러 우승까지 기록하고
							전체화면이나 A4 인쇄로 보여 줄 수 있습니다.
						</dd>
					</div>
				</dl>
			</Section>

			<Section
				variant="raised"
				padding="card"
				class="home-section home-author"
				aria-labelledby="site-author-title"
			>
				<div class="home-author-heading">
					<img src={resolve('/favicon.svg')} alt="" width="56" height="56" />
					<SectionHeader title="만든 사람과 문의" titleId="site-author-title" />
				</div>
				<div class="home-author-copy">
					<p>
						운영자 Seta가 혼자 만들고 관리합니다. 가이드 글은 직접 만든 예제 파일로 결과를 확인한 뒤
						쓰고, 예제 파일과 측정값을 함께 공개합니다. 도구는 설치나 로그인 없이 브라우저에서
						입력과 계산을 처리합니다.
					</p>
					<p>
						<a href="https://github.com/hjh3311504/hjh3311504.github.io">공개 소스와 변경 기록</a
						>에서 구현을 확인할 수 있습니다. 사용한 외부 자료는
						<a
							href="https://github.com/hjh3311504/hjh3311504.github.io/blob/main/THIRD_PARTY_NOTICES.md"
							>출처·라이선스 목록</a
						>에 구분해 적었습니다. 글을 쓰는 방식과 이메일 문의 방법은
						<a href={resolve('/about')}>소개와 문의</a>에서 확인하세요.
					</p>
				</div>
			</Section>

			<footer class="home-footer">
				<div class="footer-links">
					<a href={resolve('/about')}>소개·문의</a>
					<a href={resolve('/privacy')}>개인정보처리방침</a>
				</div>
				<span>© 2026 Seta Lab</span>
			</footer>
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
		padding: var(--space-40);
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

	.home-column {
		display: flex;
		flex-direction: column;
		gap: var(--space-24);
		width: 100%;
		max-width: 1120px;
	}

	.home-hero {
		display: grid;
		grid-template-columns: minmax(0, 1fr) minmax(0, 400px);
		gap: var(--space-32);
		align-items: center;
		padding: var(--space-40);
		color: var(--color-white);
		background: var(--color-brand-navy);
		border-radius: 14px;
		box-shadow: 0 14px 32px -12px var(--color-box-shadow-3);
	}

	.home-hero-copy {
		display: grid;
		gap: var(--space-12);
		justify-items: start;
		min-width: 0;
	}

	.home-hero-eyebrow {
		margin: 0;
		color: var(--color-brand-sky);
		font-size: var(--font-size-16);
		font-weight: 700;
		line-height: 1.5;
	}

	.home-hero-description {
		max-width: 30em;
		margin: 0;
		color: var(--color-brand-mist);
		font-size: var(--font-size-18);
		line-height: 1.7;
		word-break: keep-all;
	}

	.home-hero-story {
		max-width: 31em;
		margin: 0;
		color: var(--color-brand-mist);
		font-size: var(--font-size-16);
		line-height: 1.8;
		word-break: keep-all;
	}

	.home-hero-art {
		display: block;
		width: 100%;
		height: auto;
	}

	.intro-links {
		display: flex;
		align-items: center;
		gap: var(--space-8);
	}

	:global(.github-link) {
		display: inline-flex;
		align-items: center;
		gap: var(--space-8);
		height: 40px;
		padding: 0 var(--space-16);
		color: var(--color-white);
		font-size: var(--font-size-14);
		font-weight: 600;
		text-decoration: none;
		background: transparent;
		border: 1px solid color-mix(in srgb, var(--color-brand-sky) 55%, transparent);
		border-radius: 8px;
	}

	:global(.github-link:hover) {
		color: var(--color-white);
		background: color-mix(in srgb, var(--color-white) 10%, transparent);
	}

	:global(.home-card) {
		display: flex;
		flex-direction: column;
		gap: var(--space-24);
		width: 100%;
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

	.home-stage :global(h1),
	.home-stage :global(h2),
	.project-title {
		color: var(--shell-text-heading);
		font-family: 'SUITE', 'SUITE Full', 'SUIT', sans-serif;
	}

	/* 사이트 이름 Seta Lab만 Seta Title(Gmarket Sans Bold 영문 수정본)로 쓴다. */
	.home-hero h1 {
		margin: 0;
		color: var(--color-white);
		font-family: 'Seta Title', 'SUITE', 'SUITE Full', 'SUIT', sans-serif;
		font-size: var(--font-size-48);
		font-weight: 700;
		line-height: 1.15;
		/* 공유 이미지(76px에 2px, 약 0.026em)와 같은 비율로 자간을 넓힌다. */
		letter-spacing: 0.026em;
	}

	:global(.github-link:focus-visible) {
		outline: 2px solid var(--color-brand-sky);
		outline-offset: 2px;
	}

	:global(.project-card:focus-visible),
	.home-footer a:focus-visible {
		outline: 2px solid var(--shell-focus);
		outline-offset: 2px;
	}

	/* 둘러보기: 아이콘·글·화살표로 된 작은 카드 격자 */
	:global(.browse) {
		display: flex;
		flex-direction: column;
		gap: var(--space-16);
	}

	:global(.browse) :global(h2) {
		margin: 0;
		font-size: var(--font-size-18);
		font-weight: 700;
		line-height: 1.4;
		letter-spacing: -0.2px;
	}

	:global(.browse) ul {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(min(280px, 100%), 1fr));
		gap: var(--space-12);
		padding: 0;
		margin: 0;
		list-style: none;
	}

	:global(.browse) li {
		display: flex;
	}

	:global(.project-card) {
		position: relative;
		display: grid;
		flex: 1 1 auto;
		grid-template-columns: 40px minmax(0, 1fr);
		gap: var(--space-12);
		align-content: start;
		min-height: 136px;
		padding: var(--space-16) var(--space-16) var(--space-40);
		color: var(--shell-text-body);
		text-decoration: none;
		background: var(--shell-surface);
		border: 1px solid var(--shell-hairline);
		border-radius: 12px;
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
		align-items: center;
		justify-content: center;
		width: 40px;
		height: 40px;
		color: var(--color-white);
		background: var(--color-background);
		border-radius: 10px;
		box-shadow: 0 6px 16px -6px var(--color-box-shadow-7);
	}

	.blog-project-icon {
		background: var(--color-background-8);
		box-shadow: 0 6px 16px -6px color-mix(in srgb, var(--color-background-8) 70%, transparent);
	}

	.qr-project-icon {
		background: var(--color-background-2);
		box-shadow: 0 6px 16px -6px var(--color-box-shadow-8);
	}

	.bracket-project-icon {
		background: var(--color-orange);
		box-shadow: 0 6px 16px -6px color-mix(in srgb, var(--color-orange) 70%, transparent);
	}

	.aram-project-icon {
		background: var(--color-rose);
		box-shadow: 0 6px 16px -6px color-mix(in srgb, var(--color-rose) 70%, transparent);
	}

	.marble-project-icon {
		background: var(--color-background-3);
		box-shadow: 0 6px 16px -6px var(--color-box-shadow-9);
	}

	.project-copy {
		display: flex;
		flex-direction: column;
		gap: var(--space-4);
		min-width: 0;
	}

	.project-title-row {
		display: flex;
		flex-wrap: wrap;
		gap: var(--space-8);
		align-items: baseline;
	}

	.project-title {
		font-size: var(--font-size-16);
		font-weight: 700;
		line-height: 1.4;
		letter-spacing: -0.3px;
	}

	.project-kind {
		color: var(--shell-text-muted);
		font-size: var(--font-size-12);
		font-weight: 600;
		line-height: 1.33;
	}

	.project-description {
		color: var(--shell-text-muted);
		font-size: var(--font-size-14);
		line-height: 1.6;
		word-break: keep-all;
	}

	.project-arrow {
		position: absolute;
		right: var(--space-16);
		bottom: var(--space-12);
		display: flex;
		color: var(--shell-nav-accent);
		transition: transform 200ms cubic-bezier(0.2, 0, 0.2, 1);
	}

	:global(.project-card:hover) .project-arrow {
		transform: translateX(2px);
	}

	/* 카드 밖 하단 영역 공통 */
	:global(.home-section) :global(h2) {
		margin: 0;
		font-size: var(--font-size-24);
		font-weight: 800;
		line-height: 1.4;
		letter-spacing: -0.4px;
	}

	:global(.latest-posts),
	:global(.home-guide) {
		display: grid;
		gap: var(--space-20);
		padding-top: var(--space-16);
	}

	/* 최신 블로그 글: 첫 글 강조 + 2열 카드 */
	.latest-post-list {
		display: grid;
		grid-template-columns: repeat(2, minmax(0, 1fr));
		gap: var(--space-16);
		padding: 0;
		margin: 0;
		list-style: none;
	}

	.latest-post-list li {
		display: flex;
	}

	.latest-post-list li.featured {
		grid-column: 1 / -1;
	}

	:global(.latest-post-card) {
		position: relative;
		flex: 1 1 auto;
		min-width: 0;
		border-radius: 16px;
		box-shadow: 0 4px 12px var(--color-box-shadow-4);
	}

	.featured :global(.latest-post-card) {
		padding-right: var(--space-64);
		background: color-mix(in srgb, var(--color-primary) 6%, var(--ui-surface));
	}

	.latest-post-category {
		color: var(--shell-nav-accent);
		font-weight: 700;
	}

	/* 연파랑 강조 카드 위에서도 작은 글자 대비 4.5:1을 넘도록 제목 색 쪽으로 진하게 섞는다. */
	.featured .latest-post-category {
		color: color-mix(in srgb, var(--shell-nav-accent) 80%, var(--shell-text-heading));
	}

	.latest-post-copy {
		display: grid;
		gap: var(--space-8);
		min-width: 0;
	}

	.latest-post-list h3 {
		font-size: var(--font-size-18);
		line-height: 1.5;
		word-break: keep-all;
		overflow-wrap: anywhere;
	}

	.featured h3 {
		font-size: var(--font-size-24);
	}

	.latest-post-list a {
		color: var(--shell-text-heading);
		text-decoration: none;
	}

	/* 제목 링크가 카드 전체를 덮어 화살표가 있는 첫 글도 카드 어디를 눌러도 이동한다. */
	.latest-post-list a::after {
		position: absolute;
		inset: 0;
		content: '';
		border-radius: inherit;
	}

	.latest-post-list li:hover a {
		text-decoration: underline;
		text-underline-offset: 3px;
	}

	.latest-post-list a:focus-visible {
		outline: 2px solid var(--shell-focus);
		outline-offset: 2px;
	}

	.latest-post-list p,
	.latest-posts-empty {
		margin: 0;
		color: var(--shell-text-muted);
		word-break: keep-all;
		overflow-wrap: anywhere;
	}

	.latest-post-list p {
		display: -webkit-box;
		-webkit-box-orient: vertical;
		-webkit-line-clamp: 2;
		line-clamp: 2;
		overflow: hidden;
		font-size: var(--font-size-14);
		line-height: 1.5;
	}

	.latest-post-arrow {
		position: absolute;
		top: var(--space-28);
		right: var(--space-24);
		display: flex;
		color: var(--shell-nav-accent);
	}

	/* 어떤 도구를 쓰면 될까요?: 용도별 카드 */
	.home-guide-intro {
		margin: 0;
		color: var(--shell-text-muted);
		line-height: 1.8;
		word-break: keep-all;
	}

	.use-list {
		display: grid;
		grid-template-columns: repeat(2, minmax(0, 1fr));
		gap: var(--space-16);
		margin: 0;
	}

	.use-item {
		display: grid;
		gap: var(--space-12);
		align-content: start;
		padding: var(--space-24);
		background: var(--shell-surface);
		border: 1px solid var(--shell-hairline);
		border-radius: 16px;
	}

	.use-item dt {
		display: flex;
		gap: var(--space-12);
		align-items: center;
		color: var(--shell-text-heading);
		font-size: var(--font-size-18);
		font-weight: 700;
		line-height: 1.5;
		word-break: keep-all;
	}

	.use-icon {
		display: flex;
		flex: none;
		align-items: center;
		justify-content: center;
		width: 40px;
		height: 40px;
		color: var(--shell-nav-accent);
		background: color-mix(in srgb, var(--shell-nav-accent) 10%, var(--shell-surface));
		border-radius: 12px;
	}

	.use-item dd {
		margin: 0;
		color: var(--shell-text-muted);
		line-height: 1.8;
		word-break: keep-all;
		overflow-wrap: anywhere;
	}

	.use-item a,
	.home-author-copy a {
		color: var(--shell-nav-accent);
		font-weight: 600;
		text-decoration: underline;
		text-underline-offset: 3px;
	}

	/* 만든 사람과 문의: θ 로고가 있는 프로필 카드 */
	:global(.home-author) {
		display: grid;
		grid-template-columns: 200px minmax(0, 1fr);
		gap: var(--space-32);
		border-radius: 16px;
	}

	.home-author-heading {
		display: flex;
		flex-direction: column;
		gap: var(--space-16);
		align-items: flex-start;
	}

	.home-author-copy {
		display: grid;
		gap: var(--space-16);
	}

	.home-author-copy p {
		margin: 0;
		max-width: 44em;
		color: var(--shell-text-muted);
		line-height: 1.8;
		word-break: keep-all;
		overflow-wrap: anywhere;
	}

	.home-footer {
		display: flex;
		flex-wrap: wrap;
		justify-content: space-between;
		gap: var(--space-12);
		/* 본문이 짧아도 footer가 첫 화면 아래쪽에 머물게 한다. */
		margin-top: auto;
		padding: var(--space-24) var(--space-4) 0;
		font-size: var(--font-size-14);
		line-height: 1.6;
		border-top: 1px solid var(--shell-hairline);
	}

	.footer-links {
		display: flex;
		flex-wrap: wrap;
		gap: var(--space-16);
	}

	.footer-links a {
		color: var(--shell-text-heading);
		text-decoration: underline;
		text-underline-offset: 3px;
	}

	.home-footer span {
		color: var(--shell-text-muted);
	}

	@media (max-width: 1024px) {
		.home-stage {
			/* 위쪽 여백은 화면 왼쪽 위에 떠 있는 메뉴 버튼과 소개 영역이 겹치지 않게 한다. */
			padding: var(--space-64) var(--space-32);
		}
	}

	@media (max-width: 760px) {
		.home-stage {
			padding: var(--space-64) var(--space-16) var(--space-40);
		}

		:global(.home-card) {
			padding: var(--space-16);
		}

		.home-hero {
			grid-template-columns: minmax(0, 1fr);
			gap: var(--space-24);
			padding: var(--space-32) var(--space-20);
		}

		.home-hero-art {
			justify-self: center;
			max-width: 320px;
		}

		.home-hero h1 {
			font-size: var(--font-size-36);
		}

		.home-hero-description {
			font-size: var(--font-size-16);
		}

		:global(.home-section) :global(h2) {
			font-size: var(--font-size-20);
		}

		.latest-post-list,
		.use-list {
			grid-template-columns: minmax(0, 1fr);
		}

		.featured :global(.latest-post-card) {
			padding-right: var(--space-16);
		}

		.featured h3 {
			font-size: var(--font-size-18);
		}

		.latest-post-arrow {
			display: none;
		}

		.use-item {
			padding: var(--space-20);
		}

		:global(.home-author) {
			grid-template-columns: minmax(0, 1fr);
			gap: var(--space-20);
		}

		.home-author-heading {
			flex-direction: row;
			align-items: center;
			gap: var(--space-12);
		}

		.home-author-heading img {
			width: 40px;
			height: 40px;
		}

		.home-footer {
			flex-direction: column;
			padding-top: var(--space-20);
		}
	}
</style>
