import * as T from '../../engine/vendor/three.module.js';
import {stateAt,clamp,smooth} from './timeline.js';
import {buildWorld,paintPerson} from './set.js';
import {makeActor,paintActor} from '../alexandria/art.js';
const canvas=document.querySelector('#film'),ctx=canvas.getContext('2d',{alpha:false}),q=new URLSearchParams(location.search),W=Number(q.get('width')||720),H=W*16/9;
canvas.width=W;canvas.height=H;let cc=q.get('captions')!=='off',playing=false,t=0,last=0;
const scene=new T.Scene(),camera=new T.PerspectiveCamera(43,W/H,.1,170);scene.fog=new T.Fog('#a7bdc1',25,85);scene.background=new T.Color('#a7bdc1');
const hemi=new T.HemisphereLight('#f5f5de','#264f5f',2.15);scene.add(hemi);
const key=new T.DirectionalLight('#ffe7c5',2.3);key.position.set(-15,30,20);scene.add(key);
const rim=new T.DirectionalLight('#addde5',1.7);rim.position.set(15,18,-18);scene.add(rim);
let renderer,world,timeline,diver;
const beam=new T.Mesh(new T.ConeGeometry(2.7,13,32,1,true),new T.MeshBasicMaterial({color:'#fff0ac',transparent:true,opacity:.045,side:T.DoubleSide,depthWrite:false,blending:T.AdditiveBlending}));scene.add(beam);
function wrap(text,maxWidth,font){ctx.font=font;const words=text.split(/\s+/),lines=[];let s='';for(const w of words){if(s&&ctx.measureText(s+' '+w).width>maxWidth){lines.push(s);s=w}else s=s?s+' '+w:w}if(s)lines.push(s);return lines}
function graphics(time,state){
 const sc=W/720;ctx.save();ctx.scale(sc,sc);
 // Subtle lens edge and practical caption protection, never a full-frame fade.
 const vig=ctx.createRadialGradient(360,530,180,360,640,920);vig.addColorStop(0,'#001c2a00');vig.addColorStop(1,'#00132145');ctx.fillStyle=vig;ctx.fillRect(0,0,720,1280);
 ctx.fillStyle='#17333ce5';ctx.beginPath();ctx.roundRect(28,29,389,40,7);ctx.fill();ctx.font='19px Caption';ctx.fillStyle='#f0f1d8';ctx.fillText('THE BLACK BOX PARADOX',43,56);ctx.fillStyle='#fb742f';ctx.fillRect(28,29,5,40);
 ctx.font='15px Caption';ctx.textAlign='right';ctx.fillStyle='#173f4d';ctx.fillText('ONE CONTINUOUS TAKE',691,56);
 const cue=timeline.captions.find(c=>time>=c.start&&time<c.end);
 if(cc&&cue){const font='31px Caption',lines=wrap(cue.text,624,font),lh=41,y=1046-(lines.length-1)*lh/2;ctx.font=font;ctx.textAlign='center';
  const grad=ctx.createLinearGradient(0,920,0,1190);grad.addColorStop(0,'#071d2900');grad.addColorStop(.5,'#071d29b8');grad.addColorStop(1,'#071d2960');ctx.fillStyle=grad;ctx.fillRect(0,920,720,270);
  lines.forEach((s,i)=>{ctx.lineWidth=5;ctx.lineJoin='round';ctx.strokeStyle='#102c37';ctx.strokeText(s,360,y+i*lh);ctx.fillStyle='#fff9e8';ctx.fillText(s,360,y+i*lh)})
 }
 ctx.fillStyle='#e1eeeb55';ctx.fillRect(28,1238,664,3);ctx.fillStyle='#ff7432';ctx.fillRect(28,1238,664*time/timeline.duration,3);
 ctx.restore();
}
function screen(a,index,time){const c=a.canvas.getContext('2d');c.fillStyle='#102d3a';c.fillRect(0,0,512,320);c.strokeStyle='#31515c';c.lineWidth=1;for(let i=0;i<512;i+=32){c.beginPath();c.moveTo(i,45);c.lineTo(i,320);c.stroke()}for(let y=64;y<320;y+=32){c.beginPath();c.moveTo(0,y);c.lineTo(512,y);c.stroke()}
 c.font='26px Caption';c.fillStyle='#b6dcd7';c.fillText(index?'COCKPIT AUDIO':'FLIGHT DATA',22,35);
 if(index){c.strokeStyle='#efbe64';c.lineWidth=4;c.beginPath();for(let x=0;x<512;x++){const e=(Math.sin(x*.053+time*3)*.5+.5),y=165+Math.sin(x*.22-time*10)*e*64;x?c.lineTo(x,y):c.moveTo(x,y)}c.stroke();c.font='19px Caption';c.fillText('REC  •  2 CHANNELS',22,290)}else{for(let j=0;j<3;j++){c.strokeStyle=['#7de0be','#f8d57b','#78c7e7'][j];c.lineWidth=3;c.beginPath();for(let x=0;x<512;x++){const y=100+j*64+Math.sin(x*.016+time+j)*18;x?c.lineTo(x,y):c.moveTo(x,y)}c.stroke()}c.font='19px Caption';c.fillStyle='#d5eae5';c.fillText('ALT   SPD   HDG   ACC',22,290)}a.tex.needsUpdate=true}
