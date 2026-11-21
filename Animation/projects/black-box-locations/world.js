import * as T from '../../engine/vendor/three.module.js';
import {kit,texture,random,batchStatic,recorder,airplane} from './art.js';
import {SITES,PEOPLE} from './choreography.js';
import {YAWS} from './camera-rig.js';
export function buildWorld(scene){
 const k=kit(),{mat,mesh,box,cyl,ball,rod,label,M}=k,rng=random(81221),roots=[],units={},screens=[];
 function place(id){const g=new T.Group();const p=SITES[id].p;g.position.set(p[0],SITES[id].ground,p[2]);g.userData.site=id;scene.add(g);roots.push(g);return g}
 // A genuine continuous landscape, not an exhibit floor. Land ends at the coast.
 const land=new T.Group();scene.add(land);roots.push(land);
 const terrain=new T.PlaneGeometry(1100,2100,50,80);terrain.rotateX(-Math.PI/2);terrain.translate(270,0,420);
 const a=terrain.attributes.position,colors=[];function ground(x,z){const d=Math.hypot(x-420,z+180);const forest=4*(1-Math.min(1,Math.max(0,(d-24)/120)));return 8+forest+Math.sin(x*.013)*Math.cos(z*.015)*1.1*Math.min(1,Math.max(0,(Math.hypot(x,z)-55)/100))*Math.min(1,Math.max(0,(Math.hypot(x-130,z-650)-130)/100))*Math.min(1,Math.max(0,(d-28)/70))}
 for(let i=0;i<a.count;i++){const x=a.getX(i),z=a.getZ(i);a.setY(i,ground(x,z));const c=new T.Color(x>765?'#c5b887':Math.hypot(x-420,z+180)<200?'#54724c':'#739164');c.multiplyScalar(.89+rng()*.17);colors.push(c.r,c.g,c.b)}terrain.setAttribute('color',new T.Float32BufferAttribute(colors,3));terrain.computeVertexNormals();const terrainMesh=mesh(land,terrain,new T.MeshPhongMaterial({vertexColors:true,shininess:2}));
 // Distant ridges and hills, plus a road that visually establishes scale in transit.
 for(let i=0;i<30;i++){const x=-220+rng()*1040,z=-500+rng()*1650;if(Math.hypot(x,z)<80||Math.hypot(x-130,z-650)<180||Math.hypot(x-420,z+180)<90)continue;const h=20+rng()*90;const hill=mesh(land,new T.ConeGeometry(45+rng()*70,h,8),mat(i%2?'#748c75':'#8d9b84'),x,8+h*.35,z);hill.scale.z=1.2+rng();}
 const roadPoints=[[-40,8.1,25],[110,8.1,110],[310,8.1,180],[530,8.1,400],[720,8.1,670],[800,8.1,760]];for(let i=1;i<roadPoints.length;i++){const v=new T.Vector3(...roadPoints[i-1]),w=new T.Vector3(...roadPoints[i]);const b=box(land,...v.clone().add(w).multiplyScalar(.5).toArray(),8,.12,v.distanceTo(w),mat('#7d8580'));b.rotation.y=Math.atan2(w.x-v.x,w.z-v.z)}
 // Factory exterior yard and a real enclosed design/testing room.
 const factory=place('factory');box(factory,0,-.10,0,36,.3,26,mat('#b1bcbc'));
 box(factory,-18,5,0,.28,10,26,M.cream);box(factory,18,5,0,.28,10,26,M.cream);
 box(factory,0,5,-13,36,10,.28,M.teal);
 // Large open vehicle door, only way the camera leaves at ground level.
 box(factory,-13,5,13,10,10,.28,M.cream);box(factory,13,5,13,10,10,.28,M.cream);box(factory,0,9,13,16,2,.28,M.navy);
 box(factory,0,10.2,0,36,.35,26,M.cream);
 for(const x of [-15,-9,-3,3,9,15]){box(factory,x,9.7,0,.18,.28,25,M.steel);box(factory,x,9.35,0,.9,.12,5,M.white)}
 for(let z=-11;z<=11;z+=2){box(factory,-15,.012,z,.12,.025,1,M.gold);box(factory,15,.012,z,.12,.025,1,M.gold)}
 // Factory-only contents: benches, electronic test rigs, cabinets and tooling.
 function bench(p,x,z,w=3.8){box(p,x,1.25,z,w,.18,2,M.cream);for(const s of [-1,1])for(const zz of [-.7,.7])box(p,x+s*(w/2-.35),.6,z+zz,.12,1.2,.12,M.navy)}
 bench(factory,0,0,3.7);bench(factory,-11,-7);bench(factory,10,-7);
 for(const x of [-14,-10,-6,6,10,14]){box(factory,x,1.4,-11.7,2.8,2.8,1.6,M.steel);for(let j=0;j<4;j++)box(factory,x,.4+j*.6,-10.88,2.4,.035,.03,M.navy)}
 for(const x of [-11,11]){box(factory,x,2.3,-6.8,2.5,1.9,1.4,M.teal);cyl(factory,x,3.4,-6.8,.4,.25,M.steel);label(factory,'TEST RIG',x,2.5,-6.08,1.8,.4)}
 label(factory,'RECORDER DESIGN + FLIGHT SAFETY',0,6.2,-12.82,10,1);label(factory,'FACTORY / ENGINEERING',0,8,12.82,9,.65,Math.PI);
 for(const [i,x]of [[0,-8],[1,8]]){const canvas=document.createElement('canvas');canvas.width=512;canvas.height=320;const tex=new T.CanvasTexture(canvas);tex.colorSpace=T.SRGBColorSpace;box(factory,x,3.1,-9.5,3.4,2.2,.25,M.navy);mesh(factory,new T.PlaneGeometry(3.1,1.94),new T.MeshBasicMaterial({map:tex}),x,3.1,-9.36);rod(factory,[x,.1,-9.5],[x,2.1,-9.5],.07,M.steel);screens.push({canvas,tex,index:i})}
 const yard=new T.Group();yard.position.set(0,8,48);scene.add(yard);roots.push(yard);box(yard,0,-.08,0,90,.12,65,mat('#8b9691'));for(let i=-3;i<=3;i++)box(yard,i*9,.012,0,.1,.03,30,M.cream);box(yard,-30,2.5,4,8,5,4,M.teal);for(const x of [-33,-27]){const wheel=cyl(yard,x,.7,6.1,.65,.3,M.navy);wheel.rotation.x=Math.PI/2}
 // Remote forest. Hundreds of metres of terrain separate it from the factory.
 const forest=place('forest');box(forest,0,-.12,0,34,.22,32,mat('#6f7251'));
 const treePoints=[];for(let i=0;i<150;i++){const angle=rng()*Math.PI*2,r=18+rng()*105;treePoints.push([Math.cos(angle)*r,Math.sin(angle)*r,7+rng()*8])}
 for(const [x,z,h]of treePoints){const y=ground(420+x,-180+z)-12;cyl(forest,x,y+h*.36,z,.20,h*.72,M.wood);for(let j=0;j<3;j++)mesh(forest,new T.ConeGeometry(1.7-j*.25,h*.56,7),j%2?M.green:mat('#50765a'),x,y+h*.47+j*.9,z)}
 for(let i=0;i<80;i++){const x=(rng()-.5)*35,z=(rng()-.5)*34;if(Math.hypot(x,z)<2.8)continue;ball(forest,x,.13,z,.2+rng()*.5,.12+rng()*.15,.3+rng()*.5,mat(i%2?'#7d8067':'#91937b'))}
 // Separate, non-graphic hypothetical forest crash: torn fuselage, wing and tail.
 const fus=cyl(forest,-8,1.3,-7,1.2,18,M.white);fus.rotation.z=1.48;for(let j=0;j<11;j++)box(forest,-15+j*1.2,1.8,-5.85,.5,.55,.05,M.navy);
 const wing=box(forest,-6,.5,-8,15,.18,4,M.cream);wing.rotation.set(.1,-.35,.15);const tail=box(forest,8,2.8,-8,3.5,5.5,.18,M.teal);tail.rotation.z=.45;
 for(let i=0;i<18;i++){const x=-13+rng()*25,z=-13+rng()*8;const p=box(forest,x,.2+rng()*.5,z,.4+rng()*1.2,.06,.5+rng(),i%2?M.steel:M.cream);p.rotation.set(rng(),rng()*6,rng()*.5)}
 // Ocean is a continuous open sea extending kilometres beyond the coastline.
 const seabed=new T.Group();seabed.position.set(1180,-14.4,320);scene.add(seabed);roots.push(seabed);
 const sandTex=texture(512,512,c=>{c.fillStyle='#829c91';c.fillRect(0,0,512,512);for(let y=0;y<512;y+=16){c.strokeStyle='#dce3b028';c.lineWidth=3;c.beginPath();for(let x=0;x<512;x++){const yy=y+Math.sin(x*.025+y)*4;x?c.lineTo(x,yy):c.moveTo(x,yy)}c.stroke()}for(let i=0;i<5000;i++){c.fillStyle='#1c4a5019';c.fillRect(rng()*512,rng()*512,2,2)}});sandTex.wrapS=sandTex.wrapT=T.RepeatWrapping;sandTex.repeat.set(14,14);
 box(seabed,0,-.2,0,420,.35,420,new T.MeshPhongMaterial({color:'#b7b99b',map:sandTex,shininess:1}));
 for(let i=0;i<85;i++){const x=(rng()-.5)*90,z=(rng()-.5)*90;if(Math.hypot(x,z)<2.5)continue;ball(seabed,x,.2,z,.3+rng()*1.0,.2+rng()*.6,.4+rng()*.8,mat('#708d87'));for(let j=0;j<3;j++)rod(seabed,[x,0,z],[x+(rng()-.5)*.4,.4+rng()*.8,z],.035,mat('#416f61'))}
 const seaWing=box(seabed,-9,.6,-7,19,.18,5,M.cream);seaWing.rotation.set(.08,.36,-.08);const engine=cyl(seabed,8,.9,-6,1,3.4,M.steel);engine.rotation.z=1.3;
 // Water shader: no aquarium glass, retaining walls, tiled test floor or room.
 const waterUniforms={time:{value:0}};const waterMat=new T.ShaderMaterial({uniforms:waterUniforms,transparent:true,depthWrite:false,side:T.DoubleSide,
 vertexShader:`uniform float time;varying vec3 vP;void main(){vec3 p=position;p.y+=sin(p.x*.08+time*.8)*.22+sin(p.z*.11-time*.7)*.15;vP=p;gl_Position=projectionMatrix*modelViewMatrix*vec4(p,1.);}`,
 fragmentShader:`uniform float time;varying vec3 vP;void main(){float n=sin(vP.x*.12+sin(vP.z*.09-time)*2.+time)*sin(vP.z*.16-time*.8);float foam=smoothstep(.93,1.,n);vec3 c=mix(vec3(.035,.30,.39),vec3(.10,.53,.59),n*.18+.45);c+=foam*.13;gl_FragColor=vec4(c,.55);}`});
 const water=mesh(scene,new T.PlaneGeometry(8000,8000,150,150),waterMat,4820,0,600);water.geometry.rotateX(-Math.PI/2);
 // Continuous shoreline and real coastal recovery base, not another room.
 const rescue=place('rescue');box(rescue,-10,-.12,0,40,.24,14,M.wood);for(const x of [-25,-15,-5,5])for(const z of [-5.5,5.5])cyl(rescue,x,-3,z,.25,6,M.wood);
 for(let x=-28;x<=8;x+=.42)box(rescue,x,.015,0,.025,.03,14,M.navy);
 bench(rescue,0,0,3.7);box(rescue,-45,6,0,18,12,15,M.cream);box(rescue,-45,12.2,0,20,.3,17,M.teal);label(rescue,'COASTAL RESCUE',-45,7,7.6,12,1.3);box(rescue,-45,3,7.55,5,6,.1,M.teal);
 // A sloping access boardwalk connects the mainland cliff to the lower pier.
 const ramp=box(rescue,-27,2.7,0,22,.22,5,M.wood);ramp.rotation.z=-.24;
 function boat(x,z){const g=new T.Group();g.position.set(x,0,z);scene.add(g);const hull=box(g,0,.6,0,11,1.8,4,M.white);box(g,0,1.9,0,6,1,3.4,M.orange);box(g,-1,3.1,0,4,1.5,3,M.cream);box(g,-1,3.2,1.55,2.8,.75,.035,M.teal);rod(g,[1,2,0],[1,7,0],.07,M.steel);label(g,'SEARCH',3,1.9,1.73,3,.6);batchStatic(g);return g}
 const boats=[boat(1205,300),boat(900,790)];
 // Final site is a separate outdoor airport apron, ~700m from the rescue pier.
 const airport=place('airport');box(airport,0,.02,0,130,.15,180,mat('#9ca6a0'));box(airport,45,.025,-30,22,.15,460,mat('#626f70'));
 for(let z=-230;z<=180;z+=22)box(airport,45,.112,z,.5,.035,9,M.cream);
 for(const x of [-40,-20,0,20])box(airport,x,.112,25,.15,.03,70,M.gold);
 box(airport,0,.7,0,3.5,1.4,2.5,M.navy);box(airport,0,1.82,0,3.1,.2,2.1,M.steel);
 const tower=new T.Group();tower.position.set(-38,0,-110);airport.add(tower);box(tower,0,12,0,7,24,7,M.cream);box(tower,0,25.5,0,14,4,12,M.teal);box(tower,0,28,0,15,.5,13,M.navy);
 box(airport,-65,7,-80,40,14,38,M.cream);box(airport,-65,14.4,-80,42,.5,40,M.teal);
 function cone(x,z,scale=1){const g=new T.Group();g.position.set(x,0,z);g.scale.setScalar(scale);airport.add(g);box(g,0,.05,0,.95,.1,.95,M.navy);mesh(g,new T.ConeGeometry(.38,1.5,20),M.orange,0,.82,0);for(const y of [.65,1.03]){const r=.38*(1-(y-.08)/1.5);mesh(g,new T.CylinderGeometry(r-.025,r+.025,.15,20),M.white,0,y,0)}}
 cone(3.5,.3,1.25);cone(5.2,-4,1);cone(-4,-4,.8);
 const departing=airplane(scene,k,1.4);
 // Units always exist at their own locations. None is teleported between sites.
 for(const [id,site]of Object.entries(SITES))units[id]=recorder(scene,site.p,YAWS[id],k);
 const contactTex=texture(128,128,c=>{const g=c.createRadialGradient(64,64,1,64,64,60);g.addColorStop(0,'#15333b70');g.addColorStop(1,'#15333b00');c.fillStyle=g;c.fillRect(0,0,128,128)});
 const people=PEOPLE.map(spec=>{const group=new T.Group();group.position.set(spec.x,spec.y,spec.z);scene.add(group);const canvas=document.createElement('canvas');canvas.width=384;canvas.height=640;const tex=new T.CanvasTexture(canvas);tex.colorSpace=T.SRGBColorSpace;mesh(group,new T.PlaneGeometry(1.9,2.8),new T.MeshBasicMaterial({map:tex,transparent:true,alphaTest:.05,side:T.DoubleSide}),0,1.4,0);const shadow=mesh(scene,new T.PlaneGeometry(1.8,1),new T.MeshBasicMaterial({map:contactTex,transparent:true,depthWrite:false}),spec.x,spec.y+.02,spec.z);shadow.rotation.x=-Math.PI/2;return {...spec,group,canvas,tex,plane:group.children[0]}});
 for(const [id,site]of Object.entries(SITES)){const sh=mesh(scene,new T.PlaneGeometry(3,2.3),new T.MeshBasicMaterial({map:contactTex,transparent:true,depthWrite:false}),site.p[0],id==='forest'?12.11:id==='ocean'?-14.37:site.p[1]-.54,site.p[2]);sh.rotation.x=-Math.PI/2}
 const rings=[];for(let i=0;i<4;i++)rings.push(mesh(scene,new T.TorusGeometry(1,.016,5,64),new T.MeshBasicMaterial({color:'#b5f8d5',transparent:true,depthWrite:false})));
 const fish=[];for(let i=0;i<14;i++){const g=new T.Group();scene.add(g);ball(g,0,0,0,.25,.09,.055,mat(i%2?'#cfce9b':'#70b3b9'));const tail=mesh(g,new T.ConeGeometry(.13,.2,3),M.gold,.28,0,0);tail.rotation.z=Math.PI/2;fish.push({g,x:1180+(rng()-.5)*35,y:-12+rng()*5,z:320+(rng()-.5)*35,p:rng()*7})}
 for(const root of roots)batchStatic(root,root===land?new Set([terrainMesh]):new Set());
 return {roots,units,people,screens,waterUniforms,water,boats,departing,rings,fish,locationBounds:{factory:{min:[-18,8,-13],max:[18,18.4,13]},forest:{centre:[420,12,-180],radius:125},ocean:{centre:[1180,0,320],waterExtentMeters:8000},rescue:{centre:[835,2.5,760]},airport:{centre:[130,8,650]}}};
}
