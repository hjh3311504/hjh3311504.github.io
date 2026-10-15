<script>
	import { getContext } from 'svelte';
	import SiteShell from '$lib/components/organisms/SiteShell.svelte';
	import ToolPageLayout from '$lib/components/organisms/ToolPageLayout.svelte';
	import ToolPageFooter from '$lib/components/organisms/ToolPageFooter.svelte';
	import { Section } from '$lib/components/ui';
	import { ANALYTICS_CONTEXT } from '$lib/analytics/tracker.js';
	import { contactEmail, siteBaseUrl, image as shareImage } from '$lib/data/meta.js';
	import '$lib/blog/prose.css';

	const analytics = getContext(ANALYTICS_CONTEXT);
	const pageTitle = "개인정보처리방침 | Lake's develog";
	const description =
		"Lake's develog가 브라우저에 저장하는 정보, 방문 통계, Google AdSense 광고 쿠키와 문의 방법을 안내합니다.";
	const feedbackUrl =
		'https://github.com/hjh3311504/hjh3311504.github.io/issues/new?template=feedback.yml';
</script>

<svelte:head>
	<title>{pageTitle}</title>
	<meta name="description" content={description} />
	<link rel="canonical" href={`${siteBaseUrl}/privacy`} />
	<meta property="og:title" content={pageTitle} />
	<meta property="og:description" content={description} />
	<meta property="og:url" content={`${siteBaseUrl}/privacy`} />
	<meta property="og:type" content="website" />
	<meta property="og:image" content={shareImage} />
	<meta property="og:image:alt" content="Lake's develog 개인정보처리방침" />
	<meta name="twitter:card" content="summary_large_image" />
	<meta name="twitter:title" content={pageTitle} />
	<meta name="twitter:description" content={description} />
	<meta name="twitter:image" content={shareImage} />
</svelte:head>

