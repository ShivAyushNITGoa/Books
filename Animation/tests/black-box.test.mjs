import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {stateAt,KEYS} from '../projects/black-box/timeline.js';
const base=new URL('../projects/black-box/',import.meta.url);
const timeline=JSON.parse(await readFile(new URL('timeline.json',base),'utf8'));
const words=s=>s.toLowerCase().match(/[a-z0-9]+(?:'[a-z]+)?/g).join(' ');
test('black-box captions retain every supplied script word in order',async()=>{
 const script=await readFile(new URL('script.txt',base),'utf8');
 assert.equal(words(timeline.captions.map(c=>c.text).join(' ')),words(script));
 let end=0;for(const cue of timeline.captions){assert.ok(cue.start>=end-1e-5);assert.ok(cue.end>cue.start);end=cue.end}assert.ok(end<timeline.duration);
});
test('black-box continuous camera is finite and has no frame-to-frame cuts',()=>{
 let previous;let max=0;
 for(let i=0;i<timeline.frames;i++){
  const s=stateAt(i/24);assert.ok([...s.eye,...s.target].every(Number.isFinite));
  assert.ok(s.orange>=-1e-8&&s.orange<=1+1e-8);
  if(previous)max=Math.max(max,Math.hypot(...s.eye.map((x,j)=>x-previous.eye[j])));previous=s;
 }
 assert.ok(max<.65,`Camera step ${max} exceeds allowed physical movement`);
});
test('camera and hero are continuous on both sides of every authored waypoint',()=>{
 for(const [t] of KEYS.slice(1,-1)){
  const a=stateAt(t-1e-5),b=stateAt(t+1e-5);
  assert.ok(Math.hypot(...a.eye.map((x,j)=>x-b.eye[j]))<1e-6);
  assert.ok(Math.abs(a.x-b.x)<1e-6);
 }
 assert.throws(()=>stateAt(NaN));assert.equal(stateAt(-10).t,0);
});
test('recorder passes continuously from orange to hypothetical black and back',()=>{
 assert.equal(stateAt(6).orange,1);assert.equal(stateAt(22).orange,0);assert.equal(stateAt(41).orange,1);
 assert.ok(stateAt(33).underwater>.95);assert.equal(stateAt(41).underwater,0);
 assert.equal(stateAt(48).reflect,1);assert.equal(stateAt(49).beacon,1);
});
test('narration uses eight original-rate takes and an exact whole-frame duration',()=>{
 assert.equal(timeline.chapters.length,8);assert.equal(timeline.frames,timeline.duration*24);
 for(const c of timeline.chapters){assert.ok(c.speechEnd>c.start);assert.ok(c.end>c.speechEnd)}
 assert.equal(timeline.chapters.at(-1).speechEnd<timeline.duration,true);
});
