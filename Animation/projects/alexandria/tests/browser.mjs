import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {chromium} from 'playwright';
import {serve} from '../../../tools/server.mjs';
const web=await serve({port:0}),errors=[];let browser;
try{
 const args=['--no-sandbox','--enable-unsafe-swiftshader'];if(process.env.CHROMIUM_PATH==='/tmp/chromium'||process.env.CHROMIUM_SINGLE_PROCESS==='1')args.push('--single-process','--no-zygote','--in-process-gpu','--use-gl=angle','--use-angle=swiftshader');
 browser=await chromium.launch({executablePath:process.env.CHROMIUM_PATH||undefined,args});const page=await browser.newPage();page.on('pageerror',e=>errors.push(e.message));
 await page.goto(`http://127.0.0.1:${web.port}/projects/alexandria/index.html?width=360&height=640`,{waitUntil:'networkidle'});await page.waitForFunction(()=>window.renderSafe||window.renderError,{},{timeout:120000});assert.equal(await page.evaluate(()=>window.renderError),undefined);
 const shots=[];for(let i=0;i<15;i++){
  const result=await page.evaluate(t=>{window.setT(t);const canvas=document.querySelector('#film'),c=canvas.getContext('2d'),data=c.getImageData(0,0,canvas.width,canvas.height).data,colors=new Set();for(let n=0;n<data.length;n+=4*201)colors.add(`${data[n]},${data[n+1]},${data[n+2]}`);return {...window.frameInfo,colors:colors.size}},i*4+2);
  assert.equal(result.index,i);assert.ok(result.colors>60,`${result.shot} must contain a rendered set, not a blank frame`);assert.ok(result.triangles>20000);shots.push(result.shot);
 }
 const capture=t=>page.evaluate(t=>{window.setT(t);return document.querySelector('#film').toDataURL()},t),hash=s=>createHash('sha256').update(s).digest('hex');
 const first=await capture(42),a=hash(first);await page.evaluate(()=>window._reference=document.querySelector('#film').getContext('2d').getImageData(0,0,360,640).data);
 assert.notEqual(a,hash(await capture(43)),'diver/fish/torch/camera action must change the picture');await capture(10);await capture(42);
 const repeat=await page.evaluate(()=>{const b=document.querySelector('#film').getContext('2d').getImageData(0,0,360,640).data;let sum=0,max=0;for(let n=0;n<b.length;n+=4)for(let c=0;c<3;c++){const delta=Math.abs(b[n+c]-window._reference[n+c]);sum+=delta;max=Math.max(max,delta)}return {max,mean:sum/(360*640*3)}});
 // Shader/light-program switches can round translucent sky pixels by one 8-bit
 // level. Require that narrow rasterization tolerance, not a loose visual hash.
 assert.ok(repeat.max<=1&&repeat.mean<.1,`Reviewed frame changed beyond one-LSB raster tolerance: ${JSON.stringify(repeat)}`);

 await page.evaluate(()=>window.setCaptions(false));assert.notEqual(a,hash(await capture(42)),'clean-master toggle must remove captions');assert.equal(errors.length,0,errors.join('\n'));
 console.log('PASS: Alexandria real WebGL, both local generated material assets, 15 scene midpoints, nonblank dimensional sets, changing performance/camera, repeatable reviewed frame, clean/CC output.');console.log(shots.join(' → '));
}finally{await browser?.close();await web.close()}
