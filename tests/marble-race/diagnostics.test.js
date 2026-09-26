import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import { instrumentMarbleCode } from '../team-maker-e2e/helpers/marble-diagnostics.js';

test('압축 코드 계측은 다섯 계산 구간의 반환값과 예외를 보존한다', () => {
	const original = `
function step(dt) { if(dt<0)throw Error(\`물리 계산 간격은 1/60초 이하여야 합니다.\`); return dt*2; }
const encode = value => { return {blockChanges:value}; };
const decode = value => { if(!value)throw Error('경기 준비 정보가 없어요.');return value; };
function render(bounds = {getBoundingClientRect(){return 1}}) {return '출발'+bounds.getBoundingClientRect();}
const display = {sample(value){return value+1}};
function label(){return '출발'}
({step,encode,decode,render,display,label});`;
	const result = instrumentMarbleCode(original);
	assert.deepEqual(result.stages.sort(), ['decode', 'encode', 'physics', 'presentation', 'render']);
	let now = 0;
	const costs = [];
	const functions = vm.runInNewContext(result.source, {
		performance: { now: () => ++now },
		__recordMarbleCost: (name, ms) => costs.push({ name, ms })
	});
	assert.equal(functions.step(2), 4);
	assert.throws(() => functions.step(-1), /물리 계산 간격/);
	assert.equal(functions.encode(3).blockChanges, 3);
	assert.equal(functions.decode(4), 4);
	assert.throws(() => functions.decode(null), /경기 준비 정보/);
	assert.equal(functions.render(), '출발1');
	assert.equal(functions.display.sample(5), 6);
	assert.equal(functions.label(), '출발');
	assert.equal(costs.length, 7);
	assert.ok(costs.every((cost) => cost.ms === 1));
});

test('계측 대상이 없는 코드는 그대로 전달한다', () => {
	const source = 'const value = 1;';
	assert.deepEqual(instrumentMarbleCode(source), { source, stages: [] });
});
