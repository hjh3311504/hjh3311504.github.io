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

Team Maker 화면은 `src/routes/team-maker/+page.svelte`에 있습니다. 화면 동작은 `src/lib/team-maker/`에서 기능별로 관리하며 SvelteKit이 함께 build합니다.

## Team Maker 수정 위치

아래 JavaScript 파일은 모두 `src/lib/team-maker/` 안에 있습니다.

| 수정할 내용                                            | 파일              |
| ------------------------------------------------------ | ----------------- |
| 초기 상태, 기능 연결, 저장 후 전체 갱신, 화면 종료     | `app.js`          |
| 저장 데이터 정리, 복원과 저장 오류                     | `storage.js`      |
| 참가자 입력·삭제, 배정 규칙, 팀 수 설정                | `participants.js` |
| 팀 생성·결과 표시, 결과 복사                           | `results.js`      |
| 명단 저장·불러오기·삭제                                | `rosters.js`      |
| 순위 기록·취소, 기록 삭제, 당첨 기록 반영, 참가자 통계 | `history.js`      |
| 돌림판, 당첨자 추가·삭제, 축하 효과                    | `wheel.js`        |
| 효과음 생성·중지, 소리 설정                            | `audio.js`        |
| dialog 열기·닫기, 확인창, 스크롤 잠금                  | `dialogs.js`      |
| 화면 없이 실행하는 팀 배정·순위·통계 계산              | `core.js`         |
| 동적 버튼과 화면 이동 효과                             | `ui.js`           |
| 이벤트·타이머·화면 갱신 예약 해제                      | `lifecycle.js`    |
| ID 생성과 작은 값 변환 함수                            | `utils.js`        |

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

기존 적용 순서를 보존하기 위해 일부 기능은 보완 파일로 나누었습니다. 진입점의 import 순서를 임의로 바꾸지 마세요. 여러 기능에 걸친 공통 규칙은 `common*.css`에서 관리합니다. build 검증은 이 폴더의 JavaScript와 CSS를 모두 검사합니다.

## 검사와 build

```shell
npm run check
npm test
npm run test:e2e:team-maker
npm run build
npm run verify:team-maker
```

`npm test`는 팀 분배·배정 규칙, 저장 데이터 복원과 실패 처리, 이벤트·예약 작업 해제를 검사합니다. `npm run test:e2e:team-maker`는 production build를 만든 뒤 Chromium에서 참가자 편집, 명단 저장, 승패 기록, 추첨, 새로고침, route 재진입, 예약 삭제 취소, 모바일과 키보드 흐름을 검사합니다. 처음 실행할 때 Chromium이 없다면 `npx playwright install chromium`을 먼저 실행하세요. `npm run verify:team-maker`는 root 페이지, SvelteKit이 생성한 Team Maker route와 bundle, 상대 자원 경로, 제품 코드의 외부 HTTP 자원 사용 여부를 검사합니다.

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
