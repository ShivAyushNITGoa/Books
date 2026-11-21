/* Reusable engine derived from the locked refined edition; projects drive all timing.
   Reference-directed 2.5D: animated ink-and-paper character billboards in ONE
   dimensional classroom. No scene changes or infographic slide overlays.
   Every pose, prop and camera coordinate is an absolute function of time. */
import * as THREE from './vendor/three.module.js';
import {validateProject,pathAt,wrapText} from './project.js';
const query=new URLSearchParams(location.search);
const projectURL=new URL(query.get('project')||'../examples/curiosity/project.json',location.href);
if(projectURL.origin!==location.origin)throw new Error('Projects must be served locally');
const response=await fetch(projectURL);if(!response.ok)throw new Error(`Project load failed: ${response.status}`);
const project=validateProject(await response.json());
const mediaURL=key=>project.media[key]?new URL(project.media[key],projectURL).href:null;
const envelopeURL=mediaURL('envelope');
const voiceEnvelope=envelopeURL?await (await fetch(envelopeURL)).json():null;
if(voiceEnvelope&&(!Number.isFinite(voiceEnvelope.fps)||voiceEnvelope.fps<=0||!Array.isArray(voiceEnvelope.values)||voiceEnvelope.fps>240||voiceEnvelope.values.some(n=>!Number.isFinite(n)||n<0||n>1)))throw new Error('Invalid voice envelope');
const inter=new FontFace('ReferenceBold','url(./fonts/Inter.ttf)',{weight:'100 900'});
const deva=new FontFace('Devanagari','url(./fonts/NotoSansDevanagari-Regular.ttf)');
const devaBold=new FontFace('Devanagari','url(./fonts/NotoSansDevanagari-Bold.ttf)',{weight:'700 900'});
await Promise.all([inter,deva,devaBold].map(async f=>{await f.load();document.fonts.add(f)}));
const canvas=document.querySelector('canvas'), ctx=canvas.getContext('2d');
const W=720,H=720*project.height/project.width, INK='#302323';
const requestedWidth=Number(query.get('width')||project.width), requestedHeight=Number(query.get('height')||project.height);
if(![requestedWidth,requestedHeight].every(n=>Number.isInteger(n)&&n>=160&&n<=3840&&n%2===0)||Math.abs(requestedWidth/requestedHeight-project.width/project.height)>.01)throw new Error('Invalid render dimensions/aspect');
canvas.width=requestedWidth;canvas.height=requestedHeight;canvas.style.aspectRatio=`${project.width}/${project.height}`;
function voiceAt(t){if(!voiceEnvelope)return .4+.3*Math.abs(Math.sin(t*15));const f=Math.max(0,t*voiceEnvelope.fps),i=Math.floor(f);return mix(voiceEnvelope.values[i]||0,voiceEnvelope.values[i+1]||0,f-i)}
const clamp=x=>Math.max(0,Math.min(1,x)), smooth=x=>{x=clamp(x);return x*x*(3-2*x)}, mix=(a,b,u)=>a+(b-a)*u;
const ramp=(t,a,b)=>smooth((t-a)/(b-a));
function poly(c,p,fill,stroke=null,w=4){c.beginPath();p.forEach(([x,y],i)=>i?c.lineTo(x,y):c.moveTo(x,y));c.closePath();if(fill){c.fillStyle=fill;c.fill()}if(stroke){c.strokeStyle=stroke;c.lineWidth=w;c.stroke()}}
function line(c,p,color=INK,w=5){c.beginPath();p.forEach(([x,y],i)=>i?c.lineTo(x,y):c.moveTo(x,y));c.strokeStyle=color;c.lineWidth=w;c.lineCap='round';c.lineJoin='round';c.stroke()}
function ellipse(c,x,y,rx,ry,fill,stroke=null,w=4){c.beginPath();c.ellipse(x,y,rx,ry,0,0,Math.PI*2);if(fill){c.fillStyle=fill;c.fill()}if(stroke){c.strokeStyle=stroke;c.lineWidth=w;c.stroke()}}
function round(c,x,y,w,h,fill,r=4,stroke=null,lw=3){c.beginPath();c.roundRect(x,y,w,h,r);c.fillStyle=fill;c.fill();if(stroke){c.strokeStyle=stroke;c.lineWidth=lw;c.stroke()}}
function label(c,s,x,y,size=30,color='#fff2c9',font='ReferenceBold, Devanagari, sans-serif'){c.fillStyle=color;c.font=`bold ${size}px ${font}`;c.textAlign='center';c.fillText(s,x,y)}
function texture(w,h,draw){const c=document.createElement('canvas');c.width=w;c.height=h;draw(c.getContext('2d'));const t=new THREE.CanvasTexture(c);t.colorSpace=THREE.SRGBColorSpace;return t}
const wood=texture(512,512,c=>{c.fillStyle='#c68244';c.fillRect(0,0,512,512);for(let row=0;row<8;row++){const y=row*64;c.fillStyle=`hsl(${26+row%3},${53+row%4}%,${48+row%3*3}%)`;c.fillRect(0,y,512,62);for(let n=0;n<13;n++){let yy=y+5+n*4;line(c,[[0,yy],[120,yy+Math.sin(n)*2],[345,yy-2],[512,yy+1]],n%3?'#8b512a30':'#edba7645',1)}line(c,[[row%2?160:350,y],[row%2?160:350,y+64]],'#683b2c80',2);line(c,[[0,y],[512,y]],'#70432d',2)}});wood.wrapS=wood.wrapT=THREE.RepeatWrapping;
const wallTex=texture(256,256,c=>{c.fillStyle='#cf936e';c.fillRect(0,0,256,256);for(let i=0;i<150;i++){c.fillStyle=`rgba(255,215,163,${.02+(i%7)*.007})`;c.fillRect((i*73)%256,(i*47)%256,8+i%14,24+i%37)}});
const scene=new THREE.Scene();scene.background=new THREE.Color('#d6ac7e');
const camera=new THREE.PerspectiveCamera(40,project.width/project.height,.1,70);
const renderer=new THREE.WebGLRenderer({antialias:true,preserveDrawingBuffer:true,alpha:false});renderer.setSize(canvas.width,canvas.height);renderer.setPixelRatio(1);renderer.shadowMap.enabled=true;renderer.shadowMap.type=THREE.PCFSoftShadowMap;renderer.outputColorSpace=THREE.SRGBColorSpace;renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.04;
scene.add(new THREE.HemisphereLight('#fff0d8','#826d68',1.7));
const sun=new THREE.DirectionalLight('#ffdfa8',2.6);sun.position.set(-6,8,4);sun.castShadow=true;sun.shadow.mapSize.set(1024,1024);sun.shadow.camera.left=-9;sun.shadow.camera.right=9;sun.shadow.camera.top=9;sun.shadow.camera.bottom=-9;sun.shadow.normalBias=.025;sun.shadow.bias=-.0003;scene.add(sun);sun.target.position.set(0,0,-1);scene.add(sun.target);
const fill=new THREE.PointLight('#ffe1aa',16,12,2);fill.position.set(0,4,1);scene.add(fill);
const mat=(color,extra={})=>new THREE.MeshStandardMaterial({color,roughness:.9,...extra});
const timber=mat('#dfc1a1',{map:wood}), darkWood=mat('#a98570',{map:wood}), metal=mat('#353438'), wall=mat('#fff3d6',{map:wallTex});
function box(x,y,z,w,h,d,m,cast=true){const o=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),m);o.position.set(x,y,z);o.castShadow=cast;o.receiveShadow=true;scene.add(o);return o}
function plane(x,y,z,w,h,m){const o=new THREE.Mesh(new THREE.PlaneGeometry(w,h),m);o.position.set(x,y,z);o.receiveShadow=true;scene.add(o);return o}
// All furniture and walls are permanent geometry. The camera really changes perspective.
const floorMat=mat('#edcfaa',{map:wood.clone()});floorMat.map.repeat.set(3,4);floorMat.map.needsUpdate=true;
box(0,-.12,0,14,.2,15,floorMat,false);box(0,2.5,-4.6,14,5,.15,wall,false);box(-6.4,2.5,0,.14,5,10,wall,false);box(6.4,2.5,0,.14,5,10,wall,false);
box(0,.65,-4.45,14,1.3,.1,darkWood,false);
// World-space chalkboard: the study is a physical teaching prop, never an overlay.
box(.2,2.75,-4.35,7.7,2.6,.16,darkWood);
const boardTex=texture(1536,512,c=>{c.fillStyle='#294d40';c.fillRect(0,0,1536,512);for(let i=0;i<35;i++)ellipse(c,(i*173)%1536,(i*89)%512,80+i%40,25,'#88a87d0b');
 const fitted=(s,y,size)=>{s=String(s||'');while(size>16){c.font=`bold ${size}px ReferenceBold, Devanagari, sans-serif`;if(c.measureText(s).width<1390)break;size--}label(c,s,768,y,size)};
 fitted(project.board.title,102,61);line(c,[[90,133],[1450,133]],'#ecd8ac',4);fitted(project.board.subtitle,220,34);fitted(project.board.detail,340,40);
 if(project.props.cookieJars){label(c,'10',320,438,60);label(c,'2',1200,438,60)}
});
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
function notebook(x,y,z,col='#f4e4c8'){
 const group=new THREE.Group();group.position.set(x,y,z);scene.add(group);
 const cover=box(0,0,0,.6,.035,.4,mat(col)),pages=box(0,.025,0,.56,.02,.37,mat('#fff3da'));group.add(cover,pages);
 const paperTexture=texture(256,128,c=>{c.fillStyle='#fff3d9';c.fillRect(0,0,256,128);for(let y=20;y<112;y+=15){line(c,[[18,y],[113,y]],'#98896a',1);line(c,[[144,y],[238,y]],'#98896a',1)}line(c,[[128,0],[128,128]],'#c2ab82',2)});
 const sheet=new THREE.Mesh(new THREE.PlaneGeometry(.55,.365),mat('#ffffff',{map:paperTexture,side:THREE.DoubleSide}));sheet.rotation.x=-Math.PI/2;sheet.position.y=.037;group.add(sheet);group.userData.sheet=sheet;
 const pencil=box(x+.42,y+.05,z,.035,.035,.43,mat('#d6ad33'));pencil.rotation.y=.35;return group;
}
// Front demo table; two side desks for phone and book, all visible in the wide shot.
const tableY=desk(0,-1.2,2.3,1.04,1.06);notebook(-2.4,desk(-2.3,.45,1.6,.95,.92)+.03,.45);const readingBook=notebook(2.6,desk(2.5,.9,1.6,.95,.92)+.03,.9,'#477f80');
const bookHome=readingBook.position.clone();
// Foreground desks create parallax rather than a flat wallpaper background.
notebook(-2.7,desk(-2.8,3.9,1.9,1.1,.88)+.03,3.9);notebook(2.5,desk(2.5,4.6,1.9,1.1,.88)+.03,4.6);
const phoneTexture=texture(128,256,c=>{c.fillStyle='#dcf0df';c.fillRect(0,0,128,256);round(c,6,8,116,33,'#397d76',3);label(c,'11:47',64,31,20,'#ffffff','sans-serif');for(let i=0;i<3;i++){round(c,i%2?24:8,57+i*55,96,36,i%2?'#85c5aa':'#ffffff',8);line(c,[[i%2?34:18,72+i*55],[i%2?102:86,72+i*55]],'#6b9c88',3)}});
const phone=box(-2.15,1.02,.45,.2,.035,.36,metal);const phoneScreen=box(-2.15,1.042,.45,.16,.008,.29,mat('#ffffff',{map:phoneTexture,emissive:'#b3d8c6',emissiveIntensity:.15}));
function jar(x,count){const group=new THREE.Group();group.position.set(x,tableY,-1.15);scene.add(group);
 const glass=new THREE.Mesh(new THREE.CylinderGeometry(.21,.23,.67,20,1,true),new THREE.MeshPhysicalMaterial({color:'#b2d9d4',transparent:true,opacity:.19,roughness:.18,side:THREE.DoubleSide,depthWrite:false}));glass.position.y=.34;group.add(glass);
 for(const y of [.025,.68]){const rim=new THREE.Mesh(new THREE.TorusGeometry(.215,.015,6,30),mat('#8ca7a0'));rim.rotation.x=Math.PI/2;rim.position.y=y;group.add(rim)}
 const lid=new THREE.Mesh(new THREE.CylinderGeometry(.235,.235,.055,24),mat('#547c76'));lid.position.y=.73;lid.castShadow=true;group.add(lid);
 const cookieMat=mat('#d29a54');const cookies=[];for(let i=0;i<count;i++){const co=new THREE.Group();const m=new THREE.Mesh(new THREE.CylinderGeometry(.083,.083,.04,12),cookieMat);m.rotation.x=Math.PI/2;co.add(m);for(let n=0;n<3;n++){const chip=new THREE.Mesh(new THREE.SphereGeometry(.012,5,4),mat('#68422a'));chip.position.set(Math.sin(n*2.3)*.045,Math.cos(n*2.3)*.045,.027);co.add(chip)}co.position.set((i%3-1)*.12,.105+Math.floor(i/3)*.13,.04+(i%2)*.035);co.rotation.z=i*.8;group.add(co);cookies.push(co)}
 const num=texture(128,64,c=>{round(c,3,2,122,60,'#fff4d9',8);label(c,String(count),64,46,46,INK,'sans-serif')});const tag=new THREE.Mesh(new THREE.PlaneGeometry(.24,.12),new THREE.MeshBasicMaterial({map:num,transparent:true}));tag.position.set(0,.49,.23);group.add(tag);return {group,cookies,tag,lid};}
