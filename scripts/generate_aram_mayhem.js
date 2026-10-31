// 칼바람 아수라장 가이드의 조사 자료(docs/research/aram-mayhem)로 화면 데이터와 아이콘을 만든다.
// 실행: npm run generate:aram-mayhem
// 내려받은 원본은 .cache/aram-mayhem에 두고 다시 받지 않는다. 결과는 Git에 함께 올린다.
import { existsSync } from 'node:fs';
import { mkdir, readFile, rename, rm, writeFile } from 'node:fs/promises';
import path from 'node:path';
import * as prettier from 'prettier';
import sharp from 'sharp';
import { fixParticles, segment } from '../src/lib/aram-mayhem/text.js';

const DATA_DIR = 'docs/research/aram-mayhem';
const CACHE_DIR = '.cache/aram-mayhem';
const IMAGE_DIR = 'static/images/aram-mayhem';
// 생성이 중간에 실패해도 기존 아이콘이 남도록 임시 폴더에 만든 뒤 마지막에 바꾼다.
const NEXT_IMAGE_DIR = `${CACHE_DIR}/images-next`;
const IMAGE_URL = '/images/aram-mayhem';
const OUTPUT = 'src/lib/aram-mayhem/guide-data.json';
const DDRAGON_VERSION = '16.21.1';
const DDRAGON = `https://ddragon.leagueoflegends.com/cdn/${DDRAGON_VERSION}`;
// CommunityDragon은 패치(16.21) 단위로 고정해 다시 생성해도 같은 아이콘을 받는다.
const CDRAGON_VERSION = DDRAGON_VERSION.split('.').slice(0, 2).join('.');
const CDRAGON = `https://raw.communitydragon.org/${CDRAGON_VERSION}/plugins/rcp-be-lol-game-data/global/default`;

// 조사 자료의 역할·특징 표기를 초보자용 6개 역할로 묶는다.
const ROLE_MAP = {
	마법사: '마법사',
	'원거리 딜러': '원거리 딜러',
	탱커: '탱커',
	서포터: '서포터',
	암살자: '암살자',
	브루저: '전사',
	'근접 딜러': '전사',
	'지속 딜러': '전사'
};

const readData = async (name) => JSON.parse(await readFile(path.join(DATA_DIR, name), 'utf8'));
const byId = (list) => Object.fromEntries(list.map((entry) => [entry.id, entry]));

async function download(url) {
	const file = path.join(CACHE_DIR, url.replace(/[^a-z0-9.]+/gi, '_').slice(-150));
	if (existsSync(file)) return readFile(file);
	const response = await fetch(url);
	if (!response.ok) throw new Error(`${response.status} ${url}`);
	const body = Buffer.from(await response.arrayBuffer());
	await writeFile(file, body);
	return body;
}

const downloadJson = async (url) => JSON.parse((await download(url)).toString('utf8'));

/** 원본 이미지를 정사각형 webp로 저장하고 공개 주소를 돌려준다. */
async function saveIcon(url, folder, name, size) {
	const target = path.join(NEXT_IMAGE_DIR, folder, `${name}.webp`);
	const image = await sharp(await download(url))
		.resize(size, size)
		.webp({ quality: 82 })
		.toBuffer();
	await writeFile(target, image);
	return `${IMAGE_URL}/${folder}/${name}.webp`;
}

await mkdir(CACHE_DIR, { recursive: true });
await rm(NEXT_IMAGE_DIR, { recursive: true, force: true });
for (const folder of ['champions', 'skills', 'augments', 'items', 'stats']) {
	await mkdir(path.join(NEXT_IMAGE_DIR, folder), { recursive: true });
}

const [
	research,
	augmentData,
	buildData,
	buildPlayData,
	bootsData,
	extrasData,
	postsData,
	kiwi,
	aliasData,
	augmentGuideData
] = await Promise.all([
	readData('champions.json'),
	readData('augments.json'),
	readData('builds.json'),
	readData('build-play.json'),
	readData('boots.json'),
	readData('champ-extras.json'),
	readData('community-posts.json'),
	readData('kiwi-shop-items.json'),
	readData('aliases.json'),
	readData('augment-guides.json')
]);
const builds = byId(buildData.champions);
const buildPlays = byId(buildPlayData.champions);
const bootsById = byId(bootsData.champions);
const extras = byId(extrasData.champions);
const augmentsById = byId(augmentData.augments);
const augmentIdByName = Object.fromEntries(augmentData.augments.map((a) => [a.nameKo, a.id]));
const posts = postsData.posts;
// 증강 공략에 적은 다른 템트리. 그 증강 빌드가 있는 챔피언 공략에도 탭으로 붙인다.
const extraBuildsByAugment = Object.fromEntries(
	augmentGuideData.augments.map((entry) => [entry.id, entry.builds ?? []])
);
const postByUrl = Object.fromEntries(posts.map((post) => [post.url, post]));
const postById = Object.fromEntries(posts.filter((post) => post.id).map((post) => [post.id, post]));

