// 글자와 카드 배치를 코드로 관리하고 공개용 PNG를 재생성한다.
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { chromium } from '@playwright/test';
import sharp from 'sharp';

const font = async (name) =>
	(await readFile(`src/lib/team-maker/fonts/${name}-Variable.woff2`)).toString('base64');
const [suit, suite] = await Promise.all([font('SUIT'), font('SUITE')]);
const styles = `
@font-face { font-family: SUIT; src: url(data:font/woff2;base64,${suit}); font-weight: 100 900; }
@font-face { font-family: SUITE; src: url(data:font/woff2;base64,${suite}); font-weight: 100 900; }
* { box-sizing: border-box; }
body { margin: 0; width: 1200px; height: 630px; font-family: SUIT, sans-serif; color: #1c1e26; background: #f6f5f4; }
main { position: relative; display: flex; align-items: center; gap: 44px; width: 100%; height: 100%; padding: 64px; background: linear-gradient(135deg, #e4effa 0%, #f6f5f4 55%); }
.brand { position: absolute; top: 42px; left: 64px; display: flex; align-items: center; gap: 10px; font-size: 19px; font-weight: 700; color: #615d59; }
.logo { display: grid; place-items: center; width: 28px; height: 28px; border-radius: 8px; background: #0075de; color: white; font-weight: 800; }
.copy { flex: 0 0 450px; }
.eyebrow { color: #0075de; font-size: 22px; font-weight: 750; margin: 0 0 18px; }
h1 { font-family: SUITE; font-size: 76px; line-height: 1.06; letter-spacing: -3px; margin: 0 0 24px; font-weight: 850; }
.description { font-size: 27px; line-height: 1.6; color: #5b5f6b; margin: 0; letter-spacing: -0.6px; }
.url { position: absolute; bottom: 40px; left: 64px; color: #615d59; font-size: 18px; }
.preview { flex: 1; min-width: 0; border: 1px solid #d9e4ef; border-radius: 22px; background: #fff; padding: 24px; box-shadow: 0 20px 45px -20px #1c1e2630; }
.preview-heading { display: flex; align-items: center; justify-content: space-between; margin-bottom: 22px; font-weight: 800; font-size: 24px; }
.count { color: #5b5f6b; font-size: 17px; font-weight: 600; }
.teams { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 12px; }
.team { padding: 16px 12px; border: 1px solid #e7ecf2; border-top: 3px solid #0075de; border-radius: 14px; box-shadow: 0 2px 8px #1c1e260d; }
.team h2 { margin: 0 0 18px; font-family: SUITE; font-size: 24px; }
.person { display: block; margin-top: 9px; padding: 10px 8px; border: 1px solid #e7ecf2; border-radius: 8px; font-size: 21px; font-weight: 600; }
.result-note { margin: 20px 0 0; color: #0075de; font-size: 18px; font-weight: 700; }
.home h1 { font-size: 65px; letter-spacing: -2px; }
.project { padding: 24px; border: 1px solid #e6e6e6; border-radius: 14px; }
.project-icon { width: 48px; height: 48px; display: grid; place-items: center; border-radius: 12px; background: #2a9d99; color: #fff; font-size: 30px; margin-bottom: 18px; }
.project h2 { font-family: SUITE; font-size: 30px; margin: 0 0 10px; }
.project p { font-size: 22px; color: #615d59; line-height: 1.5; margin: 0; }
.open { display: inline-block; background: #0075de; color: #fff; font-size: 20px; font-weight: 700; padding: 10px 18px; border-radius: 8px; margin-top: 22px; }
.marble-copy h1 { font-size: 64px; line-height: 1.15; }
.marble-preview { background: #102635; color: white; padding: 28px; }
.marble-preview .count { color: #addadf; font-size: 16px; }
.marbles { display: flex; justify-content: space-around; align-items: center; height: 124px; }
.marble { display: grid; place-items: center; width: 72px; height: 72px; border-radius: 50%; background: #79d4ef; color: #123147; font-size: 20px; font-weight: 800; box-shadow: inset -6px -8px 0 #0002; }
.marble:nth-child(2) { background: #ffdc91; transform: translateY(-14px); }
.marble:nth-child(3) { background: #cdb6ef; transform: translateY(10px); }
.sound-tiles { display: grid; grid-template-columns: repeat(7, 1fr); gap: 6px; }
.sound-tile { display: grid; place-items: center; height: 44px; border-radius: 10px; background: #f2d3a7; color: #654d38; font-size: 20px; font-weight: 800; box-shadow: inset 0 -5px #0002; }
.sound-tile:nth-child(n+15) { background: #91d9c9; color: #285d58; }
.marble-note { margin: 22px 0 0; color: #d4e9ef; font-size: 18px; text-align: center; }
`;
const teams = [
	['가람', '나래'],
	['다온', '라온'],
	['마루', '하늘']
]
	.map(
		(names, index) =>
			`<section class="team"><h2>${index + 1}팀</h2>${names.map((name) => `<span class="person">${name}</span>`).join('')}</section>`
	)
	.join('');
