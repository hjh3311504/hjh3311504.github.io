# hjh3311504.github.io

SvelteKit으로 만든 root 사이트와 Team Maker를 한 저장소에서 관리합니다.

## 로컬 실행

Node.js와 npm을 설치한 뒤 아래 명령을 실행하세요.

```shell
npm install
npm run dev
```

- root 사이트: `http://localhost:5173/`
- Team Maker: `http://localhost:5173/team-maker/`

Team Maker 화면은 `src/routes/team-maker/+page.svelte`에 있습니다. 화면 동작과 팀 배정 로직은 각각 `src/lib/team-maker/app.js`와 `src/lib/team-maker/core.js`에서 관리하며 SvelteKit이 함께 build합니다.

## 검사와 build

```shell
npm run check
npm test
npm run test:e2e:team-maker
npm run build
npm run verify:team-maker
```

`npm test`는 팀 분배와 배정 규칙을 검사합니다. `npm run test:e2e:team-maker`는 production build를 만든 뒤 Chromium에서 참가자 편집, 명단 저장, 승패 기록, 추첨, 새로고침, 모바일과 키보드 흐름을 검사합니다. 처음 실행할 때 Chromium이 없다면 `npx playwright install chromium`을 먼저 실행하세요. `npm run verify:team-maker`는 root 페이지, SvelteKit이 생성한 Team Maker route와 bundle, 상대 자원 경로, 제품 코드의 외부 HTTP 자원 사용 여부를 검사합니다.

## 배포

`main` branch에 push하면 `.github/workflows/pages.yml`이 다음 작업을 실행합니다.

1. SvelteKit 검사와 Team Maker 단위 테스트
2. root 사이트와 Team Maker build 및 브라우저 E2E 테스트
3. GitHub Pages artifact 업로드와 배포
4. 공개 root 주소와 `/team-maker/` 주소 확인

GitHub 저장소의 **Settings → Pages → Build and deployment → Source**는 **GitHub Actions**로 설정해야 합니다.

## Team Maker 데이터

참가자, 설정, 저장 명단과 승패 기록은 현재 브라우저의 `localStorage`에만 저장됩니다. 생성된 팀 결과는 새로고침 뒤 복구하지 않습니다. 제품 코드는 참가자 데이터를 외부 서버로 보내지 않습니다.

## 광고를 나중에 추가할 때

실제 광고는 현재 범위에 없습니다. 광고를 추가하려면 디자인 승인을 다시 받은 뒤 `src/routes/team-maker/+page.svelte`의 `AD_SLOT_TOP` 주석 위치에 코드를 넣으세요.

사이트 등록은 이 GitHub Pages root 도메인을 기준으로 진행하세요. `ads.txt`가 필요하면 `static/ads.txt`에 추가하세요. 이 파일은 `/ads.txt`로 배포되므로 Team Maker만이 아니라 root 사이트 전체에 영향을 줍니다.
