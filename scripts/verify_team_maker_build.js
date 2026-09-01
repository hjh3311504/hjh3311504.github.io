import { access, readFile, stat } from 'node:fs/promises';
import path from 'node:path';

const root = process.cwd();
const requiredFiles = [
	'build/index.html',
	'build/team-maker/index.html',
	'build/team-maker/favicon.svg'
];

for (const file of requiredFiles) {
	const absolutePath = path.join(root, file);
	await access(absolutePath);
	const details = await stat(absolutePath);
	if (!details.isFile() || details.size === 0) {
		throw new Error(`${file} 파일이 없거나 비어 있습니다.`);
	}
}

const removedOutputs = ['build/blog.html', 'build/blog', 'build/rss.xml'];
for (const output of removedOutputs) {
	try {
		await access(path.join(root, output));
		throw new Error(`${output} 파일 또는 디렉터리가 남아 있습니다.`);
	} catch (error) {
		if (error?.code !== 'ENOENT') throw error;
	}
}

const html = await readFile(path.join(root, 'build/team-maker/index.html'), 'utf8');
const page = await readFile(path.join(root, 'src/routes/team-maker/+page.svelte'), 'utf8');
const app = await readFile(path.join(root, 'src/lib/team-maker/app.js'), 'utf8');
const core = await readFile(path.join(root, 'src/lib/team-maker/core.js'), 'utf8');
const css = await readFile(path.join(root, 'src/routes/team-maker/team-maker.css'), 'utf8');

const requiredHtml = [
	'<title>팀 메이커</title>',
	'id="participant-list"',
	'id="team-grid"',
	'_app/immutable/'
];
for (const marker of requiredHtml) {
	if (!html.includes(marker))
		throw new Error(`team-maker HTML에서 ${marker} 표시를 찾지 못했습니다.`);
}

const localReferences = [...html.matchAll(/\b(?:href|src)="([^"]+)"/g)]
	.map((match) => match[1])
	.filter((reference) => !/^(?:https?:|data:|#)/.test(reference));
for (const reference of new Set(localReferences)) {
	const cleanReference = decodeURIComponent(reference.split(/[?#]/, 1)[0]);
	const absolutePath = cleanReference.startsWith('/')
		? path.join(root, 'build', cleanReference.slice(1))
		: path.resolve(root, 'build/team-maker', cleanReference);
	if (!absolutePath.startsWith(path.join(root, 'build'))) {
		throw new Error(`team-maker HTML의 자원 경로가 build 밖을 가리킵니다: ${reference}`);
	}
	await access(absolutePath);
}

const combined = `${page}\n${app}\n${core}\n${css}`;
if (/\b(?:src|href)=["']\/(?!\/)/.test(combined) || /url\(\s*["']?\//.test(combined)) {
	throw new Error('team-maker 자원에 사이트 루트 기준 경로가 있습니다.');
}
if (/https?:\/\//.test(combined)) {
	throw new Error('team-maker 제품 코드에서 외부 HTTP 자원을 찾았습니다.');
}
if (!app.includes("from './core.js'")) {
	throw new Error('화면 코드가 분리된 팀 배정 로직을 불러오지 않습니다.');
}
if (!page.includes("from '$lib/team-maker/app.js'")) {
	throw new Error('SvelteKit route가 Team Maker 화면 module을 불러오지 않습니다.');
}
if (html.includes('src="./app.js"') || html.includes('href="./styles.css"')) {
	throw new Error('team-maker build가 이전 정적 entrypoint를 사용하고 있습니다.');
}

console.log(
	`Team Maker SvelteKit build 검증 통과: 필수 파일 ${requiredFiles.length}개, local 자원 ${new Set(localReferences).size}개`
);
