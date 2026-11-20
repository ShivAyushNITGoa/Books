/* Reference-directed 2.5D: animated ink-and-paper character billboards in ONE
   dimensional classroom. No scene changes or infographic slide overlays.
   Every pose, prop and camera coordinate is an absolute function of time. */
import * as THREE from '../studio/vendor/three/three.module.js';
const canvas=document.querySelector('canvas'), ctx=canvas.getContext('2d');
const W=720,H=1280, INK='#302323';
const clamp=x=>Math.max(0,Math.min(1,x)), smooth=x=>{x=clamp(x);return x*x*(3-2*x)}, mix=(a,b,u)=>a+(b-a)*u;
const ramp=(t,a,b)=>smooth((t-a)/(b-a));
function poly(c,p,fill,stroke=null,w=4){c.beginPath();p.forEach(([x,y],i)=>i?c.lineTo(x,y):c.moveTo(x,y));c.closePath();if(fill){c.fillStyle=fill;c.fill()}if(stroke){c.strokeStyle=stroke;c.lineWidth=w;c.stroke()}}
function line(c,p,color=INK,w=5){c.beginPath();p.forEach(([x,y],i)=>i?c.lineTo(x,y):c.moveTo(x,y));c.strokeStyle=color;c.lineWidth=w;c.lineCap='round';c.lineJoin='round';c.stroke()}
function ellipse(c,x,y,rx,ry,fill,stroke=null,w=4){c.beginPath();c.ellipse(x,y,rx,ry,0,0,Math.PI*2);if(fill){c.fillStyle=fill;c.fill()}if(stroke){c.strokeStyle=stroke;c.lineWidth=w;c.stroke()}}
function round(c,x,y,w,h,fill,r=4,stroke=null,lw=3){c.beginPath();c.roundRect(x,y,w,h,r);c.fillStyle=fill;c.fill();if(stroke){c.strokeStyle=stroke;c.lineWidth=lw;c.stroke()}}
function label(c,s,x,y,size=30,color='#fff2c9',font='serif'){c.fillStyle=color;c.font=`bold ${size}px ${font}`;c.textAlign='center';c.fillText(s,x,y)}
function texture(w,h,draw){const c=document.createElement('canvas');c.width=w;c.height=h;draw(c.getContext('2d'));const t=new THREE.CanvasTexture(c);t.colorSpace=THREE.SRGBColorSpace;return t}
const wood=texture(512,512,c=>{c.fillStyle='#c68244';c.fillRect(0,0,512,512);for(let row=0;row<8;row++){const y=row*64;c.fillStyle=`hsl(${26+row%3},${53+row%4}%,${48+row%3*3}%)`;c.fillRect(0,y,512,62);for(let n=0;n<13;n++){let yy=y+5+n*4;line(c,[[0,yy],[120,yy+Math.sin(n)*2],[345,yy-2],[512,yy+1]],n%3?'#8b512a30':'#edba7645',1)}line(c,[[row%2?160:350,y],[row%2?160:350,y+64]],'#683b2c80',2);line(c,[[0,y],[512,y]],'#70432d',2)}});wood.wrapS=wood.wrapT=THREE.RepeatWrapping;
const wallTex=texture(256,256,c=>{c.fillStyle='#cf936e';c.fillRect(0,0,256,256);for(let i=0;i<150;i++){c.fillStyle=`rgba(255,215,163,${.02+(i%7)*.007})`;c.fillRect((i*73)%256,(i*47)%256,8+i%14,24+i%37)}});
const scene=new THREE.Scene();scene.background=new THREE.Color('#d6ac7e');
const camera=new THREE.PerspectiveCamera(40,W/H,.1,70);
const renderer=new THREE.WebGLRenderer({antialias:true,preserveDrawingBuffer:true,alpha:false});renderer.setSize(W,H);renderer.setPixelRatio(1);renderer.shadowMap.enabled=true;renderer.shadowMap.type=THREE.PCFSoftShadowMap;renderer.outputColorSpace=THREE.SRGBColorSpace;renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.18;
scene.add(new THREE.HemisphereLight('#ffecd5','#9c6743',2.0));
const sun=new THREE.DirectionalLight('#ffd293',3.4);sun.position.set(-6,8,4);sun.castShadow=true;sun.shadow.mapSize.set(1024,1024);sun.shadow.camera.left=-9;sun.shadow.camera.right=9;sun.shadow.camera.top=9;sun.shadow.camera.bottom=-9;sun.shadow.normalBias=.025;sun.shadow.bias=-.0003;scene.add(sun);sun.target.position.set(0,0,-1);scene.add(sun.target);
const fill=new THREE.PointLight('#ffe1aa',16,12,2);fill.position.set(0,4,1);scene.add(fill);
const mat=(color,extra={})=>new THREE.MeshStandardMaterial({color,roughness:.9,...extra});
const timber=mat('#f6c184',{map:wood}), darkWood=mat('#b57a4f',{map:wood}), metal=mat('#353438'), wall=mat('#fff3d6',{map:wallTex});
function box(x,y,z,w,h,d,m,cast=true){const o=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),m);o.position.set(x,y,z);o.castShadow=cast;o.receiveShadow=true;scene.add(o);return o}
function plane(x,y,z,w,h,m){const o=new THREE.Mesh(new THREE.PlaneGeometry(w,h),m);o.position.set(x,y,z);o.receiveShadow=true;scene.add(o);return o}
// All furniture and walls are permanent geometry. The camera really changes perspective.
const floorMat=mat('#ffe1aa',{map:wood.clone()});floorMat.map.repeat.set(3,4);floorMat.map.needsUpdate=true;
box(0,-.12,0,14,.2,15,floorMat,false);box(0,2.5,-4.6,14,5,.15,wall,false);box(-6.4,2.5,0,.14,5,10,wall,false);box(6.4,2.5,0,.14,5,10,wall,false);
box(0,.65,-4.45,14,1.3,.1,darkWood,false);
// World-space chalkboard: the study is a physical teaching prop, never an overlay.
box(.2,2.75,-4.35,7.7,2.6,.16,darkWood);
const boardTex=texture(1536,512,c=>{c.fillStyle='#294d40';c.fillRect(0,0,1536,512);for(let i=0;i<35;i++)ellipse(c,(i*173)%1536,(i*89)%512,80+i%40,25,'#88a87d0b');label(c,'THE COOKIE-JAR EFFECT',768,85,62);line(c,[[90,113],[1450,113]],'#ecd8ac',4);label(c,'WORCHEL • LEE • ADEWOLE / 1975',768,172,27);label(c,'SAME COOKIES. DIFFERENT QUANTITIES.',768,300,43);label(c,'10',320,418,68);label(c,'2',1200,418,68);line(c,[[530,395],[1000,395]],'#f2d29d',5);poly(c,[[1000,395],[972,378],[972,412]],'#f2d29d');});
plane(.2,2.75,-4.25,7.35,2.3,mat('#ffffff',{map:boardTex}));box(.2,1.46,-4.12,8,.08,.28,timber);
// Clock and window make the room spatially recognizable during every camera move.
const clockTex=texture(256,256,c=>{ellipse(c,128,128,119,119,'#fff5de',INK,7);for(let i=0;i<12;i++){const a=i*Math.PI/6;line(c,[[128+99*Math.sin(a),128-99*Math.cos(a)],[128+109*Math.sin(a),128-109*Math.cos(a)]],INK,3)}line(c,[[128,52],[128,128],[184,143]],INK,6)});
plane(.2,4.45,-4.15,.72,.72,mat('#ffffff',{map:clockTex,transparent:true}));
const sky=texture(512,512,c=>{const grad=c.createLinearGradient(0,0,0,512);grad.addColorStop(0,'#74b3c6');grad.addColorStop(1,'#fae0a4');c.fillStyle=grad;c.fillRect(0,0,512,512);ellipse(c,125,110,50,50,'#fff4be');poly(c,[[0,512],[0,420],[210,270],[345,410],[512,290],[512,512]],'#729d93')});
const win=plane(-6.25,2.95,-.6,3.2,2.7,new THREE.MeshBasicMaterial({map:sky}));win.rotation.y=Math.PI/2;
for(const z of [-2.25,1.05])box(-6.15,2.95,z,.12,2.9,.13,timber,false);for(const y of [1.54,4.36,2.95])box(-6.12,y,-.6,.14,.13,3.5,timber,false);box(-6.12,2.95,-.6,.13,2.8,.09,timber,false);
// Sun shafts: subtle planes in the set, plus the directional light's real shadows.
for(let i=0;i<3;i++){const geo=new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(-6,4.2,-2+i*1.1),new THREE.Vector3(-6,4.2,-1.4+i*1.1),new THREE.Vector3(4,0,4+i*1.1),new THREE.Vector3(2,0,4+i*1.1)]);geo.setIndex([0,1,2,0,2,3]);geo.computeVertexNormals();scene.add(new THREE.Mesh(geo,new THREE.MeshBasicMaterial({color:'#fff0be',transparent:true,opacity:.055,depthWrite:false,side:THREE.DoubleSide})));}
function desk(x,z,w=2.2,d=1.05,h=1.02){for(const sx of [-1,1])for(const sz of [-1,1])box(x+sx*(w/2-.12),h/2,z+sz*(d/2-.12),.085,h,.085,metal);box(x,h,z,w,.12,d,timber);box(x,h*.65,z+d/2-.09,w-.14,h*.5,.075,darkWood);return h+.06}
function notebook(x,y,z,col='#f4e4c8'){box(x,y,z,.6,.035,.4,mat(col));box(x,y+.022,z,.56,.014,.37,mat('#fff3da'));const pencil=box(x+.42,y+.05,z,.035,.035,.43,mat('#d6ad33'));pencil.rotation.y=.35}
// Front demo table; two side desks for phone and book, all visible in the wide shot.
const tableY=desk(0,-1.2,2.3,1.04,1.06);notebook(-2.4,desk(-2.3,.45,1.6,.95,.92)+.03,.45);notebook(2.6,desk(2.5,.9,1.6,.95,.92)+.03,.9,'#477f80');
// Foreground desks create parallax rather than a flat wallpaper background.
notebook(-2.7,desk(-2.8,3.9,1.9,1.1,.88)+.03,3.9);notebook(2.5,desk(2.5,4.6,1.9,1.1,.88)+.03,4.6);
const phone=box(-2.15,1.02,.45,.2,.035,.36,metal);const phoneScreen=box(-2.15,1.042,.45,.16,.008,.29,mat('#80cecb',{emissive:'#3d9c9a',emissiveIntensity:.3}));
function jar(x,count){const group=new THREE.Group();group.position.set(x,tableY,-1.15);scene.add(group);
 const glass=new THREE.Mesh(new THREE.CylinderGeometry(.21,.23,.67,20,1,true),new THREE.MeshPhysicalMaterial({color:'#b2d9d4',transparent:true,opacity:.19,roughness:.18,side:THREE.DoubleSide,depthWrite:false}));glass.position.y=.34;group.add(glass);
 for(const y of [.025,.68]){const rim=new THREE.Mesh(new THREE.TorusGeometry(.215,.015,6,30),mat('#8ca7a0'));rim.rotation.x=Math.PI/2;rim.position.y=y;group.add(rim)}
 const lid=new THREE.Mesh(new THREE.CylinderGeometry(.235,.235,.055,24),mat('#547c76'));lid.position.y=.73;lid.castShadow=true;group.add(lid);
 const cookieMat=mat('#d29a54');const cookies=[];for(let i=0;i<count;i++){const co=new THREE.Group();const m=new THREE.Mesh(new THREE.CylinderGeometry(.083,.083,.04,12),cookieMat);m.rotation.x=Math.PI/2;co.add(m);for(let n=0;n<3;n++){const chip=new THREE.Mesh(new THREE.SphereGeometry(.012,5,4),mat('#68422a'));chip.position.set(Math.sin(n*2.3)*.045,Math.cos(n*2.3)*.045,.027);co.add(chip)}co.position.set((i%3-1)*.12,.105+Math.floor(i/3)*.13,.04+(i%2)*.035);co.rotation.z=i*.8;group.add(co);cookies.push(co)}
 const num=texture(128,64,c=>{round(c,3,2,122,60,'#fff4d9',8);label(c,String(count),64,46,46,INK,'sans-serif')});const tag=new THREE.Mesh(new THREE.PlaneGeometry(.24,.12),new THREE.MeshBasicMaterial({map:num,transparent:true}));tag.position.set(0,.49,.23);group.add(tag);return {group,cookies,tag,lid};}
