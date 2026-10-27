import assert from 'node:assert/strict';
import test from 'node:test';
import guide from '../../src/lib/aram-mayhem/guide-data.json' with { type: 'json' };
import aliases from '../../docs/research/aram-mayhem/aliases.json' with { type: 'json' };
import {
	AUGMENT_PAGE_IDS,
	aramAugmentPaths,
	aramChampionPaths,
	augmentSeo,
	championList,
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

test('챔피언 제목은 증바람·별명만 쓰고 증강·템트리·패치는 검색 설명에 넣는다', () => {
	const seo = championSeo(yi, guide);
	assert.equal(seo.title, '증바람 마스터 이(마이) 공략');
	assert.equal(seo.heading, '증바람 마스터 이 공략');
	assert.equal(
		seo.summary,
		'기본 템트리는 징수의 총 → 무한의 대검 → 도미닉 경의 인사입니다. 신비한 주먹(신주)을 얻으면 징수의 총 → 오만 → 끝없는 갈망으로 바꿉니다.'
	);
	// 검색 결과는 설명 앞부분만 보여 주므로 챔피언 이름과 템트리로 시작한다.
	assert.equal(
		seo.description,
		`증바람 마스터 이(마이) ${seo.summary} 칼바람 아수라장 26.21 패치 기준이며 통계 티어가 아닌 도파민 빌드입니다.`
	);
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
		list: championList(guide.champions)
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

test('증강 공략 문구는 증강 별명·어울리는 챔피언·공통 템트리를 담는다', () => {
	assert.deepEqual(aramAugmentPaths(), [
		'/aram-mayhem/augments/armored-impact',
		'/aram-mayhem/augments/bees'
	]);
	const armored = augmentSeo('armored-impact', guide);
	assert.equal(armored.title, '증바람 장갑 충격(장충) 공략');
	assert.equal(armored.heading, '증바람 장갑 충격 공략');
	assert.deepEqual(
		armored.entries.map(({ champion }) => champion.id),
		['rammus', 'leona', 'malphite', 'braum', 'sett', 'jax', 'taric', 'trundle']
	);
	// 장갑 충격은 모든 챔피언이 같은 고정 빌드를 쓰므로 템트리를 검색 설명에 넣는다.
	assert.deepEqual(armored.core, [
		'가시 갑옷',
		'해신 작쇼',
		'얼어붙은 심장',
		'란두인의 예언',
		'도미닉 경의 인사'
	]);
	assert.ok(
		armored.description.startsWith('증바람 장갑 충격(장충) 템트리는 가시 갑옷 → 해신 작쇼')
	);

	const bees = augmentSeo('bees', guide);
	assert.equal(bees.title, '증바람 벌이다!!!(벌) 공략');
	assert.equal(bees.core, undefined);
	assert.ok(
		bees.description.startsWith(
			'증바람 벌이다!!!(벌) 증강과 어울리는 챔피언은 바루스·바이·볼리베어·브라움·카이사·탐 켄치·티모·피즈 8명'
		)
	);
	// 증강 페이지 목록은 직접 적은 값이므로 데이터에 그 증강과 어울리는 챔피언이 있는지 확인한다.
	for (const id of AUGMENT_PAGE_IDS) {
		assert.ok(guide.augments[id], id);
		const seo = augmentSeo(id, guide);
		assert.ok(seo.entries.length > 0, id);
		assert.ok(seo.description.includes('도파민'), id);
	}
});
