# Claude Design 요청 — DSN-008

## 대상 project

- project 이름: `github-io`
- project ID: `02f8142c-f18a-4f7c-9106-d62f7551d9c5`
- project URL: `https://claude.ai/design/p/02f8142c-f18a-4f7c-9106-d62f7551d9c5`
- 기존 읽기 전용 project: `Team-maker single page design` (`b7243de2-ef8c-4ea2-9bae-57a7a7ba8ce9`)

기존 읽기 전용 project와 그 파일을 수정하지 마세요. 지정한 `github-io` project 안에서만 작업하세요.

## 이번 판에서 고친 것

DSN-007 시안과 현재 구현이 어긋난 네 곳만 고쳤습니다. 나머지는 DSN-007 그대로입니다.

| 항목 | DSN-007 시안 | DSN-008 |
|---|---|---|
| 돌림판 | 220px · 조각 4개 고정 · 이름표를 흰 알약으로 얹음 | 현재 구현 그대로. 데스크톱 360px, 모바일 298px, 참가자 수만큼 파스텔 조각, 가운데 24px 원 |
| 승패 표기 설명 | 본문 설명이 `1등`·`2등` | `1팀승`·`2팀패` |
| 삭제 확인 경고 줄 | 설명에만 있고 프레임에는 없음 | T16–T18·T23에 `되돌릴 수 없습니다.` 추가 |
| 삭제 버튼 설명 | "면을 채우지 않는다"고 적었으나 프레임은 채운 빨간 버튼 | 채운 빨간 버튼으로 설명을 맞춤 |

함께 정리한 것

- `screens.css`·`team-maker.css`의 낡은 주석 두 줄을 프레임과 맞췄습니다.
- 어두운 테마 `.btn-danger` 글자색을 `--on-danger`로 뒤집어 대비를 지킵니다.
- 루트 홈 문서의 한글 오타 두 곳(`흘립니다`, `옴깁니다`)을 고쳤습니다.

## 앞선 판

`DSN-005`, `DSN-006`, `DSN-007`은 이 판으로 오는 중간 단계입니다. 저장소에는 넣지 않았습니다.
위 표의 `DSN-007 시안`은 그 중간 단계를 가리킵니다. 실제 기준은 이 문서와 `docs/design/packages/DSN-008/`입니다.

## 파일 구조

`SCR-WEB-001`은 상태가 23개라 문서 6개로 나눠 담습니다. 한 문서가 120KB를 넘으면 한 번에 올릴 수 없어 고쳐 쓰기가 어렵기 때문입니다. 문서마다 위에 같은 차례를 두어 서로 오갈 수 있습니다.

| 파일 | 프레임 |
|---|---|
| `scr-web-001-team-maker.html` | T1–T2 기본 흐름 |
| `scr-web-001-results.html` | T3–T5 결과와 어두운 테마 |
| `scr-web-001-errors.html` | T6–T8 안내와 오류 |
| `scr-web-001-nav-dialogs.html` | T9–T13 내비게이션과 dialog |
| `scr-web-001-draw-confirm.html` | T14–T18 추첨과 삭제 확인 |
| `scr-web-001-mobile.html` | T19–T23 모바일 |
| `scr-web-002-home.html` | H1–H7 루트 홈 |

`index.html`은 개요, `partials.md`는 반복 markup 메모입니다. 산출물은 정적 문서만 만들고 인터랙티브 프로토타입은 만들지 않습니다.

## Claude Design System

- 이름: `Notion`
- 출처: `Claude Design`
- 연결 방식: `이 project에 직접 연결`
- 공개 상태: `Draft`
- Design System project ID: `e5ec3c58-0bba-4770-8bb2-3cee184c0cb2`
- Git source: `해당 없음`

조직 기본값 `HP`를 사용하지 마세요. 연결된 Notion의 token, SUIT·SUITE 글꼴과 component를 사용하세요. `_ds/notion-e5ec3c58-0bba-4770-8bb2-3cee184c0cb2/` 경로는 같은 디자인 시스템 자산입니다.

## 단일 진실 원천

제품 구조와 정책은 아래 승인 snapshot만 따르세요.

- IA: `docs/design/packages/DSN-008/spec/ia.md`
- 화면 문서:
  - `docs/design/packages/DSN-008/spec/screens/SCR-WEB-001.md`
  - `docs/design/packages/DSN-008/spec/screens/SCR-WEB-002.md`

