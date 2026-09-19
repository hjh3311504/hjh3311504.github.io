import { siteBaseUrl } from '../data/meta.js';

export const pageName = 'ASMR 구슬 레이스';
export const seoTitle = `${pageName} | 무료 구슬 추첨기·랜덤 뽑기`;
export const seoDescription =
	'이름을 넣고 ASMR 블록을 깨며 당첨자를 뽑는 무료 구슬 추첨기입니다. 첫번째·마지막·여러명 순위 범위·n번째 추첨, 커스텀 맵과 전체화면으로 수업 발표자 뽑기와 방송 이벤트에 활용하세요.';
export const pageUrl = `${siteBaseUrl}/marble-race`;
export const shareImage = `${siteBaseUrl}/images/marble-race-open-graph-1200x630.png`;
export const shareImageAlt = 'ASMR 구슬 레이스 — 키보드 블록과 이름이 적힌 구슬을 표현한 그림';

export const guideSteps = [
	{
		title: '참가자 이름 입력',
		text: '이름을 줄바꿈이나 쉼표로 나눠 입력하세요. 토끼*10처럼 쓰면 같은 이름의 구슬이 10개 생깁니다. 전체 구슬은 2개 이상이어야 합니다.'
	},
	{
		title: '맵과 당첨 방식 선택',
		text: '키보드·나무공방·물놀이 맵에서 소리를 골라 보세요. 내 맵 만들기에서는 원하는 블록 4개를 순서대로 고를 수 있고 같은 블록도 반복해서 넣을 수 있습니다.'
	},
	{
		title: '구슬 굴리고 결과 확인',
		text: '구슬 굴리기를 누르면 이름이 적힌 구슬들이 블록과 장애물을 지나갑니다. 결승선을 통과하면 도착 순위와 당첨자를 확인하고 전체 결과를 복사할 수 있습니다.'
	}
];
export const drawMethods = [
	{ title: '첫번째', text: '가장 먼저 결승선을 통과한 구슬 1개가 당첨됩니다.' },
	{ title: '마지막', text: '아직 골인하지 않은 구슬이 1개만 남으면 그 구슬이 바로 당첨됩니다.' },
	{
		title: '여러명',
		text: '시작 순위와 끝 순위를 지정합니다. 시작 4, 끝 6이면 4·5·6번째로 도착한 구슬 3개가 당첨됩니다.'
	},
	{
		title: 'n번째',
		text: '지정한 순번에 도착한 구슬 1개가 당첨됩니다. 순번 10이면 10번째로 도착한 구슬을 뽑습니다.'
	}
];
export const faqs = [
	{
		question: '무료로 쓸 수 있나요? 설치나 로그인이 필요한가요?',
		answer:
			'무료이며 설치나 로그인 없이 웹 브라우저에서 사용합니다. 휴대폰·태블릿·PC에서 이용할 수 있고 전체화면으로 경기장을 크게 보여줄 수 있습니다.'
	},
	{
		question: '일반 룰렛과 무엇이 다른가요?',
		answer:
			'원판을 돌리는 대신 이름이 적힌 구슬이 블록을 깨고 내려갑니다. 키보드 타건이나 팝잇 같은 ASMR 소리를 들으며 추첨 과정을 볼 수 있고, 장애물과 회전 바에서 도착 순서가 바뀔 수 있습니다.'
	},
	{
		question: '당첨자는 어떻게 정하나요?',
		answer:
			'구슬이 블록·장애물·다른 구슬과 부딪히는 움직임을 계산하고, 실제로 결승선을 통과한 순서에 선택한 당첨 방식을 적용합니다. 당첨자를 미리 정해 놓고 경기를 보여주는 방식은 아닙니다. 마지막 방식은 아직 도착하지 않은 구슬이 1개만 남으면 확정합니다. 출발 위치와 충돌 조건이 결과에 영향을 주므로 모든 구슬의 당첨 확률이 같다고 보장하지 않습니다.'
	},
	{
		question: '스킬은 무엇인가요?',
		answer:
			'스킬은 경기에 변수를 더하는 특별한 능력입니다. 출발 전에 스킬 사용 버튼으로 켜거나 끌 수 있으며, 선택한 상태는 이 브라우저에 저장됩니다.'
	},
	{
		question: '같은 사람이 여러 번 당첨될 수 있나요?',
		answer:
			'네. 토끼*10은 각각 고유 번호가 있는 토끼 구슬 10개입니다. 여러명 추첨에서는 같은 이름의 서로 다른 구슬이 당첨될 수 있습니다. 사람마다 구슬 1개를 원하면 이름을 한 번씩만 입력하세요.'
	},
	{
		question: '진행 중에 설정이나 속도를 바꾸려면 어떻게 하나요?',
		answer:
			'경기 화면을 클릭하거나 탭하면 1배속과 2배속을 전환합니다. 결승 연출 중에는 자동으로 0.25배속이 됩니다. 참가자·맵·당첨 방식을 바꾸려면 일시정지를 누른 뒤 종료하고 설정 변경을 선택하세요. 소리와 볼륨은 경기 중에도 조절할 수 있습니다.'
	},
	{
		question: '참가자 명단과 직접 만든 맵은 어디에 저장되나요?',
		answer:
			'명단·맵·당첨 방식·소리 설정과 직접 만든 맵은 현재 브라우저에 저장됩니다. 참가자 명단을 서버로 전송하지 않습니다. 다른 기기와 자동으로 공유되지 않으며 브라우저 데이터를 지우면 사라질 수 있습니다. 경기 결과는 저장하지 않으므로 필요한 결과는 복사해 두세요.'
	}
];
export const structuredData = {
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
			'@id': `${pageUrl}#webpage`,
			url: pageUrl,
			name: seoTitle,
			description: seoDescription,
			inLanguage: 'ko-KR',
			isPartOf: { '@id': `${siteBaseUrl}/#website` },
			mainEntity: { '@id': `${pageUrl}#application` },
			primaryImageOfPage: { '@id': `${pageUrl}#primaryimage` }
		},
		{
			'@type': 'ImageObject',
			'@id': `${pageUrl}#primaryimage`,
			url: shareImage,
			contentUrl: shareImage,
			width: 1200,
			height: 630,
			caption: shareImageAlt
		},
		{
			'@type': 'WebApplication',
			'@id': `${pageUrl}#application`,
			name: pageName,
			alternateName: ['ASMR Marble Race', 'ASMR 구슬 추첨기'],
			url: pageUrl,
			description: seoDescription,
			applicationCategory: 'EntertainmentApplication',
			operatingSystem: 'Any',
			browserRequirements: 'JavaScript를 지원하는 최신 웹 브라우저',
			inLanguage: 'ko-KR',
			isAccessibleForFree: true,
			offers: { '@type': 'Offer', price: 0, priceCurrency: 'KRW' },
			image: { '@id': `${pageUrl}#primaryimage` },
			featureList: [
				'이름 입력과 참가자 곱하기',
				'ASMR 블록 충돌음과 소리 미리듣기',
				'첫번째·마지막·여러명 순위 범위·n번째 추첨',
				'블록 4개로 만드는 커스텀 맵',
				'전체화면·미니맵·일시정지·배속',
				'도착 순위와 당첨 결과 복사',
				'현재 브라우저에 명단과 설정 저장'
			],
			author: { '@type': 'Person', name: 'Lake', url: 'https://github.com/hjh3311504' }
		}
	]
};
export const structuredDataScript = `<script type="application/ld+json">${JSON.stringify(structuredData).replaceAll('<', '\\u003c')}</script>`;
