import test from 'node:test';
import assert from 'node:assert/strict';
import {routeSample,gaitAt,actorState,castDefinitions} from '../cast/motion.js';
import {groundAt} from '../world/geography.js';

const near=(a,b,e=1e-7)=>assert.ok(Math.abs(a-b)<e,`${a} differs from ${b}`);
const route=[[0,0,0],[10,0,10],[20,0,10],[30,10,10]];

test('route reaches authored endpoints without overshoot',()=>{
  for(const [t,x,z] of route) {
    const state=routeSample(route,t);
    near(state.x,x);
    near(state.z,z);
  }
  near(routeSample(route,-1).distance,0);
  near(routeSample(route,100).distance,20);
});

test('walk distance integrates actual root displacement, including acceleration',()=>{
  for(let t=.1;t<9.9;t+=.1) {
    const a=routeSample(route,t-.0001);
    const b=routeSample(route,t+.0001);
    const s=routeSample(route,t);
    near((b.z-a.z)/.0002,s.speed,1e-4);
    near(s.distance,s.z);
  }
});

test('hold segments do not advance gait distance',()=>{
  for(let t=10;t<=20;t+=.2) {
    const s=routeSample(route,t);
    near(s.speed,0);
    near(s.distance,10);
  }
});

test('heading follows route rather than a fixed actor orientation',()=>{
  near(routeSample(route,5).yaw,0);
  near(routeSample(route,25).yaw,Math.PI/2);
  const reverse=routeSample([[0,0,0],[10,-4,0]],5);
  near(reverse.yaw,-Math.PI/2);
});

test('stance foot cancels forward root movement on straight routes',()=>{
  const stride=.78;
  for(const side of [-1,1]) {
    for(let d=0;d<3;d+=.007) {
      const a=gaitAt(d,1,side,stride);
      const b=gaitAt(d+.001,1,side,stride);
      if(!a.swing&&!b.swing&&Math.abs(a.phase-b.phase)<.01) {
        near(d+a.z,d+.001+b.z,1e-8);
        near(a.y,.095);
      }
    }
  }
});

test('swing and stance meet without foot-position discontinuities',()=>{
  for(const d of [0,.64*.78,.78,1.64*.78]) {
    const a=gaitAt(d-1e-8,1,-1);
    const b=gaitAt(d+1e-8,1,-1);
    near(a.y,b.y,1e-6);
    near(a.z,b.z,1e-6);
  }
});

test('idle gait is independent of accumulated distance',()=>{
  assert.deepEqual(gaitAt(0,0,1),gaitAt(250,0,1));
  assert.equal(gaitAt(0,0,1).swing,false);
});

test('cast IDs and route times are unique and ordered',()=>{
  assert.equal(new Set(castDefinitions.map(d=>d.id)).size,castDefinitions.length);
  for(const def of castDefinitions) {
    assert.ok(def.route.length>=2,def.id);
    assert.equal(def.route[0][0],0,def.id);
    assert.ok(def.route.at(-1)[0]>=5344/24,def.id);
    for(let i=1;i<def.route.length;i++) {
      assert.ok(def.route[i][0]>def.route[i-1][0],def.id);
      assert.ok(def.route[i].every(Number.isFinite),def.id);
    }
  }
});

test('every frame has finite cast transforms and walking requires root speed',()=>{
  for(let f=0;f<5344;f++) {
    const t=f/24;
    for(const def of castDefinitions) {
      const s=actorState(def,t);
      assert.ok([s.x,s.y,s.z,s.yaw,s.distance,s.speed].every(Number.isFinite),`${def.id}@${t}`);
      assert.equal(s.y,groundAt(s.x,s.z));
      if(s.walking)assert.ok(s.speed>.015,`${def.id}@${t}`);
      if(s.action==='walk')assert.equal(s.walking,true);
    }
  }
});

test('escape actors actually leave the inundated street',()=>{
  for(const id of ['dock-worker','resident-woman','street-porter','child','tank-worker']) {
    const def=castDefinitions.find(d=>d.id===id);
    const before=actorState(def,85);
    const after=actorState(def,137);
    assert.ok(after.z-before.z>40,id);
  }
});

test('narrated prop actions occur at their authored times',()=>{
  const state=(id,t)=>actorState(castDefinitions.find(d=>d.id===id),t);
  assert.equal(state('child',67).action,'pail');
  assert.equal(state('tank-worker',73).action,'paint');
  assert.equal(state('inspector',160).action,'measure');
  assert.equal(state('policeman',145).action,'pull');
  assert.equal(state('policeman',187).action,'hose');
});

test('rewind is explicitly excluded from ordinary walking classification',()=>{
  for(const def of castDefinitions) {
    for(const t of [22.5,23,24,24.9])assert.equal(actorState(def,t).walking,false);
  }
});

