import {groundAt} from '../world/geography.js';
import {clamp,mix,smooth,mod,TAU} from '../engine/math.js';

/**
 * Actor routes are world-space positions, not decorative limb switches.
 * Each segment accelerates over its first/last 12 percent. A hold segment
 * has zero distance and therefore cannot advance the walk cycle.
 */
export function routeSample(route,t) {
  if(t<=route[0][0])return {x:route[0][1],z:route[0][2],y:route[0][3]||0,speed:0,yaw:0,distance:0};
  let travelled=0;
  for(let i=0;i<route.length-1;i++) {
    const a=route[i],b=route[i+1];
    const dx=b[1]-a[1],dz=b[2]-a[2],length=Math.hypot(dx,dz),dt=b[0]-a[0];
    if(t>=b[0]){travelled+=length;continue;}
    const u=clamp((t-a[0])/dt);
    // Integrated trapezoidal speed profile, normalized to cover the segment.
    const ramp=.12;
    let d,v;
    if(u<ramp){d=u*u/(2*ramp);v=u/ramp;}
    else if(u>1-ramp){const q=1-u;d=1-ramp-q*q/(2*ramp);v=q/ramp;}
    else {d=u-ramp/2;v=1;}
    d/=1-ramp;v/=(1-ramp);
    return {
      x:mix(a[1],b[1],d),
      z:mix(a[2],b[2],d),
      y:mix(a[3]||0,b[3]||0,smooth(u)),
      speed:length/dt*v,
      yaw:length>.001?Math.atan2(dx,dz):0,
      distance:travelled+length*d,
      segment:i,
    };
  }
  const b=route.at(-1);
  return {x:b[1],z:b[2],y:b[3]||0,speed:0,yaw:0,distance:travelled,segment:route.length-1};
}

/**
 * One complete left/right gait cycle corresponds to one measured stride.
 * During stance, z decreases exactly with root distance. Consequently
 * the planted shoe stays at the same world point on straight travel.
 */
export function gaitAt(distance,speed,side,stride=.78) {
  if(speed<.015)return {x:side*.155,y:.095,z:.065,swing:false,phase:0};
  const phase=mod(distance/stride+(side>0?.5:0),1);
  const stance=.64;
  const reach=stride*stance;
  if(phase<stance) {
    return {
      x:side*.155,
      y:.095,
      z:reach*.5-phase*stride,
      swing:false,
      phase,
    };
  }
  const u=(phase-stance)/(1-stance);
  return {
    x:side*.155,
    y:.095+Math.sin(Math.PI*u)*Math.min(.16,.065+speed*.07),
    z:mix(-reach*.5,reach*.5,smooth(u)),
    swing:true,
    phase,
  };
}