문서에 없는 정책, field, 상태 전이와 화면을 추가하지 마세요.

## 생성 범위

- surface: `web`
- 필수 화면 수: `2개`
- 필수 화면 ID: `SCR-WEB-001`, `SCR-WEB-002`
- 기본값: 팀 수 `2개`, 팀당 인원 `4명`
- 필수 확인 크기: 데스크톱 `1440×1000`, 모바일 `390×844`
- 필수 표현 상태: 두 화면의 밝은·어두운 테마, 고정 사이드바, drawer와 키보드 focus, 팀 메이커 초기 상태, 결과 상태, 저장 실패 alert, 삭제 확인 dialog, 일반 dialog, 규칙 충돌·배정 실패 오류

## 변경 규칙

전체를 다시 설계하지 마세요. 현재 SvelteKit 구현을 시각 기준으로 사용하세요.

- Team Maker의 정보 밀도, 너비, 여백, 한 열 흐름, 카드, form, button, 결과 카드, dialog, drawer와 상태 표현을 현재 구현과 같게 유지하세요.
- 밝은 테마와 어두운 테마의 canvas, surface, 글자, 선, 상태색과 깊이감을 현재 구현과 같게 유지하세요.
- primary 계열만 Notion 파란색입니다. 기본값은 `#0075de`, 눌림·강조값은 `#005bab`입니다.
- 돌림판은 현재 구현 그대로입니다. 파스텔 조각 8색을 순서대로 돌려 쓰고, 이름표는 자기 조각 위에 눕히며, 가운데는 지름 24px 원 하나로 조각이 만나는 점만 가립니다.
- 승패는 팀 이름과 붙여 `1팀승`·`2팀패`로 적습니다. `1등`·`2등` 같은 등수 표기는 쓰지 않습니다.
- 삭제 확인은 제목·설명·`되돌릴 수 없습니다.` 세 줄이며, 실행 버튼은 채운 빨간 버튼입니다.
- `오늘 기록`은 별도 `4. 통계` 영역에 둡니다.
- 루트 홈의 footer는 내용이 짧을 때 첫 화면 하단에 닿게 두고 고정하지 않습니다.

## 생성 금지

- deferred 화면: `프로젝트 상세 화면`
- 제외 화면: `Blog 목록`, `글 본문`, `RSS`, `SvelteKit 템플릿 안내`, `프로젝트 검색·분류`, `로그인`, `방문자 분석`, `문의 form`
- 금지 표기와 기능: `Juno`, 영문 `Team Maker`, 미완성 placeholder, 능력치 모드, 주장 지정, 결과 복사, 사용 방법, FAQ, 개인정보 안내 문구, 루트 사이트 링크, 다국어, 후원, 공유 링크, 실제 광고, 서버 저장, 여러 기기 동기화, 여러 탭 실시간 동기화

`REQ-SEO-001`은 비UI 검색 metadata 요구사항입니다. 화면과 시각 결과에 연결하지 마세요.

## 최종 자체검수

- [x] 지정한 local 파일을 실제로 읽었다.
- [x] `github-io` project가 Draft `Notion` 디자인 시스템을 직접 연결한 상태다.
- [x] 기존 `Team-maker single page design` project를 수정하지 않았다.
- [x] 필수 화면 수와 ID가 manifest와 정확히 일치한다.
- [x] 프레임 23개와 7개가 모두 있고 tag가 닫혀 있다.
- [x] 기본값은 팀 수 2개, 팀당 인원 4명이다.
- [x] 돌림판이 현재 구현과 같고 가운데 원은 24px이다.
- [x] 본문 설명과 프레임이 서로 어긋나지 않는다.
- [x] 삭제 확인 네 곳에 `되돌릴 수 없습니다.` 줄이 있다.
- [x] 삭제 버튼 설명이 채운 빨간 버튼과 맞는다.
- [x] `오늘 기록`은 별도 `4. 통계`에 있다.
- [x] Blog, 글, RSS, Juno, 영문 Team Maker와 미완성 placeholder가 없다.
- [x] 올린 파일 12개가 원격과 byte 단위로 같다.

## 결과 응답

완료 뒤 project ID, project URL과 생성·수정한 전체 file path를 돌려주세요. plan 값이나 인증 token은 응답에 넣지 마세요.