const championsEn = (await downloadJson(`${DDRAGON}/data/en_US/champion.json`)).data;
// 별명 원본은 가이드에 아직 없는 챔피언까지 모두 담는다. 빠지거나 틀린 이름이 있으면 멈춘다.
const championNamesKo = Object.values(
	(await downloadJson(`${DDRAGON}/data/ko_KR/champion.json`)).data
).map((champion) => champion.name);
const aliasNames = Object.keys(aliasData.champions);
const missingAliases = championNamesKo.filter((name) => !aliasNames.includes(name));
const unknownAliases = aliasNames.filter((name) => !championNamesKo.includes(name));
if (missingAliases.length || unknownAliases.length) {
	throw new Error(
		`별명 원본의 챔피언 목록이 Data Dragon과 다릅니다. 빠짐: ${missingAliases.join(', ') || '없음'} / 모름: ${unknownAliases.join(', ') || '없음'}`
	);
}
for (const id of Object.keys(aliasData.augments)) {
	if (!augmentsById[id]) throw new Error(`별명 원본의 증강을 찾지 못함: ${id}`);
}
const ddragonIdByName = Object.fromEntries(
	Object.entries(championsEn).map(([key, champion]) => [champion.name.toLowerCase(), key])
);
// 같은 이름의 아이템이 여러 번호로 있어 아수라장(KIWI) 상점 목록의 번호만 쓴다.
const itemsKo = (await downloadJson(`${DDRAGON}/data/ko_KR/item.json`)).data;
const kiwiIds = new Set(kiwi.items.map((item) => String(item.id)));
const itemIdByName = {};
for (const [id, item] of Object.entries(itemsKo)) {
	if (kiwiIds.has(id)) itemIdByName[item.name.replace(/\s+/g, '')] = id;
}
const cherry = await downloadJson(`${CDRAGON}/v1/cherry-augments.json`);
const cherryById = Object.fromEntries(cherry.map((entry) => [entry.id, entry]));

const names = {
	augmentNames: augmentData.augments.map((a) => a.nameKo),
	itemNames: Object.values(itemsKo)
		.filter((item, index, list) => list.findIndex((x) => x.name === item.name) === index)
		.map((item) => item.name)
		.filter((name) => itemIdByName[name.replace(/\s+/g, '')] && name.length >= 3)
};

const usedAugments = new Set();
const usedItems = new Set();
const missing = [];

// 조합 출처: 조합을 정리할 때 실제로 참고한 디시 칼바람 갤러리 글과 유튜브 영상만 보여 준다.
function dcLabel(post, note = '') {
	const date = post?.postedAt?.slice(0, 10);
	if (date) return `디시 칼바람 갤러리(${date.replaceAll('-', '.')})`;
	const patch = note.match(/^(\d+\.\d+)/);
	return `디시 칼바람 갤러리${patch ? `(${patch[1]} 글)` : ''}`;
}

// 조합 카드에 넣는 YouTube 플레이 영상. 출처 링크(videos)와 따로 둔다.
function comboPlayVideo(championId, combo) {
	const video = combo.playVideo;
	if (!video) return {};
	if (!/^[\w-]{11}$/.test(video.youtubeId) || !/^\d+\/\d+$/.test(video.aspect) || !video.titleKo) {
		throw new Error(`플레이 영상 정보가 잘못됨: ${championId} ${combo.title}`);
	}
	return { playVideo: { youtubeId: video.youtubeId, aspect: video.aspect, title: video.titleKo } };
}

