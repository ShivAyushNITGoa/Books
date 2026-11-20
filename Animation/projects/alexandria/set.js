import * as THREE from '../../engine/vendor/three.module.js';
import {texture,random,stoneTexture,marbleTexture,floorTexture,friezeTexture,glyphTexture,makeActor} from './art.js';
const rng=random(7521);
export function buildSet(scene){
 const ancient=new THREE.Group(),ruins=new THREE.Group(),life=new THREE.Group();scene.add(ancient,ruins,life);
 const materials=new Map();
 const standard=(color,extra={})=>{const create=()=>extra.metalness?new THREE.MeshStandardMaterial({color,roughness:.6,...extra}):new THREE.MeshPhongMaterial({color,shininess:7,specular:'#3d493e',...extra});if(Object.keys(extra).length)return create();if(!materials.has(color))materials.set(color,create());return materials.get(color)};
 const sandstone=standard('#f1d2a0',{map:stoneTexture('#dfc495')}),cream=standard('#f6e6c7',{map:marbleTexture()}),darkstone=standard('#b68a55',{map:stoneTexture('#c09d70',26)}),teal=standard('#1c7071'),gold=standard('#c9a24b',{metalness:.45,roughness:.35}),red=standard('#9d3e37'),wood=standard('#745133',{map:stoneTexture('#bd9861',61)}),bronze=standard('#5c7769',{metalness:.32}),ruinMat=standard('#e6ddc0',{map:stoneTexture('#b5bba2',38)}),ruinDark=standard('#728879',{map:marbleTexture()}),frieze=new THREE.MeshStandardMaterial({map:friezeTexture(),roughness:.75}),glyph=standard('#e6c58b',{map:glyphTexture()}),black=standard('#323b3b');
 const boxG=new THREE.BoxGeometry(1,1,1),sphG=new THREE.SphereGeometry(1,16,12),cylG=new THREE.CylinderGeometry(1,1,1,16),coneG=new THREE.ConeGeometry(1,1,12);
 function mesh(parent,g,m,x=0,y=0,z=0,s=[1,1,1],shadow=true){const o=new THREE.Mesh(g,m);o.position.set(x,y,z);o.scale.set(...s);o.castShadow=shadow;o.receiveShadow=true;parent.add(o);return o}
 const box=(p,x,y,z,w,h,d,m=sandstone,sh=true)=>mesh(p,boxG,m,x,y,z,[w,h,d],sh);
 const sphere=(p,x,y,z,rx,ry,rz,m)=>mesh(p,sphG,m,x,y,z,[rx,ry,rz]);
 const cyl=(p,x,y,z,r,h,m=cream)=>mesh(p,cylG,m,x,y,z,[r,h,r]);
 function rod(p,a,b,r,m=gold){const start=new THREE.Vector3(...a),end=new THREE.Vector3(...b),o=cyl(p,...start.clone().add(end).multiplyScalar(.5).toArray(),r,start.distanceTo(end),m);o.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),end.sub(start).normalize());return o}
 function column(p,x,y,z,h=6,r=.43,m=cream){
  const g=new THREE.Group();g.position.set(x,y,z);p.add(g);
  box(g,0,.12,0,r*2.7,.24,r*2.7,m);cyl(g,0,.32,0,r*1.18,.16,m);cyl(g,0,h/2,0,r,h-.65,m);cyl(g,0,h-.4,0,r*1.17,.2,m);box(g,0,h-.12,0,r*2.8,.24,r*2.8,m);
  // Faceted fluting produces real depth, not a flat column icon.
  const flute=new THREE.InstancedMesh(new THREE.CylinderGeometry(.025,.025,h-.95,5),m,12);const dummy=new THREE.Object3D();for(let j=0;j<12;j++){const a=j/12*Math.PI*2;dummy.position.set(Math.sin(a)*r*.99,h/2,Math.cos(a)*r*.99);dummy.updateMatrix();flute.setMatrixAt(j,dummy.matrix)}g.add(flute);return g;
 }
 function pediment(p,x,y,z,w,h,d,m=cream){const shape=new THREE.Shape();shape.moveTo(-w/2,0);shape.lineTo(0,h);shape.lineTo(w/2,0);shape.closePath();const geo=new THREE.ExtrudeGeometry(shape,{depth:d,bevelEnabled:false});return mesh(p,geo,m,x,y,z-d/2)}
 function temple(p,x,z,scale=1){const g=new THREE.Group();g.position.set(x,1.15,z);g.scale.setScalar(scale);p.add(g);for(let j=0;j<3;j++)box(g,0,.15+j*.24,0,15-j*.7,.3,10-j*.65);box(g,0,3,-2.4,11,4.8,4,sandstone);box(g,0,3,.01,2.6,4,.1,teal);for(let i=0;i<6;i++)column(g,(i-2.5)*2.15,.75,3.3,5.6,.37);box(g,0,6.4,0,14,.48,9.2,cream);box(g,0,6.65,4.65,13.7,.3,.08,frieze);pediment(g,0,6.75,0,14,2.9,9,cream);pediment(g,0,6.9,4.53,11.4,2.1,.02,darkstone);sphere(g,0,7.8,4.56,.65,.65,.07,gold);return g}
 function statue(p,x,y,z,scale=1,m=cream,broken=false){
  const g=new THREE.Group();p.add(g);g.position.set(x,y,z);g.scale.setScalar(scale);
  box(g,0,.25,0,1.65,.5,1.5,m);box(g,0,.6,0,1.4,.24,1.3,m);
  for(const side of [-1,1]){box(g,side*.3,1.38,0,.4,1.4,.45,m);box(g,side*.3,.88,.2,.45,.22,.9,m)}
  const body=new THREE.LatheGeometry([new THREE.Vector2(.48,0),new THREE.Vector2(.55,.2),new THREE.Vector2(.51,.7),new THREE.Vector2(.7,1.25),new THREE.Vector2(.63,1.55),new THREE.Vector2(.28,1.8)],24);mesh(g,body,m,0,1.8,0,[1,1,.68]);
  box(g,0,2.07,.16,1.19,.43,.87,m);for(let i=-2;i<=2;i++)box(g,i*.2,2.07,.61,.035,.37,.05,broken?ruinDark:gold,false);
  for(const s of [-1,1]){sphere(g,s*.66,3.02,0,.24,.3,.25,m);const arm=cyl(g,s*.76,2.54,0,.18,1.05,m);arm.rotation.z=s*.12;sphere(g,s*.82,1.99,.04,.18,.2,.19,m)}
  // Carved monumental pharaonic bust, deliberately not a human character rig.
  sphere(g,0,3.78,.06,.5,.64,.44,m);sphere(g,0,3.87,-.15,.65,.77,.45,m);for(const sign of [-1,1]){const hood=box(g,sign*.53,3.64,0,.3,1.1,.4,m);hood.rotation.z=sign*.16;for(let k=0;k<6;k++){const stripe=box(g,sign*(.52+(5-k)*.014),3.21+k*.16,.22,.26,.026,.026,broken?ruinDark:gold,false);stripe.rotation.z=sign*.16}}
  sphere(g,0,3.78,.27,.46,.59,.34,m);sphere(g,0,3.73,.59,.065,.16,.075,m);for(const s of [-1,1]){sphere(g,s*.19,3.91,.575,.105,.032,.028,broken?ruinDark:black);const l=box(g,s*.55,3.65,.27,.07,.83,.08,broken?ruinDark:gold,false);l.rotation.z=s*.12}box(g,0,3.55,.57,.22,.04,.06,ruinDark,false);box(g,0,3.34,.42,.12,.3,.11,m);for(let j=0;j<3;j++){const collar=mesh(g,new THREE.TorusGeometry(.35+j*.07,.035,5,32),broken?ruinDark:gold,0,3.24-j*.07,.18,[1,.55,.5]);collar.rotation.x=.3}box(g,0,.53,.77,.75,.22,.025,broken?ruinDark:gold,false);
  return g;
 }
 const floorMat=standard('#f3e0b3',{map:floorTexture()});
 box(ancient,0,.25,-10,38,1.8,24,sandstone);box(ancient,0,1.2,-10,38,.15,24,floorMat);
 // Sea walls, block joints, quay bollards, stairs, inscriptions and stepped terraces.
 for(let i=-9;i<=9;i++){box(ancient,i*2,-.05,2.05,1.96,1.9,.7,i%3?darkstone:sandstone);box(ancient,i*2,1.06,2.1,1.99,.22,.95,cream)}
 for(let i=0;i<7;i++)box(ancient,0,1.24+i*.2,-6.6-i*.42,9-i*.17,.24,1.4,cream);
 box(ancient,0,1.8,-15,24,1.1,14,sandstone);box(ancient,0,2.4,-15,24,.16,14,floorMat);
 // Main royal palace, open portico and richly banded upper storeys.
 box(ancient,0,6,-19,21,7.2,7,sandstone);box(ancient,0,9.7,-19,23,.6,9,cream);box(ancient,0,10.1,-19,23.2,.18,9.2,gold);
 for(let floor=0;floor<2;floor++)for(let i=-3;i<=3;i++){box(ancient,i*2.7,4.3+floor*3,-15.44,1.5,2.1,.12,teal);box(ancient,i*2.7,5.43+floor*3,-15.3,1.75,.18,.3,cream);for(const s of [-1,1])box(ancient,i*2.7+s*.82,4.3+floor*3,-15.3,.16,2.45,.24,cream)}
 for(let i=-4;i<=4;i++)column(ancient,i*2.45,2.5,-8.7,6.2,.42);
 box(ancient,0,8.85,-11.2,23,.65,7,cream);box(ancient,0,9,-7.65,23,.5,.08,frieze);box(ancient,0,9.46,-7.6,23.4,.19,.3,gold);
 pediment(ancient,0,9.4,-11,13,2.6,6.7,cream);pediment(ancient,0,9.55,-7.62,10.4,1.8,.03,teal);sphere(ancient,0,10.3,-7.56,.65,.65,.08,gold);
 for(let side of [-1,1])for(let j=0;j<7;j++){const feather=box(ancient,side*(.9+j*.37),10.2-j*.07,-7.53,.33,.13,.06,gold,false);feather.rotation.z=side*.22}for(let j=-24;j<=24;j++)box(ancient,j*.46,8.65,-7.52,.2,.23,.2,cream,false);
 for(const s of [-1,1]){box(ancient,s*12.5,4.2,-11.7,3,5.9,7,sandstone);box(ancient,s*12.5,7.3,-11.7,3.7,.35,7.5,cream);box(ancient,s*12.5,4.9,-8.14,1.6,3.4,.05,glyph);statue(ancient,s*10.8,1.3,-3.7,1.15);}
 temple(ancient,-24,-21,.85);temple(ancient,23,-22,1.15);
 // Continuous balustrades: openings and foreground depth, not painted background walls.
 for(const side of [-1,1]){for(let i=0;i<9;i++)column(ancient,side*(5+i*1.4),1.28,-1.7,1.15,.12,cream);box(ancient,side*10.6,2.5,-1.7,13,.2,.42,cream)}
 // Urban backdrop in depth, individually varied rooftops/windows.
 for(let row=0;row<3;row++)for(let i=-8;i<=8;i++){const x=i*6+(row%2)*3,z=-35-row*8,h=3+rng()*5;box(ancient,x,h/2+1,z,5,h,5.5,i%3?cream:sandstone,false);box(ancient,x,h+1.2,z,5.3,.3,5.8,darkstone,false);for(let j=-1;j<=1;j++)box(ancient,x+j*1.3,h*.7,z+2.78,.6,1.1,.03,teal,false)}
 // Pharos lighthouse: historical silhouette, an illustrative reconstruction.
 const lighthouse=new THREE.Group();ancient.add(lighthouse);lighthouse.position.set(-14,1,-48);box(lighthouse,0,.4,0,12,.8,12,cream);box(lighthouse,0,7,0,7,13,7,sandstone);box(lighthouse,0,13.6,0,8,.5,8,cream);mesh(lighthouse,new THREE.CylinderGeometry(2.2,2.7,7,8),cream,0,17.3,0);cyl(lighthouse,0,21.2,0,3,.7,darkstone);cyl(lighthouse,0,23.6,0,1.55,4.2,cream);mesh(lighthouse,coneG,gold,0,26.3,0,[2.3,1.6,2.3]);sphere(lighthouse,0,24,0,.7,1,.7,gold);for(const side of [-1,1])box(lighthouse,side*3.52,9,0,.04,2.7,1.2,teal,false);
 // Quayside dressing: cargo, coiled ropes, amphorae and date palms.
 function amphora(p,x,y,z,s=1,m=darkstone){const g=new THREE.Group();p.add(g);g.position.set(x,y,z);g.scale.setScalar(s);sphere(g,0,.45,0,.27,.42,.27,m);cyl(g,0,.86,0,.11,.23,m);cyl(g,0,1,0,.16,.08,m);for(const side of [-1,1]){const h=mesh(g,new THREE.TorusGeometry(.16,.035,6,16),m,side*.21,.75,0);h.scale.x=.55}return g}
 for(let i=0;i<20;i++)amphora(ancient,-14+rng()*3,1.3,-4+rng()*6,.7+rng()*.6,i%3?darkstone:teal);
 for(let i=0;i<10;i++){const x=12+(i%3)*1.2,y=1.65+Math.floor(i/6)*.85,z=-4+Math.floor(i/3)%2*1.1;box(ancient,x,y,z,.9,.8,.9,wood);for(const off of [-.3,.3])box(ancient,x+off,y,z+.46,.07,.85,.03,darkstone,false)}
 for(let i=0;i<8;i++){const x=-15+i*4.3;cyl(ancient,x,1.5,1.4,.13,.6,bronze);const ring=mesh(ancient,new THREE.TorusGeometry(.32,.045,6,20),wood,x,1.31,1.4);ring.rotation.x=-Math.PI/2;}
 function palm(x,z,h){const g=new THREE.Group();g.position.set(x,1.2,z);ancient.add(g);const trunk=cyl(g,0,h/2,0,.19,h,darkstone);trunk.rotation.z=.06;for(let i=0;i<8;i++){const a=i/8*Math.PI*2;const pts=[];for(let k=0;k<6;k++){const r=k/5*3.3;pts.push(new THREE.Vector3(Math.cos(a)*r,h+Math.sin(k/5*Math.PI)*.8-k*.17,Math.sin(a)*r))}const curve=new THREE.CatmullRomCurve3(pts);const geo=new THREE.TubeGeometry(curve,8,.1,3,false);mesh(g,geo,standard(i%2?'#447c55':'#699151'));for(let j=1;j<5;j++){const r=j/5*3;const leaf=mesh(g,new THREE.ConeGeometry(.28,1.2,3),standard('#5c8b59'),Math.cos(a)*r,h+.45-j*.17,Math.sin(a)*r,[1,1,1],false);leaf.rotation.set(Math.sin(a)*1.2,0,-Math.cos(a)*1.2)}}return g}
 const palms=[palm(-17,-6,6),palm(17,-6,6.7),palm(-18,-17,7),palm(18,-16,6.4)];
 // Cloth is actual deforming geometry and receives the lighting of the scene.
 const cloths=[];
 function cloth(parent,x,y,z,w,h,color,rot=0){const geo=new THREE.PlaneGeometry(w,h,12,10),material=new THREE.MeshStandardMaterial({color,side:THREE.DoubleSide,roughness:.9});const o=mesh(parent,geo,material,x,y,z);o.rotation.y=rot;cloths.push({mesh:o,base:new Float32Array(geo.attributes.position.array),w,h});return o}
 for(const side of [-1,1]){rod(ancient,[side*11.5,7.6,-7],[side*11.5,12,-7],.055);cloth(ancient,side*11.5+.8,10.7,-7,1.6,2.2,side<0?'#278e8c':'#a54439');}
 cloth(ancient,0,6.4,-15.1,4.4,4.2,'#913f46');
 function ship(x,z,scale=1){const g=new THREE.Group();life.add(g);g.position.set(x,0,z);g.scale.setScalar(scale);
  const hull=new THREE.Shape();hull.moveTo(-3,0);hull.quadraticCurveTo(-2.8,-1,0,-1.05);hull.quadraticCurveTo(2.8,-1,3.5,.4);hull.lineTo(2.5,.5);hull.quadraticCurveTo(0,.15,-3,0);const body=mesh(g,new THREE.ExtrudeGeometry(hull,{depth:1.5,bevelEnabled:true,bevelThickness:.15,bevelSize:.15,bevelSegments:2,steps:1}),wood,0,.65,-.75);box(g,0,.7,0,5,.12,1.5,wood);box(g,0,.55,.88,5.4,.15,.08,red);box(g,0,.55,-.88,5.4,.15,.08,red);rod(g,[0,.6,0],[0,6.4,0],.07,wood);rod(g,[-2.2,5.8,0],[2.2,5.8,0],.055,wood);cloth(g,0,4.2,0,4.3,3,'#e5ce96');rod(g,[-2.7,.8,.75],[0,6.2,0],.016,wood);rod(g,[2.7,.8,.75],[0,6.2,0],.016,wood);for(let i=-2;i<=2;i++)rod(g,[i,.65,.9],[i-1,-.05,2],.035,wood);sphere(g,3.25,.9,0,.16,.25,.2,gold);return g;
 }
 const ships=[ship(20,15,1.35),ship(-16,16,.85),ship(24,3,.85),ship(-8,30,.6)];ships.forEach((s,i)=>s.rotation.y=[-.65,.3,1.3,-.2][i]);
 // Modern expedition launch. Boat stays on the actual surface during the dive.
 const boat=new THREE.Group();life.add(boat);boat.position.set(0,.1,2);const bh=box(boat,0,0,0,4.4,.8,2.2,standard('#e0e0c9'));box(boat,0,-.3,0,4.2,.26,2.1,standard('#224a62'));box(boat,-.7,.7,0,1.7,.9,1.6,cream);box(boat,-.6,1.45,0,2,.2,1.9,teal);box(boat,-.65,.92,1,.9,.43,.02,teal);rod(boat,[-1,.8,0],[-1,3,0],.035,black);
 const boatName=texture(512,128,c=>{c.clearRect(0,0,512,128);c.fillStyle='#284e5a';c.textAlign='center';c.font='bold 52px serif';c.fillText('ALEXANDRIA · 1992',256,83)});const nm=new THREE.Mesh(new THREE.PlaneGeometry(3.8,.95),new THREE.MeshBasicMaterial({map:boatName,transparent:true}));nm.position.set(0,.18,1.12);boat.add(nm);
 // Seabed: densely dressed discoverable archaeological set.
 const seabedTex=texture(512,512,c=>{c.fillStyle='#7d927a';c.fillRect(0,0,512,512);const rr=random(301);for(let i=0;i<30000;i++){c.fillStyle=i%2?'#b1b39333':'#304e4930';c.fillRect(rr()*512,rr()*512,rr()*4+1,1)}});seabedTex.wrapS=seabedTex.wrapT=THREE.RepeatWrapping;seabedTex.repeat.set(12,12);const bedMat=standard('#acb391',{map:seabedTex});
 const seabed=box(ruins,0,-16.9,-6,140,1,160,bedMat,false);
 const pedestals=[];for(const [x,z,h] of [[-6,-9,5.8],[-3.3,-9,4.8],[2,-9,6.8],[5,-9,4.6],[8,-9,5.6],[-7,-15,6],[1,-17,4],[9,-17,3.7]])pedestals.push(column(ruins,x,-16.4,z,h,.52,ruinMat));
 const fallingColumns=[];
 for(const [x,z,h,d] of [[-3,-3,5.8,.18],[3,-4,6.4,.4],[7,-12,5,.6]]){const p=new THREE.Group();ruins.add(p);p.position.set(x,-16.4,z);const co=column(p,0,0,0,h,.59,ruinMat);fallingColumns.push({pivot:p,delay:d,dir:x<0?-1:1});}
 const fallen=column(ruins,-6.5,-15.9,-.5,5.8,.57,ruinMat);fallen.rotation.z=-Math.PI/2+.12;fallen.rotation.y=.3;
 const sculptMat=new THREE.MeshStandardMaterial({color:'#cfb39b',roughness:.92});
 const colossal=statue(ruins,-1.8,-16.45,-3,1.9,sculptMat,true);
 // Fallen crowned head from a separate monument, plus an inscribed broken slab.
 const head=new THREE.Group();ruins.add(head);head.position.set(3.7,-15.7,1.2);head.rotation.z=.7;head.rotation.x=.28;sphere(head,0,.8,0,1.1,1.4,1,sculptMat);sphere(head,0,1,-.2,1.35,1.65,1,sculptMat);for(const sign of [-1,1]){const side=box(head,sign*1.05,.8,.1,.5,2.1,.85,sculptMat);side.rotation.z=sign*.15;for(let j=0;j<8;j++)box(head,sign*1.1,.04+j*.23,.56,.5,.045,.04,ruinDark,false)}sphere(head,0,.8,.45,1,1.18,.7,sculptMat);box(head,0,.75,1.14,.27,.6,.25,sculptMat);for(const s of [-1,1])box(head,s*.4,1.16,1.08,.4,.1,.07,ruinDark);box(head,0,.2,1.08,.5,.08,.05,ruinDark);
 const slab=box(ruins,1,-16.03,3.2,3.3,.35,2.6,ruinMat);const inscribed=new THREE.Mesh(new THREE.PlaneGeometry(2.9,2.2),new THREE.MeshStandardMaterial({map:glyphTexture(),color:'#8b9c7f'}));inscribed.rotation.x=-Math.PI/2;inscribed.position.set(1,-15.84,3.2);ruins.add(inscribed);
 // Foundations and toppled lintels preserve the language/layout of the royal quarter.
 for(let row=0;row<3;row++)for(let j=0;j<4;j++)box(ruins,-7+j*4,-16.2,-6-row*6,3.7,.65,1,ruinMat);
 box(ruins,0,-15.7,-12,16,.65,1.2,ruinMat);box(ruins,-9,-15.7,-6,1,1.1,18,ruinMat);
 const debris=[];for(let i=0;i<150;i++){const x=(rng()-.5)*45,z=(rng()-.5)*45-7,s=.15+rng()*.8,o=box(ruins,x,-16.2+rng()*.15,z,s,s*.5,s*(.6+rng()),i%3?ruinMat:ruinDark,false);o.rotation.set(rng()*.3,rng()*6,rng()*.3);debris.push({mesh:o,base:o.position.clone(),seed:rng(),height:1+rng()*6})}
 const pots=[];for(let i=0;i<12;i++)pots.push(amphora(ruins,-8+rng()*16,-16.4,1+rng()*14,.65+rng()*.6,ruinMat));
 // Corals, branching sea fans, seagrass and encrustation are actual foreground geometry.
 const coralMats=['#bf8b74','#c99e78','#608d7c','#9eaf81'].map(c=>standard(c));const reefs=[];
 for(let i=0;i<60;i++){const x=(rng()-.5)*37,z=(rng()-.5)*37-5,g=new THREE.Group();g.position.set(x,-16.4,z);ruins.add(g);const m=coralMats[i%4];for(let j=0;j<3;j++){const a=(j-1)*.7,h=.3+rng()*.65;rod(g,[0,0,0],[a*.45,h,0],.055,m);rod(g,[a*.3,h*.65,0],[a*.6,h+.15,.1],.035,m)}reefs.push(g)}
 const grass=[];const grassMat=standard('#467e6d',{side:THREE.DoubleSide});for(let i=0;i<90;i++){const x=(rng()-.5)*44,z=(rng()-.5)*44-4;const o=mesh(ruins,new THREE.ConeGeometry(.08,.7+rng()*.5,3),grassMat,x,-16,z,[1,1,1],false);grass.push({mesh:o,phase:rng()*6})}
 // Moving fish are silhouetted meshes, with articulated tails.
 const fish=[];for(let i=0;i<24;i++){const g=new THREE.Group();life.add(g);const m=standard(i%3?'#547c76':'#d7bc75');sphere(g,0,0,0,.23,.11,.07,m);const tail=mesh(g,coneG,m,-.28,0,0,[.13,.3,.025],false);tail.rotation.z=Math.PI/2;sphere(g,.14,.03,.055,.022,.022,.01,black);fish.push({group:g,tail,seed:rng()*30})}
 const birds=[];const birdMat=new THREE.LineBasicMaterial({color:'#4a6064'});for(let i=0;i<12;i++){const geo=new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(-.35,0,0),new THREE.Vector3(0,.15,0),new THREE.Vector3(.35,0,0)]);const o=new THREE.Line(geo,birdMat);life.add(o);birds.push(o)}
 // Powder/silt and bubbles: sparse depth layers, not a flat video overlay.
 function points(count,color,size){const geo=new THREE.BufferGeometry(),data=new Float32Array(count*3);for(let i=0;i<count;i++){data[i*3]=(rng()-.5)*45;data[i*3+1]=-16+rng()*18;data[i*3+2]=(rng()-.5)*45}geo.setAttribute('position',new THREE.BufferAttribute(data,3));const o=new THREE.Points(geo,new THREE.PointsMaterial({color,size,transparent:true,opacity:.4,depthWrite:false}));life.add(o);return {mesh:o,base:new Float32Array(data)}}
 const silt=points(700,'#a8cec0',.035),dust=points(240,'#c7bb9b',.09),bubbles=points(100,'#bfe3da',.045);
 const queen=makeActor('queen'),attendant=makeActor('attendant'),guards=[makeActor('guard'),makeActor('guard')],extras=[makeActor('attendant'),makeActor('attendant'),makeActor('guard')],divers=[makeActor('diver'),makeActor('diver')];
 ancient.add(queen.group,attendant.group,...guards.map(a=>a.group),...extras.map(a=>a.group));divers.forEach(a=>life.add(a.group));queen.group.position.set(0,1.3,-3.8);attendant.group.position.set(2.4,1.3,-5);guards.forEach((a,i)=>a.group.position.set(i?5:-5,1.3,-4.8));extras.forEach((a,i)=>{a.group.position.set(-12+i*10,1.3,-6-i*1.4);a.group.scale.setScalar(.8)});
 // Diver torches: translucent illuminated cones are in world space and sweep over the ruins.
 const torches=[];for(let i=0;i<2;i++){const g=new THREE.Group();life.add(g);const beam=mesh(g,new THREE.ConeGeometry(1.7,8,24,1,true),new THREE.MeshBasicMaterial({color:'#e8e3ab',transparent:true,opacity:.047,depthWrite:false,side:THREE.DoubleSide,blending:THREE.AdditiveBlending}),0,0,0,[1,1,1],false);const spot=new THREE.SpotLight('#e5e7b1',28,17,.28,.7,1);g.add(spot,spot.target);torches.push({group:g,beam,spot})}
 // Survey tape and marker rods, only used by the 1992 survey shot.
 const survey=new THREE.Group();life.add(survey);for(const x of [-3,3]){rod(survey,[x,-16.1,2],[x,-15.4,2],.025,gold);sphere(survey,x,-15.4,2,.07,.07,.07,red)}rod(survey,[-3,-15.7,2],[3,-15.7,2],.018,gold);for(let i=0;i<=24;i++)box(survey,-3+i*.25,-15.68,2,.02,.01,.11,i%4?black:cream,false);
 return {ancient,ruins,life,queen,attendant,guards,extras,divers,ships,boat,cloths,palms,fish,birds,silt,dust,bubbles,fallingColumns,colossal,debris,reefs,grass,torches,survey,inscribed,materials:{ruinMat,ruinDark,glyph,sculptMat},rod,mesh};
}
