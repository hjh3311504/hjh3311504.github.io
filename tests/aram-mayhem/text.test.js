import assert from 'node:assert/strict';
import test from 'node:test';
import { fixParticle, fixParticles, segment } from '../../src/lib/aram-mayhem/text.js';

const names = { augmentNames: ['대마법사', '순수주의자 - 마법사'], itemNames: ['몰락한 왕의 검'] };

test('문장을 스킬·증강·아이템·능력치 조각으로 나눈다', () => {
	assert.deepEqual(segment('대마법사와 Q로 몰락한 왕의 검을 사고 모루로 스킬 가속', names), [
		{ t: 'aug', v: '대마법사' },
		{ t: 'text', v: '와 ' },
		{ t: 'skill', key: 'Q' },
		{ t: 'text', v: '로 ' },
		{ t: 'item', v: '몰락한 왕의 검' },
		{ t: 'text', v: '을 사고 ' },
		{ t: 'anvil', v: '모루' },
		{ t: 'text', v: '로 ' },
		{ t: 'stat', v: '스킬 가속' }
	]);
});

test('방어구 관통력·마법 관통력도 능력치 타일로 나눈다', () => {
	assert.deepEqual(segment('방어구 관통력과 마법 관통력', names), [
		{ t: 'stat', v: '방어구 관통력' },
		{ t: 'text', v: '과 ' },
		{ t: 'stat', v: '마법 관통력' }
	]);
});

test('대괄호 스킬은 키만, 궁극기는 R로, 짧은 증강 이름은 원래 증강으로 연결한다', () => {
	assert.deepEqual(segment('[E] 궁극기 순수주의자', names), [
		{ t: 'skill', key: 'E', short: true },
		{ t: 'text', v: ' ' },
		{ t: 'skill', key: 'R' },
		{ t: 'text', v: ' ' },
		{ t: 'aug', v: '순수주의자 - 마법사', label: '순수주의자' }
	]);
});

test('영어 단어 안의 Q·W·E·R은 스킬로 보지 않는다', () => {
	assert.deepEqual(segment('ER 애쉬', names), [{ t: 'text', v: 'ER 애쉬' }]);
});

test('스킬 이름의 받침에 맞춰 뒤 조사를 고친다', () => {
	assert.equal(fixParticle('질풍검', '로 밀어내세요'), '으로 밀어내세요');
	assert.equal(fixParticle('매 날리기', '을 쓰세요'), '를 쓰세요');
	assert.equal(fixParticle('혀 채찍', '와 함께'), '과 함께');
	assert.equal(fixParticle('얼음 기둥', '이 서면'), '이 서면');
	assert.equal(fixParticle('빠직!', '은 강해요'), '은 강해요');
	assert.equal(fixParticle('무한의 검', '로 쓰세요'), '으로 쓰세요');
	assert.equal(fixParticle('바람의 벽', '를 세워'), '을 세워');
	// ㄹ 받침 뒤에는 '로'를 쓴다.
	assert.equal(fixParticle('혹한의 발', '으로 막아'), '로 막아');
	// 조사 뒤에 한글이 이어지면 다른 낱말이라 고치지 않는다.
	assert.equal(fixParticle('질풍검', '로봇'), '로봇');
});

test('이름 없이 키만 보여 주는 스킬 뒤 조사는 고치지 않는다', () => {
	const skills = { E: { name: '매 날리기' } };
	assert.deepEqual(
		fixParticles(
			[
				{ t: 'skill', key: 'E' },
				{ t: 'text', v: '을 써요' },
				{ t: 'skill', key: 'E', short: true },
				{ t: 'text', v: '을 써요' }
			],
			skills
		).map((part) => part.v),
		[undefined, '를 써요', undefined, '을 써요']
	);
});
