# 방문 통계를 Cloudflare Web Analytics로 전환한다

- 상태: 결정
- 근거: 2026-10-09 사용자 요청 “동의를 구하지 않고 측정하는 방식” 및 Cloudflare 전환 제안 승인
- 관련 요구사항: `REQ-WEB-027`
- 대체 결정: [GA4는 쿠키 없는 측정만 사용한다](./2026-09-29-GA4-쿠키-없는-기본-측정.md)

## 배경

운영 사이트의 GA4 조회 요청은204 응답을 받았으나 GA4 계정의 조회수는0이었다. 모든 방문의 분석 저장 동의를 거부하고 있었고, 계정에는 행동 모델링을 사용할 수 없다는 안내가 표시되었다. 공개 블로그도 기존4개 경로의 수집 목록에서 빠져 있었다.

## 결정

Google 태그를 제거하고 Cloudflare의 공식 Web Analytics beacon을 연결한다. GitHub Pages와 현재 도메인은 유지한다. 공개 사이트 토큰은 GitHub Actions 변수로 전달하며 비밀 API 키는 사용하지 않는다.

동의 버튼을 추가하지 않고 쿠키 없는 방문 횟수·페이지 조회수를 집계한다. 공개 블로그를 포함한다. 이전에 저장한 거부는 유지하고 이전 GA 쿠키만 정리한다. 통계는 Cloudflare 계정에서 확인한다.

공식 SPA 자동 측정을 사용하며 수집 API를 직접 호출하지 않는다. query·hash만 바뀐 이동의 집계는 공식 태그를 따른다. 공식 태그의 페이지·유입 URL 정제를 이용하며 외부 유입이 도메인까지만 전달된다는 기존 보장은 제거한다. 입력 내용은 전송하지 않는다.

태그에는 종료 API가 없으므로 공개 경로와 수집 제외 경로 사이를 오갈 때 양방향 모두 전체 문서를 바꾼다. 같은 문서에서 뒤로 가면 앱의 이동 검사보다 태그가 먼저 주소를 기록할 수 있기 때문이다. 다른 탭에서 기존 거부 설정을 바꾸면 새로고침한다. 앱 자체가 만든 이벤트·스크립트 콜백은 종료 시 해제한다.

## 검증과 한계

로컬 단위 검사와 브라우저 검사에서는 가짜 토큰과 예약 도메인을 사용한다. 공식 태그의 실제 요청은 수집 주소를 가로채 검증한다. 계정 등록, 운영 배포, Cloudflare 보고서 반영은 각각 별도로 확인한다.

Visits는 고유 사람 수가 아니다. 버튼별 클릭 이벤트는 지원하지 않는다. 스크립트 차단·빠른 이탈로 누락될 수 있고 과거 GA4 기록은 이전하지 않는다. 조회 가능한 기간은 현재6개월이다.

## 공식 근거

- [Cloudflare 설치](https://developers.cloudflare.com/web-analytics/get-started/)
- [SPA 자동 측정](https://developers.cloudflare.com/web-analytics/get-started/web-analytics-spa/)
- [집계 기준](https://developers.cloudflare.com/web-analytics/data-metrics/high-level-metrics/)
- [수집·보관·기능 제한](https://developers.cloudflare.com/web-analytics/faq/)
