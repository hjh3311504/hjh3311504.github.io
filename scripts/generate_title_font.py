"""홈 제목·공유 이미지 제목의 영문용 글꼴(Seta Title)을 만든다.

Gmarket Sans Bold 원본에서 영문·숫자·기본 문장부호(U+0020~U+007E)만 남긴다. 한글은 기존 SUITE로 표시한다.
원본은 예약 글꼴 이름(Gmarket Sans Font)이 있는 OFL 글꼴이라 수정본 이름을 Seta Title로 바꾼다.

사용법(fontTools는 npm 의존성이 아니라 uvx로 임시 설치해 실행한다):
  uvx --from 'fonttools[woff]==4.68.0' python scripts/generate_title_font.py <GmarketSansTTFBold.ttf 경로>

원본 TTF는 https://corp.gmarket.com/fonts/GmarketSansTTF.zip 에서 받는다. 저장소에는 넣지 않는다.
현재 파일은 버전 1.000, SHA-256 ff7c354dd1a324e4cecc1223c4f71e74fa81be7027e0c7f6324c475909cacefc 원본으로 만들었다.
"""

from pathlib import Path
import sys

from fontTools import subset
from fontTools.ttLib import TTFont

ROOT = Path(__file__).resolve().parent.parent
OUTPUT = ROOT / 'src/lib/team-maker/fonts/seta-title.woff2'


def main():
    if len(sys.argv) != 2:
        sys.exit(__doc__)
    # 저장 시각을 원본 값으로 두어 같은 원본이면 같은 파일(같은 배포 주소)이 나오게 한다.
    font = TTFont(sys.argv[1], recalcTimestamp=False)
    options = subset.Options()
    options.flavor = 'woff2'
    options.layout_features = ['kern']
    options.name_IDs = [0, 13, 14]
    options.name_languages = [0x409]
    options.notdef_outline = True
    subsetter = subset.Subsetter(options)
    subsetter.populate(unicodes=range(0x20, 0x7F))
    subsetter.subset(font)

    names = font['name']
    for name_id, value in [
        (1, 'Seta Title'),
        (2, 'Bold'),
        (3, 'SetaTitle-Bold-1.000'),
        (4, 'Seta Title Bold'),
        (6, 'SetaTitle-Bold'),
    ]:
        names.setName(value, name_id, 3, 1, 0x409)

    # 원본은 Regular로 표시돼 있어 이름(Bold)에 맞춰 굵은 글꼴 표시로 바꾼다.
    font['OS/2'].fsSelection = (font['OS/2'].fsSelection & ~(1 << 6)) | (1 << 5)
    font['head'].macStyle |= 1

    font.flavor = 'woff2'
    font.save(OUTPUT)
    print(f'{OUTPUT.relative_to(ROOT)}: {OUTPUT.stat().st_size:,}바이트')


if __name__ == '__main__':
    main()
