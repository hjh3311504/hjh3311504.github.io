# QR·브라우저 저장·CSV 열 구분 예제

2026년10월11~13일 예약 글3편의 재현 자료다. 최초 측정일은2026년10월9일이다. 원고의 공개일과 실제 측정일을 구분한다.

## QR 이미지

```sh
node scripts/generate_blog_qr_examples.js
```

같은 주소와 오류 정정 수준 M으로 만든 원본에서 흰 여백 제거·32px 축소·재확대본을 만든다. jsQR에 각 파일의 RGBA 픽셀을 전달하고 입력 주소와 비교한다. 휴대전화·촬영·인쇄 성능 검사가 아니다. 여백 제거본도 이번 조건에서는 읽혔다는 결과를 보존한다. 비교 그림은 같은 표시 크기로 배치하지만 해독에는 원본 크기의 파일을 사용한다.

- 다운로드: `static/downloads/blog/qr-readability/`
- 본문 그림: `static/images/blog/qr-readability/comparison.png`

`measurements.json`에 측정 시각·Node·라이브러리 버전·변환 조건·크기·해독값·파일 해시를 기록한다. 글의 표는 이 결과를 기준으로 작성한다.

## 브라우저 저장

개발 서버를 실행하고 Playwright CLI의 별도 세션을 연다. `playwright-cli` 대신 설치된 CLI wrapper의 절대 경로를 사용해도 된다.

```sh
npm run dev -- --host 127.0.0.1 --port 4175
# 다른 터미널에서 실행
playwright-cli --session blog-storage open http://127.0.0.1:4175/team-maker
node scripts/run_blog_storage_experiment.js playwright-cli blog-storage
playwright-cli --session blog-storage close
```

`blog_storage_experiment.js`는 로컬 주소만 허용하고 새 임시 browser context에서 가상 명단만 다룬다. 기존 사용자 프로필이나 운영 사이트 데이터를 읽거나 지우지 않는다. 화면에서 참가자3명·저장 명단1개를 만든 뒤 새로고침·같은 환경의 새 탭·별도 환경·원래 환경 유지·localStorage 삭제를 비교한다. 추가로 임시 환경 종료 후 새 환경의 빈 상태를 확인한다. 완료·실패 시 생성한 환경을 닫는다.

삭제는 Chromium DevTools Protocol의 `Storage.clearDataForOrigin`에서 `local_storage`만 대상으로 한다. Chrome 설정 화면 조작, 일반 브라우저 프로세스 재시작, 실제 다른 기기, 삭제 자료 복구는 시험하지 않는다. 임시 환경은 시크릿 창의 저장 수명을 설명하는 보조 실험이며 메뉴로 시크릿 창을 직접 조작한 결과라고 표현하지 않는다.

- 화면: `static/images/blog/browser-storage/`의 PNG2개
- 측정 결과: `static/downloads/blog/browser-storage/measurements.json`

## CSV 열 구분

```sh
python3 scripts/generate_blog_csv_columns.py
```

Python 표준 라이브러리만 사용한다. 쉼표·따옴표·줄바꿈이 있는 가상 표를 정상 쉼표 CSV, 따옴표 처리가 빠진 CSV, 정상 세미콜론 CSV로 저장한다. 올바른 구분자로 읽은 값의 원본 일치와 잘못된 처리의 불일치를 검사한다. 인코딩은 UTF-8, BOM 없음으로 통일한다. Excel·Google Sheets 실행 실험은 아니다.

`static/downloads/blog/csv-columns/`에 원문3개와 읽은 결과·파일 해시·Python 버전을 저장한다. `unquoted.csv`는 의도적으로 값 경계를 보존하지 못하게 만든 예제다.

## 갱신과 검증

예제 생성은 build와 분리한다. 재생성하면 측정일·버전·해시·원고 표·실험 설명을 함께 확인한다. 원고에 쓰인 PNG는 눈으로 검토한다. 원본 다운로드는 이미지 최적화가 적용되지 않는 `static/downloads/`에 둔다.

새 자료는 직접 만든 가상 데이터, QR과 사이트 화면이다. QR 비교 그림의 한글은 저장소 SUIT 글꼴을 윤곽선으로 변환했다. 기존 글꼴 라이선스를 따른다. 외부 화면·사진·개인 명단을 복제하지 않는다.

예약 글은 개발 서버의 `/blog`에서 확인한다. `npm run test:blog`, `npm run build`, `npm run verify:blog`로 공개 판정·정적 결과를 검사한다. 실제 공개에는 해당 날짜 이후 main의 성공한 배포가 필요하다. 예약 글의 다운로드 예제와 그림은 `static/`에 있으므로 글의 공개일 전에도 배포될 수 있다.
