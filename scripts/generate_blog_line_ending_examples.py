"""줄바꿈 예제와 실제 바이트 측정을 생성한다. Python 3 표준 라이브러리만 사용한다."""

import hashlib
import json
import platform
from datetime import datetime, timezone
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
DESTINATION = ROOT / 'static/downloads/blog/line-endings'
INPUTS = {
    'lf.txt': b'A01\nB02\nC03\n',
    'crlf.txt': b'A01\r\nB02\r\nC03\r\n',
    'mixed.txt': b'A01\r\nB02\nC03\n',
    'no-final-newline.txt': b'A01\nB02\nC03',
    'extra-blank-line.txt': b'A01\nB02\nC03\n\n',
}
DESTINATION.mkdir(parents=True, exist_ok=True)
results = []
for name, content in INPUTS.items():
    target = DESTINATION / name
    target.write_bytes(content)
    saved = target.read_bytes()
    assert saved == content
    normalized = saved.replace(b'\r\n', b'\n')
    crlf = saved.count(b'\r\n')
    results.append({
        'file': name,
        'bytes': len(saved),
        'crlf': crlf,
        'lfWithoutCr': saved.count(b'\n') - crlf,
        'standaloneCr': saved.count(b'\r') - crlf,
        'endsWithNewline': saved.endswith(b'\n'),
        'splitlines': saved.decode('utf-8').splitlines(),
        'naiveSplit': saved.decode('utf-8').split('\n'),
        'normalizedEqualsLf': normalized == INPUTS['lf.txt'],
        'sha256': hashlib.sha256(saved).hexdigest(),
    })
assert [item['bytes'] for item in results] == [12, 15, 13, 11, 13]
assert [len(item['splitlines']) for item in results] == [3, 3, 3, 3, 4]
assert [item['normalizedEqualsLf'] for item in results] == [True, True, True, False, False]
assert results[1]['naiveSplit'][0] == 'A01\r'
assert all(item['standaloneCr'] == 0 for item in results)
record = {
    'measuredAt': datetime.now(timezone.utc).isoformat(),
    'python': platform.python_version(),
    'platform': platform.platform(),
    'encoding': 'UTF-8 without BOM; ASCII-only example codes',
    'normalization': 'CRLF -> LF only; preserves final newline and blank lines',
    'results': results,
}
(DESTINATION / 'measurements.json').write_text(
    json.dumps(record, ensure_ascii=False, indent=2) + '\n', encoding='utf-8', newline='\n'
)
print(json.dumps(record, ensure_ascii=False, indent=2))
