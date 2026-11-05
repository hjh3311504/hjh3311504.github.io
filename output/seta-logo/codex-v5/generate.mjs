import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
const dir=path.dirname(fileURLToPath(import.meta.url));
const BLUE='#0075de',ICE='#7fc0ff',NAVY='#0d2a47',W='#ffffff',O='#ffb35a';
const source=fs.readFileSync(path.join(dir,'../codex-v4/01-original-v3-10.svg'),'utf8');
const brandPaths=[...source.matchAll(/<path\b[^>]*\/>/g)].map(m=>m[0]).join('');
const P=(d,extra='')=>`<path d="${d}" ${extra}/>`;
const line=(d,opacity=.5,width=1.5,color=ICE,extra='')=>P(d,`fill="none" stroke="${color}" stroke-width="${width}" stroke-linecap="round" stroke-linejoin="round" opacity="${opacity}" ${extra}`);
const circle=(x,y,r,fill=ICE,opacity=1,extra='')=>`<circle cx="${x}" cy="${y}" r="${r}" fill="${fill}" opacity="${opacity}" ${extra}/>`;
const rect=(x,y,w,h,rx=8,fill=BLUE,extra='')=>`<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${rx}" fill="${fill}" ${extra}/>`;
const g=(x,y,inner,extra='')=>`<g transform="translate(${x} ${y})" ${extra}>${inner}</g>`;
const mark=(x,y,size,color=W)=>`<g data-mark="confirmed-v4-01" transform="translate(${x} ${y}) scale(${size/96})" fill="${color}">${brandPaths}</g>`;
function defs(id){return `<defs><radialGradient id="${id}-halo"><stop stop-color="${BLUE}" stop-opacity=".42"/><stop offset=".65" stop-color="${BLUE}" stop-opacity=".14"/><stop offset="1" stop-color="${BLUE}" stop-opacity="0"/></radialGradient><linearGradient id="${id}-panel" x2=".8" y2="1"><stop stop-color="${BLUE}"/><stop offset="1" stop-color="${BLUE}" stop-opacity=".48"/></linearGradient><radialGradient id="${id}-orb" cx=".3" cy=".25"><stop stop-color="white"/><stop offset=".38" stop-color="${ICE}"/><stop offset="1" stop-color="${BLUE}"/></radialGradient><filter id="${id}-shadow" x="-50%" y="-50%" width="200%" height="220%"><feDropShadow dx="0" dy="10" stdDeviation="9" flood-color="${NAVY}" flood-opacity=".65"/></filter><pattern id="${id}-grid" width="20" height="20" patternUnits="userSpaceOnUse"><path d="M20 0H0V20" fill="none" stroke="${ICE}" stroke-opacity=".11" stroke-width=".8"/></pattern></defs>`}
const halo=(id,x=200,y=160,rx=165,ry=140)=>`<ellipse cx="${x}" cy="${y}" rx="${rx}" ry="${ry}" fill="url(#${id}-halo)"/>`;
function icon(kind,size=28,color=ICE){
 let body='';
 if(kind==='team')body=circle(10,9,4,color)+circle(23,8,4,color)+circle(16.5,22,4.5,color)+line('M3 19c0-5 14-5 14 0M18 17c1-4 12-4 12 1M8 32c0-7 17-7 17 0',1,2.4,color);
 if(kind==='bracket')body=line('M3 4h9v9H3M3 22h9v9H3M12 8h9v19h-9M21 17h9',1,2.3,color);
 if(kind==='qr')body=rect(2,2,11,11,1,'none',`stroke="${color}" stroke-width="2.2"`)+rect(21,2,11,11,1,'none',`stroke="${color}" stroke-width="2.2"`)+rect(2,21,11,11,1,'none',`stroke="${color}" stroke-width="2.2"`)+rect(6,6,3,3,0,color)+rect(25,6,3,3,0,color)+rect(6,25,3,3,0,color)+P('M21 21h5v5h6v6H21Z',`fill="${color}"`)+rect(29,17,3,3,0,color);
 if(kind==='doc')body=P('M7 2h15l7 7v22H7Z',`fill="none" stroke="${color}" stroke-width="2.2" stroke-linejoin="round"`)+line('M21 3v8h7M12 17h12M12 22h12M12 27h7',1,2,color);
 if(kind==='marble')body=`<circle cx="17" cy="17" r="13" fill="none" stroke="${color}" stroke-width="2.3"/>`+line('M9 21c6-9 15-10 18-7M8 12c3-4 6-5 9-5',1,2,color);
 return `<g transform="scale(${size/34})">${body}</g>`;
}
function badge(id,x,y,kind,size=48,angle=0){return `<g transform="translate(${x} ${y}) rotate(${angle} ${size/2} ${size/2})" filter="url(#${id}-shadow)">${rect(0,0,size,size,12,NAVY,`stroke="${ICE}" stroke-opacity=".35"`)}${rect(1,1,size-2,size-2,11,BLUE,'opacity=".13"')}${g((size-29)/2,(size-29)/2,icon(kind,29))}</g>`}
function card(x,y,w,h,angle,inner){return `<g transform="translate(${x} ${y}) rotate(${angle} ${w/2} ${h/2})">${rect(0,0,w,h,12,NAVY,`stroke="${ICE}" stroke-opacity=".34"`)}${rect(1,1,w-2,h-2,11,BLUE,'opacity=".12"')}${inner}</g>`}
const illustrations=[];

