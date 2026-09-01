# Claude Design 수정 요청 — DSN-004 Team Maker

## 작업 성격

이 요청은 새 디자인 생성이 아닙니다. 현재 열려 있는 `DSN-004` 프로젝트에서 기존 `SCR-WEB-001` Team Maker 화면만 수정하세요.

- 새 화면을 만들거나 기존 화면을 복제하지 마세요.
- `SCR-WEB-002` 루트 홈은 수정하지 마세요.
- 이미 만든 공통 내비게이션의 모양과 component는 다시 디자인하지 마세요.
- 루트 홈에서 사용한 공통 내비게이션을 Team Maker에도 그대로 재사용하세요.
- `DSN-004`의 화면 수는 기존과 같은 `2개`로 유지하세요.

## 참조 전달

- 사용 위치: `Claude Design 앱`
- 참조 방식: `승인 파일 첨부`
- 작업 대상: 현재 열린 `DSN-004` 프로젝트의 기존 `SCR-WEB-001`
- 아래 경로의 기준: `저장소 root 기준 상대경로`

다음 파일만 첨부하세요.

- `docs/design/packages/DSN-004/spec/screens/SCR-WEB-001.md`
- `src/routes/team-maker/+page.svelte`
- `src/routes/team-maker/team-maker.css`
- `src/lib/team-maker/app.js`
- `src/lib/scss/_breakpoints.scss`
- `src/lib/components/atoms/Logo.svelte`
- `docs/design/packages/DSN-003/handoff/team-maker-single-page-design/project/SCR-WEB-001 Team Maker.dc.html`

로컬 절대경로나 전체 workspace를 요청하지 마세요.

## 기준 우선순위

Team Maker에는 다음 순서로 기준을 적용하세요.

1. 구조·내용·상태·동작은 `docs/design/packages/DSN-004/spec/screens/SCR-WEB-001.md`를 따릅니다.
2. 현재 시각·움직임은 `src/routes/team-maker/+page.svelte`, `team-maker.css`, `src/lib/team-maker/app.js`를 따릅니다.
3. 공통 내비게이션은 현재 `SCR-WEB-002`에서 사용 중인 component를 그대로 재사용합니다.
4. 위 기준에 없는 부분만 `DSN-003` HTML을 참고합니다.

`DSN-003` HTML은 오래된 원본입니다. 현재 구현과 다르면 현재 구현을 따르세요. 문서에 없는 정책, field, 상태 전이와 화면은 추가하지 마세요.

## Team Maker 필수 수정

### 공통 내비게이션 연결

- `1201px` 이상에서는 기존 공통 사이드바를 왼쪽에 고정합니다.
- 본문은 남은 영역의 가운데에 두고 현재 Team Maker의 최대 너비를 유지합니다.
- 고정 해제 상태에서는 기존 상단 bar와 왼쪽 drawer를 사용합니다.
- `1200px` 이하에서도 같은 상단 bar와 drawer를 사용합니다.
- 현재 위치인 `Team Maker`를 글과 모양으로 표시합니다.
- Team Maker에서는 테마 조작을 숨깁니다.
- drawer가 열려도 Team Maker 본문에 가로 스크롤이 생기지 않게 합니다.

### 현재 구현 동기화

- 본문은 현재 구현의 보라색 중심 밝은 시각 체계를 유지합니다.
- 본문 글꼴은 SUIT를 사용하고 제목은 SUITE를 사용합니다.
- Team Maker 본문을 Daylight의 파란색 체계로 다시 칠하지 마세요.
- `768px` 이상에서 scrollbar 공간을 고정해 dialog를 열고 닫을 때 본문이 흔들리지 않게 합니다.
- dialog는 viewport 중앙에 고정합니다.
- 작은 화면에서는 dialog와 돌림판이 화면 밖으로 넘치지 않게 합니다.
- 오늘 기록과 전체 기록의 긴 참가자 이름을 생략하지 말고 여러 줄로 표시합니다.
- 팀을 만들면 참가자 한 명씩이 아니라 팀 카드 전체가 차례로 나타납니다.
- 참가자 추가·삭제에는 DSN-003 원본의 행 이동·사라짐 애니메이션을 적용하지 않습니다.

## 유지할 내용

- 제목부터 참가자 입력, 나누는 방식, 팀 만들기, 결과까지의 순서를 유지합니다.
- 참가자 입력, 일괄 추가, 명단 저장·불러오기, 규칙, 승패 기록과 돌림판을 모두 유지합니다.
- 현재 문구, label, 오류 안내, 비활성화 이유와 dialog 내용을 바꾸지 않습니다.
- 기존 Team Maker의 카드 크기, form 밀도와 한 열 모바일 흐름을 유지합니다.
- 현재 구현에 없는 새 기능이나 별도 설정을 추가하지 않습니다.

## 수정 금지

- `SCR-WEB-002` 루트 홈
- Blog 화면과 블로그 글
- 공통 내비게이션의 기본 모양과 메뉴 구조
- 능력치 모드, 주장 지정, 결과 복사, 사용 방법, FAQ
- 다국어, 후원, 공유 링크, 광고, 로그인, 서버 저장과 여러 기기 동기화

## 최종 자체검수

완료 전에 다음을 직접 확인하세요.

- [ ] 기존 `SCR-WEB-001`을 수정했고 새 Team Maker 화면을 만들지 않았다.
- [ ] `SCR-WEB-002`와 기존 공통 내비게이션의 모양을 바꾸지 않았다.
- [ ] 데스크톱 고정, 데스크톱 고정 해제와 모바일 drawer 상태가 모두 동작한다.
- [ ] Team Maker 현재 위치 표시와 테마 조작 숨김을 반영했다.
- [ ] 현재 구현의 SUIT·SUITE, dialog, 기록 줄바꿈과 팀 카드 애니메이션을 반영했다.
- [ ] Team Maker 기능, 문구, field와 상태 전이를 임의로 바꾸지 않았다.
- [ ] 키보드 초점, drawer 초점 복귀, Escape 닫기와 색상 대비를 반영했다.
