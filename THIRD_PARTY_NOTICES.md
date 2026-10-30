# 출처와 라이선스

## 자체 코드: MIT

2026년 9월 11일 현재 자체 코드에 MIT를 적용합니다. 저작권자는 Lake (hjh3311504)입니다. [MIT 원문](https://github.com/hjh3311504/hjh3311504.github.io/blob/main/LICENSE)과 아래 적용 범위를 함께 확인하세요.

| 대상                                                                                                                                                  | 적용 조건                                                                                            |
| ----------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------- |
| `src/`의 자체 JavaScript·TypeScript·Svelte·CSS·HTML                                                                                                   | MIT. 아래 글꼴과 Bootstrap 아이콘은 각 저작권 고지를 따릅니다.                                       |
| `scripts/`, `tests/`, 자체 설정 파일과 일반 문서                                                                                                      | MIT. 보존용 설계 자료와 외부 라이선스 원문은 제외합니다.                                             |
| `static/favicon.svg`, `static/favicon.ico`, `static/favicons/`                                                                                        | 이번 작업에서 만든 Lake 아이콘과 설정으로, MIT를 적용합니다.                                         |
| `static/images/site-open-graph-1200x630.png`, `static/images/team-maker-open-graph-1200x630.png`, `static/images/marble-race-open-graph-1200x630.png` | 자체 생성 script로 만든 공유 이미지이며 MIT를 적용합니다.                                            |
| `src/lib/team-maker/fonts/`와 설계 전달본의 SUIT·SUITE 글꼴                                                                                           | SIL Open Font License 1.1                                                                            |
| 홈의 GitHub 아이콘                                                                                                                                    | Bootstrap Icons의 MIT와 원저작권 고지                                                                |
| `static/images/team-maker/`의 SVG                                                                                                                     | 2026-10-25에 직접 좌표를 정해 작성한 도형10개와 단순 도형의 `favicon.svg`에 MIT를 적용합니다.        |
| `static/images/aram-mayhem/`, `src/lib/aram-mayhem/guide-data.json`의 챔피언·증강·아이템 이름과 효과 문구                                             | Riot Games의 자산입니다. MIT 적용 범위에서 제외하며 아래 칼바람 아수라장 고지를 따릅니다.            |
| `docs/design/handoff/`, `docs/design/claude-design-DSN.md`                                                                                            | 보존용 설계 자료·요청문입니다. 이번 MIT 적용 범위에서 제외하며 포함된 외부 자료의 조건을 유지합니다. |
| npm 패키지와 외부 라이선스 원문                                                                                                                       | 각 저작권자의 라이선스를 유지합니다.                                                                 |

MIT 적용 제외는 해당 자료에 GPL을 새로 적용하거나 별도의 재사용 허락을 부여한다는 뜻이 아닙니다. 제외된 이미지·설계 자료를 따로 재사용하려면 해당 자료의 이용 조건을 확인하세요. 일반 문서에서 외부 자료를 인용한 부분에도 원저작자의 권리가 유지됩니다.

## Team Maker SVG

2026-10-25에 출처 기록이 없던 PNG10개를 직접 작성한 SVG로 교체했습니다. 대상은 `laurel-1.svg`·`laurel-2.svg`·`laurel-3.svg`, `confetti.svg`, `stat-days.svg`·`stat-games.svg`·`stat-people.svg`·`stat-win.svg`·`stat-pick.svg`·`stat-lose.svg`입니다. 외부 아이콘 path나 글꼴 윤곽선을 사용하지 않고 path·rect·circle·ellipse의 좌표를 직접 정했습니다. 기존 `favicon.svg`는 사각형과 T자 path의 단순 도형이라 유지했습니다.

SVG 원본 코드는 `static/images/team-maker/*.svg` 파일 자체에 있습니다. 정적 build에서는 변환 없이 `build/images/team-maker/*.svg`로 복사되며, 공개 경로는 `/images/team-maker/*.svg`입니다. HTML·CSS에서 이 파일을 이미지 또는 mask로 참조합니다. WebP·AVIF 변환 대상에는 포함하지 않습니다.

## 블로그 사용 화면

`static/images/blog/qr-code/`의 `input.png`, `preview.png`, `print.png`, `bookmarks.png`와 `static/images/blog/marble-race/`의 `participants.png`, `maps.png`, `draw.png`, `race.png`, `results.png`는2026-09-29 현재 사이트에서 직접 촬영한 사용 화면입니다. QR 코드에는 사이트의 공개 블로그 주소를, 구슬 레이스에는 가상 참가자6명을 사용했습니다. 각 기능 영역을 촬영했으며 도착 순위는 목록의 상단만 담았습니다. 화면의 자체 코드와 글꼴은 위 적용 조건을 따릅니다.

`static/images/blog/team-maker/`의 `participants.png`, `settings.png`, `results.png`, `rules.png`, `rosters.png`는2026-09-29 현재 사이트에서 직접 촬영한 사용 화면입니다. 가상 참가자10명을 사용했습니다. 좁은 화면에서 다시 촬영했으며 참가자 입력과 배정 결과는 핵심 부분만 담았습니다. 화면의 자체 코드와 글꼴은 위 적용 조건을 따릅니다.

## 블로그 파일 비교 예제

`static/images/blog/qr-title/svg-notice.png`와 `static/downloads/blog/qr-title/`의 PNG·SVG는2026-10-30에 로컬 QR 도구에서 직접 저장·촬영했습니다. 공개 블로그 주소와 가상 모임 제목을 사용했습니다. SUIT 글자 모양은 기존 OFL 고지를 따릅니다. 화면과 PNG의 이모지 모양에는 macOS 시스템 글꼴 Apple Color Emoji를 사용했습니다. 시스템 글꼴과 이모지 모양에 프로젝트 MIT나 SUIT의 OFL을 새로 적용하지 않습니다. 재현 코드는 `scripts/capture_blog_qr_title.js`입니다.

`static/downloads/blog/webpage-pdf/bracket-webpage.pdf`는2026-10-28에 운영 중인 자체 블로그 글을 Chromium으로 인쇄한 사본입니다. `static/images/blog/webpage-pdf/last-page.png`는 그 PDF의5쪽 윗부분이며 아래 빈 공간을 잘랐습니다. 외부 문서나 인쇄창을 가져온 그림이 아닙니다. PDF에 포함된 SUIT·SUITE에는 아래 OFL 고지를 유지합니다. 출력 과정에서 macOS 시스템 글꼴 Apple SD Gothic Neo·Courier 일부도 포함됐습니다. 이 글꼴에 프로젝트 MIT나 SUIT·SUITE의 OFL을 새로 적용하지 않습니다.

`static/images/blog/bracket-correction/`의 `confirm.png`와 `after.png`는 2026-10-26에 로컬에서 실행한 사이트의 대진표 화면을 Playwright로 Chromium을 조작해 촬영했습니다. 가상4팀을 사용했으며 모바일 확인창과 넓은 화면의 4강·결승 영역을 담았습니다. 외부 사진이나 실제 대회 기록은 사용하지 않았습니다. 화면의 자체 코드와 글꼴은 위 적용 조건을 따릅니다.

`static/images/blog/file-guides/`와 `static/downloads/blog/file-guides/`는 2026-10-04에 블로그의 파일·문서 문제 해결 글을 위해 자체 제작한 비교 자료입니다. 안내 카드와 합성 패턴은 `scripts/generate_blog_file_examples.js`, 가상의 주문서 PDF는 `scripts/generate_blog_pdf_examples.py`로 생성했습니다. 외부 사진·화면·개인정보는 사용하지 않았습니다. 자체 작성한 도형·문구·생성 코드는 위 MIT 적용 기준을 따릅니다.

이미지의 글자와 PDF에 포함한 글꼴은 저장소의 SUIT에서 가져왔으며 SIL Open Font License 1.1을 따릅니다. 글꼴 원본의 권리는 유지합니다. CSV·텍스트·ZIP은 `scripts/generate_blog_data_examples.py`가 자체 작성한 연습 데이터와 위 이미지로 생성했습니다. `renamed-only.jpg`는 PNG의 이름만 바꾼 확장자 비교용 예제입니다. 측정 JSON은 생성한 파일의 크기와 검증 결과를 담습니다. 원본 예제는 `static/downloads/`에 보관해 사이트 이미지 최적화 과정의 영향을 받지 않도록 했습니다.

2026-10-09에는 `static/downloads/blog/qr-readability/`, `browser-storage/`, `csv-columns/`와 `static/images/blog/qr-readability/`, `browser-storage/`에 문제 해결 글의 자체 비교 자료를 추가했습니다. QR은 공개 도구 주소를 담고, CSV와 저장 화면은 가상 명단을 사용합니다. 생성·재현 방법은 `scripts/README-blog-troubleshooting-examples.md`에 있습니다. 비교 그림의 SUIT 글꼴과 사이트 화면의 글꼴·아이콘은 기존 고지를 따릅니다.

2026-10-13에는 `static/downloads/blog/`의 `file-hash/`, `filename-order/`, `png-transparency/`, `image-orientation/`, `url-characters/`, `qr-url-length/`, `team-rule-conflicts/`에 직접 만든 파일·도형·가상 명단·주소 비교 자료를 추가했습니다. `static/images/blog/png-transparency/`, `image-orientation/`, `qr-url-length/`의 비교 그림도 같은 자료로 생성했습니다. 외부 사진은 사용하지 않았으며 자체 도형·문구·생성 코드는 위 MIT 적용 기준을 따릅니다. 비교 그림과 `upright-source.svg`, 방향 비교 JPG에 사용한 SUIT 글자 모양은 기존 OFL 고지를 유지합니다.

`static/images/blog/filename-order/`는 자체 연습 파일을 Python의 기본 파일 목록으로 열어 Chromium에서 직접 촬영한 화면입니다. Python은 [PSF 라이선스](https://docs.python.org/3/license.html)를 따르며 원프로그램의 권리는 유지합니다. ZIP에는 자체 연습 파일만 담았습니다. 생성·검증 방법은 `scripts/README-blog-workflow-examples.md`에 있습니다.

## 칼바람 아수라장 증강 가이드 자산

`static/images/aram-mayhem/`의 챔피언·스킬·아이템·증강·스탯 아이콘은 2026-10-26부터 `scripts/generate_aram_mayhem.js`가 Riot Games의 [Data Dragon](https://developer.riotgames.com/docs/lol#data-dragon) 16.21.1과 [CommunityDragon](https://www.communitydragon.org/) 16.21에서 받아 크기만 줄여 webp로 바꾼 파일입니다. 모루 아이콘은 Data Dragon 아이템 220000(능력치 모루), 스킬 가속 아이콘은 CommunityDragon의 스탯 룬 그림, 방어구 관통력·마법 관통력 아이콘은 CommunityDragon의 게임 글자 아이콘(`scaleapen`·`scalempen`)입니다. `src/lib/aram-mayhem/guide-data.json`의 챔피언·스킬·아이템·증강 이름과 증강 효과 문구도 같은 자료에서 가져왔습니다.

이 자료의 권리는 Riot Games에 있습니다. 사이트는 Riot Games의 [Legal Jibber Jabber](https://www.riotgames.com/en/legal) 정책에 따라 무료 팬 가이드로 사용하며 페이지에 같은 고지를 표시합니다. 프로젝트 MIT 라이선스에 포함하지 않으며 별도의 재사용 허락을 부여하지 않습니다. CommunityDragon은 Riot Games가 운영하지 않는 커뮤니티 자료 보관소입니다.

조합 설명·단계·빌드 선택 문구는 직접 작성했으며 위 MIT 적용 기준을 따릅니다. 조합 카드의 디시인사이드·유튜브 링크는 조합을 정리할 때 참고한 글과 영상입니다. 원문 문장·이미지·영상 화면은 옮기지 않았습니다.

## 템플릿 이력

이 저장소는 Matheus Fantinel의 [SvelteKit Static Blog Template](https://github.com/matfantinel/sveltekit-static-blog-template)에서 시작했습니다. 첫 commit `c0100a6`의 템플릿과 과거 버전은 당시의 GPLv3 및 개별 자료의 조건을 그대로 따릅니다. 원본 제작자가 현재 사이트를 운영하거나 보증한다는 뜻은 아닙니다.

현재 버전에서는 템플릿 전용 component·SCSS·이미지를 삭제하거나 교체했습니다. 홈과 공통 UI의 실제 구현도 원본과 대조했습니다. MIT 적용 결정은 현재 자체 코드에 한정하며 과거 commit이나 원본 템플릿의 이용 조건을 소급해서 바꾸지 않습니다. 조사 근거는 [현재 자체 코드에 MIT 적용 ADR](https://github.com/hjh3311504/hjh3311504.github.io/blob/main/docs/adr/2026-09-11-현재-자체-코드에-MIT-적용.md)에 있습니다.

## 글꼴

| 자료  | 제작자·출처                                  | 이용 조건                 | 원문                                         |
| ----- | -------------------------------------------- | ------------------------- | -------------------------------------------- |
| SUIT  | SUNN · https://github.com/sun-typeface/SUIT  | SIL Open Font License 1.1 | `src/lib/team-maker/fonts/SUIT-LICENSE.txt`  |
| SUITE | SUNN · https://github.com/sun-typeface/SUITE | SIL Open Font License 1.1 | `src/lib/team-maker/fonts/SUITE-LICENSE.txt` |

전체 글꼴과 Team Maker용 글자 모음에는 같은 글꼴 라이선스를 적용합니다. 코드 라이선스 변경은 글꼴에 적용하지 않습니다. 배포 결과의 `/licenses/SUIT-LICENSE.txt`와 `/licenses/SUITE-LICENSE.txt`에 원문을 포함합니다.

## GitHub 아이콘

홈 링크의 GitHub 아이콘은 [Bootstrap Icons v1.13.1의 github.svg](https://github.com/twbs/icons/blob/v1.13.1/icons/github.svg)를 사용합니다. 원본 path를 유지하고 표시 크기와 접근성 속성만 사이트에 맞췄습니다.

Copyright (c) 2019-2024 The Bootstrap Authors

이용 조건은 MIT입니다. 원문은 `licenses/Bootstrap-Icons-LICENSE.txt`, 배포 경로는 `/licenses/Bootstrap-Icons-LICENSE.txt`입니다. 아이콘의 라이선스는 GitHub 상표에 대한 별도 권리를 부여하지 않습니다.

## 패키지와 배포

Svelte·SvelteKit과 기타 npm 패키지는 각 패키지의 라이선스를 따릅니다. 설치 버전은 `package-lock.json`을 기준으로 합니다.

브라우저 실행에 사용하는 Svelte·SvelteKit·esm-env·clsx·devalue와 Vite가 추가하는 코드의 라이선스 원문을 설치된 패키지에서 `build/licenses/`로 복사합니다. 복사 목록은 `scripts/licenses.js`에서 관리합니다. build 전용 도구와 나머지 의존성도 각 패키지의 이용 조건을 따릅니다.

build에는 자체 MIT 원문, 이 문서, 글꼴·아이콘·실행 의존성의 라이선스를 함께 포함합니다. 검증 script는 배포 사본이 원문과 같은지 확인합니다. 소스는 [공개 저장소](https://github.com/hjh3311504/hjh3311504.github.io)에서 확인할 수 있습니다.

## QR 코드 생성

QR 생성에는 [qrcode](https://github.com/soldair/node-qrcode)와 브라우저 실행 의존성 [dijkstrajs](https://github.com/tcort/dijkstrajs)를 사용합니다. 두 패키지는 MIT이며 설치 버전은 `package-lock.json`을 따릅니다. 원문은 `/licenses/qrcode-LICENSE.txt`와 `/licenses/dijkstrajs-LICENSE.txt`로 배포합니다.

[TeacherCan QR 코드 페이지](https://www.teachercan.com/qr-code)는 기능 흐름을 확인한 참고 자료입니다. 해당 사이트의 코드·이미지·로고를 가져오지 않았으며 제휴 관계를 뜻하지 않습니다.

### SVG 제목 윤곽선

글자 윤곽선은 [fontkit](https://github.com/foliojs/fontkit)의 MIT 코드로 만듭니다. 브라우저에 함께 들어가는 실행 의존성의 원문을 `scripts/licenses.js`에서 배포합니다. fontkit·brotli·dfa는 설치 패키지와 공식 저장소에 독립된 LICENSE 파일이 없으므로 MIT 표시가 있는 README와 저자·버전을 포함한 package.json 원문을 그대로 배포합니다. 원문에 없는 저작권 문구는 만들지 않습니다. 나머지 패키지는 설치된 LICENSE 원문을 배포합니다.

제목은 기존 SUIT 전체 글꼴의 굵기 700을 사용합니다. `wawoff2`는 개발·build 단계에서 WOFF2 압축을 풀 때만 사용합니다. 글꼴 내용과 이름은 변경하지 않습니다. 생성되는 `.svelte-kit/qr-font/SUIT-Variable.ttf`와 build의 대응 글꼴 파일에도 기존 SUIT OFL 고지를 적용합니다. SVG는 글꼴 파일을 포함하지 않고 사용자가 입력한 제목의 도형만 담습니다.

## Team Maker 돌림판 음원

돌림판에서 이전에 사용한 구슬 레이스의 ‘도각 키보드1’ 파일인 `static/audio/marble-race/thock-1.wav`와 `thock-2.wav`는 위 구슬 레이스 음원 안내와 [출처 기록](docs/marble-audio-sources.md)의 Pixabay 출처·라이선스 구분을 따릅니다.

현재 재생하는 `src/lib/team-maker/sounds/wheel-pin-tuk.wav`는2026-10-06에 Agent Audio MCP의 Stable Audio 3 Medium으로 생성한 짧은 고무 타격음입니다.2초 원본의 첫70ms를 모노로 변환하고100Hz 고역 통과·2400Hz 저역 통과 필터와 시작·끝 음량 조절을 적용했습니다. 생성 문구·처리값·파일 해시는 같은 폴더의 `wheel-pin-tuk.json`에 기록합니다. 음원에 코드의 MIT 라이선스를 새로 적용하지 않습니다.

## 구슬 레이스 음원

`static/audio/marble-race/`의 외부 출처 음원 파일은 프로젝트 MIT 라이선스에 포함하지 않는다. Pixabay 출처는 Pixabay Content License를 따른다.

Pixabay 사용 파일과 보존 파일의 원음 제목·제작자·출처는 [구슬 레이스 음원 출처](docs/marble-audio-sources.md)에 기록한다. 정적 음원 폴더의 선택 JSON은 파일과 출처·라이선스·해시 정보를 제공한다.

크랙 왁스와 젤리 연못의 현재 음원은 아래 직접 제작 확인 목록을 따른다. 팡파레는 [Tada Fanfare A — plasterbrain / Freesound Community](https://pixabay.com/sound-effects/tada-fanfare-a-6313/)다.

찰칵 키보드 C의 `clicky-v6-1.wav`·`clicky-v6-2.wav`는 과거 버전에서 MattRuthSound의 [One Keypress 006](https://freesound.org/people/MattRuthSound/sounds/561699/)·[007](https://freesound.org/people/MattRuthSound/sounds/561698/)을 바탕으로 사용한 변형음이다. [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/)을 따르며 프로젝트 MIT 라이선스에 포함하지 않는다. 현재 찰칵 키보드 음원과 `clicky-selection.json`은 배포에서 제거했다. 이 고지는 과거 버전의 출처 기록으로 유지한다.

### 도각 키보드2 보존 음원

`thock2-v2-1.wav`·`thock2-v2-2.wav`는 zrrion의 [Keyboard typing sounds: Unidentified Technics keyboard](https://freesound.org/people/zrrion/sounds/665075/)에서 발췌했다. 원음은 [CC0 1.0](https://creativecommons.org/publicdomain/zero/1.0/)으로 제공된다.

### 도각 키보드4 보존 음원

`thock4-v6-1.wav`·`thock4-v6-2.wav`는 dinamakan의 [Thocky Keyboard Sound Effect](https://pixabay.com/sound-effects/film-special-effects-thocky-keyboard-sound-effect-264568/)를 사용한다. 원음은 Pixabay Content License로 제공되며 프로젝트 MIT 라이선스와 구분한다.

원형 파동의 `pulse-whoosh-deep-v2.wav`는 ksjsbwuil의 [Whoosh Deep Short](https://pixabay.com/sound-effects/technology-whoosh-deep-short-513923/)를 사용하며 Pixabay Content License를 따른다.

### 직접 제작 확인 음원

2026-09-28 제작자 Lake(hjh3311504)는 `thock3-v3-1.wav`·`thock3-v3-2.wav`·`thock2-v1.wav`·`thock3-v2.wav`·`wrap-pop-ai-v1.wav`·`asmr-lava-ai-v1.wav`·`wax-crack-v1-1.wav`·`wax-crack-v1-2.wav`·`frost-freeze-v1.wav`·`lightning-v1.wav`·`gust-v1.wav`의11개 파일을 직접 제작했다고 확인했다. 상세 대응은 [음원 출처](docs/marble-audio-sources.md)의 직접 제작 목록을 따른다. 이 확인만으로 프로젝트의 코드 MIT 범위를 음원까지 확장하거나 별도 재사용 허락을 새로 부여하지 않는다.
