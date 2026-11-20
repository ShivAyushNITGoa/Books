export const DURATION=65.04166666666667;
export const clamp=(v,a=0,b=1)=>Math.max(a,Math.min(b,v));
export const smooth=v=>{v=clamp(v);return v*v*(3-2*v)};
// New independent, time-parametrized C1 Hermite curves. Camera is NOT an offset
// of the recorder. They take different paths and cross different compass sides.
// time, recorder XYZ, camera XYZ, independent aim XYZ
export const BLOCKING=[
 [0, -7,1.8,-4, -1,6.4,8, -5.8,2.3,-5.3],
 [3.4, -7,1.8,-4, -12,4.8,4, -7.8,2.1,-4],
 [7.9, -4.8,1.8,-7, -14,8,-1, -2.7,3,-8.5],
 [12.6, -1,1.8,-8, -4,7.5,-18, -.5,2.8,-7.1],
 [17.4, 3,1.8,-6, 12,6.3,-13, 3.9,2.4,-5.5],
 [21.5, 5,1.8,-3.5, 13,5,1, 4.1,2.4,-3.7],
 [25.9, 7,1.8,-.8, 5,7.5,10, 6.1,2,-1.2],
 [29.6, 7,1.5,4.2, 15,6,8, 6.2,2,4.9],
 [32.5, 4,.1,8, 8,2,15, 4.9,.7,7.9],
 [35.5, 1,.1,8.2, -3,1.8,13, .1,.65,8.5],
 [39.1, -4,1.8,8, -12,4.8,12, -4.9,2.2,7.5],
 [42.5, -7,1.8,6, -13,5.8,-1, -7.9,2.3,6.6],
 [46.2, -9,1.8,2, -3,5,-1, -8.0,2.1,2.6],
 [49.8, -9,1.35,0, -14,3.3,-5, -8.3,1.9,-.2],
 [53.5, -7,1.8,-1.5, -13,6.5,4, -7.9,2.2,-1.7],
 [57.8, -5,1.8,-2, -8,7.5,8, -3.9,2.8,-2.5],
 [61.8, -3,1.8,-1.5, 3,5.5,5, -3.8,2.3,-1.8],
 [DURATION, -3,1.8,-1.5, 2,4.5,3, -2.4,2.15,-1.3]
];
function sample(t,from){
 let i=0;while(i<BLOCKING.length-2&&t>BLOCKING[i+1][0])i++;
 const a=BLOCKING[i],b=BLOCKING[i+1],p=BLOCKING[Math.max(0,i-1)],n=BLOCKING[Math.min(BLOCKING.length-1,i+2)];
 const dt=b[0]-a[0],u=clamp((t-a[0])/dt),u2=u*u,u3=u2*u;
 return [0,1,2].map(k=>{const j=from+k;
  const m0=i===0?0:(b[j]-p[j])/(b[0]-p[0])*.72;
  const m1=i+1===BLOCKING.length-1?0:(n[j]-a[j])/(n[0]-a[0])*.72;
  return (2*u3-3*u2+1)*a[j]+(u3-2*u2+u)*dt*m0+(-2*u3+3*u2)*b[j]+(u3-u2)*dt*m1;
 });
}
export function stateAt(time){
 if(!Number.isFinite(time))throw Error('Finite time required');const t=clamp(time,0,DURATION);
 const hero=sample(t,1),eye=sample(t,4),aim=sample(t,7),before=sample(Math.max(0,t-.025),1),after=sample(Math.min(DURATION,t+.025),1);
 const heading=Math.atan2(after[0]-before[0],after[2]-before[2]);
 return {t,hero,eye,aim,heading,
  orange:smooth((t-3.38)/1.0)-smooth((t-19.0)/1.25)+smooth((t-38.65)/1.2),
  underwater:smooth((t-30.6)/1.4)*(1-smooth((t-36.5)/1.7)),
  reflection:smooth((t-42.85)/.8),beacon:smooth((t-46.65)/.9),
  chapter:t<8.292937?1:t<17.640687?2:t<26.094458?3:t<33.131813?4:t<42.81625?5:t<50.71275?6:t<57.842979?7:8};
}
// Actual character extents include arms/helmet, not just the face center.
export const PEOPLE=[
 {id:'designer',x:-13.0,z:-.25,height:2.85,radius:.9,kind:'engineer'},
 {id:'pilot',x:4.5,z:-16.3,height:2.8,radius:.9,kind:'pilot'},
 {id:'investigator',x:11.55,z:-6.5,height:2.8,radius:.9,kind:'search'},
 {id:'forest-search',x:15.7,z:-4.1,height:2.8,radius:.9,kind:'search'},
 {id:'colour-engineer',x:-13.6,z:1.5,height:2.85,radius:.9,kind:'engineer'},
 {id:'recovery',x:-16.5,z:.25,height:2.8,radius:.9,kind:'search'}
];
export const RECORDER_RADIUS=1.82; // carrier + protruding beacon, worst orientation
export function clearance(s,p){return Math.hypot(s.hero[0]-p.x,s.hero[2]-p.z)-RECORDER_RADIUS-p.radius}
