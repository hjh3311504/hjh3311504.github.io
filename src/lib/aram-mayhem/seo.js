// 아수라장 가이드의 검색 문구. 허브·챔피언·증강 페이지, build 검사, 단위 테스트가 함께 사용한다.
// "증바람"은 증강 칼바람(아수라장)을 부르는 말이다. 별명은 docs/research/aram-mayhem/aliases.json에서 온다.

import guideData from './guide-data.json' with { type: 'json' };

export const HUB_PATH = '/aram-mayhem';
export const championPath = (id) => `${HUB_PATH}/${id}`;
/** sitemap과 공개 경로 목록에 넣을 챔피언 공략 주소. */
export const aramChampionPaths = (guide = guideData) =>
	guide.champions.map((champion) => championPath(champion.id));

/** 증강 공략 페이지를 만드는 증강. 증강 이름으로 많이 검색하는 것만 고른다. */
export const AUGMENT_PAGE_IDS = ['armored-impact', 'bees'];
export const augmentPath = (id) => `${HUB_PATH}/augments/${id}`;
export const aramAugmentPaths = () => AUGMENT_PAGE_IDS.map(augmentPath);

/** 글자·숫자만 남긴다. '벌이다!!!'와 별명 '벌이다'를 같은 이름으로 본다. */
const bare = (text) => text.replace(/[^\p{L}\p{N}]/gu, '');
/** 이름과 달라 보이는 첫 별명. 이름에서 기호만 뺀 별명은 건너뛴다. */
export const displayAlias = (name, aliases = []) =>
	aliases.find((alias) => bare(alias) !== bare(name));

/** '신비한 주먹(신주)'처럼 별명을 괄호로 붙인다. 붙일 별명이 없으면 이름만 쓴다. */
export const withAlias = (name, aliases = []) => {
	const alias = displayAlias(name, aliases);
	return alias ? `${name}(${alias})` : name;
};

const itemName = (guide, name) => withAlias(name, guide.itemAliases?.[name]);
const itemOrder = (guide, items) => items.map((name) => itemName(guide, name)).join(' → ');
const augmentName = (guide, id) => withAlias(guide.augments[id].nameKo, guide.augments[id].aliases);
const augmentNames = (guide, ids) => ids.map((id) => augmentName(guide, id)).join(' + ');

/** 끝 글자의 받침 번호. 받침이 없거나 한글이 아니면 0이다. 괄호 안 별명은 읽지 않는다. */
function finalConsonant(word) {
	const code = (word.replace(/\([^)]*\)$/, '').at(-1) ?? '').charCodeAt(0) - 0xac00;
	return code >= 0 && code < 11172 ? code % 28 : 0;
}
/** 을/를을 붙인다. */
const object = (word) => `${word}${finalConsonant(word) ? '을' : '를'}`;
/** 로/으로를 붙인다. ㄹ 받침(8번) 뒤에는 '로'다. */
const toward = (word) => `${word}${[0, 8].includes(finalConsonant(word)) ? '로' : '으로'}`;

/** 챔피언 공략의 기본 빌드와 증강 빌드를 나눈다. */
function splitBuilds(champion) {
	return {
		base: champion.builds.filter((build) => !build.trigger),
		augmented: champion.builds.filter((build) => build.trigger)
	};
}

export function hubSeo(guide) {
	const count = guide.champions.length;
	return {
		title: `증바람 공략 | 칼바람 아수라장 챔피언별 증강·템트리 (${guide.patch})`,
		heading: '증바람 공략',
		description: `증바람(칼바람 아수라장) ${guide.patch} 패치 기준 챔피언 ${count}명의 증강 조합과 템트리를 정리했습니다. 통계 티어가 아니라 재밌다고 알려진 도파민 빌드 모음입니다.`,
		intro: '통계 티어 대신 재밌다고 알려진 칼바람 아수라장 챔피언별 증강·템트리를 모았어요.'
	};
}

export function championSeo(champion, guide) {
	const name = champion.nameKo;
	const label = withAlias(name, champion.aliases);
	const { base, augmented } = splitBuilds(champion);
	const firstAugmented = augmented[0];
	const baseText = `기본 템트리는 ${itemOrder(guide, base[0].core)}입니다.`;
	const augmentedText = firstAugmented
		? ` ${object(augmentNames(guide, firstAugmented.trigger))} 얻으면 ${toward(itemOrder(guide, firstAugmented.core))} 바꿉니다.`
		: '';
	const summary = `${baseText}${augmentedText}`;

	// 제목은 검색어 그대로 짧게 두고, 템트리·증강·패치는 검색 설명에 넣는다.
	// 검색 결과는 설명 앞부분만 보여 주므로 챔피언 이름과 템트리를 맨 앞에 둔다.
	return {
		title: `증바람 ${label} 공략`,
		heading: `증바람 ${name} 공략`,
		description: `증바람 ${label} ${summary} 칼바람 아수라장 ${guide.patch} 패치 기준이며 통계 티어가 아닌 도파민 빌드입니다.`,
		summary
	};
}