const pages = [
	{
		name: 'marble-race',
		title: 'ASMR 구슬 레이스',
		body: `<div class="copy marble-copy"><p class="eyebrow">무료 구슬 추첨기 · 랜덤 뽑기</p><h1>ASMR<br>구슬 레이스</h1><p class="description">이름을 넣고, 소리로 즐기는 추첨<br>수업에서도 방송에서도</p></div><div class="preview marble-preview"><div class="preview-heading">톡톡, 뽁뽁! <span class="count">이름을 건 레이스</span></div><div class="marbles"><span class="marble">토끼</span><span class="marble">고양이</span><span class="marble">오리</span></div><div class="sound-tiles">${Array.from({ length: 28 }, (_, i) => `<span class="sound-tile">${i < 14 ? ['A', 'S', 'M', 'R', 'K', 'E', 'Y'][i % 7] : '●'}</span>`).join('')}</div><p class="marble-note">첫번째 · 마지막 · 여러명 · n번째</p></div>`,
		url: 'hjh3311504.github.io/marble-race'
	},
	{
		name: 'team-maker',
		title: '팀 메이커',
		body: `<div class="copy"><p class="eyebrow">무료 온라인 도구</p><h1>팀 메이커</h1><p class="description">스포츠·게임·모임을 위한<br>무료 팀짜기·조짜기</p></div><div class="preview"><div class="preview-heading">팀 배정 결과 <span class="count">6명 · 3팀</span></div><div class="teams">${teams}</div><p class="result-note">함께할 팀, 간편하게 나누세요.</p></div>`,
		url: 'hjh3311504.github.io/team-maker'
	},
	{
		name: 'site',
		title: "Lake's develog",
		body: `<div class="copy home"><p class="eyebrow">개발 도구와 프로젝트</p><h1>Lake’s<br>develog</h1><p class="description">직접 만들고 사용한 도구를<br>한곳에 모았습니다.</p></div><div class="preview"><div class="preview-heading">둘러보기 <span class="count">PROJECTS</span></div><section class="project"><div class="project-icon">↗</div><h2>팀 메이커</h2><p>스포츠·게임·모임 참가자를<br>고르게 나누는 무료 도구</p><span class="open">도구 열기 →</span></section></div>`,
		url: 'hjh3311504.github.io'
	}
];

await mkdir('static/images', { recursive: true });
await mkdir('static/favicons', { recursive: true });
const browser = await chromium.launch();
try {
	const page = await browser.newPage({
		viewport: { width: 1200, height: 630 },
		deviceScaleFactor: 1
	});
	for (const asset of pages) {
		await page.setContent(
			`<!doctype html><html lang="ko"><head><meta charset="utf-8"><title>${asset.title}</title><style>${styles}</style></head><body><main><div class="brand"><span class="logo">L</span> Lake's develog</div>${asset.body}<span class="url">${asset.url}</span></main></body></html>`
		);
		await page.evaluate(() => document.fonts.ready);
		const overflow = await page.evaluate(() =>
			[...document.querySelectorAll('main *')].some(
				(element) => element.scrollWidth > element.clientWidth + 1
			)
		);
		if (overflow) throw new Error(`${asset.name} 공유 이미지에서 내용이 넘칩니다.`);
		await page.screenshot({ path: `static/images/${asset.name}-open-graph-1200x630.png` });
	}
} finally {
	await browser.close();
}

const icon = await readFile('static/favicon.svg');
for (const [name, size] of [
	['favicon-32x32', 32],
	['apple-touch-icon', 180],
	['android-chrome-192x192', 192],
	['android-chrome-512x512', 512]
]) {
	await sharp(icon).resize(size, size).png().toFile(`static/favicons/${name}.png`);
}
// 브라우저의 기본 /favicon.ico 요청에도 같은 아이콘을 제공한다.
const png = await sharp(icon).resize(32, 32).png().toBuffer();
const header = Buffer.alloc(22);
header.writeUInt16LE(1, 2);
header.writeUInt16LE(1, 4);
header[6] = header[7] = 32;
header.writeUInt16LE(1, 10);
header.writeUInt16LE(32, 12);
header.writeUInt32LE(png.length, 14);
header.writeUInt32LE(22, 18);
await writeFile('static/favicon.ico', Buffer.concat([header, png]));
console.log('홈·Team Maker·ASMR 구슬 레이스 공유 이미지와 Lake favicon을 생성했습니다.');
