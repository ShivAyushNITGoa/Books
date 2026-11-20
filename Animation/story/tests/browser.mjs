/** Optional real-browser integration. Run from Animation after prepare examples. */
import assert from 'node:assert/strict';
import {readFile,rm} from 'node:fs/promises';
import path from 'node:path';
import {createHash} from 'node:crypto';
import {chromium} from 'playwright';
import {serve,ROOT} from '../../tools/server.mjs';
import {prepareStory} from '../tools/prepare.mjs';
import {render} from '../../tools/render.mjs';
import {validateStory} from '../engine/story.js';
const hash=s=>createHash('sha256').update(s).digest('hex');
const web=await serve({port:0,root:ROOT});let browser;const created=[];
try{
 browser=await chromium.launch({executablePath:process.env.CHROMIUM_PATH||undefined,args:['--no-sandbox','--enable-unsafe-swiftshader',...(process.env.CHROMIUM_PATH?['--single-process','--no-zygote','--in-process-gpu','--use-gl=angle','--use-angle=swiftshader']:[])]});
 const page=await browser.newPage();
 for(const slug of ['railway','space-garden']){
  const out=`output/test-story-${slug}-${process.pid}`;created.push(path.join(ROOT,out));
  const file=await prepareStory({project:`story/examples/${slug}/story.json`,out});
  const story=validateStory(JSON.parse(await readFile(file)),{prepared:true});assert.ok((await readFile(path.join(ROOT,out,'mix.wav'))).length>48000);
  await page.goto(`http://127.0.0.1:${web.port}/story/engine/index.html?project=/${out}/project.json`,{waitUntil:'networkidle'});await page.waitForFunction(()=>window.renderSafe||window.renderError);assert.equal(await page.evaluate(()=>window.renderError),undefined);
  // Every authored scene is actually evaluated; direct seeking must be deterministic.
  for(const s of story.scenes){const t=(s.start+s.end)/2;const frame=await page.evaluate(t=>{window.setT(t);return document.querySelector('canvas').toDataURL()},t);assert.ok(frame.length>10000)}
  const frame=()=>page.evaluate(()=>{window.setT(2);return document.querySelector('canvas').toDataURL()});const a=await frame();await page.evaluate(()=>window.setT(9));assert.equal(hash(a),hash(await frame()));
  const tail=await page.evaluate(()=>{window.setT(3);return document.querySelector('canvas').toDataURL()});assert.notEqual(hash(a),hash(tail));
  const movie=`output/test-story-${slug}-${process.pid}.mp4`;created.push(path.join(ROOT,movie),path.join(ROOT,movie.replace('.mp4','.srt')));
  await render({story:true,project:path.relative(ROOT,file),out:movie,end:1,fps:5,width:slug==='railway'?180:320,height:slug==='railway'?320:180});assert.ok((await readFile(path.join(ROOT,movie))).length>5000);
  await assert.rejects(()=>prepareStory({project:`story/examples/${slug}/story.json`,out}),/ENOTEMPTY|EEXIST/);assert.equal(JSON.parse(await readFile(file)).id,story.id);
 }
 console.log('PASS: real English TTS, measured scene audio/captions, every scene, deterministic frames, portrait + landscape H264/AAC, existing-output protection');
}finally{await browser?.close();await web.close();for(const file of created)await rm(file,{recursive:true,force:true})}
