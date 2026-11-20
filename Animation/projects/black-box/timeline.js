export const clamp=(v,a=0,b=1)=>Math.max(a,Math.min(b,v));
export const mix=(a,b,t)=>a+(b-a)*t;
export const smooth=t=>{t=clamp(t);return t*t*(3-2*t)};
// One continuous, differentiable camera/recorder trajectory, never a shot switch.
// Smoothstep blends make velocity zero at held teaching positions (no teleport).
export const KEYS=[
 [0,0,3,7,5.5,13], [3.5,.8,3,6,5.2,11.5], [7.9,3,3,6,5.4,12],
 [11.0,11,3.2,5,6,16], [16.5,17,3,-4,5,13],
 [20,24,3,-5,4.8,11], [23.4,27,3,-3,5,11],
 [27.0,34,2.5,5,7,15], [29.9,42,2.2,4,6,13],
 [32.2,50,0.6,2,1.5,9], [35.6,54,0.5,-3,1.5,10],
 [38.7,60,2.5,-4,5,13], [42.1,64,3.1,5.2,4.5,10.5],
 [46.4,72,3.1,6,4.7,11], [49.9,77,1.5,5.8,3.5,11],
 [53.2,84,2.9,5.5,5.0,12], [57.3,90,3,6.5,5.5,13],
 [61.5,98,3,5.2,4.6,11.2], [65.04166666666667,101,3,5.2,4.6,11.2]
];
export function stateAt(t){
 if(!Number.isFinite(t))throw Error('Finite time required');t=clamp(t,0,KEYS.at(-1)[0]);
 let i=0;while(i<KEYS.length-2&&t>KEYS[i+1][0])i++;
 const a=KEYS[i],b=KEYS[i+1],s=smooth((t-a[0])/(b[0]-a[0]));
 const v=a.slice(1).map((x,j)=>mix(x,b[j+1],s));
 const [x,y,dx,dy,dz]=v;
 return {t,x,y,eye:[x+dx,y+dy,dz],target:[x,y+.5,0],
 orange:smooth((t-3.4)/.9)-smooth((t-19.1)/1.3)+smooth((t-38.7)/1.3),
 underwater:smooth((t-30.7)/1.8)*(1-smooth((t-36.4)/2.0)),
 reflect:smooth((t-42.8)/1.0),beacon:smooth((t-46.5)/1.0),
 chapter:t<8.292937?1:t<17.640687?2:t<26.094458?3:t<33.131813?4:t<42.81625?5:t<50.71275?6:t<57.842979?7:8};
}