function render(time){
 t=clamp(time,0,timeline.duration);const s=stateAt(t);camera.position.set(...s.eye);camera.lookAt(...s.target);
 world.hero.position.set(s.x,s.y+Math.sin(t*1.35)*.055,0);world.hero.rotation.set(Math.sin(t*.6)*.016,-.13+Math.sin(t*.24)*.065,Math.sin(t*.9)*.012);
 world.shellMat.color.set('#142731').lerp(new T.Color('#ff6827'),clamp(s.orange));world.reflect.visible=s.reflect>.01;world.reflect.scale.x=Math.max(.001,s.reflect);
 const glint=Math.pow(Math.max(0,Math.cos(t*2.1)),18);for(const child of world.reflect.children)child.material.color.setRGB(1, .91+glint*.09,.65+glint*.35);
 world.led.visible=s.beacon>.1;const pulse=.8+Math.sin(t*6)*.2;world.led.scale.set(.05*pulse,.07*pulse,.07*pulse);
 world.shadow.position.x=s.x;world.shadow.material.opacity=1-s.underwater*.3;
 const blue=new T.Color('#457e86'),air=new T.Color('#a7bdc1');scene.background.copy(air).lerp(blue,s.underwater*.75);scene.fog.color.copy(scene.background);
 hemi.intensity=2.15-s.underwater*.65;
 world.actors.forEach(a=>{if(Math.abs(a.x-s.x)<17){paintPerson(a,t);a.plane.quaternion.copy(camera.quaternion);a.plane.visible=true}else a.plane.visible=false});
 world.screens.forEach((a,i)=>{if(t<19)screen(a,i,t)});
 world.rings.forEach((r,i)=>{const p=((t*.6+i/4)%1);r.position.copy(world.hero.position);r.position.x+=2.1;r.quaternion.copy(camera.quaternion);r.scale.setScalar(.4+p*5);r.visible=s.beacon>.1&&t<51;r.material.opacity=(1-p)*.5*s.beacon});
 diver.group.position.set(77+Math.sin(t*.35)*.7,1.2+Math.sin(t*.9)*.15,1);diver.plane.quaternion.copy(camera.quaternion);paintActor(diver,t,{pose:'swim'});
 world.fish.forEach(({g,x,y,z,phase})=>{g.position.set(x+Math.sin(t*.4+phase)*1.6,y+Math.cos(t*.6+phase)*.12,z);g.rotation.y=Math.sin(t*.5+phase)*.2});
 world.waters.forEach((m,i)=>{m.position.y=4.8+Math.sin(t*.8+i)*.035});
 // A practical search beam sweeps across the reflective strips; no overlay cut.
 const beamStart=new T.Vector3(s.x-5,6,5),beamEnd=new T.Vector3(s.x+Math.sin(t*.9)*2,0,-1);beam.position.copy(beamStart).add(beamEnd).multiplyScalar(.5);beam.quaternion.setFromUnitVectors(new T.Vector3(0,1,0),beamStart.clone().sub(beamEnd).normalize());beam.visible=t>26&&t<51;
 renderer.render(scene,camera);ctx.drawImage(renderer.domElement,0,0,W,H);graphics(t,s);
 window.frameInfo={time:t,chapter:s.chapter,camera:camera.position.toArray(),target:s.target,hero:world.hero.position.toArray(),drawCalls:renderer.info.render.calls,continuousTake:true};
 document.querySelector('#seek').value=t;document.querySelector('#clock').textContent=`${Math.floor(t/60)}:${String(Math.floor(t%60)).padStart(2,'0')}`;
}
async function init(){try{
 await document.fonts.load('31px Caption');timeline=await(await fetch('timeline.json')).json();
 renderer=new T.WebGLRenderer({alpha:false,antialias:true,preserveDrawingBuffer:true,powerPreference:'high-performance'});renderer.setSize(W,H,false);renderer.setPixelRatio(1);renderer.outputColorSpace=T.SRGBColorSpace;renderer.toneMapping=T.ACESFilmicToneMapping;renderer.toneMappingExposure=1.05;
 world=buildWorld(scene);diver=makeActor('diver');diver.group.scale.setScalar(.7);diver.shadow.visible=false;scene.add(diver.group);window.setT=render;window.setCaptions=v=>{cc=v;render(t)};window.filmDuration=timeline.duration;render(0);window.renderSafe=true;
 const audio=document.querySelector('#vo');document.querySelector('#play').onclick=async()=>{playing=!playing;if(playing){if(t>=timeline.duration)t=0;audio.currentTime=t;await audio.play();last=performance.now();requestAnimationFrame(tick)}else audio.pause();document.querySelector('#play').textContent=playing?'Pause':'Play'};
 document.querySelector('#seek').oninput=e=>{audio.currentTime=Number(e.target.value);render(Number(e.target.value))};document.querySelector('#cc').onclick=()=>{cc=!cc;render(t)};
 function tick(now){if(!playing)return;render(Math.min(timeline.duration,audio.currentTime));last=now;if(t>=timeline.duration-.05){playing=false;audio.pause();document.querySelector('#play').textContent='Play'}else requestAnimationFrame(tick)}
}catch(e){window.renderError=e.stack;console.error(e)}}init();
