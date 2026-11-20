import path from 'node:path';
import {readFile,writeFile,mkdir,mkdtemp,rename,rm} from 'node:fs/promises';
import {spawn} from 'node:child_process';
import {ROOT,localFile} from '../../tools/server.mjs';
import {runFF,readPcmWav,wav,envelope,mixFoley} from '../../tools/media.mjs';
import {formatSrt} from '../../engine/project.js';
import {validateStory,captionCues} from '../engine/story.js';
export const exec=(bin,args)=>new Promise((resolve,reject)=>{const p=spawn(bin,args,{stdio:['ignore','ignore','pipe']});let error='';p.stderr.on('data',b=>error=(error+b).slice(-8000));p.on('error',reject);p.on('exit',c=>c===0?resolve():reject(Error(`${bin} failed (${c}): ${error}`)))});
export async function prepareStory(options){
 const source=await localFile(options.project),story=validateStory(JSON.parse(await readFile(source,'utf8')));
 const base=path.dirname(source),out=path.resolve(ROOT,options.out||`output/story-${story.id}`);
 // Resolve the *real* parent too: a symlink must not bypass the output boundary.
 await mkdir(path.join(ROOT,'output'),{recursive:true});
 const {realpath}=await import('node:fs/promises');const outputRoot=await realpath(path.join(ROOT,'output'));
 if(path.dirname(out)!==path.join(ROOT,'output')||!/^[-a-z0-9]+$/.test(path.basename(out)))throw Error('--out must be a direct named directory inside Animation/output');
 if(path.resolve(out)===base)throw Error('Cannot overwrite story source');
 const stage=await mkdtemp(path.join(outputRoot,'.story-'));let published=false;
 try{
  let cursor=0;const all=[],captions=[],manifest=[];
  for(let i=0;i<story.scenes.length;i++){
   const scene=story.scenes[i],stem=String(i+1).padStart(3,'0'),raw=path.join(stage,`${stem}-raw.wav`),decoded=path.join(stage,`${stem}.wav`);
   await writeFile(path.join(stage,`${stem}.txt`),scene.narration);
   if(scene.audio)await runFF(['-y','-i',await localFile(scene.audio,base),'-ac','1','-ar','48000','-c:a','pcm_s16le',raw]);
   else await exec(process.env.PYTHON||'python3',[path.join(ROOT,'story/tools/tts.py'),'--text-file',path.join(stage,`${stem}.txt`),'--out',raw,'--speed',String(options.speed||160)]);
   await runFF(['-y','-i',raw,'-ac','1','-ar','48000','-af','loudnorm=I=-18:TP=-2:LRA=7','-c:a','pcm_s16le',decoded]);
   const {samples}=readPcmWav(await readFile(decoded));const voiceSeconds=samples.length/48000;
   if(scene.seconds&&scene.seconds<voiceSeconds)throw Error(`${scene.id}: requested seconds shorter than narration (${voiceSeconds.toFixed(2)}s); shorten text or increase seconds`);
   const count=Math.ceil(Math.max(voiceSeconds+.3,scene.seconds||0)*48000);if(count>600*48000)throw Error('Scene exceeds 600s');
   const audio=new Float32Array(count);audio.set(samples);all.push(audio);
   scene.start=cursor;scene.end=cursor+count/48000;
   captions.push(...captionCues(scene.narration,cursor,voiceSeconds));
   manifest.push({scene:scene.id,source:scene.audio||'local-espeak-ng-en-us',speechSeconds:voiceSeconds,start:scene.start,end:scene.end,captionTiming:'estimated-within-measured-scene-audio'});cursor=scene.end;
   await rm(raw);await rm(decoded);console.log(`${scene.id}: ${voiceSeconds.toFixed(2)}s speech / ${(count/48000).toFixed(2)}s scene`);
  }
  if(cursor>3600)throw Error('Story exceeds one hour');
  const samples=new Float32Array(all.reduce((n,a)=>n+a.length,0));let offset=0;for(const a of all){samples.set(a,offset);offset+=a.length}
  const foley=story.scenes.flatMap(s=>s.actors.filter(a=>a.action==='walk').flatMap(()=>Array.from({length:Math.floor((s.end-s.start)/.55)},(_,i)=>({time:s.start+i*.55,kind:'step',gain:.018}))));
  await writeFile(path.join(stage,'narration.wav'),wav(samples));await writeFile(path.join(stage,'mix.wav'),wav(mixFoley(samples,foley)));
  await writeFile(path.join(stage,'voice-envelope.json'),JSON.stringify(envelope(samples)));
  story.duration=cursor;story.captions=captions;story.media={audio:'mix.wav',renderAudio:'mix.wav',envelope:'voice-envelope.json'};
  validateStory(story,{prepared:true});
  await writeFile(path.join(stage,'project.json'),JSON.stringify(story,null,2)+'\n');await writeFile(path.join(stage,'captions.srt'),formatSrt(captions));
  await writeFile(path.join(stage,'production.json'),JSON.stringify({engine:'story-v1',voice:'baseline synthetic English unless per-scene audio supplied',alignment:'estimated phrases, not forced word alignment',scenes:manifest},null,2));
  // Never replace a previous complete export silently. Choose a fresh output slug.
  await rename(stage,out);published=true;console.log(`Prepared ${path.relative(ROOT,out)}/project.json (${cursor.toFixed(2)}s)`);return path.join(out,'project.json');
 }finally{if(!published)await rm(stage,{recursive:true,force:true})}
}
