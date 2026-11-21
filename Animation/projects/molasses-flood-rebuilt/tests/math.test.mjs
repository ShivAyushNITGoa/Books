import test from 'node:test';
import assert from 'node:assert/strict';
import {solveTwoBone,distance,seedRandom,spline,normalize,dot,cross,smooth,mod} from '../engine/math.js';

const near=(a,b,e=1e-7)=>assert.ok(Math.abs(a-b)<e,`${a} != ${b}`);

test('IK preserves both bone lengths for reachable targets',()=>{
  const random=seedRandom(1919);
  for(let i=0;i<2000;i++) {
    const root=[0,1,0];
    const target=[(random()-.5)*.6,.3+random()*.3,(random()-.5)*.4];
    const ik=solveTwoBone(root,target,.39,.4,[0,0,1]);
    near(distance(root,ik.joint),.39);
    near(distance(ik.joint,ik.end),.4);
    near(distance(ik.end,target),0,1e-6);
  }
});

test('unreachable targets clamp before bones disconnect',()=>{
  const root=[0,0,0];
  const ik=solveTwoBone(root,[5,0,0],.34,.35,[0,0,1]);
  near(distance(root,ik.joint),.34);
  near(distance(ik.joint,ik.end),.35);
  assert.ok(distance(root,ik.end)<.69);
  near(ik.reachError,4.31);
});

test('IK pole fixes elbow direction rather than random sign flips',()=>{
  const root=[0,1,0],target=[0,.3,0];
  const left=solveTwoBone(root,target,.4,.4,[-1,0,.2]);
  const right=solveTwoBone(root,target,.4,.4,[1,0,.2]);
  assert.ok(left.joint[0]<0);
  assert.ok(right.joint[0]>0);
  assert.ok(left.joint[2]>0&&right.joint[2]>0);
});

test('seeded geometry generation is repeatable',()=>{
  const a=seedRandom(9),b=seedRandom(9),c=seedRandom(10);
  let different=false;
  for(let i=0;i<1000;i++) {
    const x=a();
    assert.equal(x,b());
    assert.ok(x>=0&&x<1);
    if(x!==c())different=true;
  }
  assert.equal(different,true);
});

test('vector operations preserve orthogonal construction',()=>{
  assert.deepEqual(cross([1,0,0],[0,1,0]),[0,0,1]);
  near(dot(normalize([3,4,0]),normalize([4,-3,0])),0);
  assert.deepEqual(normalize([0,0,0]),[0,0,0]);
});

test('spline returns authored endpoints and clamps extrapolation',()=>{
  const keys=[{t:0,position:[0,0,0]},{t:2,position:[2,4,6]},{t:4,position:[4,8,12]}];
  for(let t=0;t<=4;t+=.125) {
    const s=spline(keys,t);
    near(s[0],t);
    near(s[1],t*2);
    near(s[2],t*3);
  }
  assert.deepEqual(spline(keys,-1),[0,0,0]);
  assert.deepEqual(spline(keys,20),[4,8,12]);
});

test('easing clamps endpoints and modulo remains positive',()=>{
  near(smooth(-1),0);
  near(smooth(2),1);
  near(smooth(.5),.5);
  near(mod(-.2,1),.8);
});

test('bounded aim spline never overshoots neighboring target coordinates',async()=>{
  const {monotoneSpline}=await import('../engine/math.js');
  const {cameraKeys}=await import('../direction/camera.js');
  for(let i=0;i<cameraKeys.length-1;i++) {
    const a=cameraKeys[i],b=cameraKeys[i+1];
    for(let j=0;j<=20;j++) {
      const target=monotoneSpline(cameraKeys,a.t+(b.t-a.t)*j/20);
      for(let axis=0;axis<3;axis++) {
        assert.ok(target[axis]>=Math.min(a.target[axis],b.target[axis])-1e-7);
        assert.ok(target[axis]<=Math.max(a.target[axis],b.target[axis])+1e-7);
      }
    }
  }
});
