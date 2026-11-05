import fs from 'node:fs';
import path from 'node:path';
export function buildArt(dir,H){
 const {defs,halo,P,line,circle,rect,g,mark}=H;
 const B='#0075de',I='#7fc0ff',N='#0d2a47',W='#ffffff',O='#ffb35c';
 function extraDefs(id){return defs(id)+`<defs><filter id="${id}-paper" x="-25%" y="-20%" width="150%" height="155%"><feDropShadow dx="0" dy="4" stdDeviation="2.5" flood-color="${N}" flood-opacity=".8"/></filter><filter id="${id}-front" x="-40%" y="-35%" width="180%" height="190%"><feDropShadow dx="0" dy="13" stdDeviation="6" flood-color="${N}" flood-opacity=".85"/></filter></defs>`}
 function person(x,y,color=W){return circle(x,y,3.2,color)+P(`M${x-4.5} ${y+7}Q${x} ${y+2} ${x+4.5} ${y+7}V${y+8}H${x-4.5}Z`,`fill="${color}"`)}
 function qr(ink,bg){
  let d='';
  const finder=(x,y)=>`M${x} ${y}h7v7h-7ZM${x+1} ${y+1}v5h5v-5ZM${x+2} ${y+2}h3v3h-3Z`;
  for(const [x,y] of [[0,0],[14,0],[0,14]])d+=finder(x,y);
  for(let y=0;y<21;y++)for(let x=0;x<21;x++){
   if((x<8&&y<8)||(x>12&&y<8)||(x<8&&y>12))continue;
   if((x*7+y*11+x*y)%13<5)d+=`M${x} ${y}h1v1h-1Z`;
  }
  return rect(17,5,86,90,6,bg)+`<g transform="translate(24 12) scale(3.42)"><path d="${d}" fill="${ink}" fill-rule="evenodd"/></g>`;
 }
 function screen(kind,bright=false){
  const ink=bright?B:I,muted=bright?N:I,bg=bright?W:N;
  let inner='';
  if(kind==='team'){
   inner=rect(5,5,51,90,5,ink,`opacity="${bright?.1:.12}"`)+rect(64,5,51,90,5,O,`opacity="${bright?.12:.1}"`)+rect(14,12,31,5,2,B)+rect(74,12,31,5,2,O);
   for(let row=0;row<3;row++)for(let col=0;col<2;col++){
    const x=10+col*59,y=25+row*22,color=col?O:ink;
    inner+=rect(x,y,41,17,4,color,`opacity="${bright?.15:.23}"`)+person(x+9,y+5,bright?B:W)+rect(x+19,y+6,16,3,1,muted,'opacity=".65"');
   }
  }
  if(kind==='bracket'){
   inner=line('M26 15h15v24H26M26 63h15v24H26M41 27h17M41 75h17M78 27h13v48H78M91 51h17',1,2.7,ink);
   for(const y of [6,30,54,78])inner+=rect(3,y,23,17,3,ink,'opacity=".2"')+rect(6,y+4,3,9,1,ink)+rect(12,y+6,10,3,1,muted,'opacity=".7"');
   for(const y of [18,66])inner+=rect(58,y,20,17,3,ink,'opacity=".24"');
   inner+=rect(102,43,15,17,3,O)+P('M106 49l3 3 5-6',`fill="none" stroke="${bg}" stroke-width="2"`);
  }
  if(kind==='marble'){
   inner=line('M10 13L109 37Q114 39 110 44L18 69Q13 71 18 76L107 94',.23,8,ink)+line('M10 13L109 37Q114 39 110 44L18 69Q13 71 18 76L107 94',1,3.2,ink);
   for(const [x,y,r,color] of [[30,13,7,O],[84,27,6,bright?B:W],[63,52,7,I],[35,76,6,bright?B:W]])inner+=circle(x,y,r,color,1,`stroke="${bright?N:B}" stroke-width="1"`)+circle(x-1.7,y-2,r*.25,W,.85);
   inner+=line('M8 5v14M104 82v18',.7,2,muted)+rect(105,86,9,4,0,ink)+rect(105,94,9,4,0,ink);
  }
  if(kind==='qr')inner=qr(ink,bright?'#ffffff':'#0d2a47');
  if(kind==='blog'){
   inner=rect(5,7,63,43,4,ink,'opacity=".17"')+P('M8 46L24 26L36 37L47 21L64 46Z',`fill="${ink}" opacity=".75"`)+circle(19,18,5,O)+P('M83 6H105L115 16V52H83Z',`fill="${ink}" opacity=".14" stroke="${ink}" stroke-width="1.7"`)+line('M104 7v11h10M88 26h20M88 33h20M88 40h15',.9,2.3,ink)+rect(6,64,106,6,2,ink,'opacity=".8"')+rect(6,78,91,5,2,muted,'opacity=".45"')+rect(6,91,102,5,2,muted,'opacity=".45"');
  }
  return `<g data-ui="${kind}">${inner}</g>`;
 }
 function card(id,{x,y,w,h,angle=0,tool,bright=false,dx=0}){
  const ink=bright?B:I;
  const scale=Math.min((w-20)/120,(h-31)/100),ox=(w-120*scale)/2+dx,oy=28+((h-31)-100*scale)/2;
  const face=rect(0,0,w,h,10,bright?W:N,`stroke="${ink}" stroke-opacity="${bright?.8:.54}" stroke-width="1.2"`)+(bright?'':rect(1,1,w-2,h-2,9,B,'opacity=".1"'));
  const chrome=circle(11,11,2,ink,.6)+circle(18,11,2,ink,.35)+circle(25,11,2,ink,.2)+rect(37,8,w-57,5,2,ink,'opacity=".18"')+line(`M0 22H${w}`,.22,1,ink);
  return `<g data-tool="${tool}" transform="translate(${x} ${y}) rotate(${angle} ${w/2} ${h/2})" filter="url(#${id}-paper)">${face}${chrome}<g transform="translate(${ox} ${oy}) scale(${scale})">${screen(tool,bright)}</g></g>`;
 }
 function front(id,x,y,size){return `<g data-front-tile="true" filter="url(#${id}-front)">${rect(x,y,size,size,21,B,`stroke="${I}" stroke-opacity=".75" stroke-width="1.2"`)}${rect(x+5,y+5,size-10,size-10,17,'none','stroke="white" stroke-opacity=".12"')}${line(`M${x+20} ${y+6}H${x+size-20}`,.2,1,W)}</g>`+mark(x+12,y+12,size-24)}
 const old=fs.readFileSync(path.join(dir,'../codex-v5/hero-03.svg'),'utf8').replace(/^<svg[^>]*>/,'').replace(/<\/svg>\s*$/,'').replace(/<title>.*?<\/title>/,'');
 const result=[{id:'00',name:'v5-03 비교 원본',added:'기존의 추상적인 카드 화면과 반투명 θ 타일입니다. 새 4개와 비교하는 기준입니다.',focus:'이전 시안을 그대로 두고 도구 식별력과 겹침 차이를 비교합니다.',mobile:'기존 원본이며 변경하지 않았습니다.',inner:old,tools:['team','qr','blog'],cardCount:3,baseline:true}];
 {
  const id='v601';
  const cards=[{x:130,y:19,w:140,h:112,tool:'bracket'},{x:18,y:105,w:138,h:157,angle:-7,tool:'team'},{x:244,y:105,w:138,h:157,angle:7,tool:'qr'}];
  const inner=extraDefs(id)+halo(id,200,172,166,142)+cards.map(c=>card(id,c)).join('')+front(id,134,127,132);
  result.push({id:'01',name:'정돈형 · 세 도구',added:'팀 열·대진표·QR을 3장에 크게 그려, 남색 톤으로 차분하게 정리했습니다.',focus:'큰 도구 모양 3개와 불투명 θ 타일이 분명하게 나뉩니다.',mobile:'기울기를 7°로 줄이고 도구 화면을 바깥쪽에 보여 줍니다.',inner,tools:['bracket','team','qr'],cardCount:3});
 }
 {
  const id='v602';
  const cards=[{x:143,y:14,w:114,h:134,tool:'blog'},{x:60,y:65,w:112,h:131,angle:-14,tool:'bracket'},{x:230,y:65,w:112,h:131,angle:14,tool:'qr',dx:6},{x:27,y:155,w:110,h:130,angle:-18,tool:'team'},{x:263,y:155,w:110,h:130,angle:18,tool:'marble'}];
  const inner=extraDefs(id)+halo(id,200,168,176,143)+cards.map(c=>card(id,c)).join('')+front(id,137,146,126);
  result.push({id:'02',name:'풍성형 · 다섯 도구',added:'팀·대진표·구슬 레이스·QR·가이드 5장을 부채꼴로 펼쳤습니다.',focus:'사이트의 도구와 기록 다섯 종류를 한 번에 보여 줍니다.',mobile:'중앙은 타일에 맡기고, 도구 특징은 부채의 바깥 가장자리에 모았습니다.',inner,tools:['blog','bracket','qr','team','marble'],cardCount:5});
 }
 {
  const id='v603';
  const cards=[{x:125,y:19,w:150,h:121,tool:'blog',bright:true},{x:17,y:104,w:138,h:158,angle:-7,tool:'team',bright:true},{x:245,y:104,w:138,h:158,angle:7,tool:'qr',bright:true,dx:4}];
  const inner=extraDefs(id)+halo(id,200,167,174,143)+cards.map(c=>card(id,c)).join('')+front(id,128,119,144);
  result.push({id:'03',name:'밝은 카드형 · 선명한 대비',added:'사람 칩·이미지와 문서·QR을 흰 카드에 담고, 중앙 θ 타일을 더 크게 했습니다.',focus:'남색 바탕에서 카드의 면과 도구 모양이 또렷하게 드러납니다.',mobile:'144px 파란 타일이 앞을 막아 뒤 화면이 로고에 비치지 않습니다.',inner,tools:['blog','team','qr'],cardCount:3});
 }
 {
  const id='v604';
  const cards=[{x:27,y:27,w:151,h:125,angle:-5,tool:'team'},{x:222,y:27,w:151,h:125,angle:5,tool:'qr',dx:5},{x:27,y:180,w:151,h:122,angle:-5,tool:'marble'},{x:222,y:180,w:151,h:122,angle:5,tool:'blog'}];
  const inner=extraDefs(id)+halo(id,200,164,176,150)+cards.map(c=>card(id,c)).join('')+front(id,137,101,126);
  result.push({id:'04',name:'도구 선반형 · 네 화면',added:'팀·QR·구슬 레이스·가이드를 네 모서리에 나누고, θ 타일로 중심을 묶었습니다.',focus:'겹친 카드는 유지하면서 각 화면의 노출 면적을 크게 확보했습니다.',mobile:'카드 기울기를 5°로 낮춰 작은 썸네일에서도 화면의 질서가 남습니다.',inner,tools:['team','qr','marble','blog'],cardCount:4});
 }
 return result;
}
