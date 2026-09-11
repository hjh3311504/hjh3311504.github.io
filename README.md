# hjh3311504.github.io

SvelteKit으로 만든 root 사이트, Team Maker와 QR 코드 도구를 한 저장소에서 관리합니다.

## 공통 화면과 정적 자산

홈은 `src/routes/+page.svelte`, 공통 오류 안내는 `src/lib/components/organisms/ErrorPage.svelte`에서 관리합니다. 정적 404와 SvelteKit 오류 화면이 같은 안내를 사용합니다. 공통 기본 CSS와 글꼴 선언은 `src/lib/styles/`에 있습니다. 글꼴은 사이트 안의 SUIT·SUITE 파일로 제공하며 외부 CDN에 요청하지 않습니다. Team Maker는 작은 글꼴을 먼저 받고 이름을 입력할 때 전체 글꼴로 보완합니다.

홈과 Team Maker 공유 이미지는 1200×630 PNG입니다. `scripts/generate_site_assets.js`의 문구와 카드 배치를 수정한 뒤 아래 명령을 실행하세요. 생성에는 Playwright Chromium이 필요합니다. `static/favicon.svg`를 수정해도 같은 명령으로 PNG·ICO를 다시 만듭니다.

```shell
npx playwright install chromium
npm run generate:assets
```

홈 이미지는 `static/images/site-open-graph-1200x630.png`, Team Maker 이미지는 `static/images/team-maker-open-graph-1200x630.png`입니다. 공개 이미지 파일은 배포에 필요하므로 원본 코드와 함께 commit합니다. Team Maker 이미지에는 가상 참가자 6명만 사용합니다. 공유 서비스에 이전 이미지가 남으면 배포 후 해당 서비스에서 링크 미리보기 캐시를 갱신하세요.

## 라이선스

배포 라이선스의 원본 경로는 설치된 파일명의 대소문자까지 일치시켜야 합니다. `npm test`의 라이선스 경로 검사가 macOS에서도 Linux 배포 환경의 대소문자 오류를 잡습니다.

현재 자체 코드는 [MIT](./LICENSE)를 따릅니다. 저작권자는 Lake (hjh3311504)입니다. 템플릿 정리 후 홈·공통 UI를 원본과 대조한 [적용 근거](./docs/adr/2026-09-11-현재-자체-코드에-MIT-적용.md)를 기록했습니다.

글꼴, 외부 아이콘, 기존 Team Maker 이미지와 보존용 설계 자료는 자체 코드의 MIT 범위와 구분합니다. SUIT·SUITE는 OFL 1.1, 홈 GitHub 아이콘은 Bootstrap Icons의 MIT 고지를 유지합니다. 기존 Team Maker 이미지와 보존용 설계 자료에는 이번 MIT를 적용하지 않습니다. 정확한 경로와 조건은 [출처·라이선스 목록](./THIRD_PARTY_NOTICES.md)을 확인하세요. build의 `/licenses/`에는 자체 MIT와 외부 글꼴·아이콘·실행 의존성의 원문을 함께 포함합니다.

이 저장소가 시작된 Matheus Fantinel의 SvelteKit Static Blog Template과 과거 commit의 GPLv3 조건은 변경하지 않습니다.

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

| 파일 이름                 | 역할                       |
| ------------------------- | -------------------------- |
| `base.css`, `common*.css` | 테마·공통 요소·반응형 화면 |
| `participants*.css`       | 참가자·규칙·팀 수 설정     |
| `results*.css`            | 팀 결과와 누적 당첨자      |
| `history*.css`            | 오늘 기록·전체 기록·통계   |
| `dialogs*.css`            | dialog와 명단·확인창       |
| `wheel*.css`              | 돌림판·축하 효과           |
| `content.css`             | 검색 안내와 FAQ            |

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

홈, Team Maker와 오류 화면에서 광고 스크립트를 실행하지 않습니다. 실제 광고는 현재 범위에 없습니다. 광고를 추가하려면 디자인 승인을 다시 받은 뒤 `src/routes/team-maker/+page.svelte`의 `AD_SLOT_TOP` 주석 위치에 코드를 넣으세요.

사이트 등록은 이 GitHub Pages root 도메인을 기준으로 진행하세요. `ads.txt`가 필요하면 `static/ads.txt`에 추가하세요. 이 파일은 `/ads.txt`로 배포되므로 Team Maker만이 아니라 root 사이트 전체에 영향을 줍니다.

## 애드센스 재심사 준비

홈 footer와 Team Maker 안내 마지막은 개인정보처리방침 모달을 엽니다.

- 개인정보 처리 방식을 바꾸면 홈의 방침과 적용일, `REQ-WEB-027`을 함께 갱신하세요. 광고 도입 전 실제 데이터 처리와 필요한 동의 절차도 반영하세요.
- 소유권 확인에는 기존 `/ads.txt`를 사용할 수 있습니다. `pub-3102141816876720`이 실제 애드센스 계정의 게시자 ID인지 확인하세요. 파일 공개와 계정의 확인 완료는 별개입니다.
- 정적 404는 `noindex`이며 홈 canonical을 포함하지 않습니다. GitHub Pages의 `/404` 직접 요청은 HTTP 200일 수 있으므로 배포 후 존재하지 않는 주소의 HTTP 404도 확인하세요.
- 재심사 전에 배포본의 안내·개인정보처리방침 링크·오류 화면 광고 제외와 애드센스의 실제 반려 문구·소유권 확인 상태를 대조하세요. Google Search Console에서는 정상 URL의 수집 상태를 확인하세요.

