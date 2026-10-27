// 아수라장 가이드의 검색 문구. 허브와 챔피언 페이지, build 검사, 단위 테스트가 함께 사용한다.
// "증바람"은 증강 칼바람(아수라장)을 부르는 말이다. 별명은 docs/research/aram-mayhem/aliases.json에서 온다.

import guideData from './guide-data.json' with { type: 'json' };

export const HUB_PATH = '/aram-mayhem';
export const championPath = (id) => `${HUB_PATH}/${id}`;
/** sitemap과 공개 경로 목록에 넣을 챔피언 공략 주소. */
export const aramChampionPaths = (guide = guideData) =>
	guide.champions.map((champion) => championPath(champion.id));

/** 글자·숫자만 남긴다. '벌이다!!!'와 별명 '벌이다'를 같은 이름으로 본다. */
const bare = (text) => text.replace(/[^\p{L}\p{N}]/gu, '');
/** 이름과 달라 보이는 첫 별명. 이름에서 기호만 뺀 별명은 건너뛴다. */
const displayAlias = (name, aliases = []) => aliases.find((alias) => bare(alias) !== bare(name));

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
	const title = firstAugmented
		? `증바람 ${label} 공략 · ${augmentNames(guide, firstAugmented.trigger)} 템트리 | 칼바람 아수라장 ${guide.patch}`
		: `증바람 ${label} 공략 · 증강·템트리 | 칼바람 아수라장 ${guide.patch}`;

	const baseText = `기본 템트리는 ${itemOrder(guide, base[0].core)}입니다.`;
	const augmentedText = firstAugmented
		? ` ${object(augmentNames(guide, firstAugmented.trigger))} 얻으면 ${toward(itemOrder(guide, firstAugmented.core))} 바꿉니다.`
		: '';
	const summary = `${baseText}${augmentedText}`;

	return {
		title,
		heading: `증바람 ${name} 공략`,
		description: `증바람(칼바람 아수라장) ${label} 공략입니다. ${summary} 통계 티어가 아니라 재밌다고 알려진 도파민 빌드입니다.`,
		summary
	};
}

/** JSON-LD 구조화 데이터. FAQPage는 쓰지 않는다(REQ-SEO-001). */
export function structuredData({ siteBaseUrl, path, title, description, crumbs, champions }) {
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
	if (champions) {
		graph.push({
			'@type': 'ItemList',
			'@id': `${url}#champions`,
			name: '증바람 챔피언별 공략',
			itemListElement: champions.map((champion, index) => ({
				'@type': 'ListItem',
				position: index + 1,
				name: `증바람 ${champion.nameKo} 공략`,
				url: `${siteBaseUrl}${championPath(champion.id)}`
			}))
		});
	}
	const json = JSON.stringify({ '@context': 'https://schema.org', '@graph': graph });
	return `<script type="application/ld+json">${json.replaceAll('<', '\\u003c')}<` + '/script>';
}
