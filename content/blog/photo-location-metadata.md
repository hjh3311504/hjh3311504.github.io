---
slug: photo-location-metadata
title: '사진을 공유하기 전 위치 정보 확인하기: GPS만 복사본에서 지우는 방법'
summary: '가짜 좌표를 넣은 JPEG에서 GPS 정보를 읽고 복사본에서 지웠습니다. 원본을 보존하면서 사진에 남은 위치 정보를 확인하는 순서를 안내합니다.'
category: image
publishedAt: '2026-10-21'
published: true
---

## 사진 파일에 촬영 장소가 들어갈 수 있습니다

사진에는 촬영 날짜, 카메라 정보, GPS 좌표 같은 메타데이터가 들어갈 수 있습니다. 사진 앱은 위치 정보를 이용해 촬영 장소별로 사진을 모아 보여주기도 합니다. 방향 정보가 잘못 적용되는 문제는 [사진의 회전 정보를 확인하는 방법](/blog/image-orientation-metadata)에서 따로 설명합니다.

위치 정보가 들어 있는 사진을 그대로 공유하면 받는 사람도 좌표를 확인할 수 있습니다. 다만 모든 사진에 위치가 저장되는 것은 아닙니다. 메신저나 사진 서비스가 파일을 바꾸는 방식도 서로 다릅니다. 보낼 파일 자체를 확인하고, 실제 공유 경로를 거친 파일도 다시 확인하세요.

## 가짜 좌표를 넣은 JPEG로 지우기 전후를 비교했습니다

개인 사진을 사용하지 않고, 단색 사각형으로 만든 80×60px JPEG에 시험용 좌표를 넣었습니다. 이 좌표는 서울 시내를 가리키도록 입력한 가짜 값이며 실제 촬영 장소와 관계없습니다.

| 파일                     | GPS 정보 |        크기 |
| ------------------------ | -------- | ----------: |
| `sample-with-gps.jpg`    | 있음     | 1,359바이트 |
| `sample-without-gps.jpg` | 없음     | 1,233바이트 |

두 파일은 모두 80×60px입니다. 이 실험에서 GPS 이름의 메타데이터를 지우자 파일 용량은 126바이트 줄었습니다. 사진의 크기나 화질을 줄이는 실험은 아닙니다.

## 먼저 사진 안의 위치 정보를 읽으세요

