#!/usr/bin/env node
import {chromium} from 'playwright';
import {serve,ROOT} from '../../../tools/server.mjs';
import {writeFile,mkdir} from 'node:fs/promises';
import path from 'node:path';
const web=await serve({port:0});let browser;
try{
 browser=await chromium.launch({executablePath:process.env.CHROMIUM_PATH||undefined,args:['--no-sandbox','--enable-unsafe-swiftshader',...(process.env.CHROMIUM_PATH==='/tmp/chromium'?['--single-process','--no-zygote','--in-process-gpu','--use-gl=angle','--use-angle=swiftshader']:[])]});
 const page=await browser.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));page.on('response',r=>{if(r.status()>=400)errors.push(`${r.status()} ${r.url()}`)});
 await page.goto(`http://127.0.0.1:${web.port}/projects/molasses-flood/index.html`,{waitUntil:'networkidle'});await page.waitForFunction(()=>window.renderSafe||window.renderError);const loadError=await page.evaluate(()=>window.renderError);if(loadError)throw Error(loadError);
 const result=await page.evaluate(async()=>{const T=await import('/engine/vendor/three.module.js'),rows=[],issues=[],camera=new T.PerspectiveCamera(43,720/1280,.1,240);let last;
 for(const shot of window.getShots()){
  for(const t of [...new Set([shot.start+.001,Math.min(shot.end-.001,shot.start+1.15),(shot.start+shot.end)/2,shot.end-.002])]){
   window.setT(t);let f=structuredClone(window.frameInfo);camera.position.fromArray(f.camera);camera.lookAt(...f.target);camera.updateMatrixWorld();let objects=0,nonfinite=0;window.filmScene.traverse(o=>{if(!o.matrixWorld.elements.every(Number.isFinite))nonfinite++;if(o.isMesh)objects++});if(nonfinite)issues.push({shot:shot.id,t,nonfinite});rows.push({t,shot:shot.id,objects,drawCalls:f.drawCalls,nonfinite});
  }
 }
 // Seeking backward must restore pixels within <=2/255 channel rounding and MAE <.001.
 // SwiftShader can change a handful of least-significant channel bits across draw batches.
 const samples=[0,23.2,40,65,74,90,98,118,139,162,188,219],checks=[];
 for(const t of samples){window.setT(t);const a=document.querySelector('#film').getContext('2d').getImageData(0,0,720,1280).data;window.setT(210);window.setT(0);window.setT(t);const b=document.querySelector('#film').getContext('2d').getImageData(0,0,720,1280).data;let max=0,sum=0,changed=0;for(let i=0;i<a.length;i++){const d=Math.abs(a[i]-b[i]);max=Math.max(max,d);sum+=d;if(d)changed++}const mae=sum/a.length,pass=max<=2&&mae<.001;checks.push({t,pass,maxChannelDifference:max,meanAbsoluteDifference:mae,changedChannels:changed});if(!pass)issues.push({t,problem:'seek differs beyond software-raster rounding tolerance',max,mae})}
 const audio=document.querySelector('#vo');await new Promise((resolve,reject)=>{if(Number.isFinite(audio.duration))return resolve();audio.addEventListener('loadedmetadata',resolve,{once:true});audio.addEventListener('error',()=>reject(Error('Voice audio failed')),{once:true});audio.load()});
 return {samples:rows,seekChecks:checks,audioDuration:audio.duration,renderSize:[document.querySelector('#film').width,document.querySelector('#film').height],issues};});
 result.errors=errors;await mkdir(path.join(ROOT,'output/molasses-flood'),{recursive:true});await writeFile(path.join(ROOT,'output/molasses-flood/browser-check.json'),JSON.stringify(result,null,2)+'\n');console.log(JSON.stringify({frameSamples:result.samples.length,seekChecks:result.seekChecks,issues:result.issues,errors,audioDuration:result.audioDuration,renderSize:result.renderSize},null,2));if(errors.length||result.issues.length)process.exitCode=1;
}finally{await browser?.close();await web.close()}
