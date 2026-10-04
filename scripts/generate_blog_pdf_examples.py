"""검색 가능한 PDF와 이미지 PDF를 같은 원본에서 생성하고 검사한다.

필요 패키지: reportlab, pypdf, fonttools[woff]. 시스템 명령: pdftoppm.
실행: python scripts/generate_blog_pdf_examples.py
"""

import hashlib
import json
from pathlib import Path
import subprocess

from fontTools.ttLib import TTFont as SourceFont
from fontTools.varLib.instancer import instantiateVariableFont
from pypdf import PdfReader
from reportlab.lib.colors import HexColor
from reportlab.lib.pagesizes import A4
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.pdfgen import canvas


ROOT = Path(__file__).resolve().parents[1]
OUTPUT = ROOT / "output/pdf/file-guides"
DOWNLOADS = ROOT / "static/downloads/blog/file-guides"
IMAGES = ROOT / "static/images/blog/file-guides"
for directory in (OUTPUT, DOWNLOADS, IMAGES):
    directory.mkdir(parents=True, exist_ok=True)

font = SourceFont(ROOT / "src/lib/team-maker/fonts/SUIT-Variable.woff2")
font = instantiateVariableFont(font, {"wght": 400}, inplace=True)
font.flavor = None
font_path = OUTPUT / "SUIT-Regular.ttf"
font.save(font_path)
pdfmetrics.registerFont(TTFont("SUIT", str(font_path)))

width, height = A4
text_pdf = OUTPUT / "searchable-text.pdf"
image_pdf = OUTPUT / "image-only.pdf"


def start(file):
    doc = canvas.Canvas(str(file), pagesize=A4, invariant=1, pageCompression=1)
    doc.setTitle("문서 검색 실험 - 파일연습")
    doc.setAuthor("Lake")
    doc.setSubject("블로그용 자체 제작 예제. 실제 주문 정보가 아닙니다.")
    return doc


def line(doc, value, x, y, size=13, color="#24384b"):
    doc.setFont("SUIT", size)
    doc.setFillColor(HexColor(color))
    doc.drawString(x, y, value)


doc = start(text_pdf)
doc.setFillColor(HexColor("#edf4f8"))
doc.rect(0, height - 210, width, 210, fill=1, stroke=0)
line(doc, "FILE LAB / 03", 48, height - 66, 12, "#24647c")
line(doc, "문서 검색 실험", 48, height - 118, 30)
line(doc, "찾을 단어: 파일연습", 48, height - 159, 16)
line(doc, "같은 내용, 다른 저장 방식", 48, height - 266, 20)
for index, value in enumerate([
    "이 문서는 블로그 설명을 위해 만든 가상의 주문서입니다.",
    "아래 단어와 수량을 검색하거나 복사해 보세요.",
    "텍스트가 있는 PDF와 이미지만 있는 PDF를 비교합니다.",
]):
    line(doc, value, 48, height - 302 - index * 27)

for index, (label, value) in enumerate([
    ("문서명", "파일연습 주문서"),
    ("품목", "연습용 공책"),
    ("수량", "12개"),
    ("확인 코드", "NOTE-012"),
]):
    y = height - 424 - index * 48
    doc.setStrokeColor(HexColor("#d8e2e9"))
    doc.line(48, y - 16, width - 48, y - 16)
    line(doc, label, 48, y, 13, "#607080")
    line(doc, value, 186, y, 15)

line(doc, "확인 순서", 48, 177, 17)
line(doc, "1. 파일연습 검색   2. 수량 복사   3. 원문과 대조", 48, 143, 13)
line(doc, "실제 개인정보나 거래 내역은 포함하지 않았습니다.", 48, 88, 11, "#607080")
line(doc, "Lake's develog · 파일·문서 문제 해결", 48, 52, 10, "#607080")
doc.showPage()
doc.save()

# 먼저 텍스트 PDF를 렌더링한 뒤, 그 페이지 그림만 새 PDF에 넣는다.
render_base = OUTPUT / "text-page"
subprocess.run(["pdftoppm", "-singlefile", "-r", "144", "-png", str(text_pdf), str(render_base)], check=True)
page_png = render_base.with_suffix(".png")
doc = start(image_pdf)
doc.drawImage(str(page_png), 0, 0, width=width, height=height)
doc.showPage()
doc.save()

measurements = []
for file in (text_pdf, image_pdf):
    reader = PdfReader(file)
    extracted = "\n".join(page.extract_text() or "" for page in reader.pages)
    expected = file == text_pdf
    assert ("파일연습" in extracted) == expected, file.name
    assert len(reader.pages) == 1
    if not expected:
        assert extracted.strip() == ""
    data = file.read_bytes()
    (DOWNLOADS / file.name).write_bytes(data)
    (OUTPUT / f"{file.stem}.txt").write_text(extracted, encoding="utf-8")
    subprocess.run(["pdftoppm", "-singlefile", "-r", "100", "-png", str(file), str(OUTPUT / file.stem)], check=True)
    measurements.append({
        "file": file.name,
        "bytes": len(data),
        "pages": len(reader.pages),
        "containsSearchWord": "파일연습" in extracted,
        "extractedCharacters": len(extracted.strip()),
        "sha256": hashlib.sha256(data).hexdigest(),
    })
(IMAGES / "pdf-example.png").write_bytes((OUTPUT / "searchable-text.png").read_bytes())
(DOWNLOADS / "pdf-measurements.json").write_text(
    json.dumps({"measuredAt": "2026-10-04", "searchWord": "파일연습", "files": measurements}, ensure_ascii=False, indent=2) + "\n",
    encoding="utf-8",
)
print(json.dumps(measurements, ensure_ascii=False, indent=2))
