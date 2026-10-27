import assert from 'node:assert/strict';
import test from 'node:test';
import guide from '../../src/lib/aram-mayhem/guide-data.json' with { type: 'json' };
import aliases from '../../docs/research/aram-mayhem/aliases.json' with { type: 'json' };
import {
	aramChampionPaths,
	championPath,
	championSeo,
	hubSeo,
	structuredData,
	withAlias
} from '../../src/lib/aram-mayhem/seo.js';

const yi = guide.champions.find((champion) => champion.id === 'master-yi');

test('별명 원본은 리그 오브 레전드 챔피언 전체와 가이드 챔피언을 모두 담는다', () => {
	// Data Dragon 16.21.1 한국어 챔피언 수. 생성 script가 이름까지 대조한다.
	assert.equal(Object.keys(aliases.champions).length, 173);
	for (const champion of guide.champions) {
		assert.ok(champion.nameKo in aliases.champions, champion.nameKo);
		assert.deepEqual(champion.aliases, aliases.champions[champion.nameKo]);
	}
	for (const [id, list] of Object.entries(aliases.augments)) {
		if (guide.augments[id]) assert.deepEqual(guide.augments[id].aliases, list);
	}
	assert.deepEqual(guide.itemAliases['꽃피는 새벽의 검'], ['새벽검']);
});

test('챔피언 공략 주소는 마지막 슬래시 없이 챔피언 id를 붙인다', () => {
	assert.equal(championPath('master-yi'), '/aram-mayhem/master-yi');
	assert.equal(aramChampionPaths().length, guide.champions.length);
	assert.equal(withAlias('신비한 주먹', ['신주']), '신비한 주먹(신주)');
	assert.equal(withAlias('검무', []), '검무');
	// 기호만 뺀 별명은 이름 뒤에 다시 붙이지 않는다.
	assert.equal(withAlias('벌이다!!!', ['벌이다', '벌']), '벌이다!!!(벌)');
	assert.equal(withAlias('벌이다!!!', ['벌이다']), '벌이다!!!');
});

test('챔피언 검색 문구에 증바람·별명·증강 별명·템트리를 넣는다', () => {
	const seo = championSeo(yi, guide);
	assert.equal(
		seo.title,
		'증바람 마스터 이(마이) 공략 · 신비한 주먹(신주) 템트리 | 칼바람 아수라장 26.21'
	);
	assert.equal(seo.heading, '증바람 마스터 이 공략');
	assert.equal(
		seo.summary,
		'기본 템트리는 징수의 총 → 무한의 대검 → 도미닉 경의 인사입니다. 신비한 주먹(신주)을 얻으면 징수의 총 → 오만 → 끝없는 갈망으로 바꿉니다.'
	);
	assert.ok(seo.description.includes('도파민'));
});

test('조사는 받침에 맞추고 아이템 별명도 괄호로 붙인다', () => {
	const lulu = championSeo(
		guide.champions.find((champion) => champion.id === 'lulu'),
		guide
	);
	assert.ok(lulu.summary.includes('황홀한 나비(황나)를 얻으면'));
	assert.ok(lulu.summary.includes('꽃피는 새벽의 검(새벽검)으로 바꿉니다.'));
	for (const champion of guide.champions) {
		const seo = championSeo(champion, guide);
		assert.ok(seo.title.startsWith(`증바람 ${champion.nameKo}`), champion.id);
		assert.doesNotMatch(seo.description, /undefined|null/, champion.id);
	}
});

test('허브 문구는 통계 티어가 아니라고 밝히고 구조화 데이터에 FAQPage를 쓰지 않는다', () => {
	const hub = hubSeo(guide);
	assert.ok(hub.title.startsWith('증바람 공략'));
	assert.ok(hub.description.includes('통계 티어가 아니라'));
	const script = structuredData({
		siteBaseUrl: 'https://example.com',
		path: '/aram-mayhem',
		title: hub.title,
		description: hub.description,
		crumbs: [{ name: '증바람 공략', path: '/aram-mayhem' }],
		champions: guide.champions
	});
	const graph = JSON.parse(script.replace(/^<script[^>]*>/, '').replace(/<\/script>$/, ''))[
		'@graph'
	];
	assert.ok(!graph.some((item) => item['@type'] === 'FAQPage'));
	const list = graph.find((item) => item['@type'] === 'ItemList');
	assert.equal(
		list.itemListElement[0].url,
		`https://example.com${championPath(guide.champions[0].id)}`
	);
});
