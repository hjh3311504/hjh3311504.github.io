<script>
	import { resolve } from '$app/paths';
	import SiteShell from '$lib/components/organisms/SiteShell.svelte';
	import ToolPageLayout from '$lib/components/organisms/ToolPageLayout.svelte';
	import ToolPageFooter from '$lib/components/organisms/ToolPageFooter.svelte';
	import { Section } from '$lib/components/ui';
	import { contactEmail, siteBaseUrl, image as shareImage } from '$lib/data/meta.js';
	import '$lib/blog/prose.css';

	const pageTitle = "소개와 문의 | Lake's develog";
	const description =
		"Lake's develog는 파일·이미지·데이터 문제를 직접 실험해 정리한 가이드와 설치 없이 쓰는 브라우저 도구를 운영합니다. 글을 쓰는 방식과 문의 방법을 안내합니다.";
	const repositoryUrl = 'https://github.com/hjh3311504/hjh3311504.github.io';
	const noticesUrl =
		'https://github.com/hjh3311504/hjh3311504.github.io/blob/main/THIRD_PARTY_NOTICES.md';
	const feedbackUrl =
		'https://github.com/hjh3311504/hjh3311504.github.io/issues/new?template=feedback.yml';
	const structuredData = JSON.stringify({
		'@context': 'https://schema.org',
		'@type': 'AboutPage',
		name: pageTitle,
		url: `${siteBaseUrl}/about`,
		description,
		mainEntity: {
			'@type': 'Person',
			name: 'Lake',
			url: `${siteBaseUrl}/about`,
			email: `mailto:${contactEmail}`,
			sameAs: ['https://github.com/hjh3311504']
		}
	}).replaceAll('<', '\\u003c');
	const structuredDataScript = `<script type="application/ld+json">${structuredData}<` + '/script>';
</script>

<svelte:head>
	<title>{pageTitle}</title>
	<meta name="description" content={description} />
	<link rel="canonical" href={`${siteBaseUrl}/about`} />
	<meta property="og:title" content={pageTitle} />
	<meta property="og:description" content={description} />
	<meta property="og:url" content={`${siteBaseUrl}/about`} />
	<meta property="og:type" content="profile" />
	<meta property="og:image" content={shareImage} />
	<meta property="og:image:alt" content="Lake's develog 소개" />
	<meta name="twitter:card" content="summary_large_image" />
	<meta name="twitter:title" content={pageTitle} />
	<meta name="twitter:description" content={description} />
	<meta name="twitter:image" content={shareImage} />
	<!-- eslint-disable-next-line svelte/no-at-html-tags -->
	{@html structuredDataScript}
</svelte:head>

<SiteShell active="about">
	<ToolPageLayout
		title="소개와 문의"
		description="이 사이트에서 다루는 내용과 글을 쓰는 방식, 문의 방법을 안내합니다."
		maxWidth="880px"
	>
		<Section variant="card" padding="card" aria-label="소개 본문">
			<div class="blog-prose about-content">
				<h2>이 사이트에서 다루는 것</h2>
				<p>
					Lake's develog는 운영자 Lake가 혼자 만들고 관리하는 개인 사이트입니다. 직접 쓰려고 만든
					도구를 공개하면서 시작했고, 지금은 두 가지를 다룹니다.
				</p>
				<ul>
					<li>
						<a href={resolve('/blog')}>블로그</a>: 이미지 용량, CSV 한글 깨짐, PDF 검색, 파일
						해시처럼 파일·이미지·데이터를 다루다 자주 막히는 문제를 확인하는 순서로 정리합니다.
					</li>
					<li>
						도구: 참가자를 여러 팀으로 나누는 <a href={resolve('/team-maker')}>팀 메이커</a>, 구슬
						경주로 당첨자를 뽑는 <a href={resolve('/marble-race')}>ASMR 구슬 레이스</a>, 주소와
						텍스트를 QR 이미지로 바꾸는 <a href={resolve('/qr-code')}>QR 코드 만들기</a>, 팀끼리
						겨루는 토너먼트를 기록하는 <a href={resolve('/bracket')}>대진표 만들기</a>를 제공합니다.
					</li>
				</ul>

				<h2>글을 쓰는 방식</h2>
				<p>
					가이드 글은 다른 글을 요약하지 않고, 직접 만든 예제 파일로 결과를 확인한 뒤 씁니다. 예를
					들어 ZIP 압축 글은 파일 4개를 같은 설정으로 압축해 실제 크기를 비교했습니다.
				</p>
				<ul>
					<li>본문에 쓴 예제 파일과 측정값을 함께 내려받을 수 있게 공개합니다.</li>
					<li>예제를 만든 코드는 공개 저장소의 <code>scripts/</code> 폴더에 남깁니다.</li>
					<li>형식과 동작의 근거는 공식 문서나 표준 문서로 연결합니다.</li>
					<li>
						운영체제나 프로그램에 따라 결과가 달라질 수 있는 부분은 그 한계를 본문에 적습니다.
					</li>
					<li>내용을 고치면 글 위쪽에 수정 날짜를 표시합니다.</li>
				</ul>

				<h2>도구를 만드는 방식</h2>
				<p>
					모든 도구는 설치나 로그인 없이 브라우저에서 입력과 계산을 처리합니다. 입력한 명단과 설정은
					브라우저의 저장 공간에만 남고 운영자 서버로 보내지 않습니다. 자세한 내용은
					<a href={resolve('/privacy')}>개인정보처리방침</a>을 확인하세요.
				</p>
				<p>
					기능을 바꾸면 도구 화면의 사용 안내와 관련 블로그 글도 함께 고칩니다. 구현과 변경 기록은
					<a href={repositoryUrl}>공개 저장소</a>에서 볼 수 있습니다. 사용한 글꼴·아이콘·효과음 등
					외부 자료는 <a href={noticesUrl}>출처·라이선스 목록</a>에 정리했습니다.
				</p>

				<h2>광고</h2>
				<p>
					사이트 운영 비용을 위해 Google AdSense 광고를 게재할 수 있습니다. 광고는 글과 도구의
					내용과 구분해 표시하며, 광고 때문에 글의 결론을 바꾸지 않습니다. 광고 쿠키에 관한 내용은
					<a href={resolve('/privacy')}>개인정보처리방침</a>의 ‘광고와 쿠키’를 확인하세요.
				</p>

				<h2 id="contact">문의</h2>
				<p>글의 오류, 도구 사용 중 불편한 점, 개인정보 관련 문의는 이메일로 보내 주세요.</p>
				<p class="contact-email">
					<a href={`mailto:${contactEmail}`}>{contactEmail}</a>
				</p>
				<p>
					GitHub 계정이 있다면 <a href={feedbackUrl}>개선·버그 제보</a>로 남겨도 됩니다. 제보 내용과
					계정명은 공개되므로 실제 참가자 명단 대신 가상 이름으로 상황을 설명해 주세요.
				</p>
			</div>
		</Section>
		<ToolPageFooter />
	</ToolPageLayout>
</SiteShell>

<style>
	.about-content {
		font-size: var(--font-size-16);
		line-height: 1.8;
		word-break: keep-all;
	}
	.about-content a {
		color: var(--ui-text);
		text-decoration: underline;
		text-underline-offset: 3px;
	}
	.contact-email {
		font-size: var(--font-size-18);
		font-weight: 700;
	}
</style>