const full=jar(-.48,10),scarce=jar(.48,2);
// Thick-lined, cream-faced cutout characters. Clothing is graphic, NOT anatomy.
function makeActor(kind){const art=document.createElement('canvas');art.width=1024;art.height=1536;const tex=new THREE.CanvasTexture(art);tex.colorSpace=THREE.SRGBColorSpace;const mesh=new THREE.Mesh(new THREE.PlaneGeometry(1.72,2.58),new THREE.MeshBasicMaterial({map:tex,transparent:true,alphaTest:.08,side:THREE.DoubleSide,toneMapped:false}));mesh.position.y=1.07836;scene.add(mesh);
 const sh=new THREE.Mesh(new THREE.CircleGeometry(.35,32),new THREE.MeshBasicMaterial({color:'#593b2c',transparent:true,opacity:.25,depthWrite:false}));sh.rotation.x=-Math.PI/2;sh.scale.y=.52;sh.position.y=.009;scene.add(sh);
 const projected=new THREE.Mesh(new THREE.PlaneGeometry(1,1),new THREE.MeshBasicMaterial({map:tex,color:'#302020',transparent:true,opacity:.19,depthWrite:false,side:THREE.DoubleSide}));scene.add(projected);
 return {kind,art,tex,mesh,sh,projected};}
