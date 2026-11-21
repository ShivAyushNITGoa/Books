import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import * as T from '../engine/vendor/three.module.js';
import {stateAt,DURATION,BLOCKING,PEOPLE,clearance} from '../projects/black-box-rebuilt/choreography.js';
import {fitCamera,subjectMatrix,corners,RECORDER_EXTENTS,CARRIER_EXTENTS,projectedBounds,personBounds,overlap} from '../projects/black-box-rebuilt/camera-rig.js';
const samples=[];
for(let f=0;f<1561;f++){const s=stateAt(f/24),camera=new T.PerspectiveCamera(46,9/16,.15,125);fitCamera(camera,s);samples.push({s,camera,payload:projectedBounds(corners(RECORDER_EXTENTS,subjectMatrix(s)),camera),carrier:projectedBounds(corners(CARRIER_EXTENTS,subjectMatrix(s)),camera)})}
const words=s=>s.toLowerCase().match(/[a-z0-9]+(?:'[a-z]+)?/g).join(' ');
test('rebuilt film retains the entire original script, VO timing and duration',async()=>{
 const base=new URL('../projects/black-box-rebuilt/',import.meta.url),script=await readFile(new URL('script.txt',base),'utf8'),n=JSON.parse(await readFile(new URL('narration.json',base),'utf8'));
 assert.equal(words(n.captions.map(c=>c.text).join(' ')),words(script));assert.equal(n.duration,DURATION);assert.equal(n.frames,1561);
 assert.deepEqual(n,JSON.parse(await readFile(new URL('../black-box/timeline.json',base),'utf8')));
});
test('every exported frame has physical clearance between people and the carrier',()=>{
 let minimum=Infinity;
 for(const {s} of samples)for(const p of PEOPLE)minimum=Math.min(minimum,clearance(s,p));
 assert.ok(minimum>.8,`Only ${minimum}m clearance`);
 for(const [i,a] of PEOPLE.entries())for(const b of PEOPLE.slice(i+1))assert.ok(Math.hypot(a.x-b.x,a.z-b.z)>a.radius+b.radius,'People intersect each other');
});
test('conservative projected character silhouettes never overlap the recorder',()=>{
 let maximum=0;for(const {camera,payload} of samples)for(const p of PEOPLE)maximum=Math.max(maximum,overlap(payload,personBounds(p,camera)));
 assert.equal(maximum,0,'Screen-space blocking makes a character appear to enter the recorder');
});
test('recorder uses both thirds and camera travels around multiple sides, not a fixed offset',()=>{
 const xs=[],angles=[],distances=[];
 for(const {s,camera} of samples){xs.push(new T.Vector3(...s.hero).project(camera).x);let a=Math.atan2(camera.position.x-s.hero[0],camera.position.z-s.hero[2]);if(angles.length){while(a-angles.at(-1)>Math.PI)a-=Math.PI*2;while(a-angles.at(-1)<-Math.PI)a+=Math.PI*2}angles.push(a);distances.push(camera.position.distanceTo(new T.Vector3(...s.hero)))}
 assert.ok(Math.min(...xs)<-.30&&Math.max(...xs)>.30,'Subject stays centered');
 assert.ok(Math.max(...xs)-Math.min(...xs)>.65);
 assert.ok((Math.max(...angles)-Math.min(...angles))*180/Math.PI>360,'Camera stays on one side');
 assert.ok(Math.max(...distances)/Math.min(...distances)>1.7,'No wide/close variation');
 const positions=samples.map(x=>x.s.hero);for(const axis of [0,2])assert.ok(Math.max(...positions.map(p=>p[axis]))-Math.min(...positions.map(p=>p[axis]))>15,'Route is a straight conveyor');
});
test('carrier, handle, beacon and wheels remain inside frame and clear of captions',()=>{
 for(const {carrier:b} of samples){assert.ok(b.min[0]>=-.842&&b.max[0]<=.842);assert.ok(b.min[1]>=-.552&&b.max[1]<=.752)}
});
test('actual fitted camera and independent curves are continuous, with no cuts',()=>{
 for(let i=1;i<samples.length;i++)assert.ok(samples[i].camera.position.distanceTo(samples[i-1].camera.position)<.6);
 for(const [time] of BLOCKING.slice(1,-1)){
  const a=stateAt(time-1e-5),b=stateAt(time+1e-5);assert.ok(Math.hypot(...a.hero.map((x,i)=>x-b.hero[i]))<.0001);assert.ok(Math.hypot(...a.eye.map((x,i)=>x-b.eye[i]))<.0002);
 }
 assert.throws(()=>stateAt(NaN));assert.equal(stateAt(-1).t,0);assert.equal(stateAt(100).t,DURATION);
});
test('near-plane/frustum clipping cannot report behind-camera people as visible',()=>{
 const c=new T.PerspectiveCamera(46,9/16,.15,125);c.position.set(0,2,0);c.lookAt(0,2,-1);c.updateMatrixWorld(true);
 assert.equal(personBounds({x:0,z:5},c).visible,false);
 assert.equal(personBounds({x:0,z:-5},c).visible,true);
});
