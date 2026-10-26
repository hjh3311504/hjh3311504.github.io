// 아수라장 가이드 화면의 거르기·빌드 비교 규칙. 화면 컴포넌트와 단위 테스트가 함께 사용한다.

export const ROLE_ORDER = ['마법사', '원거리 딜러', '전사', '암살자', '탱커', '서포터'];
export const ALL_ROLES = '전체';
export const TIER_LABEL = { silver: '실버', gold: '골드', prismatic: '프리즘' };

/** 가이드에 있는 역할만 정해진 순서로 돌려준다. */
export function roleOptions(champions) {
	return [ALL_ROLES, ...ROLE_ORDER.filter((role) => champions.some((c) => c.roles.includes(role)))];
}

/** 역할과 이름 검색어로 챔피언을 거른다. 검색어 앞뒤 공백은 무시한다. */
export function filterChampions(champions, role, query) {
	const text = query.trim();
	return champions.filter(
		(champion) =>
			(role === ALL_ROLES || champion.roles.includes(role)) && champion.nameKo.includes(text)
	);
}

/** 주소의 #챔피언 값으로 처음 보여 줄 챔피언을 고른다. 없거나 모르는 값이면 첫 챔피언이다. */
export function championFromHash(champions, hash) {
	const id = decodeURIComponent(String(hash ?? '').replace(/^#/, ''));
	return champions.find((champion) => champion.id === id) ?? champions[0];
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