const actors=project.actors.map(config=>({config,rig:makeActor(config.style==='hoodie'?'student':'friend')}));
function paintActor(actor,t,{talk=0,emotion='neutral',walk=0,gesture=0,phoneHeld=0,book=0,cookie=0,look=0,deposit=0,nod=0}){
 const c=actor.art.getContext('2d');c.setTransform(2,0,0,2,0,0);c.clearRect(0,0,512,768);const isStudent=actor.kind==='student',phase=t*8.5;
 const bob=Math.abs(Math.sin(phase))*walk*5+Math.sin(t*2.6)*1.5;
 actor.bob=bob;
 c.save();c.translate(256,705-bob);
 const stride=Math.sin(phase)*walk*28;
 for(const s of [-1,1]){const foot=s*31+s*stride;line(c,[[s*25,-143],[s*29+s*stride*.4,-77],[foot,-8]],INK,8);ellipse(c,foot+4,-5,13,5,INK)}
 // Clothes: outlined hoodie or mustard waistcoat, inspired by reference silhouette.
 const grad=c.createLinearGradient(-60,0,70,0);grad.addColorStop(0,isStudent?'#2d7e79':'#a67229');grad.addColorStop(.55,isStudent?'#49a297':'#d8a443');grad.addColorStop(1,isStudent?'#317c75':'#b88731');
 c.beginPath();c.moveTo(-39,-336);c.quadraticCurveTo(-76,-317,-66,-265);c.lineTo(-60,-145);c.quadraticCurveTo(0,-132,60,-145);c.lineTo(67,-267);c.quadraticCurveTo(75,-316,39,-336);c.closePath();c.fillStyle=grad;c.fill();c.strokeStyle=INK;c.lineWidth=7;c.stroke();
 poly(c,[[-26,-334],[0,-288],[27,-334]],'#fff1d5',INK,4);
 if(isStudent){line(c,[[-20,-289],[-20,-230]],'#f7e7c9',4);line(c,[[20,-289],[20,-230]],'#f7e7c9',4);round(c,-42,-199,84,44,'#377d78',12,INK,4)}else{for(let y=-262;y<-159;y+=29)ellipse(c,0,y,3,3,INK);poly(c,[[-17,-308],[0,-300],[-17,-290]],'#bd695a',INK,2);poly(c,[[17,-308],[0,-300],[17,-290]],'#bd695a',INK,2)}
 // Independent joint chains, with reaction-specific hand targets.
 let left=[-76,-208],right=[77,-215];
 if(phoneHeld){left=[mix(-87,-146,deposit),mix(-308,-297,deposit)];right=[mix(-38,-65,deposit),mix(-281,-246,deposit)+Math.sin(t*14)*3*(1-deposit)]}
 if(gesture){right=[mix(77,103,gesture),mix(-215,-345,gesture)+Math.sin(t*5)*4*gesture];left=[mix(-76,-97,gesture),mix(-208,-288,gesture)]}
 if(emotion==='worried'&&!phoneHeld)right=[93,-373+Math.sin(t*4)*3];
 if(book){left=[mix(left[0],-64,book),mix(left[1],-238,book)];right=[mix(right[0],64,book),mix(right[1],-238,book)]}
 if(cookie)left=[-111,-325];
 function limb(s,hand){const start=[s*58,-296],mid=[s*91,(hand[1]-296)/2+34];line(c,[start,mid,hand],INK,7);ellipse(c,hand[0],hand[1],8,8,'#ffe6c8',INK,3)}
 limb(-1,left);limb(1,right);
 actor.hands={left,right};
 // Phone is a world prop attached to this hand, never a duplicate drawing.
 // The open book is a continuous world prop, not a replacement sprite.

 if(cookie){ellipse(c,left[0],left[1]-13,14,14,'#c58d49',INK,2);ellipse(c,left[0]-5,left[1]-17,2,2,INK);ellipse(c,left[0]+6,left[1]-9,2,2,INK)}
 // Oversized head ~46% of the visible figure height, pale face with subtle warm edge.
 c.save();c.translate(Math.sin(t*2)*2,-444);c.rotate(Math.sin(t*1.8)*.018+(emotion==='worried'?-.055:emotion==='curious'?.045:0)+nod*.08);
 c.translate(0,nod*6);
 const face=c.createRadialGradient(-45,-60,10,0,0,142);face.addColorStop(0,'#fff3df');face.addColorStop(.8,'#ffe7cf');face.addColorStop(1,'#e6baa2');ellipse(c,0,0,132,129,face,INK,7);
 // Distinct hair silhouette: soft scalloped quiff vs side-part.
 if(isStudent){c.beginPath();c.moveTo(-129,-22);c.bezierCurveTo(-151,-57,-131,-94,-106,-97);c.bezierCurveTo(-109,-137,-69,-155,-42,-143);c.bezierCurveTo(-9,-175,35,-159,53,-139);c.bezierCurveTo(88,-153,119,-132,120,-101);c.bezierCurveTo(154,-79,142,-33,112,-28);c.bezierCurveTo(83,-23,65,-46,58,-65);c.bezierCurveTo(33,-33,-10,-35,-29,-55);c.bezierCurveTo(-50,-18,-74,-11,-86,-32);c.bezierCurveTo(-101,-2,-117,-1,-129,-22);c.closePath();c.fillStyle='#61402a';c.fill();c.strokeStyle=INK;c.lineWidth=7;c.stroke()}
 else{c.beginPath();c.moveTo(-130,-32);c.bezierCurveTo(-124,-181,118,-178,132,-26);c.lineTo(19,-31);c.lineTo(-6,-58);c.lineTo(-22,-30);c.closePath();c.fillStyle='#3a2b25';c.fill();c.strokeStyle=INK;c.lineWidth=7;c.stroke()}
 const blink=t%3.7>3.54||(emotion==='happy'&&t%7>6.5);
 for(const s of [-1,1]){const ex=s*44,ey=-3;
 if(blink){c.beginPath();c.arc(ex,ey+5,17,Math.PI+.15,Math.PI*2-.15);c.strokeStyle=INK;c.lineWidth=6;c.stroke()}
 else{ellipse(c,ex,ey,23,29,'#fff9e9',INK,5);ellipse(c,ex+look*6,ey+3+(phoneHeld?6:0)+(book?8:0),7,9,INK);ellipse(c,ex+look*6-2,ey,2,3,'#fff6e8')}
 const worry=emotion==='worried';line(c,[[ex-22,ey-42+(worry?-s*4:0)],[ex+17,ey-44+(worry?s*8:0)]],INK,6)}
 if(emotion==='worried'){c.beginPath();c.moveTo(-104,-26);c.quadraticCurveTo(-125,8,-107,17);c.quadraticCurveTo(-88,8,-104,-26);c.fillStyle='#7bc4cc';c.fill();c.strokeStyle=INK;c.lineWidth=3;c.stroke()}
 if(talk>.08&&emotion==='worried'){ellipse(c,3,61,12+talk*9,8+talk*23,'#60242b',INK,5)}
 else if(talk>.08){const op=4+talk*30;
 c.beginPath();c.moveTo(-37,52-op*.25);c.lineTo(41,45-op*.25);c.quadraticCurveTo(36,78+op,-1,80+op*.6);c.quadraticCurveTo(-30,80+op,-37,52-op*.25);c.fillStyle='#631f22';c.fill();c.strokeStyle=INK;c.lineWidth=5;c.stroke();poly(c,[[-31,51-op*.25],[34,46-op*.25],[31,59-op*.25],[-27,64-op*.25]],'#fff8e6');}
 else if(emotion==='worried'){line(c,[[-16,71],[0,65],[18,69]],INK,4)}
 else if(emotion==='curious'){ellipse(c,2,65,10,9,'#60242b',INK,4)}
 else{c.beginPath();c.moveTo(-30,58);c.quadraticCurveTo(0,89,33,56);c.strokeStyle=INK;c.lineWidth=5;c.stroke()}
 c.restore();c.restore();actor.tex.needsUpdate=true;
}

