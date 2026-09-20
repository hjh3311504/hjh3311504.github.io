<script>
	import { resolve } from '$app/paths';
	import { onMount } from 'svelte';
	import ToolPageLayout from '$lib/components/organisms/ToolPageLayout.svelte';
	import ToolPageFooter from '$lib/components/organisms/ToolPageFooter.svelte';
	import SiteShell from '$lib/components/organisms/SiteShell.svelte';
	import { DisclosureSection } from '$lib/components/ui';
	import { siteBaseUrl } from '$lib/data/meta.js';
	import { mountTeamMaker } from '$lib/team-maker/app.js';
	import ParticipantsSection from '$lib/team-maker/components/ParticipantsSection.svelte';
	import TeamSettingsSection from '$lib/team-maker/components/TeamSettingsSection.svelte';
	import TeamResultsSection from '$lib/team-maker/components/TeamResultsSection.svelte';
	import TodayHistorySection from '$lib/team-maker/components/TodayHistorySection.svelte';
	import BulkAddDialog from '$lib/team-maker/components/BulkAddDialog.svelte';
	import AssignmentRuleDialog from '$lib/team-maker/components/AssignmentRuleDialog.svelte';
	import RostersDialog from '$lib/team-maker/components/RostersDialog.svelte';
	import WheelDialog from '$lib/team-maker/components/WheelDialog.svelte';
	import HistoryDialog from '$lib/team-maker/components/HistoryDialog.svelte';
	import PlayerStatsDialog from '$lib/team-maker/components/PlayerStatsDialog.svelte';
	import ConfirmDialog from '$lib/team-maker/components/ConfirmDialog.svelte';
	import './team-maker.css';

	const seoTitle = '무료 팀짜기·조짜기 프로그램 | 팀 메이커';
	const seoDescription =
		'이름을 입력하면 참가자를 고르게 나누는 무료 온라인 팀짜기·조짜기 프로그램입니다. 같은 팀·다른 팀 규칙, 명단 저장, 승패 기록과 무작위 추첨을 지원합니다.';
	const teamMakerUrl = `${siteBaseUrl}/team-maker`;
	const teamMakerImageUrl = `${siteBaseUrl}/images/team-maker-open-graph-1200x630.png`;
	const teamMakerAssetsBase = '/images/team-maker';
	const structuredData = {
		'@context': 'https://schema.org',
		'@graph': [
			{
				'@type': 'WebSite',
				'@id': `${siteBaseUrl}/#website`,
				url: `${siteBaseUrl}/`,
				name: "Lake's develog",
				inLanguage: 'ko-KR'
			},
			{
				'@type': 'WebPage',
				'@id': `${teamMakerUrl}#webpage`,
				url: teamMakerUrl,
				name: seoTitle,
				description: seoDescription,
				inLanguage: 'ko-KR',
				isPartOf: { '@id': `${siteBaseUrl}/#website` },
				primaryImageOfPage: { '@id': `${teamMakerUrl}#primaryimage` },
				mainEntity: { '@id': `${teamMakerUrl}#application` }
			},
			{
				'@type': 'ImageObject',
				'@id': `${teamMakerUrl}#primaryimage`,
				url: teamMakerImageUrl,
				contentUrl: teamMakerImageUrl,
				width: 1200,
				height: 630,
				caption: '팀 메이커 — 무료 온라인 팀짜기·조짜기 도구'
			},
			{
				'@type': 'WebApplication',
				'@id': `${teamMakerUrl}#application`,
				name: '팀 메이커',
				alternateName: ['Team Maker', '팀짜기', '조짜기', '팀 나누기', '랜덤 팀 배정'],
				url: teamMakerUrl,
				description: seoDescription,
				applicationCategory: 'UtilitiesApplication',
				operatingSystem: 'Any',
				browserRequirements: 'JavaScript를 지원하는 최신 웹 브라우저',
				inLanguage: 'ko-KR',
				image: { '@id': `${teamMakerUrl}#primaryimage` },
				isAccessibleForFree: true,
				offers: {
					'@type': 'Offer',
					price: 0,
					priceCurrency: 'KRW'
				},
				featureList: [
					'참가자 직접 입력 및 일괄 추가',
					'팀 수 또는 팀당 인원 기준 자동 배정',
					'같은 팀 및 다른 팀 배정 규칙',
					'참가자 명단 저장 및 불러오기',
					'승패 기록과 3팀 이상 순위 기록',
					'팀별 무작위 추첨과 당첨자 누적',
					'팀 결과 텍스트 복사',
					'참가자별 승리·당첨·패배 통계'
				],
				author: {
					'@type': 'Person',
					name: 'Lake',
					url: 'https://github.com/hjh3311504'
				}
			}
		]
	};
	const structuredDataScript =
		`<script type="application/ld+json">${JSON.stringify(structuredData).replaceAll('<', '\\u003c')}<` +
		'/script>';

	let pageRoot;

	onMount(() => mountTeamMaker(pageRoot));
