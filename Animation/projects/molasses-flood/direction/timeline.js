export const clamp=(x,a=0,b=1)=>Math.min(b,Math.max(a,x));
export const smooth=x=>{x=clamp(x);return x*x*(3-2*x)};
export function stateAt(t,shots){const s=shots.find(x=>t>=x.start&&t<x.end)||shots[t<0?0:shots.length-1];const u=clamp((t-s.start)/Math.min(1.1,(s.end-s.start)*.3));const k=smooth(u);return {...s,t,settled:u>=1,camera:s.position.map((x,i)=>x+(s.to[i]-x)*k),aim:s.target.map((x,i)=>x+(s.targetTo[i]-x)*k)};}