function comboSources(combo) {
	const sources = [];
	const seen = new Set();
	const add = (type, label, url) => {
		if (seen.has(url)) return;
		seen.add(url);
		sources.push({ type, label, url });
	};
	for (const evidence of combo.evidence ?? []) {
		if (new URL(evidence.url).hostname === 'gall.dcinside.com') {
			add('dc', dcLabel(postByUrl[evidence.url], evidence.note), evidence.url);
		}
	}
	for (const id of combo.communityPostIds ?? []) {
		const post = postById[id];
		if (post) add('dc', dcLabel(post), post.url);
	}
	for (const video of combo.videos ?? []) {
		add('youtube', `유튜브${video.titleKo ? ` · ${video.titleKo}` : ''}`, video.url);
	}
	// 같은 날짜 글이 여러 개면 번호를 붙여 구별한다.
	const counts = {};
	for (const source of sources) counts[source.label] = (counts[source.label] ?? 0) + 1;
	const numbers = {};
	for (const source of sources) {
		if (counts[source.label] < 2) continue;
		numbers[source.label] = (numbers[source.label] ?? 0) + 1;
		source.label += ` ${numbers[source.label]}`;
	}
	return sources;
}

/** 문장을 조각으로 나누고 쓰인 증강·아이템과 스킬 키를 기록한다. */
function parse(text, skillKeys) {
	const parts = segment(text, names);
	for (const part of parts) {
		if (part.t === 'aug') {
			part.id = augmentIdByName[part.v];
			usedAugments.add(part.id);
		}
		if (part.t === 'item') usedItems.add(part.v);
		if (part.t === 'skill') skillKeys.add(part.key);
	}
	return parts;
}

function useBuild(build) {
	for (const item of [...build.core, build.boots, ...build.situational.map((row) => row.item)]) {
		if (item) usedItems.add(item);
	}
}

const champions = [];
for (const champion of research.champions) {
	const skillKeys = new Set();
	const sourceBuilds = builds[champion.id];
	const plays = buildPlays[champion.id]?.comboBuilds ?? [];
	const combos = champion.combos
		.filter((combo) => combo.evidenceLevel !== 'inferred')
		.map((combo) => ({
			title: combo.title,
			level: ['S', 'A'].includes(combo.rating) ? 'strong' : 'good',
			augmentIds: combo.augmentIds,
			required: combo.requiredAugmentIds ?? combo.augmentIds,
			why: combo.whyKo ? parse(combo.whyKo, skillKeys) : [],
			steps: (combo.stepsKo ?? []).map((step) => parse(step, skillKeys)),
			hint: combo.hintKo ?? '',
			sources: comboSources(combo),
			...comboPlayVideo(champion.id, combo)
		}))
		// 강력 추천 조합을 먼저 보여 준다. 같은 등급은 조사 순서를 유지한다.
		.sort((a, b) => (a.level === 'strong' ? 0 : 1) - (b.level === 'strong' ? 0 : 1));
	if (!combos.length) continue;
	for (const combo of combos) combo.augmentIds.forEach((id) => usedAugments.add(id));

	const base = sourceBuilds?.defaultBuild ?? champion.items;
	const buildTabs = [base, ...(sourceBuilds?.altDefaultBuilds ?? [])].map((build, index) => ({
		key: index ? `base-${index}` : 'base',
		style: build.styleKo ?? '',
		core: build.core,
		boots: build.boots,
		situational: build.situational,
		skillOrder: build.skillOrder ?? [],
		play: []
	}));
	for (const comboBuild of sourceBuilds?.comboBuilds ?? []) {
		// 조합 카드 없이 증강만으로 바뀌는 빌드(comboTitle 없음)도 탭으로 보여 준다.
		if (comboBuild.comboTitle != null && !combos.some((c) => c.title === comboBuild.comboTitle)) {
			continue;
		}
		const play = plays.find(
			(entry) =>
				entry.comboTitle === comboBuild.comboTitle &&
				(comboBuild.comboTitle != null || entry.whyKo === comboBuild.whyKo)
		);
		comboBuild.triggerAugmentIds.forEach((id) => usedAugments.add(id));
		buildTabs.push({
			key: `aug-${comboBuild.triggerAugmentIds.join('-')}`,
			trigger: comboBuild.triggerAugmentIds,
			core: comboBuild.build.core,
			boots: comboBuild.build.boots,
			situational: comboBuild.build.situational,
			skillOrder: comboBuild.build.skillOrder ?? [],
			play: play && !play.samePlay ? (play.playKo ?? []).map((t) => parse(t, skillKeys)) : []
		});
		// 장갑 충격의 쇠사슬 조끼 빌드처럼 증강 공략에 적은 다른 템트리를 그 증강 빌드 바로 뒤에 붙인다.
		for (const id of comboBuild.triggerAugmentIds) {
			for (const extra of extraBuildsByAugment[id] ?? []) {
				buildTabs.push({
					key: `aug-${comboBuild.triggerAugmentIds.join('-')}-${extra.key}`,
					trigger: comboBuild.triggerAugmentIds,
					variant: extra.labelKo,
					core: extra.core,
					notes: extra.notesKo ?? [],
					boots: '',
					situational: [],
					skillOrder: [],
					play: extra.playKo.map(parsePlain)
				});
			}
		}
	}
	buildTabs.forEach(useBuild);
	buildTabs.forEach((build) => build.skillOrder.forEach((key) => skillKeys.add(key)));

	const good = [
		...new Set([...champion.goodAugmentIds, ...(extras[champion.id]?.extraGoodAugmentIds ?? [])])
	].filter((id) => !combos.some((combo) => combo.augmentIds.includes(id)));
	good.forEach((id) => usedAugments.add(id));
	champion.avoidAugmentIds.forEach((id) => usedAugments.add(id));
	const boots = (bootsById[champion.id]?.boots ?? []).map((row) => {
		usedItems.add(row.item);
		return { item: row.item, label: row.labelKo || row.whenKo };
	});

	const ddragonId = ddragonIdByName[champion.nameEn.toLowerCase()];
	if (!ddragonId) throw new Error(`Data Dragon 챔피언을 찾지 못함: ${champion.nameEn}`);
	const skills = {};
	if (skillKeys.size) {
		const detail = (await downloadJson(`${DDRAGON}/data/ko_KR/champion/${ddragonId}.json`)).data[
			ddragonId
		];
		for (const key of [...skillKeys].sort((a, b) => 'QWER'.indexOf(a) - 'QWER'.indexOf(b))) {
			const spell = detail.spells['QWER'.indexOf(key)];
			skills[key] = {
				name: spell.name,
				icon: await saveIcon(
					`${DDRAGON}/img/spell/${spell.image.full}`,
					'skills',
					`${champion.id}-${key.toLowerCase()}`,
					48
				)
			};
		}
	}
	// 스킬 이름이 키 자리에 보이므로 뒤 조사를 이름에 맞춘다.
	for (const combo of combos) {
		combo.why = fixParticles(combo.why, skills);
		combo.steps = combo.steps.map((step) => fixParticles(step, skills));
	}
	for (const build of buildTabs) build.play = build.play.map((p) => fixParticles(p, skills));

	champions.push({
		id: champion.id,
		nameKo: champion.nameKo,
		aliases: aliasData.champions[champion.nameKo] ?? [],
		roles: [...new Set(champion.roles.map((role) => ROLE_MAP[role]).filter(Boolean))],
		difficulty: champion.difficulty,
		icon: await saveIcon(`${DDRAGON}/img/champion/${ddragonId}.png`, 'champions', champion.id, 128),
		skills,
		builds: buildTabs,
		boots,
		combos,
		good,
		avoid: champion.avoidAugmentIds
	});
}
champions.sort((a, b) => a.nameKo.localeCompare(b.nameKo, 'ko'));

