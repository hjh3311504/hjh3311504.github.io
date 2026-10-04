"""CSV 문자 인코딩과 ZIP 압축을 설명하는 작은 파일 예제를 생성한다.

Python 표준 라이브러리만 사용한다. 이미지 예제를 먼저 생성해야 한다.
"""

import csv
import hashlib
import io
import json
from pathlib import Path
import platform
import zipfile
import zlib

ROOT = Path(__file__).resolve().parents[1]
OUTPUT = ROOT / "static/downloads/blog/file-guides"
OUTPUT.mkdir(parents=True, exist_ok=True)


def write_json(name, data):
    (OUTPUT / name).write_text(json.dumps(data, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")


rows = [["항목", "수량", "메모"], ["공책", "12", "가나다"], ["연필", "3", "쉼표, 포함"]]
buffer = io.StringIO(newline="")
csv.writer(buffer, lineterminator="\r\n").writerows(rows)
source = buffer.getvalue()
csv_results = []
for label, encoding in [("utf8", "utf-8"), ("utf8-bom", "utf-8-sig"), ("cp949", "cp949")]:
    data = source.encode(encoding)
    file = OUTPUT / f"korean-{label}.csv"
    file.write_bytes(data)
    with file.open(encoding=encoding, newline="") as stream:
        assert list(csv.reader(stream)) == rows
    csv_results.append({
        "file": file.name, "encoding": encoding, "bytes": len(data),
        "firstBytes": data[:12].hex(" "), "rowsMatch": True,
        "sha256": hashlib.sha256(data).hexdigest(),
    })
wrong_read = (OUTPUT / "korean-cp949.csv").read_bytes().decode("utf-8", errors="replace")
assert "�" in wrong_read
write_json("csv-measurements.json", {
    "measuredAt": "2026-10-04", "rows": rows,
    "cp949ReadAsUtf8WithReplacement": wrong_read, "files": csv_results,
})

(OUTPUT / "repeated-notes.txt").write_text("공책 12개, 연필 3개. 파일 압축을 비교하는 연습 문장입니다.\n" * 1000, encoding="utf-8")
(OUTPUT / "tiny-note.txt").write_bytes(b"hello\n")
zip_results = []
for name in ["repeated-notes.txt", "text-card.png", "resize-1600-q90.jpg", "tiny-note.txt"]:
    data = (OUTPUT / name).read_bytes()
    target = OUTPUT / f"{name}.zip"
    info = zipfile.ZipInfo(name, date_time=(2026, 10, 4, 0, 0, 0))
    info.compress_type = zipfile.ZIP_DEFLATED
    with zipfile.ZipFile(target, "w") as archive:
        archive.writestr(info, data, compress_type=zipfile.ZIP_DEFLATED, compresslevel=9)
    with zipfile.ZipFile(target) as archive:
        assert archive.namelist() == [name]
        assert archive.read(name) == data
        assert archive.testzip() is None
    size = target.stat().st_size
    zip_results.append({
        "source": name, "file": target.name, "originalBytes": len(data),
        "zipBytes": size, "reductionPercent": round((1 - size / len(data)) * 100, 1),
        "restoredBytesMatch": True,
        "sha256": hashlib.sha256(target.read_bytes()).hexdigest(),
    })
write_json("zip-measurements.json", {
    "measuredAt": "2026-10-04", "python": platform.python_version(),
    "zlib": zlib.ZLIB_RUNTIME_VERSION, "method": "DEFLATE", "compressionLevel": 9,
    "files": zip_results,
})
print(json.dumps({"csv": csv_results, "zip": zip_results}, ensure_ascii=False, indent=2))
