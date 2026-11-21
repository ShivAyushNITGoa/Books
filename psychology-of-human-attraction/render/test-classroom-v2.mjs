import { chromium } from 'playwright';
import assert from 'node:assert/strict';
const browser=await chromium.launch({executablePath:process.env.CHROMIUM_PATH||undefined,args:['--no-sandbox','--single-process','--no-zygote','--in-process-gpu','--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader']});
try {
 const page=await browser.newPage({viewport:{width:450,height:900}}),errors=[];
 page.on('pageerror',e=>errors.push(e.message));
 const root=process.env.TEST_ROOT||'http://127.0.0.1:3000';
 await page.goto(`${root}/classroom-v2/index.html`,{waitUntil:'networkidle'});
 await page.waitForFunction(()=>window.renderSafe);
 assert.deepEqual(await page.locator('canvas').evaluate(c=>[c.width,c.height]),[1080,1920]);
 const sample=t=>page.evaluate(t=>{window.setT(t);return {...window.frameDiagnostics}},t);
 const baseline=(await sample(0)).objects;
 for(const t of [0,6,8,11.6,12.9,16,20,24,26,28.5]){
  const d=await sample(t);assert.equal(d.objects,baseline,'persistent scene object graph');
  assert.ok(Math.abs(d.studentFeetY)<.0001,'feet meet the floor');
 }
 assert.equal((await sample(0)).mouth,0,'mouth closes in silence');
 assert.ok((await sample(.7)).mouth>0,'voice envelope opens mouth during narration');
 assert.equal((await sample(7)).phoneOnDesk,false);assert.equal((await sample(8)).phoneOnDesk,true);
 assert.equal((await sample(12)).holding,false);assert.equal((await sample(13)).holding,true);assert.equal((await sample(17)).holding,false);
 for(const [t,who] of [[6,0],[16,1],[26,0]]){
  const bounds=(await sample(t)).faceBounds[who];console.log(`Focal face ${t}s:`,bounds.map(n=>n.toFixed(3)));
  assert.ok(bounds[0]>.02&&bounds[1]<.98,'focal face must not be cropped');
 }
 const frame=t=>page.evaluate(t=>{window.setT(t);return document.querySelector('canvas').toDataURL()},t);
 for(const t of [4.7,12.9]){const original=await frame(t);await frame(28.5);assert.equal(await frame(t),original,'deterministic seeking, including attached props')}
 assert.notEqual(await frame(4.7),await frame(4.9),'within-shot acting');
 assert.notEqual(await frame(22.5),await frame(23.5),'walking');
 await page.locator('#seek').evaluate(el=>{el.value='2';el.dispatchEvent(new Event('input',{bubbles:true}))});
 await page.locator('#play').click();await page.waitForTimeout(1400);assert.ok(await page.evaluate(()=>window.currentTime>2.1));
 await page.locator('#play').click();const stopped=await page.evaluate(()=>window.currentTime);await page.waitForTimeout(300);assert.equal(await page.evaluate(()=>window.currentTime),stopped);
 assert.deepEqual(errors,[]);
 await page.goto(root);await page.locator('#demo-videos').waitFor();
 assert.equal(await page.locator('video[src="/demo/classroom-scarcity-30s-v2.mp4"]').count(),1);
 for(const ext of ['jpg','srt','mp3'])assert.equal((await page.request.get(`${root}/demo/classroom-scarcity-30s-v2.${ext}`)).status(),200);
 console.log('PASS: native 1080p, persistent world, ground contact, voice envelope, prop phases, focal framing, deterministic seek, acting/walking, play/pause, no page errors, demo assets');
} finally {await browser.close()}
