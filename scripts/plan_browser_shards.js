import { spawnSync } from 'node:child_process';
import { mkdirSync, writeFileSync } from 'node:fs';
import { pathToFileURL } from 'node:url';

// PR 실행 41975981116의 파일별 초. 따로 나누는 긴 경기 검사는 빼고 셌다.
// 배치에만 쓰며 검사 조건에는 영향을 주지 않는다. 표에 없는 파일은 검사 1개당 5초로 본다.
export const measuredSeconds = {
	'analytics.spec.js': 15.7,
	'app-update.spec.js': 3.6,
	'aram-mayhem.spec.js': 22.9,
	'bracket.spec.js': 44.4,
	'button-states.spec.js': 34.5,
	'footer.spec.js': 7.6,
	'home-spacing.spec.js': 4.1,
	'marble-celebration.spec.js': 7.3,
	'marble-element-skills.spec.js': 20.3,
	'marble-expansion.spec.js': 20.1,
	'marble-focus.spec.js': 3.6,
	'marble-improvements.spec.js': 54,
	'marble-last-winner.spec.js': 33.3,
	'marble-no-respawn.spec.js': 7.9,
	'marble-pins.spec.js': 26.4,
	'marble-preview.spec.js': 5.1,
	'marble-race.spec.js': 80,
	'marble-rebound.spec.js': 10.6,
	'marble-render-worker.spec.js': 7.2,
	'marble-rendering.spec.js': 39.6,
	'marble-result-reset.spec.js': 44,
	'marble-skills.spec.js': 34.8,
	'marble-start-positions.spec.js': 1.2,
	'marble-visibility.spec.js': 10.2,
	'marble-winner-range.spec.js': 7.4,
	'navigation.spec.js': 5.3,
	'site-assets.spec.js': 4.5,
	'stats-images.spec.js': 1.5,
	'team-maker.spec.js': 75.2,
	'ui-consistency.spec.js': 12.1,
	'wheel-audio.spec.js': 21.7
};
// 2배속으로 진행하는 긴 경기 검사 1개의 예상 초.
const longRaceSeconds = 32;

export function collectTests(report) {
	const tests = [];
	function visit(suite, titles = []) {
		const nested = suite.line === 0 ? titles : [...titles, suite.title];
		for (const spec of suite.specs ?? []) {
			for (const test of spec.tests) {
				tests.push({
					id: `${spec.id}:${test.projectName}`,
					file: spec.file,
					title: spec.title,
					project: test.projectName,
					selector: [`[${test.projectName}]`, spec.file, ...nested, spec.title].join(' › ')
				});
			}
		}
		for (const child of suite.suites ?? []) visit(child, nested);
	}
	for (const suite of report.suites) visit(suite);
	return tests;
}

export function planShards(tests, count = 4) {
	if (!Number.isInteger(count) || count < 1) throw new Error('분할 수는 양의 정수여야 합니다.');
	const files = new Map();
	for (const test of tests) {
		const key = `${test.project}:${test.file}`;
		if (!files.has(key)) files.set(key, []);
		files.get(key).push(test);
	}
	const groups = [];
	for (const fileTests of files.values()) {
		// 이4개는 beforeEach에서 새 page·녹음을 준비하고 공유 상태 없이 전체 경기를 진행한다.
		// 나머지 파일은 순서와 beforeAll/afterAll 실행 범위를 유지한다.
		const longRaces = fileTests.filter(
			(test) =>
				test.file === 'marble-race.spec.js' &&
				test.title.endsWith(': 중복 이름을 별도 구슬로 처리하고 최종 당첨자를 표시한다')
		);
		for (const test of longRaces) groups.push({ tests: [test], seconds: longRaceSeconds });
		const rest = fileTests.filter((test) => !longRaces.includes(test));
		if (rest.length) {
			groups.push({
				tests: rest,
				seconds: measuredSeconds[fileTests[0].file] ?? rest.length * 5
			});
		}
	}
	const shards = Array.from({ length: count }, () => ({ tests: [], seconds: 0 }));
	groups.sort(
		(a, b) => b.seconds - a.seconds || a.tests[0].selector.localeCompare(b.tests[0].selector, 'en')
	);
	for (const group of groups) {
		const shard = shards.reduce((best, candidate) =>
			candidate.seconds < best.seconds ? candidate : best
		);
		shard.tests.push(...group.tests);
		shard.seconds += group.seconds;
	}
	return shards;
}

function listTests(args) {
	const result = spawnSync(
		process.execPath,
		['node_modules/@playwright/test/cli.js', 'test', '--list', '--reporter=json', ...args],
		{ encoding: 'utf8' }
	);
	if (result.status !== 0)
		throw new Error(result.stderr || result.stdout || '검사 목록을 읽지 못했습니다.');
	return collectTests(JSON.parse(result.stdout));
}

function main() {
	const all = listTests(['--test-list-invert', 'tests/team-maker-e2e/marble-priority.txt']);
	if (!all.length) throw new Error('분할할 브라우저 검사가 없습니다.');
	const unmeasured = [...new Set(all.map((test) => test.file))].filter(
		(file) => !(file in measuredSeconds)
	);
	// 새 파일도 배치는 되지만 시간 차이가 커질 수 있어 표 갱신을 알린다.
	if (unmeasured.length) console.warn(`실측 시간이 없는 파일: ${unmeasured.join(', ')}`);
	const shards = planShards(all);
	const directory = 'output/playwright/shards';
	mkdirSync(directory, { recursive: true });
	const selected = [];
	for (const [index, shard] of shards.entries()) {
		const path = `${directory}/${index + 1}.txt`;
		writeFileSync(path, shard.tests.map((test) => test.selector).join('\n') + '\n');
		const actual = listTests(['--test-list', path]);
		const expected = shard.tests.map((test) => test.id).sort();
		if (JSON.stringify(actual.map((test) => test.id).sort()) !== JSON.stringify(expected)) {
			throw new Error(`${index + 1}번 분할의 실제 선택 목록이 계획과 다릅니다.`);
		}
		selected.push(...actual.map((test) => test.id));
		console.log(
			`${index + 1}번: ${actual.length}개, 이전 실행 기준 약 ${shard.seconds.toFixed(1)}초`
		);
	}
	if (new Set(selected).size !== all.length || selected.length !== all.length) {
		throw new Error('분할 검사에 중복 또는 누락이 있습니다.');
	}
	console.log(`전체 ${all.length}개를 중복·누락 없이 배치했습니다.`);
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) main();