[ExifTool](https://exiftool.org/)은 사진 등의 메타데이터를 읽고 수정하는 도구입니다. [설치 안내](https://exiftool.org/install.html)에 따라 설치하세요. macOS·Linux는 터미널, Windows는 PowerShell을 사용합니다.

Windows용 압축 파일을 풀면 `exiftool(-k).exe`와 `exiftool_files` 폴더가 나옵니다. 둘을 같은 폴더에 두고 실행 파일 이름을 `exiftool.exe`로 바꾸세요. 아래 명령은 사진 폴더에서 실행합니다. Windows에서는 각 명령의 첫 단어 `exiftool`을 `& "C:\tools\exiftool\exiftool.exe"`로 바꾸세요. `C:\tools\exiftool\exiftool.exe`는 ExifTool을 둔 실제 경로로 바꾸면 됩니다. PowerShell의 `&`는 경로에 있는 프로그램을 실행합니다. Windows 명령 프롬프트(cmd)는 작은따옴표를 따옴표로 인식하지 않으므로 사용하지 마세요.

터미널이나 PowerShell에서 사진 폴더로 이동하세요. 예를 들어 다음처럼 `cd` 뒤에 폴더 경로를 넣습니다. 경로는 각자 사진을 둔 위치로 바꾸세요.

```sh
cd "/path/to/photos"
```

macOS에서는 터미널에 `cd `를 입력하고 공백을 하나 둔 다음 Finder의 사진 폴더를 끌어 놓으세요. Enter를 누르면 해당 폴더로 이동합니다. Windows PowerShell에서는 `cd "C:\Users\이름\Pictures"`처럼 입력합니다.

아래 명령은 파일을 읽기만 합니다.

```sh
exiftool -a -G1 -s '-gps*' "photo.jpg"
```

`GPSLatitude`, `GPSLongitude` 같은 항목이 나오면 위치 좌표가 들어 있을 수 있습니다. `-G1`은 정보가 저장된 그룹을 함께 보여줍니다. 시험 사진에서 나온 항목 중 일부는 다음과 같습니다.

```text
[GPS] GPSLatitude  : 37 deg 33' 59.40"
[GPS] GPSLongitude : 126 deg 58' 40.80"
```

실제 출력에는 북위·동경 표시, `GPSVersionID`, 계산해 표시한 `GPSPosition` 같은 줄도 함께 나올 수 있습니다. 전체 예시는 [실험 기록](/downloads/blog/photo-location-metadata/examples.txt)에서 확인하세요. `City`, `Country`, `Location`처럼 GPS로 시작하지 않는 위치 관련 태그가 있을 수도 있습니다. 모든 정보를 보려면 `exiftool -a -G1 "photo.jpg"`를 실행하세요. 사진에 직접 찍힌 주소·간판도 파일 정보와 별도로 확인해야 합니다.

## 원본은 두고 GPS 정보만 새 파일에서 지우세요

아래 명령은 GPS로 시작하는 메타데이터 항목을 지운 복사본을 만듭니다. `-o` 뒤에는 새 파일 이름, 마지막에는 원본 파일 이름을 넣으세요.

```sh
exiftool '-gps*=' -o "photo-share.jpg" "photo.jpg"
```

ExifTool의 `-TAG=` 형식은 지정한 항목을 지우고, `*`는 여러 이름에 맞는 항목을 찾습니다. 인수 전체를 따옴표로 감싸면 zsh 같은 셸이 별표를 파일 이름으로 먼저 바꾸지 않습니다. 이 명령은 GPS 이름의 항목을 대상으로 합니다. 모든 메타데이터를 지우는 `-all=`과는 다릅니다. `-all=`은 사진 방향 정보인 `Orientation`도 지울 수 있어 그림이 돌아가 보일 수 있습니다. 위에서 연결한 회전 정보 안내를 먼저 확인하세요.

`photo-share.jpg`라는 파일이 이미 있다면 다른 새 이름을 지정하세요. ExifTool은 기존 결과 파일을 덮어쓰지 않습니다.

원본과 새 파일을 각각 확인하세요.

```sh
exiftool -a -G1 -s '-gps*' "photo.jpg"
exiftool -a -G1 -s '-gps*' "photo-share.jpg"
```

원본에 좌표가 있었다면 새 파일에서 GPS 항목이 사라졌는지 확인합니다. 이 명령은 `City`, `Country`, `Location`처럼 GPS로 시작하지 않는 위치 태그를 지우지 않습니다. 이런 항목이 남아 있는지 별도로 확인하세요. 받은 사람이 볼 파일을 메신저나 게시 서비스에서 다시 내려받을 수 있다면 그 파일도 살펴보세요. 서비스가 사진을 다시 저장하거나 다른 위치에 별도 정보를 붙일 수 있기 때문입니다. 조회 결과가 비어 있으면 그 파일에는 ExifTool이 찾은 GPS 항목이 없습니다.

ExifTool은 파일 형식과 각 정보의 위치에 따라 처리할 수 있는 범위가 다릅니다. RAW 원본이나 업무용 원본은 덮어쓰지 마세요. 이 안내처럼 복사본을 만든 뒤 결과를 확인하고, 필요한 경우 해당 파일 형식의 안내도 읽으세요.

## iPhone 사진 앱에서 공유할 때 위치를 빼는 방법

iPhone 또는 iPad의 사진 앱에서 공유한다면 사진을 선택한 뒤 공유 버튼의 **옵션**을 열고 **위치**를 끌 수 있습니다. Apple 안내에 따르면 공유 화면에 위치가 포함되지 않는다는 표시가 나옵니다. 이 선택은 그 공유 동작에 적용됩니다. 원본 파일에 저장된 정보를 모두 지우는 동작과는 구분하세요.

Mac의 사진 앱에서는 사진을 선택한 뒤 **이미지 > 위치 > 위치 가리기**를 사용할 수 있습니다. 이 설정으로 내보낸 파일도 ExifTool로 확인하세요. 메뉴 이름과 화면은 운영체제 버전에 따라 다를 수 있으므로 [Apple의 위치 메타데이터 안내](https://support.apple.com/ko-kr/guide/personal-safety/ips0d7a5df82/web)에서 현재 화면을 확인하세요.

## 직접 내려받아 비교하기

- [가짜 GPS 좌표가 들어 있는 JPEG](/downloads/blog/photo-location-metadata/sample-with-gps.jpg)
- [GPS 이름의 정보를 지운 JPEG](/downloads/blog/photo-location-metadata/sample-without-gps.jpg)
- [실행 명령과 측정 기록](/downloads/blog/photo-location-metadata/examples.txt)
- [파일 크기·픽셀·해시 기록](/downloads/blog/photo-location-metadata/measurements.json)

2026년 10월 15일 macOS 26.6.2와 ExifTool 13.55에서 합성 JPEG로 확인했습니다. 실제 촬영 사진이나 사용자 사례는 사용하지 않았습니다.

ExifTool은 GPS 정보를 읽고 수정하는 방법을 [공식 문서](https://exiftool.org/exiftool_pod2.html)에 안내합니다. iPhone·iPad·Mac 사진 앱의 공유 및 위치 설정은 [Apple 안내](https://support.apple.com/ko-kr/guide/personal-safety/ips0d7a5df82/web)를 참고하세요.
