import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath,pathToFileURL} from 'node:url';
import {chromium} from '@playwright/test';
import sharp from 'sharp';
const dir=path.dirname(fileURLToPath(import.meta.url));
const source=JSON.parse(fs.readFileSync(path.join(dir,'source-content.json'),'utf8'));
const browser=await chromium.launch({headless:true});
const context=await browser.newContext({deviceScaleFactor:1,reducedMotion:'reduce'});
const page=await context.newPage();await page.setViewportSize({width:1520,height:1000});
const errors=[],failed=[];page.on('pageerror',e=>errors.push(e.message));page.on('requestfailed',r=>failed.push({url:r.url(),error:r.failure()?.errorText}));
await page.goto(pathToFileURL(path.join(dir,'index.html')).href,{waitUntil:'domcontentloaded'});
await page.evaluate(async()=>{await document.fonts.load('800 24px SUIT','Seta Lab');await document.fonts.ready;await new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r)))});
const css=await page.locator('style').innerText();
const definitions=await page.locator('svg.defs').evaluate(e=>e.outerHTML);
const screenshots=[],audits=[];
for(const variant of ['A','B','C'])for(const layout of ['desktop','mobile'])for(const theme of ['light','dark']){
 const id=`${variant}-${layout}-${theme}`;
 const mock=await page.locator('#'+id).evaluate(e=>e.outerHTML);
 const p=await context.newPage();await p.setViewportSize({width:layout==='desktop'?1440:390,height:1000});
 p.on('pageerror',e=>errors.push(e.message));
 await p.setContent(`<html lang="ko"><head><meta charset="utf-8"><style>${css}\nbody{margin:0}.mock{transform:none!important}</style></head><body>${definitions}${mock}</body></html>`);
 await p.evaluate(async()=>{await document.fonts.load('800 24px SUIT','최신 블로그 글');await document.fonts.load('400 16px SUIT','모임을 준비할 때는');await document.fonts.ready;await new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r)))});
 const result=await p.evaluate(({source,id})=>{
  const norm=s=>s.replace(/\s+/g,' ').trim();const links=e=>[...e.querySelectorAll('a')].map(a=>({text:norm(a.textContent),href:a.getAttribute('href')}));
  const issues=[];const same=(a,b,label)=>{if(JSON.stringify(a)!==JSON.stringify(b))issues.push({label,expected:b,actual:a})};
  const posts=[...document.querySelectorAll('[data-post]')];
  same(posts.length,source.posts.length,'글 개수');
  posts.forEach((e,i)=>{const s=source.posts[i];same({category:norm(e.querySelector('.category').textContent),date:norm(e.querySelector('time').textContent),datetime:e.querySelector('time').getAttribute('datetime'),title:norm(e.querySelector('h3').textContent),summary:norm(e.querySelector('.post-summary').textContent),href:e.querySelector('h3 a').getAttribute('href')},s,'최신 글 '+i)});
  same(document.querySelector('.all-posts').getAttribute('href'),'/blog','전체 글 링크');
  same(norm(document.querySelector('.guide-intro').textContent),source.choose.intro.text,'도입 문장');
  same(norm(document.querySelector('.guide-example').textContent),source.choose.example.text,'예시 문단');
  for(let i=0;i<4;i++){const e=document.querySelector(`[data-use="${i}"]`);same(norm(e.querySelector('dt>span:last-child').textContent),source.choose.uses[i].title,'용도 제목 '+i);same(norm(e.querySelector('dd').textContent),source.choose.uses[i].description.text,'용도 설명 '+i);same(links(e.querySelector('dd')),source.choose.uses[i].description.links,'용도 링크 '+i)}
  for(let i=0;i<2;i++){const e=document.querySelector(`[data-paragraph="${i}"]`);same(norm(e.textContent),source.author.paragraphs[i].text,'운영자 문단 '+i);same(links(e),source.author.paragraphs[i].links,'운영자 링크 '+i)}
  same(norm(document.querySelector('.site-footer').textContent),source.footer.text,'footer 문장');same(links(document.querySelector('.site-footer')),source.footer.links,'footer 링크');
  same(norm(document.querySelector('[data-content=choose] h2').textContent),source.choose.title,'도구 영역 제목');same(norm(document.querySelector('[data-content=author] h2').textContent),source.author.title,'운영자 영역 제목');
  const hiddenGuide=[...document.querySelectorAll('.guide-intro,.guide-desc,.guide-example,.author-paragraph')].filter(e=>!e.getBoundingClientRect().height||getComputedStyle(e).display==='none'||getComputedStyle(e).visibility==='hidden').map(e=>e.className);
  const overflow=[...document.querySelectorAll('.post-card,.use-item,.author-block,.author-paragraph,.section-head,.site-footer,.flow-map')].filter(e=>e.scrollWidth>e.clientWidth+1).map(e=>({class:e.className,scroll:e.scrollWidth,client:e.clientWidth}));
  const headings=[...document.querySelectorAll('.lower-content h2,.lower-content h3')].map(e=>({text:norm(e.textContent),font:parseFloat(getComputedStyle(e).fontSize)}));
  const oddFonts=[...document.querySelectorAll('.mock *')].filter(e=>!e.closest('svg')).map(e=>parseFloat(getComputedStyle(e).fontSize)).filter(n=>n%2!==0);
  const styles=getComputedStyle(document.querySelector('.mock'));
  const summaryLines=posts.map(e=>{const s=e.querySelector('.post-summary');return Math.round(s.getBoundingClientRect().height/parseFloat(getComputedStyle(s).lineHeight)*100)/100});
  return {id,width:innerWidth,documentWidth:document.documentElement.scrollWidth,height:document.documentElement.scrollHeight,contentWidth:document.querySelector('.content').getBoundingClientRect().width,postCount:posts.length,guideUses:document.querySelectorAll('[data-use]').length,issues,hiddenGuide,overflow,oddFonts:[...new Set(oddFonts)],headings,summaryLines,theme:{surface:styles.getPropertyValue('--ui-surface').trim(),text:styles.getPropertyValue('--ui-text').trim(),muted:styles.getPropertyValue('--ui-text-muted').trim(),border:styles.getPropertyValue('--ui-border').trim(),primary:styles.getPropertyValue('--ui-primary').trim()},unexpectedCollapse:document.querySelectorAll('details').length};
 },{source,id});
 const file=id+'.png';await p.screenshot({path:path.join(dir,file),fullPage:true,animations:'disabled'});
 if(layout==='mobile'&&variant==='A'&&theme==='light')await p.locator('.lower-content').screenshot({path:path.join(dir,'A-mobile-lower.png')});
 screenshots.push({variant,layout,theme,file,width:result.width,height:result.height});audits.push(result);await p.close();
}
// 비교 페이지의 네 보기 전환도 실제로 조작한다.
const controls=[];
for(const layout of ['desktop','mobile'])for(const theme of ['light','dark']){await page.locator(`[data-layout-button="${layout}"]`).click();await page.locator(`[data-theme-button="${theme}"]`).click();await page.evaluate(()=>new Promise(r=>requestAnimationFrame(r)));controls.push({layout,theme,visible:await page.locator('.model-slot.active').count()})}
await page.locator('[data-layout-button="desktop"]').click();await page.locator('[data-theme-button="light"]').click();
await page.screenshot({path:path.join(dir,'gallery-default.png'),fullPage:true,animations:'disabled'});
const montage=[];
for(const variant of ['A','B','C']){
 const items=screenshots.filter(s=>s.variant===variant);const thumbData=[];
 for(const s of items){const h=1120,w=Math.round(s.width/s.height*h);const buffer=await sharp(path.join(dir,s.file)).resize(w,h).png().toBuffer();thumbData.push({s,w,buffer})}
 const row=Number(variant.charCodeAt(0)-65),rowY=120+row*1232;let left=32;
 for(const t of thumbData){montage.push({input:t.buffer,left,top:rowY+52});const label=`${variant} · ${t.s.layout==='desktop'?'데스크톱':'모바일'} · ${t.s.theme==='light'?'밝은':'어두운'}`;montage.push({input:Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${t.w}" height="40"><text x="0" y="24" font-size="16" fill="#0d2a47" font-family="sans-serif">${label}</text></svg>`),left,top:rowY+8});left+=t.w+24;}
 }
const totalWidth=Math.max(...['A','B','C'].map(v=>screenshots.filter(s=>s.variant===v).reduce((n,s)=>n+Math.round(s.width/s.height*1120)+24,64))),totalHeight=120+3*1232;
const title=Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${totalWidth}" height="100"><rect width="100%" height="100%" fill="#0d2a47"/><text x="32" y="46" fill="white" font-size="24" font-family="sans-serif">Seta Lab · 홈 하단 3가지 방향</text><text x="32" y="76" fill="#7fc0ff" font-size="16" font-family="sans-serif">A 정돈형 / B 흐름형 / C 읽기형 · 원문과 링크 전체 유지</text></svg>`);
await sharp({create:{width:totalWidth,height:totalHeight,channels:4,background:'#eaeef1'}}).composite([{input:title,left:0,top:0},...montage]).png().toFile(path.join(dir,'overview.png'));
const originalViewBox=fs.readFileSync('static/favicon.svg','utf8').match(/viewBox="([^"]+)"/)[1];
const galleryViewBox=await page.locator('#brand').getAttribute('viewBox');
const result={brandViewBox:{original:originalViewBox,used:galleryViewBox,matches:originalViewBox===galleryViewBox},audits,screenshots,controls,pageErrors:errors,failedRequests:failed,htmlBytes:fs.statSync(path.join(dir,'index.html')).size,htmlLimit:512*1024,sourcePosts:source.posts.length,allContentEqual:audits.every(a=>a.issues.length===0),allGuideVisible:audits.every(a=>!a.hiddenGuide.length&&!a.unexpectedCollapse),allWidthsFit:audits.every(a=>a.width===a.documentWidth&&!a.overflow.length),allEvenFonts:audits.every(a=>!a.oddFonts.length)};
fs.writeFileSync(path.join(dir,'verification.json'),JSON.stringify(result,null,2));
console.log(JSON.stringify({models:audits.length,allContentEqual:result.allContentEqual,allGuideVisible:result.allGuideVisible,allWidthsFit:result.allWidthsFit,allEvenFonts:result.allEvenFonts,issues:audits.filter(a=>a.issues.length||a.overflow.length||a.documentWidth>a.width||a.oddFonts.length).map(a=>({id:a.id,issues:a.issues,overflow:a.overflow,documentWidth:a.documentWidth,oddFonts:a.oddFonts})),pageErrors:errors,htmlBytes:result.htmlBytes,sizes:screenshots},null,2));
await browser.close();
if(!result.brandViewBox.matches||!result.allContentEqual||!result.allGuideVisible||!result.allWidthsFit||!result.allEvenFonts||errors.length||result.htmlBytes>result.htmlLimit)process.exitCode=1;
