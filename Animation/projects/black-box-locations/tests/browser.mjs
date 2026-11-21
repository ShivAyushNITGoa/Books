import assert from 'node:assert/strict';
import {chromium} from 'playwright';
import {serve} from '../../../tools/server.mjs';
const server=await serve({port:0});let browser;
try{
 const args=['--no-sandbox','--enable-unsafe-swiftshader'];if(process.env.CHROMIUM_PATH==='/tmp/chromium')args.push('--single-process','--no-zygote','--in-process-gpu','--use-gl=angle','--use-angle=swiftshader');
 browser=await chromium.launch({executablePath:process.env.CHROMIUM_PATH||undefined,args});const page=await browser.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));page.on('response',r=>{if(r.status()>=400)errors.push(`${r.status()} ${r.url()}`)});
 await page.goto(`http://127.0.0.1:${server.port}/projects/black-box-locations/index.html?width=360`,{waitUntil:'networkidle'});await page.waitForFunction(()=>window.renderSafe||window.renderError,{},{timeout:120000});assert.equal(await page.evaluate(()=>window.renderError),undefined);
 const visibility=await page.evaluate(()=>window.auditStaticSightlines());assert.deepEqual(visibility,[],'Foreground set obstructs recorder center');
 const times=[0,2,4.3,8,12.8,17.4,21.7,24.5,25.8,27.4,28.6,29.5,30.7,31.5,32.5,34,36,38.5,40.8,42.3,44.5,46.5,47.8,49.2,51,53.5,55.8,58,61.5,65];
 const result=await page.evaluate(times=>{
  const c=document.querySelector('#film'),ctx=c.getContext('2d'),reports=[];
  const pixels=()=>ctx.getImageData(0,0,c.width,c.height).data;
  for(const t of times){window.setT(t);const a=pixels();window.setT(0);window.setT(t);const b=pixels();let max=0,sum=0,spread=0;for(let j=0;j<a.length;j+=4){spread+=Math.abs(a[j]-a[j+1])+Math.abs(a[j+1]-a[j+2]);for(let k=0;k<3;k++){let d=Math.abs(a[j+k]-b[j+k]);max=Math.max(max,d);sum+=d}}reports.push({t,maxDelta:max,meanDelta:sum/(a.length*.75),spread,info:window.frameInfo})}
  window.setT(41.2);const a=pixels();window.setT(41.2+1/24);const b=pixels();let changed=0;for(let j=0;j<a.length;j+=4)if(a[j]!==b[j]||a[j+1]!==b[j+1])changed++;
  window.setT(41.2);const cc=Array.from(pixels());window.setCaptions(false);const clean=pixels();let ccChanges=0;for(let j=0;j<clean.length;j++)if(clean[j]!==cc[j])ccChanges++;
  return {reports,changed,ccChanges};
 },times);
 console.log(JSON.stringify(result,null,2));
 for(const r of result.reports){assert.ok(r.spread>500000,'Blank or grayscale frame');assert.ok(r.meanDelta<.1&&r.maxDelta<=1,`Non-deterministic scene at ${r.t}: ${r.maxDelta}/${r.meanDelta}`);assert.equal(r.info.continuousTake,true);for(const p of r.info.peopleClearance){assert.ok(p.clearance>.8);assert.ok(p.screenOverlap<.0001)};assert.ok(r.info.focus<.999||(r.info.screenBounds.min[0]>=-.842&&r.info.screenBounds.max[0]<=.842))}
 assert.ok(result.changed>100);assert.ok(result.ccChanges>100);assert.deepEqual(errors,[]);
 console.log('PASS: multi-location beats and transitions, no character/device overlap, safe framing, no missing assets, deterministic seeks, adjacent-frame motion, captions toggle.');
}finally{await browser?.close();await server.close()}
