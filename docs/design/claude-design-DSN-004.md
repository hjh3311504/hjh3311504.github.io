# Claude Design 요청 — DSN-004

## 재작업 지시

이 요청은 새 프로젝트를 만드는 작업이 아닙니다. 현재 열려 있는 `DSN-004` 디자인에서 `SCR-WEB-001` Team Maker와 `SCR-WEB-002` 루트 홈을 직접 수정하세요.

이전 `DSN-004` 결과에서 Team Maker 변경분이 반영되지 않았습니다. `DSN-003` HTML을 그대로 유지하거나 다시 복사하지 마세요. `DSN-003` HTML은 바뀌지 않은 부분을 확인하는 보조 자료입니다.

Team Maker에는 다음 우선순위를 적용하세요.

1. 구조·내용·상태·동작은 `DSN-004` 승인 snapshot을 따릅니다.
2. 현재 시각·움직임은 `src/routes/team-maker/+page.svelte`, `src/routes/team-maker/team-maker.css`, `src/lib/team-maker/app.js`를 따릅니다.
3. 위 파일에 없는 부분만 `DSN-003` HTML을 참고합니다.

Team Maker에 반드시 반영할 변경점은 다음과 같습니다.

- 데스크톱 고정 사이드바와 고정 해제 상태를 추가합니다.
- 모바일·태블릿 상단 bar와 왼쪽 drawer를 추가합니다.
- 본문은 SUIT를 사용하고 제목은 SUITE를 사용합니다.
- `768px` 이상에서 scrollbar 공간을 고정해 dialog를 열고 닫을 때 본문이 흔들리지 않게 합니다.
- dialog는 viewport 중앙에 고정하고 작은 화면에서도 바깥으로 넘치지 않게 합니다.
- 오늘 기록과 전체 기록의 긴 참가자 이름을 생략하지 말고 여러 줄로 표시합니다.
- 팀을 만들면 참가자 한 명씩이 아니라 팀 카드 전체가 차례로 나타납니다.
- 참가자 추가·삭제에는 이전 원본의 행 이동·사라짐 애니메이션을 적용하지 않습니다.

Daylight Design System은 루트 홈과 공통 내비게이션에 적용하세요. Team Maker 본문을 Daylight의 파란색 체계로 다시 칠하지 마세요. Team Maker 본문은 현재 구현의 보라색 중심 밝은 시각 체계를 유지하세요.

## 참조 전달

- 사용 위치: `Claude Design 앱`
- 참조 방식: `승인 파일 첨부`
- 연결한 repo·revision: 해당 없음
- 디자인 시스템: `Daylight Design System`을 루트 홈과 공통 내비게이션의 기본 시각 체계로 사용
- 아래 경로의 기준: `저장소 root 기준 상대경로`

아래 파일만 첨부하세요. 승인 snapshot은 아직 GitHub에서 볼 수 없으므로 repo 연결로 대신하지 마세요.

### 승인 snapshot

- `docs/design/packages/DSN-004/manifest.yaml`
- `docs/design/packages/DSN-004/spec/ia.md`
- `docs/design/packages/DSN-004/spec/screens/SCR-WEB-001.md`
- `docs/design/packages/DSN-004/spec/screens/SCR-WEB-002.md`

### 시각 체계와 현재 구현 참조

- `docs/design/packages/DSN-003/handoff/team-maker-single-page-design/project/_ds/notion-e5ec3c58-0bba-4770-8bb2-3cee184c0cb2/readme.md`
- `docs/design/packages/DSN-003/handoff/team-maker-single-page-design/project/_ds/notion-e5ec3c58-0bba-4770-8bb2-3cee184c0cb2/_ds_manifest.json`
- `docs/design/packages/DSN-003/handoff/team-maker-single-page-design/project/_ds/notion-e5ec3c58-0bba-4770-8bb2-3cee184c0cb2/tokens/colors.css`
- `docs/design/packages/DSN-003/handoff/team-maker-single-page-design/project/_ds/notion-e5ec3c58-0bba-4770-8bb2-3cee184c0cb2/tokens/typography.css`
- `docs/design/packages/DSN-003/handoff/team-maker-single-page-design/project/_ds/notion-e5ec3c58-0bba-4770-8bb2-3cee184c0cb2/tokens/spacing.css`
- `docs/design/packages/DSN-003/handoff/team-maker-single-page-design/project/_ds/notion-e5ec3c58-0bba-4770-8bb2-3cee184c0cb2/tokens/shape.css`
- `docs/design/packages/DSN-003/handoff/team-maker-single-page-design/project/_ds/notion-e5ec3c58-0bba-4770-8bb2-3cee184c0cb2/tokens/elevation.css`
- `docs/design/packages/DSN-003/handoff/team-maker-single-page-design/project/SCR-WEB-001 Team Maker.dc.html`
- `src/lib/scss/_themes.scss`
- `src/lib/scss/_variables.scss`
- `src/lib/scss/_breakpoints.scss`
- `src/lib/components/atoms/Logo.svelte`
- `src/lib/components/molecules/ThemeToggle.svelte`
- `src/lib/components/organisms/Header.svelte`
- `src/lib/components/organisms/Footer.svelte`
- `src/routes/team-maker/+page.svelte`
- `src/routes/team-maker/team-maker.css`
- `src/lib/team-maker/app.js`

