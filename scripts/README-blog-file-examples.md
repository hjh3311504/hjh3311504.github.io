# 블로그 파일 비교 예제 재현

`content/blog/`의 파일·문서 문제 해결 글6개의 자료를 만든다. 글은 2026-10-05부터 하루 간격으로 예약했으며 `npm run dev`의 블로그 목록에서 미리 볼 수 있다. 공개 날짜와 상태는 각 글의 frontmatter가 기준이다.

## 이미지

저장소의 npm 의존성을 설치한 환경에서 실행한다.

```sh
node scripts/generate_blog_file_examples.js
```

글자 카드와 합성 패턴을 만들고 각 파일을 독립적으로 변환한다. PNG의 픽셀 보존과 저장 파일의 해시를 검사한다. 한글은 SUIT 400 굵기를 도형으로 변환해 외부 글꼴 설치에 의존하지 않는다.

## PDF

Python 별도 환경에 다음 패키지가 필요하다. 시스템에는 Poppler의 `pdftoppm`을 설치한다.

```sh
uv venv /tmp/blog-file-examples-venv
uv pip install --python /tmp/blog-file-examples-venv/bin/python reportlab==5.0.1 pypdf==6.19.0 fonttools==4.66.1 brotli==1.2.0
/tmp/blog-file-examples-venv/bin/python scripts/generate_blog_pdf_examples.py
```

문자가 있는 PDF를 먼저 만든다. 그 페이지를 144dpi로 렌더링한 그림만 넣어 이미지 PDF를 만든다. 두 파일의 페이지 수와 검색어 추출 여부를 검사하고 확인용 PNG도 생성한다. OCR을 실행하거나 성능을 측정하는 실험은 아니다.

## 결과 위치와 갱신

CSV 인코딩·ZIP 압축 예제는 이미지 생성 이후 Python 표준 라이브러리로 만든다. 인코딩별 바이트를 비교하는 실험 파일이며 실제 Excel 실행 결과는 아니다.

```sh
python3 scripts/generate_blog_data_examples.py
```

이미지 생성 script에는 확장자만 바꾼 파일과 실제 변환본을 비교하는 실험도 포함한다. `renamed-only.jpg`는 내용이 PNG인 의도적인 예제다. 이름과 내용이 일치하는 제출용 파일로 취급하지 않는다.

- `static/downloads/blog/file-guides/`: 다운로드할 원본·비교 파일과 측정 JSON.
- `static/images/blog/file-guides/`: 본문의 미리보기·확대 비교 PNG.
- `output/pdf/file-guides/`: PDF 작업용 글꼴·렌더링 결과·추출 텍스트. Git 관리 대상이 아니다.

비교 PNG는 손실 압축을 거치지 않은 상태로 본문에 연결한다. 원본 다운로드를 `static/images/`로 옮기지 않는다. build의 이미지 변환 과정과 실험 파일을 구분하기 위해서다.

2026-10-04 측정에 사용한 sharp 버전과 하위 라이브러리 버전은 `image-measurements.json`에 있다. PDF는 ReportLab 5.0.1, pypdf 6.19.0, fonttools 4.66.1, Poppler를 사용했다. 라이브러리나 원본을 바꿔 재생성하면 바이트 수가 달라질 수 있다. 이때 생성일·글의 표·실험 조건을 함께 갱신하고 PNG와 PDF를 다시 눈으로 확인한다. SVG는 도형으로 변환한 원본이므로 한글 문구 수정은 생성 script에서 한다.
