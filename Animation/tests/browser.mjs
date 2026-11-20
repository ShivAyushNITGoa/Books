// Optional integration test: requires npm ci, Chromium and ffmpeg.
import {chromium} from 'playwright';
import assert from 'node:assert/strict';
import {serve,ROOT} from '../tools/server.mjs';
import {readFile,writeFile,mkdir,rm} from 'node:fs/promises';
import path from 'node:path';
import {randomUUID} from 'node:crypto';
import {execFileSync} from 'node:child_process';
import {wav} from '../tools/media.mjs';
import {verifyLock} from '../tools/verify-lock.mjs';
const id=`selftest-${randomUUID()}`,out=path.join(ROOT,'output',id),dir=path.join(ROOT,'projects',id);
await mkdir(out,{recursive:true});
let browser,web,frozen;
const cli=(...args)=>execFileSync(process.execPath,['tools/cli.mjs',...args],{cwd:ROOT,env:process.env,encoding:'utf8',stdio:['ignore','pipe','pipe'],timeout:120000});
try{
 const samples=new Float32Array(48000*3);for(let i=4800;i<48000*2.5;i++)samples[i]=Math.sin(i*.04)*.2;
 await writeFile(path.join(out,'voice.wav'),wav(samples));await writeFile(path.join(out,'script.txt'),'[primary] A small question.\n[secondary] A fresh idea.');
 await writeFile(path.join(out,'timed.srt'),'1\n00:00:00,100 --> 00:00:01,400\nA small question.\n\n2\n00:00:01,500 --> 00:00:02,800\nA fresh idea.\n');
 console.log(cli('init','--name',id,'--script',path.join(out,'script.txt'),'--audio',path.join(out,'voice.wav'),'--srt',path.join(out,'timed.srt')));
 console.log(cli('validate','--project',`projects/${id}/project.json`));
 const p=JSON.parse(await readFile(path.join(dir,'project.json'),'utf8'));assert.equal(p.duration,3);assert.equal(p.timing,'imported-srt');
 web=await serve({port:0});
 const flags=['--no-sandbox','--enable-unsafe-swiftshader'];if(process.env.CHROMIUM_PATH)flags.push('--single-process','--no-zygote','--in-process-gpu','--use-gl=angle','--use-angle=swiftshader');
 browser=await chromium.launch({executablePath:process.env.CHROMIUM_PATH||undefined,args:flags});
 const page=await browser.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));
 const visit=async(project,width,height)=>{await page.goto(`http://127.0.0.1:${web.port}/engine/index.html?project=${encodeURIComponent('/'+project)}&width=${width}&height=${height}`,{waitUntil:'networkidle'});await page.waitForFunction(()=>window.renderSafe||window.renderError);const error=await page.evaluate(()=>window.renderError);assert.ok(!error,error)};
 await visit('examples/curiosity/project.json',360,640);assert.equal(await page.evaluate(()=>window.duration),20);assert.equal(await page.evaluate(()=>window.project.props.cookieJars),false);
 const frame=t=>page.evaluate(t=>{window.setT(t);return document.querySelector('canvas').toDataURL()},t);
 const a=await frame(4);await frame(17);assert.equal(await frame(4),a);assert.notEqual(await frame(4),await frame(5));
 await visit('examples/conversation/project.json',640,360);assert.deepEqual(await page.locator('canvas').evaluate(c=>[c.width,c.height]),[640,360]);assert.equal(await page.evaluate(()=>window.duration),16);
 await visit(`projects/${id}/project.json`,180,320);assert.equal(await page.evaluate(()=>window.duration),3);await page.evaluate(()=>window.setT(.5));assert.ok((await page.evaluate(()=>window.frameDiagnostics)).speakers.includes('primary'));
 await page.locator('#play').click();await page.waitForTimeout(400);await page.locator('#play').click();assert.ok(await page.evaluate(()=>window.currentTime>.5));
 assert.deepEqual(errors,[]);await browser.close();browser=null;await web.close();web=null;
 frozen=await serve({port:0,root:path.join(ROOT,'locked/source/public')});browser=await chromium.launch({executablePath:process.env.CHROMIUM_PATH||undefined,args:flags});const original=await browser.newPage();await original.goto(`http://127.0.0.1:${frozen.port}/classroom-v2/index.html`,{waitUntil:'networkidle'});await original.waitForFunction(()=>window.renderSafe);assert.equal(await original.evaluate(()=>window.duration),30);await browser.close();browser=null;await frozen.close();frozen=null;
 console.log(cli('render','--project',`projects/${id}/project.json`,'--start','0','--end','1','--fps','5','--width','180','--height','320','--out',`output/${id}/smoke.mp4`));
 const video=await readFile(path.join(out,'smoke.mp4'));assert.ok(video.length>1000);assert.ok((await readFile(path.join(out,'smoke.srt'),'utf8')).includes('00:00:01,000'));
 assert.throws(()=>cli('render','--project',`projects/${id}/project.json`,'--out','locked/forbidden.mp4'));
 // Duration mismatch is transactional: do not destroy a project's existing audio.
 const oldMix=await readFile(path.join(dir,'media/mix.wav'));
 await writeFile(path.join(out,'short.wav'),wav(samples.subarray(0,48000*2)));
 assert.throws(()=>cli('prepare','--project',`projects/${id}/project.json`,'--audio',path.join(out,'short.wav')));
 assert.deepEqual(await readFile(path.join(dir,'media/mix.wav')),oldMix);
 console.log(cli('prepare','--project',`projects/${id}/project.json`,'--audio',path.join(out,'short.wav'),'--retime'));
 const changed=JSON.parse(await readFile(path.join(dir,'project.json'),'utf8'));assert.equal(changed.duration,2);assert.equal(changed.timing,'retimed-review-required');
 await verifyLock({strictOriginals:process.env.STRICT_ORIGINALS==='1'});
 console.log('PASS: arbitrary script + WAV + SRT import, 3/16/20s durations, two speakers, both aspect ratios, deterministic frames, playback, frozen preview, encoded MP4/audio/SRT clip, transactional audio preparation/retiming and output lock guard');
}finally{await browser?.close();await web?.close();await frozen?.close();await rm(dir,{recursive:true,force:true});await rm(out,{recursive:true,force:true})}
