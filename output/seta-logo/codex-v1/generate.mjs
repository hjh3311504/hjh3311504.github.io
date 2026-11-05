import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import * as fontkit from 'fontkit';

const dir = path.dirname(fileURLToPath(import.meta.url));
const font = fontkit.openSync(path.join(dir, 'SUIT-800.ttf'));
const B = '#0075de', N = '#0d2a47', C = '#7bcdf3', O = '#ffb35a';
const candidates = [
  {
    slug: 'folded-ribbon', name: '접힌 리본', type: '추상 · S 이니셜',
    concept: '한 줄의 리본을 접어, 해 보고 다듬는 Seta의 S를 만들었습니다.',
    point: '단단한 인상 · 작은 아이콘에 유리',
    body: `<path fill="${B}" d="M76 13H35C20 13 10 23 10 36c0 10 6 18 17 23l31 14H20v11h42c15 0 24-10 24-23 0-11-6-18-17-23L39 24h37Z"/><path fill="${C}" d="m28 29 43 20 9-10-41-19Z"/><path fill="${B}" d="m22 37 44 20c3 2 5 4 5 6 0 3-3 5-7 5L25 50Z"/><path fill="${N}" d="m39 24-11 5 9 4 12-5Z"/><path fill="${N}" d="m58 73 11-5-9-4-12 4Z"/>`,
  },
  {
    slug: 'field-notes', name: '펼친 기록', type: '책 · 도구와 기록',
    concept: '펼친 두 장의 기록에 책갈피를 더해, 도구와 가이드를 함께 담았습니다.',
    point: '차분한 인상 · 블로그와 도구를 함께 표현',
    body: `<path fill="${B}" d="M12 19c13-2 25 2 33 9v55C34 74 24 72 9 74V28q0-7 3-9Z"/><path fill="${B}" d="M84 19c-13-2-25 2-33 9v55c11-9 21-11 36-9V28q0-7-3-9Z"/><path fill="${C}" d="M57 12h17v35l-8.5-7-8.5 7Z"/><path d="M22 38c5 0 9 1 13 3M22 51c5 0 9 1 13 3" fill="none" stroke="white" stroke-width="5" stroke-linecap="round"/>`,
  },
  {
    slug: 'tool-bloom', name: '쓸모꽃', type: '추상 · 모듈',
    concept: '서로 다른 다섯 조각이 모여, 작은 도구가 늘어나는 실험실을 그렸습니다.',
    point: '밝은 인상 · 여러 도구를 묶는 상징',
    body: `<g fill="${B}"><path d="M43 38C28 25 32 9 43 8c14-2 20 12 9 29l-4 6Z"/><path d="M43 38C28 25 32 9 43 8c14-2 20 12 9 29l-4 6Z" transform="rotate(72 48 48)"/><path d="M43 38C28 25 32 9 43 8c14-2 20 12 9 29l-4 6Z" transform="rotate(144 48 48)"/><path d="M43 38C28 25 32 9 43 8c14-2 20 12 9 29l-4 6Z" transform="rotate(216 48 48)"/><path d="M43 38C28 25 32 9 43 8c14-2 20 12 9 29l-4 6Z" transform="rotate(288 48 48)"/></g><path fill="${O}" d="m48 40 8 6-3 10H43l-3-10Z"/>`,
  },
  {
    slug: 'curious-otter', name: '호기심 수달', type: '마스코트 · 캐릭터',
    concept: '손으로 만지고 살펴보는 수달을, 친근한 세타랩의 얼굴로 만들었습니다.',
    point: '친근한 인상 · 닉네임과 함께 기억하기 쉬움',
    body: `<path fill="${B}" d="M18 27C7 13 21 4 31 17c10-4 24-4 34 0C75 4 89 13 78 27c6 8 9 17 9 27 0 23-17 34-39 34S9 77 9 54c0-10 3-19 9-27Z"/><path fill="white" d="M48 48c-7-12-25-8-25 5 0 9 12 16 25 22 13-6 25-13 25-22 0-13-18-17-25-5Z"/><path fill="${N}" d="M40 48q8-5 16 0-1 10-8 10t-8-10Z"/><path d="M48 57v7" stroke="${N}" stroke-width="3.5" stroke-linecap="round"/><ellipse cx="30" cy="35" rx="3.6" ry="4.8" fill="${N}"/><ellipse cx="66" cy="35" rx="3.6" ry="4.8" fill="${N}"/><path d="m15 54 14 3m-13 9 14-3m51-9-14 3m13 9-14-3" stroke="${C}" stroke-width="3.4" stroke-linecap="round"/>`,
  },
  {
    slug: 'guide-bird', name: '길잡이 새', type: '심볼 · 종이 새',
    concept: '앞으로 향하는 새와 접힌 종이를 겹쳐, 바로 써 보는 가벼움을 담았습니다.',
    point: '경쾌한 인상 · 홈의 남색 소개 영역과 조화',
    body: `<path fill="${B}" d="m9 23 37 15 17-20c5-5 15-4 18 3l4 10 8 5-15 9c-6 23-27 36-55 34l17-22Z"/><path fill="${C}" d="m9 23 48 23-17 11Z"/><path fill="${N}" d="m40 57 17-11-7 19Z"/><path fill="white" d="m67 29 5-2 2 5-5 2Z"/><path fill="${B}" d="m15 83 11-16 12 4Z"/>`,
  },
  {
    slug: 'seta-type', name: '세타 활자', type: '워드마크 · 이름 중심',
    concept: '크게 쓴 S와 작은 밑줄을 짝지어, 이름을 앞세운 활자 로고를 만들었습니다.',
    point: '명료한 인상 · 가로 워드마크를 주인공으로 사용',
    body: null,
  },
  {
    slug: 'workbench', name: '작은 작업대', type: '심볼 · 도구 상자',
    concept: '열린 뚜껑과 정돈된 서랍으로, 필요한 도구를 꺼내 쓰는 공간을 표현했습니다.',
    point: '실용적인 인상 · 무료 브라우저 도구에 초점',
    body: `<path fill="${B}" d="m10 27 65-13q6-1 7 5l3 13-72 14Z"/><path fill="${C}" d="m30 17-2-9 27-5 2 9-7 1-1-3-12 2 1 3Z"/><path fill="${B}" d="M10 48h76v30q0 8-8 8H18q-8 0-8-8Z"/><path fill="white" d="M21 59h54v6H21Z"/><path fill="${O}" d="M41 42h14v16H41Z"/><path fill="${C}" d="M37 74h22v5H37Z"/>`,
  },
  {
    slug: 'idea-sprout', name: '자라는 생각', type: '유기적 추상 · 새싹',
    concept: '작은 씨앗에서 두 잎이 펴지듯, 직접 한 실험이 쓸모로 자라는 모습을 담았습니다.',
    point: '부드러운 인상 · 개인 실험과 기록에 초점',
    body: `<path fill="${B}" d="M46 64C15 65 3 45 11 17c27-3 45 12 41 36 9-29 23-40 37-40 4 31-8 48-29 51l-7 21H37Z"/><path d="M24 32c11 7 18 16 23 29" fill="none" stroke="white" stroke-width="5" stroke-linecap="round"/><path fill="${C}" d="M59 57c3-14 10-25 20-33-1 17-7 28-20 33Z"/>`,
  },
];

