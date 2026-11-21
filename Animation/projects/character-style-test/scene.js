// Original independently articulated illustration; no imported character texture,
// camera-facing human plane, external asset or copied reference character.
const canvas=document.querySelector('#film'),c=canvas.getContext('2d',{alpha:false});
export const DURATION=5,FPS=30;
const ink='#29283e',cream='#fff3d5';
const clamp=x=>Math.max(0,Math.min(1,x)),ease=x=>{x=clamp(x);return x*x*(3-2*x)};
const mix=(a,b,t)=>a+(b-a)*t;
const ramp=(a,b,t)=>ease((t-a)/(b-a));
function path(points,fill,stroke=ink,width=5){c.beginPath();for(const p of points){const [op,...v]=p;c[op](...v)}if(fill){c.fillStyle=fill;c.fill()}if(stroke){c.strokeStyle=stroke;c.lineWidth=width;c.lineJoin='round';c.lineCap='round';c.stroke()}}
function ellipse(x,y,rx,ry,fill,stroke=ink,width=5){c.beginPath();c.ellipse(x,y,rx,ry,0,0,Math.PI*2);if(fill){c.fillStyle=fill;c.fill()}if(stroke){c.strokeStyle=stroke;c.lineWidth=width;c.stroke()}}
function line(points,color=ink,width=5){path(points.map(([x,y],i)=>[i?'lineTo':'moveTo',x,y]),null,color,width)}
function rect(x,y,w,h,fill,r=0,stroke=null,width=3){c.beginPath();c.roundRect(x,y,w,h,r);c.fillStyle=fill;c.fill();if(stroke){c.lineWidth=width;c.strokeStyle=stroke;c.stroke()}}
function gradient(x,y,x2,y2,stops){const g=c.createLinearGradient(x,y,x2,y2);stops.forEach(([p,col])=>g.addColorStop(p,col));return g}
function text(s,x,y,size,color=ink,weight=800,align='left'){c.font=`${weight} ${size}px Caption, sans-serif`;c.fillStyle=color;c.textAlign=align;c.fillText(s,x,y)}
function cloud(x,y,s){c.save();c.translate(x,y);c.scale(s,s);ellipse(0,0,90,24,'#fff2d5aa',null);ellipse(-35,-15,45,26,'#fff2d5aa',null);ellipse(28,-20,52,31,'#fff2d5aa',null);c.restore()}
function background(t){
 c.fillStyle=gradient(0,0,0,1280,[[0,'#8ac5c9'],[.43,'#f6d6a4'],[1,'#e9c28b']]);c.fillRect(0,0,720,1280);
 const drift=Math.sin(t*.35)*5;
 ellipse(575,280,70,70,'#ffe9ac',null);cloud(110+drift,298,.8);cloud(430+drift*.5,207,.65);
 path([['moveTo',0,535],['bezierCurveTo',130,475,230,535,360,490],['bezierCurveTo',500,455,600,490,720,470],['lineTo',720,660],['lineTo',0,660],['closePath']], '#91a89a',null);
 c.fillStyle=gradient(0,540,0,940,[[0,'#69a8ac'],[1,'#285d72']]);c.fillRect(0,560,720,400);
 for(let i=0;i<13;i++){const y=590+i*25,x=30+(i*79)%610;line([[x+Math.sin(t+i)*7,y],[x+60+Math.sin(t+i)*7,y]],'#a9d5cb60',3)}
 // Distant working harbor, kept subordinate to the actor.
 c.save();c.globalAlpha=.42;line([[565,570],[565,359],[652,409],[484,409]],'#456b72',9);line([[565,363],[484,409],[565,409],[652,409],[565,363]],'#456b72',3);line([[646,410],[646,486]],'#456b72',3);rect(634,486,23,22,'#456b72',2);
 for(let i=0;i<4;i++)rect(48+i*65,550-(i%2)*32,60,44,i%2?'#b98470':'#668d86',3);c.restore();
 path([['moveTo',0,940],['lineTo',720,885],['lineTo',720,1280],['lineTo',0,1280],['closePath']],gradient(0,930,0,1280,[[0,'#f5d7a1'],[1,'#c79b74']]),null);
 line([[0,948],[720,893]],'#ad987c',4);
 for(let i=0;i<6;i++)line([[i*160-150,1280],[i*125+80,944-i*9]],'#ae896a60',2);
 line([[0,1145],[720,1110]],'#b38c6b66',2);
 // Workshop canopy and a practical wall sign, not a scene-sized text card.
 path([['moveTo',0,390],['lineTo',164,413],['lineTo',164,448],['lineTo',0,425],['closePath']],'#397577',null);
 rect(15,420,15,500,'#775d52',3);rect(38,473,126,64,'#f0dfbb',8,'#9a8062',3);text('BOW LAB',101,514,17,'#49676b',850,'center');
}
function shipAndBench(t){
 // Bench and supports have stable floor contacts.
 path([['moveTo',492,892],['lineTo',509,1080],['lineTo',528,1080],['lineTo',524,892],['closePath']],'#477071',ink,4);
 path([['moveTo',650,892],['lineTo',655,1040],['lineTo',674,1040],['lineTo',680,892],['closePath']],'#477071',ink,4);
 rect(470,872,238,23,gradient(470,872,470,895,[[0,'#e0ad71'],[1,'#a97450']]),7,ink,4);
 ellipse(586,864,89,7,'#584b4d35',null);
 rect(532,850,12,20,'#7c7d73',2);rect(644,846,12,24,'#7c7d73',2);
 // One continuous illustrated forefoot/hull silhouette (front at left).
 path([['moveTo',500,807],['lineTo',683,807],['lineTo',670,838],['quadraticCurveTo',660,852,632,853],['lineTo',503,853],['quadraticCurveTo',480,852,486,843],['quadraticCurveTo',489,837,502,837],['quadraticCurveTo',514,835,500,807],['closePath']],gradient(0,806,0,854,[[0,'#264856'],[.6,'#264856'],[.61,'#bd6551'],[1,'#923f41']]),ink,3);
 rect(527,785,31,20,'#eab560',2,ink,2);rect(561,785,31,20,'#789d96',2,ink,2);rect(596,785,31,20,'#c67e63',2,ink,2);rect(544,764,31,18,'#c88166',2,ink,2);rect(578,764,31,18,'#e6bd70',2,ink,2);
 rect(640,773,29,31,'#fff0d1',3,ink,2);rect(638,768,33,6,'#517b7c',2);rect(645,778,17,7,'#47737e',1);rect(651,753,7,15,'#bd6551',1);
 const emphasis=ramp(2.6,2.9,t)*(1-ramp(4,4.4,t));
 if(emphasis>0){c.save();c.globalAlpha=emphasis;ellipse(496,840,24,23,null,'#fff1b1',3);for(let i=0;i<3;i++){const a=(i*60+150)*Math.PI/180;line([[496+Math.cos(a)*34,840+Math.sin(a)*34],[496+Math.cos(a)*43,840+Math.sin(a)*43]],'#fff1b1',3)}c.restore()}
}
function boot(x,y,side){rect(x-18,y-10,36,15,gradient(x,y-10,x,y+5,[[0,'#5e5352'],[1,'#393741']]),5,ink,3)}
function limb(a,b,d,color,width){line([a,b,d],ink,width+7);line([a,b,d],color,width)}
export function poseAt(t){
 t=Math.max(0,Math.min(5,t));
 const walkEnd=1.35,walking=t<walkEnd,phase=t/walkEnd*Math.PI*4;
 const x=mix(228,327,ramp(0,walkEnd,t));
 const gait=walking?Math.sin(phase)*Math.sin(Math.PI*t/walkEnd):0;
 const step=walking?Math.sin(phase+Math.PI/2)*Math.sin(Math.PI*t/walkEnd):0;
 const point=ramp(2.05,2.65,t)*(1-ramp(3.9,4.55,t));
 const greet=ramp(1.35,1.7,t)*(1-ramp(1.9,2.2,t));
 const blink=Math.max(0,1-Math.abs(t-1.62)/.075,1-Math.abs(t-4.57)/.075);
 return {t,x,gait,step,walking,point,greet,blink,bob:walking?-Math.abs(step)*5:Math.sin(t*2)*.8,turn:point*.22,smile:ramp(3.7,4.4,t)};
}
function feetAt(t){
 const feet=[[205,1084],[251,1084]],targets=[245,290,304,350],stepTime=1.35/4;
 for(let i=0;i<4;i++){
  const side=i%2,start=i*stepTime;
  if(t<=start)break;
  const u=clamp((t-start)/stepTime),v=ease(u);
  feet[side]=[mix(feet[side][0],targets[i],v),1084-Math.sin(Math.PI*u)*21];
 }
 return feet;
}
function knee(hip,foot,sign){
 const dx=foot[0]-hip[0],dy=foot[1]-hip[1],d=Math.hypot(dx,dy),length=56;
 const bend=Math.sqrt(Math.max(0,length*length-d*d/4));
 return [(hip[0]+foot[0])/2+dy/d*bend*sign,(hip[1]+foot[1])/2-dx/d*bend*sign];
}
function actor(p){
 const {x,gait,step,bob,point,greet,blink,turn}=p;
 ellipse(x+7,1091,66-Math.abs(step)*5,12,'#5a5a5230',null);
 const [footL,footR]=feetAt(p.t);
 // Legs are separate articulated strokes and do not inherit head/camera motion.
 limb([x-23,974+bob],knee([x-23,974+bob],footL,-1),footL,'#47646a',14);
 limb([x+23,974+bob],knee([x+23,974+bob],footR,1),footR,'#47646a',14);
 boot(...footL,-1);boot(...footR,1);
 c.save();c.translate(x, bob);
 const leftShoulder=[-55,797],rightShoulder=[57,797];
 const leftHand=[mix(-88,-102,greet),mix(921,708,greet)];
 const leftElbow=[mix(-80,-105,greet),mix(856,788,greet)];
 const rightHand=[mix(86,153,point),mix(919,818,point)];
 const rightElbow=[mix(84,105,point),mix(854,810,point)];
 leftHand[0]+=gait*7;rightHand[0]-=gait*7;
 // Rear arm first, then torso: explicit overlap, not a whole-body sprite.
 limb(leftShoulder,leftElbow,leftHand,'#3e8281',20);
 ellipse(...leftHand,13,15,gradient(leftHand[0]-12,0,leftHand[0]+13,0,[[0,'#f9dcb0'],[1,'#dba67e']]),ink,4);
 path([['moveTo',-49,770],['quadraticCurveTo',-70,790,-70,835],['lineTo',-78,955],['quadraticCurveTo',-78,988,-48,989],['lineTo',53,989],['quadraticCurveTo',77,987,73,957],['lineTo',61,816],['quadraticCurveTo',62,779,39,770],['closePath']],gradient(-80,800,80,900,[[0,'#347373'],[.45,'#62aaa1'],[1,'#2b696e']]),ink,6);
 // Designed safety clothing: soft collar, reflective trim, seams, badge.
 path([['moveTo',-42,774],['lineTo',-14,820],['lineTo',0,784],['lineTo',17,820],['lineTo',40,774]],'#d1d8bf',ink,3);
 line([[-42,815],[-45,925]],'#e6d7a5',9);line([[40,815],[43,925]],'#e6d7a5',9);line([[-68,934],[67,934]],'#e6d7a5',10);
 line([[0,817],[0,981]],'#31696b',2);rect(10,842,27,28,'#d9dabd',3,'#477b79',2);line([[16,851],[30,851]],'#527c77',2);line([[16,858],[26,858]],'#527c77',2);
 limb(rightShoulder,rightElbow,rightHand,'#4a9690',20);ellipse(...rightHand,14,14,'#f0c79c',ink,4);
 if(point>.2){line([[rightHand[0]+7,rightHand[1]-3],[rightHand[0]+mix(8,22,point),rightHand[1]+mix(0,5,point)]],'#edc398',8);}
 // Head has an independent turn/tilt. Face features shift with the gaze target.
 c.save();c.translate(turn*9,682);c.rotate(-greet*.035+point*.045);
 ellipse(-88,2,15,22,'#dfb28c',ink,4);ellipse(88,2,15,22,'#f0c79c',ink,4);
 ellipse(0,-1,88,94,gradient(-88,-70,88,65,[[0,'#fff0cd'],[.55,'#f4d6ae'],[1,'#d9a37f']]),ink,6);
 path([['moveTo',-80,-38],['quadraticCurveTo',-66,-100,0,-92],['quadraticCurveTo',75,-90,82,-36],['lineTo',63,-47],['lineTo',46,-57],['quadraticCurveTo',10,-36,-36,-50],['lineTo',-71,-28],['closePath']],'#493943',ink,4);
 // Helmet is a shaded, outlined shape, not a texture asset.
 path([['moveTo',-92,-56],['quadraticCurveTo',-87,-137,-10,-139],['quadraticCurveTo',74,-145,90,-67],['lineTo',90,-53],['closePath']],gradient(-75,-130,65,-50,[[0,'#ffe094'],[.55,'#f2ba58'],[1,'#ce8c43']]),ink,5);
 path([['moveTo',-10,-135],['quadraticCurveTo',5,-105,3,-66]],null,'#d19442',5);
 rect(-104,-65,207,22,gradient(0,-65,0,-43,[[0,'#ffe09a'],[1,'#e6ad54']]),10,ink,5);
 line([[-66,-102],[-50,-118],[-29,-124]],'#fff0bd',5);
 // Eyes: lids, pupils and brows are independently posed, not just a smile texture.
 const eyeY=0,eyeOpen=Math.max(.05,1-blink),gaze=point*7;
 for(const sx of [-32,32]){
  if(eyeOpen>.18){ellipse(sx+turn*6,eyeY,16,21*eyeOpen,'#fff8e3',ink,3);ellipse(sx+gaze+turn*6,eyeY+point*3,5,8*eyeOpen,ink,null);ellipse(sx+gaze+2+turn*6,eyeY-3,1.7,2,'#fffaf0',null)}
  else path([['moveTo',sx-14,eyeY],['quadraticCurveTo',sx,eyeY+7,sx+14,eyeY]],null,ink,3);
 }
 const surprise=ramp(1.35,1.53,p.t)*(1-ramp(1.9,2.15,p.t));
 for(const sx of [-32,32])path([['moveTo',sx-16,-31-surprise*8],['quadraticCurveTo',sx,-39-surprise*9,sx+15,-32-surprise*8]],null,ink,4);
 path([['moveTo',6+gaze,11],['quadraticCurveTo',17+gaze,25,7+gaze,27]],null,'#bd8d73',3);
 ellipse(-53,35,14,7,'#e9a18e55',null);ellipse(55,35,14,7,'#e9a18e55',null);
 if(surprise>.5)ellipse(2,51,11,15,'#6c3544',ink,3);
 else{path([['moveTo',-23,46],['quadraticCurveTo',1,59,28,44],['quadraticCurveTo',15,75,-3,67],['quadraticCurveTo',-17,63,-23,46],['closePath']],'#633746',ink,3);path([['moveTo',-18,49],['quadraticCurveTo',2,58,22,48],['lineTo',17,56],['quadraticCurveTo',0,62,-13,55],['closePath']],'#fff5dc',null)}
 c.restore();c.restore();
 return {head:[x+turn*9,682+bob],feet:[footL,footR],hand:[x+rightHand[0],rightHand[1]+bob]};
}
export function render(t){
 const p=poseAt(t);background(p.t);
 c.save();const zoom=1+.012*ramp(0,5,p.t);c.translate(360,820);c.scale(zoom,zoom);c.translate(-360,-820);
 shipAndBench(p.t);const features=actor(p);c.restore();
 // Restrained foreground planting and a fixed, readable title/safe bottom margin.
 for(let i=0;i<6;i++){const x=15+i*12;path([['moveTo',56,1262],['quadraticCurveTo',x-22,1193,x,1164+i*9]],null,i%2?'#34646b':'#487f7a',10)}
 c.fillStyle=gradient(0,0,0,225,[[0,'#f5ecd8ee'],[1,'#f5ecd800']]);c.fillRect(0,0,720,225);
 text('MEET THE ENGINEER',48,91,34,ink,850);text('A new character in motion',49,127,19,'#49676e',550);
 rect(49,153,42,4,'#d69454',2);
 const label=p.t<1.35?'A grounded walk':p.t<2.15?'A little personality':p.t<4.15?'A purposeful gesture':'Ready to explain';
 text(label,360,1174,25,'#2d414b',750,'center');text('CHARACTER STUDY  /  05 SEC',360,1210,13,'#6a716a',650,'center');
 window.frameInfo={t:p.t,pose:p,features,independentParts:true,humanBillboardMeshes:0};
}
const font=new FontFace('Caption','url(../../engine/fonts/Inter.ttf)');
await font.load();document.fonts.add(font);window.setT=render;window.renderSafe=true;render(0);
let generation=0;
function play(){const id=++generation,start=performance.now();function tick(now){if(id!==generation)return;const t=Math.min(5,(now-start)/1000);render(t);if(t<5)requestAnimationFrame(tick)}requestAnimationFrame(tick)}
document.querySelector('#play').onclick=play;if(!new URLSearchParams(location.search).has('export'))play();
