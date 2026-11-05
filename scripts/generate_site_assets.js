// 글자와 카드 배치를 코드로 관리하고 공개용 PNG를 재생성한다.
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { chromium } from '@playwright/test';
import sharp from 'sharp';

const font = async (name) =>
	(await readFile(`src/lib/team-maker/fonts/${name}-Variable.woff2`)).toString('base64');
const [suit, suite] = await Promise.all([font('SUIT'), font('SUITE')]);
const logo = (await readFile('static/favicon.svg', 'utf8')).replace('<svg ', '<svg class="logo" ');
// 홈 공유 이미지는 홈 소개 영역과 같은 그림을 쓴다.
const heroArt = await readFile('static/images/home/seta-lab-hero.svg', 'utf8');
const styles = `
@font-face { font-family: SUIT; src: url(data:font/woff2;base64,${suit}); font-weight: 100 900; }
@font-face { font-family: SUITE; src: url(data:font/woff2;base64,${suite}); font-weight: 100 900; }
* { box-sizing: border-box; }
body { margin: 0; width: 1200px; height: 630px; font-family: SUIT, sans-serif; color: #1c1e26; background: #f6f5f4; }
main { position: relative; display: flex; align-items: center; gap: 44px; width: 100%; height: 100%; padding: 64px; background: linear-gradient(135deg, #e4effa 0%, #f6f5f4 55%); }
.brand { position: absolute; top: 42px; left: 64px; display: flex; align-items: center; gap: 10px; font-size: 19px; font-weight: 700; color: #615d59; }
.logo { display: block; width: 28px; height: 28px; }
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
.home h1 { font-size: 76px; letter-spacing: -2px; }
main.navy { background: #0d2a47; color: #fff; }
.navy .brand, .navy .url { color: #c7d7e8; }
.navy .eyebrow { color: #7fc0ff; }
.navy .description { color: #c7d7e8; }
.hero-art { flex: 1; min-width: 0; }
.hero-art svg { display: block; width: 100%; height: auto; }
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
.qr-preview { display: grid; grid-template-columns: auto 1fr; gap: 28px; align-items: center; }
.qr-code { display: grid; grid-template-columns: repeat(21, 10px); grid-template-rows: repeat(21, 10px); padding: 14px; border: 1px solid #e7ecf2; border-radius: 14px; background: #fff; }
.qr-code i { background: #1c1e26; border-radius: 2px; }
.qr-meta h2 { margin: 0 0 10px; font-family: SUITE; font-size: 26px; }
.qr-meta p { margin: 0 0 18px; color: #5b5f6b; font-size: 19px; line-height: 1.5; }
.chip-row { display: flex; gap: 8px; flex-wrap: wrap; }
.chip { padding: 8px 12px; border: 1px solid #d9e4ef; border-radius: 8px; font-size: 17px; font-weight: 700; color: #37352f; }
.chip.primary { background: #6d4bc3; border-color: #6d4bc3; color: #fff; }
.bracket-svg { display: block; width: 100%; height: auto; }
.aram-preview { background: #14233a; color: #fff; }
.aram-preview .count { color: #9fb6cc; }
.aram-row { display: grid; grid-template-columns: 64px 1fr auto; gap: 14px; align-items: center; padding: 14px; margin-top: 10px; border-radius: 12px; background: #ffffff10; }
.aram-row b { display: block; font-size: 20px; }
.aram-row div > span { display: block; margin-bottom: 8px; color: #9fb6cc; font-size: 16px; }
.champ { width: 64px; height: 64px; border-radius: 14px; background: linear-gradient(135deg, #7a5af8, #e8833a); }
.aram-row .tier { padding: 6px 10px; border-radius: 999px; font-size: 15px; font-weight: 800; color: #14233a; }
.items { display: flex; gap: 6px; }
.items i { width: 28px; height: 28px; border-radius: 6px; background: #ffffff2a; border: 1px solid #ffffff33; }
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
// 실제로 읽히지 않는 장식용 QR 무늬를 고정된 규칙으로 만든다.
const qrCells = Array.from({ length: 21 * 21 }, (_, index) => {
	const x = index % 21;
	const y = Math.floor(index / 21);
	const finder = [
		[0, 0],
		[14, 0],
		[0, 14]
	].some(([fx, fy]) => {
		const dx = x - fx;
		const dy = y - fy;
		if (dx < 0 || dy < 0 || dx > 6 || dy > 6) return null;
		return (
			dx === 0 || dy === 0 || dx === 6 || dy === 6 || (dx >= 2 && dx <= 4 && dy >= 2 && dy <= 4)
		);
	});
	const inFinder = [
		[0, 0],
		[14, 0],
		[0, 14]
	].some(([fx, fy]) => x >= fx && x <= fx + 7 && y >= fy && y <= fy + 7);
	const on = inFinder ? finder : (x * 7 + y * 13 + x * y) % 5 < 2;
	return `<i style="grid-column:${x + 1};grid-row:${y + 1};${on ? '' : 'visibility:hidden'}"></i>`;
}).join('');
const bracketTeams = ['청팀', '백팀', '홍팀', '황팀'];
const bracketSvg = `<svg class="bracket-svg" viewBox="0 0 560 300" font-family="SUIT" font-size="20" font-weight="700">
${bracketTeams.map((team, i) => `<rect x="0" y="${16 + i * 72}" width="150" height="48" rx="10" fill="${i % 2 === 0 ? '#fff4e8' : '#fff'}" stroke="#e7ecf2"/><text x="20" y="${47 + i * 72}" fill="#1c1e26">${team}</text>`).join('')}
<path d="M150 40h40v72h-40M150 184h40v72h-40M190 76h50M190 220h50M240 76v144M240 148h60" fill="none" stroke="#c87533" stroke-width="4" stroke-linejoin="round"/>
<rect x="300" y="124" width="150" height="48" rx="10" fill="#fff4e8" stroke="#c87533" stroke-width="2"/><text x="320" y="155" fill="#1c1e26">청팀</text>
<path d="M450 148h40" stroke="#c87533" stroke-width="4"/><circle cx="520" cy="148" r="30" fill="#c87533"/><path d="M508 136h24v8a12 12 0 0 1-24 0zM514 160h12M520 156v4" stroke="#fff" stroke-width="3" fill="none" stroke-linecap="round"/>
</svg>`;
const aramRows = [
	['#d9dde3', '실버', '안정적인 첫 증강'],
	['#ffd27a', '골드', '핵심 조합 완성'],
	['#c4b5fd', '프리즘', '한타를 바꾸는 선택']
]
	.map(
		([color, tier, text]) =>
			`<div class="aram-row"><span class="champ"></span><div><b>추천 증강 조합</b><span>${text}</span><div class="items"><i></i><i></i><i></i></div></div><span class="tier" style="background:${color}">${tier}</span></div>`
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
		name: 'qr-code',
		title: 'QR 코드 만들기',
		body: `<div class="copy"><p class="eyebrow">무료 QR 코드 생성기</p><h1>QR 코드<br>만들기</h1><p class="description">주소와 텍스트를 QR로 만들고<br>저장·복사·인쇄까지</p></div><div class="preview qr-preview"><div class="qr-code">${qrCells}</div><div class="qr-meta"><h2>모임 참여 신청</h2><p>제목을 붙여 저장하고<br>A4 한 장에 12개 인쇄</p><div class="chip-row"><span class="chip primary">PNG 저장</span><span class="chip">복사</span><span class="chip">인쇄</span></div></div></div>`,
		url: 'hjh3311504.github.io/qr-code'
	},
	{
		name: 'bracket',
		title: '대진표 만들기',
		body: `<div class="copy"><p class="eyebrow">무료 토너먼트 도구</p><h1>대진표<br>만들기</h1><p class="description">2~32팀 토너먼트를 만들고<br>이긴 팀을 눌러 우승까지</p></div><div class="preview"><div class="preview-heading">4팀 토너먼트 <span class="count">결승 · 우승</span></div>${bracketSvg}</div>`,
		url: 'hjh3311504.github.io/bracket'
	},
	{
		name: 'aram-mayhem',
		title: '칼바람 아수라장 증강 가이드',
		body: `<div class="copy"><p class="eyebrow">칼바람 아수라장</p><h1>증강<br>가이드</h1><p class="description">챔피언별 추천 증강 조합과<br>코어 아이템 순서 정리</p></div><div class="preview aram-preview"><div class="preview-heading">챔피언 공략 <span class="count">증강 · 아이템</span></div>${aramRows}</div>`,
		url: 'hjh3311504.github.io/aram-mayhem'
	},
	{
		name: 'site',
		title: 'Seta Lab',
		theme: 'navy',
		body: `<div class="copy home"><p class="eyebrow">필요한 도구를 한곳에</p><h1>Seta Lab</h1><p class="description">설치나 가입 없이 브라우저에서<br>바로 쓰는 무료 도구</p></div><div class="hero-art">${heroArt}</div>`,
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
			`<!doctype html><html lang="ko"><head><meta charset="utf-8"><title>${asset.title}</title><style>${styles}</style></head><body><main class="${asset.theme ?? ''}"><div class="brand">${logo} Seta Lab</div>${asset.body}<span class="url">${asset.url}</span></main></body></html>`
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
console.log(
	'홈과 도구 5개(Team Maker·구슬 레이스·QR 코드·대진표·아수라장 가이드)의 공유 이미지와 Seta Lab favicon을 생성했습니다.'
);
