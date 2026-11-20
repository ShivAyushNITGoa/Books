#!/usr/bin/env node
/** Fast subtitle pass on the completed clean master. Does not rerender the set. */
import {parseArgs} from 'node:util';
import {mkdtemp,writeFile,readFile,rm,mkdir,rename} from 'node:fs/promises';
import path from 'node:path';
import {ROOT,localFile} from '../../../tools/server.mjs';
import {runFF} from '../../../tools/media.mjs';
import {parseSrt} from '../../../engine/project.js';
const {values:o}=parseArgs({options:{video:{type:'string'},out:{type:'string'},width:{type:'string',default:'720'},height:{type:'string',default:'1280'}}});
const video=await localFile(o.video||'output/alexandria/alexandria-clean-720p.mp4'),output=path.resolve(ROOT,o.out||'output/alexandria/alexandria-captioned-720p.mp4');
if(!output.startsWith(path.join(ROOT,'output')+path.sep)||!output.endsWith('.mp4'))throw Error('Output must be an MP4 inside Animation/output/');if(output===video)throw Error('Do not overwrite the clean picture master');
const width=Number(o.width),height=Number(o.height);if(width!==720||height!==1280)throw Error('This caption pass is composed for the native 720×1280 master');
await mkdir(path.dirname(output),{recursive:true});const stage=await mkdtemp(path.join(path.dirname(output),'.caption-')),part=output+'.part.mp4';
const escape=s=>s.replaceAll('\\','\\\\').replaceAll(':','\\:').replaceAll("'","'\\''");
try{
 const cues=parseSrt(await readFile(path.join(ROOT,'projects/alexandria/captions.srt'),'utf8')),filters=[],font=escape(path.join(ROOT,'projects/alexandria/assets/Caption-Heavy.ttf'));
 for(let i=0;i<cues.length;i++)for(const [j,line] of cues[i].text.split('\n').entries()){
  const file=path.join(stage,`${i}-${j}.txt`);await writeFile(file,line);filters.push(`drawtext=fontfile='${font}':textfile='${escape(file)}':fontsize=32:fontcolor=0xfff8e8:borderw=3.05:bordercolor=0x102631:shadowx=0:shadowy=2:shadowcolor=0x06182080:x=(w-text_w)/2:y=h*0.81-text_h/2+${j*40.96}:enable='gte(t,${cues[i].start})*lt(t,${cues[i].end})'`);
 }
 const filterFile=path.join(stage,'captions.filter');await writeFile(filterFile,filters.join(','));
 await runFF(['-y','-i',video,'-vf',filters.join(','),'-an','-c:v','libx264','-preset','fast','-crf','18','-pix_fmt','yuv420p','-color_range','tv','-colorspace','bt709','-color_primaries','bt709','-color_trc','bt709','-t','60','-movflags','+faststart',part]);await rename(part,output);console.log('Saved',path.relative(ROOT,output));
}finally{await rm(stage,{recursive:true,force:true});await rm(part,{force:true})}
