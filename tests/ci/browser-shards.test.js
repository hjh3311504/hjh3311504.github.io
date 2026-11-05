import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import { collectTests, planShards, shardCount } from '../../scripts/plan_browser_shards.js';

function entry(file, title, project = 'chromium') {
	return {
		file,
		title,
		project,
		id: `${project}:${file}:${title}`,
		selector: `${file} › ${title}`
	};
}

test('새 파일과 여러 project를 포함해 모든 검사를 정확히 한 번 배치한다', () => {
	const tests = ['new.spec.js', 'other.spec.js', 'third.spec.js'].flatMap((file) =>
		['chromium', 'webkit'].flatMap((project) =>
			['하나', '둘'].map((title) => entry(file, title, project))
		)
	);
	const shards = planShards(tests);
	assert.deepEqual(
		shards.flatMap((shard) => shard.tests.map((item) => item.id)).sort(),
		tests.map((item) => item.id).sort()
	);
	assert.deepEqual(planShards(tests), shards);
	for (const item of tests) {
		assert.equal(
			shards.filter((shard) =>
				shard.tests.some((other) => other.file === item.file && other.project === item.project)
			).length,
			1
		);
	}
});

test('실제 종료를 기다리는 당첨 방식 검사는 나누고 나머지 파일 순서는 유지한다', () => {
	const races = ['첫번째', '마지막', '여러명', 'n번째'].map((mode) =>
		entry('marble-race.spec.js', `${mode}: 중복 이름을 별도 구슬로 처리하고 최종 당첨자를 표시한다`)
	);
	const rest = [entry('marble-race.spec.js', '소리 준비'), entry('marble-race.spec.js', '초기화')];
	const shards = planShards([...rest, ...races]);
	assert.ok(shards.filter((shard) => shard.tests.some((item) => races.includes(item))).length > 1);
	assert.ok(shards.some((shard) => rest.every((item) => shard.tests.includes(item))));
	assert.ok(Math.max(...shards.map((shard) => shard.seconds)) < 150);
	assert.throws(() => planShards(rest, 0));
});

test('같은 줄에서 만든 여러 검사와 중첩 제목·project를 구분한다', () => {
	const report = {
		suites: [
			{
				title: 'race.spec.js',
				line: 0,
				suites: [
					{
						title: '경기',
						line: 1,
						specs: ['처음', '마지막'].map((title) => ({
							id: title,
							file: 'race.spec.js',
							line: 5,
							title,
							tests: [{ projectName: 'chromium' }, { projectName: 'webkit' }]
						}))
					}
				]
			}
		]
	};
	const tests = collectTests(report);
	assert.equal(tests.length, 4);
	assert.equal(new Set(tests.map((item) => item.id)).size, 4);
	assert.equal(tests[0].selector, '[chromium] › race.spec.js › 경기 › 처음');
	assert.equal(tests[3].selector, '[webkit] › race.spec.js › 경기 › 마지막');
});

test('workflow의 browser matrix는 배치 스크립트의 분할 수와 같다', () => {
	const workflow = readFileSync('.github/workflows/pages.yml', 'utf8');
	const matrix = workflow.match(/^\s+shard: \[([\d, ]+)\]$/m);
	assert.ok(matrix, 'browser matrix를 찾지 못했습니다.');
	assert.deepEqual(
		matrix[1].split(',').map(Number),
		Array.from({ length: shardCount }, (_, index) => index + 1)
	);
});