function lettering(text, x, y, size, color, spacing = 0) {
  const run = font.layout(text); let advance = 0;
  const scale = size / font.unitsPerEm;
  const parts = run.glyphs.map((g, i) => {
    const p = run.positions[i];
    const s = `<path d="${g.path.toSVG()}" transform="translate(${x + (advance + p.xOffset) * scale} ${y - p.yOffset * scale}) scale(${scale} ${-scale})"/>`;
    advance += p.xAdvance + spacing / scale;
    return s;
  });
  return {svg:`<g fill="${color}">${parts.join('')}</g>`, width:advance * scale};
}
candidates[5].body = lettering('S', 14, 83, 103, B).svg + `<path fill="${O}" d="M65 79h18v7H65Z"/>`;

function svg(body, vb, title) {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${vb}" role="img" aria-label="${title}"><title>${title}</title>${body}</svg>\n`;
}

for (let i = 0; i < candidates.length; i++) {
  const c = candidates[i]; c.id = String(i + 1).padStart(2, '0'); c.file = `${c.id}-${c.slug}`;
  fs.writeFileSync(path.join(dir, `${c.file}.svg`), svg(c.body, '0 0 96 96', c.name));
  const title = lettering('Seta Lab', 106, 65, 47, N, -0.65);
  const lockBody = `<g>${c.body}</g>${title.svg}`;
  const w = Math.ceil(title.width + 119);
  c.lockWidth = w;
  if(i===5){
    const first=lettering('Seta',9,70,72,B,-1.6);
    const lab=lettering('Lab',first.width+22,70,46,N,-0.6);
    c.lockWidth=Math.ceil(first.width+lab.width+34);
    const accent=`<path fill="${O}" d="M${c.lockWidth-30} 79h18v7h-18Z"/>`;
    fs.writeFileSync(path.join(dir, `${c.file}-lockup.svg`), svg(first.svg+lab.svg+accent,`0 0 ${c.lockWidth} 96`,'Seta Lab · '+c.name));
    fs.writeFileSync(path.join(dir, `${c.file}-lockup-dark.svg`), svg(first.svg+lettering('Lab',first.width+22,70,46,'#ffffff',-0.6).svg+accent,`0 0 ${c.lockWidth} 96`,'Seta Lab · '+c.name));
  } else {
    fs.writeFileSync(path.join(dir, `${c.file}-lockup.svg`), svg(lockBody, `0 0 ${w} 96`, 'Seta Lab · ' + c.name));
    fs.writeFileSync(path.join(dir, `${c.file}-lockup-dark.svg`), svg(`<g>${c.body}</g>${lettering('Seta Lab',106,65,47,'#ffffff',-0.65).svg}`,`0 0 ${w} 96`, 'Seta Lab · ' + c.name));
  }
}
fs.copyFileSync(path.resolve('src/lib/team-maker/fonts/SUIT-Variable.woff2'), path.join(dir,'SUIT-Variable.woff2'));
fs.copyFileSync(path.resolve('src/lib/team-maker/fonts/SUIT-LICENSE.txt'), path.join(dir,'SUIT-LICENSE.txt'));

