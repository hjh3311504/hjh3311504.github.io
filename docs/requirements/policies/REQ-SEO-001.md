# REQ-SEO-001 Team Maker 검색 정보

## 문서와 URL

- 문서 언어: `ko`
- 공개 URL과 canonical: `https://hjh3311504.github.io/team-maker`
- sitemap: `https://hjh3311504.github.io/sitemap.xml`
- 마지막 슬래시는 사용하지 않는다.

## 검색 문구

- `title`: `무료 팀짜기·조짜기 프로그램 | 팀 메이커`
- `h1`: `무료 팀짜기·조짜기`
- 소개: `팀 메이커는 스포츠·게임·모임 참가자를 무작위로 고르게 나누는 온라인 팀 배정 도구입니다.`
- `description`: `이름을 입력하면 참가자를 고르게 나누는 무료 온라인 팀짜기·조짜기 프로그램입니다. 같은 팀·다른 팀 규칙, 명단 저장, 승패 기록과 무작위 추첨을 지원합니다.`
- 목표 검색어: `팀짜기`, `조짜기`, `팀 나누기`, `랜덤 팀 배정`

Open Graph와 Twitter의 제목·설명은 검색 문구와 같은 값을 사용한다.

## 공유 이미지

- Team Maker 이미지 경로는 `/images/team-maker-open-graph-1200x630.png`이며 1200×630 PNG를 사용한다.
- 제목은 `팀 메이커`, 소개는 `스포츠·게임·모임을 위한 무료 팀짜기·조짜기`다. 현재 화면의 파란색 결과 카드와 로컬 글꼴을 사용한다.
- 가상 참가자 가람·나래, 다온·라온, 마루·하늘을 각각 1·2·3팀으로 표시한다. 실제 저장 데이터를 넣지 않는다.
- OG와 Twitter의 대체 설명은 `팀 메이커에서 가상 참가자 6명을 3팀으로 나눈 결과`다. 구조화 데이터도 같은 이미지 URL과 크기를 사용한다.
- 홈은 별도의 `/images/site-open-graph-1200x630.png`를 사용한다. 사이트 이름과 소개, Team Maker 진입점을 담는다. 크기는 1200×630이다.
- 두 이미지는 `npm run generate:assets`로 재생성하고 build 검사로 크기·형식·참조를 확인한다.

## 구조화 데이터

- 기존 `WebSite`, `WebPage`, `ImageObject`, `WebApplication` graph를 유지한다.
- `WebApplication.name`은 `팀 메이커`다.
- `alternateName`에는 `Team Maker`, `팀짜기`, `조짜기`, `팀 나누기`, `랜덤 팀 배정`을 넣는다.
- `description`은 검색 설명과 같은 값을 사용한다.
- 실제 화면에서 제공하는 기능만 `featureList`에 넣는다.
- `isAccessibleForFree: true`와 0원 `Offer`를 유지한다.
- `FAQPage` 구조화 데이터는 추가하지 않는다.

## 오류 화면

404와 동적 오류 화면은 `noindex`를 제공한다. 정적 404에는 홈을 가리키는 canonical을 넣지 않는다. 정상 홈의 canonical과 Team Maker 검색 정보는 유지한다.
