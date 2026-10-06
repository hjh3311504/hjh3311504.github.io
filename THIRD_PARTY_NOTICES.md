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
| `static/images/team-maker/`의 기존 이미지·SVG                                                                                                         | 이번 MIT 적용 범위에서 제외합니다. 기존 자료의 권리는 변경하지 않습니다.                             |
| `docs/design/handoff/`, `docs/design/claude-design-DSN.md`                                                                                            | 보존용 설계 자료·요청문입니다. 이번 MIT 적용 범위에서 제외하며 포함된 외부 자료의 조건을 유지합니다. |
| npm 패키지와 외부 라이선스 원문                                                                                                                       | 각 저작권자의 라이선스를 유지합니다.                                                                 |

MIT 적용 제외는 해당 자료에 GPL을 새로 적용하거나 별도의 재사용 허락을 부여한다는 뜻이 아닙니다. 제외된 이미지·설계 자료를 따로 재사용하려면 해당 자료의 이용 조건을 확인하세요. 일반 문서에서 외부 자료를 인용한 부분에도 원저작자의 권리가 유지됩니다.

## 블로그 사용 화면

`static/images/blog/qr-code/`의 `input.png`, `preview.png`, `print.png`, `bookmarks.png`와 `static/images/blog/marble-race/`의 `participants.png`, `maps.png`, `draw.png`, `race.png`, `results.png`는2026-09-29 현재 사이트에서 직접 촬영한 사용 화면입니다. QR 코드에는 사이트의 공개 블로그 주소를, 구슬 레이스에는 가상 참가자6명을 사용했습니다. 각 기능 영역을 촬영했으며 도착 순위는 목록의 상단만 담았습니다. 화면의 자체 코드와 글꼴은 위 적용 조건을 따릅니다.

`static/images/blog/team-maker/`의 `participants.png`, `settings.png`, `results.png`, `rules.png`, `rosters.png`는2026-09-29 현재 사이트에서 직접 촬영한 사용 화면입니다. 가상 참가자10명을 사용했습니다. 좁은 화면에서 다시 촬영했으며 참가자 입력과 배정 결과는 핵심 부분만 담았습니다. 화면의 자체 코드와 글꼴은 위 적용 조건을 따릅니다.

## 블로그 파일 비교 예제

`static/images/blog/file-guides/`와 `static/downloads/blog/file-guides/`는 2026-10-04에 블로그의 파일·문서 문제 해결 글을 위해 자체 제작한 비교 자료입니다. 안내 카드와 합성 패턴은 `scripts/generate_blog_file_examples.js`, 가상의 주문서 PDF는 `scripts/generate_blog_pdf_examples.py`로 생성했습니다. 외부 사진·화면·개인정보는 사용하지 않았습니다. 자체 작성한 도형·문구·생성 코드는 위 MIT 적용 기준을 따릅니다.

이미지의 글자와 PDF에 포함한 글꼴은 저장소의 SUIT에서 가져왔으며 SIL Open Font License 1.1을 따릅니다. 글꼴 원본의 권리는 유지합니다. CSV·텍스트·ZIP은 `scripts/generate_blog_data_examples.py`가 자체 작성한 연습 데이터와 위 이미지로 생성했습니다. `renamed-only.jpg`는 PNG의 이름만 바꾼 확장자 비교용 예제입니다. 측정 JSON은 생성한 파일의 크기와 검증 결과를 담습니다. 원본 예제는 `static/downloads/`에 보관해 사이트 이미지 최적화 과정의 영향을 받지 않도록 했습니다.

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
