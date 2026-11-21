import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {cameraAt,cameraAudit,cameraKeys,cameraSpeed,DURATION,FPS} from '../direction/camera.js';
import {episodeTime,fluidHeightAt,floodDepthAt,residueAt,floodFrontAt,LOCATIONS,groundAt,narrativePhase} from '../world/geography.js';
import {distance} from '../engine/math.js';

const json=p=>JSON.parse(readFileSync(new URL(p,import.meta.url),'utf8'));
const near=(a,b,e=1e-6)=>assert.ok(Math.abs(a-b)<e,`${a} != ${b}`);

test('timeline preserves original narration and corrected railway statements',()=>{
  const n=json('../narration.json');
  const old=json('../../molasses-flood/narration.json');
  assert.deepEqual(n,old);
  assert.equal(n.frames,5344);
  near(n.duration,DURATION);
  const script=readFileSync(new URL('../script.txt',import.meta.url),'utf8');
  assert.match(script,/stopped short of the sagging tracks/);
  assert.doesNotMatch(script,/train derailed/i);
});

test('41 narration beats cover the film without temporal gaps',()=>{
  const beats=json('../direction/beats.json');
  assert.equal(beats.length,41);
  near(beats[0].start,0);
  near(beats.at(-1).end,DURATION,.05);
  for(let i=0;i<beats.length;i++) {
    assert.ok(beats[i].end>beats[i].start);
    assert.ok(beats[i].text.length>0);
    if(i)near(beats[i-1].end,beats[i].start);
  }
});

test('camera samples are finite, above street and never stationary',()=>{
  const audit=cameraAudit();
  assert.deepEqual(audit.issues,[]);
  assert.equal(audit.frames,5344);
  assert.ok(audit.minSpeed>.035);
  assert.ok(audit.maxStep<.75);
  assert.ok(audit.speedRatio>2);
});

test('position and target remain continuous across every spline key',()=>{
  for(const key of cameraKeys.slice(1,-1)) {
    for(const field of ['position','target']) {
      const a=cameraAt(key.t-1e-6)[field];
      const b=cameraAt(key.t+1e-6)[field];
      assert.ok(distance(a,b)<.0001,`${key.t} ${field}`);
      assert.ok(distance(cameraAt(key.t)[field],key[field])<1e-8);
    }
  }
});

test('camera velocity is continuous at narration landmarks',()=>{
  const h=1e-5;
  for(const key of cameraKeys.slice(1,-1)) {
    const a=cameraAt(key.t-h).position;
    const b=cameraAt(key.t).position;
    const c=cameraAt(key.t+h).position;
    const left=b.map((v,i)=>(v-a[i])/h);
    const right=c.map((v,i)=>(v-b[i])/h);
    assert.ok(distance(left,right)<.001,`${key.t}: ${left} / ${right}`);
  }
});

test('camera has no exact repeated frame positions or repeated position keys',()=>{
  const seen=new Set();
  for(let f=0;f<5344;f++) {
    const signature=cameraAt(f/FPS).position.map(x=>x.toFixed(6)).join(',');
    assert.equal(seen.has(signature),false,signature);
    seen.add(signature);
  }
  const keys=cameraKeys.map(k=>k.position.join(','));
  assert.equal(new Set(keys).size,keys.length);
});

test('camera seek clamps outside film rather than extrapolating into invalid space',()=>{
  assert.deepEqual(cameraAt(-100),cameraAt(0));
  assert.deepEqual(cameraAt(1000),cameraAt(DURATION));
  assert.ok(cameraSpeed(0)>0);
  assert.ok(cameraSpeed(DURATION)>0);
});

test('rewind is one explicitly labeled interval, not a camera or geography reset',()=>{
  assert.ok(episodeTime(22)>0);
  near(episodeTime(25),-8);
  near(episodeTime(84.99),-8);
  near(episodeTime(85),0);
  assert.match(narrativePhase(23),/REWIND/);
  assert.ok(distance(cameraAt(24.999).position,cameraAt(25.001).position)<.04);
});

test('pool persists after wave front and throughout cleanup',()=>{
  for(const z of [-5,0,20,35,48]) {
    assert.ok(fluidHeightAt(0,z,130)>.2,`130: ${z}`);
    assert.ok(fluidHeightAt(0,z,175)>.2,`175: ${z}`);
    assert.ok(fluidHeightAt(0,z,222)>.08,`222: ${z}`);
    assert.ok(residueAt(0,z,222)>.9);
  }
});

test('pre-failure streets are dry and post-failure retained layer is finite',()=>{
  for(const t of [26,45,67,80,84.99]) {
    near(floodDepthAt(0,0,t),0);
    near(residueAt(0,0,t),0);
  }
  for(let t=85;t<223;t+=2) {
    for(let z=-10;z<60;z+=5) {
      const h=fluidHeightAt(0,z,t);
      assert.ok(Number.isFinite(h));
      assert.ok(h>=-.2&&h<7,`${t}: ${h}`);
    }
  }
});

test('wave advances monotonically and does not erase its trail',()=>{
  let previous=-Infinity;
  for(let t=85;t<=130;t+=.25) {
    const front=floodFrontAt(t);
    assert.ok(front>=previous);
    previous=front;
    if(front>4)assert.ok(fluidHeightAt(0,front-12,t)>.1);
  }
});

test('same named geography is used throughout the film',()=>{
  assert.deepEqual(LOCATIONS.tank,[0,0,-26]);
  assert.equal(Object.keys(LOCATIONS).length,9);
  for(const p of Object.values(LOCATIONS))assert.ok(p.every(Number.isFinite));
  assert.equal(groundAt(4.8,17.5),.72);
  assert.equal(groundAt(-18.5,29),.56);
  assert.equal(groundAt(18,35),.46);
  assert.equal(groundAt(36,18),-.85);
});

test('cleanup only reduces local depth; it does not delete the flood globally',()=>{
  assert.ok(floodDepthAt(0,18,222)<floodDepthAt(0,18,175));
  assert.ok(fluidHeightAt(0,45,222)>.2);
  assert.ok(residueAt(0,18,222)>.9);
});

test('full-frame camera route clears opaque warehouse volumes',async()=>{
  const {warehouseCollision}=await import('../world/geography.js');
  for(let f=0;f<5344;f++) {
    const t=f/24;
    const position=cameraAt(t).position;
    assert.equal(warehouseCollision(position),undefined,`camera inside warehouse@${t}: ${position}`);
  }
});
