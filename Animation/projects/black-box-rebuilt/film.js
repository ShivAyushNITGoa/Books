import * as T from '../../engine/vendor/three.module.js';
import {createWorld,drawPerson} from './world.js';
import {stateAt,DURATION,clearance} from './choreography.js';
import {fitCamera,subjectMatrix,corners,RECORDER_EXTENTS,CARRIER_EXTENTS,projectedBounds,personBounds,overlap} from './camera-rig.js';
const canvas=document.querySelector('#film'),ctx=canvas.getContext('2d',{alpha:false}),query=new URLSearchParams(location.search),W=Number(query.get('width')||720),H=W*16/9;
canvas.width=W;canvas.height=H;let renderer,world,narration,time=0,cc=query.get('captions')!=='off',playing=false;
const scene=new T.Scene(),camera=new T.PerspectiveCamera(46,W/H,.15,125);scene.background=new T.Color('#bdd1cb');scene.fog=new T.Fog('#bdd1cb',29,80);
const hemi=new T.HemisphereLight('#fff3cf','#678a8f',2.25);scene.add(hemi);
const sun=new T.DirectionalLight('#ffe6ba',2.7);sun.position.set(-18,30,12);sun.castShadow=true;sun.shadow.mapSize.set(1024,1024);Object.assign(sun.shadow.camera,{left:-24,right:24,top:25,bottom:-25,near:1,far:70});sun.shadow.normalBias=.035;sun.shadow.bias=-.00015;scene.add(sun);
const rim=new T.DirectionalLight('#b0dbe0',1.5);rim.position.set(16,13,-18);scene.add(rim);
const look=new T.Vector3();
function drawScreens(t){world.screens.forEach(({canvas:c,tex},index)=>{const x=c.getContext('2d');x.fillStyle='#123747';x.fillRect(0,0,512,320);x.strokeStyle='#355b65';x.lineWidth=1;for(let i=0;i<512;i+=32){x.beginPath();x.moveTo(i,50);x.lineTo(i,320);x.stroke()}for(let i=64;i<320;i+=32){x.beginPath();x.moveTo(0,i);x.lineTo(512,i);x.stroke()}x.fillStyle='#e5e8c8';x.font='25px Caption';x.fillText(index?'COCKPIT AUDIO':'FLIGHT DATA',20,35);for(let j=0;j<(index?1:3);j++){x.strokeStyle=index?'#f3c266':['#96e2c1','#f6cf70','#89cfe3'][j];x.lineWidth=3;x.beginPath();for(let n=0;n<512;n++){const a=index?Math.sin(n*.19-t*6)*(20+Math.sin(n*.05+t)*30):Math.sin(n*.023+t+j)*17;const y=index?170+a:95+j*68+a;n?x.lineTo(n,y):x.moveTo(n,y)}x.stroke()}x.font='18px Caption';x.fillStyle='#b0cec6';x.fillText(index?'REC   •   COCKPIT VOICE':'ALTITUDE   SPEED   HEADING',20,300);tex.needsUpdate=true})}
function subtitle(t){
 const scale=W/720;ctx.save();ctx.scale(scale,scale);
 const vignette=ctx.createRadialGradient(360,590,280,360,640,940);vignette.addColorStop(0,'#142f3b00');vignette.addColorStop(1,'#142f3b30');ctx.fillStyle=vignette;ctx.fillRect(0,0,720,1280);
 ctx.fillStyle='#173d49e8';ctx.beginPath();ctx.roundRect(29,29,251,43,7);ctx.fill();ctx.fillStyle='#f6edce';ctx.font='21px Caption';ctx.textAlign='left';ctx.fillText('THE BLACK BOX',45,58);ctx.fillStyle='#ff7332';ctx.fillRect(29,29,5,43);
 const cue=narration.captions.find(c=>t>=c.start&&t<c.end);if(cc&&cue){ctx.font='31px Caption';let lines=[],line='';for(const word of cue.text.split(/\s+/)){const next=line?line+' '+word:word;if(line&&ctx.measureText(next).width>625){lines.push(line);line=word}else line=next}if(line)lines.push(line);const y=1083-(lines.length-1)*21;
  const g=ctx.createLinearGradient(0,952,0,1200);g.addColorStop(0,'#0e2b3900');g.addColorStop(.47,'#0e2b39b5');g.addColorStop(1,'#0e2b3950');ctx.fillStyle=g;ctx.fillRect(0,952,720,248);ctx.textAlign='center';ctx.lineJoin='round';ctx.lineWidth=4.5;lines.forEach((s,i)=>{ctx.strokeStyle='#173442';ctx.strokeText(s,360,y+i*42);ctx.fillStyle='#fff9e5';ctx.fillText(s,360,y+i*42)})
 }
 ctx.fillStyle='#214b5550';ctx.fillRect(29,1239,662,3);ctx.fillStyle='#f4793a';ctx.fillRect(29,1239,662*t/DURATION,3);ctx.restore();
}
function render(t){
 time=Math.max(0,Math.min(DURATION,t));const s=stateAt(time);camera.position.set(...s.eye);look.set(...s.aim);camera.lookAt(look);camera.updateMatrixWorld(true);
 world.carrier.position.set(s.hero[0],s.hero[1]-1.6,s.hero[2]);world.carrier.rotation.y=s.heading;world.recorder.rotation.y=-s.heading+.12*Math.sin(t*.23);const framingDolly=fitCamera(camera,s); // independent stabilized inspection mount
 world.shell.color.set('#77929a').lerp(new T.Color('#ff722d'),Math.max(0,s.orange));if(t>18.8&&t<39.85)world.shell.color.set('#172d39').lerp(new T.Color('#ff722d'),Math.max(0,s.orange));
 world.reflect.visible=s.reflection>.01;world.reflect.scale.y=Math.max(.001,s.reflection);
 world.led.visible=s.beacon>.1;world.led.material.color.setRGB(.55+.35*Math.sin(t*5)**2,1,.77);
 world.wheels.forEach((w,i)=>{w.rotation.x=t*4+i*.1});
 world.paintArm.visible=t>3.1&&t<5.3;world.paintArm.position.set(Math.sin((t-3.1)*5)*.65,.1,.79);world.paintArm.rotation.set(Math.PI/2,0,0);
 world.cartShadow.position.set(s.hero[0],s.hero[1]<1.3?-1.81:.016,s.hero[2]);
 world.people.forEach(p=>{drawPerson(p,t,camera.position);p.plane.rotation.y=Math.atan2(camera.position.x-p.x,camera.position.z-p.z)});
 drawScreens(t);
 world.fish.forEach(({g,x,y,z,p})=>{let fx=x+Math.sin(t*.35+p)*.65,fz=z;const dx=fx-s.hero[0],dz=fz-s.hero[2],d=Math.max(.001,Math.hypot(dx,dz)),r=3.1+Math.log1p(Math.exp((d-3.1)*4))/4;fx=s.hero[0]+dx/d*r;fz=s.hero[2]+dz/d*r;g.position.set(fx,y+Math.sin(t*.65+p)*.06,fz);g.rotation.y=Math.sin(t*.5+p)*.25});
 world.water.position.y=2.65+Math.sin(t*.7)*.025;
 world.rings.forEach((r,i)=>{const p=(t*.55+i/4)%1;r.position.set(s.hero[0]+1.55,s.hero[1]-.2,s.hero[2]);r.quaternion.copy(camera.quaternion);r.scale.setScalar(.3+p*3.8);r.material.opacity=(1-p)*.6;r.visible=s.beacon>.1&&t<51});
 scene.background.set('#bdd1cb').lerp(new T.Color('#477b83'),s.underwater*.65);scene.fog.color.copy(scene.background);scene.fog.near=29-s.underwater*18;scene.fog.far=80-s.underwater*41;hemi.intensity=2.25-s.underwater*.65;
 renderer.render(scene,camera);ctx.drawImage(renderer.domElement,0,0,W,H);subtitle(time);
 world.carrier.updateMatrixWorld(true);const heroNdc=new T.Vector3(...s.hero).project(camera),screenBounds=projectedBounds(corners(RECORDER_EXTENTS,subjectMatrix(s)),camera),carrierBounds=projectedBounds(corners(CARRIER_EXTENTS,subjectMatrix(s)),camera),peopleClearance=world.people.map(p=>({id:p.id,clearance:clearance(s,p),screenOverlap:overlap(screenBounds,personBounds(p,camera))}));
 window.frameInfo={time,chapter:s.chapter,camera:camera.position.toArray(),target:s.aim,hero:s.hero,heading:s.heading,framingDolly,heroNdc:heroNdc.toArray(),screenBounds,carrierBounds,peopleClearance,azimuth:Math.atan2(camera.position.x-s.hero[0],camera.position.z-s.hero[2]),drawCalls:renderer.info.render.calls,continuousTake:true};
 document.querySelector('#seek').value=time;document.querySelector('#clock').textContent=`${Math.floor(time/60)}:${String(Math.floor(time%60)).padStart(2,'0')}`;
}
async function init(){try{
 await document.fonts.load('31px Caption');narration=await(await fetch('narration.json')).json();
 renderer=new T.WebGLRenderer({antialias:true,alpha:false,preserveDrawingBuffer:true,powerPreference:'high-performance'});renderer.setSize(W,H,false);renderer.setPixelRatio(1);renderer.outputColorSpace=T.SRGBColorSpace;renderer.toneMapping=T.ACESFilmicToneMapping;renderer.toneMappingExposure=1.13;renderer.shadowMap.enabled=true;renderer.shadowMap.type=T.PCFSoftShadowMap;
 world=createWorld(scene);world.carrier.traverse(o=>o.castShadow=false);
 window.auditStaticSightlines=()=>{
 const c=new T.PerspectiveCamera(46,W/H,.15,125),ray=new T.Raycaster(),solids=world.fixed.children.filter(o=>o.isMesh&&(!o.material.transparent||o.material.opacity>.5)),bad=[];world.fixed.updateMatrixWorld(true);
 for(let f=0;f<1561;f++){const s=stateAt(f/24);fitCamera(c,s);const dir=new T.Vector3(...s.hero).sub(c.position);ray.set(c.position,dir.clone().normalize());ray.near=c.near;ray.far=dir.length()-.25;const hit=ray.intersectObjects(solids,false)[0];if(hit)bad.push({time:f/24,hit:hit.point.toArray(),color:hit.object.material.color?.getHexString(),distance:hit.distance})}return bad;
 };
 window.setT=render;window.setCaptions=v=>{cc=v;render(time)};window.filmDuration=DURATION;render(0);renderer.shadowMap.autoUpdate=false;window.renderSafe=true;
 const audio=document.querySelector('#vo'),play=document.querySelector('#play');play.onclick=async()=>{if(playing){playing=false;audio.pause();play.textContent='Play';return}if(time>=DURATION-.05)time=0;audio.currentTime=time;await audio.play();playing=true;play.textContent='Pause';requestAnimationFrame(tick)};
 document.querySelector('#seek').oninput=e=>{audio.currentTime=+e.target.value;render(+e.target.value)};document.querySelector('#cc').onclick=()=>{cc=!cc;render(time)};
 function tick(){if(!playing)return;render(audio.currentTime);if(time>=DURATION-.05){playing=false;audio.pause();play.textContent='Play'}else requestAnimationFrame(tick)}
}catch(e){window.renderError=e.stack;console.error(e)}}init();