## QR 코드 만들기

공개 주소는 `/qr-code`, 로컬 주소는 `http://localhost:5173/qr-code`입니다. 정적 결과는 `build/qr-code.html`입니다. 홈·공통 메뉴·sitemap에서 연결합니다.

- 화면과 안내: `src/routes/qr-code/+page.svelte`
- 스타일: `src/routes/qr-code/qr-code.css`
- QR 생성·입력 검증·북마크 복원: `src/lib/qr-code/qr.js`
- 입력 후 자동 생성하며 제목을 포함한 PNG·SVG 저장·이미지 복사·인쇄·확대를 제공합니다.
- 내용은 UTF-8 1,800바이트, 제목은 공백을 포함해 보이는 글자 단위로 10자까지 받습니다. 이모지·결합 문자를 나누지 않으며 한글 조합 입력을 보존합니다. PNG는 너비 1,024px이고 제목에 따라 높이가 늘어납니다.
- QR은 외부 API 없이 브라우저에서 생성합니다. 북마크만 `lake.qr-code.bookmarks.v1`에 최대 30개 저장합니다. 마지막 삭제 1건을 취소할 수 있습니다.
- 웹페이지 주소는 한 줄로 입력합니다. 긴 주소는 자동으로 자르지 않고 전체 UTF-8 용량을 검사하며 1,800바이트를 넘으면 생성을 막습니다. 줄바꿈이 포함된 붙여넣기·드롭은 기존 입력을 유지한 채 거절하고 오류를 표시합니다. 주소를 수정하거나 한 줄 주소·북마크를 다시 입력하면 오류를 해제하고 재검사합니다. 여러 줄 텍스트는 지원하지 않으며 줄바꿈이 포함된 북마크는 복원하지 않습니다.
- 브라우저의 이미지 복사 지원이나 권한이 없으면 PNG 저장을 안내합니다.
- 사용법·FAQ·개인정보 안내를 정적 HTML에 포함합니다. QR 페이지에도 광고 코드는 넣지 않습니다.
- QR 작업 영역 아래의 별도 개인정보 안내 줄은 표시하지 않습니다. 사용법은 3단계, FAQ는 유효기간·주소 변경, 파일 형식, 스캔 문제, 북마크의 4개로 간략하게 안내합니다.
- `npm test`는 QR 입력 용량·북마크 복원·다운로드 파일 이름, SUIT 700 제목 윤곽선, SVG 독립 렌더링과 QR 해독도 검사합니다.
- `npm run verify:team-maker`는 QR 정적 페이지·검색 정보·sitemap과 광고 미실행도 검사합니다.

### QR 제목 글꼴과 SVG

QR과 Team Maker의 번호가 있는 섹션 제목은 `SectionHeader`의 `step` 속성으로 번호 배지를 표시합니다. 배지와 제목 스타일은 공통 `ui.css`에서 관리합니다. QR 미리보기 배경·캡션·빈 상태는 화면 테마를 따릅니다. 스캔용 QR 사각형과 저장·인쇄 이미지는 흰 바탕과 검정 무늬를 유지합니다. 북마크 X 버튼의 오른쪽 여백은 8px입니다.

한글 조합 중인 마지막 글자도 미리보기에 즉시 표시합니다. 조합 중에는 입력창 값을 그대로 유지하고 조합이 끝나면 10자 제한을 적용합니다. 미리보기와 저장에 사용하는 제목은 조합 중에도 최대 10자입니다.

미리보기 아래 버튼은 `PNG·SVG 저장 → 이미지 복사·크게 보기 → 북마크에 저장·인쇄` 순서로 2개씩 3줄에 배치합니다. SVG 저장은 보라색입니다. QR과 Team Maker의 제목·설명은 `ToolPageHeader`, 운영자·개인정보처리방침은 `ToolPageFooter`를 함께 사용합니다. QR 북마크의 `RemoveRowButton`은 Team Maker 참가자 삭제와 같은 X 아이콘과 공통 `ui.css` 스타일을 사용합니다.

미리보기·PNG·SVG 제목은 모두 로컬 SUIT 700을 사용합니다. 미리보기 캡션은 선택·복사할 수 있는 일반 HTML 텍스트입니다. 제목은 1줄이며 기본 글자 크기는 데스크톱 22px, 모바일 20px입니다. 입력값을 즉시 표시하고 좁은 화면에서만 넘치지 않도록 글자를 줄입니다. PNG·SVG는 같은 윤곽선과 배치를 공유합니다. SUIT에 없는 이모지 등의 글자만 미리보기와 PNG에서 시스템 글꼴로 표시하고 SVG 저장은 제한합니다. 로딩 실패 때는 SVG 다시 시도를 제공합니다.

