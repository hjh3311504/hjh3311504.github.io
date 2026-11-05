import {chromium} from '@playwright/test';
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath, pathToFileURL} from 'node:url';
import sharp from 'sharp';
const dir=path.dirname(fileURLToPath(import.meta.url));
const browser=await chromium.launch({headless:true});
const page=await browser.newPage({viewport:{width:1440,height:1000},deviceScaleFactor:1});
const network=[], errors=[];
page.on('pageerror',e=>errors.push(e.message));
page.on('request',r=>{if(/^https?:/.test(r.url()))network.push(r.url())});
await page.goto(pathToFileURL(path.join(dir,'index.html')).href);
await page.evaluate(()=>document.fonts.ready);
await page.locator('article').last().waitFor();
const images=await page.locator('img').evaluateAll(imgs=>imgs.filter(i=>!i.complete||!i.naturalWidth).map(i=>i.src));
const desktop=await page.evaluate(()=>({width:innerWidth,document:document.documentElement.scrollWidth,height:document.documentElement.scrollHeight,cards:document.querySelectorAll('article').length,overflow:[...document.querySelectorAll('article h2,.concept,.sidebar,article footer')].filter(e=>e.scrollWidth>e.clientWidth+1).map(e=>e.textContent)}));
await page.screenshot({path:path.join(dir,'overview.png'),fullPage:true});
await page.locator('#candidate-04').screenshot({path:path.join(dir,'detail-04.png')});
await page.locator('#candidate-05').screenshot({path:path.join(dir,'detail-05.png')});
await page.locator('#candidate-07').screenshot({path:path.join(dir,'detail-07.png')});
await page.setViewportSize({width:390,height:844});
const mobile=await page.evaluate(()=>({width:innerWidth,document:document.documentElement.scrollWidth,overflow:[...document.querySelectorAll('article h2,.concept,.sidebar,article footer')].filter(e=>e.scrollWidth>e.clientWidth+1).map(e=>e.textContent)}));
await page.screenshot({path:path.join(dir,'mobile.png'),fullPage:true});
await page.setContent(fs.readFileSync(path.join(dir,'index.html'),'utf8'));
await page.evaluate(()=>document.fonts.ready);
const standalone=await page.locator('img').evaluateAll(imgs=>({imageCount:imgs.length,allEmbedded:imgs.every(i=>i.src.startsWith('data:image/svg+xml;')),broken:imgs.filter(i=>!i.complete||!i.naturalWidth).map(i=>i.alt)}));
const files=fs.readdirSync(dir).filter(f=>/\.svg$/.test(f));
const forbidden=[];
const icons=[];
for(const file of files){
 const raw=fs.readFileSync(path.join(dir,file),'utf8');
 if(/<text\b|<image\b|@import|https?:\/\/(?!www\.w3\.org)/.test(raw))forbidden.push(file);
 if(!file.includes('lockup')){
   for(const size of [16,32])await sharp(path.join(dir,file)).resize(size,size).png().toFile(path.join(dir,file.replace('.svg',`-${size}.png`)));
   icons.push(file);
 }
}
const result={desktop,mobile,standalone,brokenImages:images,externalRequests:network,pageErrors:errors,svgCount:files.length,iconCount:icons.length,svgWithTextOrExternalContent:forbidden};
fs.writeFileSync(path.join(dir,'verification.json'),JSON.stringify(result,null,2));
console.log(JSON.stringify(result,null,2));
await browser.close();
if(images.length||network.length||errors.length||forbidden.length||!standalone.allEmbedded||standalone.broken.length||desktop.document>desktop.width||mobile.document>mobile.width||desktop.overflow.length||mobile.overflow.length)process.exitCode=1;
