import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,existsSync} from 'node:fs';
import * as T from '../../../engine/vendor/three.module.js';
import {stateAt,KEYS,DURATION,FPS,CHAPTERS} from '../direction/choreography.js';
import {setCamera,focusPoints,projectedEnvelope} from '../direction/camera.js';
import {heightAt} from '../environment/geography.js';
import {interference,conditionAt} from '../environment/waves.js';
import {SHIP} from '../assets/ship.js';
const file=name=>new URL('../'+name,import.meta.url);
const narration=JSON.parse(readFileSync(file('narration.json'),'utf8'));
const normalize=s=>s.replace(/\s+/g,' ').trim();

test('all supplied body words survive narration and captions in order',()=>{
 const body=readFileSync(file('script.txt'),'utf8').split('\n').slice(1).join('\n');
 assert.equal(normalize(narration.chapters.map(c=>c.text).join(' ')),normalize(body));
 assert.equal(normalize(narration.captions.map(c=>c.text).join(' ')),normalize(body));
 assert.equal(normalize(body).split(' ').length,568);
});
test('full-duration 24 fps delivery with eight original selected-voice takes',()=>{
 assert.equal(DURATION,205.25);assert.equal(FPS,24);assert.equal(narration.frames,DURATION*FPS);
 assert.equal(CHAPTERS.length,8);assert.equal(narration.chapters.length,8);
 for(const c of narration.chapters)assert.ok(existsSync(file(c.source)));
});
test('caption timing is finite, ordered, non-overlapping and in the programme',()=>{
 let end=0;assert.equal(narration.captions.length,83);
 for(const c of narration.captions){assert.ok(Number.isFinite(c.start)&&Number.isFinite(c.end));assert.ok(c.start>=end-.001);assert.ok(c.end>c.start&&c.end<=DURATION);end=c.end;}
});
test('partial cancellation is not total cancellation',()=>{
 for(let i=0;i<100;i++){const phase=i*.1,v=interference(phase);assert.ok(Math.abs(v.result-v.hull*.36)<1e-12);}
 assert.ok(Math.abs(interference(Math.PI/2).result)>.3);
});
test('off-design conditions can increase the schematic wave amplitude',()=>{
 const off=conditionAt(1),on=conditionAt(0);
 const amplitude=({gain,mismatch})=>Math.sqrt(1+gain*gain-2*gain*Math.cos(mismatch));
 assert.ok(amplitude(on)<1);assert.ok(amplitude(off)>1);assert.ok(off.qualitativeOnly);
});
test('real full-size ship proportions, bulb forward of bow, excavated dry dock',()=>{
 assert.equal(SHIP.length,132);assert.ok(SHIP.bulbZ<SHIP.bowZ);assert.ok(SHIP.draft>10);
 assert.equal(heightAt(-420,0),-14);assert.ok(heightAt(250,-460)<-25);
 assert.equal(heightAt(-165,-450),6);
});
test('authored rail has strictly increasing times, no implicit teleport keys',()=>{
 assert.equal(KEYS[0][0],0);assert.equal(KEYS.at(-1)[0],DURATION);
 KEYS.forEach((k,i)=>{assert.equal(k.length,7);assert.ok(k.every(Number.isFinite));if(i)assert.ok(k[0]>KEYS[i-1][0]);});
 assert.throws(()=>stateAt(NaN));
});
test('all 4926 delivery poses protect focus, ground, hull and dock walls',()=>{
 const c=new T.PerspectiveCamera(46,9/16,.15,13000);
 let previous,maxAngle=0,maxStep=0,settled=0;
 const ranges={dock:[],sea:[],final:[]};
 for(let frame=0;frame<narration.frames;frame++){
  const s=stateAt(frame/FPS);setCamera(c,s);const [x,y,z]=c.position.toArray();
  assert.ok([x,y,z,...c.quaternion.toArray()].every(Number.isFinite));
  assert.ok(y-heightAt(x,z)>.7,`terrain ${s.t}`);
  if(s.t<24&&y<7&&y>-14){
   assert.ok(!(Math.abs(x+420)>38&&Math.abs(x+420)<41&&Math.abs(z)<102),`dock side wall ${s.t}`);
   assert.ok(!(Math.abs(z+100)<1&&Math.abs(x+420)<39),`dock gate ${s.t}`);
  }
  if(z< -650&&z> -750&&y>6&&y<30)assert.ok(!(Math.abs(x+200)>28.5&&Math.abs(x+200)<30),`lab side wall ${s.t}`);
  if(s.t>29&&s.t<104||s.t>187)assert.ok(x-s.ship[0]>17,`ocean hull ${s.t}`);
  if(previous){maxAngle=Math.max(maxAngle,c.quaternion.angleTo(previous.quaternion)*180/Math.PI);maxStep=Math.max(maxStep,c.position.distanceTo(previous.position));}
  previous=c.clone();
  if(s.settled){
   settled++;const b=projectedEnvelope(focusPoints(s),c);
   assert.ok(b.inFront&&b.min[0]>=-.94&&b.max[0]<=.94&&b.min[1]>=-.59&&b.max[1]<=.8,`portrait crop ${s.t}`);
  }
  if(s.t<23)ranges.dock.push(Math.atan2(x+420,z));
  if(s.t>29&&s.t<104)ranges.sea.push(Math.atan2(x-s.ship[0],z-s.ship[2]));
  if(s.t>187)ranges.final.push(Math.atan2(x-s.ship[0],z-s.ship[2]));
 }
 assert.ok(settled>2700);assert.ok(maxAngle<3.1);assert.ok(maxStep<11);
 for(const a of Object.values(ranges))assert.ok((Math.max(...a)-Math.min(...a))*180/Math.PI<25,'No circling around the ship');
});