주소를 수정하면 200ms 뒤 QR 무늬를 갱신하고, 제목을 수정하면 제목의 지원 여부와 배치만 갱신합니다. 최종 이미지는 PNG·SVG 저장 버튼을 눌렀을 때 해당 형식만 만듭니다. 복사는 클릭 시, 인쇄는 설정 창의 인쇄하기 클릭 시 PNG를 만들고 크게 보기는 미리보기를 재사용합니다. 출력 도중 입력이 바뀌어도 파일과 이름은 클릭 당시 내용을 유지합니다.

미리보기 QR은 최대 280px입니다. 캡션 영역은 데스크톱 48px·모바일 44px이며 짧거나 빈 제목에도 같은 높이를 유지합니다. 제목은 가로·세로 가운데에 배치합니다. 빈 상태에서는 위쪽 정사각형에 SVG 아이콘만, 아래쪽 캡션에 ‘QR 코드가 여기에 나타납니다’만 각각 가운데 표시합니다. 주소 입력 요청 문구와 60자 측정용 문단은 제거했습니다. 데스크톱에서는 입력·북마크 열과 미리보기 카드의 높이를 맞춥니다. 북마크 목록은 남은 공간에서 스크롤하며 모바일에서는 세로로 배치합니다. 입력 하단 안내·입력 지우기·상시 상태 문구·북마크 저장 위치 배지는 표시하지 않습니다. `qr-feedback`의 고정 공간도 없으며 저장·복사 실패와 SVG 안내를 필요한 경우에만 작업 버튼 아래에 표시합니다. 오류가 나타나면 카드 높이가 늘어날 수 있습니다. 처리 중인 버튼에는 `aria-busy`를 적용합니다.

저장·복사·인쇄 출력은 너비 1,024px, QR 영역 768px, 위쪽 여백 32px입니다. 제목은 64px·최대 너비 896px의 1줄이며 QR 아래 32px를 띄운 높이 88px 영역의 정가운데에 배치합니다. PNG·SVG는 글자의 실제 윤곽선 경계로 위치를 계산하며 미지원 글자의 PNG도 실제 글자 경계로 가운데 맞춥니다. 제목이 있으면 파일 높이는 952px입니다. 제목이 없으면 높이는 832px입니다.

인쇄 버튼은 공용 Dialog로 배열 선택 창을 엽니다. A4 세로 1장에 현재 QR과 제목을 1열×1행(기본 1개), 3열×4행(12개), 5열×6행(30개)으로 반복합니다. 선택은 페이지를 떠나기 전까지 유지합니다. 설정을 열거나 배열을 바꿀 때는 이미지를 생성하지 않습니다. `인쇄하기`를 누른 순간의 내용을 PNG로 한 번 생성하고 모든 칸에서 재사용합니다. 준비 실패는 선택 창에서 알리며 취소한 작업이 나중에 인쇄 창을 열지 않도록 처리합니다.

인쇄 여백은 10mm, 칸 간격은 4mm, 영역은 190mm×276mm입니다. 각 인쇄 칸 전체에는 검정 실선 0.2mm와 내부 여백 2mm를 적용합니다. 테두리와 여백은 칸 크기에 포함하며 다운로드 파일에는 테두리가 없습니다. 이미지는 비율을 유지해 칸 가운데 맞추며 1개 인쇄의 최대 너비는 140mm입니다. PDF 검증은 A4·배율 100%·머리글/바닥글 없음으로 실행합니다. 실제 프린터의 용지와 배율은 브라우저 인쇄 창에서 조정하세요.

`fontkit`의 WOFF2 가변 글꼴 오류를 피하기 위해 Vite 설정에서 `scripts/prepare_qr_font.js`를 실행합니다. 기존 SUIT WOFF2를 `.svelte-kit/qr-font/SUIT-Variable.ttf`로 풀며 글꼴 내용은 바꾸지 않습니다. 이 생성 파일은 Git에 추가하지 않습니다. 개발 서버와 build에서 자동 생성합니다. 글꼴 원본을 바꾸면 개발 서버를 다시 시작하세요.

`src/lib/qr-code/title.js`는 제목 준비·지원 검사, `title-input.js`는 10자 입력·복원 검증, `title-layout.js`는 한 줄 제목 상태, `image-layout.js`는 출력 크기·좌표, `title-outline.js`는 SUIT 윤곽선, `font-loader.js`는 지연 로딩·캐시·재시도를 담당합니다. `QrPreview.svelte`는 QR 경로와 제목 문자열을 따로 받습니다. `createQrImage(qrPath, preparedTitle, format)`은 준비된 상태로 선택한 형식의 Blob만 반환하며 QR을 다시 계산하지 않습니다. QR 안내와 Team Maker 하단 안내의 접기·펼치기 디자인은 공통 `ui.css`에서 관리합니다. 기본 마커를 숨기고 CSS 삼각형과 제목을 세로 가운데 맞추며 간격은 12px입니다.
