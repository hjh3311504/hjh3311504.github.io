import { access, readFile, stat } from 'node:fs/promises';
import path from 'node:path';

const root = process.cwd();
const requiredFiles = [
	'build/index.html',
	'build/team-maker/index.html',
	'build/team-maker/favicon.svg',
	'build/team-maker/styles.css',
	'build/team-maker/app.js',
	'build/team-maker/core.js'
];

for (const file of requiredFiles) {
	const absolutePath = path.join(root, file);
	await access(absolutePath);
	const details = await stat(absolutePath);
	if (!details.isFile() || details.size === 0) {
		throw new Error(`${file} 파일이 없거나 비어 있습니다.`);
	}
}

const html = await readFile(path.join(root, 'build/team-maker/index.html'), 'utf8');
const app = await readFile(path.join(root, 'build/team-maker/app.js'), 'utf8');
const css = await readFile(path.join(root, 'build/team-maker/styles.css'), 'utf8');

const requiredHtml = [
	'<title>팀 메이커</title>',
	'href="./styles.css"',
	'src="./app.js"',
	'id="participant-list"',
	'id="team-grid"'
];
for (const marker of requiredHtml) {
	if (!html.includes(marker))
		throw new Error(`team-maker HTML에서 ${marker} 표시를 찾지 못했습니다.`);
}

const combined = `${html}\n${app}\n${css}`;
if (/\b(?:src|href)=["']\/(?!\/)/.test(combined) || /url\(\s*["']?\//.test(combined)) {
	throw new Error('team-maker 자원에 사이트 루트 기준 경로가 있습니다.');
}
if (/https?:\/\//.test(combined)) {
	throw new Error('team-maker 제품 코드에서 외부 HTTP 자원을 찾았습니다.');
}
if (!app.includes("from './core.js'")) {
	throw new Error('화면 코드가 분리된 팀 배정 로직을 불러오지 않습니다.');
}

console.log(
	`Team Maker build 검증 통과: ${requiredFiles.length}개 파일, 상대 경로와 외부 자원 확인 완료`
);
