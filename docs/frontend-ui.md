# 공통 UI와 수정 직후 검사

새 페이지와 새 컴포넌트도 같은 기준을 따른다. 검사 대상은 고정 파일 목록이 아니라 `src/` 아래의 모든 CSS·Svelte 파일이다.

## 먼저 사용할 컴포넌트

| 용도                            | 컴포넌트                          | 기본 사용법                                                       |
| ------------------------------- | --------------------------------- | ----------------------------------------------------------------- |
| 도구 페이지 제목·설명·바깥 여백 | `ToolPageLayout`                  | `title`, `description`, 필요할 때 `maxWidth` 지정                 |
| 카드 섹션                       | `Section`                         | `variant="card" padding="card" gap="body"`                        |
| 좁은 설정 카드                  | `Section`                         | `padding="compact"`                                               |
| 섹션 제목·번호                  | `SectionHeader`                   | `title`, `titleId`, 번호가 있으면 `step`                          |
| 일반·위험·링크 버튼             | `Button`                          | `variant`, `size`, `href` 사용                                    |
| 아이콘 버튼                     | `IconButton`                      | `label` 필수                                                      |
| 삭제 X 버튼                     | `RemoveRowButton`                 | `label`, `onclick` 사용                                           |
| 모달                            | `Dialog`                          | `title`, `titleId`, `size="md\|wide\|large"`                      |
| 입력 항목                       | `FormField`와 `.ui-field`         | 제목·설명·오류는 FormField, 실제 값과 이벤트는 입력 요소에서 관리 |
| 빈 상태·접는 안내               | `EmptyState`, `DisclosureSection` | 기존 props 사용                                                   |

`Section`의 `padding`은 `none`·`compact`·`card`, `gap`은 `none`·`body`다. 기존 HTML을 보존해야 하는 Team Maker에서는 기본값 `none`을 유지하고 기존 컨테이너에 토큰을 적용한다. 새 카드에는 내부 간격이 포함된 예시를 우선 사용한다.

```svelte
<script>
	import { Section, SectionHeader, FormField } from '$lib/components/ui';
	let value = $state('');
</script>

<Section variant="card" padding="card" gap="body">
	<SectionHeader title="주소 입력" titleId="address-heading" step={1} />
	<FormField id="address" label="주소" help="전체 주소를 입력하세요.">
		{#snippet children({ describedBy, invalid })}
			<input
				class="ui-field"
				id="address"
				bind:value
				aria-describedby={describedBy}
				aria-invalid={invalid}
			/>
		{/snippet}
	</FormField>
</Section>
```

`Dialog`는 native dialog를 유지한다. 열기는 연결한 element의 `showModal()`, 닫기는 기존 이벤트로 처리한다. 기본 너비는480px, `wide`는760px, `large`는1120px다. 화면보다 넓어지지 않는다. 본문만 스크롤하려면 `scroll="body"`를 지정하고 기존 본문 컨테이너에 `data-ui-dialog-body`를 붙인다. 기본 내부 여백24px·모바일16px, 제목22px, 제목과 설명8px, 본문 사이16px, 하단 버튼까지24px를 사용한다.

부모는 데이터와 동작을 관리한다. 하위 컴포넌트에는 값과 콜백을 전달한다. 양방향 입력이나 DOM 참조가 필요할 때만 `bind:`를 사용한다. 한 기능에만 쓰이는 요소는 그 기능 폴더에 둔다.

## 스타일 기준

`src/lib/styles/tokens.css`가 글자 크기·여백·기존 색상 팔레트의 기준이다. 글자는 `--font-size-N`, 여백은 `--space-N`을 사용한다. 테마가 있는 색상은 `--ui-text`, `--ui-surface` 등 기존 의미별 변수를 우선 사용한다. `--color-*`는 기존 테마와 게임 화면의 색을 보존한 팔레트다.

- 일반 UI 글자 크기는 짝수 px다. `clamp()`·vw·임의 rem 크기 대신 media query에서 다른 글자 토큰을 선택한다.
- 제목·설명8px, 제목·본문16px, 입력 항목16px, 카드24px·모바일16px를 기본으로 한다.
- 여백은4px 단위다. 작은 보정만2px을 사용한다. `0`, `auto`는 직접 쓸 수 있다.
- 공통 요소의 내부 선택자를 페이지 CSS에서 덮어쓰지 않는다. 공통 옵션을 확장한다.
- 여백 검사 통과만으로 화면이 적절하다고 판단하지 않는다. 긴 문구와 모바일 화면에서 겹침과 잘림을 확인한다.

