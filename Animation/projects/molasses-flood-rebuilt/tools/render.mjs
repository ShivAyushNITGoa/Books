#!/usr/bin/env node
import {parseArgs} from 'node:util';
import {readFile,writeFile,mkdir,rename,rm} from 'node:fs/promises';
import {spawn} from 'node:child_process';
import {once} from 'node:events';
import path from 'node:path';
import {chromium} from 'playwright';
import {serve,ROOT} from '../../../tools/server.mjs';
import {ffmpegPath} from '../../../tools/media.mjs';
import {parseSrt,formatSrt} from '../../../engine/project.js';
const {values:o}=parseArgs({options:Object.fromEntries(['out','width','fps','start','end','still','review','captions','aa'].map(k=>[k,{type:'string'}]))});
const timeline=JSON.parse(await readFile(path.join(ROOT,'projects/molasses-flood-rebuilt/narration.json'),'utf8'));
const width=Number(o.width||720),height=width*16/9,fps=Number(o.fps||24),start=Number(o.start||0),end=Number(o.end||timeline.duration),still=o.still==null?null:Number(o.still);
if(!Number.isInteger(width)||width<180||width>2160||width%18!==0||!Number.isInteger(fps)||fps<1||fps>60||start<0||end>timeline.duration||end<=start||still!==null&&(!Number.isFinite(still)||still<0||still>timeline.duration))throw Error('Invalid output dimensions/timing; width must be divisible by 18 (e.g. 540, 720, 1080)');
const file=path.resolve(ROOT,o.out||`output/molasses-flood-rebuilt/${still===null?'molasses-flood-clean-720p.mp4':'review.png'}`);if(!file.startsWith(path.join(ROOT,'output')+path.sep))throw Error('Render into Animation/output/');
const temporary=file+`.${process.pid}.part${still===null?'.mp4':'.png'}`,web=await serve({port:0,entry:'/projects/molasses-flood-rebuilt/index.html'});let browser,encoder,done;
try{
 const args=['--no-sandbox','--enable-unsafe-swiftshader'];if(process.env.CHROMIUM_PATH==='/tmp/chromium'||process.env.CHROMIUM_SINGLE_PROCESS==='1')args.push('--single-process','--no-zygote','--in-process-gpu','--use-gl=angle','--use-angle=swiftshader');
 browser=await chromium.launch({executablePath:process.env.CHROMIUM_PATH||undefined,args});const page=await browser.newPage();const browserErrors=[];page.on('pageerror',e=>browserErrors.push(e.message));page.on('console',m=>{if(m.type()==='error')browserErrors.push(m.text())});
 await page.goto(`http://127.0.0.1:${web.port}/projects/molasses-flood-rebuilt/index.html?width=${width}&height=${height}&captions=${o.captions==='off'?'off':'on'}&aa=${o.aa||'on'}`,{waitUntil:'networkidle'});await page.waitForFunction(()=>window.renderSafe||window.renderError,{},{timeout:120000});const error=await page.evaluate(()=>window.renderError);if(error)throw Error(error);if(browserErrors.length)throw Error(browserErrors.join('\n'));
 await mkdir(path.dirname(file),{recursive:true});
 const audit=await page.evaluate(()=>window.auditCamera());
 await mkdir(path.dirname(file),{recursive:true});
 await writeFile(file.replace(/\.(mp4|png)$/,'.audit.json'),JSON.stringify(audit,null,2));
 if(audit.issues.length||audit.settledBounds.length)throw Error('Camera audit failed: '+JSON.stringify(audit));

 const capture=async(t,kind='image/jpeg')=>page.evaluate(({t,kind})=>{window.setT(t);return {image:document.querySelector('#film').toDataURL(kind,.96).split(',')[1],info:window.frameInfo}},{t,kind});
 if(o.review){await mkdir(path.join(ROOT,o.review),{recursive:true});const report=[];for(const [i,t] of (await page.evaluate(()=>window.getShots().map(s=>Math.min(s.end-.06,s.start+Math.min(2,(s.end-s.start)*.7))))).entries()){const frame=await capture(t,'image/png');await writeFile(path.join(ROOT,o.review,`${String(i+1).padStart(2,'0')}-${frame.info.chapter}.png`),Buffer.from(frame.image,'base64'));report.push({t,...frame.info});console.log(t,frame.info)}await writeFile(path.join(ROOT,o.review,'review.json'),JSON.stringify(report,null,2));}
 else if(still!==null){const frame=await capture(still,'image/png');await writeFile(temporary,Buffer.from(frame.image,'base64'));await rename(temporary,file);console.log(frame.info)}
 else {
  const frames=Math.round((end-start)*fps),telemetry=[];encoder=spawn(await ffmpegPath(),['-y','-hide_banner','-loglevel','warning','-f','image2pipe','-vcodec','mjpeg','-r',String(fps),'-i','pipe:0','-an','-vf','scale=in_range=pc:out_range=tv:out_color_matrix=bt709,format=yuv420p','-color_range','tv','-colorspace','bt709','-color_primaries','bt709','-color_trc','bt709','-c:v','libx264','-preset','fast','-crf','18','-t',String(end-start),'-movflags','+faststart',temporary],{stdio:['pipe','ignore','pipe']});let errors='',failure;
  encoder.stderr.on('data',b=>errors=(errors+b).slice(-10000));encoder.stdin.on('error',()=>{});done=new Promise((resolve,reject)=>{encoder.once('error',reject);encoder.once('exit',code=>code===0?resolve():reject(Error(`FFmpeg ${code}: ${errors}`)))});done.catch(e=>{failure=e});
  const then=Date.now();for(let f=0;f<frames;f++){if(failure)throw failure;const frame=await capture(start+f/fps);telemetry.push(frame.info);if(!encoder.stdin.write(Buffer.from(frame.image,'base64')))await Promise.race([once(encoder.stdin,'drain'),done.then(()=>{throw Error('Encoder ended early')})]);if(f%Math.max(1,fps*2)===0)console.log(`${f}/${frames} | ${((Date.now()-then)/1000).toFixed(1)}s elapsed | ${frame.info.chapter} | ${frame.info.drawCalls} calls`)}encoder.stdin.end();await done;await rename(temporary,file);await writeFile(file.replace(/\.mp4$/,'.camera.json'),JSON.stringify(telemetry));
  const cues=parseSrt(await readFile(path.join(ROOT,'projects/molasses-flood-rebuilt/delivery/captions.srt'),'utf8')).filter(c=>c.end>start&&c.start<end).map(c=>({...c,start:Math.max(0,c.start-start),end:Math.min(end-start,c.end-start)}));await writeFile(file.replace(/\.mp4$/,'.srt'),formatSrt(cues));
 }
 console.log(o.review?'Saved review directory':'Saved',o.review||path.relative(ROOT,file));
}finally{if(encoder&&encoder.exitCode===null)encoder.kill();await done?.catch(()=>{});await browser?.close();await web.close();await rm(temporary,{force:true})}
