import assert from 'node:assert/strict';
import test from 'node:test';
import guide from '../../src/lib/aram-mayhem/guide-data.json' with { type: 'json' };
import {
	ALL_ROLES,
	augmentGroups,
	buildLabel,
	championFromHash,
	coreMarks,
	filterChampions,
	isAddedSituational,
	roleOptions,
	situationalHeading
} from '../../src/lib/aram-mayhem/guide.js';

const champions = [
	{ id: 'teemo', nameKo: '티모', roles: ['마법사'] },
	{ id: 'braum', nameKo: '브라움', roles: ['탱커', '서포터'] },
	{ id: 'tahm-kench', nameKo: '탐 켄치', roles: ['탱커'] }
];

test('역할 목록은 가이드에 있는 역할만 정해진 순서로 보여 준다', () => {
	assert.deepEqual(roleOptions(champions), [ALL_ROLES, '마법사', '탱커', '서포터']);
});

test('역할과 이름 검색어로 챔피언을 거른다', () => {
	assert.deepEqual(
		filterChampions(champions, '탱커', '').map((c) => c.id),
		['braum', 'tahm-kench']
	);
	assert.deepEqual(
		filterChampions(champions, ALL_ROLES, ' 켄치 ').map((c) => c.id),
		['tahm-kench']
	);
	assert.deepEqual(filterChampions(champions, '마법사', '브라움'), []);
});

test('주소의 #값으로 챔피언을 고르고 모르는 값이면 첫 챔피언을 보여 준다', () => {
	assert.equal(championFromHash(champions, '#braum').id, 'braum');
	assert.equal(championFromHash(champions, '#tahm-kench').id, 'tahm-kench');
	assert.equal(championFromHash(champions, '#unknown').id, 'teemo');
	assert.equal(championFromHash(champions, '').id, 'teemo');
	assert.equal(championFromHash(champions, '#%E0').id, 'teemo');
});

test('빌드 탭 이름은 기본 빌드 스타일이나 증강 이름을 쓴다', () => {
	const augments = { bees: { nameKo: '벌이다!!!' }, archmage: { nameKo: '대마법사' } };
	assert.equal(buildLabel({ style: '탱커' }, augments), '기본 빌드 · 탱커');
	assert.equal(buildLabel({ style: '' }, augments), '기본 빌드');
	assert.equal(buildLabel({ trigger: ['bees', 'archmage'] }, augments), '벌이다!!! + 대마법사');
});

test('증강 빌드가 기본 코어를 유지하면 추가, 바꾸면 변경으로 표시한다', () => {
	const base = { core: ['A', 'B', 'C'], situational: [{ item: 'D' }] };
	assert.deepEqual(coreMarks({ core: ['A', 'B', 'C', 'X'] }, base), ['', '', '', '추가']);
	assert.deepEqual(coreMarks({ core: ['A', 'X', 'Y'] }, base), ['', '변경', '변경']);
	assert.deepEqual(coreMarks(base, base), ['', '', '']);
	assert.deepEqual(coreMarks({ core: ['X'] }, null), ['']);
});

test('기본 빌드에 없는 추천 아이템만 추가로 표시한다', () => {
	const base = { core: [], situational: [{ item: 'D' }] };
	const build = { core: [], situational: [{ item: 'D' }, { item: 'E' }] };
	assert.equal(isAddedSituational({ item: 'D' }, base, build), false);
	assert.equal(isAddedSituational({ item: 'E' }, base, build), true);
	assert.equal(isAddedSituational({ item: 'E' }, null, build), false);
});

test('추천 아이템 제목은 코어 개수에 맞춘다', () => {
	assert.equal(situationalHeading(3), '3코어 이후 추천 아이템');
	assert.equal(situationalHeading(5), '6코어부터 추천 아이템');
});

test('조합 증강은 필수 증강 다음 선택 증강 순서로 나눈다', () => {
	assert.deepEqual(augmentGroups({ augmentIds: ['a', 'b', 'c'], required: ['b'] }), {
		required: ['b'],
		optional: ['a', 'c']
	});
});

test('생성된 가이드 데이터는 참조가 모두 연결되어 있다', () => {
	assert.ok(guide.champions.length > 0);
	const ids = new Set();
	for (const champion of guide.champions) {
		assert.ok(!ids.has(champion.id), `중복 챔피언 ${champion.id}`);
		ids.add(champion.id);
		assert.ok(champion.icon, `${champion.id} 아이콘`);
		assert.ok(champion.builds.length > 0, `${champion.id} 빌드`);
		assert.equal(champion.builds[0].key, 'base');
		for (const build of champion.builds) {
			for (const item of [
				...build.core,
				build.boots,
				...build.situational.map((row) => row.item)
			]) {
				assert.ok(guide.items[item], `${champion.id} 아이템 ${item}`);
			}
			for (const id of build.trigger ?? []) assert.ok(guide.augments[id], `${champion.id} ${id}`);
			for (const key of build.skillOrder) assert.ok(champion.skills[key], `${champion.id} ${key}`);
		}
		for (const boot of champion.boots)
			assert.ok(guide.items[boot.item], `${champion.id} ${boot.item}`);
		for (const combo of champion.combos) {
			for (const id of combo.augmentIds) assert.ok(guide.augments[id], `${champion.id} ${id}`);
			for (const part of [...combo.why, ...combo.steps.flat()]) {
				if (part.t === 'skill') assert.ok(champion.skills[part.key], `${champion.id} ${part.key}`);
				if (part.t === 'aug') assert.ok(guide.augments[part.id], `${champion.id} ${part.id}`);
				if (part.t === 'item') assert.ok(guide.items[part.v], `${champion.id} ${part.v}`);
			}
			for (const source of combo.sources) {
				assert.match(source.url, /^https:\/\/(gall\.dcinside\.com|youtu\.be|www\.youtube\.com)\//);
			}
		}
		for (const id of [...champion.good, ...champion.avoid]) assert.ok(guide.augments[id], id);
	}
});

test('가이드 아이템 규칙: 악의·피바라기 금지, 횃불·루덴은 추천 아이템 칸에 넣지 않음', () => {
	for (const champion of guide.champions) {
		for (const build of champion.builds) {
			const all = [...build.core, ...build.situational.map((row) => row.item)];
			assert.ok(!all.includes('악의'), `${champion.id} 악의`);
			assert.ok(!all.includes('피바라기'), `${champion.id} 피바라기`);
			for (const row of build.situational) {
				assert.ok(
					!['어둠불꽃 횃불', '루덴의 메아리'].includes(row.item),
					`${champion.id} ${row.item}`
				);
			}
		}
		if (champion.roles.includes('탱커')) {
			assert.equal(champion.builds[0].core[0], '강철심장', `${champion.id} 탱커 1코어`);
		}
	}
});
