# hjh3311504.github.io

SvelteKit으로 만든 root 사이트와 Team Maker를 한 저장소에서 관리합니다.

[Team Maker 바로 사용하기](https://hjh3311504.github.io/team-maker) — 이름을 입력하면 참가자를 고르게 나누는 무료 온라인 팀짜기·조짜기 프로그램입니다. 같은 팀·다른 팀 규칙, 명단 저장, 승패 기록과 무작위 추첨을 지원합니다.

## 로컬 실행

Node.js와 npm을 설치한 뒤 아래 명령을 실행하세요.

```shell
npm install
npm run dev
```

- root 사이트: `http://localhost:5173/`
- Team Maker: `http://localhost:5173/team-maker`

Team Maker의 전체 배치는 `src/routes/team-maker/+page.svelte`에 있습니다. 기능별 화면은 `src/lib/team-maker/components/`, 화면 동작은 `src/lib/team-maker/`에서 관리하며 SvelteKit이 함께 build합니다.

## Team Maker 수정 위치

### 화면 수정 위치

`src/routes/team-maker/+page.svelte`는 검색 메타 정보, 구조화 데이터, 안내·FAQ, 전체 배치, 저장 실패 안내와 `mountTeamMaker(pageRoot)` 연결을 담당합니다.

아래 Svelte component는 모두 `src/lib/team-maker/components/` 안에 있습니다. 동작 파일은 `src/lib/team-maker/`를 기준으로 적었습니다.

| 수정할 화면                          | Component                     | 동작 파일                       |
| ------------------------------------ | ----------------------------- | ------------------------------- |
| 참가자 입력·명단·배정 규칙 목록      | `ParticipantsSection.svelte`  | `participants.js`               |
| 나누는 방식·인원 설정·팀 만들기 버튼 | `TeamSettingsSection.svelte`  | `participants.js`, `results.js` |
| 팀 결과·팀 이름 수정·누적 당첨자     | `TeamResultsSection.svelte`   | `results.js`, `history.js`      |
| 오늘 기록·기록 관련 버튼             | `TodayHistorySection.svelte`  | `history.js`                    |
| 참가자 일괄 추가                     | `BulkAddDialog.svelte`        | `participants.js`               |
| 같은 팀·다른 팀 규칙 지정            | `AssignmentRuleDialog.svelte` | `participants.js`               |
| 명단 저장·불러오기                   | `RostersDialog.svelte`        | `rosters.js`                    |
| 추첨·효과음 버튼·당첨자              | `WheelDialog.svelte`          | `wheel.js`, `audio.js`          |
| 전체 기록·전체 통계                  | `HistoryDialog.svelte`        | `history.js`                    |
| 참가자 통계                          | `PlayerStatsDialog.svelte`    | `history.js`                    |
| 삭제 등 확인창                       | `ConfirmDialog.svelte`        | `dialogs.js`                    |

화면 component는 기존 HTML 계층, ID, class, data·접근성 속성을 유지합니다. 추가 wrapper 없이 같은 위치에 렌더링하며, JavaScript가 내용을 채우는 목록·표·팀 카드·돌림판 컨테이너는 비워 둡니다. 상태와 이벤트는 기존 JavaScript에서 처리합니다. `TeamResultsSection`의 `assetsBase` prop은 결과 안내 이미지의 경로만 전달합니다.

### 동작 수정 위치

아래 JavaScript 파일은 모두 `src/lib/team-maker/` 안에 있습니다.

| 수정할 내용                                         | 파일              |
| --------------------------------------------------- | ----------------- |
| 초기 상태, 기능 연결, 저장 후 전체 갱신, 화면 종료  | `app.js`          |
| 저장 데이터 정리, 복원과 저장 오류                  | `storage.js`      |
| 참가자 입력·삭제, 배정 규칙, 팀 수 설정             | `participants.js` |
| 팀 생성·결과 표시, 팀 이름 수정, 결과 복사          | `results.js`      |
| 명단 저장·불러오기·삭제                             | `rosters.js`      |
| 순위 기록·취소, 팀 이름·당첨 기록 반영, 참가자 통계 | `history.js`      |
| 돌림판, 당첨자 추가·삭제, 축하 효과                 | `wheel.js`        |
| 효과음 생성·중지, 소리 설정                         | `audio.js`        |
| dialog 열기·닫기, 확인창, 스크롤 잠금               | `dialogs.js`      |
| 화면 없이 실행하는 팀 배정·순위·통계 계산           | `core.js`         |
| 동적 버튼과 화면 이동 효과                          | `ui.js`           |
| 이벤트·타이머·화면 갱신 예약 해제                   | `lifecycle.js`    |
| ID 생성과 작은 값 변환 함수                         | `utils.js`        |

### 기능 연결 규칙

- `app.js`가 각 기능을 만들고 필요한 상태 접근 함수와 동작 함수를 전달합니다. 기능 파일끼리 직접 import하지 않습니다. 공통 계산과 도우미 파일은 import할 수 있습니다.
- `getState()`는 현재 화면이 사용하는 같은 저장 상태 객체를 반환합니다. 각 기능은 필요한 필드를 갱신하며 객체 전체를 교체하지 않습니다. 실제 저장은 전달받은 `persist()`나 `saveAndRender()`로 요청합니다.
- 여러 기능이 함께 쓰는 임시 팀 결과와 순위는 `app.js`의 `runtime`에 둡니다. 한 기능만 쓰는 검색어, 선택 상태, 타이머와 효과음은 해당 기능 안에 둡니다.
- 모든 기능을 만든 뒤 `connect()`로 이벤트를 연결합니다. 연결 전에는 다른 기능의 동작을 호출하지 않습니다.
- 예약 작업과 이벤트는 기능마다 만든 `createLifetime()`을 통해 등록합니다. `destroy()`에서 예약 작업을 취소하고, dialog와 효과음처럼 별도 정리가 필요한 자원도 해제합니다. 비동기 작업을 기다린 뒤에는 `lifetime.active`로 화면이 아직 열려 있는지 확인합니다.
- `mountTeamMaker(root)`는 기존처럼 화면 종료 함수를 반환합니다. Svelte의 `onMount`가 이 함수를 받아 route를 떠날 때 실행합니다.

### 스타일 수정 위치

`src/routes/team-maker/team-maker.css`는 CSS를 불러오는 진입점입니다. 실제 규칙은 `src/lib/team-maker/styles/`에 있습니다.

| 파일 이름                 | 역할                            |
| ------------------------- | ------------------------------- |
| `base.css`, `common*.css` | 글꼴·테마·공통 요소·반응형 화면 |
| `participants*.css`       | 참가자·규칙·팀 수 설정          |
| `results*.css`            | 팀 결과와 누적 당첨자           |
| `history*.css`            | 오늘 기록·전체 기록·통계        |
| `dialogs*.css`            | dialog와 명단·확인창            |
| `wheel*.css`              | 돌림판·축하 효과                |
| `content.css`             | 검색 안내와 FAQ                 |

기존 적용 순서를 보존하기 위해 일부 기능은 보완 파일로 나누었습니다. 진입점의 import 순서를 임의로 바꾸지 마세요. 여러 기능에 걸친 공통 규칙은 `common*.css`에서 관리합니다. build 검증은 `src/lib/team-maker/` 아래의 JavaScript, Svelte와 CSS를 하위 폴더까지 모두 검사합니다.

## 설계 문서 관리

`docs/design/`에는 자료별 최신본만 둡니다. 번호별 package, snapshot과 manifest는 만들지 않습니다.

| 자료                   | 역할                             |
| ---------------------- | -------------------------------- |
| `ia.md`                | 현재 화면 구성과 이동 흐름       |
| `screens/`             | 현재 화면별 동작과 연결 요구사항 |
| `handoff/`             | 마지막으로 전달받은 시안과 자산  |
| `claude-design-DSN.md` | 마지막 Claude Design 요청 기록   |

현재 설계는 IA와 화면 문서에서 확인하고, 실제 동작은 코드와 브라우저에서 확인합니다. handoff와 마지막 요청문에는 과거 조건이 포함될 수 있습니다. 새 handoff를 받으면 기존 폴더 전체를 교체하세요. 파일을 덧붙여 이전 전달본의 파일을 남기지 마세요. 구현을 수정할 때마다 handoff를 다시 생성하지는 않습니다. 다음 Claude Design 요청은 같은 요청문 파일의 본문과 참조 경로를 검토해 갱신하세요.

UI 요구사항의 `design_ref`는 `docs/design/` 기준 화면 경로 목록입니다. 화면이 1개여도 `[screens/SCR-WEB-001.md]`처럼 적습니다. 공통 요구사항은 관련 화면을 모두 연결하고, 각 화면 문서의 `연결 REQ`에도 같은 요구사항을 적습니다. `design_status`는 기존처럼 `pending`, `approved`, `deferred`를 사용합니다. 승인 사실은 관련 commit이나 PR 설명에 명시하세요. commit 자체가 승인을 뜻하지는 않습니다.

설계 검사는 Python 3와 PyYAML이 필요합니다. PyYAML이 없다면 별도 Python 가상환경에 `python3 -m pip install pyyaml`로 설치하세요.

```shell
python3 scripts/verify_ui_design.py docs/requirements docs/design --all
python3 scripts/verify_ui_design.py docs/requirements docs/design --mode inventory
python3 scripts/verify_ui_design.py docs/requirements docs/design --requirement REQ-WEB-020
python3 -m unittest discover -s tests/design -p 'test_*.py'
```

전체 검사는 모든 UI 요구사항의 승인 상태와 문서 연결을 확인합니다. 목록 검사는 모든 UI 요구사항의 상태를 확인하고, 화면 검사는 승인된 항목의 연결 범위로 제한합니다. 승인된 항목과 무관한 작성 중 화면은 검사하지 않습니다. 승인된 항목이 없으면 설계 폴더가 없어도 목록 검사를 실행할 수 있습니다. 요구사항별 검사는 지정한 항목과 관련 화면의 연결을 확인합니다. 관계없는 항목의 미승인 상태는 실패 사유가 아닙니다. `--requirement`를 여러 번 지정할 수 있습니다. handoff와 manifest는 검사에 필요하지 않습니다.

과거 설계와 요청문은 Git 이력에서 확인하세요.

```shell
git log --oneline -- docs/design
git log --follow -- docs/design/claude-design-DSN.md
```

아래 명령의 `<commit>`을 확인할 commit hash로 바꾸세요. 삭제 전 자료는 정리 이전 commit과 당시 파일 경로를 사용합니다.

```shell
git show '<commit>:docs/design/screens/SCR-WEB-001.md'
git show '<commit>:docs/design/claude-design-DSN-009.md'
git show '<commit>:docs/design/packages/DSN-010/manifest.yaml'
```

이전 DSN 형식의 검증이 필요하면 해당 commit의 자료와 script를 함께 사용하세요. 최신 script의 package 지정 옵션은 제거했습니다. 과거 commit 자체는 삭제하지 않으므로 이번 정리는 현재 파일 목록을 줄이며 Git 전체 이력의 용량까지 줄이지는 않습니다.

## 검사와 build

```shell
npm run check
npm test
npm run test:e2e:team-maker
npm run build
npm run verify:team-maker
```

`npm test`는 CSS 진입점·중첩 폴더의 홀수 px 글자 크기 검사와 팀 분배·배정 규칙, 저장 데이터 복원과 실패 처리, 이벤트·예약 작업 해제를 검사합니다. `npm run test:e2e:team-maker`는 production build를 만든 뒤 Chromium에서 참가자 편집, 명단 저장, 승패 기록, 추첨, 새로고침, route 재진입, 예약 삭제 취소, 밝은·어두운 테마의 버튼 hover와 비활성 상태, 모바일과 키보드 흐름을 검사합니다. 처음 실행할 때 Chromium이 없다면 `npx playwright install chromium`을 먼저 실행하세요. `npm run verify:team-maker`는 root 페이지, SvelteKit이 생성한 Team Maker route와 bundle, 상대 자원 경로, 제품 코드의 외부 HTTP 자원 사용 여부를 검사합니다. 홀수 px 글자 크기는 CSS 진입점과 `src/lib/team-maker/styles/` 하위의 모든 CSS에서 검사하며, 위반한 파일 경로와 값을 표시합니다.

## 통계 이미지 처리

build 후 `scripts/optimize_images.js`가 PNG·JPEG 원본에서 WebP와 AVIF를 생성합니다. 참가자 통계의 `stat-win`, `stat-pick`, `stat-lose` 3개 아이콘은 production에서 생성된 WebP를 사용합니다. 개발 서버는 원본 PNG를 사용합니다.

최소 지원 브라우저 버전이 정해져 있지 않으므로 WebP 로드·해독 실패 시 PNG로 한 번만 대체합니다. 이미지와 당첨 아이콘의 CSS 마스크를 함께 전환하며 경로는 `assetUrl()`로 만듭니다. 원본 PNG와 기존 변환 품질 설정은 유지합니다. E2E 테스트는 WebP 요청, PNG 대체와 마스크 경로를 확인합니다.

## 배포

`main` branch에 push하면 `.github/workflows/pages.yml`이 다음 작업을 실행합니다.

1. SvelteKit 검사와 Team Maker 단위 테스트
2. root 사이트와 Team Maker build 및 브라우저 E2E 테스트
3. GitHub Pages artifact 업로드와 배포
4. 공개 root 주소와 `/team-maker` 주소 확인

GitHub 저장소의 **Settings → Pages → Build and deployment → Source**는 **GitHub Actions**로 설정해야 합니다.

## Team Maker 데이터

참가자, 설정, 저장 명단과 승패 기록은 현재 브라우저의 `localStorage`에만 저장됩니다. 생성된 팀 결과는 새로고침 뒤 복구하지 않습니다. 제품 코드는 참가자 데이터를 외부 서버로 보내지 않습니다.

## 광고를 나중에 추가할 때

실제 광고는 현재 범위에 없습니다. 광고를 추가하려면 디자인 승인을 다시 받은 뒤 `src/routes/team-maker/+page.svelte`의 `AD_SLOT_TOP` 주석 위치에 코드를 넣으세요.

사이트 등록은 이 GitHub Pages root 도메인을 기준으로 진행하세요. `ads.txt`가 필요하면 `static/ads.txt`에 추가하세요. 이 파일은 `/ads.txt`로 배포되므로 Team Maker만이 아니라 root 사이트 전체에 영향을 줍니다.
