import {chromium} from 'playwright';
import {serve,ROOT} from '../../tools/server.mjs';
import {ffmpegPath} from '../../tools/media.mjs';
import {mkdir,writeFile,rename,rm} from 'node:fs/promises';
import {spawn} from 'node:child_process';
import {once} from 'node:events';
import path from 'node:path';
import assert from 'node:assert/strict';
const project=path.join(ROOT,'projects/character-style-test'),output=path.join(ROOT,'output/character-style-test');
await mkdir(output,{recursive:true});await mkdir(path.join(project,'delivery'),{recursive:true});
const web=await serve({port:0});let browser,encoder,done;
const file=path.join(project,'delivery/character-style-5s-720p.mp4'),temp=path.join(output,'render.part.mp4');
try{
 const args=['--no-sandbox','--enable-unsafe-swiftshader'];
 if(process.env.CHROMIUM_PATH==='/tmp/chromium')args.push('--single-process','--no-zygote','--in-process-gpu','--use-gl=angle','--use-angle=swiftshader');
 browser=await chromium.launch({executablePath:process.env.CHROMIUM_PATH||undefined,args});
 const page=await browser.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));
 page.on('console',m=>{if(m.type()==='error')errors.push(m.text())});
 await page.goto(`http://127.0.0.1:${web.port}/projects/character-style-test/index.html?export=1`,{waitUntil:'networkidle'});
 await page.waitForFunction(()=>window.renderSafe,{},{timeout:60000});
 const grab=async t=>page.evaluate(t=>{window.setT(t);return {data:document.querySelector('canvas').toDataURL('image/png').split(',')[1],info:window.frameInfo}},t);
 for(const t of [0,.75,1.6,2.8,4.7]){const f=await grab(t);await writeFile(path.join(output,`review-${t}.png`),Buffer.from(f.data,'base64'));}
 if(process.argv.includes('--stills')){assert.deepEqual(errors,[]);console.log('Review stills saved');}
 else{
 encoder=spawn(await ffmpegPath(),['-y','-hide_banner','-loglevel','warning','-f','image2pipe','-vcodec','png','-framerate','30','-i','pipe:0','-an','-frames:v','150','-vf','scale=in_range=pc:out_range=tv:out_color_matrix=bt709,format=yuv420p','-c:v','libx264','-preset','slow','-crf','18','-color_range','tv','-colorspace','bt709','-color_primaries','bt709','-color_trc','bt709','-movflags','+faststart',temp],{stdio:['pipe','ignore','pipe']});
 let stderr='',failure;encoder.stderr.on('data',b=>stderr=(stderr+b).slice(-10000));encoder.stdin.on('error',()=>{});
 done=new Promise((resolve,reject)=>{encoder.once('error',reject);encoder.once('exit',code=>code===0?resolve():reject(Error(stderr)))});done.catch(e=>{failure=e});
 const trace=[];
 for(let i=0;i<150;i++){
  if(failure)throw failure;const f=await grab(i/30);trace.push(f.info);
  assert.equal(f.info.humanBillboardMeshes,0);assert.ok(f.info.independentParts);
  assert.ok(f.info.features.feet.every(([x,y])=>x>140&&x<400&&y>=1062&&y<=1084.001));
  if(!encoder.stdin.write(Buffer.from(f.data,'base64')))await Promise.race([once(encoder.stdin,'drain'),done.then(()=>{throw Error('Encoder ended early')})]);
  if(i%30===0)console.log(`${i}/150 frames`);
 }
 encoder.stdin.end();await done;assert.deepEqual(errors,[]);await rename(temp,file);
 // Seeking out of order must reproduce exactly the same illustration.
 const a=await grab(2.8);await grab(.2);const b=await grab(2.8);assert.equal(a.data,b.data);
 await writeFile(path.join(output,'frame-audit.json'),JSON.stringify({frames:150,fps:30,duration:5,errors,deterministicSeeking:true,trace},null,2));
 await writeFile(path.join(project,'delivery/poster.png'),Buffer.from(a.data,'base64'));
 console.log('Saved',file);
 }
}finally{if(encoder&&encoder.exitCode===null)encoder.kill();await done?.catch(()=>{});await browser?.close();await web.close();await rm(temp,{force:true})}