const hero = lettering('Seta Lab',0,87,100,'white',-1.4);
const image = (c, size, extra='') => `<img src="${c.file}.svg" width="${size}" height="${size}" alt="${c.name}" ${extra}>`;
const cards = candidates.map(c => `<article id="candidate-${c.id}">
  <header class="card-head"><div><span class="num">${c.id}</span><h2>${c.name}</h2></div><span class="type">${c.type}</span></header>
  <p class="concept">${c.concept}</p>
  <div class="stages"><div class="stage light">${image(c,104)}<span>밝은 배경 · #f6f5f4</span></div><div class="stage dark">${image(c,104)}<span>어두운 배경 · #191919</span></div></div>
  <div class="micro"><div class="micro-label">실제 크기<span>확대 없이 표시</span></div><div class="micro-set light">${image(c,16)}<i>16px</i>${image(c,32)}<i>32px</i></div><div class="micro-set dark">${image(c,16)}<i>16px</i>${image(c,32)}<i>32px</i></div></div>
  <div class="lockups"><div class="sidebar"><span>사이드바</span><img src="${c.file}-lockup.svg" width="${c.lockWidth/3}" height="32" alt="${c.name} 가로 조합"></div><div class="sidebar navy"><span>남색 화면</span><img src="${c.file}-lockup-dark.svg" width="${c.lockWidth/3}" height="32" alt="${c.name} 흰 글자 가로 조합"></div></div>
  <footer><span>${c.point}</span><a href="${c.file}.svg">SVG ↗</a><a href="${c.file}-lockup.svg">가로형 ↗</a></footer>
</article>`).join('');

