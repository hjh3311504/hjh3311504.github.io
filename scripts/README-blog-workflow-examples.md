# 파일·이미지·주소·팀 배정 글의 재현 자료

2026년 10월 14~20일 예약 글 7편의 예제다. 최초 측정일은 2026년 10월 13일이다. 공개일과 측정일을 구분한다.

## 생성

```sh
node scripts/generate_blog_workflow_examples.js
node scripts/run_blog_filename_experiment.js
```

첫 명령은 기존 npm 의존성으로 예제·측정 JSON·비교 그림을 만든다. 두 번째는 Python 3와 설치된 Playwright Chromium을 사용해 실제 파일 목록을 확인하고 화면·ZIP·별도 측정 기록을 만든다. 임시 폴더에 만든 파일만 로컬 서버로 열며, 종료 후 서버와 임시 폴더를 정리한다. 두 명령 모두 build에는 연결하지 않는다. 재생성하면 측정일, 도구 버전, 파일 해시, 원고의 숫자를 함께 확인한다.

| 글                       | 공개 예정일 | `static/downloads/blog/` 폴더 | 확인 범위                                                    |
| ------------------------ | ----------- | ----------------------------- | ------------------------------------------------------------ |
| 파일 내용과 SHA-256 비교 | 2026-10-14  | `file-hash/`                  | 이름 변경·내용 변경·줄바꿈 변경의 실제 바이트와 해시         |
| PNG 투명 배경            | 2026-10-15  | `png-transparency/`           | 직접 만든 도형의 투명 픽셀 수와 배경 합치기                  |
| Team Maker 규칙 충돌     | 2026-10-16  | `team-rule-conflicts/`        | 실제 `makeTeams` 함수의 실패 4개·수정 4개 사례               |
| 이미지 방향 정보         | 2026-10-17  | `image-orientation/`          | 자체 화살표 그림의 EXIF 방향과 픽셀 회전                     |
| 공유 주소의 특수문자     | 2026-10-18  | `url-characters/`             | Node의 URL·URLSearchParams 해석, 네트워크 요청 없음          |
| 파일명 정렬              | 2026-10-19  | `filename-order/`             | JavaScript 비교와 Python 기본 파일 목록 4개의 실제 표시 순서 |
| QR 주소 길이             | 2026-10-20  | `qr-url-length/`              | 원본 PNG 해독과 모듈 수, 인쇄 크기는 계산만 수행             |

## 자료와 해석 범위

`measurements.json`은 측정 시각, Node·라이브러리 버전, 입력, 출력, 파일 해시를 기록한다. 생성 과정에서 주요 원고 수치를 검증한다. Team Maker 성공 사례는 참가자의 누락·중복, 인원 균형, 함께·따로 규칙까지 확인한다. 재현 가능한 조합을 위해 난수 입력을 0.5로 고정했으며 확률 실험은 아니다.

해시 파일은 UTF-8·BOM 없음이다. 원본은 마지막 줄바꿈을 포함한 40바이트다. 이름만 바꾼 파일은 원본과 같은 바이트이고 시각 수정본은 같은 용량에 다른 바이트다. CRLF 파일은 42바이트다. Mac의 `shasum -a 256`으로 4개 값을 대조했다. Windows PowerShell 명령의 근거는 원고의 Microsoft 문서이며 실제 Windows 실행은 확인하지 않았다.

정렬 예제는 Python 3.13.1의 `SimpleHTTPRequestHandler`가 실제 파일을 읽어 만든 목록을 Chromium 151.0.7922.34에서 확인했다. 폴더 4개의 번호·날짜 표시 순서를 검증하고 화면을 수정 없이 촬영했다. `browser-measurements.json`에 환경과 실제 순서, ZIP 해시를 담았다. Windows 탐색기·Finder·클라우드 서비스의 정렬은 검사하지 않았다.

URL 예제는 특정 서비스의 링크 처리 검사가 아니다. 그림 회전은 실제 휴대전화 사진 대신 직접 만든 비대칭 화살표를 사용한다. EXIF 방향 6만 비교하며 전체 메타데이터 삭제나 개인정보 제거를 검증하지 않는다.

ExifTool 13.59의 공식 Perl 배포본을 임시 폴더에서 실행해 3개 방향 예제를 별도로 확인했다. 도구를 프로젝트에 포함하지 않는다. 결과와 입력 파일 해시는 `image-orientation/exiftool-measurements.json`에 있다. ExifTool을 설치한 환경에서는 아래 명령으로 다시 확인할 수 있다.

```sh
exiftool -Orientation static/downloads/blog/image-orientation/*.jpg
exiftool -Orientation -n -j static/downloads/blog/image-orientation/*.jpg
```

`orientation-6.jpg`만 `Rotate 90 CW`와 숫자 6이 나오고, 다른 2개에는 방향 항목이 없어야 한다. 원본 이미지를 재생성한 뒤에는 이 기록의 해시도 대조하고, 달라졌다면 ExifTool 확인을 다시 수행한다.

QR은 M 수준·여백 4칸·한 칸 6px로 만든다. 입력 주소는 공개 QR 도구 주소에 실험용 쿼리만 더한다. jsQR은 원본 PNG를 읽으며 사진 촬영·스마트폰·인쇄 성능을 평가하지 않는다. 30mm·40mm 기준 모듈 크기는 여백 8칸을 포함한 산술 계산이다. 본문의 비교 그림은 읽기 쉽게 크기를 통일했으므로 해독 성능 검사에 사용하지 않는다.

## 그림과 출처

`static/images/blog/png-transparency/`, `image-orientation/`, `qr-url-length/`의 `comparison.png`는 자체 도형과 생성 QR을 배치한 비교 그림이다. 문구는 저장소 SUIT 글꼴의 윤곽선을 사용한다. 방향 예제의 원본 SVG와 JPG도 같은 글꼴을 사용한다. `filename-order/`의 PNG는 자체 연습 파일을 Python 기본 목록으로 열어 촬영한 화면이다. 실제 참가자 데이터는 사용하지 않는다. `THIRD_PARTY_NOTICES.md`의 출처와 글꼴 고지를 따른다.

원본 다운로드는 사이트 이미지 최적화의 영향을 받지 않는 `static/downloads/`에 둔다. 포맷 검사에서도 이 예제 폴더를 제외한다. 해시 비교용 텍스트는 `.gitattributes`로 Git의 자동 줄바꿈 변환을 막아 LF·CRLF 원본과 측정 해시를 보존한다. 예제 파일은 글의 예약일 전에도 배포될 수 있다.

## 원고 검증

원고는 `content/blog/`의 기존 형식을 따른다. 예제 생성 후 수치·링크·출처를 대조하고, 개발 서버에서 PC·모바일의 표·코드·그림을 확인한다. `npm run test:blog`, `npm run build`, `npm run verify:blog`로 글 정보와 공개 판정, 정적 결과를 확인한다. 실제 예약 공개는 `main` 반영 후 해당 날짜 이후의 성공한 배포부터 적용된다.
