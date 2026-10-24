---
slug: file-hash-comparison
title: '파일 이름과 용량이 같은데 내용도 같을까? SHA-256으로 비교하기'
summary: '이름만 바꾼 파일, 시각을 고친 파일, 줄바꿈만 바꾼 파일을 비교했습니다. 다운로드 예제와 Windows·Mac 명령으로 같은 파일인지 확인해 보세요.'
category: file
publishedAt: '2026-10-14'
published: true
---

## 같은 이름의 첨부파일이 두 개 있을 때

모임 안내를 다시 받았는데 파일 이름도 같고 용량도 같습니다. 기존 파일을 지워도 되는지 판단하려면 **파일 안에 저장된 내용**을 비교해야 합니다. 이름이나 수정 날짜만으로는 같은 파일이라고 확정할 수 없습니다.

이때 쓸 수 있는 값이 **해시**입니다. 파일의 내용을 계산해 얻는 비교용 문자열입니다. 이 글에서는 SHA-256이라는 계산 방법을 사용합니다. 결과는 숫자와 영문자로 된 64자리 값입니다.

파일 4개를 직접 만들어 비교했습니다. 이름만 바꾼 복사본은 값이 같았습니다. 시각을 한 글자 고친 파일은 용량이 같아도 값이 달랐습니다.

## 안내문 한 장으로 비교한 결과

원본은 아래의 두 줄입니다. 마지막 줄 뒤에도 줄바꿈이 들어 있습니다. 글자는 UTF-8 방식으로 저장했습니다.

```text
모임 시각: 19:00
장소: 연습실A
```

| 파일                   | 원본에서 바꾼 부분          | 용량     | 원본과 SHA-256 비교 |
| ---------------------- | --------------------------- | -------- | ------------------- |
| `original.txt`         | 없음                        | 40바이트 | 같음                |
| `renamed-copy.txt`     | 이름만 바꿈                 | 40바이트 | 같음                |
| `edited-time.txt`      | 19시를 18시로 수정          | 40바이트 | 다름                |
| `windows-newlines.txt` | 줄바꿈을 LF에서 CRLF로 변경 | 42바이트 | 다름                |

바이트는 파일 용량을 세는 단위입니다. 같은 40바이트인 원본과 시각 수정본도 서로 다른 파일입니다. 용량이 같다는 사실은 내용까지 같다는 뜻이 아닙니다.

LF와 CRLF는 줄바꿈을 기록하는 방식입니다. LF는 줄바꿈 하나에 1바이트를 쓰고, CRLF는 2바이트를 씁니다. 이번 파일은 줄바꿈이 2개여서 CRLF 파일이 2바이트 커졌습니다. 화면에 보이는 문장이 같아도 저장된 내용은 달라질 수 있습니다.