const html=`<!doctype html>
<html lang="ko"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>Seta Lab · 로고 시안 8개</title>
<style>
@font-face{font-family:SUIT;src:url('SUIT-Variable.woff2') format('woff2');font-weight:100 900;font-display:swap}
*{box-sizing:border-box}html{scroll-behavior:smooth}body{margin:0;background:#eaeef1;color:#0d2a47;font-family:SUIT,system-ui,sans-serif;-webkit-font-smoothing:antialiased}a{color:inherit}main{max-width:1360px;margin:auto;padding:38px 40px 26px}.hero{border-radius:24px;background:#0d2a47;color:white;padding:38px 42px;display:grid;grid-template-columns:1.15fr 1fr;gap:36px;align-items:center}.eyebrow{color:#95caee;font-size:13px;letter-spacing:1.8px;font-weight:750;margin:0 0 20px}.hero svg{display:block;width:340px;max-width:100%;height:auto}.hero h1{font-size:23px;letter-spacing:-.5px;margin:0 0 12px}.hero p{font-size:15px;color:#bbd0e1;line-height:1.7;margin:0}.pills{display:flex;gap:8px;margin-top:22px;flex-wrap:wrap}.pills span{border:1px solid #46617b;border-radius:30px;padding:6px 11px;color:#e0ebf5;font-size:11px}.intro{display:flex;justify-content:space-between;align-items:center;gap:16px;margin:28px 0 18px}.intro h2{font-size:20px;margin:0;letter-spacing:-.5px}.intro p{font-size:12px;color:#577084;margin:0}.grid{display:grid;grid-template-columns:1fr 1fr;gap:22px}article{background:white;border:1px solid #dce3e9;border-radius:18px;overflow:hidden;min-width:0;scroll-margin-top:20px}.card-head{display:flex;align-items:center;justify-content:space-between;gap:8px;padding:22px 24px 0}.card-head>div{display:flex;gap:11px;align-items:center}.num{font-size:12px;display:grid;place-items:center;width:28px;height:28px;border-radius:8px;background:#e8f3ff;color:#0075de;font-weight:850}.card-head h2{font-size:21px;letter-spacing:-.6px;margin:0;white-space:nowrap}.type{font-size:11px;color:#6a7d8b;white-space:nowrap}.concept{font-size:13px;line-height:1.65;min-height:43px;margin:10px 24px 16px;word-break:keep-all}.stages{display:grid;grid-template-columns:1fr 1fr;gap:1px;margin:0 18px;border-radius:12px;overflow:hidden}.stage{height:167px;display:flex;align-items:center;justify-content:center;flex-direction:column;gap:14px}.stage span{font-size:10px;color:#77818b}.stage.dark span{color:#9da6af}.light{background:#f6f5f4}.dark{background:#191919}.micro{display:grid;grid-template-columns:100px 1fr 1fr;align-items:stretch;margin:16px 18px 0;gap:8px}.micro-label{font-size:11px;font-weight:800;display:flex;flex-direction:column;justify-content:center;gap:5px;padding-left:6px}.micro-label span{font-size:10px;font-weight:450;color:#7b8997}.micro-set{height:54px;border-radius:8px;display:flex;align-items:center;justify-content:center;gap:8px}.micro-set i{font-style:normal;font-size:9px;color:#71808c}.micro-set.dark i{color:#a6afb7}.lockups{display:grid;grid-template-columns:1fr 1fr;gap:10px;margin:16px 18px}.sidebar{height:70px;border:1px solid #e4e9ee;border-radius:9px;display:flex;justify-content:center;flex-direction:column;gap:5px;padding:8px 13px}.sidebar>span{font-size:9px;color:#71808c}.sidebar img{max-width:100%;object-fit:contain;object-position:left center}.navy{background:#0d2a47;border-color:#0d2a47}.navy>span{color:#a7bdcf}article footer{border-top:1px solid #eaf0f4;padding:13px 24px;display:flex;gap:14px;align-items:center;font-size:10px}article footer>span{margin-right:auto;color:#678093}article footer a{text-decoration:none;font-weight:800;color:#0075de;white-space:nowrap}.recommend{margin-top:26px;display:grid;grid-template-columns:160px 1fr 1fr;gap:20px;background:#fff;border:1px solid #dce3e9;border-radius:18px;padding:26px 28px;align-items:start}.recommend h2{font-size:18px;margin:0;line-height:1.6}.recommend h3{font-size:14px;margin:0 0 8px}.recommend p{font-size:12px;line-height:1.8;color:#5b7081;margin:0;word-break:keep-all}.recommend a{text-decoration:none}.note{font-size:11px;line-height:1.8;color:#6b7e8e;margin:20px 4px 0}.note b{color:#34536c}.bottom{display:flex;justify-content:space-between;margin:24px 4px 0;border-top:1px solid #d3dde4;padding-top:14px;font-size:10px;letter-spacing:.8px;color:#8393a0}
@media(max-width:900px){main{padding:20px}.hero{padding:28px;gap:24px}.hero h1{font-size:20px}.card-head{padding:18px 18px 0;align-items:flex-start;flex-direction:column}.concept{margin-left:18px;margin-right:18px;min-height:65px}.micro{grid-template-columns:1fr 1fr}.micro-label{display:none}article footer{padding:13px 18px;gap:8px}article footer>span{max-width:55%}.recommend{grid-template-columns:1fr 1fr}.recommend h2{grid-column:1/-1}}
@media(max-width:620px){main{padding:14px}.hero{grid-template-columns:1fr;padding:26px;gap:25px}.hero svg{width:260px}.hero p{font-size:13px}.intro{align-items:flex-start;flex-direction:column;margin-top:24px;gap:7px}.grid{grid-template-columns:1fr;gap:18px}.card-head{flex-direction:row;align-items:center}.card-head h2{font-size:19px}.type{font-size:10px}.concept{min-height:0}.stage{height:158px}.micro{grid-template-columns:1fr 1fr}.recommend{grid-template-columns:1fr;padding:24px}.recommend h2{grid-column:auto}.bottom{gap:12px;font-size:9px}.lockups{gap:8px}.sidebar{padding:8px 10px}}
</style></head><body><main>
<header class="hero"><div><div class="eyebrow">세타랩 · 로고 디자인 탐색 01</div><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${Math.ceil(hero.width)} 105" role="img" aria-label="Seta Lab">${hero.svg}</svg><div class="pills"><span>직접 만든 SVG</span><span>글자 path 변환</span><span>외부 요청 없음</span></div></div><div><h1>같은 이름, 서로 다른 8가지 표정</h1><p>함께 쓰는 작은 도구와 직접 해 본 기록.<br>세타랩의 쓸모를 리본, 기록, 꽃, 캐릭터,<br>새, 활자, 작업대, 새싹으로 풀었습니다.</p></div></header>
<div class="intro"><h2>어떤 모습이 세타랩에 어울리나요?</h2><p>큰 형태 → 작은 크기 → 사이드바 순서로 비교하세요.</p></div>
<section class="grid" aria-label="로고 후보 8개">${cards}</section>
<section class="recommend"><h2>먼저 볼 후보</h2><div><h3><a href="#candidate-01">01 접힌 리본 ↗</a></h3><p>S라는 단서와 접힌 면의 개성이 함께 보입니다. 작은 탭 아이콘과 차분한 도구 사이트에 두루 쓰기 쉬운 방향입니다.</p></div><div><h3><a href="#candidate-04">04 호기심 수달 ↗</a></h3><p>개인 사이트의 얼굴을 만들고 싶을 때 어울립니다. 친근한 표정 덕분에 도구와 글을 만든 사람을 기억하는 데 도움이 됩니다.</p></div></section>
<p class="note"><b>파일 안내</b> · 각 카드의 SVG와 가로형 링크로 원본을 열 수 있습니다. 가로형의 <code>-dark.svg</code> 파일은 남색·어두운 배경용 흰 글자 버전입니다.<br><b>제작 기준</b> · 심볼은 모두 96×96 정사각형 SVG입니다. 16px·32px는 실제 표시 크기입니다. 06은 S 아이콘과 이름을 크게 쓴 가로 워드마크를 함께 사용합니다. 글자는 SUIT 800을 path로 변환했습니다.<br><b>다음 단계</b> · 방향을 고른 뒤 획·간격과 16px 전용 미세 조정을 진행할 수 있습니다. 이번 파일은 실제 사이트에 적용하지 않은 비교 시안입니다.</p>
<footer class="bottom"><span>SETA LAB / CODEX V1</span><span>심볼 8개 · 가로 조합 16개 · 로컬 파일만 사용</span></footer>
</main></body></html>`;
fs.writeFileSync(path.join(dir,'index.html'),html);
fs.writeFileSync(path.join(dir,'candidates.json'),JSON.stringify(candidates.map(({body,...c})=>c),null,2));
console.log(`심볼 ${candidates.length}개, 가로 조합 ${candidates.length*2}개, 비교 HTML 생성 완료`);
