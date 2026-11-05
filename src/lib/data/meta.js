// 공개 사이트의 검색·공유 정보입니다.
export const siteBaseUrl = 'https://hjh3311504.github.io';
export const keywords = [
	'Seta Lab',
	'세타랩',
	'파일 형식 가이드',
	'이미지 용량',
	'CSV 한글 깨짐',
	'QR 코드 만들기',
	'팀 메이커',
	'팀짜기',
	'대진표 만들기',
	'구슬 추첨',
	'칼바람 아수라장 증강'
];
export const description =
	'모임·수업에서 쓰는 무료 브라우저 도구와, 파일·이미지·데이터 문제를 직접 실험해 정리한 가이드를 제공합니다.';
export const title = 'Seta Lab';
// 검색 결과의 사이트 이름 후보입니다. 이전 이름은 이름 변경이 반영되는 동안 함께 알립니다.
export const alternateNames = ['세타랩', "Lake's develog"];
// 모든 페이지의 구조화 데이터가 같은 사이트 정보를 가리키게 합니다.
export const websiteNode = {
	'@type': 'WebSite',
	'@id': `${siteBaseUrl}/#website`,
	url: `${siteBaseUrl}/`,
	name: title,
	alternateName: alternateNames,
	inLanguage: 'ko-KR'
};
export const image = `${siteBaseUrl}/images/site-open-graph-1200x630.png`;
export const imageAlt = '모임·수업 도구와 파일·데이터 가이드를 소개하는 Seta Lab';
// 문의 이메일과 AdSense 게시자 ID는 공개 정보입니다. 게시자 ID는 static/ads.txt와 같아야 합니다.
export const contactEmail = 'hjh3311504@gmail.com';
export const adsenseClient = 'ca-pub-3102141816876720';
// Google CMP 안내에 따라 동의 메시지에 연결하는 개인정보처리방침에는 광고 코드를 넣지 않습니다.
export const adsenseExcludedPaths = ['/privacy'];
