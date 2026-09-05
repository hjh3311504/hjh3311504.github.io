# Claude Design 요청 — DSN-009

## 대상 project

- project 이름: `hjh3311504.github.io`
- project ID: `02f8142c-f18a-4f7c-9106-d62f7551d9c5`
- project URL: `https://claude.ai/design/p/02f8142c-f18a-4f7c-9106-d62f7551d9c5`
- 기존 읽기 전용 project: `Team-maker single page design` (`b7243de2-ef8c-4ea2-9bae-57a7a7ba8ce9`)

기존 읽기 전용 project와 그 파일을 수정하지 마세요. 지정한 `hjh3311504.github.io` project 안에서만 작업하세요.
DSN-008에서 project 이름이 `github-io`에서 바뀌었습니다. project ID는 그대로입니다.

## 참조 전달

- 사용 위치: `Claude Design 직접 MCP`
- 참조 방식: `실행 host의 local 승인 snapshot 읽기`
- MCP local 읽기 범위: `docs/design/packages/DSN-009/spec/`, `src/routes/team-maker/team-maker.css`
- 연결한 repo·revision: `해당 없음`
- 아래 경로의 기준: `저장소 root 기준 상대경로`

아래 단일 진실 원천과 repo 시각 체계에 적힌 파일만 사용하세요.
로컬 절대경로나 전체 workspace를 요청하지 마세요.

## Claude Design System

- 이름: `Notion`
- 출처: `Claude Design`
- 연결 방식: `이 project에 직접 연결`
- 공개 상태: `Draft`
- Design System project ID: `e5ec3c58-0bba-4770-8bb2-3cee184c0cb2`
- Git source: `해당 없음`

조직 기본값 `HP`를 사용하지 마세요. 연결된 Notion의 token, SUIT·SUITE 글꼴과 component를 사용하세요.
`_ds/notion-e5ec3c58-0bba-4770-8bb2-3cee184c0cb2/` 경로는 같은 디자인 시스템 자산입니다.
연결 상태는 이 project에서 이미 확인했습니다. 이름만 보고 연결됐다고 판단하지 말고 생성 전에 다시 확인하세요.

## 단일 진실 원천

아래 승인 snapshot만 사용하세요.

- IA: `docs/design/packages/DSN-009/spec/ia.md`
- 화면 문서:
  - `docs/design/packages/DSN-009/spec/screens/SCR-WEB-001.md`
  - `docs/design/packages/DSN-009/spec/screens/SCR-WEB-002.md`

문서에 없는 정책, field, 상태 전이, 화면을 추가하지 마세요.

## 생성 범위

- surface: `web`
- 필수 화면 수: `2개`
- 필수 화면 ID: `SCR-WEB-001`, `SCR-WEB-002`
- 기존 시각 체계 유지 | 시각 재설계: `기존 시각 체계 유지`
- 페이지 내용 변경 여부와 핵심: `있음 — 팀 메이커에 화면 요소 7개 추가`

색·간격·글꼴·layout·component는 DSN-008 그대로입니다. 새 요소도 같은 시각 언어를 그대로 따르세요.
`SCR-WEB-002` 루트 홈은 내용이 바뀌지 않았습니다. 기존 프레임을 그대로 두세요.

## 이번 판에서 더한 것

| # | 새 요소 | 자리 |
|---|---|---|
| 1 | 결과 복사 버튼 | `3. 결과`의 다시 섞기 옆 |
| 2 | 참가자 통계 버튼과 dialog | `4. 통계` 제목 줄, dialog는 새로 만듦 |
| 3 | 오늘 기록 지우기 버튼 | `4. 통계` 제목 줄의 휴지통 아이콘 버튼 |
| 4 | 당첨자 영역 | `3. 결과`의 팀 격자 아래 별도 묶음 |
| 5 | 돌림판 우측 당첨자 목록 | 돌림판 dialog 안, 좁은 화면에서는 판 아래 |
| 6 | 기록 보기 전체 통계 | 기록 보기 dialog 위쪽의 요약과 승률 막대 |
| 7 | 순위 색 단계 | 팀 카드 칩. 1등 파랑, 마지막 등수 빨강, 중간은 주황에서 빨강 쪽으로 |

승패 표기도 바뀌었습니다. 2팀은 `1팀승`·`2팀패` 그대로이고, 3팀 이상은 등수 숫자를 씁니다.
팀 이름이 옆에 보이는 결과 카드 칩은 `1등`, 팀 이름이 없는 기록 목록은 `1팀 1등`으로 적습니다.
`꼴등` 같은 말은 쓰지 않습니다.

빈 상태 두 가지도 함께 담아 주세요. 오늘 기록이 없는 참가자 통계 dialog와, 기록이 하나도 없어
전체 통계를 숨긴 기록 보기 dialog입니다.

## 파일 구조