// 01: 커다란 θ를 중심으로 다섯 도구가 궤도를 이룬다.
{
 const id='h01';
 const orbit=`<g fill="none" stroke="${ICE}" stroke-width="1.1"><ellipse cx="200" cy="160" rx="166" ry="105" transform="rotate(-17 200 160)" opacity=".35"/><ellipse cx="200" cy="160" rx="105" ry="136" transform="rotate(31 200 160)" opacity=".22" stroke-dasharray="3 8"/></g>`;
 const inner=defs(id)+halo(id)+orbit+circle(200,160,76,`url(#${id}-panel)`)+`<circle cx="200" cy="160" r="76" fill="none" stroke="${ICE}" stroke-opacity=".5"/>`+`<circle cx="200" cy="160" r="87" fill="none" stroke="${ICE}" stroke-opacity=".12"/>`+badge(id,47,53,'team',49,-8)+badge(id,300,43,'qr',47,9)+badge(id,318,202,'bracket',49,-5)+badge(id,59,232,'doc',45,7)+badge(id,183,263,'marble',42,-7)+circle(332,138,5,O)+circle(112,52,3,W,.7)+circle(107,211,3,ICE,.7)+mark(131,91,138);
 illustrations.push({id:'01',name:'도구의 궤도',added:'θ 주변의 두 궤도에 팀·대진표·구슬·QR·문서 아이콘을 놓았습니다.',focus:'무엇을 제공하는 사이트인지 가장 직접 보여 줍니다.',mobile:'원형 중심을 유지해 작은 화면에서도 균형이 잡힙니다.',inner});
}

// 02: 모눈과 눈금은 장식보다 낮은 대비로 둔다.
{
 const id='h02';let ticks='';for(let x=48;x<=352;x+=12)ticks+=line(`M${x} 269v${(x-48)%48===0?12:6}`,.4,1);
 let arcTicks='';for(let a=-162;a<=-18;a+=12){const r=132,t=a*Math.PI/180,x=200+Math.cos(t)*r,y=170+Math.sin(t)*r,x2=200+Math.cos(t)*(r-7),y2=170+Math.sin(t)*(r-7);arcTicks+=line(`M${x} ${y}L${x2} ${y2}`,.5,1)}
 const inner=defs(id)+halo(id)+rect(48,39,304,232,3,`url(#${id}-grid)`)+line('M39 269H361M200 31V289',.2,1,ICE,'stroke-dasharray="3 6"')+line('M68 170a132 132 0 0 1 264 0',.44,1.2)+arcTicks+ticks+P('M128 67H264L285 88V240H145L125 220V92Q125 67 128 67Z',`fill="${BLUE}" fill-opacity=".16" stroke="${ICE}" stroke-opacity=".22"`)+line('M93 243H307M93 237v12M307 237v12',.55,1)+line('M106 70v163M100 70h12M100 233h12',.3,1)+circle(307,243,4,O)+circle(200,38,3,W,.65)+mark(123,80,154);
 illustrations.push({id:'02',name:'세타 측정실',added:'모눈·측정 눈금·각도기 호를 더해 θ와 실험실의 연결을 살렸습니다.',focus:'이름의 뜻과 직접 실험하는 태도를 차분하게 보여 줍니다.',mobile:'선 장식을 가늘게 낮춰 작은 화면에서 θ가 묻히지 않습니다.',inner});
}

