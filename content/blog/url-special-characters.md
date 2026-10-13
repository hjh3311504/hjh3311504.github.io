---
slug: url-special-characters
title: '공유 링크의 &, +, # 때문에 값이 달라질 때'
summary: 'R&D, A+B, Room#2를 주소에 넣고 실제로 읽히는 값을 비교했습니다. 공유 주소를 복사할 때와 코드로 만들 때 각각 확인할 점을 설명합니다.'
category: guide
publishedAt: '2026-10-18'
published: true
---

## 링크는 열리는데 선택한 값이 다르다면

모임 이름을 `A+B`로 넣었는데 받은 쪽에서는 `A B`로 보입니다. 방 이름 `Room#2`는 `Room`까지만 전달됩니다. 이런 문제는 글자 자체보다 **주소 안에서 기호가 맡는 역할** 때문에 생길 수 있습니다.

주소에서 `?` 뒤에 붙이는 이름과 값의 묶음을 쿼리라고 합니다. 예를 들어 `?group=Blue`는 `group`이라는 이름에 `Blue`라는 값을 붙인 것입니다. 이 영역에서는 `&`, `+`, `#`를 무심코 이어 붙이면 의도와 다르게 읽힐 수 있습니다.

완성된 공유 링크를 전달하는 사람이라면 서비스의 **링크 복사** 기능을 쓰고 전체 주소를 그대로 보내세요. 직접 링크를 만드는 개발자라면 값을 주소 규칙에 맞게 넣어야 합니다.

## 세 가지 기호를 그대로 넣어 봤습니다

아래 결과는 JavaScript의 `URL`과 `URLSearchParams`로 확인했습니다. 인터넷 접속 없이 예제 주소 문자열만 해석했습니다. `example.invalid`는 실제 가입 페이지가 아닌 예제용 주소입니다.

| 주소의 쿼리 부분 | 읽은 값  | 달라진 이유                             |
| ---------------- | -------- | --------------------------------------- |
| `?group=R&D`     | `R`      | `&` 뒤가 별도 항목으로 나뉨             |
| `?group=R%26D`   | `R&D`    | `%26`을 값 안의 `&`로 읽음              |
| `?group=A+B`     | `A B`    | 이 쿼리 처리 방식은 `+`를 공백으로 읽음 |
| `?group=A%2BB`   | `A+B`    | `%2B`를 값 안의 `+`로 읽음              |
| `?room=Room#2`   | `Room`   | `#2`가 쿼리 뒤의 별도 부분으로 나뉨     |
| `?room=Room%232` | `Room#2` | `%23`을 값 안의 `#`으로 읽음            |

`%26`처럼 기호를 `%`와 숫자·문자로 바꾸는 방식을 퍼센트 인코딩이라고 합니다. 주소 구조를 나누는 기호와 값에 포함된 기호를 구분하는 데 사용합니다.

`+`에 관한 결과는 **URLSearchParams가 쿼리를 처리하는 규칙**입니다. 모든 주소 위치에서 `+`가 공백이 된다는 뜻은 아닙니다. 관련 동작은 [MDN URLSearchParams 설명](https://developer.mozilla.org/en-US/docs/Web/API/URLSearchParams#preserving_plus_signs)에서 확인할 수 있습니다.

## 링크를 전달하는 사람은 어디를 확인할까요?

주소가 이상해 보인다고 `%` 뒤 문자를 직접 고치지 마세요. 눈에 읽기 쉬운 글자로 바꾸는 과정에서 값이 다시 나뉠 수 있습니다.

1. 원래 서비스로 돌아가 공유 주소를 다시 복사하세요.
2. 메신저에서 전송한 링크와 복사한 주소의 시작·끝을 비교하세요.
3. 링크를 받은 환경에서 열고 모임 이름이나 선택 항목이 맞는지 확인하세요.
4. QR 코드로 배포한다면 스캔 후 열린 화면의 값까지 확인하세요.

주소가 길다고 `?` 뒤를 전부 지우면 안 됩니다. 그 부분에 파일 식별 정보나 초대 값이 들어 있을 수 있습니다. 필요한 정보인지는 주소를 만든 서비스에서 확인해야 합니다.

링크가 정상이어도 권한이나 로그인 조건 때문에 접근이 막힐 수 있습니다. 값이 달라지는 문제와 접근 권한 문제는 따로 확인하세요.

## 코드에서는 문자열을 직접 이어 붙이지 마세요

다음처럼 작성하면 모임 이름 안의 기호가 주소 구분자로 해석될 수 있습니다.

```js
const group = 'R&D';
const link = 'https://example.invalid/join?group=' + group;

console.log(new URL(link).searchParams.get('group'));
// R
```

값을 넣을 때는 주소를 다루는 `URLSearchParams`를 사용하세요. 일반 문자를 전달하면 필요한 변환을 맡아 줍니다.

```js
const link = new URL('https://example.invalid/join');
link.searchParams.set('group', 'A+B');
link.searchParams.set('room', '연습실 #2');

console.log(link.href);
// https://example.invalid/join?group=A%2BB&room=%EC%97%B0%EC%8A%B5%EC%8B%A4+%232
console.log(new URL(link.href).searchParams.get('group'));
// A+B
console.log(new URL(link.href).searchParams.get('room'));
// 연습실 #2
```

주소 문자열에는 한글과 기호가 변환된 모습으로 들어갑니다. 원래 더하기 기호는 `%2B`가 되고, 방 이름의 공백은 `+`가 됩니다. 다시 읽은 `group`과 `room` 값은 원래 입력과 같습니다. 주소의 표시 모양보다 **읽은 값이 입력값과 같은지** 확인하세요.

이미 변환한 `A%2BB`를 `set()`에 넣으면 주소에는 `A%252BB`가 들어갑니다. `%`를 다시 `%25`로 바꾼 결과입니다. 다시 읽어도 `A+B`가 아닌 `A%2BB`가 나오므로, 위 코드처럼 원래 값을 넘기세요. 완성된 주소 전체를 한 번에 값처럼 변환하는 것도 피하세요.

## 문제를 재현할 자료

2026년 10월 13일에 Node의 표준 주소 처리 기능으로 표의 6개 사례를 확인했습니다. [주소와 결과를 나란히 적은 텍스트](/downloads/blog/url-characters/examples.txt)와 [전체 측정 기록](/downloads/blog/url-characters/measurements.json)을 제공합니다. 특정 메신저나 서버의 동작을 측정한 결과는 아닙니다.

[QR 코드 도구](/qr-code)에 넣을 때도 원본 공유 주소를 그대로 사용하세요. 이미지가 읽히지 않는 문제라면 [QR 여백과 크기 확인 방법](/blog/qr-code-readability)을 먼저 살펴보세요.
