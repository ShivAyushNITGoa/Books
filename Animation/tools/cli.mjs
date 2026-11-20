#!/usr/bin/env node
import path from 'node:path';
import {readFile,writeFile,mkdir,rm,mkdtemp,readdir,rename} from 'node:fs/promises';
import {ROOT,localFile,serve} from './server.mjs';
import {buildProject} from './project-builder.mjs';
import {validateProject,parseSrt,formatSrt} from '../engine/project.js';
import {prepareAudio} from './media.mjs';
const [command,...args]=process.argv.slice(2),o={};
let cleanupDir;
try{
for(let i=0;i<args.length;i++){if(!args[i].startsWith('--'))throw new Error(`Expected --option, received ${args[i]}`);const k=args[i].slice(2);o[k]=args[i+1]&&!args[i+1].startsWith('--')?args[++i]:true}
for(const [k,v] of Object.entries(o))if(v===true&&!['locked','retime'].includes(k))throw new Error(`Missing value for --${k}`);
const json=async f=>JSON.parse(await readFile(f,'utf8'));
const store=async(f,p)=>writeFile(f,JSON.stringify(p,null,2)+'\n');
 if(command==='init'){
  const id=o.name;if(typeof id!=='string'||!/^[a-z0-9][a-z0-9-]{0,63}$/.test(id))throw new Error('Use --name lowercase-slug');
  if(typeof o.script!=='string')throw new Error('Use --script path/to/script.txt');
  const text=await readFile(path.resolve(o.script),'utf8'),dir=path.join(ROOT,'projects',id);
  await mkdir(path.join(ROOT,'projects'),{recursive:true});await mkdir(dir);cleanupDir=dir; // never overwrite an existing project
  const duration=o.audio?await prepareAudio(path.resolve(o.audio),path.join(dir,'media')):Number(o.duration??30);
  if(o.audio&&o.duration&&Math.abs(duration-Number(o.duration))>.05)throw new Error('Audio length differs from --duration; omit --duration to use its actual length');
  const captions=o.srt?parseSrt(await readFile(path.resolve(o.srt),'utf8')):undefined;
  const p=buildProject({id,text,duration,captions,width:Number(o.width??1080),height:Number(o.height??1920)});
  if(o.title){p.title=String(o.title);p.board.title=p.title}validateProject(p);
  if(o.audio)p.media={audio:'./media/preview.mp3',renderAudio:'./media/mix.wav',envelope:'./media/voice-envelope.json'};
  await store(path.join(dir,'project.json'),p);await writeFile(path.join(dir,'script.txt'),text);await writeFile(path.join(dir,'captions.srt'),formatSrt(p.captions));
  cleanupDir=null;
  console.log(`Created projects/${id}/project.json (${duration.toFixed(2)}s). ${o.audio?'Narration prepared.':'SILENT ANIMATIC: no narration provided.'}`);
  console.log(o.srt?'Imported SRT timings. Review speaker and camera cues.':'WARNING: captions and speaker turns are word-weighted estimates, not forced alignment. Supply --srt for timed captions.');
 }else if(command==='prepare'){
  const file=await localFile(o.project||'');if(!file.startsWith(path.join(ROOT,'projects')+path.sep))throw new Error('prepare may only write inside projects/, never locked/ or examples/');
  if(typeof o.audio!=='string')throw new Error('Use --audio path/to/narration');
  const p=validateProject(await json(file)),dir=path.dirname(file);await mkdir(path.join(ROOT,'output'),{recursive:true});const temporary=await mkdtemp(path.join(ROOT,'output','prepare-'));cleanupDir=temporary;const duration=await prepareAudio(path.resolve(o.audio),temporary,p.foley);
  if(Math.abs(duration-p.duration)>.05){if(!o.retime)throw new Error(`Audio is ${duration.toFixed(2)}s, project is ${p.duration}s. Use --retime to intentionally scale all cues, or provide matching audio.`);const ratio=duration/p.duration;for(const q of p.captions){q.start*=ratio;q.end*=ratio}for(const a of p.actors){for(const k of a.path)k.t*=ratio;for(const q of [...a.cues,...a.speech]){q.start*=ratio;q.end*=ratio}}for(const k of p.camera)k.t*=ratio;for(const f of p.foley)f.time*=ratio;p.duration=duration;p.timing='retimed-review-required';// Rebuild Foley at the new times.
   await prepareAudio(path.resolve(o.audio),temporary,p.foley);
  }
  p.media={audio:'./media/preview.mp3',renderAudio:'./media/mix.wav',envelope:'./media/voice-envelope.json'};validateProject(p);await mkdir(path.join(dir,'media'),{recursive:true});for(const name of await readdir(temporary))await rename(path.join(temporary,name),path.join(dir,'media',name));await rm(temporary,{recursive:true,force:true});cleanupDir=null;await store(file,p);await writeFile(path.join(dir,'captions.srt'),formatSrt(p.captions));console.log('Prepared narration, mouth envelope and Foley mix.');
 }else if(command==='serve'){
  const port=Number(o.port??3333);if(!Number.isInteger(port)||port<1||port>65535)throw new Error('Invalid port');
  const file=o.locked?null:await localFile(o.project||'examples/curiosity/project.json');
  if(file)validateProject(await json(file));
  const entry=o.locked?'/classroom-v2/index.html':`/engine/index.html?project=${encodeURIComponent('/'+path.relative(ROOT,file).split(path.sep).join('/'))}`;
  const web=await serve({port,entry,root:o.locked?path.join(ROOT,'locked/source/public'):ROOT});console.log(`Animation preview on 0.0.0.0:${web.port}${entry}`);
  for(const s of ['SIGTERM','SIGINT'])process.on(s,async()=>{await web.close();process.exit(0)});
 }else if(command==='validate'){
  const file=await localFile(o.project||'examples/curiosity/project.json');const p=validateProject(await json(file));for(const file of Object.values(p.media))await localFile(file,path.dirname(await localFile(o.project||'examples/curiosity/project.json')));console.log(`Valid: ${p.id}, ${p.duration}s, ${p.width}×${p.height}, ${p.actors.length} actors`);
 }else if(command==='render'){
  const {render}=await import('./render.mjs');await render(o);
 }else{
  console.log(`Animation bundle\n\n  npm ci\n  npx playwright install chromium\n  npm test\n  npm run verify-lock\n  npm run preview                         # silent generic sample\n  npm run preview -- --locked              # exact approved scene\n\n  node tools/cli.mjs init --name my-video --script script.txt --audio narration.mp3 [--srt captions.srt]\n  node tools/cli.mjs validate --project projects/my-video/project.json\n  node tools/cli.mjs prepare --project projects/my-video/project.json --audio narration.mp3 [--retime]\n  npm run preview -- --project projects/my-video/project.json\n  npm run render -- --project projects/my-video/project.json\n  npm run render -- --project projects/my-video/project.json --start 0 --end 2 --width 360 --height 640\n  npm run render -- --locked --still 16 --out output/approved.png\n\nSee README.md for locked-version policy and script/timing limitations.`);
 }
}catch(e){if(cleanupDir)await rm(cleanupDir,{recursive:true,force:true});console.error(e.message);process.exitCode=1}