test('head envelopes remain separated outside the marked narrative rewind',()=>{
  for(let f=0;f<5344;f++) {
    const t=f/24;
    if(t>22.4&&t<25.1)continue;
    const states=castDefinitions.map(def=>({...actorState(def,t),id:def.id,scale:def.scale||1}));
    for(let i=0;i<states.length;i++)for(let j=i+1;j<states.length;j++) {
      const a=states[i],b=states[j];
      const horizontal=Math.hypot(a.x-b.x,a.z-b.z);
      const minimum=.485*(a.scale+b.scale);
      assert.ok(horizontal>=minimum,`${a.id}/${b.id}@${t}: ${horizontal}<${minimum}`);
    }
  }
});

test('torsos clear all three actual shared table surfaces at every frame',async()=>{
  const {TABLETOPS}=await import('../world/geography.js');
  for(let f=0;f<5344;f++) {
    const t=f/24;
    if(t>22.4&&t<25.1)continue;
    for(const def of castDefinitions) {
      const state=actorState(def,t),scale=def.scale||1;
      for(const [id,table] of Object.entries(TABLETOPS)) {
        const dy=(table.y-state.y-1.15*scale)/(.49*scale);
        if(Math.abs(dy)>1)continue;
        // Conservative horizontal bound of the rounded torso at table height.
        const radius=.335*scale*Math.sqrt(1-dy*dy);
        const overlaps=Math.abs(state.x-table.x)<table.width/2+radius
          &&Math.abs(state.z-table.z)<table.depth/2+radius;
        assert.equal(overlaps,false,`${def.id} intersects ${id} tabletop@${t}`);
      }
    }
  }
});

test('cast routes clear railway columns outside the explicit rewind',async()=>{
  const {RAIL_POSTS}=await import('../world/geography.js');
  for(let f=0;f<5344;f++) {
    const t=f/24;
    if(t>22.4&&t<25.1)continue;
    for(const def of castDefinitions) {
      const state=actorState(def,t);
      for(const [x,z] of RAIL_POSTS) {
        const separation=Math.hypot(state.x-x,state.z-z);
        assert.ok(separation>.65,`${def.id} reaches column (${x},${z})@${t}: ${separation}`);
      }
    }
  }
});

test('escape lanes avoid the horse and attached cart envelope',async()=>{
  const {episodeTime}=await import('../world/geography.js');
  for(let f=0;f<5344;f++) {
    const t=f/24;
    if(t>22.4&&t<25.1)continue;
    const e=episodeTime(t);
    const z=6+(e<0?Math.sin(t*.03)*.2:Math.min(2,e*.18));
    for(const def of castDefinitions) {
      const s=actorState(def,t);
      const overlap=Math.abs(s.x+8)<1.25&&s.z>z-3.8&&s.z<z+1.7;
      assert.equal(overlap,false,`${def.id} enters horse/cart@${t}`);
    }
  }
});

test('cast avoids the persistent remembrance board',()=>{
  for(let f=0;f<5344;f++) {
    const t=f/24;
    if(t>22.4&&t<25.1)continue;
    for(const def of castDefinitions) {
      const s=actorState(def,t);
      const overlaps=Math.abs(s.x)<2.95&&Math.abs(s.z-36)<.76;
      assert.equal(overlaps,false,`${def.id} enters remembrance board@${t}`);
    }
  }
});

test('escape routes clear the courthouse back wall and damaged house',async()=>{
  const {episodeTime}=await import('../world/geography.js');
  const {smooth}=await import('../engine/math.js');
  const outside=(p,min,max,r)=>Math.hypot(...p.map((v,i)=>Math.max(min[i]-v,0,v-max[i])))>=r;
  for(let f=0;f<5344;f++) {
    const t=f/24;
    if(t>22.4&&t<25.1)continue;
    const damage=smooth((episodeTime(t)-9)/8);
    const angle=damage*.27,c=Math.cos(angle),s=Math.sin(angle);
    const hx=-12+damage*1.2,hz=18+damage*1.7;
    for(const def of castDefinitions) {
      const state=actorState(def,t),scale=def.scale||1;
      for(const [height,radius] of [[1.15,.49],[1.97,.52]]) {
        const point=[state.x,state.y+height*scale,state.z];
        assert.ok(outside(point,[11,0,29.75],[25,8.5,30.25],radius*scale),`${def.id} enters court wall@${t}`);
        const dx=point[0]-hx,dy=point[1];
        const local=[dx*c+dy*s,-dx*s+dy*c,point[2]-hz];
        assert.ok(outside(local,[-1.7,0,-1.85],[1.7,3.2,1.85],radius*scale),`${def.id} enters damaged house@${t}`);
      }
    }
  }
});
