import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,existsSync} from 'node:fs';
import * as T from '../../../engine/vendor/three.module.js';
import {stateAt,KEYS,DURATION,FPS,CHAPTERS} from '../direction/choreography.js';
import {setCamera,focusPoints,projectedEnvelope} from '../direction/camera.js';
import {vesselMotion} from '../direction/motion.js';
import {heightAt,LAB_FLOOR_Y} from '../environment/geography.js';
import {interference,conditionAt} from '../environment/waves.js';
import {SHIP,BULB,bulbSurfacePoints,hullGeometry,exposedBulbWidth,stemZ} from '../assets/ship.js';
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
test('parametric full-size ship dimensions, bulb forward of bow, excavated dry dock',()=>{
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


test('bulb is a proportionate extension of a single welded closed hull',()=>{
 assert.ok(exposedBulbWidth()>2.8&&exposedBulbWidth()/SHIP.beam<.16);
 assert.ok((SHIP.bowZ-BULB.frontZ)/SHIP.length<.05);
 assert.ok(bulbSurfacePoints().every(p=>p.every(Number.isFinite)));
 assert.equal(stemZ(-7.5),-72);assert.ok(stemZ(-3.5)>-66);
 for(const miniature of [false,true])for(const bulb of [false,true]){
  const g=hullGeometry({miniature,bulb}),idx=g.index.array,edges=new Map(),adj=new Map();
  for(let i=0;i<idx.length;i+=3)for(let j=0;j<3;j++){
   const a=idx[i+j],b=idx[i+(j+1)%3],key=a<b?`${a},${b}`:`${b},${a}`;
   const e=edges.get(key)||{count:0,direction:0};e.count++;e.direction+=a<b?1:-1;edges.set(key,e);
   if(!adj.has(a))adj.set(a,[]);adj.get(a).push(b);
  }
  for(const e of edges.values()){assert.equal(e.count,2,'closed two-manifold skin');assert.equal(e.direction,0,'consistent outward winding');}
  const seen=new Set(),stack=[0];while(stack.length){const v=stack.pop();if(seen.has(v))continue;seen.add(v);stack.push(...adj.get(v));}
  assert.equal(seen.size,g.attributes.position.count,'bulb and hull share all topology, with no separate component');
  assert.equal(g.attributes.position.count-edges.size+idx.length/3,2,'closed genus-zero hull');
  assert.equal(g.userData.independentBulbMeshes,0);g.dispose();
 }
});
test('integrated hull sides point outward, keel down and deck up',()=>{
 const g=hullGeometry(),p=g.attributes.position,a=new T.Vector3(),b=new T.Vector3(),c=new T.Vector3(),n=new T.Vector3();
 let sides=0,top=0,bottom=0;
 for(let i=0;i<g.index.count;i+=3){
  a.fromBufferAttribute(p,g.index.getX(i));b.fromBufferAttribute(p,g.index.getX(i+1));c.fromBufferAttribute(p,g.index.getX(i+2));
  n.crossVectors(b.clone().sub(a),c.clone().sub(a)).normalize();
  const x=(a.x+b.x+c.x)/3,z=(a.z+b.z+c.z)/3;
  if(Math.abs(z)<25&&Math.abs(n.x)>.5){assert.ok(n.x*x>0);sides++;}
  if(a.y===b.y&&b.y===c.y&&a.y>8){assert.ok(n.y>.99);top++;}
  if(a.y===b.y&&b.y===c.y&&a.y< -10){assert.ok(n.y<-.99);bottom++;}
 }
 assert.ok(sides>100&&top>100&&bottom>100);g.dispose();
});
test('explanation camera moves slowly without static holds or repeated orbits',()=>{
 for(const [start,end,maxSpeed] of [[11,16,3],[69,77.5,3],[126,150,2]]){
  const first=stateAt(start).eye,last=stateAt(end).eye;
  assert.ok(Math.hypot(...first.map((v,i)=>last[i]-v))>3);
  for(let t=start;t<end;t+=.1){
   const a=stateAt(t),b=stateAt(Math.min(t+.1,end));
   const relative=s=>s.eye.map((v,i)=>v-(s.focusKind==='sea-bulb'?s.ship[i]:0));
   const x=relative(a),y=relative(b);
   assert.ok(Math.hypot(...x.map((v,i)=>y[i]-v))/.1<maxSpeed,`slow camera at ${t}`);
  }
 }
});
test('ship rides higher without exposing the bulb or turning sea response into exaggerated motion',()=>{
 for(let i=0;i<4926;i++){
  const m=vesselMotion(i/24),draft=SHIP.draft-m.heave,freeboard=SHIP.deckY+m.heave;
  assert.ok(draft>8.2&&draft<8.6);assert.ok(freeboard>10);
  assert.ok(Math.abs(m.pitch)<.002&&Math.abs(m.roll)<.002);
  assert.ok(m.heave+BULB.shoulderY< -1.3);
 }
 assert.notEqual(vesselMotion(1).heave,vesselMotion(2).heave);
});
test('laboratory terrain is separated from the solid floor throughout its footprint',()=>{
 for(let x=-229;x<=-171;x+=2)for(let z=-750;z<=-650;z+=2){
  assert.ok(LAB_FLOOR_Y-heightAt(x,z)>.65,`floor/terrain coplanarity ${x},${z}`);
 }
});
