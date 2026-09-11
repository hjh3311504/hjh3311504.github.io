# 출처와 라이선스

## 자체 코드: MIT

2026년 9월 11일 현재 자체 코드에 MIT를 적용합니다. 저작권자는 Lake (hjh3311504)입니다. [MIT 원문](https://github.com/hjh3311504/hjh3311504.github.io/blob/main/LICENSE)과 아래 적용 범위를 함께 확인하세요.

| 대상                                                                                             | 적용 조건                                                                                            |
| ------------------------------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------- |
| `src/`의 자체 JavaScript·TypeScript·Svelte·CSS·HTML                                              | MIT. 아래 글꼴과 Bootstrap 아이콘은 각 저작권 고지를 따릅니다.                                       |
| `scripts/`, `tests/`, 자체 설정 파일과 일반 문서                                                 | MIT. 보존용 설계 자료와 외부 라이선스 원문은 제외합니다.                                             |
| `static/favicon.svg`, `static/favicon.ico`, `static/favicons/`                                   | 이번 작업에서 만든 Lake 아이콘과 설정으로, MIT를 적용합니다.                                         |
| `static/images/site-open-graph-1200x630.png`, `static/images/team-maker-open-graph-1200x630.png` | 자체 생성 script로 만든 공유 이미지이며 MIT를 적용합니다.                                            |
| `src/lib/team-maker/fonts/`와 설계 전달본의 SUIT·SUITE 글꼴                                      | SIL Open Font License 1.1                                                                            |
| 홈의 GitHub 아이콘                                                                               | Bootstrap Icons의 MIT와 원저작권 고지                                                                |
| `static/images/team-maker/`의 기존 이미지·SVG                                                    | 이번 MIT 적용 범위에서 제외합니다. 기존 자료의 권리는 변경하지 않습니다.                             |
| `docs/design/handoff/`, `docs/design/claude-design-DSN.md`                                       | 보존용 설계 자료·요청문입니다. 이번 MIT 적용 범위에서 제외하며 포함된 외부 자료의 조건을 유지합니다. |
| npm 패키지와 외부 라이선스 원문                                                                  | 각 저작권자의 라이선스를 유지합니다.                                                                 |

MIT 적용 제외는 해당 자료에 GPL을 새로 적용하거나 별도의 재사용 허락을 부여한다는 뜻이 아닙니다. 제외된 이미지·설계 자료를 따로 재사용하려면 해당 자료의 이용 조건을 확인하세요. 일반 문서에서 외부 자료를 인용한 부분에도 원저작자의 권리가 유지됩니다.

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
