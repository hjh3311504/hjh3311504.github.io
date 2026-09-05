# hjh3311504.github.io — agent 작업 지침

이 파일은 Codex, Claude Code와 기타 coding agent가 이 저장소에서 작업할 때 따르는 기본 지침이다.

## 응답 규칙

- 모든 응답, 문서, commit 메시지는 자연스러운 한국어로 작성한다.
- Git, PR, branch 같은 기술 용어는 영어 그대로 쓴다.
- 주니어 개발자가 바로 이해할 수 있는 짧은 문장을 사용한다.
- 숫자와 단위는 붙여 쓴다. 예: `5분`, `3개`.

## 기술 스택

- 언어: JavaScript 중심이며 일부 TypeScript를 사용한다.
- 프레임워크: SvelteKit 2, Svelte 5.
- build: Vite 8과 `@sveltejs/adapter-static`.
- 패키지: npm과 `package-lock.json`.
- 스타일: 공통 화면은 SCSS, Team Maker는 전용 CSS를 사용한다.
- 단위 테스트: Node.js test runner — `npm test`.
- 브라우저 테스트: Playwright — `npm run test:e2e:team-maker`.
- 정적 검사: Svelte Check — `npm run check`.
- lint와 포맷 검사: ESLint와 Prettier — `npm run lint`.
- 배포: GitHub Actions가 `main` branch를 GitHub Pages에 배포한다.

## 디렉터리 구조

| 경로                  | 역할                                |
| --------------------- | ----------------------------------- |
| `src/routes/`         | SvelteKit page와 endpoint           |
| `src/lib/components/` | 공용 Svelte component               |
| `src/lib/team-maker/` | Team Maker 화면 동작과 팀 배정 core |
| `src/lib/scss/`       | 공통 style과 theme                  |
| `static/`             | build에 그대로 포함할 정적 파일     |
| `tests/`              | 단위 테스트와 Playwright E2E 테스트 |
| `docs/requirements/`  | 요구사항 SSOT                       |
| `docs/adr/`           | 주요 기술·제품 결정 기록            |
| `docs/design/`        | 현재 UI 설계 문서와 동결 자료       |
| `scripts/`            | build 결과와 문서를 검증하는 script |
| `.github/workflows/`  | 검사와 GitHub Pages 배포 workflow   |

SSOT는 한 정보의 기준이 되는 단일 문서나 파일을 뜻한다.

## 핵심 규칙

1. 공개 route는 `/`와 `/team-maker`다. Team Maker route는 마지막 슬래시를 사용하지 않는다.
2. Team Maker 정적 build 결과는 `build/team-maker.html`이다.
3. Team Maker 정적 자산은 `/images/team-maker/` 경로를 사용한다.
4. route와 build 형태를 바꾸면 관련 REQ, ADR, README와 검증 script를 함께 갱신한다.
5. `docs/design/packages/**`의 승인 snapshot과 handoff는 새 승인 없이 수정하지 않는다.
6. 과거 ADR과 Claude Design 요청문은 역사 자료다. 현재 값으로 조용히 고치지 않는다.
7. 참가자 데이터는 브라우저 `localStorage`에만 저장한다. 서버, 로그인, 비밀 키를 추가하지 않는다.
8. `build/`, `.svelte-kit/`, `node_modules/`, `output/`은 생성 결과다. source처럼 직접 관리하지 않는다.
9. `AGENTS.md`와 `CLAUDE.md`는 같은 내용을 유지한다. 한 파일을 바꾸면 다른 파일도 함께 바꾼다.

## 작업 규율

- 지시는 메모리가 아닌 문서에 남긴다. 반복해서 지켜야 할 규칙은 AGENTS.md, README, REQ, ADR 중 알맞은 곳에 기록한다.
- 구현 전에 가정을 밝힌다. 해석에 따라 결과가 크게 달라지면 사용자에게 묻는다.
- 여러 단계 작업은 먼저 짧은 계획과 검증 방법을 정리한다.
- 증상을 숨기지 말고 원인을 찾아 고친다.
- 비밀 키와 환경별 설정값을 코드에 넣지 않는다. 필요한 키 목록만 `.env.example`에 남긴다.
- 함수나 화면 동작을 바꾸면 호출처, 테스트, 문서와 build 검증에 미치는 영향을 함께 확인한다.
- 실패한 검사를 건너뛰거나 결과 파일을 손으로 덮어써서 통과시키지 않는다.
- 사용자 변경과 관계없는 파일은 되돌리거나 정리하지 않는다.
- UI를 브라우저로 검증할 때는 접근성 snapshot을 먼저 확인한다. 픽셀 결과가 중요할 때만 screenshot을 사용한다.

## 검증

변경 범위에 맞는 명령만 실행한다. PR 전에는 아래 검사를 모두 실행한다.

```shell
npm run lint
npm run check
npm test
npm run build
npm run verify:team-maker
```

화면 동작을 바꿨다면 Playwright 검사도 실행한다.

```shell
npm run test:e2e:team-maker
```

문서만 바꿔도 `git diff --check`를 실행한다. 요구사항을 바꾸면 해당 REQ validator도 실행한다.

## Git과 PR

- 작업 기준 branch는 `origin/main`이다.
- 하나의 commit에는 서로 관련된 변경만 담는다.
- commit 전에 `git diff`로 변경 범위와 생성 파일을 확인한다.
- 사용자가 요청하지 않으면 기존 변경을 amend하거나 강제로 push하지 않는다.
- 사용자가 요청하지 않으면 PR을 merge하지 않는다.
