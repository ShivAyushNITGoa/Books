// Browser smoke/regression test. Run with the same Chromium env as the exporter.
import { chromium } from 'playwright';
import assert from 'node:assert/strict';
const browser=await chromium.launch({executablePath:process.env.CHROMIUM_PATH||undefined,args:['--no-sandbox','--single-process','--no-zygote','--in-process-gpu','--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader']});
try {
 const page=await browser.newPage({viewport:{width:450,height:900}});
 const errors=[];page.on('pageerror',e=>errors.push(e.message));
 const root=process.env.TEST_ROOT||'http://127.0.0.1:3000';
 await page.goto(`${root}/classroom/index.html`,{waitUntil:'networkidle'});
 await page.waitForFunction(()=>window.renderSafe);
 const frame=t=>page.evaluate(t=>{window.setT(t);return document.querySelector('canvas').toDataURL()},t);
 const a=await frame(12.1);await frame(26);assert.equal(await frame(12.1),a,'random-access rendering must be deterministic');
 assert.notEqual(await frame(4.7),await frame(4.9),'acting must move within the phone shot');
 assert.notEqual(await frame(22.5),await frame(23.5),'walking must change the rendered frame');
 await page.locator('#seek').evaluate(el=>{el.value='2';el.dispatchEvent(new Event('input',{bubbles:true}))});
 assert.equal(await page.evaluate(()=>window.currentTime),2);
 await page.locator('#play').click();await page.waitForTimeout(1200);assert.ok(await page.evaluate(()=>window.currentTime>2.1));
 await page.locator('#play').click();const stopped=await page.evaluate(()=>window.currentTime);await page.waitForTimeout(300);assert.equal(await page.evaluate(()=>window.currentTime),stopped);
 assert.deepEqual(errors,[],'no browser exceptions');
 await page.goto(root);await page.locator('#demo-videos').waitFor();
 assert.ok((await page.locator('#demo-videos').textContent()).includes('Reference-style Classroom'));
 assert.equal(await page.locator('video[src="/demo/classroom-scarcity-30s.mp4"]').count(),1);
 assert.equal((await page.request.get(`${root}/demo/classroom-scarcity-30s.srt`)).status(),200);
 assert.equal((await page.request.get(`${root}/demo/classroom-scarcity-30s.jpg`)).status(),200);
 console.log('PASS: deterministic frames, within-shot acting, walking, seek, play/pause, no browser errors, studio demo registration, poster and subtitles');
} finally {await browser.close()}
