#!/usr/bin/env node
/** Validate completed full-length files, then intentionally publish only selected
 * delivery artifacts. Never treat a render smoke test or partial file as final. */
import {spawn} from 'node:child_process';
import {readFile,writeFile,rename,mkdir} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {execFileSync} from 'node:child_process';
import path from 'node:path';
import {ROOT} from '../../../tools/server.mjs';
import {ffmpegPath,runFF} from '../../../tools/media.mjs';
import {parseSrt} from '../../../engine/project.js';
const sha=b=>createHash('sha256').update(b).digest('hex');
const project=path.join(ROOT,'projects/alexandria'),rendered=path.join(ROOT,'output/alexandria'),delivery=path.join(project,'delivery');
async function inspect(file){
 const bin=await ffmpegPath();
 const result=await new Promise((resolve,reject)=>{
  const p=spawn(bin,['-hide_banner','-i',file,'-map','0:v:0','-an','-vf','blackdetect=d=0.04:pix_th=0.025:pic_th=0.98','-progress','pipe:1','-nostats','-f','null','-'],{stdio:['ignore','pipe','pipe']});let output='',error='';p.stdout.on('data',b=>output+=b);p.stderr.on('data',b=>error+=b);p.on('error',reject);p.on('exit',code=>code===0?resolve({output,error}):reject(Error(error)));
 });
 const frames=Number([...result.output.matchAll(/^frame=(\d+)/gm)].at(-1)?.[1]),duration=result.error.match(/Duration: ([\d:.]+)/)?.[1];
 if(frames!==1440||duration!=='00:01:00.00'||!result.error.includes('720x1280')||!result.error.includes('24 fps')||!result.error.includes('yuv420p'))throw Error(`Not a complete native 60s / 1440-frame master: ${file}\n${result.error}`);
 if(/Audio:/.test(result.error))throw Error('Expected a silent VO-ready picture master');if(/black_start:/.test(result.error))throw Error('Unexpected near-black interval; inspect before publishing');
 const bytes=await readFile(file);return {file:path.basename(file),width:720,height:1280,fps:24,frames,durationSeconds:60,codec:'H.264',pixelFormat:'yuv420p',audioTracks:0,fullFileDecode:'passed',nearBlackIntervals:0,bytes:bytes.length,sha256:sha(bytes)};
}
const files=['alexandria-clean-720p.mp4','alexandria-captioned-720p.mp4'],exports=[];for(const file of files)exports.push(await inspect(path.join(rendered,file)));
const srt=await readFile(path.join(project,'captions.srt')),cues=parseSrt(srt.toString());if(cues.length!==15||cues[0].start!==0||cues.at(-1).end!==60)throw Error('Caption timeline mismatch');
await mkdir(delivery,{recursive:true});for(const file of files)await rename(path.join(rendered,file),path.join(delivery,file));await writeFile(path.join(delivery,'captions.srt'),srt);
await runFF(['-y','-ss','6','-i',path.join(delivery,files[0]),'-frames:v','1',path.join(delivery,'poster.jpg')]);
await runFF(['-y','-i',path.join(delivery,files[1]),'-vf',"select='eq(mod(n,96),48)',scale=270:480,tile=5x3",'-frames:v','1',path.join(rendered,'final-contact-sheet.jpg')]);
const sourceHashes={};for(const file of ['film.js','timeline.js','set.js','art.js','batch.js','captions.srt','assets/carved-relief.jpg','assets/rose-granite.jpg','assets/Caption-Heavy.ttf','assets/caption-metrics.json','tools/render.mjs','tools/burn-captions.mjs','index.html'])sourceHashes[file]=sha(await readFile(path.join(project,file)));
const report={title:'Alexandria — Beneath the Mediterranean',generatedUTC:new Date().toISOString(),sourceCommit:execFileSync('git',['rev-parse','HEAD'],{cwd:ROOT,encoding:'utf8'}).trim(),delivery:'Complete native 720×1280 at 24 fps, 60 seconds; not a low-resolution animatic upscaled for delivery',voice:'None. User will supply/add VO. No synthetic replacement, music or audio track.',captions:'Exact user-supplied 15 four-second cues; no estimated retiming',picture:'Dedicated animated 3D harbour/ruin sets with illustrative cutout characters; no reference scene footage or soundtrack',history:'Artistic reconstruction; compressed chronology, not a surveyed archaeological model',exports,captionSha256:sha(srt),sourceHashes,reviewContactSheet:'Animation/output/alexandria/final-contact-sheet.jpg'};
await writeFile(path.join(delivery,'production.json'),JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify(report.exports,null,2));console.log('Published selected exports to projects/alexandria/delivery/ after complete-file validation.');
