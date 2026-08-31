# Claude Design 요청 — DSN-001

## 단일 진실 원천

로컬 저장소 루트는 `/Users/hwangjunho/conductor/workspaces/hjh3311504.github.io/team-maker`입니다.
아래 절대경로의 승인 snapshot을 직접 읽고 이 파일들만 단일 진실 원천으로 사용하세요.

- IA: `/Users/hwangjunho/conductor/workspaces/hjh3311504.github.io/team-maker/docs/design/packages/DSN-001/spec/ia.md`
- 화면 문서: `/Users/hwangjunho/conductor/workspaces/hjh3311504.github.io/team-maker/docs/design/packages/DSN-001/spec/screens/SCR-WEB-001.md`

문서에 없는 정책, field, 상태 전이, 화면을 추가하지 마세요.

## 생성 범위

- surface: `web`
- 필수 화면 수: 1개
- 필수 화면 ID: `SCR-WEB-001`
- 시각 방향: 기존 루트 사이트와 같은 색상 token과 카드 언어를 바탕으로 team-maker 화면을 새로 디자인
- 페이지 내용 변경 여부와 핵심: `/team-maker/`에 참가자 입력부터 결과·안내까지 이어지는 새 단일 페이지를 추가

## 생성 금지

- deferred 화면: 루트 사이트의 프로젝트 목록
- tombstone 화면: 없음
- 그 밖의 제외 화면: 능력치 모드, 분리·묶음 그룹, 주장 지정, 다국어, 후원, 공유 링크, 실제 광고, 로그인, 서버 저장, 여러 기기 동기화, 루트 사이트 시각 개편

## repo 시각 체계

- 확인한 디자인 token: `/Users/hwangjunho/conductor/workspaces/hjh3311504.github.io/team-maker/src/lib/scss/_themes.scss`의 primary `#6E29E7`, secondary `#ff571a`, page background `#f4f8fb`, card background `#ffffff`, text `#1c1e26`, success `#009f70`, error `#f95256`, `--card-shadow`
- 확인한 글꼴 token: `/Users/hwangjunho/conductor/workspaces/hjh3311504.github.io/team-maker/src/lib/scss/_variables.scss`의 title/default font 역할만 참고하고, team-maker에서는 외부 font를 불러오지 않는 system font stack 사용
- 사용 가능한 공용 component: `/Users/hwangjunho/conductor/workspaces/hjh3311504.github.io/team-maker/src/lib/components/atoms/Button.svelte`, `/Users/hwangjunho/conductor/workspaces/hjh3311504.github.io/team-maker/src/lib/components/atoms/Card.svelte`의 둥근 버튼·흰 카드·얕은 그림자 표현만 시각 기준으로 사용
- 구현 경계: team-maker는 `/Users/hwangjunho/conductor/workspaces/hjh3311504.github.io/team-maker/static/team-maker/`의 독립 HTML, CSS, JavaScript이므로 Svelte component나 루트 CSS bundle을 직접 import하지 않음

## 시각 방향

- 밝은 배경과 흰 카드의 좁은 1열 작업 영역을 사용한다.
- 보라색 primary는 팀 만들기와 주요 초점에만 쓰고, 주황색 secondary는 작은 강조에 제한한다.
- 장식보다 입력과 결과를 먼저 보이게 하며 큰 hero, 외부 이미지, 캐릭터, 과한 gradient를 쓰지 않는다.
- 친근하지만 어린이용 게임처럼 보이지 않는 단정한 도구 화면으로 만든다.
- 입력, 오류, 비활성화, 성공, 결과 상태는 색상과 문구·모양을 함께 사용해 구분한다.
- PC와 모바일에서 같은 1열 순서를 유지하고 모바일 가로 스크롤을 만들지 않는다.

## 최종 자체검수

완료 전에 다음을 직접 대조하세요.

- [ ] 필수 화면 수와 ID가 manifest와 정확히 일치한다.
- [ ] 문서에 있는 정상·빈 화면·오류·저장 실패 상태만 표현했다.
- [ ] 로그인과 역할별 권한 상태를 새로 만들지 않았다.
- [ ] deferred·tombstone·제외 화면을 만들지 않았다.
- [ ] 키보드, focus, 스크린리더, 색상 대비 요구를 반영했다.
- [ ] 참가자 이름을 외부 전송 요소에 노출하지 않고 로컬 저장 안내를 표시했다.