const hold=(a,b,x,z,y=0)=>[[a,x,z,y],[b,x,z,y]];
export const castDefinitions = [
  {
    id:'dock-worker',role:'resident',color:0x39777b,hat:'cap',hair:0x4b3328,
    route:[[0,-5,24],[11,-9,43],[24,-10,57],[25,-5,-2],[34,-5,4],[76,-5,4],[83,-5,7],[90,-8.45,16],[94,-8.45,23],[109,-8,31],[133,-9,58],[222.667,-9,58]],
    facing:.3,
  },
  {
    id:'resident-woman',role:'resident',color:0x997b94,hair:0x41312b,
    route:[[0,10,23],[13,11.2,45],[24,12.6,58],[25,4,1],[77,4,5],[85,4,5],[98,12.8,26],[106,29,27],[113,29,42],[136,29,64],[222.667,29,64]],
    facing:-.3,
  },
  {
    id:'street-porter',role:'resident',color:0x7d7158,hat:'cap',hair:0x755038,
    route:[[0,-10,23],[15,-11,46],[24,-11,55],[25,5,-2],[78,5,3],[84,5,3],[90,9.7,10],[104,10,29],[133,10,60],[222.667,10,60]],
    facing:1,
  },
  {
    id:'child',role:'child',color:0xb56555,hair:0x503727,scale:.73,
    route:[[0,-10.8,25],[24,-10.8,62],[25,-8,-6],[60,-8,-6],[65,-5.9,-8.3],[70,-5.9,-8.3],[78,-10.8,1],[84,-10.8,1],[89,-15.6,12],[93,-15.6,23],[99,-13.2,25],[107,-12.2,32],[132,-11,53],[222.667,-11,53]],
    facing:-.4,
  },
  {
    id:'tank-worker',role:'painter',color:0x536c8a,hat:'cap',hair:0x49352b,
    route:[[0,-8,-5],[24,-8,-5],[25,-3.5,-8],[61,-3.5,-8],[66,-3.5,-8],[70,-3.9,-8.4],[76,-3.9,-8.4],[85,-8,-2],[89,-10.5,1],[93,-14.8,12],[103,-14.8,24],[110,-10.5,31],[137,-10,56],[222.667,-10,56]],
    facing:Math.PI,
  },
  {
    id:'distiller',role:'distiller',color:0x8d737f,hair:0x65482e,
    route:hold(0,222.667,-22,-2,.36),facing:.2,
  },
  {
    id:'distillery-assistant',role:'assistant',color:0x738b7b,hat:'cap',hair:0x574132,
    route:[[0,-25,.8],[43,-25,.8],[54,-23,.8],[222.667,-23,.8]],facing:-.5,
  },
  {
    id:'survivor',role:'survivor',color:0x497d7a,hair:0x4b362b,
    route:[[0,-1,13],[18,-.4,13.5],[24,-.4,13.5],[25,-2,10],[84,-2,10],[96,-1,12],[136,-1,12],[146,1.5,14.6],[150,3.1,15.4,.72],[222.667,3.1,15.4,.72]],
    facing:1,
  },
  {
    id:'policeman',role:'rescuer',color:0x3c596a,hat:'police',hair:0x513b2c,
    route:[[0,4,16,.72],[24,4,16,.72],[25,8,43],[131,8,43],[133,3.2,43],[137,3.2,25],[139,4.5,17,.72],[146,4.5,17,.72],[178,4.5,17,.72],[184,4.7,18,.72],[222.667,4.7,18,.72]],
    facing:-1.7,
  },
  {
    id:'sailor',role:'rescuer',color:0xd6cbb2,hat:'sailor',hair:0x5b402e,
    route:[[0,5.5,17,.72],[24,5.5,17,.72],[25,4.8,38],[132,4.8,38],[138,4.7,24],[141,5.6,17,.72],[177,5.6,17,.72],[188,5.8,18,.72],[222.667,5.8,18,.72]],
    facing:-1.8,
  },
  {
    id:'firefighter',role:'rescuer',color:0x806747,hat:'fire',hair:0x4c3525,
    route:[[0,6.7,18,.72],[24,6.7,18,.72],[25,11,39],[133,11,39],[136,9.7,24],[138,9.7,24],[141,4.4,24],[143,4.4,20,.72],[146,6.8,18,.72],[177,6.8,18,.72],[188,6.7,19,.72],[222.667,6.7,19,.72]],
    facing:-1.9,
  },
  {
    id:'volunteer',role:'volunteer',color:0xd1c1af,hair:0x614535,
    route:[[0,4.6,19,.72],[24,4.6,19,.72],[25,.5,42],[134,.5,42],[136,3.6,40],[143,3.1,20.5,.72],[222.667,3.1,20.5,.72]],
    facing:-1.7,
  },
  {
    id:'inspector',role:'inspector',color:0x577a89,hair:0x61452d,glasses:true,
    route:hold(0,222.667,-20,30.3,.56),facing:2.2,
  },
  {
    id:'clerk',role:'clerk',color:0xa1888e,hair:0x443329,
    route:hold(0,222.667,-16.7,27.7,.56),facing:-.5,
  },
];

export function actorState(def,t) {
  const m=routeSample(def.route,t);
  m.y=groundAt(m.x,m.z);
  const moving=m.speed>.015&&!(t>=22.5&&t<25);
  const disaster=t<24 || t>=85;
  let action=moving?'walk':'idle';
  if(def.role==='painter'&&t>=70&&t<=76)action='paint';
  if(def.role==='child'&&t>=64&&t<=70)action='pail';
  if(def.role==='survivor'&&disaster&&t<147&&!moving)action='brace';
  if(['rescuer','volunteer'].includes(def.role)&&t>=139&&t<150&&!moving)action='pull';
  if(def.id==='policeman'&&t>=182&&t<=191&&!moving)action='hose';
  if(def.role==='inspector'&&t>=154&&t<=173)action='measure';
  if(def.role==='distiller'&&t>=44&&t<57&&!moving)action='work';
  return {...m,action,walking:moving,yaw:moving?m.yaw:def.facing||0,disaster};
}