실험에서는 해시뿐 아니라 파일의 바이트도 직접 비교했습니다. 원본과 이름만 바꾼 복사본만 완전히 같았습니다. 이처럼 파일 이름과 내용의 해시를 구분하는 원리는 [Microsoft의 Get-FileHash 설명](https://learn.microsoft.com/en-us/powershell/module/microsoft.powershell.utility/get-filehash?view=powershell-7.5)에서도 확인할 수 있습니다.

## 예제 파일을 내려받아 확인하세요

아래 링크를 오른쪽 클릭하고 **링크를 다른 이름으로 저장**을 선택해 같은 폴더에 저장하세요. 브라우저에 따라 메뉴 이름은 조금 다를 수 있습니다. 확장자가 `.txt`인지도 확인하세요. 화면의 문장을 복사해 새 파일을 만들면 줄바꿈이나 문자 저장 방식이 달라질 수 있습니다.

- [원본 안내문](/downloads/blog/file-hash/original.txt)
- [이름만 바꾼 복사본](/downloads/blog/file-hash/renamed-copy.txt)
- [모임 시각을 수정한 파일](/downloads/blog/file-hash/edited-time.txt)
- [줄바꿈을 바꾼 파일](/downloads/blog/file-hash/windows-newlines.txt)

Windows에서는 파일을 저장한 폴더에서 PowerShell을 열고 실행하세요. `Format-List`는 결과를 항목별로 표시해 긴 해시를 확인하기 쉽게 합니다. 결과의 `Hash` 항목을 비교하세요.

```powershell
Get-FileHash -Algorithm SHA256 -LiteralPath .\original.txt | Format-List
Get-FileHash -Algorithm SHA256 -LiteralPath .\renamed-copy.txt | Format-List
Get-FileHash -Algorithm SHA256 -LiteralPath .\edited-time.txt | Format-List
Get-FileHash -Algorithm SHA256 -LiteralPath .\windows-newlines.txt | Format-List
```

Mac에서는 터미널에서 같은 폴더로 이동한 뒤 실행하세요. 결과의 왼쪽 문자열이 해시입니다.

```sh
shasum -a 256 original.txt renamed-copy.txt edited-time.txt windows-newlines.txt
```

폴더로 이동하기 어렵다면 `shasum -a 256 `까지 입력한 뒤 파일을 터미널 창으로 끌어 놓으세요. Mac 터미널의 파일 경로 사용법은 [Apple의 항목 끌어오기 안내](https://support.apple.com/ko-kr/guide/terminal/trml106/mac)에서 확인할 수 있습니다.

원본의 전체 결과는 다음과 같습니다. 비교할 때는 앞 몇 글자만 보지 말고 64자 전체를 확인하세요. 영문 대소문자 표기는 달라도 같은 값입니다.

```text
fc4000b674fcd472afe1cdf4ec4730d5dc0b4af99a7768eecc4a3f725190f59d
```

[파일 4개의 전체 해시 목록](/downloads/blog/file-hash/SHA256SUMS.txt)도 함께 제공합니다.

## 값이 다르면 무엇을 확인해야 할까요?

해시가 다르다는 결과만으로 파일이 손상됐다고 판단하지 마세요. 내용 수정, 줄바꿈 변경, 사진의 부가 정보 변경도 값을 바꿀 수 있습니다. 파일이 다른 이유는 원본과 비교해 따로 찾아야 합니다.

작업 목적에 따라 다음처럼 확인하세요.

| 확인하려는 것                        | 다음 행동                                                              |
| ------------------------------------ | ---------------------------------------------------------------------- |
| 전송 전후에 파일이 바뀌었는지        | 보낸 파일과 받은 파일의 SHA-256을 비교하세요.                          |
| 문서의 어느 문장이 달라졌는지        | 문서 비교 기능이나 본문 대조를 사용하세요.                             |
| 같은 사진이 다른 형식으로 저장됐는지 | 사진 내용과 실제 형식을 함께 확인하세요.                               |
| 두 파일 중 어느 것이 최신인지        | 작성자와 수정 내용을 확인하세요. 해시는 최신 순서를 알려주지 않습니다. |

해시는 파일 비교를 돕는 값입니다. 파일이 안전하다거나 배포자가 믿을 만하다는 사실까지 증명하지는 않습니다. 배포자가 제공한 해시와 비교할 때는 그 값을 받은 출처도 함께 확인하세요.

## 실험 자료

2026년 10월 13일에 Node의 SHA-256 계산과 바이트 비교로 확인했습니다. Mac의 `shasum`으로도 4개 파일의 해시가 같은지 대조했습니다. Windows 명령은 Microsoft 문서를 기준으로 작성했으며 실제 Windows 실행은 확인하지 않았습니다. [측정 기록](/downloads/blog/file-hash/measurements.json)에는 파일별 용량과 전체 해시가 들어 있습니다. 생성 코드는 공개 저장소의 `scripts/generate_blog_workflow_examples.js`에 있습니다.

확장자만 달라진 파일을 구분하려면 [파일 확장자와 실제 형식의 차이](/blog/file-extension-vs-format)도 함께 확인하세요.