<SiteShell active="privacy">
	<ToolPageLayout title="개인정보처리방침" {description} maxWidth="880px">
		<Section variant="card" padding="card" aria-label="개인정보처리방침 본문">
			<div class="blog-prose privacy-content">
				<p class="policy-meta">
					운영자: Lake · 적용일: <time datetime="2026-10-15">2026년 10월 15일</time>
				</p>

				<h2>브라우저에 저장하는 정보</h2>
				<p>
					팀 메이커의 참가자 이름, 참가 여부, 배정 규칙, 저장 명단, 경기 기록과 설정은 현재
					브라우저의 저장 공간인 localStorage에 보관합니다. QR 코드의 북마크에는 입력한
					주소·텍스트와 제목을 저장합니다. 북마크에 추가하지 않은 QR 입력은 저장하지 않습니다. 구슬
					레이스는 설정을 바꿀 때마다 참가자 이름과 맵·당첨 방식·인원/순번·소리 설정·직접 만든 맵을
					저장하며 경기 결과는 저장하지 않습니다. 사이트의 테마와 메뉴 고정 설정도 같은 방식으로
					저장합니다. 입력 내용과 설정을 다시 불러오기 위한 용도이며, 사이트 코드가 이 정보를 운영자
					서버로 전송하지 않습니다.
				</p>

				<h2>저장 기간과 삭제 방법</h2>
				<p>
					저장 정보는 사용자가 삭제하거나 브라우저가 저장 공간을 정리할 때까지 남습니다. 다른 기기나
					브라우저로 자동으로 옮겨지지 않습니다. QR 북마크, 저장 명단과 경기 기록은 각각의 삭제
					기능으로 지울 수 있습니다. 모든 정보를 지우려면 브라우저 설정에서 이 사이트의 저장
					데이터를 삭제하세요. 현재 참가자만 삭제해도 저장 명단과 과거 기록은 남습니다. 운영자는
					브라우저에 저장된 데이터를 조회하거나 복구할 수 없습니다.
				</p>

				<h2>사이트 접속과 외부 서비스</h2>
				<p>
					이 사이트와 글꼴은 GitHub Pages에서 제공합니다. 사이트에 접속하면 GitHub에 IP 주소와
					브라우저 정보 등 접속 정보가 전달될 수 있습니다. 자세한 처리 내용은
					<a
						href="https://docs.github.com/en/site-policy/privacy-policies/github-general-privacy-statement"
						>GitHub 개인정보처리방침</a
					>에서 확인하세요.
				</p>

				<h2>방문 통계</h2>
				<p>
					Cloudflare Web Analytics로 쿠키 없이 방문 횟수와 페이지 조회수를 수집합니다. 홈, 도구,
					공개 블로그, 소개와 이 방침 페이지의 주소, 유입 주소, 브라우저·기기 정보와 페이지 성능
					정보가 Cloudflare에 전달됩니다. 분석용 쿠키나 localStorage를 사용하지 않으며 같은 사람의
					재방문을 구분하지 않습니다. 참가자 이름, QR 입력, 팀 구성과 브라우저에 저장된 도구
					데이터는 보내지 않습니다. 공식 통계 태그는 페이지 주소와 유입 주소의 검색 조건과 # 뒤의
					내용을 제외합니다. 통계는 Cloudflare 계정에 접근할 수 있는 운영자가 확인합니다.
				</p>
				<p>
					통계 동의 버튼은 표시하지 않습니다. 이전에 저장한 통계 거부 선택이 있으면 수집하지
					않습니다. 이전 Google Analytics 수집은 중단하고 기존 분석 쿠키는 삭제합니다.
					Cloudflare에서 최근 6개월의 통계를 확인할 수 있으며, 이전에 수집된 Google 통계가 자동
					삭제되지는 않습니다. 자세한 내용은 <a href="https://www.cloudflare.com/web-analytics/"
						>Cloudflare 통계 안내</a
					>와
					<a href="https://www.cloudflare.com/privacypolicy/">Cloudflare 개인정보처리방침</a>을
					확인하세요.
				</p>
				{#if analytics?.enabled}
					<p aria-live="polite">
						현재 상태: {analytics.consent === 'denied'
							? '기존 거부 설정에 따라 수집하지 않음'
							: analytics.status === 'blocked'
								? '통계 스크립트를 불러오지 못함'
								: analytics.status === 'active'
									? '쿠키 없는 통계 태그 실행 중'
									: '통계 태그 준비 중'}
					</p>
				{:else}
					<p>현재 이 환경에서는 방문 통계를 수집하지 않습니다.</p>
				{/if}

				<h2>광고와 쿠키</h2>
				<p>
					홈, 도구, 블로그와 소개 페이지에는 Google AdSense 광고 코드가 들어 있습니다. 이
					개인정보처리방침과 404 같은 오류 화면에서는 광고 코드를 실행하지 않습니다. 광고가 표시되지
					않는 동안에도 광고 코드는 Google 서버와 통신할 수 있습니다.
				</p>
				<p>
					Google을 포함한 제3자 광고 공급업체는 쿠키를 사용해, 사용자가 이 사이트나 다른 사이트를
					방문한 기록을 바탕으로 광고를 게재합니다. Google은 광고 쿠키를 사용해 이 사이트와 다른
					사이트의 방문 기록에 맞는 광고를 보여 줄 수 있습니다. 이 과정에서 IP 주소, 기기·브라우저
					정보와 쿠키 식별자가 사용될 수 있습니다. 사이트 코드는 참가자 이름이나 QR 입력 같은 도구
					데이터를 광고 코드에 직접 전달하지 않습니다.
				</p>
				<p>
					맞춤 광고는 <a href="https://adssettings.google.com/">Google 광고 설정</a>에서 끌 수
					있습니다. 다른 광고 공급업체의 맞춤 광고는
					<a href="https://optout.aboutads.info/">aboutads.info</a>에서 끌 수 있습니다. 자세한
					내용은
					<a href="https://policies.google.com/technologies/ads?hl=ko">Google 광고 정책 안내</a>와
					<a href="https://policies.google.com/technologies/partner-sites?hl=ko"
						>Google의 파트너 사이트 데이터 이용 안내</a
					>를 확인하세요.
				</p>

				<h2>문의와 방침 변경</h2>
				<p>
					개인정보와 사이트 이용에 관한 문의는 이메일
					<a href={`mailto:${contactEmail}`}>{contactEmail}</a>로 보내 주세요. 기능 개선이나 오류는
					<a href={feedbackUrl}>GitHub 제보 창구</a>로도 받습니다. GitHub에 작성한 내용과 계정명은
					공개될 수 있으므로 참가자의 실제 명단이나 민감한 정보를 게시하지 마세요. 문의 내용은
					답변과 문제 해결에만 사용합니다. 방침이 바뀌면 이 내용과 적용일을 갱신합니다.
				</p>
			</div>
		</Section>
		<ToolPageFooter />
	</ToolPageLayout>
</SiteShell>

<style>
	.privacy-content {
		font-size: var(--font-size-16);
		line-height: 1.8;
		word-break: keep-all;
	}
	.policy-meta {
		color: var(--ui-text-muted);
		font-size: var(--font-size-14);
	}
	.privacy-content a {
		color: var(--ui-text);
		text-decoration: underline;
		text-underline-offset: 3px;
	}
</style>
