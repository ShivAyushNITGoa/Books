import path from 'node:path';
import {readFile,mkdir,rename,rm} from 'node:fs/promises';
import {spawn} from 'node:child_process';
import {once} from 'node:events';
import {serve,ROOT,localFile} from './server.mjs';
import {validateProject,formatSrt} from '../engine/project.js';
import {validateStory} from '../story/engine/story.js';
import {ffmpegPath} from './media.mjs';
import {writeFile} from 'node:fs/promises';
export async function render(options={}){
 const locked=!!options.locked,projectFile=locked?null:await localFile(options.project||'examples/curiosity/project.json');
 const project=locked?{id:'approved-locked',duration:30,width:1080,height:1920,fps:30,media:{}}:(options.story ? value=>validateStory(value,{prepared:true}) : validateProject)(JSON.parse(await readFile(projectFile,'utf8')));
 const start=Number(options.start??0),end=Number(options.end??project.duration),fps=Number(options.fps??project.fps),width=Number(options.width??project.width),height=Number(options.height??project.height);
 if(![start,end,fps,width,height].every(Number.isFinite)||start<0||end<=start||end>project.duration||!Number.isInteger(fps)||fps<1||fps>60||![width,height].every(n=>Number.isInteger(n)&&n>=160&&n<=3840&&n%2===0)||Math.abs(width/height-project.width/project.height)>.01)throw new Error('Invalid render range, fps or dimensions');
 if(locked&&(width!==1080||height!==1920))throw new Error('The locked renderer is fixed at native 1080×1920; use the reusable engine for other sizes');
 if(options.crf!=null&&(!Number.isInteger(Number(options.crf))||Number(options.crf)<0||Number(options.crf)>51))throw new Error('CRF must be 0–51');
 const still=options.still!=null?Number(options.still):null;if(still!==null&&(!Number.isFinite(still)||still<0||still>project.duration))throw new Error('Invalid still time');
 const output=path.resolve(ROOT,options.out||`output/${project.id}.${still===null?'mp4':'png'}`);
 if(!output.startsWith(path.join(ROOT,'output')+path.sep))throw new Error('Outputs must be inside Animation/output; locked/ is read-only by policy');
 if(path.extname(output)!==(still===null?'.mp4':'.png'))throw new Error('Use .mp4 for video or .png for --still');
 const temporary=output+`.${process.pid}.part${still===null?'.mp4':'.png'}`;
 const snapshot=path.join(ROOT,'locked/source/public');
 const web=await serve({port:0,root:locked?snapshot:ROOT});let browser,encoder,done;
 try{
  const {chromium}=await import('playwright');
  const args=['--no-sandbox','--enable-unsafe-swiftshader'];
  if(process.env.CHROMIUM_PATH)args.push('--single-process','--no-zygote','--in-process-gpu','--use-gl=angle','--use-angle=swiftshader');
  browser=await chromium.launch({executablePath:process.env.CHROMIUM_PATH||undefined,args});
  const page=await browser.newPage({viewport:{width:720,height:1280}});
  let url=`http://127.0.0.1:${web.port}/`;
  if(locked)url+='classroom-v2/index.html';else url+=`${options.story?'story/engine':'engine'}/index.html?project=${encodeURIComponent('/'+path.relative(ROOT,projectFile).split(path.sep).join('/'))}&width=${width}&height=${height}`;
  await page.goto(url,{waitUntil:'networkidle'});await page.waitForFunction(()=>window.renderSafe||window.renderError,{},{timeout:60000});
  const error=await page.evaluate(()=>window.renderError);if(error)throw new Error(error);
  await mkdir(path.dirname(output),{recursive:true});
  if(still!==null){const data=await page.evaluate(t=>{window.setT(t);return document.querySelector('canvas').toDataURL('image/png').split(',')[1]},still);await writeFile(temporary,Buffer.from(data,'base64'))}
  else{
   let audio;
   if(locked)audio=path.join(ROOT,'locked/source/audio/approved-mix.wav');
   else if(project.media.renderAudio||project.media.audio)audio=await localFile(project.media.renderAudio||project.media.audio,path.dirname(projectFile));
   const ffargs=['-y','-hide_banner','-loglevel','warning','-f','image2pipe','-vcodec','mjpeg','-r',String(fps),'-i','pipe:0'];
   if(audio)ffargs.push('-ss',String(start),'-i',audio,'-map','0:v','-map','1:a','-c:a','aac','-b:a','160k');else ffargs.push('-an');
   ffargs.push('-vf','scale=in_range=pc:out_range=tv:out_color_matrix=bt709,format=yuv420p','-color_range','tv','-colorspace','bt709','-color_primaries','bt709','-color_trc','bt709','-c:v','libx264','-preset','fast','-crf',String(options.crf??23),'-t',String(end-start),'-movflags','+faststart',temporary);
   encoder=spawn(await ffmpegPath(),ffargs,{stdio:['pipe','ignore','pipe']});let failure,stderr='';
   encoder.stderr.on('data',b=>stderr=(stderr+b).slice(-12000));encoder.stdin.on('error',()=>{});
   done=new Promise((resolve,reject)=>{encoder.once('error',e=>{failure=e;reject(e)});encoder.once('exit',code=>{if(code!==0){failure=new Error(`ffmpeg exit ${code}: ${stderr}`);reject(failure)}else resolve()})});done.catch(()=>{});
   const frames=Math.ceil((end-start)*fps);
   for(let frame=0;frame<frames;frame++){
    if(failure)throw failure;
    const jpg=await page.evaluate(t=>{window.setT(t);return document.querySelector('canvas').toDataURL('image/jpeg',.95).split(',')[1]},start+frame/fps);
    if(!encoder.stdin.write(Buffer.from(jpg,'base64')))await Promise.race([once(encoder.stdin,'drain'),done.then(()=>{throw new Error('Encoder exited before all frames')})]);
    if(frame%Math.max(1,fps*3)===0)console.log(`${frame}/${frames} frames`);
   }
   encoder.stdin.end();await done;
   if(!locked){const cues=project.captions.filter(q=>q.end>start&&q.start<end).map(q=>({...q,start:Math.max(0,q.start-start),end:Math.min(end-start,q.end-start)}));await writeFile(output.replace(/\.mp4$/,'.srt'),formatSrt(cues))}
  }
  await rename(temporary,output);console.log(`Saved ${path.relative(ROOT,output)}`);return output;
 }finally{if(encoder&&encoder.exitCode===null)encoder.kill();await done?.catch(()=>{});await browser?.close();await web.close();await rm(temporary,{force:true})}
}
