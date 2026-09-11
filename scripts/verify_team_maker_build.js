import { access, readFile, readdir, stat } from 'node:fs/promises';
import path from 'node:path';
import sharp from 'sharp';
import { verifyTeamMakerCss } from './verify_team_maker_css.js';
import { publishedLicenses } from './licenses.js';

const root = process.cwd();
const requiredFiles = [
	'build/favicon.svg',
	'build/favicon.ico',
	'build/images/site-open-graph-1200x630.png',
	'build/licenses/SUIT-LICENSE.txt',
	'build/licenses/SUITE-LICENSE.txt',
	'build/licenses/site-LICENSE.txt',
	'build/licenses/THIRD_PARTY_NOTICES.md',
	'build/index.html',
	'build/qr-code.html',
	'build/team-maker.html',
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
	'build/blog.html',
	'build/blog',
	'build/rss.xml',
	'build/team-maker',
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
const notFoundHtml = await readFile(path.join(root, 'build/404.html'), 'utf8');
// 광고 미실행 방침은 존재하지 않는 URL에 쓰이는 정적 404에도 적용합니다.
for (const [name, document] of [
	['홈', homeHtml],
	['Team Maker', html],
	['QR 코드', qrHtml],
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
	if (/<script\b[^>]*\bsrc=["'][^"']*(?:adsbygoogle|googlesyndication)/i.test(document)) {
		throw new Error(`${name} HTML에 광고 스크립트가 남아 있습니다.`);
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
if (!homeHtml.includes('id="privacy-dialog"') || !homeHtml.includes('개인정보처리방침')) {
	throw new Error('홈의 개인정보처리방침 모달이나 여는 버튼이 없습니다.');
}
if (!html.includes('id="privacy-dialog"') || !html.includes('개인정보처리방침')) {
	throw new Error('Team Maker의 개인정보처리방침 모달이나 여는 버튼이 없습니다.');
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
if (uiDialogTags.length !== 8) {
	throw new Error(
		`Team Maker의 공통 Dialog는 8개여야 합니다. 현재 ${uiDialogTags.length}개입니다.`
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

const collapsibleSectionCount = [...html.matchAll(/<details\b[^>]*>/g)]
	.map((match) => match[0])
	.filter(
		(tag) =>
			/\bclass="[^"]*\bseo-details\b[^"]*"/.test(tag) &&
			/(?:^|\s)open(?:=""|(?=\s|>))/.test(tag) &&
			/\bdata-ui-disclosure\b/.test(tag)
	).length;
if (collapsibleSectionCount !== 4) {
	throw new Error(
		`team-maker HTML의 기본 펼침 안내 섹션은 4개여야 합니다. 현재 ${collapsibleSectionCount}개입니다.`
	);
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
	const isToolPage = ['team-maker', 'qr-code'].includes(routeName);
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
	!app.includes('export function mountTeamMaker(root)') ||
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
	'id="privacy-dialog"',
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
if (!sitemapHtml.includes('<loc>https://hjh3311504.github.io/qr-code</loc>'))
	throw new Error('sitemap에 QR 코드 주소가 없습니다.');
if ((qrHtml.match(/<h1\b/g)?.length ?? 0) !== 1) throw new Error('QR 코드의 h1은 1개여야 합니다.');
console.log('QR 코드 정적 페이지와 sitemap 검증 통과');
