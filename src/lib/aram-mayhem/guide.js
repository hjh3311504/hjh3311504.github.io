// 아수라장 가이드 화면의 거르기·빌드 비교 규칙. 화면 컴포넌트와 단위 테스트가 함께 사용한다.

export const ROLE_ORDER = ['마법사', '원거리 딜러', '전사', '암살자', '탱커', '서포터'];
export const ALL_ROLES = '전체';
export const TIER_LABEL = { silver: '실버', gold: '골드', prismatic: '프리즘' };

/** 가이드에 있는 역할만 정해진 순서로 돌려준다. */
/** 허브 타일에서 두 줄로 넘어가는 긴 이름은 사용자가 정한 줄임말로 보여 준다. */
const TILE_NAMES = { 'twisted-fate': '트페' };
export const tileName = (champion) => TILE_NAMES[champion.id] ?? champion.nameKo;

export function roleOptions(champions) {
	return [ALL_ROLES, ...ROLE_ORDER.filter((role) => champions.some((c) => c.roles.includes(role)))];
}

const CHOSEONG = 'ㄱㄲㄴㄷㄸㄹㅁㅂㅃㅅㅆㅇㅈㅉㅊㅋㅌㅍㅎ';

/** 띄어쓰기를 빼고 소문자로 바꾼다. '마스터이'와 '마스터 이'를 같게 본다. */
const compact = (text) =>
	String(text ?? '')
		.replace(/\s+/g, '')
		.toLowerCase();

/** 한글 음절을 초성으로 바꾼다. 한글이 아닌 글자는 그대로 둔다. */
export function initials(text) {
	return [...compact(text)]
		.map((char) => {
			const code = char.charCodeAt(0) - 0xac00;
			return code >= 0 && code < 11172 ? CHOSEONG[Math.floor(code / 588)] : char;
		})
		.join('');
}

/**
 * 검색어가 챔피언 이름·별명에 맞는 정도. 0이면 맞지 않는다.
 * 이름이나 별명이 검색어로 시작하면 3, 중간에 있으면 2, 초성만 맞으면 1이다.
 */
export function matchScore(champion, query) {
	const text = compact(query);
	if (!text) return 0;
	const names = [champion.nameKo, ...(champion.aliases ?? [])].map(compact);
	if (names.some((name) => name.startsWith(text))) return 3;
	if (names.some((name) => name.includes(text))) return 2;
	if ([...text].every((char) => CHOSEONG.includes(char))) {
		return names.some((name) => initials(name).includes(text)) ? 1 : 0;
	}
	return 0;
}

/** 역할과 검색어(이름·별명·초성)로 챔피언을 거른다. 검색어가 비면 역할만 본다. */
export function filterChampions(champions, role, query) {
	const searching = compact(query) !== '';
	return champions.filter(
		(champion) =>
			(role === ALL_ROLES || champion.roles.includes(role)) &&
			(!searching || matchScore(champion, query) > 0)
	);
}

/** 검색창 자동완성 목록. 잘 맞는 챔피언을 먼저, 같으면 가나다순으로 최대 limit명을 돌려준다. */
export function searchChampions(champions, query, limit = 8) {
	return champions
		.map((champion) => ({ champion, score: matchScore(champion, query) }))
		.filter((entry) => entry.score > 0)
		.sort((a, b) => b.score - a.score || a.champion.nameKo.localeCompare(b.champion.nameKo, 'ko'))
		.slice(0, limit)
		.map((entry) => entry.champion);
}

/** 예전 주소의 #챔피언id에 맞는 챔피언. 없거나 모르는 값이면 undefined다. */
export function championFromHash(champions, hash) {
	const raw = String(hash ?? '').replace(/^#/, '');
	let id = raw;
	try {
		id = decodeURIComponent(raw);
	} catch {
		// '#%E0'처럼 깨진 주소는 모르는 값으로 본다.
	}
	return champions.find((champion) => champion.id === id);
}

/** 빌드 탭 이름. 증강 빌드는 증강 이름으로, 기본 빌드는 스타일을 붙여 보여 준다. */
export function buildLabel(build, augments) {
	if (build.trigger) return build.trigger.map((id) => augments[id]?.nameKo ?? id).join(' + ');
	return build.style ? `기본 빌드 · ${build.style}` : '기본 빌드';
}

/**
 * 증강 빌드의 코어 아이템이 기본 빌드와 다르면 표시를 붙인다.
 * 기본 코어를 모두 유지하면 '추가', 기본 코어 일부를 바꾸면 '변경'이다.
 */
export function coreMarks(build, base) {
	if (!base || build === base) return build.core.map(() => '');
	const keepsBase = base.core.every((item) => build.core.includes(item));
	return build.core.map((item) => (base.core.includes(item) ? '' : keepsBase ? '추가' : '변경'));
}

/** 기본 빌드의 추천 아이템에 없는 행은 '추가'로 표시한다. */
export function isAddedSituational(row, base, build) {
	if (!base || build === base) return false;
	return !base.situational.some((baseRow) => baseRow.item === row.item);
}

/** 코어 개수에 맞춘 추천 아이템 제목. 코어가 3개면 '3코어 이후', 그 밖에는 다음 칸부터다. */
export function situationalHeading(coreCount) {
	return coreCount === 3 ? '3코어 이후 추천 아이템' : `${coreCount + 1}코어부터 추천 아이템`;
}

/** 조합 증강을 필수 증강 다음 선택 증강 순서로 나눈다. */
export function augmentGroups(combo) {
	return {
		required: combo.augmentIds.filter((id) => combo.required.includes(id)),
		optional: combo.augmentIds.filter((id) => !combo.required.includes(id))
	};
}
