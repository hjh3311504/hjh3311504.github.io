"""CSV 구분자·따옴표 예제. Excel 문서가 아닌 원문 해석 실험 파일을 만든다."""
import csv
from datetime import datetime, timezone
import hashlib
import io
import json
from pathlib import Path
import platform

ROOT = Path(__file__).resolve().parents[1]
OUTPUT = ROOT / "static/downloads/blog/csv-columns"
OUTPUT.mkdir(parents=True, exist_ok=True)
ROWS = [
    ["이름", "수량", "메모"],
    ["가람", "2", "공책, 연필"],
    ["나래", "1", '제목은 "준비물"'],
    ["다온", "3", "첫째 줄\n둘째 줄"],
]


def encode(delimiter):
    stream = io.StringIO(newline="")
    csv.writer(stream, delimiter=delimiter, lineterminator="\r\n").writerows(ROWS)
    return stream.getvalue()


correct = encode(",")
naive = "\r\n".join(",".join(row) for row in ROWS) + "\r\n"
semicolon = encode(";")
files = []
for name, text, delimiter in [
    ("correct.csv", correct, ","),
    ("unquoted.csv", naive, ","),
    ("semicolon.csv", semicolon, ";"),
]:
    payload = text.encode("utf-8")
    (OUTPUT / name).write_bytes(payload)
    parsed = list(csv.reader(io.StringIO(text, newline=""), delimiter=delimiter, strict=True))
    match = parsed == ROWS
    if name != "unquoted.csv":
        assert match
    else:
        assert not match
    files.append({"file": name, "encoding": "UTF-8 without BOM", "delimiter": delimiter,
                  "bytes": len(payload), "physicalLines": len(text.splitlines()),
                  "parsedRowsIncludingHeader": len(parsed), "columnsByRow": list(map(len, parsed)),
                  "matchesOriginal": match, "parsed": parsed,
                  "sha256": hashlib.sha256(payload).hexdigest()})
wrong_delimiter = list(csv.reader(io.StringIO(semicolon, newline=""), delimiter=","))
naive_split = [line.split(",") for line in correct.splitlines()]
assert wrong_delimiter != ROWS
assert naive_split != ROWS
result = {"measuredAt": datetime.now(timezone.utc).isoformat(), "python": platform.python_version(),
          "method": "Python csv.reader; no Excel or Google Sheets UI tested", "originalRows": ROWS,
          "files": files, "semicolonReadWithComma": wrong_delimiter,
          "correctCsvSplitNaively": naive_split}
(OUTPUT / "measurements.json").write_text(json.dumps(result, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
print(json.dumps(result, ensure_ascii=False, indent=2))