const full=jar(-.48,10),scarce=jar(.48,2);
// Thick-lined, cream-faced cutout characters. Clothing is graphic, NOT anatomy.
function makeActor(kind){const art=document.createElement('canvas');art.width=512;art.height=768;const tex=new THREE.CanvasTexture(art);tex.colorSpace=THREE.SRGBColorSpace;const mesh=new THREE.Mesh(new THREE.PlaneGeometry(1.52,2.28),new THREE.MeshBasicMaterial({map:tex,transparent:true,alphaTest:.08,side:THREE.DoubleSide}));mesh.position.y=1.14;scene.add(mesh);
 const sh=new THREE.Mesh(new THREE.CircleGeometry(.35,32),new THREE.MeshBasicMaterial({color:'#593b2c',transparent:true,opacity:.25,depthWrite:false}));sh.rotation.x=-Math.PI/2;sh.scale.y=.52;sh.position.y=.009;scene.add(sh);
 const projected=new THREE.Mesh(new THREE.PlaneGeometry(1,1),new THREE.MeshBasicMaterial({map:tex,color:'#302020',transparent:true,opacity:.19,depthWrite:false,side:THREE.DoubleSide}));scene.add(projected);
 return {kind,art,tex,mesh,sh,projected};}
const student=makeActor('student'),friend=makeActor('friend');
function paintActor(actor,t,{talk=false,emotion='neutral',walk=0,gesture=0,phoneHeld=0,book=0,cookie=0,look=0}){
 const c=actor.art.getContext('2d');c.clearRect(0,0,512,768);const isStudent=actor.kind==='student',phase=t*8.5;
 const bob=Math.abs(Math.sin(phase))*walk*8+Math.sin(t*2.6)*2;
 c.save();c.translate(256,705-bob);
 const stride=Math.sin(phase)*walk*23;
 for(const s of [-1,1]){const foot=s*31+s*stride;line(c,[[s*25,-143],[s*29+s*stride*.4,-77],[foot,-8]],INK,8);ellipse(c,foot+4,-5,13,5,INK)}
 // Clothes: outlined hoodie or mustard waistcoat, inspired by reference silhouette.
 const grad=c.createLinearGradient(-60,0,70,0);grad.addColorStop(0,isStudent?'#2d7e79':'#a67229');grad.addColorStop(.55,isStudent?'#49a297':'#d8a443');grad.addColorStop(1,isStudent?'#317c75':'#b88731');
 c.beginPath();c.moveTo(-39,-336);c.quadraticCurveTo(-76,-317,-66,-265);c.lineTo(-60,-145);c.quadraticCurveTo(0,-132,60,-145);c.lineTo(67,-267);c.quadraticCurveTo(75,-316,39,-336);c.closePath();c.fillStyle=grad;c.fill();c.strokeStyle=INK;c.lineWidth=7;c.stroke();
 poly(c,[[-26,-334],[0,-288],[27,-334]],'#fff1d5',INK,4);
 if(isStudent){line(c,[[-20,-289],[-20,-230]],'#f7e7c9',4);line(c,[[20,-289],[20,-230]],'#f7e7c9',4);round(c,-42,-199,84,44,'#377d78',12,INK,4)}else{for(let y=-262;y<-159;y+=29)ellipse(c,0,y,3,3,INK);poly(c,[[-17,-308],[0,-300],[-17,-290]],'#bd695a',INK,2);poly(c,[[17,-308],[0,-300],[17,-290]],'#bd695a',INK,2)}
 // Independent joint chains, with reaction-specific hand targets.
 let left=[-76,-208],right=[77,-215];
 if(phoneHeld){left=[-87,-308];right=[-38,-281+Math.sin(t*14)*4]}
 if(gesture){right=[103,-290-gesture*65+Math.sin(t*6)*7];left=[-97,-253-gesture*35]}
 if(emotion==='worried'&&t<3.6)right=[93,-373+Math.sin(t*4)*3];
 if(book){left=[-64,-238];right=[64,-238]}
 if(cookie)left=[-111,-325];
 function limb(s,hand){const start=[s*58,-296],mid=[s*91,(hand[1]-296)/2+34];line(c,[start,mid,hand],INK,7);ellipse(c,hand[0],hand[1],8,8,'#ffe6c8',INK,3)}
 limb(-1,left);limb(1,right);
 if(phoneHeld){c.save();c.translate(-86,-322);c.rotate(-.12);round(c,-21,-32,42,65,'#34353a',6,INK,3);round(c,-16,-26,32,48,'#d6f0e3',2);for(let y=-18;y<9;y+=10)round(c,-11,y,22,5,'#65aaa0',2);c.restore()}
 if(book){poly(c,[[-64,-254],[0,-243],[64,-254],[64,-203],[0,-193],[-64,-203]],'#eee0b9',INK,4);line(c,[[0,-243],[0,-193]],'#8c8266',3)}
 if(cookie){ellipse(c,left[0],left[1]-13,14,14,'#c58d49',INK,2);ellipse(c,left[0]-5,left[1]-17,2,2,INK);ellipse(c,left[0]+6,left[1]-9,2,2,INK)}
 // Oversized head ~46% of the visible figure height, pale face with subtle warm edge.
 c.save();c.translate(Math.sin(t*2)*2,-444);c.rotate(Math.sin(t*1.8)*.025+(emotion==='worried'?-.04:0));
 const face=c.createRadialGradient(-45,-60,10,0,0,142);face.addColorStop(0,'#fff3df');face.addColorStop(.8,'#ffe7cf');face.addColorStop(1,'#e6baa2');ellipse(c,0,0,132,129,face,INK,7);
 // Distinct hair silhouette: soft scalloped quiff vs side-part.
 if(isStudent){c.beginPath();c.moveTo(-129,-22);c.bezierCurveTo(-151,-57,-131,-94,-106,-97);c.bezierCurveTo(-109,-137,-69,-155,-42,-143);c.bezierCurveTo(-9,-175,35,-159,53,-139);c.bezierCurveTo(88,-153,119,-132,120,-101);c.bezierCurveTo(154,-79,142,-33,112,-28);c.bezierCurveTo(83,-23,65,-46,58,-65);c.bezierCurveTo(33,-33,-10,-35,-29,-55);c.bezierCurveTo(-50,-18,-74,-11,-86,-32);c.bezierCurveTo(-101,-2,-117,-1,-129,-22);c.closePath();c.fillStyle='#61402a';c.fill();c.strokeStyle=INK;c.lineWidth=7;c.stroke()}
 else{c.beginPath();c.moveTo(-130,-32);c.bezierCurveTo(-124,-181,118,-178,132,-26);c.lineTo(19,-31);c.lineTo(-6,-58);c.lineTo(-22,-30);c.closePath();c.fillStyle='#3a2b25';c.fill();c.strokeStyle=INK;c.lineWidth=7;c.stroke()}
 const blink=t%3.7>3.54||emotion==='happy'&&!talk;
 for(const s of [-1,1]){const ex=s*44,ey=-3;
 if(blink){c.beginPath();c.arc(ex,ey+5,17,Math.PI+.15,Math.PI*2-.15);c.strokeStyle=INK;c.lineWidth=6;c.stroke()}
 else{ellipse(c,ex,ey,23,29,'#fff9e9',INK,5);ellipse(c,ex+look*6,ey+3+(phoneHeld?6:0),7,9,INK);ellipse(c,ex+look*6-2,ey,2,3,'#fff6e8')}
 const worry=emotion==='worried';line(c,[[ex-22,ey-42+(worry?-s*4:0)],[ex+17,ey-44+(worry?s*8:0)]],INK,6)}
 if(emotion==='worried'){c.beginPath();c.moveTo(-104,-26);c.quadraticCurveTo(-125,8,-107,17);c.quadraticCurveTo(-88,8,-104,-26);c.fillStyle='#7bc4cc';c.fill();c.strokeStyle=INK;c.lineWidth=3;c.stroke()}
 if(talk&&emotion==='worried'){ellipse(c,3,61,14+Math.abs(Math.sin(t*15))*7,15+Math.abs(Math.sin(t*15))*13,'#60242b',INK,5)}
 else if(talk){const op=12+Math.abs(Math.sin(t*15))*16;
 c.beginPath();c.moveTo(-37,52-op*.25);c.lineTo(41,45-op*.25);c.quadraticCurveTo(36,78+op,-1,80+op*.6);c.quadraticCurveTo(-30,80+op,-37,52-op*.25);c.fillStyle='#631f22';c.fill();c.strokeStyle=INK;c.lineWidth=5;c.stroke();poly(c,[[-31,51-op*.25],[34,46-op*.25],[31,59-op*.25],[-27,64-op*.25]],'#fff8e6');}
 else if(emotion==='worried'){ellipse(c,2,65,13,17,'#60242b',INK,4)}
 else{c.beginPath();c.moveTo(-30,58);c.quadraticCurveTo(0,89,33,56);c.strokeStyle=INK;c.lineWidth=5;c.stroke()}
 c.restore();c.restore();actor.tex.needsUpdate=true;
}
// Camera keyframes: time, camera XYZ, look-at XYZ. Always one continuous set.
const shots=[
 [0,.1,3.1,10.0,-.3,1.35,-.4],
 [3.8,-2.95,1.95,4.0,-1.65,1.32,.2],
 [7.4,-2.65,1.92,3.8,-1.45,1.25,-.1],
 [10.6,-.7,2.6,8.2,0,1.3,-1.0],
 [15.2,.6,2.35,2.65,.06,1.49,-1.18],
 [18.6,1.65,2.4,8.0,.25,1.3,-.7],
 [21.2,.1,2.6,8.0,.1,1.3,-.4],
 [25.4,2.7,2.16,5.45,1.25,1.25,.3],
 [30,2.55,2.15,5.1,1.2,1.28,.3]
];
function cameraAt(t){let i=0;while(i<shots.length-2&&t>=shots[i+1][0])i++;const a=shots[i],b=shots[i+1],u=smooth((t-a[0])/(b[0]-a[0]));camera.position.set(...a.slice(1,4).map((v,k)=>mix(v,b[k+1],u)));camera.lookAt(...a.slice(4,7).map((v,k)=>mix(v,b[k+4],u)));}
const rawSubs=await (await fetch('/demo/stickworld-scarcity-30s.srt')).text();
function secs(s){const [h,m,r]=s.replace(',','.').split(':').map(Number);return h*3600+m*60+r}
const subs=rawSubs.trim().split(/\r?\n\s*\r?\n/).map(s=>{const a=s.split(/\r?\n/),[start,end]=a[1].split(' --> ');return {start:secs(start),end:secs(end),text:a.slice(2).join(' ')}});
const inter=new FontFace('ReferenceBold','url(../studio/fonts/Inter.ttf)',{weight:'100 900'});await inter.load();document.fonts.add(inter);
function overlay(t){const v=ctx.createRadialGradient(360,580,350,360,640,830);v.addColorStop(0,'#32141100');v.addColorStop(1,'#25152b42');ctx.fillStyle=v;ctx.fillRect(0,0,W,H);
 const cap=subs.find(s=>t>=s.start&&t<s.end);if(cap){let size=55;ctx.font=`900 ${size}px ReferenceBold`;while(ctx.measureText(cap.text).width>626&&size>30){size--;ctx.font=`900 ${size}px ReferenceBold`}ctx.textAlign='center';ctx.textBaseline='middle';ctx.lineJoin='round';ctx.strokeStyle='#19151e';ctx.lineWidth=14;ctx.strokeText(cap.text,360,1024);ctx.fillStyle='#fffaf2';ctx.fillText(cap.text,360,1024)}
}
export function setT(t){t=Math.max(0,Math.min(30,t));cameraAt(t);
 const move=ramp(t,7.35,10.7),leave=ramp(t,21.3,25.3),busy=ramp(t,3.9,4.3)-ramp(t,7.35,7.7);
 const sx=mix(mix(-1.75,-1.1,move),1.65,leave),sz=mix(mix(.1,-.35,move),.48,leave);
 student.mesh.position.set(sx,1.14,sz);friend.mesh.position.set(1.08,1.14,-1.95);
 const speech=t>.35&&t<27.09;const explaining=t>8.2&&t<19.1;
 paintActor(student,t,{talk:speech&&!explaining&&t<25.35,emotion:t<8?'worried':t>21?'happy':'neutral',walk:move>0&&move<1||leave>0&&leave<1?1:0,phoneHeld:1-ramp(t,7.35,7.75),gesture:t>19.2&&t<21.3?.7:0,book:ramp(t,25.1,25.7),look:explaining?1:0});
 paintActor(friend,t+.35,{talk:speech&&explaining,emotion:'neutral',gesture:ramp(t,8.1,8.9)-ramp(t,19,19.5),cookie:ramp(t,11.4,12)-ramp(t,16.4,17),look:-.5});
 // Cutouts face the lens around the vertical axis; their feet remain in world space.
 for(const a of [student,friend]){a.mesh.rotation.y=Math.atan2(camera.position.x-a.mesh.position.x,camera.position.z-a.mesh.position.z);a.sh.position.set(a.mesh.position.x,.012,a.mesh.position.z);
 const geo=a.projected.geometry, pos=geo.attributes.position;
 const right=new THREE.Vector3(Math.cos(a.mesh.rotation.y)*.65,0,-Math.sin(a.mesh.rotation.y)*.65),base=new THREE.Vector3(a.mesh.position.x,.018,a.mesh.position.z),tip=base.clone().add(new THREE.Vector3(1.6,0,-1.8));
 const verts=[tip.clone().sub(right),tip.clone().add(right),base.clone().sub(right),base.clone().add(right)];verts.forEach((v,i)=>pos.setXYZ(i,v.x,v.y,v.z));pos.needsUpdate=true;geo.computeBoundingSphere();
 }
 phone.visible=phoneScreen.visible=t>=7.7;
 // The scarce jar is opened, sampled and closed: not just a camera zoom on a static prop.
 const pick=ramp(t,10.8,11.4)-ramp(t,16.6,17.2);scarce.lid.position.y=.73+pick*.3;scarce.lid.position.x=pick*.36;scarce.cookies[1].visible=!(t>11.9&&t<17.2);
 for(const j of [full,scarce]){j.tag.rotation.y=Math.atan2(camera.position.x-j.group.position.x,camera.position.z-j.group.position.z)}
 // Small impatient head/torso sway is distinct from the walk cycle.
 student.mesh.rotation.z=busy*Math.sin(t*4)*.014;
 renderer.render(scene,camera);ctx.setTransform(1,0,0,1,0,0);ctx.clearRect(0,0,W,H);ctx.drawImage(renderer.domElement,0,0);overlay(t);window.currentTime=t;
}
window.setT=setT;window.duration=30;window.renderSafe=true;
const audio=new Audio('/demo/stickworld-scarcity-30s.mp3');let playing=false,anchor=0,started=0;const button=document.querySelector('#play'),seek=document.querySelector('#seek'),time=document.querySelector('#time');
function stop(){playing=false;audio.pause();button.textContent='▶ Play'}
button.onclick=async()=>{if(playing)return stop();if(window.currentTime>=29.99)setT(0);audio.currentTime=window.currentTime;try{await audio.play()}catch(e){console.warn('Audio playback failed',e)}anchor=window.currentTime;started=performance.now();playing=true;button.textContent='❚❚ Pause'};
seek.oninput=()=>{stop();setT(Number(seek.value));audio.currentTime=Number(seek.value);time.textContent=`0:${String(Math.floor(Number(seek.value))).padStart(2,'0')}`};
function tick(now){if(playing){setT(Math.min(30,anchor+(now-started)/1000));seek.value=window.currentTime;time.textContent=`0:${String(Math.floor(window.currentTime)).padStart(2,'0')}`;if(window.currentTime>=30)stop()}requestAnimationFrame(tick)}
setT(0);requestAnimationFrame(tick);
