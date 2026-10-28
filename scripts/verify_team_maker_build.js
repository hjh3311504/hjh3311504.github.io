import { access, readFile, readdir, stat } from 'node:fs/promises';
import path from 'node:path';
import sharp from 'sharp';
import { verifyTeamMakerCss } from './verify_team_maker_css.js';
import { publishedLicenses } from './licenses.js';
import {
	pageName,
	pageDescription as marblePageDescription,
	guideIntro as marbleGuideIntro,
	seoTitle as marbleTitle,
	seoDescription as marbleDescription,
	pageUrl as marbleUrl,
	shareImage as marbleImage,
	faqs as marbleFaqs
} from '../src/lib/marble-race/page-content.js';
import aramGuide from '../src/lib/aram-mayhem/guide-data.json' with { type: 'json' };
import {
	AUGMENT_PAGE_IDS,
	augmentPath,
	augmentSeo,
	championPath,
	championSeo,
	hubSeo
} from '../src/lib/aram-mayhem/seo.js';

const root = process.cwd();
const requiredFiles = [
	'build/favicon.svg',
	'build/favicon.ico',
	'build/images/site-open-graph-1200x630.png',
	'build/images/marble-race-open-graph-1200x630.png',
	'build/licenses/SUIT-LICENSE.txt',
	'build/licenses/SUITE-LICENSE.txt',
	'build/licenses/site-LICENSE.txt',
	'build/licenses/THIRD_PARTY_NOTICES.md',
	'build/index.html',
	'build/qr-code.html',
	'build/marble-race.html',
	'build/bracket.html',
	'build/aram-mayhem.html',
	'build/team-maker.html',
	'build/about.html',
	'build/privacy.html',
	'build/images/team-maker/favicon.svg',
	'build/images/team-maker-open-graph-1200x630.png'
];

for (const file of requiredFiles) {
	const absolutePath = path.join(root, file);
	await access(absolutePath);
	const details = await stat(absolutePath);
	if (!details.isFile() || details.size === 0) {
		throw new Error(`${file} 파일이 없거나 비어 있습니다.`);
	}
}

const removedOutputs = [
	'build/team-maker/index.html',
	'build/images/features',
	'build/images/sample-image.png',
	'build/images/site-preview.png',
	'build/images/site-screenshot.png',
	'build/favicons/safari-pinned-tab.svg'
];
for (const output of removedOutputs) {
	try {
		await access(path.join(root, output));
		throw new Error(`${output} 파일 또는 디렉터리가 남아 있습니다.`);
	} catch (error) {
		if (error?.code !== 'ENOENT') throw error;
	}
}