예외는 QR 캡션 자동 맞춤, QR 이미지·인쇄 치수, 게임 내부 좌표·구슬 색상, 접근성 숨김 요소, 동작 줄이기 설정이다. CSS 예외는 바로 다음 선언에만 적용하며 이유를 적는다. 위반을 지우려고 예외를 추가하지 않는다.

```css
/* ui-exception spacing: 접근성 전용 문구를 화면 밖에 숨긴다. */
margin: -1px;
```

JavaScript로 생성하는 Team Maker 목록은 기존 HTML 계층을 유지하며 공통 클래스를 사용한다. JavaScript의 동적 스타일·SVG 그림·canvas 내부 값까지 정적 검사로 보장하지 않는다. 해당 동작의 브라우저 테스트를 함께 실행한다.

## 수정 직후 경고

Codex의 `.codex/hooks.json`, Claude Code의 `.claude/settings.json`은 같은 `scripts/ui_hook.js`를 호출한다. 개발 서버나 PR 없이도 도구 실행 뒤 디스크를 비교하고 새로 바뀐 파일을 검사한다. 실패한 Claude Code shell의 부분 수정도 검사한다.

파일·줄·규칙·수정 방향이 에이전트의 다음 입력으로 전달된다. 정상이거나 파일 내용이 같으면 조용히 끝난다. 토큰·검사 정책·의존성 또는 공통 제목의 class 목록이 바뀌면 전체를 검사한다. 제목의 class만 바꿔도 기존 CSS의 덮어쓰기를 확인한다. 검사 결과와 해시는 Git에서 제외한 `.context/ui-harness/`에 세션별로 저장한다. 다른 세션의 결과를 덮어쓰지 않는다. 예외적인 강제 종료로 잠금 폴더가 남았다면 해당 검사 프로세스가 없는지 확인한 뒤 그 `.lock` 폴더만 제거한다.

```shell
npm run check:ui
npm run check:ui -- src/routes/새페이지/+page.svelte
npm run test:ui
```

단독 검사는 위반 시 종료 코드1, 실행 실패 시2를 반환한다. Hook은 파일을 되돌리거나 자동 수정하지 않고 경고만 전달한다. 경고를 받은 에이전트는 다음 수정에서 해결한다. 전체 검사는 마지막 확인과 PR에서도 같은 검사기를 사용한다.

### 최초 연결 확인

설정 파일이 있다는 사실과 실행 중인 에이전트에 연결됐다는 사실은 다르다.

1. Codex에서는 `/hooks`에서 이 저장소의 hook 정의를 검토하고 신뢰 등록한다. 새 정의나 변경된 정의는 다시 검토한다. [Codex 공식 문서](https://developers.openai.com/ko-KR/docs/hooks)
2. Claude Code에서는 프로젝트 설정을 불러온 세션의 `/hooks`에서 등록 상태를 확인한다. [Claude Code 공식 문서](https://code.claude.com/docs/en/hooks)
3. 별도 시험용 Svelte 파일에 `font-size: 13px`을 넣는다. 에이전트가 다음 응답 전에 `ui/font` 경고를 받는지 확인한다. 파일 수정과 shell 수정 모두 시험한다.
4. 시험 파일을 지우고 `npm run check:ui`로 확인한다. 신뢰 등록을 우회하거나 사용자 전역 설정을 수정하지 않는다.

단위 테스트는 두 환경의 hook 입출력 형식과 변경 감지를 검사한다. 실제 세션의 hook 로딩·신뢰 등록까지 대신 검증하지는 않는다.

## 다른 프로젝트에 적용할 때

검사 로직은 `scripts/ui/checker.js`, 프로젝트 정책은 `scripts/ui/policy.js`, 에이전트 전달은 `scripts/ui/hook.js`로 분리한다. 다른 프로젝트에서는 토큰·공통 컴포넌트 경로·예외를 교체하고 실제 수정 직후 경고를 다시 검증한다. 이번 작업은 공용 패키지나 전역 skill을 설치하지 않는다.
