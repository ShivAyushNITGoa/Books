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
const {values:o}=parseArgs({options:Object.fromEntries(['out','width','fps','start','end','still','review','captions'].map(k=>[k,{type:'string'}]))});
const width=Number(o.width||1080),height=width*16/9,fps=Number(o.fps||30),start=Number(o.start||0),end=Number(o.end||60),still=o.still==null?null:Number(o.still);
if(!Number.isInteger(width)||width<180||width>2160||width%18!==0||!Number.isInteger(fps)||fps<1||fps>60||start<0||end>60||end<=start||still!==null&&(!Number.isFinite(still)||still<0||still>60))throw Error('Invalid output dimensions/timing; width must be divisible by 18 (e.g. 540, 720, 1080)');
const file=path.resolve(ROOT,o.out||`output/alexandria/${still===null?'alexandria-60s.mp4':'review.png'}`);if(!file.startsWith(path.join(ROOT,'output')+path.sep))throw Error('Render into Animation/output/');
const temporary=file+`.${process.pid}.part${still===null?'.mp4':'.png'}`,web=await serve({port:0});let browser,encoder,done;
try{
 const args=['--no-sandbox','--enable-unsafe-swiftshader'];if(process.env.CHROMIUM_PATH==='/tmp/chromium'||process.env.CHROMIUM_SINGLE_PROCESS==='1')args.push('--single-process','--no-zygote','--in-process-gpu','--use-gl=angle','--use-angle=swiftshader');
 browser=await chromium.launch({executablePath:process.env.CHROMIUM_PATH||undefined,args});const page=await browser.newPage();page.on('pageerror',e=>console.error('Browser:',e.message));
 await page.goto(`http://127.0.0.1:${web.port}/projects/alexandria/index.html?width=${width}&height=${height}&captions=${o.captions==='off'?'off':'on'}`,{waitUntil:'networkidle'});await page.waitForFunction(()=>window.renderSafe||window.renderError,{},{timeout:120000});const error=await page.evaluate(()=>window.renderError);if(error)throw Error(error);
 await mkdir(path.dirname(file),{recursive:true});
 const capture=async(t,kind='image/jpeg')=>page.evaluate(({t,kind})=>{window.setT(t);return {image:document.querySelector('#film').toDataURL(kind,.96).split(',')[1],info:window.frameInfo}},{t,kind});
 if(o.review){await mkdir(path.join(ROOT,o.review),{recursive:true});const report=[];for(let i=0;i<15;i++){const t=i*4+2,frame=await capture(t,'image/png');await writeFile(path.join(ROOT,o.review,`${String(i+1).padStart(2,'0')}-${frame.info.shot}.png`),Buffer.from(frame.image,'base64'));report.push({t,...frame.info});console.log(t,frame.info)}await writeFile(path.join(ROOT,o.review,'review.json'),JSON.stringify(report,null,2));}
 else if(still!==null){const frame=await capture(still,'image/png');await writeFile(temporary,Buffer.from(frame.image,'base64'));await rename(temporary,file);console.log(frame.info)}
 else {
  const frames=Math.ceil((end-start)*fps);encoder=spawn(await ffmpegPath(),['-y','-hide_banner','-loglevel','warning','-f','image2pipe','-vcodec','mjpeg','-r',String(fps),'-i','pipe:0','-an','-vf','scale=in_range=pc:out_range=tv:out_color_matrix=bt709,format=yuv420p','-color_range','tv','-colorspace','bt709','-color_primaries','bt709','-color_trc','bt709','-c:v','libx264','-preset','fast','-crf','18','-t',String(end-start),'-movflags','+faststart',temporary],{stdio:['pipe','ignore','pipe']});let errors='',failure;
  encoder.stderr.on('data',b=>errors=(errors+b).slice(-10000));encoder.stdin.on('error',()=>{});done=new Promise((resolve,reject)=>{encoder.once('error',reject);encoder.once('exit',code=>code===0?resolve():reject(Error(`FFmpeg ${code}: ${errors}`)))});done.catch(e=>{failure=e});
  const then=Date.now();for(let f=0;f<frames;f++){if(failure)throw failure;const frame=await capture(start+f/fps);if(!encoder.stdin.write(Buffer.from(frame.image,'base64')))await Promise.race([once(encoder.stdin,'drain'),done.then(()=>{throw Error('Encoder ended early')})]);if(f%Math.max(1,fps*2)===0)console.log(`${f}/${frames} | ${((Date.now()-then)/1000).toFixed(1)}s elapsed | ${frame.info.shot} | ${frame.info.drawCalls} calls`)}encoder.stdin.end();await done;await rename(temporary,file);
  const cues=parseSrt(await readFile(path.join(ROOT,'projects/alexandria/captions.srt'),'utf8')).filter(c=>c.end>start&&c.start<end).map(c=>({...c,start:Math.max(0,c.start-start),end:Math.min(end-start,c.end-start)}));await writeFile(file.replace(/\.mp4$/,'.srt'),formatSrt(cues));
 }
 console.log(o.review?'Saved review directory':'Saved',o.review||path.relative(ROOT,file));
}finally{if(encoder&&encoder.exitCode===null)encoder.kill();await done?.catch(()=>{});await browser?.close();await web.close();await rm(temporary,{force:true})}
