import {chromium} from '@playwright/test';
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath,pathToFileURL} from 'node:url';
import sharp from 'sharp';
const dir=path.dirname(fileURLToPath(import.meta.url));
const browser=await chromium.launch({headless:true});
const page=await browser.newPage({viewport:{width:1440,height:1000},deviceScaleFactor:1});
const errors=[],requests=[],failedRequests=[];
page.on('pageerror',e=>errors.push(e.message));
page.on('request',r=>{if(/^https?:/.test(r.url()))requests.push(r.url())});
page.on('requestfailed',r=>failedRequests.push({url:r.url(),error:r.failure()?.errorText}));
await page.goto(pathToFileURL(path.join(dir,'index.html')).href,{waitUntil:'domcontentloaded'});
await page.evaluate(()=>Promise.race([document.fonts.ready,new Promise(r=>setTimeout(r,15000))]));
const fontLoaded=await page.evaluate(()=>document.fonts.check('800 16px SUIT'));
const audit=(target=page)=>target.evaluate(()=>({width:innerWidth,document:document.documentElement.scrollWidth,height:document.documentElement.scrollHeight,cards:document.querySelectorAll('article').length,overflow:[...document.querySelectorAll('article h2,.change,.home-copy,.sidebar,.tabs,.spec')].filter(e=>e.scrollWidth>e.clientWidth+1).map(e=>e.textContent),missingUse:[...document.querySelectorAll('use')].filter(e=>!document.querySelector(e.getAttribute('href'))).map(e=>e.getAttribute('href'))}));
const desktop=await audit();
await page.screenshot({path:path.join(dir,'overview.png'),fullPage:true});
for(const n of ['01','06','09'])await page.locator('#candidate-'+n).screenshot({path:path.join(dir,'detail-'+n+'.png')});
const downloads=[];
for(const kind of ['symbol','tile','lockup']){
 const [download]=await Promise.all([page.waitForEvent('download'),page.locator(`[data-download="01:${kind}"]`).click()]);
 const stream=await download.createReadStream();let raw='';for await(const chunk of stream)raw+=chunk.toString();
 downloads.push({kind,file:download.suggestedFilename(),validSVG:raw.startsWith('<svg')&&raw.includes('<path')&&!raw.includes('<text')});
}
await page.setViewportSize({width:390,height:844});
await page.evaluate(()=>scrollTo(0,0));
const mobile=await audit();
await page.screenshot({path:path.join(dir,'mobile.png'),fullPage:true});
await page.screenshot({path:path.join(dir,'mobile-top.png'),clip:{x:0,y:0,width:390,height:1000}});
// 파일 경로가 없는 문서에 HTML만 넣어도 심볼과 가로 조합이 렌더되는지 확인한다.
const standalonePage=await browser.newPage({viewport:{width:390,height:844}});
standalonePage.on('pageerror',e=>errors.push(e.message));
await standalonePage.setContent(fs.readFileSync(path.join(dir,'index.html'),'utf8'));
await standalonePage.evaluate(()=>document.fonts.ready);
const standalone=await audit(standalonePage);
const candidates=JSON.parse(fs.readFileSync(path.join(dir,'candidates.json')));
const pixels=[];
for(let i=0;i<candidates.length;i++){
 const c=candidates[i];
 for(const size of [16,32]){
  await sharp(path.join(dir,c.file+(size===16?'-16':'')+'.svg')).resize(size,size).png().toFile(path.join(dir,c.file+'-'+size+'.png'));
  await sharp(path.join(dir,c.file+(size===16?'-tile-16':'-tile')+'.svg')).resize(size,size).png().toFile(path.join(dir,c.file+'-tile-'+size+'.png'));
 }
 const enlarged=await sharp(path.join(dir,c.file+'-16.png')).resize(96,96,{kernel:'nearest'}).png().toBuffer();
 const tile=await sharp(path.join(dir,c.file+'-tile-16.png')).resize(96,96,{kernel:'nearest'}).png().toBuffer();
 pixels.push({input:enlarged,left:(i%5)*260+18,top:Math.floor(i/5)*145+24});
 pixels.push({input:tile,left:(i%5)*260+138,top:Math.floor(i/5)*145+24});
}
await sharp({create:{width:1300,height:290,channels:4,background:'#f6f5f4'}}).composite(pixels).png().toFile(path.join(dir,'pixel-review.png'));
const files=fs.readdirSync(dir).filter(f=>f.endsWith('.svg'));
const forbidden=files.filter(f=>/<text\b|<image\b|@import|https?:\/\/(?!www\.w3\.org)/.test(fs.readFileSync(path.join(dir,f),'utf8')));
const htmlBytes=fs.statSync(path.join(dir,'index.html')).size;
const result={desktop,mobile,standalone,fontLoaded,externalRequests:[...new Set(requests)],failedRequests,pageErrors:errors,downloads,svgCount:files.length,svgWithTextOrExternalContent:forbidden,htmlBytes,htmlLimit:512*1024,underLimit:htmlBytes<=512*1024,png16:20,png32:20};
fs.writeFileSync(path.join(dir,'verification.json'),JSON.stringify(result,null,2));
console.log(JSON.stringify(result,null,2));
await browser.close();
if(errors.length||forbidden.length||!result.underLimit||downloads.some(d=>!d.validSVG)||desktop.document>desktop.width||mobile.document>mobile.width||desktop.overflow.length||mobile.overflow.length||desktop.missingUse.length||standalone.missingUse.length)process.exitCode=1;
