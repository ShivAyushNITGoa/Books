import * as T from '../../engine/vendor/three.module.js';
import {texture,random,round,line,ellipse,poly} from '../alexandria/art.js';
import {batchStatic} from '../alexandria/batch.js';
export function buildWorld(scene){
 const root=new T.Group();scene.add(root);const rng=random(8741),cache=new Map();
 const mat=(color,shininess=14)=>{const key=color+shininess;if(!cache.has(key))cache.set(key,new T.MeshPhongMaterial({color,shininess,specular:'#6a838d'}));return cache.get(key)};
 const C={cream:mat('#d5e5e6'),white:mat('#edf5ed'),steel:mat('#647e8b',55),dark:mat('#243e4c'),teal:mat('#126a78'),orange:mat('#ff621f',48),yellow:mat('#ffcd61'),black:mat('#131e27'),wood:mat('#9e7454'),green:mat('#385957'),earth:mat('#4b4f48')};
 const boxG=new T.BoxGeometry(1,1,1),cylG=new T.CylinderGeometry(1,1,1,16),sphereG=new T.SphereGeometry(1,16,10);
 function mesh(p,geo,m,x,y,z,s=[1,1,1]){const o=new T.Mesh(geo,m);o.position.set(x,y,z);o.scale.set(...s);p.add(o);return o}
 const box=(p,x,y,z,w,h,d,m)=>mesh(p,boxG,m,x,y,z,[w,h,d]);
 const cyl=(p,x,y,z,r,h,m)=>mesh(p,cylG,m,x,y,z,[r,h,r]);
 const ball=(p,x,y,z,rx,ry,rz,m)=>mesh(p,sphereG,m,x,y,z,[rx,ry,rz]);
 const rod=(p,a,b,r,m)=>{const av=new T.Vector3(...a),bv=new T.Vector3(...b),o=cyl(p,...av.clone().add(bv).multiplyScalar(.5).toArray(),r,av.distanceTo(bv),m);o.quaternion.setFromUnitVectors(new T.Vector3(0,1,0),bv.sub(av).normalize());return o};
 function label(p,text,x,y,z,w=5,h=.7,{color='#e9f3ec',bg='#183f4d',size=68}={}){
  const tex=texture(1024,Math.round(1024*h/w),c=>{c.fillStyle=bg;c.fillRect(0,0,c.canvas.width,c.canvas.height);c.fillStyle=color;c.font=`850 ${size}px Caption`;c.textAlign='center';c.textBaseline='middle';c.fillText(text,512,c.canvas.height/2,960)});
  return mesh(p,new T.PlaneGeometry(w,h),new T.MeshBasicMaterial({map:tex,side:T.DoubleSide}),x,y,z);
 }
 // A single physically continuous aviation-design/search diorama, connected by
 // floor rails, cable conduit and measurable station numbers. No backdrop swaps.
 const floorTex=texture(512,512,c=>{c.fillStyle='#95afb3';c.fillRect(0,0,512,512);c.strokeStyle='#68888e';c.lineWidth=2;for(let i=0;i<=512;i+=64){c.strokeRect(i,0,64,512);c.strokeRect(0,i,512,64)}for(let i=0;i<2200;i++){c.fillStyle='#25485815';c.fillRect(rng()*512,rng()*512,1+rng()*3,1)}});floorTex.wrapS=floorTex.wrapT=T.RepeatWrapping;floorTex.repeat.set(26,4);
 box(root,50,-1.15,-3,140,1.4,32,new T.MeshPhongMaterial({map:floorTex,color:'#b9d0cf',shininess:12}));
 for(let x=-15;x<122;x+=3){box(root,x,-.425,5,.8,.018,.1,C.yellow);box(root,x,-.42,-13,.8,.02,.12,C.yellow)}
 for(const z of [-12,6]){box(root,50,-.37,z,138,.08,.09,C.steel);box(root,50,-.35,z+.2,138,.06,.06,C.dark)}
 for(let x=-10;x<120;x+=14){
  box(root,x,6.8,-15,.35,14,.5,C.dark);box(root,x,13.6,-5,.4,.35,20,C.dark);
  rod(root,[x,8,-15],[x,13.6,-8],.08,C.steel);
  box(root,x,13.3,-4,1.4,.12,7,C.white);
 }
 // Distant hangar wall, windows and service cabinets remain fixed in the world.
 box(root,50,5.5,-19,145,13,.5,C.teal);
 for(let x=-12;x<120;x+=6){box(root,x,8.6,-18.7,4.8,3.4,.1,C.dark);for(let j=-1;j<=1;j++)box(root,x+j*1.45,8.6,-18.6,.08,3.3,.08,C.steel)}
 for(let x=-10;x<116;x+=12){box(root,x,1.2,-14,3.4,3.2,1.3,C.steel);for(let y=0;y<3;y++)box(root,x,0.3+y*.8,-13.32,2.8,.04,.03,C.dark)}
 function station(x,n,title){cyl(root,x,-.3,-1,5.5,.12,C.dark);label(root,n,x,0,-6.5,2,1,{bg:'#ff6b2c',color:'#172d3d',size:130});label(root,title,x,7,-9,9,1.0,{size:74});for(const s of [-1,1])rod(root,[x+s*4.8,-.4,-9],[x+s*4.8,7.4,-9],.045,C.steel)}
 station(0,'01','DESIGNED TO BE FOUND');station(15,'02','FLIGHT DATA + COCKPIT AUDIO');station(26,'03','THE “BLACK BOX”');station(40,'04','WHEN VISIBILITY DISAPPEARS');station(64,'05','COLOUR IS A SAFETY FEATURE');station(76,'06','FIND IT. RECOVER THE STORY.');station(89,'07','BUILT TO STAND OUT');station(102,'08','NOT BUILT TO HIDE');
 function bench(x,z=-2){box(root,x,1.5,z,7,.25,3.8,C.wood);for(const s of [-1,1])for(const zz of [-1.3,1.3])box(root,x+s*2.7,.5,z+zz,.18,1.8,.18,C.dark);for(let i=0;i<6;i++)box(root,x+1.5,1.67,z-.2+i*.15,1.5,.03,.06,C.cream);box(root,x-1.4,1.7,z-.1,1.7,.05,1.3,C.teal)}
 bench(0);bench(26);
 // Airliner: low-poly dimensional silhouette, engine intakes, landing gear,
 // cockpit glazing and an open instrument station with data/audio screens.
 const plane=new T.Group();root.add(plane);plane.position.set(12,4,-11);
 const body=cyl(plane,0,0,0,1,18,C.white);body.rotation.z=Math.PI/2;
 ball(plane,-9,0,0,1.8,.97,.97,C.white);ball(plane,9,0,0,1.4,.9,.9,C.white);
 box(plane,-8.6,.38,.86,1.3,.52,.12,C.teal);
 for(let i=0;i<18;i++)box(plane,-7.2+i*.83,.35,.94,.37,.38,.12,C.dark);
 box(plane,0,-.1,0,4,.16,14,C.cream);const wing=box(plane,1,-.1,0,3.5,.18,17,C.white);wing.rotation.y=.2;
 for(const s of [-1,1]){const e=cyl(plane,-.5,-1.0,s*4.4,.65,2.2,C.steel);e.rotation.z=Math.PI/2;const fan=cyl(plane,-1.65,-1,s*4.4,.53,.05,C.dark);fan.rotation.z=Math.PI/2;for(let k=0;k<8;k++){const blade=box(plane,-1.70,-1,s*4.4,.03,.08,.9,C.steel);blade.rotation.x=k*Math.PI/4}box(plane,7.4,.1,s*2.6,2,.14,5,C.white)}
 const tail=box(plane,7.5,1.4,0,2.3,3.5,.15,C.teal);tail.rotation.z=-.35;label(plane,'AIR',7.6,1.9,.1,1.5,.5,{size:80});
 for(const x of [-5,3]){rod(plane,[x,-.5,0],[x,-3.5,0],.1,C.steel);for(const s of [-1,1]){const wheel=cyl(plane,x,-3.5,s*.4,.4,.3,C.black);wheel.rotation.x=Math.PI/2}}
 // Visible flight-data station and moving waveforms (painted by film.js).
 const screens=[];
 for(let i=0;i<2;i++){
  const canvas=document.createElement('canvas');canvas.width=512;canvas.height=320;const tex=new T.CanvasTexture(canvas);tex.colorSpace=T.SRGBColorSpace;
  const screen=mesh(root,new T.PlaneGeometry(3.9,2.45),new T.MeshBasicMaterial({map:tex}),12+i*4.5,4.5,-2.2);screens.push({canvas,tex});box(root,12+i*4.5,4.5,-2.35,4.15,2.7,.2,C.dark);rod(root,[12+i*4.5,1.6,-2.4],[12+i*4.5,3.3,-2.4],.12,C.steel);
 }
 // Actual wreckage and forest props, fixed on one terrain strip.
 for(let i=0;i<24;i++){const x=32+rng()*8,z=-6+rng()*10;const o=box(root,x,-.15+rng()*.8,z,.8+rng()*2.2,.08,1+rng()*2,i%3?C.steel:C.cream);o.rotation.set(rng()*.7,rng()*6,rng()*.35)}
 const engine=cyl(root,34,.5,2,.9,2.4,C.steel);engine.rotation.z=1.22;cyl(root,34.9,.65,2,.6,.2,C.dark).rotation.z=1.22;
 for(let i=0;i<24;i++){const x=38+rng()*11,z=-12+rng()*12,h=3+rng()*4;rod(root,[x,-.4,z],[x,h*.8,z],.15,C.wood);for(let j=0;j<3;j++)mesh(root,new T.ConeGeometry(1.1-j*.16,h*.6,7),i%2?C.green:mat('#284a48'),x,h*.48+j*.7,z);}
 for(let i=0;i<28;i++){const x=39+rng()*9,z=-5+rng()*9;ball(root,x,-.35,z,.4+rng()*.6,.25,.4,C.earth)}
 // Two open ocean cross-section exhibits make the dive geometrically visible.
 const waters=[];
 function basin(x,w){
  box(root,x,-1,-1,w,1,14,mat('#476d6b'));box(root,x,-.42,-1,w,.12,14,mat('#779084'));
  const water=new T.Mesh(new T.PlaneGeometry(w,14,15,10),new T.MeshPhongMaterial({color:'#3ca3b0',transparent:true,opacity:.19,side:T.DoubleSide,shininess:90,depthWrite:false}));water.rotation.x=-Math.PI/2;water.position.set(x,4.8,-1);root.add(water);waters.push(water);
  for(const z of [-7.9,5.9]){box(root,x,4.8,z,w,.08,.09,C.teal);const glass=box(root,x,2.2,z,w,5.1,.025,new T.MeshBasicMaterial({color:'#54afbb',transparent:true,opacity:.055,depthWrite:false}));}
  for(let i=0;i<22;i++){const xx=x-w/2+rng()*w,z=-6+rng()*10;ball(root,xx,-.1,z,.3+rng()*.6,.3,.4,C.earth);for(let j=0;j<3;j++)rod(root,[xx,0,z],[xx+(rng()-.5)*.6,.5+rng(),z],.035,C.green)}
 }
 basin(52,13);basin(77,8);
 // Search team gear: practical floodlights and helicopter/ship search cues.
 const spotlights=[];
 for(const x of [35,44,59,70,81,97]){
  for(const dx of [-.6,.6])rod(root,[x+dx,-.4,4],[x,2.3,4],.045,C.steel);
  rod(root,[x,-.4,4],[x,3.3,4],.06,C.steel);const head=box(root,x,3.3,4,1,.6,.35,C.dark);box(root,x,3.3,4.2,.8,.43,.025,C.white);
  spotlights.push(head);
 }
 function cone(x,z,scale=1){const g=new T.Group();root.add(g);g.position.set(x,-.35,z);g.scale.setScalar(scale);box(g,0,.07,0,1.6,.15,1.6,C.black);mesh(g,new T.ConeGeometry(.65,2.4,24),C.orange,0,1.3,0);for(const y of [.9,1.6]){const r=.65*(1-(y-.1)/2.4);mesh(g,new T.CylinderGeometry(r-.06,r+.06,.22,24),C.white,0,y,0)}return g}
 cone(87,1,1.2);cone(91,-3,.9);cone(96,3,.7);
 // Final instrument recovery tray; orange shell framed by steel and a search flag.
 box(root,101,1.45,-1,7,.25,4,C.steel);for(const s of [-1,1])box(root,101+s*3.3,1.75,-1,.15,.45,4,C.dark);
 rod(root,[104,-.4,-2],[104,6,-2],.06,C.steel);label(root,'FOUND',105.15,5.4,-1.96,2.2,.8,{bg:'#ff6427',color:'#183c46',size:100});
 // Persistent route/cable linking all demonstrations.
 const cablePts=[];for(let x=-6;x<=109;x+=1)cablePts.push(new T.Vector3(x,-.31,4.7+Math.sin(x*.15)*.22));root.add(new T.Mesh(new T.TubeGeometry(new T.CatmullRomCurve3(cablePts),140,.035,5,false),C.orange));
 batchStatic(root,new Set(waters));
 // Detailed hero recorder: a deliberately illustrative crash-survivable recorder
 // unit, not a manufacturer's certified mechanical model.
 const hero=new T.Group();scene.add(hero);const shellMat=new T.MeshPhongMaterial({color:'#ff641f',shininess:48,specular:'#c6b9a1'});
 box(hero,0,0,0,2.6,1.65,1.6,shellMat);box(hero,0,-.98,0,3.1,.22,2,C.steel);
 for(const x of [-1.34,1.34]){box(hero,x,0,0,.13,1.78,1.75,shellMat);box(hero,x,-.55,.9,.15,.9,.12,C.steel)}
 for(const z of [-.57,.57]){box(hero,0,.87,z,2.85,.13,.14,C.steel);for(const x of [-1.35,1.35]){const bolt=cyl(hero,x,.98,z,.095,.07,C.dark);for(const s of [-1,1])box(hero,x,.1+s*.48,.84,.12,.12,.08,C.steel)}}
 for(const x of [-.55,.55])rod(hero,[x,.9,0],[x,1.32,0],.065,C.dark);rod(hero,[-.55,1.32,0],[.55,1.32,0],.07,C.steel);
 const beacon=cyl(hero,1.55,0,0,.26,1.3,C.steel);beacon.rotation.z=Math.PI/2;const cap=cyl(hero,2.2,0,0,.22,.08,C.black);cap.rotation.z=Math.PI/2;
 const led=ball(hero,2.25,0,0,.05,.07,.07,new T.MeshBasicMaterial({color:'#b4fff4'}));
 for(let i=0;i<6;i++)box(hero,-.9+i*.16,-.25,.818,.06,.48,.03,C.dark);
 label(hero,'FLIGHT RECORDER',.38,.3,.826,1.55,.38,{size:86,bg:'#e9e8cf',color:'#172f3b'});
 label(hero,'DO NOT OPEN',.35,-.15,.827,1.25,.25,{size:90,bg:'#fb782f',color:'#1c323b'});
 const reflect=new T.Group();hero.add(reflect);for(const x of [-1.06,1.06])box(reflect,x,0,.823,.22,1.5,.02,new T.MeshBasicMaterial({color:'#fff5c6'}));reflect.visible=false;
 // Painterly contact shadows are geometries rather than real-time shadow maps.
 const shadowTex=texture(128,128,c=>{const r=c.createRadialGradient(64,64,2,64,64,60);r.addColorStop(0,'#091b2b70');r.addColorStop(1,'#091b2b00');c.fillStyle=r;c.fillRect(0,0,128,128)});
 const shadow=mesh(scene,new T.PlaneGeometry(6,4),new T.MeshBasicMaterial({map:shadowTex,transparent:true,depthWrite:false}),0,-.29,0);shadow.rotation.x=-Math.PI/2;
 // Reusable cutout engineer/investigator: independently animated arms, face,
 // safety vest/headset. Texture updates do not change the continuous world.
 const actors=[];
 for(const [x,z,kind] of [[-2,1,'engineer'],[4,-3,'engineer'],[18,0,'pilot'],[35,2,'search'],[44,2,'search'],[66,-1,'engineer'],[73,1,'search'],[99,1,'search']]){
  const canvas=document.createElement('canvas');canvas.width=320;canvas.height=512;const tex=new T.CanvasTexture(canvas);tex.colorSpace=T.SRGBColorSpace;
  const plane=mesh(scene,new T.PlaneGeometry(2.7,4.32),new T.MeshBasicMaterial({map:tex,transparent:true,alphaTest:.03,side:T.DoubleSide}),x,1.7,z);actors.push({x,z,kind,canvas,tex,plane});
 }
 const rings=[];for(let i=0;i<4;i++){const ring=mesh(scene,new T.TorusGeometry(1,.018,5,60),new T.MeshBasicMaterial({color:'#a8f4d6',transparent:true,opacity:.5,depthWrite:false}),0,0,0);rings.push(ring)}
 const fish=[];for(let i=0;i<11;i++){const g=new T.Group();scene.add(g);const m=mat(i%2?'#d9d2a7':'#81b7b1');ball(g,0,0,0,.32,.14,.09,m);const tail=mesh(g,new T.ConeGeometry(.2,.3,3),m,.37,0,0);tail.rotation.z=Math.PI/2;fish.push({g,x:47+rng()*11,y:.5+rng()*3,z:-5+rng()*7,phase:rng()*7})}
 return {hero,shellMat,reflect,led,shadow,actors,screens,rings,fish,waters,root};
}
export function paintPerson(a,t){
 const c=a.canvas.getContext('2d');c.clearRect(0,0,320,512);const swing=Math.sin(t*2+a.x)*.25;const vest=a.kind==='search'?'#ed9d32':a.kind==='pilot'?'#e3e9df':'#2a7d8c';
 line(c,[[133,340],[124,438],[98,449]],'#233c47',10);line(c,[[181,340],[194,438],[218,449]],'#233c47',10);
 poly(c,[[117,230],[194,230],[211,349],[107,349]],vest,'#233c47',5);
 if(a.kind!=='pilot'){line(c,[[128,238],[144,337]],'#f7edbd',9);line(c,[[184,238],[168,337]],'#f7edbd',9);line(c,[[120,295],[199,295]],'#f7edbd',9)}
 line(c,[[118,247],[77,298],[57,280+Math.sin(t*2)*10]],'#233c47',7);
 line(c,[[194,248],[233,248+swing*65],[258,215+swing*100]],'#233c47',7);ellipse(c,258,215+swing*100,8,8,'#f4dfbc','#233c47',3);
 ellipse(c,158,170,59,64,'#f5e3c7','#233c47',5);ellipse(c,139,174,4,7,'#233c47');ellipse(c,178,174,4,7,'#233c47');line(c,[[146,199],[157,204],[171,197]],'#233c47',3);
 if(a.kind==='engineer'){ellipse(c,158,137,67,27,'#e5b94b','#233c47',4);round(c,98,133,122,15,'#e8bd4f',3);line(c,[[158,111],[158,135]],'#ae8831',4)}else{round(c,105,112,109,25,'#263f4b',7);poly(c,[[108,131],[215,131],[232,143],[106,143]],'#304d5b','#233c47',3)}
 if(a.kind==='pilot'){line(c,[[102,164],[100,194],[126,203]],'#2e505a',7);line(c,[[125,203],[145,203]],'#2e505a',4)}
 a.tex.needsUpdate=true;
}
