import {clamp,smooth,mix} from '../engine/math.js';

export const LOCATIONS={
  tank:[0,0,-26],
  leak:[-5.6,0,-10.9],
  distillery:[-22,.36,-2],
  rescue:[4.8,.72,17.5],
  demonstration:[-6,.36,17],
  investigation:[-18.5,.56,29],
  courthouse:[18,.46,35],
  harbor:[36,0,18],
  memorial:[0,.18,37],
};
export const STREET={minX:-11,maxX:11,minZ:-12,maxZ:68};
export const BUILDING_EXCLUSIONS=[
  {minX:-30,maxX:-14,minZ:-10,maxZ:4,kind:'distillery'},
  {minX:12,maxX:26,minZ:30,maxZ:40,kind:'courthouse'},
];
export function groundAt(x,z) {
  if(x>30||z<-48)return -.85;
  const refugeRadius=Math.hypot((x+1)/2,(z-13)/3);
  if(refugeRadius<1)return .22*(1-smooth((refugeRadius-.7)/.3));
  if(x>=2.8&&x<=7.8&&z>=14&&z<=21)return .72;
  if(x>=2.8&&x<=7.8&&z>21&&z<25)return .72*(25-z)/4;
  if(x>=.5&&x<2.8&&z>=14&&z<=16.4)return .72*(x-.5)/2.3;
  if(x>=-23&&x<=-14&&z>=26&&z<=33)return .56;
  if(x>=-30&&x<=-14&&z>=-10&&z<=4)return .36;
  if(x>=12&&x<=26&&z>=30&&z<=40)return .46;
  if(Math.abs(x)>=9.4)return .28;
  return 0;
}
/** Explicit narrative rewind, not a geography reset or disguised camera cut. */
export function episodeTime(t) {
  if(t<22.5)return 9+t*.6;
  if(t<25)return mix(22.5,-8,smooth((t-22.5)/2.5));
  if(t<85)return -8;
  return t-85;
}
export function floodFrontAt(t) {
  const e=episodeTime(t);
  return e<0?-40:-10+Math.min(e,34)*2.4;
}
export function fluidHeightAt(x,z,t) {
  const e=episodeTime(t);
  if(e<0)return -.2;
  const front=floodFrontAt(t);
  const age=e-(z+10)/2.4;
  if(z>front+4.5||Math.abs(x)>25.5)return -.2;
  const streetWeight=1-smooth((Math.abs(x)-7.5)/17);
  const arrived=smooth((front-z+2.5)/4.5);
  const longPool=.43+.34*Math.exp(-Math.max(0,age)/28);
  const edgeFactor=.35+.65*(1-smooth((Math.abs(x)-3)/8));
  const crest=4.5*Math.exp(-Math.pow((z-front)/2.5,2))*edgeFactor;
  const trailing=1.05*Math.exp(-Math.pow((z-(front-8))/4.5,2))
    +.65*Math.exp(-Math.pow((z-(front-17))/6,2));
  const waveDecay=Math.exp(-Math.max(0,e-32)/12);
  const swirl=.045*Math.sin(x*.8+z*.34-t*1.4)
    +.025*Math.sin(x*1.6-z*.7+t*.8);
  let h=arrived*streetWeight*(longPool+(crest+trailing)*waveDecay+swirl);
  // Washing removes depth gradually in the working zone, never clears all streets.
  const cleanup=smooth((t-179)/40);
  const washed=Math.exp(-Math.pow((x-3)/8,2)-Math.pow((z-18)/14,2));
  h*=1-cleanup*washed*.67;
  const sheltered=Math.exp(-Math.pow((x+1)/3.7,2)-Math.pow((z-13)/4.5,2));
  h*=1-.63*sheltered;
  const refuge=Math.hypot((x+1)/3,(z-13)/4);
  const refugeWeight=1-smooth((refuge-.7)/.65);
  h=mix(h,Math.min(h,.48),refugeWeight);
  return Math.max(.12*arrived*streetWeight,h)-.08;
}
export function floodDepthAt(x,z,t) {
  return Math.max(0,fluidHeightAt(x,z,t)-groundAt(x,z));
}
export function residueAt(x,z,t) {
  if(episodeTime(t)<0)return 0;
  const arrived=smooth((floodFrontAt(t)-z+2)/4);
  return arrived*(1-smooth((Math.abs(x)-8)/18));
}
export function narrativePhase(t) {
  if(t<22.5)return 'COLD OPEN · THE FLOOD';
  if(t<25)return 'REWIND · BEFORE THE RUPTURE';
  if(t<56.7)return 'JANUARY 15, 1919 · BEFORE THE FAILURE';
  if(t<76.4)return 'THE WARNINGS';
  if(t<85)return 'AROUND 12:30 P.M.';
  if(t<121.5)return 'RUPTURE AND INUNDATION';
  if(t<146.7)return 'ESCAPE AND RESCUE';
  if(t<153)return '21 LIVES LOST';
  if(t<173)return 'INVESTIGATION';
  if(t<178)return 'LATER · THE LEGAL FINDING';
  if(t<196)return 'BACK TO 1919 · THE CLEANUP';
  return 'ACCOUNTABILITY AND REMEMBRANCE';
}

/** Physical opaque building blocks shared by construction and clearance tests. */
export const WAREHOUSES=[
  [-22,-20,13,13,10,0x915e49],[-38,12,14,8,9,0xa57054],
  [-36,46,15,11,11,0x996b56],[-35,62,16,12,10,0xac8060],
  [20,-16,12,12,9,0x8f6756],[20,1,12,12,11,0xa4775c],
  [21,54,13,12,10,0x9c7358],[21,69,13,12,12,0x8d614e],
];
export function warehouseCollision(position,clearance=.2) {
  const [x,y,z]=position;
  return WAREHOUSES.find(([bx,bz,w,d,h])=>
    Math.abs(x-bx)<w/2+clearance&&Math.abs(z-bz)<d/2+clearance&&y<h+.4+clearance);
}

/** Table surfaces are shared by construction and torso-clearance regression. */
export const TABLETOPS={
  distillery:{x:-22,y:1.48,z:-.5,width:5,depth:1.55,height:.17},
  investigation:{x:-18.5,y:1.66,z:29,width:4.4,depth:1.8,height:.18},
  demonstration:{x:-6,y:1.28,z:17,width:3.8,depth:1.8,height:.15},
};
export function tableLocal(id,origin) {
  const t=TABLETOPS[id];
  return [[t.x-origin.x,t.y-origin.y,t.z-origin.z],[t.width,t.height,t.depth]];
}
export const RAIL_POSTS=Array.from({length:9},(_,i)=>-14+i*9)
  .filter(z=>z!==4).flatMap(z=>[5.75,8.25].map(x=>[x,z]));
