import * as T from '../../engine/vendor/three.module.js';
import {texture,random,round,line,ellipse,poly} from '../alexandria/art.js';
import {batchStatic} from '../alexandria/batch.js';
import {stateAt,DURATION,PEOPLE} from './choreography.js';
export function createWorld(scene){
 const rng=random(18118),fixed=new T.Group();scene.add(fixed);const materials=new Map();
 const mat=(color,shine=16)=>{const k=color+shine;if(!materials.has(k))materials.set(k,new T.MeshPhongMaterial({color,shininess:shine,specular:'#788c91'}));return materials.get(k)};
 const M={ivory:mat('#e9e1c8'),white:mat('#f7f3df'),navy:mat('#203948'),teal:mat('#317e87'),blue:mat('#5e9fac'),orange:mat('#ff6b25',54),metal:mat('#a4b5b6',70),black:mat('#192b35'),green:mat('#456858'),leaf:mat('#648671'),bark:mat('#8c6d50'),earth:mat('#a7a38b'),gold:mat('#e9bb5c')};
 const bg=new T.BoxGeometry(1,1,1),cg=new T.CylinderGeometry(1,1,1,16),sg=new T.SphereGeometry(1,16,10);
 function mesh(p,g,m,x=0,y=0,z=0,s=[1,1,1],shadow=true){const o=new T.Mesh(g,m);o.position.set(x,y,z);o.scale.set(...s);o.castShadow=shadow;o.receiveShadow=true;p.add(o);return o}
 const box=(p,x,y,z,w,h,d,m,shadow=true)=>mesh(p,bg,m,x,y,z,[w,h,d],shadow);
 const cyl=(p,x,y,z,r,h,m,shadow=true)=>mesh(p,cg,m,x,y,z,[r,h,r],shadow);
 const ball=(p,x,y,z,rx,ry,rz,m)=>mesh(p,sg,m,x,y,z,[rx,ry,rz]);
 function rod(p,a,b,r,m){const v=new T.Vector3(...a),w=new T.Vector3(...b),o=cyl(p,...v.clone().add(w).multiplyScalar(.5).toArray(),r,v.distanceTo(w),m);o.quaternion.setFromUnitVectors(new T.Vector3(0,1,0),w.sub(v).normalize());return o}
 function plaque(p,text,x,y,z,w=3,h=.5,rotation=0,background='#24444e',ink='#f6edcf'){
  const tex=texture(1024,Math.max(96,Math.round(1024*h/w)),c=>{c.fillStyle=background;c.fillRect(0,0,c.canvas.width,c.canvas.height);c.fillStyle=ink;c.font='850 87px Caption';c.textAlign='center';c.textBaseline='middle';c.fillText(text,512,c.canvas.height/2,956)});
  const o=mesh(p,new T.PlaneGeometry(w,h),new T.MeshBasicMaterial({map:tex,side:T.DoubleSide}),x,y,z,[1,1,1],false);o.rotation.y=rotation;return o;
 }
 // Compact, circular research pavilion. This is NOT the previous long wall /
 // conveyor layout. Every station has its own bearing in one persistent world.
 const floorTex=texture(1024,1024,c=>{c.fillStyle='#b6c9c4';c.fillRect(0,0,1024,1024);for(let i=0;i<40000;i++){c.fillStyle=i%2?'#ffffff12':'#36555b10';c.fillRect(rng()*1024,rng()*1024,1+rng()*3,1+rng()*3)}c.strokeStyle='#77969488';c.lineWidth=2;for(let i=0;i<1024;i+=128){c.strokeRect(i,0,128,1024);c.strokeRect(0,i,1024,128)}});floorTex.wrapS=floorTex.wrapT=T.RepeatWrapping;floorTex.repeat.set(7,7);
 const shape=new T.Shape();shape.moveTo(-34,-34);shape.lineTo(34,-34);shape.lineTo(34,34);shape.lineTo(-34,34);shape.closePath();
 const hole=new T.Path();for(const [i,[x,z]] of [[-5,5.5],[-5,16],[11,16],[11,5.5],[9.4,5.5],[9.4,3.3],[5,3.3],[5,5.5]].entries()){if(i===0)hole.moveTo(x,-z);else hole.lineTo(x,-z)}hole.closePath();shape.holes.push(hole);
 const floor=new T.Mesh(new T.ShapeGeometry(shape),new T.MeshPhongMaterial({map:floorTex,color:'#e4e7d3',shininess:9}));floor.rotation.x=-Math.PI/2;floor.position.y=-.02;floor.receiveShadow=true;fixed.add(floor);
 // Alternating open glazed bays allow parallax and visibility from every side.
 for(let i=0;i<12;i++){const a=i/12*Math.PI*2,x=Math.sin(a)*30,z=Math.cos(a)*30;box(fixed,x,5.5,z,.35,11,.35,M.navy);rod(fixed,[x,10.8,z],[0,13,0],.085,M.metal);const side=new T.Group();side.position.set(x,0,z);side.rotation.y=a;fixed.add(side);box(side,0,1.1,0,14.5,2.2,.22,i%2?M.teal:M.ivory);box(side,0,8.8,0,14.5,.13,.17,M.metal);for(let j=-2;j<=2;j++)box(side,j*2.7,5.4,0,.08,6.8,.08,M.metal);if(i%3===0)box(side,0,5.3,-.05,14.4,6.5,.03,new T.MeshBasicMaterial({color:'#8cbcc6',transparent:true,opacity:.07,depthWrite:false}),false)}
 const halo=mesh(fixed,new T.TorusGeometry(30,.12,7,96),M.metal,0,10.8,0);halo.rotation.x=Math.PI/2;
 const roof=mesh(fixed,new T.TorusGeometry(7,.09,7,64),M.ivory,0,12.3,0);roof.rotation.x=Math.PI/2;
 for(let i=0;i<12;i++){const a=i/12*Math.PI*2;box(fixed,Math.sin(a)*17,.012,Math.cos(a)*17,.8,.025,.12,M.gold,false)}
 // Suspended airliner. Its lowest solid surface stays above the recorder route.
 const plane=new T.Group();plane.position.set(0,7.8,-9.8);fixed.add(plane);
 const fus=cyl(plane,0,0,0,.65,11,M.white);fus.rotation.z=Math.PI/2;
 ball(plane,-5.5,0,0,1.2,.64,.64,M.white);ball(plane,5.5,0,0,1,.55,.55,M.white);
 for(const z of [-.64,.64]){box(plane,-5.3,.15,z,.85,.38,.04,M.teal);for(let i=0;i<13;i++)box(plane,-4.2+i*.65,.2,z,.29,.3,.04,M.navy)}
 const wing=box(plane,.25,-.15,0,2.1,.14,9,M.ivory);wing.rotation.y=.25;
 for(const s of [-1,1]){const en=cyl(plane,-.55,-.65,s*2.6,.42,1.55,M.metal);en.rotation.z=Math.PI/2;const intake=cyl(plane,-1.34,-.65,s*2.6,.34,.04,M.black);intake.rotation.z=Math.PI/2;box(plane,4.7,.05,s*1.6,1.4,.11,3.3,M.ivory);rod(fixed,[s*5,11,-7.8],[s*4.1,8.2,-9.8],.025,M.metal)}
 const tail=box(plane,4.5,1,0,1.55,2.35,.12,M.teal);tail.rotation.z=-.25;
 plaque(plane,'AERO',4.5,1.35,.075,1.25,.3);plaque(plane,'AERO',4.5,1.35,-.075,1.25,.3,Math.PI);
 // No giant, clipped slogan banners. Small practical labels live on equipment.
 function workbench(x,z,a){const g=new T.Group();g.position.set(x,0,z);g.rotation.y=a;fixed.add(g);box(g,0,1.05,0,3.6,.18,1.8,M.ivory);for(const x of [-1.4,1.4])for(const z of [-.65,.65])box(g,x,.48,z,.12,.96,.12,M.navy);box(g,-.6,1.18,0,1.3,.04,.8,M.teal);for(let j=0;j<3;j++)rod(g,[.3+j*.3,1.18,-.3],[.3+j*.3,1.18,.3],.025,M.metal);return g}
 workbench(-12.8,-3.8,.5);workbench(-12.5,7.9,-.5);
 // Two freestanding data instruments: positioned outside the swept carrier hull.
 const screens=[];for(const [i,x,z,a] of [[0,-12,-10,0],[1,-8,-12,0]]){
  const canvas=document.createElement('canvas');canvas.width=512;canvas.height=320;const tex=new T.CanvasTexture(canvas);tex.colorSpace=T.SRGBColorSpace;
  const g=new T.Group();g.position.set(x,0,z);g.rotation.y=a;fixed.add(g);box(g,0,2.9,0,3.2,2.05,.18,M.navy);rod(g,[0,0,0],[0,1.95,0],.08,M.metal);box(g,0,.08,0,1.4,.15,1,M.navy);
  const screen=mesh(g,new T.PlaneGeometry(3,1.86),new T.MeshBasicMaterial({map:tex,side:T.DoubleSide}),0,2.9,.105,[1,1,1],false);screens.push({canvas,tex});
 }
 // Wreckage fans away from the actual vehicle path; no debris clips through it.
 const debris=[];for(let i=0;i<10;i++){const x=10.8+rng()*2.8,z=-4.5+rng()*2.7,o=box(fixed,x,.25+rng()*.3,z,.65+rng()*.7,.09,.6+rng()*.6,i%2?M.metal:M.ivory);o.rotation.set(rng()*.8,rng()*6,rng()*.7);debris.push(o)}
 const wreck=cyl(fixed,11.5,.7,-2.1,.65,1.7,M.metal);wreck.rotation.z=1.3;
 // Sparse broad-leaf / pine silhouettes form a real-volume forest island.
 for(const [x,z,h] of [[13,1.8,4.8],[14.5,4.2,6],[13.6,4.9,4.7],[11,4.2,4.3],[15.1,6.4,5.7],[15.8,.2,5.3]]){
  cyl(fixed,x,h*.38,z,.16,h*.76,M.bark);for(let j=0;j<3;j++)mesh(fixed,new T.ConeGeometry(1.05-j*.17,h*.51,8),j%2?M.green:M.leaf,x,h*.48+j*.67,z);
 }
 // Open-front basin, seabed, caustics and submerged rail. The camera actually
 // descends below the water surface rather than swapping backgrounds.
 box(fixed,3,-1.95,10.3,16,.22,11.4,M.earth);
 box(fixed,3,-.75,16.1,16,2.4,.2,M.teal);box(fixed,11.1,-.75,10.5,.2,2.4,11,M.teal);
 for(let i=0;i<36;i++){const x=-4+rng()*14,z=6+rng()*9;ball(fixed,x,-1.66,z,.25+rng()*.35,.13+rng()*.14,.25+rng()*.35,M.earth);for(let j=0;j<3;j++)rod(fixed,[x,-1.77,z],[x+(rng()-.5)*.2,-1.2+rng()*.35,z],.018,M.green)}
 const waterMat=new T.MeshPhongMaterial({color:'#4dabb4',transparent:true,opacity:.19,depthWrite:false,side:T.DoubleSide,shininess:100});
 const water=mesh(scene,new T.PlaneGeometry(16,10.5,30,20),waterMat,3,2.65,10.75,[1,1,1],false);water.rotation.x=-Math.PI/2;
 // Track geometry follows the new curved, height-varying carrier route exactly.
 const points=[];for(let i=0;i<=800;i++){const s=stateAt(i/800*DURATION);points.push(new T.Vector3(s.hero[0],s.hero[1]-1.6+.04,s.hero[2]))}
 const trackCurve=new T.CatmullRomCurve3(points);for(const sign of [-1,1]){
  const pts=points.map((p,i)=>{const v=points[Math.min(i+1,points.length-1)].clone().sub(points[Math.max(0,i-1)]);const n=new T.Vector3(v.z,0,-v.x).normalize().multiplyScalar(sign*.82);return p.clone().add(n)});
  fixed.add(new T.Mesh(new T.TubeGeometry(new T.CatmullRomCurve3(pts),1100,.055,6,false),M.metal));
 }
 for(let i=0;i<points.length;i+=12){const p=points[i],v=points[Math.min(i+1,points.length-1)].clone().sub(points[Math.max(0,i-1)]);const tie=box(fixed,p.x,p.y-.065,p.z,2.0,.05,.14,M.navy,false);tie.rotation.y=Math.atan2(v.x,v.z);const basin=(p.x>-5&&p.x<11&&p.z>5.5&&p.z<16)||(p.x>5&&p.x<9.4&&p.z>3.3&&p.z<5.5),ground=basin?-1.8:0,h=p.y-.09-ground;if(h>.04&&i%24===0)cyl(fixed,p.x,ground+h/2,p.z,.075,h,M.metal)}
 // Traffic cones are off the track, not colliding foreground decorations.
 function cone(x,z,s=1){const g=new T.Group();g.position.set(x,0,z);g.scale.setScalar(s);fixed.add(g);box(g,0,.06,0,1.0,.12,1,M.black);mesh(g,new T.ConeGeometry(.4,1.6,20),M.orange,0,.87,0);for(const y of [.7,1.1]){const r=.4*(1-(y-.07)/1.6);mesh(g,new T.CylinderGeometry(r-.025,r+.025,.15,20),M.white,0,y,0)}return g}
 cone(-3.1,-4.4,1.35);cone(-5.5,-5,1);cone(-.7,-4.8,.8);
 // Search lights stay outside both people and carrier collision envelopes.
 for(const [x,z,a] of [[14,-1,.2],[13,10,-.8],[-12,11,1.2],[-12,-7,.3]]){const g=new T.Group();g.position.set(x,0,z);g.rotation.y=a;fixed.add(g);for(let i=0;i<3;i++){const a=i*2*Math.PI/3;rod(g,[Math.sin(a)*.6,0,Math.cos(a)*.6],[0,2.2,0],.035,M.navy)}rod(g,[0,0,0],[0,3,0],.05,M.metal);box(g,0,3,0,.8,.45,.25,M.navy);box(g,0,3,.14,.65,.31,.02,M.white,false)}
 batchStatic(fixed);
 // New complete four-sided recorder, supported by an actual inspection trolley.
 const carrier=new T.Group(),recorder=new T.Group();scene.add(carrier);carrier.add(recorder);recorder.position.y=1.6;
 const shell=new T.MeshPhongMaterial({color:'#7c969c',shininess:44,specular:'#b2bec0'});
 const shellMesh=box(recorder,0,0,0,1.9,1.1,1.18,shell,false);
 box(recorder,0,-.63,0,2.18,.16,1.42,M.metal,false);
 for(const sign of [-1,1]){box(recorder,sign*.98,0,0,.10,1.17,1.28,shell,false);box(recorder,0,.58,sign*.43,2.06,.10,.12,M.metal,false);for(const x of [-.98,.98]){cyl(recorder,x,.66,sign*.43,.065,.04,M.navy,false);box(recorder,x,sign*.25,.63,.09,.13,.06,M.metal,false)}}
 for(const x of [-.4,.4])rod(recorder,[x,.6,0],[x,.92,0],.045,M.navy);rod(recorder,[-.4,.92,0],[.4,.92,0],.045,M.metal);
 // Front, back, both ends and top are authored, because the camera visits them.
 plaque(recorder,'FLIGHT RECORDER',.08,.17,.604,1.3,.28,0,'#eee9d1','#173541');plaque(recorder,'FLIGHT RECORDER',-.08,.17,-.604,1.3,.28,Math.PI,'#eee9d1','#173541');
 plaque(recorder,'DO NOT OPEN',.08,-.15,.605,1.05,.18,0,'#efb16a','#213744');plaque(recorder,'CRASH SURVIVABLE',-.08,-.15,-.605,1.35,.18,Math.PI,'#efb16a','#213744');
 for(const z of [-.62,.62])for(let i=0;i<5;i++)box(recorder,-.68+i*.1,-.16,z,.035,.37,.025,M.navy,false);
 for(const sign of [-1,1]){box(recorder,sign*1.04,.02,0,.04,.8,.76,M.metal,false);for(let j=0;j<4;j++)box(recorder,sign*1.065,.15-j*.12,0,.02,.035,.5,M.navy,false)}
 const beacon=cyl(recorder,1.27,-.23,0,.17,.65,M.metal,false);beacon.rotation.z=Math.PI/2;const cap=cyl(recorder,1.62,-.23,0,.16,.04,M.navy,false);cap.rotation.z=Math.PI/2;
 const led=ball(recorder,1.65,-.23,0,.025,.035,.035,new T.MeshBasicMaterial({color:'#b6ffdf'}));
 const reflect=new T.Group();recorder.add(reflect);for(const sign of [-1,1])for(const z of [-.613,.613])box(reflect,sign*.80,0,z,.12,1.03,.018,new T.MeshBasicMaterial({color:'#fff2b7'}),false);
 // Cart: the device never floats through a person or through its workbench.
 box(carrier,0,.74,0,2.45,.16,1.65,M.navy,false);box(carrier,0,.84,0,2.25,.08,1.4,M.metal,false);
 for(const x of [-.82,.82])for(const z of [-.55,.55]){box(carrier,x,.5,z,.09,.5,.09,M.metal,false);box(carrier,x,.94,z,.3,.12,.28,M.black,false)}
 const wheels=[];for(const x of [-.82,.82])for(const z of [-.55,.55]){const w=cyl(carrier,x,.275,z,.18,.12,M.black,false);w.rotation.z=Math.PI/2;wheels.push(w)}
 // Contact shadows are horizontal and grounded. Upright characters yaw only;
 // unlike the discarded version, a camera pitch cannot tilt their feet upward.
 const shadowTex=texture(128,128,c=>{const g=c.createRadialGradient(64,64,1,64,64,61);g.addColorStop(0,'#102c3b75');g.addColorStop(1,'#102c3b00');c.fillStyle=g;c.fillRect(0,0,128,128)});
 function shadow(p,x,z,w=2,h=1.4){const s=mesh(p,new T.PlaneGeometry(w,h),new T.MeshBasicMaterial({map:shadowTex,transparent:true,depthWrite:false}),x,.014,z,[1,1,1],false);s.rotation.x=-Math.PI/2;return s}
 const cartShadow=shadow(scene,0,0,3.4,2.6);
 const people=PEOPLE.map(spec=>{const group=new T.Group();group.position.set(spec.x,0,spec.z);scene.add(group);const canvas=document.createElement('canvas');canvas.width=384;canvas.height=640;const tex=new T.CanvasTexture(canvas);tex.colorSpace=T.SRGBColorSpace;const plane=mesh(group,new T.PlaneGeometry(1.9,spec.height),new T.MeshBasicMaterial({map:tex,transparent:true,alphaTest:.05,side:T.DoubleSide}),0,spec.height/2,0,[1,1,1],false);shadow(scene,spec.x,spec.z,1.7,.85);return {...spec,group,plane,canvas,tex}});
 const fish=[];for(let i=0;i<12;i++){const g=new T.Group();scene.add(g);const m=i%2?M.gold:M.metal;ball(g,0,0,0,.19,.075,.045,m);const tail=mesh(g,new T.ConeGeometry(.10,.16,3),m,.21,0,0);tail.rotation.z=Math.PI/2;fish.push({g,x:-2+rng()*10,y:-.5+rng()*2.2,z:8+rng()*6,p:rng()*7})}
 const ringMat=new T.MeshBasicMaterial({color:'#9af4da',transparent:true,depthWrite:false});const rings=[];for(let i=0;i<4;i++)rings.push(mesh(scene,new T.TorusGeometry(1,.014,5,64),ringMat.clone(),0,0,0,[1,1,1],false));
 const paintArm=new T.Group();recorder.add(paintArm);box(paintArm,0,0,0,.10,.10,1,M.metal,false);const roller=cyl(paintArm,0,0,.55,.13,.8,M.orange,false);roller.rotation.z=Math.PI/2;
 return {fixed,carrier,recorder,shell,reflect,led,wheels,cartShadow,people,screens,fish,rings,water,paintArm};
}
export function drawPerson(p,t,cameraPosition){
 const c=p.canvas.getContext('2d');c.clearRect(0,0,384,640);c.save();c.translate(0,-110);c.scale(1,1.24);const ink='#233c45',skin='#f7e4c3',vest=p.kind==='search'?'#eab35b':p.kind==='pilot'?'#e7e9d5':'#4b99a0';
 // Stable feet at the bottom edge and a full-body silhouette. No texture pitch.
 line(c,[[160,420],[153,575],[124,601]],ink,11);line(c,[[218,420],[236,575],[264,601]],ink,11);
 poly(c,[[143,281],[229,281],[244,433],[130,433]],vest,ink,5);
 if(p.kind!=='pilot'){line(c,[[157,290],[174,422]],'#f8eac1',9);line(c,[[215,290],[198,422]],'#f8eac1',9);line(c,[[137,366],[237,366]],'#f8eac1',9)}
 const wave=Math.sin(t*1.7+p.x)*9;
 line(c,[[146,301],[105,347],[89,318+wave]],ink,8);line(c,[[227,301],[272,328],[290,287+wave]],ink,8);ellipse(c,89,318+wave,9,9,skin,ink,3);ellipse(c,290,287+wave,9,9,skin,ink,3);
 ellipse(c,186,208,66,73,skin,ink,5);
 // Face turns naturally toward the action; its billboard stays upright.
 for(const x of [165,206])ellipse(c,x,211,4,7,ink);line(c,[[174,242],[187,247],[204,240]],ink,3);
 if(p.kind==='engineer'){ellipse(c,186,165,75,32,'#e9b746',ink,4);round(c,112,163,149,18,'#f0c454',5);line(c,[[186,135],[186,165]],'#bd8f30',4)}else{round(c,126,142,120,30,'#2c4954',6);poly(c,[[126,168],[244,168],[267,182],[125,182]],'#345564',ink,3)}
 if(p.kind==='search'){round(c,153,330,67,44,'#dbe0cc',4,ink);line(c,[[163,342],[208,342]],'#668b8c',3)}
 c.restore();p.tex.needsUpdate=true;
}
