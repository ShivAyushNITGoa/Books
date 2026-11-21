export const DURATION=65.04166666666667;
export const clamp=(x,a=0,b=1)=>Math.max(a,Math.min(b,x));
export const smooth=x=>{x=clamp(x);return x*x*(3-2*x)};
// Metres in one geographic world. These are independent hypothetical examples,
// not exhibits in a shared building, and not one recorder crashing twice.
export const SITES={
 factory:{id:'factory',name:'Factory · design & testing',p:[0,9.91,0],ground:8,indoors:true},
 forest:{id:'forest',name:'Remote forest · crash search',p:[420,12.55,-180],ground:12,indoors:false},
 ocean:{id:'ocean',name:'Open ocean · submerged recorder',p:[1180,-13.9,320],ground:-14.4,indoors:false},
 rescue:{id:'rescue',name:'Coastal rescue pier · recovery',p:[835,4.41,760],ground:2.5,indoors:false},
 airport:{id:'airport',name:'Airport apron · built to stand out',p:[130,10.49,650],ground:8,indoors:false}
};
// Camera world XYZ and independently authored aim XYZ. Continuous aerial travel
// spans hundreds of metres; it is deliberately time-compressed to the script.
export const KEYS=[
 [0,-6,12.5,8,.7,10.1,0],[3.4,-8,11,2,-.4,10.0,.2],
 [7.8,-6,13,-8,.8,10.2,-.6],[12.8,7,13.5,-7,-.5,10.3,.2],
 [17.4,8,12.5,5,-.7,10.3,-.4],[21.7,2,11,8,.7,10,0],
 [23.8,0,12.8,12,0,10.3,0],
 [24.1,0,13.6,23,0,12,45],
 [25.0,115,90,30,140,20,-20],[25.8,315,125,-75,330,16,-130],
 [26.7,408,35,-164,420,12.8,-180],[27.4,412,16.5,-173,420.6,12.9,-180],
 [29.1,428,16.3,-174,419.3,12.9,-180.3],[30.0,423,17,-169,420.6,12.8,-180],
 [30.4,600,150,-60,640,6,20],[30.9,1000,120,200,1090,-2,260],
 [31.4,1160,22,320,1180,-10,320],[31.8,1170,2.5,329,1180,-13.4,320],
 [32.3,1172,-10.2,329,1180.5,-13.4,320],
 [34.0,1187,-9.8,328,1179.3,-13.5,320.3],
 [36.0,1188,-11.0,312,1179.5,-13.4,320],
 [37.2,1174,-10.3,311,1180.5,-13.6,320],
 [38.2,1175,5,340,1180,-10,320],[39.0,1080,130,580,980,3,650],
 [40.2,855,16,755,835,4.3,760],[40.8,827,8.1,769,835.6,4.4,760],
 [42.3,829,8.5,752,834.5,4.5,760.3],[45.0,842,9,753,834.4,4.5,760],
 [45.6,844,9,767,834.4,4.6,760],
 [46.1,955,120,680,1040,2,560],[46.7,1150,60,395,1180,-5,320],
 [47.1,1170,6,332,1180,-12,320],[47.5,1172,-10,328,1180.6,-13.5,320],
 [49.8,1187,-10.4,313,1179.4,-13.5,320],
 [50.3,1170,8,345,1180,-9,320],[50.8,1000,150,450,700,12,540],
 [51.6,310,150,745,230,8,700],
 [52.7,144,30,662,130,10.7,650],[53.5,122,14.5,657,130.6,10.7,650],
 [55.8,138,16.3,656,129.4,10.7,650.3],[58,138,15.3,643,129.4,10.8,650],
 [61.5,124,14.3,642,130.6,10.7,650],[DURATION,122,13.7,656,130.5,10.7,649.8]
];
export const FOCUS=[['factory',0,23.7],['forest',27.3,30.0],['ocean',32.2,37.3],['rescue',40.7,45.6],['ocean',47.5,49.8],['airport',53.4,DURATION+.6]];
function sample(t,from){
 let i=0;while(i<KEYS.length-2&&t>KEYS[i+1][0])i++;
 const a=KEYS[i],b=KEYS[i+1],dt=b[0]-a[0],u=clamp((t-a[0])/dt),u2=u*u,u3=u2*u;
 function tangent(index,j){if(index===0||index===KEYS.length-1)return 0;const p=KEYS[index-1],v=KEYS[index],n=KEYS[index+1],l=(v[j]-p[j])/(v[0]-p[0]),r=(n[j]-v[j])/(n[0]-v[0]);return l*r<=0?0:.8*2*l*r/(l+r)}
 return [0,1,2].map(k=>{const j=from+k;return (2*u3-3*u2+1)*a[j]+(u3-2*u2+u)*dt*tangent(i,j)+(-2*u3+3*u2)*b[j]+(u3-u2)*dt*tangent(i+1,j)})
}
export function stateAt(time){if(!Number.isFinite(time))throw Error('Finite time required');const t=clamp(time,0,DURATION);let id=t<25.5?'factory':t<30.6?'forest':t<39?'ocean':t<45.9?'rescue':t<51?'ocean':'airport',weight=0;for(const [s,a,b] of FOCUS){const w=smooth((t-a)/.22)*smooth((b-t)/.22);if(w>weight){weight=w;id=s}}
 return {t,eye:sample(t,1),aim:sample(t,4),site:id,hero:SITES[id].p,focus:weight,travel:1-weight,
 orange:smooth((t-3.4)/.9)-smooth((t-19)/1.3)+smooth((t-39.5)/1.0),reflect:smooth((t-42.85)/.8),beacon:smooth((t-46.7)/.8),
 chapter:t<8.292937?1:t<17.640687?2:t<26.094458?3:t<33.131813?4:t<42.81625?5:t<50.71275?6:t<57.842979?7:8};}
export const PEOPLE=[
 {id:'factory-engineer',site:'factory',x:-11.5,y:8.06,z:1.5,radius:.85,kind:'engineer'},
 {id:'factory-technician',site:'factory',x:3.5,y:8.06,z:-9.5,radius:.85,kind:'engineer'},
 {id:'forest-search',site:'forest',x:425.5,y:12,z:-184,radius:.85,kind:'search'},
 {id:'forest-investigator',site:'forest',x:415,y:12,z:-179,radius:.85,kind:'search'},
 {id:'rescue-engineer',site:'rescue',x:827.5,y:2.54,z:765,radius:.85,kind:'engineer'},
 {id:'airport-crew',site:'airport',x:142.5,y:8.11,z:653.5,radius:.85,kind:'search'}
];
export const RECORDER_RADIUS=1.45;
export function clearance(site,p){const q=SITES[site].p;return Math.hypot(q[0]-p.x,q[2]-p.z)-RECORDER_RADIUS-p.radius}