// 03: 실제 화면을 복제하지 않고 도구 UI의 구조만 그린다.
{
 const id='h03';
 const top=card(117,37,170,94,5,circle(14,13,2,ICE,.7)+circle(23,13,2,ICE,.4)+circle(32,13,2,ICE,.3)+line('M13 25H157',.2,1)+rect(15,37,80,5,2,ICE,'opacity=".38"')+rect(15,50,126,4,2,ICE,'opacity=".2"')+rect(15,62,108,4,2,ICE,'opacity=".2"'));
 const left=card(32,95,176,142,-12,g(14,13,icon('team',25))+rect(52,17,80,5,2,ICE,'opacity=".4"')+rect(14,56,67,64,6,BLUE,'opacity=".22"')+rect(93,56,67,64,6,BLUE,'opacity=".22"')+circle(29,74,4,ICE,.55)+line('M40 73h28M40 84h20M107 73h35M107 84h22',.45,2));
 const right=card(209,116,157,145,11,g(18,49,icon('qr',55))+line('M15 19h85M15 30h58',.4,3)+rect(91,49,48,8,3,BLUE,'opacity=".5"')+line('M92 72h45M92 86h35M92 101h43',.35,2));
 const center=`<g filter="url(#${id}-shadow)">${rect(128,88,144,144,23,`url(#${id}-panel)`,`stroke="${ICE}" stroke-opacity=".7"`)}${rect(135,95,130,130,18,'none',`stroke="white" stroke-opacity=".1"`)}</g>`;
 const inner=defs(id)+halo(id)+top+left+right+circle(321,77,5,O)+line('M81 51l7 7M88 51l-7 7',.8,1.8)+center+mark(140,100,120)+line('M154 264h92',.3,2)+circle(200,264,3,ICE,.7);
 illustrations.push({id:'03',name:'겹친 도구 카드',added:'팀 나누기·QR·기록을 닮은 카드 3장을 θ 타일 뒤에 겹쳤습니다.',focus:'사이트의 실제 사용 장면을 떠올리기 쉽습니다.',mobile:'중앙 파란 타일을 가장 진하게 두어 카드가 많아도 초점이 남습니다.',inner});
}

// 04: 점선은 중앙을 가로지르지 않고 마크의 바깥에서 끝낸다.
{
 const id='h04';let dots='';for(let x=42;x<=362;x+=32)for(let y=38;y<=294;y+=32)dots+=circle(x,y,.9,ICE,.19);
 const connections=line('M143 126H91V83H71M257 116H292V72H322M266 180H313V230H341M149 203H96V261H78M215 228V276H219',.5,1.5,ICE,'stroke-dasharray="3 6"');
 const inner=defs(id)+halo(id)+dots+connections+`<circle cx="200" cy="157" r="85" fill="none" stroke="${BLUE}" stroke-width="17" stroke-opacity=".12"/>`+`<circle cx="200" cy="157" r="87" fill="none" stroke="${ICE}" stroke-opacity=".19" stroke-dasharray="2 7"/>`+badge(id,47,57,'team',48)+badge(id,298,48,'qr',48)+badge(id,317,211,'bracket',48)+badge(id,54,240,'doc',44)+badge(id,198,257,'marble',42)+circle(291,116,4,O)+circle(96,203,3,ICE)+circle(313,180,3,W,.6)+mark(126,83,148);
 illustrations.push({id:'04',name:'도구 연결 지도',added:'θ에서 뻗은 점선을 다섯 도구의 작은 정류장으로 연결했습니다.',focus:'세타랩을 도구와 기록이 모이는 중심으로 보여 줍니다.',mobile:'직선 연결과 작은 노드로 형태를 구분해 축소해도 질서가 남습니다.',inner});
}

// 05: 도구 조각과 구슬은 모두 직접 그린다. 구슬의 흰 반사광은 작게 제한한다.
{
 const id='h05';
 const track=line('M45 225C38 263 120 292 198 273S359 230 342 188',.3,2)+line('M53 228C47 258 123 282 198 264S348 225 333 190',.15,1);
 const qrBits=g(51,183,icon('qr',34,ICE),'opacity=".58"')+g(291,41,icon('qr',27,ICE),'opacity=".4"');
 const inner=defs(id)+halo(id,200,159,166,130)+track+`<ellipse cx="201" cy="254" rx="75" ry="15" fill="${BLUE}" opacity=".16"/>`+circle(75,98,18,`url(#${id}-orb)`)+circle(323,101,13,`url(#${id}-orb)`)+circle(321,244,23,`url(#${id}-orb)`)+circle(106,269,9,`url(#${id}-orb)`)+qrBits+g(306,163,icon('bracket',30),'opacity=".55"')+line('M85 48h15v14h14M88 61h11',.6,2)+rect(113,62,6,15,2,O,'transform="rotate(21 116 69)"')+rect(341,151,5,13,1,ICE,'transform="rotate(-24 343 157)" opacity=".6"')+circle(57,147,3,ICE,.7)+circle(270,268,3,O)+line('M255 42l6-6M255 36l6 6',.45,1.5)+mark(120,72,160);
 illustrations.push({id:'05',name:'작은 도구의 놀이터',added:'구슬·QR 조각·대진표 선을 θ 주변에 가볍게 흩어 놓았습니다.',focus:'모임용 도구와 구슬 레이스의 경쾌한 성격이 드러납니다.',mobile:'큰 구슬도 θ의 3분의 1보다 작게 두어 로고의 중심을 지킵니다.',inner});
}

// 06: 평면 θ는 그대로 세워 두고, 주변 받침과 도구만 원근을 준다.
{
 const id='h06';
 const floor=P('M44 238L199 178L357 238L200 298Z',`fill="${BLUE}" fill-opacity=".1" stroke="${ICE}" stroke-opacity=".3"`)+line('M78 251l155-60M113 264l155-60M148 278l155-60M80 224l156 60M117 210l156 60M155 195l156 60',.11,1);
 const platform=P('M127 221L200 194L274 221L200 250Z',`fill="${BLUE}" fill-opacity=".6"`)+P('M127 221L200 250V261L127 232ZM200 250L274 221V232L200 261Z',`fill="${BLUE}" fill-opacity=".23" stroke="${ICE}" stroke-opacity=".2"`)+line('M140 220l60-22 61 22',.45,1.1);
 const side1=card(39,127,70,77,-7,g(20,19,icon('team',32))+line('M16 61h39',.4,2));
 const side2=card(289,135,69,74,8,g(20,18,icon('qr',30))+line('M18 59h34',.3,2));
 const document=P('M80 247L109 236L136 248L108 259Z',`fill="${BLUE}" fill-opacity=".55" stroke="${ICE}" stroke-opacity=".45"`)+line('M94 247l14-5 15 6M99 252l10-4',.5,1.3);
 const inner=defs(id)+halo(id,200,139,157,139)+floor+platform+side1+side2+document+circle(294,255,13,`url(#${id}-orb)`)+line('M75 116V90h46M325 124V93h-44',.35,1,ICE,'stroke-dasharray="3 6"')+circle(121,90,3,O)+circle(281,93,3,ICE,.6)+mark(124,61,152);
 illustrations.push({id:'06',name:'입체 실험대',added:'θ는 그대로 세우고, 주변에 도구 패널과 모눈 받침을 입체적으로 놓았습니다.',focus:'Lab이라는 이름을 작은 디지털 작업실처럼 풀었습니다.',mobile:'입체 장식은 아래로 모아, 위의 θ와 역할을 나눴습니다.',inner});
}

const hero=(c)=>`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 320" role="img" aria-label="${c.name}"><title>${c.name}</title>${c.inner}</svg>`;
for(const c of illustrations)fs.writeFileSync(path.join(dir,`hero-${c.id}.svg`),hero(c));
const graphics=illustrations.map(c=>`<symbol id="art-${c.id}" viewBox="0 0 400 320">${c.inner}</symbol>`).join('');
const graphic=(c,cls='graphic')=>`<svg class="${cls}" viewBox="0 0 400 320" role="img" aria-label="${c.name}"><use href="#art-${c.id}"/></svg>`;
const copy=`<div class="copy"><div class="subtitle">필요한 도구와 가이드를 한곳에</div><h2>Seta Lab</h2><p>설치나 가입 없이 브라우저에서 바로 쓰는 무료 도구와,<br>직접 해 보고 정리한 가이드를 만듭니다.</p></div>`;
const cards=illustrations.map(c=>`<article id="candidate-${c.id}"><header class="card-head"><div><b>${c.id}</b><h2>${c.name}</h2><span>${c.added}</span></div><a data-download="${c.id}" href="hero-${c.id}.svg">소개 그림 SVG ↓</a></header><div class="view-label"><strong>데스크톱 · 1100px</strong><span>그림 350×280px · 확정 θ 모양 유지</span></div><div class="desktop-scene">${copy}${graphic(c)}</div><div class="secondary"><section class="mobile-panel"><div class="view-label"><strong>모바일 · 390px</strong><span>그림은 본문 아래로</span></div><div class="mobile-scene">${copy}${graphic(c)}</div></section><section class="og-panel"><div class="view-label"><strong>공유 이미지 · 1200×630</strong><span>아래 모형은 축소 표시</span></div><div class="og-viewport"><div class="og-scene" id="og-${c.id}">${copy}${graphic(c)}<div class="og-line"></div><div class="og-site">hjh3311504.github.io</div></div></div><div class="rationale"><p><b>표현</b>${c.focus}</p><p><b>축소</b>${c.mobile}</p><p><b>움직임</b>모든 시안은 정지한 상태로 완성된 SVG입니다.</p></div></section></div></article>`).join('');
const serialized=JSON.stringify(Object.fromEntries(illustrations.map(c=>[c.id,hero(c)]))).replaceAll('</','<\\/');
const html=`<!doctype html><html lang="ko"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Seta Lab · 홈 소개 그림 시안6개</title><style>
@font-face{font-family:SUIT;src:url('https://cdn.jsdelivr.net/gh/sun-typeface/SUIT@2/fonts/variable/woff2/SUIT-Variable.woff2') format('woff2');font-weight:100 900;font-display:swap}
*{box-sizing:border-box}html{scroll-behavior:smooth}body{margin:0;background:#eaeef1;color:#0d2a47;font-family:SUIT,system-ui,sans-serif;-webkit-font-smoothing:antialiased}main{width:1160px;max-width:calc(100% - 32px);margin:28px auto 24px}.defs{position:absolute;width:0;height:0;overflow:hidden}svg{display:block}.page-head{border-radius:20px;background:#0d2a47;color:white;padding:30px 34px;display:flex;justify-content:space-between;align-items:center;gap:35px}.eyebrow{font-size:11px;letter-spacing:1.2px;color:#9dc9e8;margin:0 0 12px}.page-head h1{font-size:29px;letter-spacing:-.8px;margin:0 0 12px}.page-head p{font-size:13px;color:#bfd2e2;line-height:1.8;margin:0}.page-head .fixed{border:1px solid #385a78;border-radius:12px;padding:18px 22px;display:flex;gap:19px;align-items:center;flex-shrink:0}.fixed strong{display:block;font-size:13px;margin-bottom:6px}.fixed span{display:block;font-size:11px;line-height:1.8;color:#aec5d8}.fixed svg{width:58px;height:58px}.jump{display:flex;gap:10px;flex-wrap:wrap;margin:18px 1px 23px}.jump a{font-size:11px;text-decoration:none;background:#fff;color:#4d6b81;border:1px solid #dce4ea;border-radius:30px;padding:8px 13px}article{border:1px solid #dce4ea;background:#fff;border-radius:17px;margin-bottom:23px;padding:21px 29px 26px;scroll-margin-top:15px}.card-head{display:flex;justify-content:space-between;align-items:flex-start;gap:15px;margin-bottom:17px}.card-head>div{display:grid;grid-template-columns:28px 1fr;gap:5px 10px;align-items:center}.card-head b{grid-row:1/3;display:grid;place-items:center;background:#e8f4ff;color:#0075de;border-radius:8px;width:28px;height:28px;font-size:11px;align-self:start}.card-head h2{font-size:21px;letter-spacing:-.5px;margin:0}.card-head span{font-size:12px;color:#6f8494;line-height:1.6;word-break:keep-all}.card-head>a{font-size:10px;font-weight:800;color:#0075de;white-space:nowrap;text-decoration:none;padding-top:7px}.view-label{display:flex;justify-content:space-between;align-items:center;font-size:10px;color:#8a9ba8;margin-bottom:8px;gap:10px}.view-label strong{font-size:10px;color:#688195;font-weight:750}.desktop-scene,.mobile-scene,.og-scene{background:#0d2a47;color:#fff;overflow:hidden}.desktop-scene{width:1100px;height:340px;border-radius:12px;display:grid;grid-template-columns:1fr 350px;gap:34px;align-items:center;padding:30px 42px}.copy{min-width:0}.subtitle{font-size:16px;font-weight:750;line-height:1.5;color:#7fc0ff;letter-spacing:-.15px}.copy h2{font-size:52px;font-weight:850;line-height:1.12;letter-spacing:-1.7px;margin:13px 0 18px}.copy p{font-size:16px;line-height:1.85;color:#c6d7e5;margin:0;letter-spacing:-.2px;word-break:keep-all}.graphic{width:350px;height:280px;flex-shrink:0;overflow:hidden}.secondary{display:grid;grid-template-columns:390px 1fr;gap:24px;margin-top:19px;align-items:start}.mobile-scene{width:390px;min-height:487px;border-radius:12px;padding:27px 28px 13px;display:flex;flex-direction:column;align-items:center;gap:12px}.mobile-scene .copy{width:100%}.mobile-scene .subtitle{font-size:13px}.mobile-scene .copy h2{font-size:37px;letter-spacing:-1.1px;margin:11px 0 14px}.mobile-scene .copy p{font-size:14px;line-height:1.8;letter-spacing:-.15px}.mobile-scene .graphic{width:292px;height:233.6px;margin-top:0}.og-panel{min-width:0}.og-viewport{width:686px;height:360.15px;border-radius:12px;overflow:hidden;position:relative;background:#0d2a47}.og-scene{width:1200px;height:630px;position:relative;transform:scale(.5716666667);transform-origin:top left}.og-scene .copy{position:absolute;left:66px;top:155px;width:665px}.og-scene .subtitle{font-size:24px;letter-spacing:-.2px}.og-scene .copy h2{font-size:82px;letter-spacing:-2.3px;margin:23px 0 25px}.og-scene .copy p{font-size:22px;line-height:1.9}.og-scene .graphic{position:absolute;right:38px;top:141px;width:400px;height:320px}.og-line{position:absolute;bottom:81px;left:66px;right:66px;height:1px;background:#7fc0ff;opacity:.24}.og-site{position:absolute;left:66px;bottom:44px;color:#a6bfd3;font-size:17px;letter-spacing:.3px}.rationale{margin-top:16px;border:1px solid #e1e9ef;border-radius:10px;background:#f8fafb;padding:15px 18px}.rationale p{font-size:11px;color:#627c90;line-height:1.8;margin:0 0 8px;display:grid;grid-template-columns:35px 1fr;gap:8px;word-break:keep-all}.rationale p:last-child{margin-bottom:0}.rationale b{font-size:10px;color:#385c77}.recommend{display:grid;grid-template-columns:150px 1fr 1fr;gap:28px;padding:25px 28px;border-radius:16px;background:#fff;border:1px solid #dce4ea;margin-top:25px}.recommend h2{font-size:18px;margin:0}.recommend h3{font-size:14px;margin:0 0 8px}.recommend p{font-size:12px;line-height:1.8;color:#617b8f;margin:0;word-break:keep-all}.recommend a{color:inherit;text-decoration:none}.notes{font-size:10px;line-height:1.9;color:#6e879a;margin:18px 4px 0}.notes strong{color:#385d78}.bottom{margin:23px 4px 0;border-top:1px solid #d3dfe7;padding-top:14px;display:flex;justify-content:space-between;font-size:9px;color:#879caa;letter-spacing:.7px}
@media(max-width:1190px){main{width:1160px;max-width:none;margin-left:16px;margin-right:16px}.page-head{padding:25px 30px}}
@media(max-width:620px){main{max-width:none;width:1160px}.page-head{width:1100px}.jump{width:1100px}.recommend{width:1160px}.notes,.bottom{width:1100px}}
</style></head><body><svg class="defs" xmlns="http://www.w3.org/2000/svg" aria-hidden="true"><defs>${graphics}</defs></svg><main><header class="page-head"><div><div class="eyebrow">세타랩 · 홈 소개 그림 탐색</div><h1>θ는 그대로, 주변에 이야기를 더했습니다</h1><p>도구의 궤도부터 작은 입체 실험대까지 6가지 방향.<br>같은 제목과 문구로 데스크톱·모바일·공유 이미지를 비교하세요.</p></div><div class="fixed"><svg viewBox="0 0 96 96" aria-label="확정 θ"><g fill="white">${brandPaths}</g></svg><div><strong>마크 모양은 확정한 그대로</strong><span>v4-01 = v3-10 원본<br>그림 안의 θ path를 바꾸지 않았습니다.</span></div></div></header><nav class="jump" aria-label="시안 바로가기">${illustrations.map(c=>`<a href="#candidate-${c.id}">${c.id} ${c.name}</a>`).join('')}</nav>${cards}<section class="recommend"><h2>먼저 볼 시안</h2><div><h3><a href="#candidate-01">01 도구의 궤도 ↗</a></h3><p>도구 다섯 가지를 가장 직접 보여 줍니다. θ가 중심이라는 구조도 분명해 홈과 공유 이미지에 함께 쓰기 쉽습니다.</p></div><div><h3><a href="#candidate-03">03 겹친 도구 카드 ↗</a></h3><p>실제 도구를 바로 사용할 수 있는 사이트라는 인상을 줍니다. 파란 θ 타일이 중심을 잡아 복잡한 화면에서도 구분됩니다.</p></div></section><p class="notes"><strong>제작 기준</strong> · 그림은 400×320 viewBox의 직접 만든 SVG이며 글자·외부 이미지·게임 아이콘이 없습니다. 색은 파랑·밝은 파랑·남색·흰색과 주황 한 가지입니다.<br><strong>마크 유지</strong> · 모든 그림의 θ는 확정한 v4-01의 두 path를 그대로 사용했습니다. 위치와 크기, 색만 달라집니다. 그림의 배경은 투명합니다.<br><strong>비교 화면</strong> · 데스크톱은 실제1100px, 모바일은 실제390px 모형입니다. 공유 모형은 실제1200×630 구성을 축소 표시합니다. 좁은 화면에서는 이 비교판을 가로로 이동해 볼 수 있습니다.<br><strong>파일</strong> · 다운로드 링크도 내장돼 이 HTML 하나로 그림을 볼 수 있습니다. 글꼴만 요청한 SUIT CDN을 사용합니다. 모든 그림은 정적 SVG라 움직임 설정에 영향을 받지 않습니다.</p><footer class="bottom"><span>SETA LAB / CODEX V5</span><span>확정 마크 1 · 소개 그림 6 · 화면 모형 18</span></footer></main><script>
const artworks=${serialized};
document.addEventListener('click',e=>{const a=e.target.closest('[data-download]');if(!a)return;e.preventDefault();const id=a.dataset.download;const url=URL.createObjectURL(new Blob([artworks[id]],{type:'image/svg+xml'}));const link=document.createElement('a');link.href=url;link.download='hero-'+id+'.svg';link.click();setTimeout(()=>URL.revokeObjectURL(url),1000)});
</script></body></html>`;
fs.writeFileSync(path.join(dir,'index.html'),html);
fs.writeFileSync(path.join(dir,'concepts.json'),JSON.stringify(illustrations.map(({inner,...c})=>c),null,2));
console.log(JSON.stringify({illustrations:6,htmlBytes:Buffer.byteLength(html),under512KB:Buffer.byteLength(html)<=512*1024}));