승인 snapshot을 구조·내용·상태·동작의 단일 진실 원천으로 사용하세요. 시각 체계와 현재 구현 파일은 스타일과 기존 화면을 이해하는 데만 사용하세요. 서로 충돌하면 승인 snapshot을 따르세요. 로컬 절대경로나 전체 workspace를 요청하지 마세요.

## 단일 진실 원천

아래 승인 snapshot만 사용하세요.

- IA: `docs/design/packages/DSN-004/spec/ia.md`
- 화면 문서: `docs/design/packages/DSN-004/spec/screens/SCR-WEB-001.md`
- 화면 문서: `docs/design/packages/DSN-004/spec/screens/SCR-WEB-002.md`

문서에 없는 정책, field, 상태 전이, 화면을 추가하지 마세요.

## 생성 범위

- surface: `web`
- 필수 화면 수: `2개`
- 필수 화면 ID: `SCR-WEB-001`, `SCR-WEB-002`
- 시각 방향: 공통 내비게이션과 루트 홈은 Daylight Design System으로 새로 디자인하세요. Team Maker 본문은 이전 Claude 원본이 아니라 현재 SvelteKit 구현에 맞춰 갱신하고 공통 내비게이션을 자연스럽게 연결하세요.
- 페이지 내용 변경: 루트의 SvelteKit 템플릿 안내와 블로그 글 목록을 없애고 개발자 소개와 Team Maker·Blog 진입점을 한 열로 보여주세요.
- 공통 내비게이션: `1201px` 이상에서는 왼쪽에 기본 고정하세요. 고정을 풀거나 화면이 `1200px` 이하이면 상단 bar의 햄버거 버튼으로 여는 왼쪽 drawer를 사용하세요.
- 확장성: 프로젝트 메뉴와 루트의 둘러보기 목록은 새 프로젝트가 늘어나도 같은 세로 구조를 유지하세요. 별도 프로젝트 화면을 새로 만들지는 마세요.
- 테마: 루트에서는 기존 자동·밝게·어둡게 전환을 유지하세요. Daylight의 밝은 체계를 기준으로 하고 기존 SCSS token을 사용해 어두운 화면의 대비를 맞추세요. Team Maker에서는 테마 조작을 숨기고 밝은 화면을 유지하세요.
- 상태 표현: 데스크톱 고정, 데스크톱 고정 해제, 모바일 drawer 열림과 닫힘을 화면 안에서 검토할 수 있게 표현하세요. 화면 문서에 없는 상태는 추가하지 마세요.

## 생성 금지

- deferred 화면: 프로젝트 상세 화면, 블로그 목록·글 본문 시각 개편
- tombstone 화면: 없음
- 그 밖의 제외 화면: 별도 Blog 화면, 프로젝트 검색·분류, 로그인, 방문자 분석, 문의 form
- Team Maker 제외 기능: 능력치 모드, 주장 지정, 결과 복사, 사용 방법, FAQ, 개인정보 안내 문구, 다국어, 후원, 공유 링크, 실제 광고, 서버 저장, 여러 기기 동기화

## repo 시각 체계

- 확인한 디자인 token: Daylight의 warm paper `#f6f5f4`, surface `#ffffff`, primary `#0075de`, SUITE 제목, SUIT 본문, 4/8/12/16/24/28/32px 간격, 4~16px radius와 hairline 중심 elevation을 사용하세요.
- 확인한 현재 테마 token: `src/lib/scss/_themes.scss`의 밝은·어두운 색상과 `src/lib/scss/_variables.scss`의 SUIT·SUITE 글꼴 변수를 사용하세요.
- 확인한 breakpoint: `src/lib/scss/_breakpoints.scss`의 desktop 시작값 `1201px`를 사용하세요.
- 사용 가능한 공용 component: `Logo.svelte`, `ThemeToggle.svelte`, `Header.svelte`, `Footer.svelte`를 확인하세요. Team Maker 본문은 `src/routes/team-maker/+page.svelte`, `team-maker.css`, `src/lib/team-maker/app.js`를 현재 기준으로 삼고 DSN-003 HTML은 보조 자료로만 사용하세요.

## 최종 자체검수

완료 전에 다음을 직접 대조하세요.

- [ ] Claude Design 앱에서 위 참조 파일을 모두 실제로 읽을 수 있다.
- [ ] 첨부 파일에 승인 snapshot과 명시한 시각 체계가 있다.
- [ ] 필수 화면 수와 ID가 manifest와 정확히 일치한다.
- [ ] 각 화면의 정상·로딩·빈 화면·오류·권한 상태를 문서에 정의된 범위에서만 표현했다.
- [ ] 역할별 허용 동작과 금지 동작이 문서와 일치한다.
- [ ] 고정 사이드바, 고정 해제, 모바일 drawer 상태와 현재 위치 표시를 반영했다.
- [ ] Team Maker가 이전 DSN-003 원본이 아니라 현재 구현의 글꼴, dialog, 기록 줄바꿈과 애니메이션을 반영했다.
- [ ] deferred·tombstone·제외 화면을 만들지 않았다.
- [ ] 키보드, focus 이동·복귀, Escape 닫기, 스크린리더, 색상 대비 요구를 반영했다.
- [ ] 개인정보와 민감정보 표시·마스킹 규칙을 지켰다.
