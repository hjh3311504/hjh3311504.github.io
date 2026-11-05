import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import * as fontkit from 'fontkit';
const dir=path.dirname(fileURLToPath(import.meta.url));
const font=fontkit.openSync(path.join(dir,'SUIT-800.ttf'));
const blue='#0075de', navy='#0d2a47';
const p=(d,attributes='')=>`<path d="${d}" ${attributes}/>`;
const fill=(d)=>p(d,'fill-rule="evenodd"');
function type(text,x,y,size,color=navy,spacing=-.6){
 const r=font.layout(text);let n=0;const scale=size/font.unitsPerEm;
 const paths=r.glyphs.map((g,i)=>{const a=r.positions[i];const s=p(g.path.toSVG(),`transform="translate(${x+(n+a.xOffset)*scale} ${y-a.yOffset*scale}) scale(${scale} ${-scale})"`);n+=a.xAdvance+spacing/scale;return s});
 return {body:`<g fill="${color}">${paths.join('')}</g>`,width:n*scale};
}
const thetaSerif=fill('M51 6C28 6 14 26 14 52C14 77 28 90 46 90C69 90 82 70 82 44C82 19 69 6 51 6ZM49 13C62 13 67 27 67 43H32C33 25 39 13 49 13ZM32 52H67C65 71 59 83 48 83C35 83 30 70 32 52Z')+p('M9 41C17 43 25 44 34 44H64C75 44 82 42 88 40L86 53C79 51 73 51 64 51H34C23 51 16 53 8 55Z');
const thetaScript=p('M72 47C59 53 33 53 18 49C18 27 32 10 51 10C69 10 81 24 81 45C81 67 66 86 47 86C28 86 17 73 17 54','fill="none" stroke="currentColor" stroke-width="12" stroke-linecap="round" stroke-linejoin="round"');
const thetaBlock=fill('M30 7H68L87 26V67L67 89H29L9 69V29ZM35 24C30 24 27 28 27 34V41H69V33C69 27 65 24 60 24ZM27 55V64C27 71 32 74 38 74H59C65 74 69 70 69 64V55Z');
const monogram=fill('M73 13C64 7 56 5 45 7C25 9 12 20 12 35C12 49 22 55 40 59L52 62C63 64 68 68 65 74C61 83 42 82 29 69L14 80C30 99 61 96 76 82C86 72 85 58 75 51C70 47 64 45 51 42L39 39C29 37 26 34 29 29C32 22 46 20 58 27L49 37H70L84 20Z')+p('M58 12C78 12 88 28 88 47C88 67 77 80 61 80','fill="none" stroke="currentColor" stroke-width="8" stroke-linecap="round"')+p('M51 44H90','fill="none" stroke="currentColor" stroke-width="7"');
const thetaE=fill('M46 10C22 10 10 26 10 48C10 72 24 86 49 86C73 86 87 70 87 46C87 23 72 10 46 10ZM47 25C35 25 29 31 28 40H69C67 30 60 25 47 25ZM28 54C30 65 37 71 49 71C61 71 67 65 69 54Z');
const sCut=fill('M82 23C72 11 60 6 45 6C24 6 10 18 10 36C10 52 22 58 40 63L54 67C63 70 67 73 63 78C57 85 40 81 30 69L12 79C26 97 55 98 73 86C89 75 91 57 77 48C71 43 61 40 51 37L38 34C30 32 29 27 34 24C41 19 55 22 64 32Z');
// 세·타의 자모를 직접 그린다. 획 폭은 7~8단위로 맞춘다.
const korean=`<g transform="translate(0 -14) scale(1 1.36)" fill="none" stroke="currentColor" stroke-width="6.5" stroke-linecap="square" stroke-linejoin="miter">${p('M7 51L17 23L27 51M32 22V75M45 22V75M25 43H32M55 25H72M55 25V72H73M55 48H71M82 22V75M82 46H91')}</g>`;
const initials=p('M7 80L29 12H40L59 65L47 70L35 35L21 80Z')+p('M50 18H87V30H63V44H82V56H63V70H88V83H50Z');
const candidates=[
 {slug:'serif-theta',name:'활자 θ',kind:'θ · 굵기 대비',connection:'그리스 문자 θ를 두꺼운 세로획과 가는 연결획으로 다시 그렸습니다.',detail:'교차점의 벌어짐과 양끝의 작은 돌출부를 맞춘 활자형입니다.',body:thetaSerif},
 {slug:'single-stroke-theta',name:'한 획 θ',kind:'θ · 이어 쓰기',connection:'가로획에서 시작해 바깥 고리를 한 번에 돌아 이어지는 θ입니다.',detail:'둥근 시작점과 부푼 아래 곡선이 손으로 쓴 듯한 흐름을 만듭니다.',body:thetaScript},
 {slug:'carved-theta',name:'절삭 θ',kind:'θ · 파낸 공간',connection:'θ의 위아래 공간을 각진 덩어리 안에 파냈습니다.',detail:'바깥 모서리와 안쪽 곡선의 차이가 작은 크기에서도 남습니다.',body:thetaBlock},
 {slug:'woven-s-theta',name:'교차 Sθ',kind:'S + θ · 합자',connection:'Seta의 S 안쪽을 θ의 가로획과 오른쪽 곡선으로 이어 붙였습니다.',detail:'S의 흐름을 앞에 두고 θ가 같은 획을 나누어 쓰도록 했습니다.',body:monogram},
 {slug:'seta-theta-wordmark',name:'Sθta',kind:'Seta · 워드마크',connection:'Seta의 e를 θ와 닮은 글자로 바꿔 이름 속에 세타를 넣었습니다.',detail:'탭에는 바꾼 e·θ를, 사이드바에는 전체 이름을 사용합니다.',body:thetaE,wordmark:true},
 {slug:'cut-seta-s',name:'세타 S',kind:'S · 전용 레터링',connection:'Seta의 첫 글자 S를 넓은 획과 비스듬한 끝으로 직접 그렸습니다.',detail:'리본 장식 없이 글자 자체의 두 공간과 무게를 맞췄습니다.',body:sCut},
 {slug:'hangul-seta',name:'세타 자모',kind:'세타 · 한글 레터링',connection:'한글 세타의 ㅅ·ㅔ·ㅌ·ㅏ를 짧고 굵은 획으로 직접 그렸습니다.',detail:'작은 크기에서 자모가 붙지 않도록 획 사이를 벌렸습니다.',body:korean,korean:true},
 {slug:'hangul-initials',name:'ㅅㅌ 합자',kind:'ㅅ + ㅌ · 한글 합자',connection:'세타의 첫 자음 ㅅ과 ㅌ을 하나의 굵은 마크로 이어 붙였습니다.',detail:'ㅅ의 사선과 ㅌ의 세 가로획을 각각 읽을 수 있게 남겼습니다.',body:initials},
];
function wrap(c,body,vb,label){return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${vb}" role="img" aria-label="${label}"><title>${label}</title><g fill="${blue}" color="${blue}">${body}</g></svg>`}
function wordmark(color){
 const s=type('S',8,74,79,color,-1);const t=type('ta',130,74,79,color,-2);
 const e=`<g fill="${blue}" transform="translate(53 10) scale(.75)">${thetaE}</g>`;
 const lab=type('Lab',231,74,45,color,-.7);
 return {body:s.body+e+t.body+lab.body,width:310};
}
for(let i=0;i<candidates.length;i++){
 const c=candidates[i];c.id=String(i+1).padStart(2,'0');c.file=`${c.id}-${c.slug}`;
 c.svg=wrap(c,c.body,'0 0 96 96',c.name);
 fs.writeFileSync(path.join(dir,c.file+'.svg'),c.svg);
 for(const [suffix,color] of [['',navy],['-dark','#fff']]){
  let body,width;
  if(c.wordmark){const w=wordmark(color);body=w.body;width=w.width}
  else if(c.korean){body=c.body+type('Lab',111,65,47,color).body;width=193}
  else {const t=type('Seta Lab',106,65,47,color);body=c.body+t.body;width=Math.ceil(119+t.width)}
  c.lockWidth=width;
  const out=wrap(c,body,`0 0 ${width} 96`,'Seta Lab · '+c.name);
  c[suffix?'darkLockup':'lockup']=out;
  fs.writeFileSync(path.join(dir,c.file+'-lockup'+suffix+'.svg'),out);
 }
}
const data=s=>'data:image/svg+xml;base64,'+Buffer.from(s).toString('base64');
const img=(svg,size,alt,cls='')=>`<img class="${cls}" src="${data(svg)}" width="${size}" height="${size}" alt="${alt}">`;
const cards=candidates.map(c=>`<article id="candidate-${c.id}"><header class="card-head"><div><span class="num">${c.id}</span><h2>${c.name}</h2></div><span class="kind">${c.kind}</span></header><p class="connection">${c.connection}</p><div class="stages"><div class="stage light">${img(c.svg,112,c.name)}<span>밝은 배경 · #f6f5f4</span></div><div class="stage dark">${img(c.svg,112,c.name)}<span>어두운 배경 · #191919</span></div></div><div class="micro"><div class="micro-label">실제 크기<span>16px / 32px</span></div><div class="micro-set light">${img(c.svg,16,c.name)}<i>16</i>${img(c.svg,32,c.name)}<i>32</i></div><div class="micro-set dark">${img(c.svg,16,c.name)}<i>16</i>${img(c.svg,32,c.name)}<i>32</i></div></div><div class="lockups"><div class="sidebar"><span>사이드바 · 밝은 화면</span><img src="${data(c.lockup)}" width="${c.lockWidth/3}" height="32" alt="${c.name} 가로형"></div><div class="sidebar navy"><span>사이드바 · 남색 화면</span><img src="${data(c.darkLockup)}" width="${c.lockWidth/3}" height="32" alt="${c.name} 어두운 화면 가로형"></div></div><p class="detail">${c.detail}</p><footer><a href="${data(c.svg)}" download="${c.file}.svg">심볼 SVG ↓</a><a href="${data(c.lockup)}" download="${c.file}-lockup.svg">가로형 SVG ↓</a></footer></article>`).join('');
const embeddedFont=fs.readFileSync(path.resolve('src/lib/team-maker/fonts/SUIT-Variable.woff2')).toString('base64');
const hero=type('Seta Lab',0,85,98,'white',-1.3);
const html=`<!doctype html><html lang="ko"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Seta Lab · 세타에서 만든 로고8개</title><style>
/* SUIT: SIL Open Font License 1.1. 원문은 함께 제공한 SUIT-LICENSE.txt 참조. */
@font-face{font-family:SUIT;src:url(data:font/woff2;base64,${embeddedFont}) format('woff2');font-weight:100 900;font-display:swap}
*{box-sizing:border-box}html{scroll-behavior:smooth}body{margin:0;background:#eaeef1;color:#0d2a47;font-family:SUIT,system-ui,sans-serif;-webkit-font-smoothing:antialiased}main{max-width:1360px;margin:auto;padding:36px 40px 24px}.hero{border-radius:24px;background:#0d2a47;color:#fff;padding:36px 40px;display:grid;grid-template-columns:1.06fr 1fr;gap:40px;align-items:center}.eyebrow{color:#96c8eb;font-size:12px;letter-spacing:1.5px;font-weight:800;margin:0 0 20px}.hero-logo{display:block;width:320px;max-width:100%;height:auto}.hero h1{font-size:24px;letter-spacing:-.6px;margin:0 0 12px}.hero p{font-size:14px;line-height:1.8;color:#bfd2e2;margin:0}.chips{display:flex;gap:8px;margin-top:21px;flex-wrap:wrap}.chips span{font-size:11px;border:1px solid #46627c;border-radius:30px;padding:6px 11px;color:#dbe9f4}.intro{display:flex;justify-content:space-between;gap:15px;align-items:center;margin:27px 0 18px}.intro h2{font-size:19px;letter-spacing:-.4px;margin:0}.intro p{font-size:11px;color:#627a8e;margin:0}.grid{display:grid;grid-template-columns:1fr 1fr;gap:22px}article{background:white;border:1px solid #dce4ea;border-radius:18px;overflow:hidden;min-width:0;scroll-margin-top:16px}.card-head{padding:21px 24px 0;display:flex;gap:10px;align-items:center;justify-content:space-between}.card-head>div{display:flex;align-items:center;gap:10px}.num{font-size:12px;display:grid;place-items:center;width:28px;height:28px;border-radius:8px;background:#e9f4ff;color:#0075de;font-weight:850}.card-head h2{font-size:22px;letter-spacing:-.6px;margin:0;white-space:nowrap}.kind{font-size:11px;color:#7b8d9c;white-space:nowrap}.connection{font-size:13px;line-height:1.7;min-height:44px;margin:11px 24px 15px;word-break:keep-all}.stages{display:grid;grid-template-columns:1fr 1fr;gap:1px;margin:0 18px;border-radius:12px;overflow:hidden}.stage{height:178px;display:flex;justify-content:center;align-items:center;flex-direction:column;gap:12px}.light{background:#f6f5f4}.dark{background:#191919}.stage span{font-size:10px;color:#7b858f}.stage.dark span{color:#a2aab2}.micro{margin:15px 18px 0;display:grid;grid-template-columns:100px 1fr 1fr;gap:8px}.micro-label{font-size:11px;font-weight:800;display:flex;flex-direction:column;justify-content:center;gap:5px;padding-left:5px}.micro-label span{font-size:10px;color:#8293a0;font-weight:450}.micro-set{display:flex;justify-content:center;align-items:center;gap:9px;height:55px;border-radius:8px}.micro-set i{font-size:9px;font-style:normal;color:#758391}.micro-set.dark i{color:#a4afb8}.lockups{display:grid;grid-template-columns:1fr 1fr;gap:10px;margin:15px 18px 0}.sidebar{height:72px;border:1px solid #e3eaf0;border-radius:9px;display:flex;flex-direction:column;justify-content:center;gap:6px;padding:8px 12px}.sidebar>span{font-size:9px;color:#8595a2}.sidebar img{object-fit:contain;object-position:left;max-width:100%}.navy{background:#0d2a47;border-color:#0d2a47}.navy>span{color:#a1b9cd}.detail{font-size:11px;line-height:1.6;color:#647d90;margin:13px 24px;min-height:18px;word-break:keep-all}article footer{border-top:1px solid #eaf0f4;padding:12px 24px;display:flex;justify-content:flex-end;gap:18px}article a{color:#0075de;font-size:10px;font-weight:800;text-decoration:none}.recommend{margin-top:25px;border:1px solid #dce4ea;border-radius:17px;background:#fff;padding:25px 28px;display:grid;grid-template-columns:145px 1fr 1fr;gap:25px}.recommend h2{font-size:18px;margin:0;line-height:1.7}.recommend h3{font-size:14px;margin:0 0 7px}.recommend a{color:inherit;text-decoration:none}.recommend p{font-size:12px;line-height:1.8;color:#5f778a;margin:0;word-break:keep-all}.notes{font-size:11px;line-height:1.9;color:#6f8393;margin:19px 4px 0}.notes b{color:#37566e}.bottom{display:flex;justify-content:space-between;gap:12px;margin:24px 4px 0;border-top:1px solid #d3dee6;padding-top:14px;color:#8c9aa6;font-size:10px;letter-spacing:.6px}
@media(max-width:950px){main{padding:20px}.hero{padding:28px;gap:25px}.card-head{padding:18px 18px 0;align-items:flex-start;flex-direction:column}.connection{margin-left:18px;margin-right:18px;min-height:66px}.micro{grid-template-columns:1fr 1fr}.micro-label{display:none}.detail{margin-left:18px;margin-right:18px;min-height:36px}.recommend{grid-template-columns:1fr 1fr}.recommend h2{grid-column:1/-1}}
@media(max-width:620px){main{padding:14px}.hero{grid-template-columns:1fr;padding:26px;gap:25px}.hero-logo{width:260px}.hero h1{font-size:21px}.hero p{font-size:13px}.intro{align-items:flex-start;flex-direction:column;gap:7px;margin-top:24px}.grid{grid-template-columns:1fr;gap:18px}.card-head{flex-direction:row;align-items:center}.card-head h2{font-size:20px}.kind{font-size:10px}.connection{min-height:44px}.stage{height:170px}.sidebar{padding:8px 9px}.lockups{gap:8px}.detail{min-height:36px}.recommend{grid-template-columns:1fr;padding:24px}.recommend h2{grid-column:auto}.bottom{font-size:9px}}
</style></head><body><main><header class="hero"><div><p class="eyebrow">세타랩 · 로고 디자인 탐색 02</p><svg class="hero-logo" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${Math.ceil(hero.width)} 103" role="img" aria-label="Seta Lab">${hero.body}</svg><div class="chips"><span>θ</span><span>S · Seta</span><span>세타 · 자모</span><span>단일 파일로 열기</span></div></div><div><h1>이번 출발점은, 세타 그 자체</h1><p>그리스 문자 θ, 영문 Seta, 한글 세타.<br>이름에서 나온 획만으로 8가지 방향을 만들었습니다.<br>모양뿐 아니라 작은 크기의 차이도 비교하세요.</p></div></header><div class="intro"><h2>이름이 어떻게 보이는지 살펴보세요</h2><p>큰 형태 → 실제 16px·32px → 사이드바 가로 조합</p></div><section class="grid" aria-label="세타 로고 후보8개">${cards}</section><section class="recommend"><h2>먼저 볼 후보</h2><div><h3><a href="#candidate-01">01 활자 θ ↗</a></h3><p>θ가 가장 직접 보이면서도 획 굵기의 차이가 개성을 만듭니다. 도구와 글을 함께 담는 차분한 세타랩에 어울립니다.</p></div><div><h3><a href="#candidate-03">03 절삭 θ ↗</a></h3><p>안쪽 공간이 넓고 획이 굵어 작은 탭에서 형태가 선명합니다. 더 단단하고 명확한 인상을 원할 때 어울립니다.</p></div></section><p class="notes"><b>비교 기준</b> · 같은 SVG를 밝은 배경과 어두운 배경에 그대로 표시했습니다. 16px·32px는 확대하지 않은 실제 크기입니다.<br><b>파일 안내</b> · 모든 심볼과 글자는 SVG path입니다. 다운로드 링크도 내장돼 있어 이 HTML 하나만 옮겨도 그림과 글꼴이 표시됩니다. 가로형의 <code>-dark.svg</code>는 남색·어두운 화면용입니다.<br><b>글자 안내</b> · 05는 Seta의 e를 θ처럼 바꾼 의도적인 레터링입니다. 07은 한글 세타와 영문 Lab을 함께 씁니다. 가로형의 기본 글자는 SUIT 800의 윤곽을 사용했습니다.<br><b>후속 작업</b> · 선택한 방향은 16px 전용 획 조정과 실제 사이트 적용을 이어갈 수 있습니다. 현재는 비교 시안이며 사이트 파일은 수정하지 않았습니다.</p><footer class="bottom"><span>SETA LAB / CODEX V2</span><span>8가지 방향 · 이름에서 출발한 로고</span></footer></main></body></html>`;
const license=fs.readFileSync(path.join(dir,'SUIT-LICENSE.txt'),'utf8').replaceAll('--','—');
fs.writeFileSync(path.join(dir,'index.html'),html.replace('<html lang="ko">','<!-- Embedded SUIT font license\n'+license+'\n--><html lang="ko">'));
fs.writeFileSync(path.join(dir,'candidates.json'),JSON.stringify(candidates.map(({body,svg,lockup,darkLockup,...c})=>c),null,2));
console.log('세타 후보8개·가로형16개·독립형 비교HTML 생성 완료');
