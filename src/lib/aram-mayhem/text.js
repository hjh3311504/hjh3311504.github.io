// 아수라장 가이드 설명 문장을 글자와 타일(스킬·증강·아이템·능력치) 조각으로 나눈다.
// 생성 스크립트가 사용하며, 화면은 나눈 결과만 받는다.

// 문장 안에서 타일로 바꿀 짧은 이름. 화면에는 짧은 이름을 보여 주고 원래 증강으로 연결한다.
export const AUGMENT_ALIASES = { 순수주의자: '순수주의자 - 마법사' };

const escapeRegExp = (text) => text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

/**
 * @param {string} text
 * @param {{ augmentNames: string[], itemNames: string[] }} names
 */
export function segment(text, { augmentNames, itemNames }) {
	const alternatives = [
		...augmentNames.map((name) => ['aug', name]),
		...itemNames.map((name) => ['item', name]),
		...Object.keys(AUGMENT_ALIASES).map((name) => ['augAlias', name]),
		['stat', '스킬 가속'],
		['anvil', '모루']
	].sort((a, b) => b[1].length - a[1].length);
	const kind = Object.fromEntries(alternatives.map(([type, name]) => [name, type]));
	const pattern = new RegExp(
		`(${alternatives.map(([, name]) => escapeRegExp(name)).join('|')}|궁극기|\\[[QWER]\\]|(?<![A-Za-z])[QWER](?![A-Za-z]))`,
		'g'
	);
	const parts = [];
	let last = 0;
	for (const match of text.matchAll(pattern)) {
		if (match.index > last) parts.push({ t: 'text', v: text.slice(last, match.index) });
		const value = match[0];
		if (value === '궁극기') parts.push({ t: 'skill', key: 'R' });
		// [E]처럼 대괄호로 쓴 스킬은 이름 없이 키만 보여 준다.
		else if (/^\[[QWER]\]$/.test(value)) parts.push({ t: 'skill', key: value[1], short: true });
		else if (/^[QWER]$/.test(value)) parts.push({ t: 'skill', key: value });
		else if (kind[value] === 'augAlias')
			parts.push({ t: 'aug', v: AUGMENT_ALIASES[value], label: value });
		else if (kind[value] === 'stat') parts.push({ t: 'stat', v: value });
		else if (kind[value] === 'anvil') parts.push({ t: 'anvil', v: value });
		else parts.push({ t: kind[value], v: value });
		last = match.index + value.length;
	}
	if (last < text.length) parts.push({ t: 'text', v: text.slice(last) });
	return parts;
}

const PARTICLES = [
	['으로', '로'],
	['을', '를'],
	['과', '와'],
	['이', '가'],
	['은', '는']
];

/**
 * 스킬 키(E) 자리에 스킬 이름(질풍검)이 보이므로 뒤 조사를 이름의 받침에 맞춘다.
 * @param {string} word 조사 앞에 오는 이름
 * @param {string} text 조사로 시작하는 뒤 문장
 */
export function fixParticle(word, text) {
	// '빠직!'처럼 끝의 문장 부호는 빼고 받침을 본다.
	const trimmed = word.replace(/[^가-힣]+$/, '');
	const code = trimmed.charCodeAt(trimmed.length - 1) - 0xac00;
	if (Number.isNaN(code) || code < 0 || code > 11171) return text;
	const final = code % 28;
	for (const [withFinal, withoutFinal] of PARTICLES) {
		for (const particle of [withFinal, withoutFinal]) {
			if (!text.startsWith(particle) || /^[가-힣]/.test(text.slice(particle.length))) continue;
			// '로'는 받침이 없거나 ㄹ 받침일 때 쓴다.
			const useFinal =
				particle === '으로' || particle === '로' ? final !== 0 && final !== 8 : final !== 0;
			return (useFinal ? withFinal : withoutFinal) + text.slice(particle.length);
		}
	}
	return text;
}

/**
 * 스킬 이름이 붙는 타일 바로 뒤의 글자 조각에 조사 보정을 적용한다.
 * @param {Array<{ t: string, v?: string, key?: string, short?: boolean }>} parts
 * @param {Record<string, { name: string }>} skills
 */
export function fixParticles(parts, skills) {
	return parts.map((part, index) => {
		const previous = parts[index - 1];
		if (part.t !== 'text' || previous?.t !== 'skill' || previous.short) return part;
		const name = skills[previous.key]?.name;
		return name ? { ...part, v: fixParticle(name, part.v) } : part;
	});
}