/** 이 증강을 쓰는 조합이 있는 챔피언. 그 조합과 이 증강으로 바꾸는 빌드를 함께 돌려준다. */
export function augmentChampions(guide, id) {
	return guide.champions.flatMap((champion) => {
		const combos = champion.combos.filter((combo) => combo.augmentIds.includes(id));
		if (!combos.length) return [];
		return [{ champion, combos, build: champion.builds.find((b) => b.trigger?.includes(id)) }];
	});
}

/** 모든 챔피언이 같은 템트리를 쓰면(장갑 충격 고정 빌드) 그 템트리. 다르면 undefined다. */
function sharedCore(entries) {
	const builds = entries.map((entry) => entry.build).filter(Boolean);
	if (!builds.length || builds.length !== entries.length) return undefined;
	const first = builds[0].core.join('|');
	return builds.every((build) => build.core.join('|') === first) ? builds[0].core : undefined;
}

export function augmentSeo(id, guide) {
	const augment = guide.augments[id];
	const label = withAlias(augment.nameKo, augment.aliases);
	const entries = augmentChampions(guide, id);
	const names = entries.map(({ champion }) => champion.nameKo).join('·');
	const core = sharedCore(entries);
	// 템트리와 어울리는 챔피언을 앞에 둔다. 증강 효과는 본문에서 보여 준다.
	const lead = core
		? `증바람 ${label} 템트리는 ${itemOrder(guide, core)}입니다. 어울리는 챔피언은`
		: `증바람 ${label} 증강과 어울리는 챔피언은`;
	return {
		title: `증바람 ${label} 공략`,
		heading: `증바람 ${augment.nameKo} 공략`,
		description: `${lead} ${names} ${entries.length}명입니다. 칼바람 아수라장 ${guide.patch} 패치 기준이며 통계 티어가 아닌 도파민 빌드입니다.`,
		entries,
		core
	};
}

/** 구조화 데이터의 챔피언 공략 목록. 허브와 증강 공략이 함께 쓴다. */
export const championList = (champions, name = '증바람 챔피언별 공략') => ({
	name,
	items: champions.map((c) => ({ name: `증바람 ${c.nameKo} 공략`, path: championPath(c.id) }))
});

/**
 * JSON-LD 구조화 데이터. FAQPage는 쓰지 않는다(REQ-SEO-001).
 * list: 허브의 챔피언 공략 목록이나 증강 페이지의 챔피언 목록. { name, items: [{ name, path }] }
 */
export function structuredData({ siteBaseUrl, path, title, description, crumbs, list }) {
	const url = `${siteBaseUrl}${path}`;
	const graph = [
		{
			'@type': 'WebSite',
			'@id': `${siteBaseUrl}/#website`,
			url: `${siteBaseUrl}/`,
			name: "Lake's develog",
			inLanguage: 'ko-KR'
		},
		{
			'@type': 'WebPage',
			'@id': `${url}#webpage`,
			url,
			name: title,
			description,
			inLanguage: 'ko-KR',
			isPartOf: { '@id': `${siteBaseUrl}/#website` },
			about: { '@type': 'VideoGame', name: '리그 오브 레전드', alternateName: 'League of Legends' },
			breadcrumb: { '@id': `${url}#breadcrumb` }
		},
		{
			'@type': 'BreadcrumbList',
			'@id': `${url}#breadcrumb`,
			itemListElement: crumbs.map((crumb, index) => ({
				'@type': 'ListItem',
				position: index + 1,
				name: crumb.name,
				item: `${siteBaseUrl}${crumb.path}`
			}))
		}
	];
	if (list) {
		graph.push({
			'@type': 'ItemList',
			'@id': `${url}#champions`,
			name: list.name,
			itemListElement: list.items.map((item, index) => ({
				'@type': 'ListItem',
				position: index + 1,
				name: item.name,
				url: `${siteBaseUrl}${item.path}`
			}))
		});
	}
	const json = JSON.stringify({ '@context': 'https://schema.org', '@graph': graph });
	return `<script type="application/ld+json">${json.replaceAll('<', '\\u003c')}<` + '/script>';
}
