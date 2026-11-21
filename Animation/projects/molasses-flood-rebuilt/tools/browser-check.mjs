#!/usr/bin/env node
/**
 * Browser-level checks against actual generated geometry, not a mock scene.
 * Writes observations separately from hard technical failures. Projection,
 * depth and surface-clearance warnings require visual interpretation.
 */
import {chromium} from 'playwright';
import {mkdir,writeFile,readFile} from 'node:fs/promises';
import path from 'node:path';
import assert from 'node:assert/strict';
import {serve,ROOT} from '../../../tools/server.mjs';

const OUT=path.join(ROOT,'output/molasses-flood-rebuilt');
const web=await serve({port:0,entry:'/projects/molasses-flood-rebuilt/index.html'});
const args=['--no-sandbox','--enable-unsafe-swiftshader'];
if(process.env.CHROMIUM_PATH==='/tmp/chromium') {
  args.push('--single-process','--no-zygote','--in-process-gpu','--use-gl=angle','--use-angle=swiftshader');
}
const browser=await chromium.launch({executablePath:process.env.CHROMIUM_PATH||undefined,args});
const errors=[],issues=[],warnings=[],samples=[],seekChecks=[];
try {
  const page=await browser.newPage({viewport:{width:800,height:1400}});
  page.on('pageerror',error=>errors.push(error.message));
  page.on('console',message=>{
    if(message.type()==='error')errors.push(message.text());
  });
  await page.goto(`http://127.0.0.1:${web.port}/projects/molasses-flood-rebuilt/index.html`,{waitUntil:'networkidle'});
  await page.waitForFunction(()=>window.renderSafe||window.renderError);
  assert.equal(await page.evaluate(()=>window.renderError),undefined);
  const beats=await page.evaluate(()=>window.getShots());
  const times=beats.flatMap(b=>[b.start+.04,(b.start+b.end)/2,b.end-.08]);
  times.push(0,12,22.5,24.9,25,67,73,85,98,107,133,140,145,158,170,175,185,195,208,222.625);
  for(const t of times) {
    const sample=await page.evaluate(async t=>{
      const {T}=await import('./engine/geometry.js');
      const {fluidHeightAt}=await import('./world/geography.js');
      window.setT(t);
      const inspect=window.inspectWorld();
      const actors=[];
      const endpoint=(mesh,sign)=>{
        const point=new T.Vector3(0,sign*.5,0);
        return mesh.localToWorld(point);
      };
      for(const actor of window.filmWorld.actors.values()) {
        const pose={id:actor.id,action:actor.state.action,walking:actor.state.walking,position:actor.telemetry.position};
        const legs=actor.legs.map(leg=>{
          const knee=leg.knee.getWorldPosition(new T.Vector3());
          const ankle=leg.foot.getWorldPosition(new T.Vector3());
          return {
            upperJoin:knee.distanceTo(endpoint(leg.upper,1)),
            lowerJoin:knee.distanceTo(endpoint(leg.lower,-1)),
            ankleGap:ankle.distanceTo(endpoint(leg.lower,1)),
          };
        });
        const arms=actor.arms.map(arm=>{
          const elbow=arm.elbow.getWorldPosition(new T.Vector3());
          const hand=arm.hand.getWorldPosition(new T.Vector3());
          return {
            upperJoin:elbow.distanceTo(endpoint(arm.upper,1)),
            lowerJoin:elbow.distanceTo(endpoint(arm.lower,-1)),
            handGap:hand.distanceTo(endpoint(arm.lower,1)),
          };
        });
        const head=actor.head.getWorldPosition(new T.Vector3());
        const projected=head.clone().project(window.filmCamera);
        const onScreen=Math.abs(projected.x)<1&&Math.abs(projected.y)<1&&projected.z<1;
        const surface=fluidHeightAt(head.x,head.z,t);
        actors.push({...pose,legs,arms,onScreen,headBelowSurface:head.y-surface<.3});
      }
      return {t,inspect,actors,camera:window.frameInfo.camera,cameraSpeed:window.frameInfo.cameraSpeed,triangles:window.frameInfo.triangles,railway:window.frameInfo.railway};
    },t);
    if(sample.inspect.issues.length)issues.push({t,kind:'world',details:sample.inspect.issues});
    if(sample.inspect.matrixIssues.length)issues.push({t,kind:'matrix',details:sample.inspect.matrixIssues});
    if(sample.cameraSpeed<.035)issues.push({t,kind:'stationary-camera'});
    if(sample.railway.trainFront>=sample.railway.gapStart)issues.push({t,kind:'train-crosses-damage'});
    for(const actor of sample.actors) {
      for(const limb of [...actor.legs,...actor.arms]) {
        const gap=Math.max(...Object.values(limb));
        if(gap>.055)issues.push({t,actor:actor.id,kind:'disconnected-limb',gap});
      }
      if(actor.headBelowSurface&&actor.onScreen)warnings.push({t,actor:actor.id,kind:'head-near-fluid-surface'});
    }
    samples.push(sample);
  }

  // The geometry evaluator must be independent of seek history.
  for(const t of [0,2,23,25,67,73,98,107,140,160,185,219]) {
    const result=await page.evaluate(t=>{
      window.setT(t);
      const before=JSON.stringify(window.frameInfo);
      const canvas=document.querySelector('#film');
      const ctx=canvas.getContext('2d');
      const a=ctx.getImageData(0,0,canvas.width,canvas.height).data;
      window.setT(222);
      window.setT(31);
      window.setT(t);
      const b=ctx.getImageData(0,0,canvas.width,canvas.height).data;
      let max=0,total=0;
      for(let i=0;i<a.length;i++) {
        const d=Math.abs(a[i]-b[i]);
        max=Math.max(max,d);
        total+=d;
      }
      return {t,sameTelemetry:before===JSON.stringify(window.frameInfo),maxChannelDifference:max,meanChannelDifference:total/a.length};
    },t);
    if(!result.sameTelemetry||result.maxChannelDifference>2||result.meanChannelDifference>.001)issues.push({kind:'seek-history',...result});
    seekChecks.push(result);
  }
  const sizes=await page.evaluate(()=>{
    const c=document.querySelector('#film');
    return {output:[c.width,c.height],audio:document.querySelector('#vo').duration};
  });
  assert.deepEqual(sizes.output,[720,1280]);
  const report={samples,seekChecks,errors,issues,warnings,sizes,limits:[
    'Limb endpoint checks do not prove there are no mesh intersections.',
    'On-screen tests use head centers, not an exhaustive visibility or occlusion proof.',
    'Screen-space image tolerance permits minor software-renderer rounding.',
    'Technical success is not aesthetic approval.',
  ]};
  await mkdir(OUT,{recursive:true});
  await writeFile(path.join(OUT,'browser-check.json'),JSON.stringify(report,null,2));
  console.log(JSON.stringify({samples:samples.length,seeks:seekChecks.length,errors,issues,warnings},null,2));
  assert.equal(errors.length,0);
  assert.equal(issues.length,0);
} finally {
  await browser.close();
  await web.close();
}
