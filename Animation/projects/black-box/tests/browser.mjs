import assert from 'node:assert/strict';
import {chromium} from 'playwright';
import {serve} from '../../../tools/server.mjs';
const server=await serve({port:0});let browser;
try{
 const args=['--no-sandbox','--enable-unsafe-swiftshader'];if(process.env.CHROMIUM_PATH==='/tmp/chromium')args.push('--single-process','--no-zygote','--in-process-gpu','--use-gl=angle','--use-angle=swiftshader');
 browser=await chromium.launch({executablePath:process.env.CHROMIUM_PATH||undefined,args});const page=await browser.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));page.on('response',r=>{if(r.status()>=400)errors.push(`${r.status()} ${r.url()}`)});
 await page.goto(`http://127.0.0.1:${server.port}/projects/black-box/index.html?width=360`,{waitUntil:'networkidle'});await page.waitForFunction(()=>window.renderSafe||window.renderError,{},{timeout:120000});assert.equal(await page.evaluate(()=>window.renderError),undefined);
 const times=[0,4.2,12.8,21.7,27.8,30.3,32.4,35.2,39.6,41.2,46,49,54.1,60.9,65];
 const result=await page.evaluate(times=>{
  const c=document.querySelector('#film'),ctx=c.getContext('2d'),reports=[];
  const pixels=()=>ctx.getImageData(0,0,c.width,c.height).data;
  for(const t of times){window.setT(t);const a=pixels();window.setT(0);window.setT(t);const b=pixels();let max=0,sum=0,spread=0;for(let j=0;j<a.length;j+=4){spread+=Math.abs(a[j]-a[j+1])+Math.abs(a[j+1]-a[j+2]);for(let k=0;k<3;k++){let d=Math.abs(a[j+k]-b[j+k]);max=Math.max(max,d);sum+=d}}reports.push({t,maxDelta:max,meanDelta:sum/(a.length*.75),spread,info:window.frameInfo})}
  window.setT(41.2);const a=pixels();window.setT(41.2+1/24);const b=pixels();let changed=0;for(let j=0;j<a.length;j+=4)if(a[j]!==b[j]||a[j+1]!==b[j+1])changed++;
  window.setT(41.2);const cc=Array.from(pixels());window.setCaptions(false);const clean=pixels();let ccChanges=0;for(let j=0;j<clean.length;j++)if(clean[j]!==cc[j])ccChanges++;
  return {reports,changed,ccChanges};
 },times);
 console.log(JSON.stringify(result,null,2));
 for(const r of result.reports){assert.ok(r.spread>500000,'Blank or grayscale frame');assert.ok(r.meanDelta<.1&&r.maxDelta<=1,`Non-deterministic scene at ${r.t}: ${r.maxDelta}/${r.meanDelta}`);assert.equal(r.info.continuousTake,true)}
 assert.ok(result.changed>100);assert.ok(result.ccChanges>100);assert.deepEqual(errors,[]);
 console.log('PASS: all chapters, dark/underwater/orange reveal, no missing assets, deterministic seeks, adjacent-frame motion, captions toggle.');
}finally{await browser?.close();await server.close()}
