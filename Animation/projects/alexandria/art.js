import * as THREE from '../../engine/vendor/three.module.js';
import {clamp,mix,smooth} from './timeline.js';
export const INK='#292d32';
export function random(seed=9182){let s=seed;return()=>{s=(Math.imul(s,1664525)+1013904223)>>>0;return s/4294967296}}
export function texture(w,h,paint){const c=document.createElement('canvas');c.width=w;c.height=h;paint(c.getContext('2d'));const t=new THREE.CanvasTexture(c);t.colorSpace=THREE.SRGBColorSpace;t.anisotropy=4;return t}
export function poly(c,p,fill,stroke=INK,lw=3){c.beginPath();p.forEach(([x,y],i)=>i?c.lineTo(x,y):c.moveTo(x,y));c.closePath();if(fill){c.fillStyle=fill;c.fill()}if(stroke){c.strokeStyle=stroke;c.lineWidth=lw;c.lineJoin='round';c.stroke()}}
export function line(c,p,color=INK,w=4){c.beginPath();p.forEach(([x,y],i)=>i?c.lineTo(x,y):c.moveTo(x,y));c.strokeStyle=color;c.lineWidth=w;c.lineCap='round';c.lineJoin='round';c.stroke()}
export function ellipse(c,x,y,rx,ry,fill,stroke=null,w=3){c.beginPath();c.ellipse(x,y,Math.max(.01,rx),Math.max(.01,ry),0,0,Math.PI*2);if(fill){c.fillStyle=fill;c.fill()}if(stroke){c.strokeStyle=stroke;c.lineWidth=w;c.stroke()}}
export function round(c,x,y,w,h,fill,r=8,stroke=null){c.beginPath();c.roundRect(x,y,w,h,r);c.fillStyle=fill;c.fill();if(stroke){c.strokeStyle=stroke;c.lineWidth=3;c.stroke()}}
export function stoneTexture(base='#d5b383',seed=22,joints=true){return texture(1024,1024,c=>{const rng=random(seed);c.fillStyle=base;c.fillRect(0,0,1024,1024);for(let i=0;i<48000;i++){c.fillStyle=`rgba(${rng()>.45?'255,242,208':'84,65,43'},${rng()*.12})`;c.fillRect(rng()*1024,rng()*1024,1+rng()*5,1+rng()*3)}if(joints)for(let y=0;y<1024;y+=128)for(let x=-128;x<1024;x+=256){const xx=x+(y/128%2)*128;line(c,[[xx,y],[xx+256,y]],'#796d5350',3);line(c,[[xx,y],[xx,y+128]],'#7c6a4d40',2);line(c,[[xx+4,y+5],[xx+251,y+5]],'#fff1cc50',2)}for(let i=0;i<110;i++){const x=rng()*1024,y=rng()*1024;line(c,[[x,y],[x+8,y+12],[x+5,y+20]],'#493f322a',1)}})}
export function marbleTexture(){return texture(512,512,c=>{c.fillStyle='#eadac0';c.fillRect(0,0,512,512);const rng=random(412);for(let i=0;i<270;i++){const x=rng()*512,y=rng()*512;line(c,[[x,y],[x+20,y+30],[x+15,y+60],[x+40,y+90]],i%3?'#8b7b6230':'#fcf0db80',rng()*2)}})}
export function floorTexture(){const t=texture(1024,1024,c=>{const rng=random(12);for(let y=0;y<32;y++)for(let x=0;x<32;x++){c.fillStyle=`hsl(${34+rng()*9},${20+rng()*20}%,${66+rng()*14}%)`;c.fillRect(x*32+1,y*32+1,30,30)}for(let y=0;y<1024;y+=256)for(let x=0;x<1024;x+=256){c.strokeStyle='#426e6a';c.lineWidth=6;c.strokeRect(x+12,y+12,232,232);c.save();c.translate(x+128,y+128);c.rotate(Math.PI/4);c.strokeStyle='#997d43';c.lineWidth=6;c.strokeRect(-55,-55,110,110);c.restore();ellipse(c,x+128,y+128,19,19,'#517974')}});t.wrapS=t.wrapT=THREE.RepeatWrapping;t.repeat.set(4,4);return t}
export function friezeTexture(){return texture(1024,128,c=>{c.fillStyle='#a67a3e';c.fillRect(0,0,1024,128);c.fillStyle='#1e6464';c.fillRect(0,13,1024,101);for(let x=0;x<1024;x+=64){line(c,[[x,32],[x+44,32],[x+44,92],[x+15,92],[x+15,53],[x+30,53],[x+30,75]],'#e4c37b',8)}line(c,[[0,8],[1024,8]],'#f7df9d',5);line(c,[[0,120],[1024,120]],'#f7df9d',5)})}
export function glyphTexture(){return texture(512,1024,c=>{c.fillStyle='#cbb384';c.fillRect(0,0,512,1024);for(let y=20;y<1000;y+=90)for(let x=30;x<500;x+=84){const n=(x+y)%5;ellipse(c,x+15,y+15,9,13,null,'#81714e',3);line(c,[[x+15,y+30],[x+15,y+60],[x-2,y+75],[x+15,y+60],[x+30,y+75]],'#81714e',3);if(n)line(c,[[x-8,y+39],[x+36,y+39]],'#81714e',3)}})}
export function makeActor(kind){
 const canvas=document.createElement('canvas');canvas.width=512;canvas.height=768;const tex=new THREE.CanvasTexture(canvas);tex.colorSpace=THREE.SRGBColorSpace;
 const group=new THREE.Group(),plane=new THREE.Mesh(new THREE.PlaneGeometry(kind==='diver'?4.1:2.25,kind==='diver'?6.15:3.375),new THREE.MeshBasicMaterial({map:tex,transparent:true,alphaTest:.035,side:THREE.DoubleSide,depthWrite:true,toneMapped:false}));plane.position.y=kind==='diver'?0:1.42;group.add(plane);
 const shadow=new THREE.Mesh(new THREE.CircleGeometry(.62,32),new THREE.MeshBasicMaterial({color:'#322e29',transparent:true,opacity:.19,depthWrite:false}));shadow.rotation.x=-Math.PI/2;shadow.scale.y=.55;shadow.position.y=.04;group.add(shadow);
 return {kind,group,plane,shadow,canvas,tex};
}
export function paintActor(a,t,{pose='idle',gesture=0,worry=0,swim=0,work=0,look=0}={}){
 const c=a.canvas.getContext('2d');c.clearRect(0,0,512,768);c.save();
 if(a.kind==='diver'){
  // The body remains an ink-and-paper cutout, with actual animated joints and equipment.
  c.translate(252,390);c.rotate(-.14+Math.sin(t*1.6)*.045);
  const kick=Math.sin(t*4.6)*28;
  line(c,[[-25,28],[-90,72+kick],[-159,78+kick*.8]],INK,13);line(c,[[-20,7],[-100,-2-kick],[-161,18-kick]],INK,13);
  for(const [x,y,r] of [[-161,78+kick*.8,.3],[-161,18-kick,-.2]]){c.save();c.translate(x,y);c.rotate(r);poly(c,[[-5,-8],[-70,-18],[-73,9],[-3,10]],'#d9af43',INK,4);line(c,[[-18,-6],[-60,-9]],'#f9d87f',3);c.restore()}
  poly(c,[[-49,-31],[23,-49],[76,-13],[34,39],[-29,52]],'#29464c',INK,5);
  round(c,-49,-58,79,28,'#bec9bc',13,INK);line(c,[[-30,-53],[-30,-32]],'#768c86',3);round(c,-15,-46,18,93,'#dba64e',3,INK);
  const hand=[134,work?-5+Math.sin(t*6)*9:30+Math.sin(t*2)*4];line(c,[[46,10],[83,43],hand],'#222e36',9);ellipse(c,...hand,8,8,'#dfc5a0',INK,3);
  // Torch is attached to the hand rather than a floating UI graphic.
  c.save();c.translate(...hand);c.rotate(-.1);round(c,-7,-9,42,19,'#d8ab44',4,INK);ellipse(c,37,0,4,11,'#f4efad',INK,2);c.restore();
  line(c,[[40,-19],[91,-45],[126,-37+Math.sin(t*2)*4]],INK,9);ellipse(c,126,-37+Math.sin(t*2)*4,7,7,'#dfc5a0',INK,3);
  ellipse(c,69,-63,38,40,'#f4ead9',INK,5);poly(c,[[35,-78],[44,-108],[83,-111],[105,-82],[87,-93],[57,-94]],'#303338',INK,3);
  round(c,40,-86,64,33,'#123d4b',13,INK);round(c,47,-81,50,21,'#71bbbf',9);line(c,[[51,-77],[66,-77]],'#d6f3e5',3);ellipse(c,60,-68,3,3,INK);ellipse(c,81,-68,3,3,INK);
  ellipse(c,72,-42,10,8,'#b4c6c5',INK,3);c.beginPath();c.moveTo(80,-42);c.bezierCurveTo(145,-20,110,56,5,31);c.strokeStyle='#1b303a';c.lineWidth=7;c.stroke();
  if(work){line(c,[[126,-37+Math.sin(t*2)*4],[155,-15+Math.sin(t*6)*7]],'#bc9a53',7);for(let n=0;n<5;n++)line(c,[[151+n*2,-18+Math.sin(t*6)*7],[161+n*2,-5+Math.sin(t*6)*7]],'#deceb0',2);poly(c,[[30,77],[84,63],[105,101],[51,114]],'#e5dec3',INK,4);for(let y=0;y<3;y++)line(c,[[50,85+y*8],[83,77+y*8]],'#788f89',2)}
 }else{
  c.translate(256,710);const queen=a.kind==='queen',guard=a.kind==='guard';const bob=Math.sin(t*2.2)*1.5,walk=pose==='walk'?Math.sin(t*7)*18:0;c.translate(0,-bob);
  for(const sign of [-1,1]){line(c,[[sign*22,-161],[sign*28+walk*sign,-75],[sign*29+walk*sign,-9]],INK,7);ellipse(c,sign*29+walk*sign+5,-5,17,6,'#5a432d',INK,3)}
  if(queen){poly(c,[[-53,-330],[52,-330],[72,-171],[0,-148],[-68,-171]],'#fff0cf',INK,5);poly(c,[[-50,-323],[-7,-284],[20,-164],[-59,-175]],'#258d92',INK,3);line(c,[[-44,-317],[-18,-283],[12,-164]],'#dfb951',8);line(c,[[51,-319],[66,-177]],'#e7bd58',7)}
  else {const gradient=c.createLinearGradient(-65,0,65,0);gradient.addColorStop(0,guard?'#8f4a37':'#387f7e');gradient.addColorStop(.5,guard?'#c38952':'#65a6a1');gradient.addColorStop(1,guard?'#9b6140':'#3b7b80');poly(c,[[-53,-329],[52,-329],[64,-166],[-63,-166]],gradient,INK,5);line(c,[[-58,-213],[60,-213]],'#dfbb72',10);for(let i=-2;i<=2;i++)line(c,[[i*21,-205],[i*24,-167]],'#674d36',3)}
  let handR=[100,-234],handL=[-94,-245];
  if(queen){handR=[mix(83,142,gesture),mix(-233,-330,gesture)+Math.sin(t*2)*gesture*7];handL=[-81,-256]}
  if(worry){handR=[112,-382+Math.sin(t*8)*5];handL=[-121,-288]}
  if(guard)handR=[100,-293];
  for(const [sign,hand] of [[-1,handL],[1,handR]]){line(c,[[sign*51,-309],[sign*87,-269],hand],INK,7);ellipse(c,...hand,9,9,'#f6e5c5',INK,3);if(queen)line(c,[[hand[0]-6,hand[1]+8],[hand[0]+6,hand[1]+8]],'#d4ab43',7)}
  if(guard){line(c,[[100,-100],[100,-530]],'#715332',7);poly(c,[[90,-519],[100,-559],[110,-519]],'#c6d2c9',INK,3)}
  if(!queen&&!guard){round(c,-83,-262,66,40,'#e9cf94',4,INK);line(c,[[-75,-251],[-28,-251]],'#9b7851',2);line(c,[[-75,-242],[-39,-242]],'#9b7851',2)}
  // Ink silhouette and large pale face: a character, not a full 3D human mesh.
  if(queen)round(c,-84,-509,168,205,'#25313a',36,INK);
  ellipse(c,0,-410,80,88,'#fff3d9',INK,6);
  if(queen){poly(c,[[-80,-428],[-74,-493],[-24,-511],[18,-510],[72,-487],[79,-428],[50,-455],[26,-463],[-20,-463],[-51,-449]],'#27353b',INK,4);for(let i=-3;i<=3;i++)line(c,[[i*20,-488],[i*20,-458]],'#485057',2);line(c,[[-72,-462],[72,-462]],'#d9b34e',13);for(let i=-3;i<=3;i++)ellipse(c,i*21,-462,4,4,i%2?'#22999d':'#eac56c');poly(c,[[-13,-464],[-9,-505],[0,-516],[10,-503],[12,-464]],'#e2bb51',INK,3);ellipse(c,0,-500,4,5,'#319e96');ellipse(c,-77,-384,9,15,'#d6aa41',INK,3);ellipse(c,77,-384,9,15,'#d6aa41',INK,3);poly(c,[[-46,-330],[0,-305],[46,-330],[55,-314],[0,-285],[-55,-313]],'#dbb24b',INK,3);for(let x=-30;x<=30;x+=15)ellipse(c,x,-310+Math.abs(x)*.15,3,5,'#288d92')}
  else if(guard){poly(c,[[-82,-424],[-73,-492],[-42,-514],[42,-514],[75,-491],[82,-424],[60,-454],[-61,-454]],'#bb8c4b',INK,5);line(c,[[-77,-465],[77,-465]],'#efd49a',7);poly(c,[[-10,-514],[-10,-551],[10,-551],[14,-514]],'#8b3b36',INK,3)}
  else poly(c,[[-79,-426],[-75,-482],[-45,-507],[12,-502],[55,-483],[79,-432],[36,-459],[-24,-453]],'#584135',INK,4);
  const blink=(t%4.8)>4.61;
  for(const sign of [-1,1]){if(blink)line(c,[[sign*30-10,-407],[sign*30+10,-407]],INK,4);else {ellipse(c,sign*29,-407,worry?9:7,worry?13:10,INK);ellipse(c,sign*29+2,-410,2,3,'#fff8e4')};line(c,[[sign*19,-433-worry*5],[sign*42,-432+worry*6]],INK,4);if(queen){line(c,[[sign*39,-405],[sign*54,-411]],INK,3)}}
  if(worry)ellipse(c,0,-372,8,11,'#4b3c32');else{c.beginPath();c.moveTo(-13,-373);c.quadraticCurveTo(0,-364,14,-374);c.strokeStyle=INK;c.lineWidth=4;c.stroke()}
 }
 c.restore();a.tex.needsUpdate=true;
}
