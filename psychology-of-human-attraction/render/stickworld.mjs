// Export the deterministic Canvas world; no screen recording or real-time drops.
// LD_LIBRARY_PATH=/tmp/al2023/lib:/tmp CHROMIUM_PATH=/tmp/chromium node render/stickworld.mjs
import { chromium } from 'playwright';
import { spawn } from 'node:child_process';
import { once } from 'node:events';
import { mkdir } from 'node:fs/promises';
import ffmpeg from 'ffmpeg-static';
const preview=process.argv.includes('--preview');
const browser=await chromium.launch({executablePath:process.env.CHROMIUM_PATH||undefined,args:['--no-sandbox','--single-process','--no-zygote','--in-process-gpu']});
let encoder;
try {
const page=await browser.newPage({viewport:{width:720,height:1280},deviceScaleFactor:1});
await page.goto(process.env.STUDIO_URL||'http://127.0.0.1:3000/stickworld/index.html',{waitUntil:'networkidle'});
await page.waitForFunction(()=>window.renderSafe);
await page.evaluate(()=>document.fonts.ready);
await mkdir('renders',{recursive:true});
if(preview){for(const t of [2,6,11,16,20,26]){await page.evaluate(t=>window.setT(t),t);await page.locator('canvas').screenshot({path:`renders/stickworld-${t}.png`});}}
else {
encoder=spawn(ffmpeg,['-y','-loglevel','warning','-f','image2pipe','-vcodec','mjpeg','-r','30','-i','pipe:0','-i','vo/scarcity/voiceover.wav','-map','0:v','-map','1:a','-vf','scale=1080:1920:flags=lanczos','-c:v','libx264','-preset','fast','-crf','20','-pix_fmt','yuv420p','-c:a','aac','-b:a','160k','-t','30','-movflags','+faststart','public/demo/stickworld-scarcity-30s.mp4'],{stdio:['pipe','inherit','inherit']});
const done=new Promise((resolve,reject)=>{encoder.once('error',reject);encoder.once('exit',code=>code===0?resolve():reject(new Error(`ffmpeg exit ${code}`)))});
encoder.stdin.on('error',e=>console.error(e.message));
for(let f=0;f<900;f++){
 const jpg=await page.evaluate(t=>{window.setT(t);return document.querySelector('canvas').toDataURL('image/jpeg',.94).split(',')[1]},f/30);
 if(!encoder.stdin.write(Buffer.from(jpg,'base64')))await once(encoder.stdin,'drain');
 if(f%90===0)console.log(`${f}/900 frames`);
}
encoder.stdin.end();await done;console.log('Saved public/demo/stickworld-scarcity-30s.mp4');
}
} finally {await browser.close();if(encoder&&encoder.exitCode===null)encoder.kill();}