const html = await readFile(path.join(root, 'build/team-maker.html'), 'utf8');
const homeHtml = await readFile(path.join(root, 'build/index.html'), 'utf8');
const qrHtml = await readFile(path.join(root, 'build/qr-code.html'), 'utf8');
const marbleHtml = await readFile(path.join(root, 'build/marble-race.html'), 'utf8');
const bracketHtml = await readFile(path.join(root, 'build/bracket.html'), 'utf8');
const aramHtml = await readFile(path.join(root, 'build/aram-mayhem.html'), 'utf8');
// 챔피언 공략 페이지는 build/aram-mayhem/챔피언id.html이다. 공통 검사는 첫 챔피언 페이지로 한다.
const aramChampionHtml = Object.fromEntries(
	await Promise.all(
		aramGuide.champions.map(async (champion) => [
			champion.id,
			await readFile(path.join(root, `build${championPath(champion.id)}.html`), 'utf8')
		])
	)
);
const aramSampleId = aramGuide.champions[0].id;
const aramSampleHtml = aramChampionHtml[aramSampleId];
const notFoundHtml = await readFile(path.join(root, 'build/404.html'), 'utf8');
const aboutHtml = await readFile(path.join(root, 'build/about.html'), 'utf8');
const privacyHtml = await readFile(path.join(root, 'build/privacy.html'), 'utf8');
const adsenseScript =
	/<script\b[^>]*\bsrc=["']https:\/\/pagead2\.googlesyndication\.com\/pagead\/js\/adsbygoogle\.js\?client=ca-pub-(\d+)["']/i;
const adsTxt = await readFile(path.join(root, 'build/ads.txt'), 'utf8');
const adsTxtPublisher = adsTxt.match(/^google\.com,\s*pub-(\d+),\s*DIRECT/m)?.[1];
if (!adsTxtPublisher) throw new Error('ads.txt에서 Google 게시자 ID를 찾지 못했습니다.');
// 활용 안내는 JavaScript를 실행하지 않아도 정적 본문에서 읽을 수 있어야 합니다.
for (const [name, document, phrases] of [
	['홈', homeHtml, ['어떤 도구를 쓰면 될까요?', '만든 사람과 문의', '출처·라이선스 목록']],
	['소개', aboutHtml, ['글을 쓰는 방식', '도구를 만드는 방식', '문의', 'hjh3311504@gmail.com']],
	[
		'개인정보처리방침',
		privacyHtml,
		['브라우저에 저장하는 정보', '광고와 쿠키', 'Google 광고 설정']
	],
	[
		'Team Maker',
		html,
		[
			'10명을 3팀으로 나누기',
			'다음 모임에서 명단 다시 쓰기',
			'실력이 비슷한 팀을 보장하지는 않습니다'
		]
	],
	[
		'QR 코드',
		qrHtml,
		[
			'모임 신청 주소를 작은 안내지 12장',
			'실제 종이를 휴대폰으로 스캔',
			'원래 페이지의 접근 권한이 바뀌지는 않습니다'
		]
	],
	[
		'구슬 레이스',
		marbleHtml,
		[
			'가상 참가자 10명 중 4~6번째',
			'모든 참가자의 당첨 확률이 같다고 보장하지 않습니다',
			'페이지를 떠나기 전에 남겨 두세요'
		]
	],
	[
		'대진표',
		bracketHtml,
		['6팀 입력 순서 배치의 라운드별 경기', '부전승은 누가 받나요?', '17팀 이상도 되나요?']
	],
	[
		'아수라장 가이드',
		aramHtml,
		['증바람 공략', '가이드 보는 법', '추천 기준과 자료', '도파민', 'Legal Jibber Jabber']
	],
	['아수라장 챔피언 공략', aramSampleHtml, ['아이템 추천', '증강 추천', 'Legal Jibber Jabber']]
]) {
	const bodyText = document
		.replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, '')
		.replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, '')
		.replace(/<[^>]*>/g, '')
		.replace(/\s+/g, '');
	for (const phrase of phrases) {
		if (!bodyText.includes(phrase.replace(/\s+/g, ''))) {
			throw new Error(`${name} 정적 본문에 활용 안내가 없습니다: ${phrase}`);
		}
	}
}
// 공개 페이지에는 ads.txt와 같은 게시자 ID의 AdSense 코드가 있어야 합니다.
// 정적 404와 동의 메시지에 연결하는 개인정보처리방침에는 광고 코드가 없어야 합니다.
for (const [name, document] of [
	['홈', homeHtml],
	['Team Maker', html],
	['QR 코드', qrHtml],
	['구슬 레이스', marbleHtml],
	['대진표', bracketHtml],
	['아수라장 가이드', aramHtml],
	['아수라장 챔피언 공략', aramSampleHtml],
	['소개', aboutHtml],
	['개인정보처리방침', privacyHtml],
	['404', notFoundHtml]
]) {
	if (
		/jsdelivr|fantinel|This template was built|Sample for the static template|site-preview\.png|site-screenshot\.png/i.test(
			document
		)
	) {
		throw new Error(`${name} HTML에 템플릿 또는 외부 글꼴의 흔적이 남아 있습니다.`);
	}
	if (!document.includes('favicon.svg')) throw new Error(`${name} HTML에 Lake favicon이 없습니다.`);
	if (name === '404' || name === '개인정보처리방침') {
		if (/<script\b[^>]*\bsrc=["'][^"']*(?:adsbygoogle|googlesyndication)/i.test(document)) {
			throw new Error(`${name} HTML에 광고 스크립트가 있습니다.`);
		}
	} else {
		const publisher = document.match(adsenseScript)?.[1];
		if (!publisher) throw new Error(`${name} HTML에 AdSense 코드가 없습니다.`);
		if (publisher !== adsTxtPublisher) {
			throw new Error(`${name} HTML의 AdSense 게시자 ID가 ads.txt와 다릅니다.`);
		}
		if ((document.match(/adsbygoogle\.js/g)?.length ?? 0) !== 1) {
			throw new Error(`${name} HTML에 AdSense 코드가 여러 번 들어 있습니다.`);
		}
	}
}
for (const [name, document] of [
	['site', homeHtml],
	['team-maker', html]
]) {
	const imagePath = `/images/${name}-open-graph-1200x630.png`;
	const metadata = await sharp(path.join(root, 'build', imagePath)).metadata();
	if (metadata.format !== 'png' || metadata.width !== 1200 || metadata.height !== 630) {
		throw new Error(`${name} 공유 이미지는 1200×630 PNG여야 합니다.`);
	}
	for (const attribute of ['property="og:image"', 'name="twitter:image"']) {
		const tag = document.match(new RegExp(`<meta\\b[^>]*${attribute}[^>]*>`))?.[0];
		if (!tag?.includes(`https://hjh3311504.github.io${imagePath}`)) {
			throw new Error(`${name} 공유 이미지 연결이 올바르지 않습니다.`);
		}
	}
	for (const attribute of ['property="og:image:alt"', 'name="twitter:image:alt"']) {
		if (!document.includes(attribute)) throw new Error(`${name} 공유 이미지 설명이 없습니다.`);
	}
}
const packageInfo = JSON.parse(await readFile('package.json', 'utf8'));
const siteLicense = await readFile('LICENSE', 'utf8');
if (
	packageInfo.license !== 'MIT' ||
	!siteLicense.startsWith('MIT License\n') ||
	!siteLicense.includes('Copyright (c) 2026 Lake (hjh3311504)')
) {
	throw new Error('자체 코드의 MIT 라이선스와 패키지 고지가 일치하지 않습니다.');
}
for (const [source, name] of publishedLicenses) {
	const original = await readFile(source, 'utf8');
	const published = await readFile(`build/licenses/${name}`, 'utf8');
	if (original !== published) throw new Error(`${name} 라이선스·출처 원문이 배포되지 않았습니다.`);
}
if (!/<meta\s+name="robots"\s+content="noindex"/.test(notFoundHtml)) {
	throw new Error('404 HTML에 noindex가 없습니다.');
}
if (/<link\b[^>]*\brel="canonical"/.test(notFoundHtml)) {
	throw new Error('404 HTML에 canonical을 지정하면 안 됩니다.');
}
for (const [name, document] of [
	['홈', homeHtml],
	['Team Maker', html],
	['QR 코드', qrHtml],
	['구슬 레이스', marbleHtml],
	['대진표', bracketHtml],
	['아수라장 가이드', aramHtml],
	['아수라장 챔피언 공략', aramSampleHtml],
	['소개', aboutHtml],
	['개인정보처리방침', privacyHtml]
]) {
	if (!/href="\/privacy"/.test(document) || !/href="\/about"/.test(document)) {
		throw new Error(`${name} HTML에 소개나 개인정보처리방침 링크가 없습니다.`);
	}
}
for (const [name, document, pathname] of [
	['소개', aboutHtml, 'about'],
	['개인정보처리방침', privacyHtml, 'privacy']
]) {
	if ((document.match(/<h1\b/g)?.length ?? 0) !== 1)
		throw new Error(`${name}의 h1은 1개여야 합니다.`);
	if (!document.includes(`<link rel="canonical" href="https://hjh3311504.github.io/${pathname}"`)) {
		throw new Error(`${name} HTML의 canonical 주소가 올바르지 않습니다.`);
	}
	if (/<meta\s+name="robots"\s+content="noindex/.test(document)) {
		throw new Error(`${name} HTML에 noindex가 있으면 안 됩니다.`);
	}
}
const page = await readFile(path.join(root, 'src/routes/team-maker/+page.svelte'), 'utf8');
const app = await readFile(path.join(root, 'src/lib/team-maker/app.js'), 'utf8');
// 기능 파일, 화면 component와 보완 CSS도 빠짐없이 검사합니다.
async function readProductSources(directory) {
	const entries = await readdir(directory, { withFileTypes: true });
	const sources = await Promise.all(
		entries.map(async (entry) => {
			const file = path.join(directory, entry.name);
			if (entry.isDirectory()) return readProductSources(file);
			if (!/\.(?:js|css|svelte)$/.test(entry.name)) return '';
			return readFile(file, 'utf8');
		})
	);
	return sources.join('\n');
}
const productSource = await readProductSources(path.join(root, 'src/lib/team-maker'));
const dynamicUi = await readFile(path.join(root, 'src/lib/team-maker/ui.js'), 'utf8');
const css = await readFile(path.join(root, 'src/routes/team-maker/team-maker.css'), 'utf8');
const uiCss = await readFile(path.join(root, 'src/lib/components/ui/ui.css'), 'utf8');
const uiIndex = await readFile(path.join(root, 'src/lib/components/ui/index.js'), 'utf8');
const uiComponentNames = [
	'Surface',
	'Section',
	'SectionHeader',
	'Button',
	'IconButton',
	'Dialog',
	'EmptyState',
	'DisclosureSection'
];
const uiComponents = await Promise.all(
	uiComponentNames.map(async (name) => [
		name,
		await readFile(path.join(root, `src/lib/components/ui/${name}.svelte`), 'utf8')
	])
);
const seoTitle = '무료 팀짜기·조짜기 프로그램 | 팀 메이커';
const seoDescription =
	'이름을 입력하면 참가자를 고르게 나누는 무료 온라인 팀짜기·조짜기 프로그램입니다. 같은 팀·다른 팀 규칙, 명단 저장, 승패 기록과 무작위 추첨을 지원합니다.';

const requiredHtml = [
	'<html lang="ko">',
	`<title>${seoTitle}</title>`,
	`<meta name="description" content="${seoDescription}"`,
	'<link rel="canonical" href="https://hjh3311504.github.io/team-maker"',
	`<meta property="og:title" content="${seoTitle}"`,
	`<meta property="og:description" content="${seoDescription}"`,
	'<meta property="og:image" content="https://hjh3311504.github.io/images/team-maker-open-graph-1200x630.png"',
	'<meta property="og:image:width" content="1200"',
	'<meta property="og:image:height" content="630"',
	'<meta name="twitter:card" content="summary_large_image"',
	`<meta name="twitter:title" content="${seoTitle}"`,
	`<meta name="twitter:description" content="${seoDescription}"`,
	'<meta name="twitter:image" content="https://hjh3311504.github.io/images/team-maker-open-graph-1200x630.png"',
	'<h2 id="how-to-title">3단계로 팀 나누기</h2>',
	'<h2 id="use-cases-title">이럴 때 사용하세요</h2>',
	'<h2 id="features-title">팀 메이커의 주요 기능</h2>',
	'<h2 id="faq-title">자주 묻는 질문</h2>',
	'id="participant-list"',
	'id="team-grid"',
	'data-ui-section',
	'data-ui-dialog',
	'data-ui-button',
	'data-ui-empty-state',
	'data-ui-disclosure',
	'_app/immutable/'
];
for (const marker of requiredHtml) {
	if (!html.includes(marker))
		throw new Error(`team-maker HTML에서 ${marker} 표시를 찾지 못했습니다.`);
}

for (const marker of ['data-ui-surface', 'data-ui-section', 'data-ui-button']) {
	if (!homeHtml.includes(marker)) {
		throw new Error(`홈 HTML에서 ${marker} 공통 UI 표시를 찾지 못했습니다.`);
	}
}
if (!notFoundHtml.includes('data-ui-button')) {
	throw new Error('404 HTML에서 공통 UI Button 표시를 찾지 못했습니다.');
}

const uiDialogTags = [...html.matchAll(/<dialog\b[^>]*\bdata-ui-dialog\b[^>]*>/g)].map(
	(match) => match[0]
);
if (uiDialogTags.length !== 7) {
	throw new Error(
		`Team Maker의 공통 Dialog는 7개여야 합니다. 현재 ${uiDialogTags.length}개입니다.`
	);
}
if (
	uiDialogTags.some(
		(tag) => !/\baria-labelledby="[^"]+"/.test(tag) || !/\baria-describedby="[^"]+"/.test(tag)
	)
) {
	throw new Error('Team Maker Dialog의 제목 또는 설명 ARIA 연결이 빠졌습니다.');
}

const h1Count = html.match(/<h1\b/g)?.length ?? 0;
if (!/<h1\b[^>]*>무료 팀짜기·조짜기<\/h1>/.test(html)) {
	throw new Error('Team Maker의 h1 제목 문구가 올바르지 않습니다.');
}
if (h1Count !== 1) {
	throw new Error(`team-maker HTML의 h1은 1개여야 합니다. 현재 ${h1Count}개입니다.`);
}

const faqCount = html.match(/<article class="faq-item">/g)?.length ?? 0;
if (faqCount !== 6) {
	throw new Error(`team-maker HTML의 FAQ는 6개여야 합니다. 현재 ${faqCount}개입니다.`);
}

const openGuideSectionCount = [...html.matchAll(/<details\b[^>]*>/g)]
	.map((match) => match[0])
	.filter(
		(tag) =>
			/\bclass="[^"]*\bseo-details\b[^"]*"/.test(tag) &&
			/(?:^|\s)open(?:=|\s|>)/.test(tag) &&
			/\bdata-ui-disclosure\b/.test(tag)
	).length;
if (openGuideSectionCount !== 4) {
	throw new Error(
		`team-maker HTML의 기본 펼침 안내 섹션은 4개여야 합니다. 현재 ${openGuideSectionCount}개입니다.`
	);
}

// 사용 안내는 기본으로 펼치고, 구슬 레이스 도감만 접힌 상태로 둔다. 본문은 모두 정적 HTML에 있어야 한다.
for (const [route, content, expectedCount, expectedOpen] of [
	['team-maker', html, 4, 4],
	['qr-code', qrHtml, 2, 2],
	['marble-race', marbleHtml, 5, 4],
	['bracket', bracketHtml, 3, 3],
	['aram-mayhem', aramHtml, 2, 1]
]) {
	const sections = [...content.matchAll(/<details\b([^>]*)>([\s\S]*?)<\/details>/g)].filter(
		([, attributes]) => /\bdata-ui-disclosure\b/.test(attributes)
	);
	if (sections.length !== expectedCount)
		throw new Error(`${route}: 접는 영역은 ${expectedCount}개여야 합니다.`);
	const openCount = sections.filter(([, attributes]) =>
		/(?:^|\s)open(?:=|\s|$)/.test(attributes)
	).length;
	if (openCount !== expectedOpen)
		throw new Error(
			`${route}: 기본으로 펼친 안내는 ${expectedOpen}개여야 합니다. 현재 ${openCount}개입니다.`
		);
	for (const [, , body] of sections) {
		if (!/<p\b[^>]*>[^<]*\S/.test(body) && !/<li\b[^>]*>[^<]*\S/.test(body))
			throw new Error(`${route}: 안내 본문이 정적 HTML에 없습니다.`);
	}
}

const structuredDataMatch = html.match(/<script type="application\/ld\+json">([^<]+)<\/script>/);
if (!structuredDataMatch) {
	throw new Error('team-maker HTML에서 JSON-LD 구조화 데이터를 찾지 못했습니다.');
}
const structuredData = JSON.parse(structuredDataMatch[1]);
const webApplication = structuredData['@graph']?.find((item) => item['@type'] === 'WebApplication');
if (!webApplication || webApplication.url !== 'https://hjh3311504.github.io/team-maker') {
	throw new Error('Team Maker WebApplication 구조화 데이터의 URL이 올바르지 않습니다.');
}
if (webApplication.description !== seoDescription) {
	throw new Error('Team Maker WebApplication 설명이 검색 설명과 일치하지 않습니다.');
}
const requiredAlternateNames = ['Team Maker', '팀짜기', '조짜기', '팀 나누기', '랜덤 팀 배정'];
if (!requiredAlternateNames.every((name) => webApplication.alternateName?.includes(name))) {
	throw new Error('Team Maker WebApplication의 대체 이름이 빠졌습니다.');
}
if (webApplication.offers?.price !== 0 || webApplication.offers?.priceCurrency !== 'KRW') {
	throw new Error('Team Maker 무료 제공 정보가 구조화 데이터에 올바르게 표시되지 않았습니다.');
}
if (structuredData['@graph']?.some((item) => item['@type'] === 'FAQPage')) {
	throw new Error('일반 사이트에 사용하지 않는 FAQPage 구조화 데이터가 포함됐습니다.');
}

const localStyleLinks = [...html.matchAll(/<link\b[^>]*\brel="stylesheet"[^>]*>/g)].map(
	(match) => match[0]
);
const activeLocalStyleLinks = localStyleLinks.filter(
	(tag) => tag.includes('_app/immutable/assets/') && !/\bdisabled\b/.test(tag)
);
if (activeLocalStyleLinks.length > 0) {
	throw new Error('team-maker의 첫 화면 CSS가 HTML에 포함되지 않았습니다.');
}
for (const fontMarker of ['SUIT-Team-Maker', 'SUITE-Team-Maker', 'SUIT Full', 'SUITE Full']) {
	if (!html.includes(fontMarker)) {
		throw new Error(`team-maker HTML에서 ${fontMarker} 글꼴 설정을 찾지 못했습니다.`);
	}
}

const localReferences = [...html.matchAll(/\b(?:href|src)="([^"]+)"/g)]
	.map((match) => match[1])
	.filter((reference) => !/^(?:https?:|data:|#)/.test(reference));
for (const reference of new Set(localReferences)) {
	const cleanReference = decodeURIComponent(reference.split(/[?#]/, 1)[0]);
	const routeName = cleanReference.replace(/^(?:\.\/|\/)/, '');
	const isToolPage = [
		'team-maker',
		'qr-code',
		'marble-race',
		'bracket',
		'aram-mayhem',
		'about',
		'privacy'
	].includes(routeName);
	const absolutePath = isToolPage
		? path.join(root, `build/${routeName}.html`)
		: cleanReference.startsWith('/')
			? path.join(root, 'build', cleanReference.slice(1))
			: path.resolve(root, 'build', cleanReference);
	if (!absolutePath.startsWith(path.join(root, 'build'))) {
		throw new Error(`team-maker HTML의 자원 경로가 build 밖을 가리킵니다: ${reference}`);
	}
	await access(absolutePath);
}

const uiSource = uiComponents.map(([, source]) => source).join('\n');
const combined = `${page}\n${productSource}\n${css}\n${uiCss}\n${uiIndex}\n${uiSource}`;
const runtimeCode = `${productSource}\n${css}`;
if (/\b(?:src|href)=["']\/(?!\/)/.test(combined) || /url\(\s*["']?\//.test(combined)) {
	throw new Error('team-maker 자원에 사이트 루트 기준 경로가 있습니다.');
}
if (/https?:\/\//.test(runtimeCode)) {
	throw new Error('team-maker 제품 코드에서 외부 HTTP 자원을 찾았습니다.');
}
if (!productSource.includes("from './core.js'")) {
	throw new Error('화면 코드가 분리된 팀 배정 로직을 불러오지 않습니다.');
}
if (
	!app.includes('export function mountTeamMaker(root, ') ||
	!page.includes("from '$lib/team-maker/app.js'")
) {
	throw new Error('SvelteKit route가 Team Maker 화면 module을 불러오지 않습니다.');
}
if (!`${page}\n${productSource}`.includes("from '$lib/components/ui'")) {
	throw new Error('Team Maker 화면이 공통 UI component를 불러오지 않습니다.');
}
for (const [name, source] of uiComponents) {
	if (!source.includes('$props()') || !source.includes('{@render')) {
		throw new Error(`${name} component가 Svelte 5 props와 snippet 조합 방식을 사용하지 않습니다.`);
	}
	if (!uiIndex.includes(`export { default as ${name} } from './${name}.svelte';`)) {
		throw new Error(`공통 UI index에서 ${name} component를 export하지 않습니다.`);
	}
}
for (const token of [
	'--ui-surface',
	'--ui-text',
	'--ui-border',
	'--ui-focus',
	'--ui-danger-fill'
]) {
	if (!uiCss.includes(token)) {
		throw new Error(`공통 UI stylesheet에서 ${token} token을 찾지 못했습니다.`);
	}
}
if (
	!dynamicUi.includes('function applyUiButton') ||
	!dynamicUi.includes("button.dataset.uiButton = ''")
) {
	throw new Error('동적으로 만드는 Team Maker 버튼이 공통 UI button 규칙을 사용하지 않습니다.');
}
if (html.includes('src="./app.js"') || html.includes('href="./styles.css"')) {
	throw new Error('team-maker build가 이전 정적 entrypoint를 사용하고 있습니다.');
}

await verifyTeamMakerCss(root);

console.log(
	`Team Maker SvelteKit build 검증 통과: 필수 파일 ${requiredFiles.length}개, local 자원 ${new Set(localReferences).size}개`
);

const sitemapHtml = await readFile('build/sitemap.xml', 'utf8');
for (const marker of [
	'QR 코드 만들기',
	'id="qr-content"',
	'id="qr-guide-title"',
	'id="qr-faq-title"',
	'PNG 저장',
	'SVG 저장',
	'data-ui-section',
	'data-ui-section-header',
	'data-ui-empty-state',
	'data-ui-disclosure',
	'href="https://hjh3311504.github.io/qr-code"'
]) {
	if (!qrHtml.includes(marker))
		throw new Error(`QR 코드 HTML에서 ${marker} 표시를 찾지 못했습니다.`);
}
for (const pathname of ['about', 'privacy']) {
	if (!sitemapHtml.includes(`<loc>https://hjh3311504.github.io/${pathname}</loc>`))
		throw new Error(`sitemap에 /${pathname} 주소가 없습니다.`);
}
if (!sitemapHtml.includes('<loc>https://hjh3311504.github.io/qr-code</loc>'))
	throw new Error('sitemap에 QR 코드 주소가 없습니다.');
if ((qrHtml.match(/<h1\b/g)?.length ?? 0) !== 1) throw new Error('QR 코드의 h1은 1개여야 합니다.');
console.log('QR 코드 정적 페이지와 sitemap 검증 통과');

for (const marker of [
	'대진표 만들기',
	'id="bracket-guide-title"',
	'id="bracket-example-title"',
	'id="bracket-faq-title"',
	'data-ui-section',
	'data-ui-empty-state',
	'<link rel="canonical" href="https://hjh3311504.github.io/bracket"'
]) {
	if (!bracketHtml.includes(marker))
		throw new Error(`대진표 HTML에서 ${marker} 표시를 찾지 못했습니다.`);
}
// 대진표 안과 인쇄용 사본에는 광고 영역을 두지 않는다.
if (/<ins\b[^>]*adsbygoogle/i.test(bracketHtml))
	throw new Error('대진표 HTML에 광고 영역이 있습니다.');
if ((bracketHtml.match(/<h1\b/g)?.length ?? 0) !== 1)
	throw new Error('대진표의 h1은 1개여야 합니다.');
if (!sitemapHtml.includes('<loc>https://hjh3311504.github.io/bracket</loc>'))
	throw new Error('sitemap에 대진표 주소가 없습니다.');
for (const [name, document] of [
	['홈', homeHtml],
	['Team Maker', html]
]) {
	if (!/href="(?:\.\/|\/)bracket"/.test(document))
		throw new Error(`${name} HTML에 대진표 링크가 없습니다.`);
}
console.log('대진표 정적 페이지와 sitemap 검증 통과');

const aramJsonLd = (document, name) => {
	const match = document.match(/<script type="application\/ld\+json">([^<]+)<\/script>/);
	if (!match) throw new Error(`${name} HTML에서 JSON-LD 구조화 데이터를 찾지 못했습니다.`);
	const graph = JSON.parse(match[1])['@graph'] ?? [];
	if (graph.some((item) => item['@type'] === 'FAQPage'))
		throw new Error(`${name}에 사용하지 않는 FAQPage 구조화 데이터가 있습니다.`);
	return graph;
};
// 챔피언 아이콘과 증강 아이콘은 외부 주소가 아니라 사이트에 함께 배포한 파일을 쓴다.
async function checkAramImages(document, name) {
	const images = [...document.matchAll(/<img\b[^>]*\bsrc="([^"]+)"/g)].map((match) => match[1]);
	if (!images.length || images.some((src) => !src.startsWith('/images/aram-mayhem/')))
		throw new Error(`${name} 이미지는 /images/aram-mayhem/ 아래 파일이어야 합니다.`);
	for (const src of new Set(images)) await access(path.join(root, 'build', src.slice(1)));
}
const hubSeoText = hubSeo(aramGuide);
for (const marker of [
	`<title>${hubSeoText.title}</title>`,
	'id="aram-howto-title"',
	'id="aram-basis-title"',
	'aria-label="챔피언 고르기"',
	'<link rel="canonical" href="https://hjh3311504.github.io/aram-mayhem"'
]) {
	if (!aramHtml.includes(marker))
		throw new Error(`아수라장 가이드 HTML에서 ${marker} 표시를 찾지 못했습니다.`);
}
if ((aramHtml.match(/<h1\b/g)?.length ?? 0) !== 1)
	throw new Error('아수라장 가이드의 h1은 1개여야 합니다.');
await checkAramImages(aramHtml, '아수라장 가이드');
const hubList = aramJsonLd(aramHtml, '아수라장 가이드').find(
	(item) => item['@type'] === 'ItemList'
);
if (hubList?.itemListElement?.length !== aramGuide.champions.length)
	throw new Error('아수라장 가이드의 챔피언 목록 구조화 데이터 수가 맞지 않습니다.');
if (!sitemapHtml.includes('<loc>https://hjh3311504.github.io/aram-mayhem</loc>'))
	throw new Error('sitemap에 아수라장 가이드 주소가 없습니다.');
if (!/href="(?:\.\/|\/)aram-mayhem"/.test(homeHtml))
	throw new Error('홈 HTML에 아수라장 가이드 링크가 없습니다.');

for (const champion of aramGuide.champions) {
	const document = aramChampionHtml[champion.id];
	const name = `아수라장 ${champion.nameKo} 공략`;
	const pathname = championPath(champion.id);
	const seo = championSeo(champion, aramGuide);
	// 허브의 챔피언 타일은 검색엔진이 따라갈 수 있는 정적 링크다.
	if (!aramHtml.includes(`href="${pathname}"`))
		throw new Error(`아수라장 가이드 허브에 ${champion.nameKo} 공략 링크가 없습니다.`);
	if (!sitemapHtml.includes(`<loc>https://hjh3311504.github.io${pathname}</loc>`))
		throw new Error(`sitemap에 ${name} 주소가 없습니다.`);
	for (const marker of [
		`<title>${seo.title}</title>`,
		`<link rel="canonical" href="https://hjh3311504.github.io${pathname}"`,
		`<h2 id="aram-champion-name">${champion.nameKo}</h2>`,
		'role="combobox"'
	]) {
		if (!document.includes(marker))
			throw new Error(`${name} HTML에서 ${marker} 표시를 찾지 못했습니다.`);
	}
	if ((document.match(/<h1\b/g)?.length ?? 0) !== 1)
		throw new Error(`${name}의 h1은 1개여야 합니다.`);
	if (/<a\b[^>]*href="\/aram-mayhem\/[^"]+"/.test(document))
		throw new Error(`${name}에는 다른 챔피언 공략 링크를 두지 않습니다.`);
	await checkAramImages(document, name);
	const crumbs = aramJsonLd(document, name).find((item) => item['@type'] === 'BreadcrumbList');
	if (crumbs?.itemListElement?.at(-1)?.item !== `https://hjh3311504.github.io${pathname}`)
		throw new Error(`${name}의 이동 경로 구조화 데이터가 올바르지 않습니다.`);
}
// 증강 공략 페이지: 허브 링크, sitemap, 제목, 검색 버튼·범례, 어울리는 챔피언의 공략 링크,
// 이동 경로와 챔피언 목록 구조화 데이터.
for (const id of AUGMENT_PAGE_IDS) {
	const pathname = augmentPath(id);
	const seo = augmentSeo(id, aramGuide);
	const name = `아수라장 ${aramGuide.augments[id].nameKo} 증강 공략`;
	const document = await readFile(path.join(root, `build${pathname}.html`), 'utf8');
	if (!aramHtml.includes(`href="${pathname}"`))
		throw new Error(`아수라장 가이드 허브에 ${name} 링크가 없습니다.`);
	if (!sitemapHtml.includes(`<loc>https://hjh3311504.github.io${pathname}</loc>`))
		throw new Error(`sitemap에 ${name} 주소가 없습니다.`);
	for (const marker of [
		`<title>${seo.title}</title>`,
		`<link rel="canonical" href="https://hjh3311504.github.io${pathname}"`,
		'id="aram-augment-name"',
		'role="combobox"',
		// 챔피언 조합이 있으면 범례와 챔피언 공략 링크, 1코어 추천만 있으면 추천 아이템
		...(seo.entries.length
			? [
					'class="aram-legend"',
					...seo.entries.map(({ champion }) => `href="${championPath(champion.id)}"`)
				]
			: [
					'class="aram-role-items"',
					...aramGuide.augments[id].guide.roleItems.map((row) => `<span>${row.item}</span>`)
				])
	]) {
		if (!document.includes(marker))
			throw new Error(`${name} HTML에서 ${marker} 표시를 찾지 못했습니다.`);
	}
	if ((document.match(/<h1\b/g)?.length ?? 0) !== 1)
		throw new Error(`${name}의 h1은 1개여야 합니다.`);
	await checkAramImages(document, name);
	const graph = aramJsonLd(document, name);
	const list = graph.find((item) => item['@type'] === 'ItemList');
	if ((list?.itemListElement?.length ?? 0) !== seo.entries.length)
		throw new Error(`${name}의 챔피언 목록 구조화 데이터 수가 맞지 않습니다.`);
	const crumbs = graph.find((item) => item['@type'] === 'BreadcrumbList');
	if (crumbs?.itemListElement?.at(-1)?.item !== `https://hjh3311504.github.io${pathname}`)
		throw new Error(`${name}의 이동 경로 구조화 데이터가 올바르지 않습니다.`);
}
// 추천 기준은 통계 티어가 아니라 재미 위주 빌드라고 밝힌다. 안내 문구에 디시인사이드를 적지 않는다.
for (const [name, document] of [
	['아수라장 가이드', aramHtml],
	['아수라장 챔피언 공략', aramSampleHtml]
]) {
	if (/디시인사이드|승률이 높은/.test(document))
		throw new Error(`${name}의 추천 기준 안내에 통계·디시인사이드 표현이 남아 있습니다.`);
}
console.log(
	`아수라장 가이드 허브, 챔피언 공략 ${aramGuide.champions.length}개, 증강 공략 ${AUGMENT_PAGE_IDS.length}개의 정적 페이지·sitemap 검증 통과`
);

for (const marker of [
	pageName,
	'id="marble-guide-title"',
	'id="marble-methods-title"',
	'id="marble-uses-title"',
	'id="marble-faq-title"',
	'id="race-names"',
	'id="block-library-title"',
	'첫번째',
	'마지막',
	'여러명',
	'href="https://hjh3311504.github.io/marble-race"'
]) {
	if (!marbleHtml.includes(marker))
		throw new Error(`구슬 레이스 HTML에서 ${marker} 표시를 찾지 못했습니다.`);
}
if ((marbleHtml.match(/<h1\b/g)?.length ?? 0) !== 1)
	throw new Error('구슬 레이스의 h1은 1개여야 합니다.');
if (!sitemapHtml.includes('<loc>https://hjh3311504.github.io/marble-race</loc>'))
	throw new Error('sitemap에 구슬 레이스 주소가 없습니다.');
for (const document of [homeHtml, html, qrHtml]) {
	if (!/href="(?:\.\/|\/)marble-race"/.test(document))
		throw new Error('홈 또는 공통 메뉴에 구슬 레이스 링크가 없습니다.');
}
console.log('구슬 레이스 정적 페이지와 sitemap 검증 통과');

// 게임 실행 전의 정적 HTML에도 검색 정보와 실제 안내가 있어야 한다.
for (const marker of [
	`<title>${marbleTitle}</title>`,
	`name="description" content="${marbleDescription}"`,
	`property="og:title" content="${marbleTitle}"`,
	`property="og:description" content="${marbleDescription}"`,
	`property="og:image" content="${marbleImage}"`,
	`name="twitter:title" content="${marbleTitle}"`,
	`name="twitter:description" content="${marbleDescription}"`,
	`name="twitter:card" content="summary_large_image"`,
	`<link rel="canonical" href="${marbleUrl}"`,
	`name="robots" content="index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1"`
]) {
	if (!marbleHtml.includes(marker)) throw new Error(`ASMR 구슬 레이스 검색 정보 누락: ${marker}`);
}
const marbleJson = marbleHtml.match(/<script type="application\/ld\+json">([^<]+)<\/script>/);
if (!marbleJson) throw new Error('ASMR 구슬 레이스 구조화 데이터가 없습니다.');
const marbleGraph = JSON.parse(marbleJson[1])['@graph'];
const marbleApp = marbleGraph.find((item) => item['@type'] === 'WebApplication');
const marblePage = marbleGraph.find((item) => item['@type'] === 'WebPage');
if (
	marblePage?.url !== marbleUrl ||
	marblePage?.name !== marbleTitle ||
	marblePage?.description !== marbleDescription
)
	throw new Error('구슬 레이스 페이지 정보와 검색 정보가 일치하지 않습니다.');
const marbleMain = marbleHtml.match(/<main\b[^>]*>([\s\S]*?)<\/main>/)?.[1];
const marbleMainText = marbleMain
	?.replace(/<(script|style)\b[^>]*>[\s\S]*?<\/\1>/gi, '')
	.replace(/<[^>]+>/g, ' ');
// 앱 이름 뒤의 제목과 설명·본문이 실제 용도(구슬 도착 순서로 당첨자 결정)를 설명해야 합니다.
if (!marbleTitle.split('|')[1]?.includes('추첨'))
	throw new Error('구슬 레이스 검색 제목에 앱 이름 외의 추첨 용도 안내가 없습니다.');
for (const term of ['당첨자', '도착']) {
	if (!marbleDescription.includes(term))
		throw new Error(`구슬 레이스 검색 설명에 용도 안내가 없습니다: ${term}`);
	if (!marbleMainText?.includes(term))
		throw new Error(`구슬 레이스 정적 본문에 용도 안내가 없습니다: ${term}`);
}
// 다른 서비스 이름을 검색어로 쓰면 그 서비스를 베낀 페이지로 보일 수 있습니다.
// 공개 HTML과 RSS 전체에서 한글·영어 표기를 모두 확인합니다.
const otherServiceName = /마블\s?룰렛|마블\s?레이스|marble\s?(?:roulette|race)/i;
const publicTextFiles = (await readdir(path.join(root, 'build'), { recursive: true })).filter(
	(file) => /\.(?:html|xml)$/.test(file) && !file.startsWith('licenses')
);
for (const file of publicTextFiles) {
	const text = await readFile(path.join(root, 'build', file), 'utf8');
	const match = text.match(otherServiceName);
	if (match) throw new Error(`${file}에 다른 서비스 이름을 썼습니다: ${match[0]}`);
}
for (const text of [marblePageDescription, marbleGuideIntro]) {
	if (!marbleMain?.includes(text))
		throw new Error(`정적 본문에 구슬 추첨 소개가 없습니다: ${text}`);
}
const homeMarbleCard = homeHtml.match(
	/<a\b[^>]*\bhref="(?:\.\/|\/)marble-race"[^>]*>([\s\S]*?)<\/a>/g
);
if (
	!homeMarbleCard?.some((card) => {
		const text = card.replace(/<[^>]+>/g, ' ');
		return text.includes('구슬') && text.includes('당첨자');
	})
)
	throw new Error('홈의 구슬 레이스 카드에 구슬 추첨 용도 안내가 없습니다.');
if (
	marbleApp?.url !== marbleUrl ||
	marbleApp?.name !== pageName ||
	marbleApp?.description !== marbleDescription ||
	marbleApp?.offers?.price !== 0
)
	throw new Error('ASMR 구슬 레이스 앱 정보와 검색 설명이 일치하지 않습니다.');
if (marbleApp.aggregateRating || marbleApp.review)
	throw new Error('확인되지 않은 평점·리뷰를 넣지 않습니다.');
for (const faq of marbleFaqs) {
	if (!marbleHtml.includes(faq.question) || !marbleHtml.includes(faq.answer))
		throw new Error(`정적 HTML에 FAQ 본문이 없습니다: ${faq.question}`);
}
const marbleImageMeta = await sharp('build/images/marble-race-open-graph-1200x630.png').metadata();
if (marbleImageMeta.width !== 1200 || marbleImageMeta.height !== 630)
	throw new Error('ASMR 구슬 레이스 공유 이미지는1200×630이어야 합니다.');
console.log('ASMR 구슬 레이스 검색 정보·구조화 데이터·정적 가이드·공유 이미지 검증 통과');
