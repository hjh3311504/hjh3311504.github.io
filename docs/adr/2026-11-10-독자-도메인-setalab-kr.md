# 운영 주소를 독자 도메인 setalab.kr로 바꾼다

- 상태: 결정
- 근거: 2026-11-10 사용자 결정. 가비아에서 `setalab.kr`을 구매했다.
- 관련 요구사항: `REQ-SEO-001`
- 관련 기록: [AdSense 콘텐츠 점검](../adsense-content-review.md)

## 배경

Search Console에 제출한 sitemap 5개가 모두 ‘가져올 수 없음’이었다. 공개 `sitemap.xml`은 HTTP 200과 올바른 XML이었고 사이트 쪽 오류는 찾지 못했다. Google이 아는 주소는 sitemap 214개 중 39개였다. `hjh3311504.github.io` 주소에서는 해결할 방법이 없다고 판단했다.

AdSense는 2026-11-09에 5번째로 거절했다. 커뮤니티 조사에서 도메인만 바꿔 승인된 확인 사례는 없었다. 따라서 이 결정의 목적은 sitemap 수집과 사이트 식별이다. AdSense 승인 해결책으로 보지 않는다.

## 결정

- 운영 주소는 `https://setalab.kr`이다. `www.setalab.kr`은 같은 사이트로 연결한다.
- DNS는 가비아 네임서버에서 관리한다. 루트는 GitHub Pages의 A·AAAA 기록, `www`는 `hjh3311504.github.io` CNAME을 쓴다.
- 기준 주소는 `src/lib/data/meta.js`의 `siteBaseUrl` 하나다. `static/CNAME`과 저장소 Pages 설정의 Custom domain을 같은 값으로 둔다.
- 이전 주소는 GitHub Pages의 301 이동에 맡긴다. route와 경로는 바꾸지 않는다.
- GitHub 저장소 이름은 `hjh3311504.github.io`로 유지한다. 소스·이슈 링크와 공개 글의 재현 명령은 저장소 주소라 바꾸지 않는다.
- 공개 글의 측정 기록에 남은 이전 주소(QR에 넣은 주소, PDF 원문 주소)는 실제 실험 결과라 바꾸지 않는다.

## 전환 순서

1. 가비아에 DNS 기록을 넣고 전파를 확인한다.
2. 저장소 Pages 설정에 Custom domain을 넣고, 이 변경을 배포하고, `PUBLIC_ANALYTICS_ORIGIN`을 `https://setalab.kr`로 바꾼다.
3. HTTPS 인증서가 나오면 Enforce HTTPS를 켠다.
4. Search Console 도메인 속성을 DNS TXT로 확인하고 sitemap을 제출한다. 이전 속성에서 주소 변경 도구를 실행한다.
5. 네이버 서치어드바이저, Cloudflare Web Analytics, 색인 요청 예약 작업, AdSense 사이트 목록에 새 주소를 등록한다.

DNS 전파 전에 2단계를 하면 이전 주소가 열리지 않는 새 주소로 이동해 사이트가 끊긴다.

## 영향과 남은 문제

- 브라우저 저장소(`localStorage`)는 주소(origin)마다 따로 보관된다. 이전 주소에 저장한 Team Maker 명단·기록, 구슬 레이스 맵, 테마·동의 설정은 새 주소에서 보이지 않는다. 이전 주소는 301로 이동하므로 전환 뒤에는 이전 데이터를 읽을 수 없다. 사용자 결정에 따라 사전 안내나 이전 기능 없이 전환한다. 저장 키와 형식은 바꾸지 않으므로 새 주소에서는 빈 상태로 시작한다.
- 검색 결과의 주소와 공유 미리보기는 검색엔진과 공유 서비스가 다시 수집해야 바뀐다. 공유 이미지에 적힌 주소는 `npm run generate:assets`로 새 주소에 맞춰 다시 만들었다.
- AdSense에는 새 사이트로 등록하고 다시 심사받아야 한다.