// No scarcity-specific times below: all direction comes from the project.
function artPoint(actor,x,y){return actor.mesh.localToWorld(new THREE.Vector3(x/512*1.72,(384-(705-actor.bob+y))/768*2.58,0))}
const speaking=(a,t)=>a.speech.some(q=>t>=q.start&&t<q.end);
const cueAt=(a,t)=>a.cues.find(q=>t>=q.start&&t<q.end);
function weight(q,t){if(!q)return 0;const fade=Math.min(.4,(q.end-q.start)/3);return ramp(t,q.start,q.start+fade)*(q.end>=project.duration?1:1-ramp(t,q.end-fade,q.end))}
function cameraAt(t){
 if(!project.camera.length){camera.position.set(.2,2.6,9);camera.lookAt(0,1.25,-.6);return}
 const keys=project.camera.map(k=>[k.t,...k.position,...k.target]);
 let i=0;while(i<keys.length-2&&t>keys[i+1][0])i++;
 if(keys.length===1){camera.position.fromArray(keys[0],1);camera.lookAt(...keys[0].slice(4));return}
 const a=keys[i],b=keys[i+1],h=b[0]-a[0],u=clamp((t-a[0])/h),v=u*u,w=v*u;
 const tangent=(i,k)=>{if(i===0||i===keys.length-1)return 0;const a=(keys[i][k]-keys[i-1][k])/(keys[i][0]-keys[i-1][0]),b=(keys[i+1][k]-keys[i][k])/(keys[i+1][0]-keys[i][0]);return a*b<=0?0:2*a*b/(a+b)};
 const p=[];for(let k=1;k<=6;k++)p.push((2*w-3*v+1)*a[k]+(w-2*v+u)*h*tangent(i,k)+(-2*w+3*v)*b[k]+(w-v)*h*tangent(i+1,k));camera.position.set(...p.slice(0,3));camera.lookAt(...p.slice(3));
}
const captionLayouts=new Map();
function layoutCaption(text){
 if(captionLayouts.has(text))return captionLayouts.get(text);
 let size=H>W?57:32,lines=[];do{ctx.font=`900 ${size}px ReferenceBold, Devanagari, sans-serif`;lines=wrapText(text,s=>ctx.measureText(s).width,W*.86);if(lines.length<=3)break;size--}while(size>=14);
 if(lines.length>3)throw new Error('Caption too long for three lines; split this cue');
 const layout={size,lines};captionLayouts.set(text,layout);return layout;
}
for(const cue of project.captions)layoutCaption(cue.text); // fail before a long export, not halfway through
function overlay(t){
 const v=ctx.createRadialGradient(W/2,H*.45,W*.35,W/2,H*.5,Math.max(W,H)*.72);v.addColorStop(0,'#32141100');v.addColorStop(1,'#25152b35');ctx.fillStyle=v;ctx.fillRect(0,0,W,H);
 const cap=project.captions.find(s=>t>=s.start&&t<s.end);if(!cap)return;
 const {size,lines}=layoutCaption(cap.text);ctx.font=`900 ${size}px ReferenceBold, Devanagari, sans-serif`;
 ctx.textAlign='center';ctx.textBaseline='middle';ctx.lineJoin='round';ctx.strokeStyle='#19151e';ctx.lineWidth=Math.max(6,size*.23);ctx.fillStyle='#fffaf2';lines.forEach((s,i)=>{const y=H*.8+(i-(lines.length-1)/2)*size*1.15;ctx.strokeText(s,W/2,y);ctx.fillText(s,W/2,y)});
}
export function setT(input){
 const t=Math.max(0,Math.min(project.duration,input));cameraAt(t);
 let phoneOwner=null,reader=null;
 for(const {config:a,rig:r} of actors){
  const [x,z]=pathAt(a.path,t,['x','z']),q=cueAt(a,t),w=weight(q,t),before=pathAt(a.path,Math.max(0,t-.04),['x','z']),after=pathAt(a.path,Math.min(project.duration,t+.04),['x','z']);
  const speed=Math.hypot(after[0]-before[0],after[1]-before[1])/.08;
  r.mesh.position.set(x,1.07836,z);r.mesh.rotation.set(0,Math.atan2(camera.position.x-x,camera.position.z-z),0);
  const action=q?.action||'idle';
  paintActor(r,t,{talk:speaking(a,t)?voiceAt(t):0,emotion:q?.emotion||'neutral',walk:Math.min(1,speed),gesture:action==='gesture'?w*.85:0,phoneHeld:action==='phone'?1:0,deposit:action==='phone'?ramp(t,q.end-.4,q.end):0,book:action==='book'?w:0,look:q?.look||0,nod:action==='nod'?w*Math.sin((t-q.start)*8):0});
  if(action==='phone'){if(phoneOwner)throw new Error('Only one phone prop can be held at a time');phoneOwner={r,q}}
  if(action==='book'){if(reader)throw new Error('Only one book prop can be held at a time');reader={r,w}}
  r.sh.position.set(x,.012,z);const pos=r.projected.geometry.attributes.position,right=new THREE.Vector3(Math.cos(r.mesh.rotation.y)*.72,0,-Math.sin(r.mesh.rotation.y)*.72),base=new THREE.Vector3(x,.018,z),tip=base.clone().add(new THREE.Vector3(1.45,0,-1.6));[tip.clone().sub(right),tip.clone().add(right),base.clone().sub(right),base.clone().add(right)].forEach((p,i)=>pos.setXYZ(i,p.x,p.y,p.z));pos.needsUpdate=true;r.projected.geometry.computeBoundingSphere();
 }
 phone.visible=phoneScreen.visible=project.props.phone!==false;
 if(phoneOwner){const {r,q}=phoneOwner,u=ramp(t,q.end-.4,q.end),p=artPoint(r,r.hands.left[0],r.hands.left[1]-15).lerp(new THREE.Vector3(-2.15,1.02,.45),u);phone.position.copy(p);phone.rotation.set(mix(Math.PI/2,0,u),r.mesh.rotation.y*(1-u),-.12*(1-u));phoneScreen.position.copy(p).add(new THREE.Vector3(0,.022,0).applyEuler(phone.rotation));phoneScreen.rotation.copy(phone.rotation)}else{phone.position.set(-2.15,1.02,.45);phone.rotation.set(0,0,0);phoneScreen.position.set(-2.15,1.042,.45);phoneScreen.rotation.set(0,0,0)}
 readingBook.position.copy(bookHome);readingBook.rotation.set(0,0,0);readingBook.userData.sheet.rotation.y=0;
 if(reader){readingBook.position.lerp(artPoint(reader.r,0,-225).add(new THREE.Vector3(0,0,.09)),reader.w);readingBook.rotation.set(Math.PI/2*reader.w,reader.r.mesh.rotation.y*reader.w,0);readingBook.userData.sheet.rotation.y=Math.max(0,Math.sin(t*2))*.35}
 for(const j of [full,scarce]){j.group.visible=!!project.props.cookieJars;j.tag.rotation.y=Math.atan2(camera.position.x-j.group.position.x,camera.position.z-j.group.position.z)}
 renderer.render(scene,camera);ctx.setTransform(1,0,0,1,0,0);ctx.clearRect(0,0,canvas.width,canvas.height);ctx.drawImage(renderer.domElement,0,0);const scale=canvas.width/W;ctx.setTransform(scale,0,0,scale,0,0);overlay(t);
 window.currentTime=t;window.frameDiagnostics={duration:project.duration,actors:actors.length,objects:scene.children.length,mouth:voiceAt(t),speakers:actors.filter(({config:a})=>speaking(a,t)).map(({config:a})=>a.id)};
}
window.setT=setT;window.duration=project.duration;window.project=project;
const audio=mediaURL('audio')?new Audio(mediaURL('audio')):null;
let playing=false,anchor=0,started=0;
const button=document.querySelector('#play'),seek=document.querySelector('#seek'),time=document.querySelector('#time');seek.max=project.duration;
const stamp=t=>`${Math.floor(t/60)}:${String(Math.floor(t%60)).padStart(2,'0')}`;
document.querySelector('#title').textContent=project.title||project.id;
document.querySelector('#status').textContent=audio?'Narration loaded':'Silent animatic — add narration for audio-driven mouths';
function stop(){playing=false;audio?.pause();button.textContent='▶ Play'}
button.onclick=async()=>{if(playing)return stop();if(window.currentTime>=project.duration-.01)setT(0);if(audio){audio.currentTime=window.currentTime;try{await audio.play()}catch(e){document.querySelector('#status').textContent=`Audio failed: ${e.message}`;return}}anchor=window.currentTime;started=performance.now();playing=true;button.textContent='❚❚ Pause'};
seek.oninput=()=>{stop();setT(Number(seek.value));if(audio)audio.currentTime=Number(seek.value);time.textContent=stamp(Number(seek.value))};
function tick(now){if(playing){setT(Math.min(project.duration,anchor+(now-started)/1000));seek.value=window.currentTime;time.textContent=stamp(window.currentTime);if(window.currentTime>=project.duration)stop()}requestAnimationFrame(tick)}
setT(0);window.renderSafe=true;requestAnimationFrame(tick);