DSN-008의 문서 구성과 프레임 번호 체계를 그대로 유지하세요. 한 문서가 120KB를 넘으면 한 번에
올릴 수 없어 고쳐 쓰기가 어렵기 때문에 나눠 둔 것입니다.

| 파일 | 프레임 |
|---|---|
| `scr-web-001-team-maker.html` | 기본 흐름 |
| `scr-web-001-results.html` | 결과와 어두운 테마 |
| `scr-web-001-errors.html` | 안내와 오류 |
| `scr-web-001-nav-dialogs.html` | 내비게이션과 dialog |
| `scr-web-001-draw-confirm.html` | 추첨과 삭제 확인 |
| `scr-web-001-mobile.html` | 모바일 |
| `scr-web-002-home.html` | 루트 홈 |

새 프레임이 필요하면 해당 문서 끝에 이어 붙이고 각 문서 위의 차례를 갱신하세요.
`index.html`은 개요, `partials.md`는 반복 markup 메모입니다.
산출물은 정적 문서만 만들고 인터랙티브 프로토타입은 만들지 않습니다.

## 생성 금지

- deferred 화면: `없음`
- tombstone 화면: `없음`
- 그 밖의 제외 화면: `프로젝트 상세 화면` (별도 소개가 필요한 프로젝트가 추가될 때까지 보류)

범위 밖: 능력치 모드, 주장 지정, 사용 방법·FAQ·개인정보 안내 문구, 다국어, 후원, 공유 링크,
실제 광고, 로그인, 서버 저장, 여러 기기 동기화, 여러 탭 실시간 동기화.

## repo 시각 체계

확인한 디자인 token은 `src/routes/team-maker/team-maker.css`에 있습니다. 밝은 테마 기준입니다.

| 묶음 | token |
|---|---|
| 면 | `--canvas`, `--surface` `#ffffff`, `--surface-soft` `#f9fbfd`, `--surface-alt` `#eef2f7` |
| 글자 | `--ink` `#1c1e26`, `--muted` `#5b5f6b`, `--faint` `#8a90a0` |
| 선 | `--line` `#e7ecf2`, `--line-strong` `#d7dee7` |
| primary | `--primary` `#0075de`, `--primary-active` `#005bab`, `--primary-soft`, `--primary-line`, `--on-primary` |
| danger | `--danger` `#c2333c`, `--danger-fill` `#f95256`, `--danger-soft`, `--danger-line`, `--on-danger` |
| orange | `--orange` `#a83209`, `--orange-soft`, `--orange-line` |
| green | `--green` `#00815c`, `--green-soft`, `--green-line` |
| 그 밖 | `--focus` `#0075de`, `--scrim` |

순위 색 단계는 새 색을 만들지 말고 위 primary·orange·danger 계열만 씁니다.
어두운 테마는 같은 파일의 `[data-theme='dark']` 블록에 따뜻한 검정 계열로 정의돼 있습니다.

공용 component는 `src/lib/components/` 아래에 있습니다.

- `atoms/`: `Button`, `Card`, `Image`, `Logo`, `Tag`, `Sparkles`, `SingleSparkle`
- `molecules/`: `FeatureCard`, `ThemeToggle`, `Socials`, `MarkerHighlight`, `SparklingHighlight`, `TintHighlight`
- `organisms/`: `SiteShell`, `SiteNav`, `Header`, `Footer`, `About`, `Features`, `ContentSection`, `Waves`

팀 메이커 본문은 이 component를 쓰지 않고 `team-maker.css` 안에서 자체 클래스로 그립니다.
공통 내비게이션만 `SiteShell`·`SiteNav`를 씁니다.

## 최종 자체검수

완료 전에 다음을 직접 대조하세요.

- [ ] 직접 MCP 경로에서 모든 참조 파일을 실제로 읽을 수 있다.
- [ ] `Notion` 디자인 시스템이 이 project에 직접 연결돼 있다. 조직 기본값 `HP`를 쓰지 않았다.
- [ ] Draft를 쓰므로 이름만 적지 않고 현재 project 연결을 확인했다.
- [ ] 승인 snapshot `docs/design/packages/DSN-009/spec/`을 읽었다.
- [ ] 필수 화면 수 2개와 ID가 manifest와 정확히 일치한다.
- [ ] 새 요소 7개가 모두 담겼다.
- [ ] 정상·빈 화면·오류 상태를 문서대로 표현했다. 특히 참가자 통계와 전체 통계의 빈 상태.
- [ ] deferred·tombstone·제외 화면을 만들지 않았다.
- [ ] 순위와 승패를 색으로만 구분하지 않고 등수 숫자를 글로도 적었다.
- [ ] 키보드, focus, 스크린리더, 색상 대비 요구를 반영했다.
- [ ] 참가자 이름과 기록은 이 브라우저 안에만 있고 밖으로 나가지 않는다는 전제를 지켰다.

## 결과 응답

완료 뒤 project ID, project URL, 생성·수정한 전체 file path를 돌려주세요.
plan 값이나 인증 token은 응답에 넣지 마세요.
