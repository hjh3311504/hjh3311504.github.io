// 공개 페이지의 AdSense 코드는 검사 중 실제 Google 서버로 요청하지 않도록 막는다.
export const isAdsenseRequest = (href) =>
	href.startsWith('https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js');

// console 오류를 검사하는 테스트는 빈 스크립트로 응답해 연결 실패 오류를 남기지 않는다.
export const stubAdsense = (page) =>
	page.route(
		(url) => isAdsenseRequest(url.href),
		(route) => route.fulfill({ contentType: 'application/javascript', body: '' })
	);
