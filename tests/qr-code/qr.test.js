import test from 'node:test';
import assert from 'node:assert/strict';
import {
	validateContent,
	validateSingleLine,
	createQrGeometry,
	parseBookmarks,
	downloadName
} from '../../src/lib/qr-code/qr.js';
import { limitTitle, titleCharacters, validTitle } from '../../src/lib/qr-code/title-input.js';

test('제목 10자 제한은 이모지와 결합 글자, 공백을 글자 단위로 센다', () => {
	for (const character of ['한', 'A', ' ', '😀', '👨‍👩‍👧‍👦', 'e\u0301', '한']) {
		assert.equal(titleCharacters(character.repeat(10)).length, 10);
		assert.equal(validTitle(character.repeat(10)), true);
		assert.equal(validTitle(character.repeat(11)), false);
		assert.equal(limitTitle(character.repeat(11)), character.repeat(10));
	}
	assert.equal(validTitle(''), true);
	assert.equal(validTitle('첫 줄\n둘째 줄'), false);
	assert.equal(limitTitle('첫 줄\n둘째 줄'), '첫 줄둘째 줄');
	const emoji = { title: '😀'.repeat(10), content: 'https://example.com' };
	assert.deepEqual(parseBookmarks(JSON.stringify([emoji, { ...emoji, title: '한'.repeat(11) }])), [
		emoji
	]);
});

test('QR 용량은 문자 수가 아닌 UTF-8 크기로 제한한다', () => {
	assert.equal(validateContent('a'.repeat(1800)), '');
	assert.equal(validateContent('한'.repeat(600)), '');
	assert.equal(validateContent('😀'.repeat(450)), '');
	for (const input of ['a'.repeat(1801), '한'.repeat(601), '😀'.repeat(451), ' \n\t '])
		assert.notEqual(validateContent(input), '');
});

test('주소의 줄바꿈은 QR 생성과 북마크 복원에서 거절한다', () => {
	for (const separator of ['\n', '\r', '\r\n', '\u2028', '\u2029']) {
		const content = `https://example.com/${separator}자료`;
		assert.match(validateSingleLine(content), /줄바꿈/);
		assert.match(validateContent(content), /줄바꿈/);
		assert.throws(() => createQrGeometry(content), /줄바꿈/);
		assert.deepEqual(parseBookmarks(JSON.stringify([{ content, title: '자료' }])), []);
	}
	assert.equal(validateSingleLine('https://example.com/한글?q=😀'), '');
	assert.equal(validateSingleLine('https://example.com/?q=%0A'), '');
});

test('긴 주소는 자르지 않고 전체 UTF-8 용량을 검사한다', () => {
	const prefix = 'https://example.com/';
	const boundary = prefix + 'a'.repeat(1800 - prefix.length);
	assert.equal(validateContent(boundary), '');
	assert.match(validateContent(boundary + 'a'), /너무 깁니다/);
	assert.throws(() => createQrGeometry(boundary + 'a'), /너무 깁니다/);
});

test('북마크 복원은 손상된 항목을 제외하고 유효한 내용을 보존한다', () => {
	const item = {
		title: '수업 자료',
		content: 'https://example.com/한글?q=😀',
		extra: '제거할 필드'
	};
	const raw = JSON.stringify([
		null,
		{},
		{ title: 3, content: 'a' },
		{ title: 'a', content: ' ' },
		item
	]);
	assert.deepEqual(parseBookmarks(raw), [{ title: item.title, content: item.content }]);
	assert.deepEqual(parseBookmarks(null), []);
	assert.throws(() => parseBookmarks('{손상'));
	assert.throws(() => parseBookmarks('{}'));
	assert.equal(parseBookmarks(JSON.stringify(Array(40).fill(item))).length, 30);
});

test('다운로드 이름에 경로나 제어 문자를 넣을 수 없고 제목이 없어도 저장한다', () => {
	assert.equal(downloadName(''), 'qr-code.png');
	assert.equal(downloadName(' 수업 자료 '), '수업 자료.png');
	assert.equal(downloadName('../자료\n:1'), '.._자료__1.png');
	assert.equal(downloadName('...'), 'qr-code.png');
});
