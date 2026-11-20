import {serve} from './server.mjs';
import chromium from '@sparticuz/chromium';
import {chromium as playwright} from 'playwright-core';
import {spawn,execFileSync} from 'node:child_process';
import {once} from 'node:events';
import path from 'node:path';
import fs from 'node:fs';
import zlib from 'node:zlib';
import os from 'node:os';
// Chromium's packaged Linux libraries also support non-Lambda render hosts.
const libRoot=path.join(os.tmpdir(),'tv12-chromium-libs');
fs.mkdirSync(libRoot,{recursive:true});
const archive=path.join(libRoot,'libs.tar');
fs.writeFileSync(archive,zlib.brotliDecompressSync(fs.readFileSync(new URL('./node_modules/@sparticuz/chromium/bin/al2023.tar.br',import.meta.url))));
execFileSync('tar',['xf',archive,'-C',libRoot]);
process.env.LD_LIBRARY_PATH=path.join(libRoot,'lib')+':'+(process.env.LD_LIBRARY_PATH||'');
const from=Number(process.env.RENDER_FROM||0),to=Number(process.env.RENDER_TO||30);
const full=process.env.RENDER_FULL==='1';
const duration=to-from,frames=Math.round(duration*24);
const output=process.env.RENDER_OUTPUT||'output/tv12_demo_v4_camera_styles.mp4';
const server=await serve(3001);
let browser,ff;
try{
 browser=await playwright.launch({executablePath:await chromium.executablePath(),args:[...chromium.args,'--enable-unsafe-swiftshader'],headless:true});
 const page=await browser.newPage({viewport:{width:1280,height:720},deviceScaleFactor:1});
 const errors=[];page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error')errors.push(m.text());});
 await page.goto('http://127.0.0.1:3001/'+(full?`?full=1&from=${from}&to=${to}`:''));await page.waitForFunction(()=>window.ready,{timeout:60000});
 await page.locator('button').evaluate(el=>el.remove());
 const root=path.resolve('../..');
 const bin=execFileSync('python3',['-c','import imageio_ffmpeg;print(imageio_ffmpeg.get_ffmpeg_exe())'],{encoding:'utf8'}).trim();
 ff=spawn(bin,['-y','-hide_banner','-loglevel','warning','-f','image2pipe','-vcodec','mjpeg','-framerate','24','-i','pipe:0','-ss',String(from),'-i',path.join(root,'video 12 full audio.mp3'),'-map','0:v','-map','1:a','-t',String(duration),'-vf','scale=in_range=full:out_range=tv,format=yuv420p','-c:v','libx264','-preset','medium','-crf',full?'24':'20','-color_range','tv','-c:a','aac','-b:a','160k','-ar','48000','-movflags','+faststart',path.join(root,output)],{stdio:['pipe','inherit','inherit']});
 const exited=once(ff,'exit');
 for(let n=0;n<frames;n++){
  await page.evaluate(t=>window.renderAt(t),from+n/24);
  const frame=await page.screenshot({type:'jpeg',quality:95});
  if(!ff.stdin.write(frame))await once(ff.stdin,'drain');
  if(n%120===0)console.log(`${n}/${frames} frames (${from}s–${to}s)`);
  if(errors.length)throw new Error(errors.join('\n'));
 }
 ff.stdin.end();const [code]=await exited;if(code!==0)throw new Error('FFmpeg exit '+code);
 console.log('DONE: '+output);
}finally{if(ff&&!ff.stdin.destroyed)ff.stdin.end();if(browser)await browser.close();server.close();}