</script>

<svelte:head>
	<title>{seoTitle}</title>
	<meta name="description" content={seoDescription} />
	<meta name="keywords" content="팀짜기, 조짜기, 팀 나누기, 랜덤 팀 배정, 팀 메이커" />
	<meta name="author" content="Lake" />
	<meta name="application-name" content="팀 메이커" />
	<meta
		name="robots"
		content="index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1"
	/>
	<link rel="canonical" href={teamMakerUrl} />
	<link rel="icon" href={resolve('/images/team-maker/favicon.svg')} type="image/svg+xml" />

	<meta property="og:type" content="website" />
	<meta property="og:locale" content="ko_KR" />
	<meta property="og:site_name" content="Lake's develog" />
	<meta property="og:title" content={seoTitle} />
	<meta property="og:description" content={seoDescription} />
	<meta property="og:url" content={teamMakerUrl} />
	<meta property="og:image" content={teamMakerImageUrl} />
	<meta property="og:image:secure_url" content={teamMakerImageUrl} />
	<meta property="og:image:type" content="image/png" />
	<meta property="og:image:width" content="1200" />
	<meta property="og:image:height" content="630" />
	<meta property="og:image:alt" content="팀 메이커에서 가상 참가자 6명을 3팀으로 나눈 결과" />

	<meta name="twitter:card" content="summary_large_image" />
	<meta name="twitter:title" content={seoTitle} />
	<meta name="twitter:description" content={seoDescription} />
	<meta name="twitter:image" content={teamMakerImageUrl} />
	<meta name="twitter:image:alt" content="팀 메이커에서 가상 참가자 6명을 3팀으로 나눈 결과" />

	<!-- eslint-disable-next-line svelte/no-at-html-tags -->
	{@html structuredDataScript}
</svelte:head>

