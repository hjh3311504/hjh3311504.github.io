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
	initials,
	isAddedSituational,
	roleOptions,
	searchChampions,
	situationalHeading,
	tileName,
	youtubeEmbedUrl
} from '../../src/lib/aram-mayhem/guide.js';

const champions = [
	{ id: 'teemo', nameKo: '티모', roles: ['마법사'] },
	{ id: 'braum', nameKo: '브라움', roles: ['탱커', '서포터'] },
	{ id: 'tahm-kench', nameKo: '탐 켄치', roles: ['탱커'] },
	{ id: 'master-yi', nameKo: '마스터 이', aliases: ['마이'], roles: ['암살자'] }
];

test('역할 목록은 가이드에 있는 역할만 정해진 순서로 보여 준다', () => {
	assert.deepEqual(roleOptions(champions), [ALL_ROLES, '마법사', '암살자', '탱커', '서포터']);
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

test('검색어는 띄어쓰기를 무시하고 별명과 초성도 찾는다', () => {
	const ids = (query) => filterChampions(champions, ALL_ROLES, query).map((c) => c.id);
	assert.deepEqual(ids('탐켄치'), ['tahm-kench']);
	assert.deepEqual(ids('마이'), ['master-yi']);
	assert.deepEqual(ids('마스터이'), ['master-yi']);
	assert.deepEqual(ids('ㅌㅁ'), ['teemo']);
	assert.deepEqual(ids('ㅁㅇ'), ['master-yi']);
	assert.equal(initials('탐 켄치'), 'ㅌㅋㅊ');
});

test('자동완성은 이름·별명이 검색어로 시작하는 챔피언을 먼저 보여 준다', () => {
	const list = [
		{ id: 'a', nameKo: '말파이트', aliases: ['말파'] },
		{ id: 'b', nameKo: '가말', aliases: [] },
		{ id: 'c', nameKo: '말자하', aliases: [] }
	];
	assert.deepEqual(
		searchChampions(list, '말').map((c) => c.id),
		['c', 'a', 'b']
	);
	assert.deepEqual(searchChampions(list, '   '), []);
	assert.equal(searchChampions(list, '말', 1).length, 1);
});

test('예전 주소의 #값은 맞는 챔피언만 찾고 모르는 값이면 없다', () => {
	assert.equal(championFromHash(champions, '#braum').id, 'braum');
	assert.equal(championFromHash(champions, '#tahm-kench').id, 'tahm-kench');
	assert.equal(championFromHash(champions, '#unknown'), undefined);
	assert.equal(championFromHash(champions, ''), undefined);
	assert.equal(championFromHash(champions, '#%E0'), undefined);
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

test('허브 타일은 긴 이름만 줄임말로 보여 준다', () => {
	assert.equal(tileName({ id: 'twisted-fate', nameKo: '트위스티드 페이트' }), '트페');
	assert.equal(tileName({ id: 'teemo', nameKo: '티모' }), '티모');
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
			// 쇠사슬 조끼 6개 빌드처럼 아이템 칸을 모두 채우는 빌드는 신발이 없다.
			for (const item of [
				...build.core,
				...(build.variant ? [] : [build.boots]),
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

test('장갑 충격 빌드가 있는 챔피언은 쇠사슬 조끼 6개 + 모루 빌드도 바로 뒤에 보여 준다', () => {
	const armored = guide.champions.filter((champion) =>
		champion.builds.some((build) => build.key === 'aug-armored-impact')
	);
	assert.equal(armored.length, 12);
	for (const champion of armored) {
		const index = champion.builds.findIndex((build) => build.key === 'aug-armored-impact');
		const vest = champion.builds[index + 1];
		assert.equal(vest.key, 'aug-armored-impact-chain-vest', champion.id);
		assert.deepEqual(vest.trigger, ['armored-impact']);
		assert.equal(vest.variant, '쇠사슬 조끼 6개');
		assert.deepEqual(vest.core, ['쇠사슬 조끼', '모루']);
		// 모루는 문장 타일과 같은 초록 모루 아이콘을 쓴다.
		assert.equal(guide.items['모루'], guide.icons.anvil);
		assert.deepEqual(vest.notes, ['6개', '반복 구매']);
		assert.equal(vest.play.length, 2);
	}
	// 기본 빌드 아래에는 마지막 아이템이 도미닉 경의 인사인 이유를 타일과 함께 보여 준다.
	const why = guide.augments['armored-impact'].guide.coreWhy;
	assert.ok(why.some((part) => part.t === 'stat' && part.v === '방어구 관통력'));
	assert.ok(why.some((part) => part.t === 'item' && part.v === '도미닉 경의 인사'));
	// 증강 공략에도 같은 템트리를 보여 준다.
	assert.deepEqual(
		guide.augments['armored-impact'].guide.builds.map((build) => build.label),
		['쇠사슬 조끼 6개']
	);
});

// 애니·우디르는 사용자 지시로 기본 빌드 1코어에만 악의를 둔다.
const MALIGNANCE_OK = new Set(['annie', 'udyr']);
const ALLOWED_BOOTS = new Set([
	'탐욕의 군화',
	'신속의 장화',
	'헤르메스의 발걸음',
	'판금 장화',
	'광전사의 군화'
]);

test('가이드 아이템 규칙: 악의(애니·우디르 1코어 제외)·피바라기 금지, 횃불·루덴은 추천 아이템 칸에 넣지 않음, 정한 신발만 추천', () => {
	for (const champion of guide.champions) {
		for (const build of champion.builds) {
			const all = [...build.core, ...build.situational.map((row) => row.item)];
			const allowed =
				MALIGNANCE_OK.has(champion.id) && build.key === 'base' && build.core[0] === '악의';
			assert.ok(!all.slice(allowed ? 1 : 0).includes('악의'), `${champion.id} 악의`);
			assert.ok(!all.includes('피바라기'), `${champion.id} 피바라기`);
			for (const row of build.situational) {
				assert.ok(
					!['어둠불꽃 횃불', '루덴의 메아리'].includes(row.item),
					`${champion.id} ${row.item}`
				);
			}
		}
		// 신발은 탐욕의 군화(기본)·신속의 장화(서포터)와 필요할 때 헤르메스의 발걸음·판금 장화·광전사의 군화만 추천한다.
		for (const boots of [
			...champion.builds.map((build) => build.boots).filter(Boolean),
			...champion.boots.map((row) => row.item)
		]) {
			assert.ok(ALLOWED_BOOTS.has(boots), `${champion.id} ${boots}`);
		}
		if (champion.roles.includes('탱커')) {
			assert.equal(champion.builds[0].core[0], '강철심장', `${champion.id} 탱커 1코어`);
		}
	}
});

test('플레이 영상은 자동 재생·소리 끔 없이 YouTube nocookie 주소로 반복한다', () => {
	const url = new URL(youtubeEmbedUrl('TXJnV9S1t8g'));
	assert.equal(url.origin, 'https://www.youtube-nocookie.com');
	assert.equal(url.pathname, '/embed/TXJnV9S1t8g');
	assert.equal(url.searchParams.get('autoplay'), null);
	assert.equal(url.searchParams.get('mute'), null);
	for (const [key, value] of [
		['loop', '1'],
		['playlist', 'TXJnV9S1t8g'],
		['playsinline', '1']
	]) {
		assert.equal(url.searchParams.get(key), value, key);
	}
});

test('카이사·말파이트 조합 카드에 플레이 영상이 있다', () => {
	const videos = guide.champions.flatMap((champion) =>
		champion.combos
			.filter((combo) => combo.playVideo)
			.map((combo) => [champion.id, combo.title, combo.playVideo])
	);
	assert.deepEqual(videos.map(([id, title, video]) => [id, title, video.youtubeId]).sort(), [
		['kaisa', 'W만으로 패시브 터트리기', 'TXJnV9S1t8g'],
		['malphite', '방어력 기반 평타', 'Vx5VH92Zd2I']
	]);
	for (const [, , video] of videos) {
		assert.match(video.youtubeId, /^[\w-]{11}$/);
		assert.match(video.aspect, /^\d+\/\d+$/);
		assert.ok(video.title);
	}
});