// 챔피언 조합 없이 증강만으로 정리한 공략(1코어 추천과 팁). 화면에 출처는 보여 주지 않는다.
/** 챔피언이 없는 문장은 스킬 타일을 쓸 수 없어 스킬 자리(궁극기·Q 등)를 원래 글자로 되돌린다. */
function parsePlain(text) {
	let at = 0;
	return parse(text, new Set()).map((part) => {
		const raw =
			part.t === 'skill'
				? text.slice(at).match(/^(궁극기|\[[QWER]\]|[QWER])/)[0]
				: (part.label ?? part.v);
		at += raw.length;
		if (part.t === 'skill') return { t: 'text', v: raw };
		// '100%까지'가 % 뒤에서 줄바꿈되지 않도록 단어 잇기 문자(U+2060)를 넣는다.
		return part.t === 'text'
			? { ...part, v: part.v.replace(/%(?=\p{Script=Hangul})/gu, '%\u2060') }
			: part;
	});
}
const augmentGuides = {};
for (const entry of augmentGuideData.augments) {
	usedAugments.add(entry.id);
	const roleItems = entry.roleItems ?? [];
	const extraBuilds = entry.builds ?? [];
	roleItems.forEach((row) => usedItems.add(row.item));
	extraBuilds.forEach((build) => build.core.forEach((item) => usedItems.add(item)));
	// 근거 글 번호는 조사 기록에 있어야 한다.
	for (const id of [
		entry.tipEvidencePostIds ?? [],
		...roleItems.map((row) => row.evidencePostIds)
	].flat()) {
		if (!postById[id]) missing.push(`디시 글: ${id}`);
	}
	augmentGuides[entry.id] = {
		lead: entry.leadKo ? parsePlain(entry.leadKo) : [],
		coreWhy: entry.coreWhyKo ? parsePlain(entry.coreWhyKo) : [],
		search: entry.searchKo ?? '',
		tips: (entry.tipsKo ?? []).map(parsePlain),
		roleItems: roleItems.map((row) => ({
			role: row.roleKo,
			item: row.item,
			why: parsePlain(row.whyKo)
		})),
		builds: extraBuilds.map((build) => ({
			key: build.key,
			label: build.labelKo,
			core: build.core,
			notes: build.notesKo ?? [],
			play: build.playKo.map(parsePlain)
		}))
	};
}

