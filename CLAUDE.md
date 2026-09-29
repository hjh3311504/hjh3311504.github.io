# hjh3311504.github.io — agent 작업 지침

Codex, Claude Code와 기타 coding agent가 함께 사용하는 저장소 지침이다. `AGENTS.md`와 `CLAUDE.md`는 같은 내용으로 유지한다.

## 작업과 응답

- 응답·문서·commit 메시지는 짧고 자연스러운 한국어로 쓴다. Git, PR 같은 기술 용어는 그대로 쓰고 숫자와 단위는 붙인다. 예: `5분`, `3개`.
- 요청한 결과에 필요한 구현·수정·검증까지 진행한다. 이미 허용된 로컬 작업과 일상적인 구현 선택은 별도 승인 없이 처리한다. 답에 따라 결과나 권한 범위가 크게 달라질 때만 질문한다.
- 작업에 필요한 파일과 문서만 읽는다. 계획·진행 설명은 작업 규모에 맞춘다. 모든 가정의 사전 보고나 작은 수정마다 별도 문서 작성을 요구하지 않는다.
- 사용자 변경과 데이터를 보호한다. 비밀 키와 환경별 설정값을 코드에 넣지 않는다.
- 작업 기준은 `origin/main`이다. 사용자가 요청하지 않은 amend·강제 push·PR merge·외부 게시는 하지 않는다.

## 프로젝트 정보

SvelteKit 2·Svelte 5·Vite 8·`@sveltejs/adapter-static`을 사용한다. JavaScript 중심이며 일부 TypeScript가 있다. 패키지는 npm과 `package-lock.json`으로 관리한다. `main`은 GitHub Actions를 통해 GitHub Pages에 배포된다.

- 공개 route: `/`, `/team-maker`, `/qr-code`, `/marble-race`. 도구 route에는 마지막 슬래시가 없다.
- 도구 build 결과: `build/team-maker.html`, `build/qr-code.html`, `build/marble-race.html`.
- Team Maker 정적 자산: `/images/team-maker/`.
- 참가자 데이터는 브라우저 `localStorage`에만 저장한다. 서버·로그인·비밀 키를 추가하지 않는다.
- 글꼴은 `src/lib/styles/fonts.css`에서 로컬 파일로 제공한다. 외부 글꼴 CDN 없이 Team Maker의 작은 글꼴 우선 로딩을 유지한다.
- `build/`, `.svelte-kit/`, `node_modules/`, `output/`은 생성 결과다. source처럼 직접 관리하지 않는다.

## 작업별 참고 위치

| 작업                    | 참고 위치와 주의점                                                                                                                   |
| ----------------------- | ------------------------------------------------------------------------------------------------------------------------------------ |
| route·build 변경        | `src/routes/`, `scripts/verify_team_maker_build.js`, 관련 REQ·ADR·README의 경로 설명도 맞춘다.                                       |
| Team Maker 변경         | [README의 수정 위치](README.md#team-maker-수정-위치). 아래의 현재 구조 의존성을 확인한다.                                            |
| 공통 UI·스타일 변경     | [컴포넌트와 스타일 기준](docs/frontend-ui.md)의 해당 부분. 토큰은 `src/lib/styles/tokens.css`다.                                     |
| 요구사항·화면 설계 변경 | `docs/requirements/`, `docs/design/`. [설계 문서 관리](README.md#설계-문서-관리)에 연결 형식과 승인 상태를 설명한다.                 |
| 중요한 결정 변경        | `docs/adr/`. 과거 ADR은 보존하고 새 결정으로 변경 이유를 남긴다.                                                                     |
| favicon·OG 이미지 변경  | `static/favicon.svg`, `scripts/generate_site_assets.js` 수정 후 `npm run generate:assets`. 출처는 `THIRD_PARTY_NOTICES.md`를 따른다. |

Team Maker는 `app.js`가 기능을 연결하고 JavaScript가 `pageRoot` 안의 요소를 찾아 내용을 채운다. 현재 기능들은 `getState()`가 반환한 같은 객체를 보관한다. DOM 구조·선택자·렌더링 시점·상태 객체를 바꾸려면 이 의존성을 함께 수정해야 한다. 화면 종료 시 이벤트·예약 작업·dialog·효과음을 해제하는 동작도 유지한다. 단순 화면 수정에서 전체 구조를 다시 설계할 필요는 없다.

## 검증

변경이 영향을 주는 검사를 선택한다. 통과한 검사는 추가 변경·실패·해결되지 않은 우려가 있을 때만 다시 실행하거나 범위를 넓힌다. 실패를 숨기거나 검사 결과를 덮어쓰지 말고, 실행 결과와 미확인 사항을 구분해 보고한다.

| 변경                | 검증                                                                                                            |
| ------------------- | --------------------------------------------------------------------------------------------------------------- |
| 문서                | 변경 파일 포맷·링크와 `git diff --check`                                                                        |
| 기능 로직           | `node --test tests/해당기능/관련파일.test.js`. 공통 로직·의존성 변경은 영향에 맞게 범위를 넓힌다.               |
| Svelte·스타일       | `npm run check`, UI 규칙 검사, 변경한 동작·배치의 브라우저 확인. 접근성·모바일·긴 문구 등 관련 조건을 확인한다. |
| UI 검사기·hook      | `npm run test:ui`                                                                                               |
| workflow·build 설정 | 문법·이벤트 조건, 필요한 build와 정적 결과 검사                                                                 |
| 요구사항·화면 연결  | 해당 REQ validator. UI 연결은 `python3 scripts/verify_ui_design.py docs/requirements docs/design --all`         |
| 설계 validator      | `python3 -m unittest discover -s tests/design -p 'test_*.py'`                                                   |

UI hook이 변경 내용을 검사했다면 같은 내용의 수동 검사를 반복하지 않는다. hook이 없거나 검사 범위가 불확실하면 관련 수정 묶음을 마친 뒤 `npm run check:ui -- 수정파일`로 확인한다. 경고는 작업 완료 전 해결하고, 수정 순서는 작업 의존성에 맞춘다. hook 설정 파일만으로 실제 활성화를 단정하지 않는다.

브라우저 자동 검사는 현재 코드의 build가 없으면 `npm run test:e2e:team-maker -- tests/team-maker-e2e/관련파일.spec.js`, 이미 있으면 `npm run test:e2e:built -- tests/team-maker-e2e/관련파일.spec.js`를 사용한다. 첫 명령은 build를 포함하므로 두 명령을 연달아 실행해 중복 build하지 않는다.

전체 검사 명령과 PR·배포 workflow의 범위는 [README](README.md#검사와-build)를 참고한다. 로컬에서 전체 CI 검사를 의무적으로 반복하지 않는다.
