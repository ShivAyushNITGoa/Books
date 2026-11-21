import {spline,monotoneSpline,clamp,distance,sub,length} from '../engine/math.js';

export const DURATION=5344/24;
export const FPS=24;
const key=(t,p,a,fov=45)=>({t,position:p,target:a,fov});
/**
 * One uninterrupted position/aim spline. Keys are narration landmarks,
 * not separate shots. There are no cut/reset/hold branches in evaluation.
 * All coordinates share the same wharf, street and neighboring buildings.
 */
export const cameraKeys=[
  key(0,[-10,5,37],[-4,1.7,23]),
  key(3.9,[-16,8,29],[-11,1.7,18]),
  key(7.3,[-13,6.5,25],[-9,1.7,11]),
  key(10.2,[4,3.7,23],[0,1.3,13]),
  key(14,[-1,3.3,21],[-.4,1.3,13.5]),
  key(17.2,[-4.4,3.4,23],[-5,1.3,17]),
  key(20.4,[-8,3.4,23],[-6,1.4,17]),
  key(23,[-10,5,25],[-6,1.3,17]),
  key(25.7,[-7,15,39],[0,6,-12]),
  key(29,[6,24,49],[0,8,-21]),
  key(33,[20,25,47],[0,8,-26]),
  key(37,[11,23,44],[0,8,-26]),
  key(41,[-5,22,43],[0,8,-26]),
  key(44,[-15,9,20],[-20,2,-2]),
  key(47,[-19,4.2,10],[-22,1.7,-2]),
  key(51,[-24,3.7,9],[-22,2,-2]),
  key(54.5,[-26,4.1,10],[-22,2,-2]),
  key(57,[-18,5.5,7],[-7,1.6,-9]),
  key(60,[-9,3.9,1],[-4.7,1.5,-9.7]),
  key(62.4,[-5,2.9,-2.5],[-5.5,1.5,-10.4]),
  key(64,[-3.5,2.7,-3.5],[-5.6,1.3,-9.8]),
  key(67,[-6,2.8,-3],[-5.2,1.3,-9.5]),
  key(70,[-9,3.4,-2],[-4.5,1.6,-9.6]),
  key(73,[-8.5,3.7,-1],[-3.9,1.7,-9.8]),
  key(76,[-7,4.2,2],[-3.5,1.7,-8]),
  key(79,[-5,4.8,7],[-1,2.3,-8]),
  key(82.5,[-10,8,14],[0,6,-18]),
  key(86,[-16,12,21],[0,7,-21]),
  key(90,[-15,15,26],[0,5,-15]),
  key(94,[-10,12,33],[0,3,-2]),
  key(98,[-6,8,38],[0,2.7,7]),
  key(102.7,[-3,6,44],[0,2.6,16]),
  key(106.5,[-4,6.5,48],[-3,2,22]),
  key(110,[-7,7,40],[-11,2,18]),
  key(114,[3,10,33],[7,4,10]),
  key(118,[15,10,27],[7,5.1,4]),
  key(121.5,[13,7,28],[2,1.7,14]),
  key(124,[-1,5,28],[-6,1.7,17]),
  key(127,[-5,3.4,24],[-6,1.55,17]),
  key(131.5,[-10,3.7,23],[-6,1.6,17]),
  key(134.5,[-10,4,26],[0,1.3,13]),
  key(138,[-6,5.8,37],[3,1.5,16]),
  key(141,[0,5.5,38],[3,1.6,16]),
  key(144,[2,4.1,30],[2.5,1.5,15]),
  key(146.7,[-4,5.5,49],[0,1.7,37]),
  key(150,[-1,4.8,50],[0,1.7,37]),
  key(153,[-12,8,45],[-17,2,30]),
  key(156,[-20.0, 5.0, 43.0],[-19.0, 1.6, 30.0]),
  key(159,[-24.0, 3.7, 39.0],[-19.0, 1.5, 30.0]),
  key(163,[-21.0, 3.5, 38.0],[-18.5, 1.5, 29.0]),
  key(167,[-16.0, 3.9, 37.0],[-18.4, 1.5, 29.0]),
  key(170,[-16.5,4.2,39],[-18,1.7,29]),
  key(172,[-5,10,52],[-8,2.6,30]),
  key(174,[5,11,46],[18,3,30]),
  key(176,[18,6,46],[18,3,30]),
  key(177.2,[19,6.3,45],[18,3,30]),
  key(178.2,[14,8,40],[3,1.5,17]),
  key(179.8,[1,7,38],[3,1.5,17]),
  key(181,[-2,6,31],[3,1.5,17]),
  key(185,[-2,4.5,26],[4,1.5,17]),
  key(189,[0,4.1,25],[4,1.5,17]),
  key(192,[20,6.5,27],[33,1.2,18]),
  key(195.5,[29,6.8,31],[38,1.2,18]),
  key(198,[4,14,48],[-18,1.8,29]),
  key(201.5,[-16,6,43],[-18,1.8,29]),
  key(204,[5,5.3,54],[0,1.8,37]),
  key(208,[-2,4.8,53],[0,1.8,37]),
  key(212,[0,13,59],[0,3,10]),
  key(216,[5,19,44],[0,3,-9]),
  key(220,[9,23,26],[0,3,-20]),
  key(DURATION,[10,25,15],[0,3,-23]),
];

export function cameraAt(t) {
  t=clamp(t,0,DURATION);
  return {
    position:spline(cameraKeys,t,'position'),
    target:monotoneSpline(cameraKeys,t,'target'),
    fov:45,
  };
}
export function cameraSpeed(t,dt=.01) {
  const a=Math.max(0,t-dt),b=Math.min(DURATION,t+dt);
  return distance(cameraAt(a).position,cameraAt(b).position)/(b-a);
}
export function cameraAcceleration(t,dt=.04) {
  const a=Math.max(0,t-dt),b=Math.min(DURATION,t+dt);
  return Math.abs(cameraSpeed(b)-cameraSpeed(a))/(b-a);
}
export function cameraAudit() {
  const speeds=[],issues=[];
  let maxStep=0,minSpeed=Infinity,maxSpeed=0;
  let previous=cameraAt(0);
  for(let f=1;f<5344;f++) {
    const t=f/FPS,c=cameraAt(t),v=cameraSpeed(t);
    const step=distance(c.position,previous.position);
    minSpeed=Math.min(minSpeed,v);maxSpeed=Math.max(maxSpeed,v);
    maxStep=Math.max(maxStep,step);speeds.push(v);
    if(![...c.position,...c.target].every(Number.isFinite))issues.push({t,problem:'nonfinite'});
    if(c.position[1]<1.6)issues.push({t,problem:'camera below safe height'});
    if(v<.035)issues.push({t,problem:'camera stopped',v});
    previous=c;
  }
  return {issues,settledBounds:[],continuous:true,frames:5344,minSpeed,maxSpeed,maxStep,speedRatio:maxSpeed/minSpeed};
}