const augments = {};
for (const id of [...usedAugments].sort()) {
	const augment = augmentsById[id];
	if (!augment) throw new Error(`증강을 찾지 못함: ${id}`);
	const client = cherryById[augment.clientId];
	let icon = null;
	if (client) {
		const iconPath = client.augmentSmallIconPath
			.replace('/lol-game-data/assets/', '')
			.toLowerCase();
		icon = await saveIcon(`${CDRAGON}/${iconPath}`, 'augments', id, 88);
	} else {
		missing.push(`증강 아이콘: ${augment.nameKo}`);
	}
	augments[id] = {
		nameKo: augment.nameKo,
		aliases: aliasData.augments[id] ?? [],
		tier: augment.tier,
		effectKo: augment.effectKo,
		icon,
		...(augmentGuides[id] && { guide: augmentGuides[id] })
	};
}

// 템트리의 '모루'는 상점 아이템 이름이 아니라 능력치 모루다. 문장 타일과 같은 아이콘을 쓴다(아래 icons.anvil).
const ANVIL = '모루';
const items = {};
for (const name of [...usedItems].sort()) {
	if (name === ANVIL) continue;
	const id = itemIdByName[name.replace(/\s+/g, '')];
	if (!id) {
		missing.push(`아이템: ${name}`);
		items[name] = null;
		continue;
	}
	items[name] = await saveIcon(`${DDRAGON}/img/item/${id}.png`, 'items', id, 64);
}

for (const name of Object.keys(aliasData.items)) {
	if (!itemIdByName[name.replace(/\s+/g, '')]) missing.push(`별명 원본의 아이템: ${name}`);
}
// 화면에 나오는 아이템의 별명만 넣는다.
const itemAliases = Object.fromEntries(
	Object.entries(aliasData.items).filter(([name, list]) => name in items && list.length)
);

// 문장 타일용 아이콘: 능력치 모루(초록 모루 아이템 220000), 스킬 가속(룬 능력치 조각), 관통력(게임 글자 아이콘)
const icons = {
	anvil: await saveIcon(`${DDRAGON}/img/item/220000.png`, 'stats', 'anvil', 48),
	haste: await saveIcon(
		`${CDRAGON}/v1/perk-images/statmods/statmodscdrscalingicon.png`,
		'stats',
		'ability-haste',
		32
	),
	armorPen: await saveIcon(
		`${CDRAGON}/assets/ux/fonts/texticons/lol/statsicon/scaleapen.png`,
		'stats',
		'armor-penetration',
		32
	),
	magicPen: await saveIcon(
		`${CDRAGON}/assets/ux/fonts/texticons/lol/statsicon/scalempen.png`,
		'stats',
		'magic-penetration',
		32
	)
};

if (usedItems.has(ANVIL)) items[ANVIL] = icons.anvil;

if (missing.length) {
	throw new Error(`찾지 못한 자료가 있습니다.\n${missing.join('\n')}`);
}

await rm(IMAGE_DIR, { recursive: true, force: true });
await rename(NEXT_IMAGE_DIR, IMAGE_DIR);

const guide = {
	patch: research.patch,
	dataDragonVersion: DDRAGON_VERSION,
	champions,
	augments,
	items,
	itemAliases,
	icons
};
// 저장소의 lint와 같은 모양으로 저장한다.
const prettierOptions = await prettier.resolveConfig(OUTPUT);
await writeFile(
	OUTPUT,
	await prettier.format(JSON.stringify(guide, null, '\t'), { ...prettierOptions, filepath: OUTPUT })
);
console.log(
	`챔피언 ${champions.length}명, 증강 ${Object.keys(augments).length}개, 아이템 ${Object.keys(items).length}개 → ${OUTPUT}`
);