<SiteShell active="team-maker" variant="team-maker">
	<div class="team-maker-page" data-assets-base={teamMakerAssetsBase} bind:this={pageRoot}>
		<ToolPageLayout
			class="app-shell"
			headerClass="page-header"
			maxWidth="640px"
			density="compact"
			title="무료 팀짜기·조짜기"
			description="팀 메이커는 스포츠·게임·모임 참가자를 무작위로 고르게 나누는 온라인 팀 배정 도구입니다."
		>
			<!-- AD_SLOT_TOP: 실제 광고는 별도 디자인 승인 뒤 이 위치에 추가합니다. -->

			<div id="storage-alert" class="storage-alert" role="alert" hidden>
				<span class="alert-mark" aria-hidden="true">!</span>
				<div>
					<strong>저장하지 못했습니다</strong>
					<p>
						이 브라우저의 저장 공간을 사용할 수 없어 입력이 유지되지 않습니다. 창을 닫으면 참가자를
						다시 입력해야 합니다.
					</p>
				</div>
			</div>

			<ParticipantsSection />

			<TeamSettingsSection />

			<TeamResultsSection assetsBase={teamMakerAssetsBase} />

			<TodayHistorySection />

			<div class="seo-content" data-testid="team-maker-guide">
				<DisclosureSection
					title="3단계로 팀 나누기"
					titleId="how-to-title"
					class="seo-section"
					detailsClass="seo-details"
				>
					<ol class="guide-steps">
						<li>
							<h3>참가자 이름 입력</h3>
							<p>이름을 한 명씩 추가하거나 여러 명을 줄바꿈 또는 쉼표로 붙여넣으세요.</p>
						</li>
						<li>
							<h3>나누는 방식 선택</h3>
							<p>
								팀 수나 팀당 인원을 정하세요. 꼭 같은 팀 또는 다른 팀이어야 하는 사람이 있으면
								규칙을 추가하세요.
							</p>
						</li>
						<li>
							<h3>결과 확인</h3>
							<p>
								팀 만들기를 누른 뒤 명단을 복사하세요. 필요하면 다시 섞고 승패·순위와 팀별 추첨을
								기록할 수 있습니다.
							</p>
						</li>
					</ol>
				</DisclosureSection>

				<DisclosureSection
					title="이럴 때 사용하세요"
					titleId="use-cases-title"
					class="seo-section"
					detailsClass="seo-details"
				>
					<ul class="use-case-grid">
						<li>
							<strong>10명을 3팀으로 나누기</strong>
							<span
								>가상 참가자 가람, 나래, 다온, 라온, 마루, 바다, 새봄, 아라, 하늘, 한결을
								추가하세요. ‘팀 수로 나누기’에서 3을 고르면 4명·3명·3명으로 배정됩니다. 누가 어느
								팀에 들어가는지는 실행할 때마다 달라질 수 있습니다.</span
							>
						</li>
						<li>
							<strong>함께할 사람과 떨어질 사람 정하기</strong>
							<span
								>‘같은 팀 지정’에서 가람과 나래를 골라 규칙을 추가하세요. ‘다른 팀 지정’에서 가람과
								다온을 고르면 가람·나래는 함께, 다온은 다른 팀에 배정됩니다. 팀을 만든 뒤 결과에서
								규칙이 적용됐는지 확인하세요.</span
							>
						</li>
						<li>
							<strong>다음 모임에서 명단 다시 쓰기</strong>
							<span
								>‘명단 저장·불러오기’를 열어 ‘토요 모임’ 같은 이름으로 저장하세요. 다음에 같은
								브라우저에서 명단을 불러오고, 불참자의 참가 선택을 해제한 뒤 팀을 만드세요. 저장한
								명단은 다른 기기로 자동 이동하지 않습니다.</span
							>
						</li>
						<li>
							<strong>인원과 실력의 차이 이해하기</strong>
							<span
								>팀 메이커는 팀별 인원 차이를 최대 1명으로 맞춥니다. 실력·포지션·경력은 입력받거나
								평가하지 않습니다. 반드시 떨어져야 하는 참가자는 다른 팀 규칙으로 정하고, 활동에
								맞는 구성인지는 직접 확인하세요.</span
							>
						</li>
					</ul>
				</DisclosureSection>

				<DisclosureSection
					title="팀 메이커의 주요 기능"
					titleId="features-title"
					class="seo-section"
					detailsClass="seo-details"
				>
					<ul class="feature-list">
						<li>참가자를 무작위로 섞고 팀별 인원 차이를 최대 1명으로 유지</li>
						<li>꼭 함께하거나 떨어져야 하는 참가자의 같은 팀·다른 팀 규칙</li>
						<li>현재 브라우저에서 다시 불러오는 참가자 명단 저장</li>
						<li>승패·순위 기록과 참가자별 통계</li>
						<li>순위를 정한 팀에서 한 명씩 뽑는 무작위 추첨</li>
					</ul>
				</DisclosureSection>

				<DisclosureSection
					title="자주 묻는 질문"
					titleId="faq-title"
					class="seo-section faq-section"
					detailsClass="seo-details"
				>
					<div class="faq-list">
						<article class="faq-item">
							<h3>팀은 어떻게 나뉘나요?</h3>
							<p>
								참가자 순서를 무작위로 섞은 뒤 팀별 인원 차이가 최대 1명이 되도록 배정합니다. 같은
								팀·다른 팀 규칙이 있으면 함께 적용합니다. 인원을 고르게 나누는 기능이며 실력이
								비슷한 팀을 보장하지는 않습니다.
							</p>
						</article>
						<article class="faq-item">
							<h3>인원이 팀 수로 나누어떨어지지 않으면 어떻게 되나요?</h3>
							<p>
								일부 팀에 한 명이 더 들어갑니다. 예를 들어 10명을 3팀으로 나누면 4명, 3명, 3명으로
								배정합니다.
							</p>
						</article>
						<article class="faq-item">
							<h3>같은 팀이나 다른 팀을 미리 정할 수 있나요?</h3>
							<p>
								네. 참가자 2명 이상을 골라 같은 팀 또는 다른 팀 규칙을 추가할 수 있습니다. 모든
								규칙을 만족할 수 없으면 이유를 알려 줍니다. 예를 들어 같은 두 사람을 같은 팀과 다른
								팀으로 동시에 지정했다면 충돌하는 규칙을 지우거나 수정한 뒤 다시 만드세요.
							</p>
						</article>
						<article class="faq-item">
							<h3>참가자 명단을 다음에도 사용할 수 있나요?</h3>
							<p>
								네. 이름을 붙여 현재 명단과 참가 여부, 배정 규칙을 저장하고 같은 브라우저에서 다시
								불러올 수 있습니다.
							</p>
						</article>
						<article class="faq-item">
							<h3>입력한 이름이 서버로 전송되나요?</h3>
							<p>
								아니요. 참가자와 기록은 브라우저 저장 공간인 localStorage에만 저장됩니다. 브라우저
								데이터를 지우거나 다른 기기로 바꾸면 불러올 수 없습니다.
							</p>
						</article>
						<article class="faq-item">
							<h3>팀을 만든 뒤에는 무엇을 할 수 있나요?</h3>
							<p>
								명단 복사, 다시 섞기, 승패·순위 기록, 팀별 무작위 추첨과 참가자 통계를 사용할 수
								있습니다.
							</p>
						</article>
					</div>
				</DisclosureSection>
			</div>
			<ToolPageFooter />
		</ToolPageLayout>
		<BulkAddDialog />

		<AssignmentRuleDialog />

		<RostersDialog />

		<WheelDialog />

		<HistoryDialog />

		<PlayerStatsDialog />

		<ConfirmDialog />
	</div>
</SiteShell>
