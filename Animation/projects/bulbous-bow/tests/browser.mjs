import {chromium} from 'playwright';
import {mkdir,writeFile} from 'node:fs/promises';
import assert from 'node:assert/strict';
import {serve,ROOT} from '../../../tools/server.mjs';
import path from 'node:path';
const web=await serve({port:0});let browser;
const errors=[],samples=[];
try{
 const args=['--no-sandbox','--enable-unsafe-swiftshader'];
 if(process.env.CHROMIUM_PATH==='/tmp/chromium')args.push('--single-process','--no-zygote','--in-process-gpu','--use-gl=angle','--use-angle=swiftshader');
 browser=await chromium.launch({executablePath:process.env.CHROMIUM_PATH||undefined,args});
 const page=await browser.newPage();page.on('console',m=>{if(m.type()==='error')errors.push(m.text())});page.on('pageerror',e=>errors.push(e.message));
 await page.goto(`http://127.0.0.1:${web.port}/projects/bulbous-bow/index.html?width=360`,{waitUntil:'networkidle'});
 await page.waitForFunction(()=>window.renderSafe||window.renderError,{},{timeout:120000});
 assert.equal(await page.evaluate(()=>window.renderError),undefined);
 const audit=await page.evaluate(()=>window.auditCamera());
 assert.equal(audit.issues.length,0);assert.equal(audit.settledBounds.length,0);assert.equal(audit.repeatedOrbits,false);
 for(const t of [0,6,11,18,22,26,31,39,51,62,70,79,88,96,106,113,122,129,139,149,158,165,172,180,187,195,203]){
  const frame=await page.evaluate(t=>{window.setT(t);return window.frameInfo},t);
  assert.equal(frame.time,t);assert.ok(frame.drawCalls>0&&frame.triangles>0);
  assert.ok(frame.terrainClearance>.7);samples.push(frame);
  if(t===79||t===172){
   const visible=await page.evaluate(t=>{
    const c=document.querySelector('#film').getContext('2d');
    const a=c.getImageData(t===79?75:40,t===79?292:275,t===79?90:220,t===79?75:95).data;
    let count=0;for(let i=0;i<a.length;i+=4){const [r,g,b]=[a[i],a[i+1],a[i+2]];
     if(t===79?r>40&&r>g*1.2&&r>b*1.2:r>140&&g>130)count++;
    }return count;
   },t);
   assert.ok(visible>300,`${t===79?'Bulb through explanatory water cutaway':'Tow model, not a laboratory wall'} must remain visibly present at ${t}s; pixels=${visible}`);
  }
 }
 const floor=[];
 for(let t=160.5;t<=174;t+=.5){
  const points=await page.evaluate(t=>{window.setT(t);return window.sampleLabFloor()},t);
  floor.push({time:t,points});
 }
 const floorPoints=floor.flatMap(f=>f.points),badFloor=floor.flatMap(f=>f.points.filter(p=>!p.slabColor).map(p=>({time:f.time,...p})));
 assert.ok(floorPoints.length>30,'Temporal floor test must actually see the slab');
 assert.equal(badFloor.length,0,'Ray-confirmed floor must not switch to terrain-coloured pixels: '+JSON.stringify(badFloor.slice(0,4)));
 await page.evaluate(()=>window.setCaptions(false));await page.evaluate(()=>window.setCaptions(true));
 const stats=await page.evaluate(()=>window.worldStats);
 assert.equal(stats.fullSizeShipsIndoors,0);assert.equal(stats.miniatureModels,3);assert.equal(stats.fullSizeShips,2);assert.ok(stats.sharedLandAndSeabed);assert.ok(stats.minimumLabSurfaceSeparation>.65);assert.equal(stats.bulbWidthMeters,3.7);assert.ok(stats.meanImmersedDraftMeters<8.5);
 assert.deepEqual(errors,[],'No WebGL shader compilation or JavaScript runtime errors');
 const output=path.join(ROOT,'output/bulbous-bow/browser-test.json');await mkdir(path.dirname(output),{recursive:true});
 await writeFile(output,JSON.stringify({audit,stats,samples,errors,floor:{poses:floor.length,visiblePoints:floorPoints.length,badPixels:badFloor.length,samples:floor}},null,2));
 console.log(`PASS: ${samples.length} browser poses, ${audit.frames} camera poses, zero shader/runtime errors`);
}finally{await browser?.close();await web.close()}
