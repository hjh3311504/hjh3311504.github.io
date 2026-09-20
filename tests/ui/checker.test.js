import test from 'node:test';
import assert from 'node:assert/strict';
import { checkSource } from '../../scripts/ui/checker.js';

const tokens = new Map([
	['--font-size-14', '14px'],
	['--space-8', '8px'],
	['--color-text', '#123']
]);
const css = (source, file = 'src/routes/new-page/page.css') =>
	checkSource(file, source, { tokens });
const svelte = (source, file = 'src/routes/new-page/+page.svelte') =>
	checkSource(file, source, { tokens });
const rules = (issues) => issues.map((issue) => issue.rule);

test('새 페이지의 정상 토큰과 자동 여백은 통과한다', () => {
	assert.deepEqual(
		css(
			'.a { font-size:var(--font-size-14); padding:0 var(--space-8); margin:auto; gap:var(--space-8); color:var(--color-text); }'
		),
		[]
	);
});
test('홀수·짝수 직접 값, clamp, 상대 단위, font 축약도 검사한다', () => {
	for (const declaration of [
		'font-size:13px',
		'font-size:14px',
		'font-size:clamp(12px,2vw,16px)',
		'font-size:.9rem',
		'font:13px/1.5 sans-serif'
	])
		assert.ok(rules(css(`.a{${declaration}}`)).includes('font'), declaration);
});
test('여백 축약·논리 속성·calc의 직접 값을 검사한다', () => {
	for (const declaration of [
		'padding:0 13px',
		'margin-inline:8px',
		'row-gap:1rem',
		'gap:calc(var(--space-8) + 3px)'
	])
		assert.ok(rules(css(`.a{${declaration}}`)).includes('spacing'), declaration);
});
test('임의 색상·important·미등록 토큰을 검사한다', () => {
	assert.ok(rules(css('.a{background:linear-gradient(#fff,rgb(0 0 0 / 20%));}')).includes('color'));
	assert.ok(rules(css('.a{color:red!important}')).includes('important'));
	assert.ok(rules(css('.a{gap:var(--space-7)}')).includes('token'));
});
test('새 컴포넌트가 공통 내부를 덮어쓰면 경고한다', () => {
	assert.ok(rules(css('.page .ui-step-number { width:30px }')).includes('override'));
	assert.deepEqual(css('.ui-step-number{width:30px}', 'src/lib/components/ui/ui.css'), []);
});
test('토큰 정의 자체의 홀수 글자와 잘못된 간격을 검사한다', () => {
	assert.ok(rules(css(':root{--font-size-13:13px}', 'src/lib/styles/tokens.css')).includes('font'));
	assert.ok(rules(css(':root{--space-6:6px}', 'src/lib/styles/tokens.css')).includes('spacing'));
});
test('Svelte 내부 CSS의 원본 파일 줄 번호를 유지한다', () => {
	const result = svelte('<p>안내</p>\n<style>\n p { font-size:13px; }\n</style>');
	assert.equal(result[0].line, 3);
});
test('인라인 스타일과 style 지시문도 검사한다', () => {
	assert.ok(rules(svelte('<div style="padding:3px">내용</div>')).includes('spacing'));
	assert.ok(rules(svelte('<div style:font-size="13px">내용</div>')).includes('font'));
	assert.ok(
		rules(
			svelte('<script>let size=13;</script><div style:font-size={`${size}px`}>내용</div>')
		).includes('dynamic')
	);
});
test('기본 버튼·모달과 일반 입력의 공통 스타일 누락을 검사한다', () => {
	assert.equal(
		rules(svelte('<button>열기</button><dialog>안내</dialog>')).filter(
			(rule) => rule === 'component'
		).length,
		2
	);
	assert.ok(rules(svelte('<input type="text" />')).includes('field'));
	assert.deepEqual(svelte('<input class="ui-field" /><input type="checkbox" />'), []);
});
test('혼합 style의 색상 선언은 위치와 따옴표에 관계없이 검사한다', () => {
	for (const property of ['color', 'background']) {
		for (const quote of ['"', "'"]) {
			for (const value of [
				`${property}:red; width:{width}px`,
				`width:{width}px; ${property}:red`
			]) {
				assert.ok(
					rules(svelte(`<div style=${quote}${value}${quote}>내용</div>`)).includes('dynamic'),
					value
				);
			}
		}
	}
	assert.deepEqual(svelte('<div style="width:{width}px">내용</div>'), []);
});
test('파일 전체 예외가 아니라 바로 다음 선언에만 예외를 적용한다', () => {
	const issues = css(
		'.a{/* ui-exception spacing: 접근성 요소를 화면 밖에 숨긴다. */margin:-1px;padding:3px}'
	);
	assert.equal(issues.filter((issue) => issue.rule === 'spacing').length, 1);
	assert.ok(rules(css('.a{/* ui-exception spacing: 짧음 */padding:3px}')).includes('spacing'));
});
test('게임 색상 예외는 지정된 파일과 표현식에만 적용한다', () => {
	const source = '<script>let marble;</script><i style:background={marble.color}></i>';
	assert.deepEqual(svelte(source, 'src/lib/marble-race/components/RankingGrid.svelte'), []);
	assert.ok(rules(svelte(source)).includes('dynamic'));
});
test('문법 오류는 검사 통과로 처리하지 않는다', () => {
	assert.ok(rules(css('.a{')).includes('syntax'));
	assert.ok(rules(svelte('<div>')).includes('syntax'));
});

test('CSS 변수의 대체 값에 숨은 직접 색상·여백도 검사한다', () => {
	assert.ok(rules(css('.a{color:var(--text, papayawhip)}')).includes('color'));
	assert.ok(rules(css('.a{padding:var(--space-8, 3px)}')).includes('spacing'));
});
test('공통 제목 내부 선택자와 동적 native 버튼도 검사한다', () => {
	assert.ok(
		rules(css('.ui-section-header h2{font-size:var(--font-size-14)}')).includes('override')
	);
	assert.ok(
		rules(svelte('<svelte:element this={"button"}>확인</svelte:element>')).includes('component')
	);
});
