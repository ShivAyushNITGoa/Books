export const DURATION=60;
export const clamp=x=>Math.max(0,Math.min(1,x));
export const smooth=x=>{x=clamp(x);return x*x*(3-2*x)};
export const mix=(a,b,u)=>a+(b-a)*u;
export const ramp=(t,a,b)=>smooth((t-a)/(b-a));
export const vMix=(a,b,u)=>a.map((x,i)=>mix(x,b[i],u));
// [camera start, camera end, look-at start, look-at end, field of view].
export const SHOTS=[
 ['buried-world',[7,-9,16],[3,-10.5,12],[0,-12.5,-2],[-1,-12.5,-4],46],
 ['cleopatra',[2.2,4.5,2],[.5,4.3,1],[0,3.3,-4],[0,3.35,-4],42],
 ['alexandria',[22,21,40],[17,18,34],[0,7,-15],[0,6,-12],49],
 ['royal-quarter',[9,6.8,9],[-5,6,13],[0,3.3,-10],[-1,3,-8],45],
 ['fracture',[4,3.5,9],[-2,3,7],[0,1.4,-1],[0,.6,-2],48],
 ['earthquake',[16,8,19],[10,6,15],[0,1,-8],[0,-.5,-7],48],
 ['submergence',[9,4,20],[7,-5,15],[0,-2,-8],[0,-8,-8],49],
 ['collapse',[8,-8,11],[3,-10,9],[0,-12,-5],[-1,-13,-4],49],
 ['centuries',[-1,-10,14],[-6,-10.8,12],[-2,-13,-5],[-2,-13,-5],47],
 ['expedition',[5,3,13],[4,-8,13],[0,-1,0],[0,-10,0],48],
 ['discovery',[6,-11,9],[3,-11.2,7],[-1,-12.6,-2],[-2,-12.6,-2],47],
 ['monuments',[-8,-9.5,14],[1,-9,17],[-1,-13,-5],[-1,-12,-6],49],
 ['survey',[5,-13,7],[7,-12,9],[1,-14.5,1.8],[1,-14,1.8],48],
 ['remembered-world',[9,9,19],[14,12,25],[0,2,-10],[0,2,-10],44],
 ['still-waiting',[3,-11,10],[8,-7.5,23],[-1,-13,-5],[-1,-12,-7],49]
].map((s,i)=>({id:s[0],start:i*4,end:i*4+4,from:s[1],to:s[2],look:s[3],lookTo:s[4],fov:s[5]}));
export function stateAt(time){
 if(!Number.isFinite(time))throw Error('Frame time must be finite');
 const t=Math.max(0,Math.min(DURATION-1e-7,time)),index=Math.floor(t/4),shot=SHOTS[index],u=(t-shot.start)/4;
 const modern=index>=9&&index!==13;
 const submerged=index===0||index>=7&&index!==13;
 const sinking=index>=4&&index<=6;
 return {t,index,shot,u,modern,submerged,sinking,ancient:!submerged,storm:index===5||index===6,
  sink: index<=3||index===13?0:index===4?mix(0,-1.5,smooth(u)):index===5?mix(-1.5,-4,smooth(u)):index===6?mix(-4,-16,smooth(u)):-16,
  collapse: index===7?smooth(u):index>=8||index===0?1:0,
  camera:vMix(shot.from,shot.to,smooth(u)),look:vMix(shot.look,shot.lookTo,smooth(u))};
}
