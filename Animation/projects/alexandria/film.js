import * as THREE from '../../engine/vendor/three.module.js';
import {stateAt,clamp,mix,smooth,ramp} from './timeline.js';
import {buildSet} from './set.js';
import {paintActor,texture,random} from './art.js';
import {batchStatic} from './batch.js';
import {parseSrt} from '../../engine/project.js';
const output=document.querySelector('#film'),ctx=output.getContext('2d',{alpha:false}),params=new URLSearchParams(location.search);
const W=Number(params.get('width')||1080),H=Number(params.get('height')||1920);
if(![W,H].every(n=>Number.isInteger(n)&&n>=160&&n<=3840)||Math.abs(W/H-9/16)>.002)throw Error('Use 9:16 dimensions');
output.width=W;output.height=H;
let renderer,playing=false,time=0,prev=0,showCaptions=params.get('captions')!=='off',cues=[];
const scene=new THREE.Scene(),camera=new THREE.PerspectiveCamera(46,W/H,.08,240);
const look=new THREE.Vector3(),color=new THREE.Color(),up=new THREE.Vector3(0,1,0);
const hemi=new THREE.HemisphereLight('#f9e8bb','#536b68',1.7);scene.add(hemi);
const sun=new THREE.DirectionalLight('#ffdfa1',3.1);sun.position.set(-20,35,20);sun.castShadow=true;sun.shadow.mapSize.set(2048,2048);Object.assign(sun.shadow.camera,{left:-42,right:42,top:40,bottom:-42,near:1,far:110});sun.shadow.normalBias=.06;sun.shadow.bias=-.0002;sun.target.position.set(0,-2,-10);scene.add(sun,sun.target);
const aquaKey=new THREE.DirectionalLight('#ffe7c4',2.1);aquaKey.position.set(2,-5,16);aquaKey.target.position.set(-1,-13,-4);scene.add(aquaKey,aquaKey.target);
const rim=new THREE.DirectionalLight('#95dcd7',1.1);rim.position.set(12,12,-16);scene.add(rim);
const rng=random(934);
function water(){
 const geo=new THREE.PlaneGeometry(330,330,110,110);geo.rotateX(-Math.PI/2);
 const uniforms={time:{value:0},storm:{value:0},under:{value:0},eye:{value:new THREE.Vector3()}};
 const material=new THREE.ShaderMaterial({uniforms,transparent:true,depthWrite:false,side:THREE.DoubleSide,toneMapped:false,vertexShader:`
 uniform float time;uniform float storm;varying vec3 vP;varying vec3 vN;
 float wave(vec2 p){return sin(p.x*.65+time*1.4)*.12+sin(p.y*.8+time*1.1)*.09+sin(p.x*.24+p.y*.32-time*1.2)*(.1+storm*1.35)+sin(p.x*1.8-p.y*.6+time*2.)*.035;}
 void main(){vec3 p=position;p.y+=wave(p.xz);vP=p;float e=.04;vN=normalize(vec3(wave(p.xz-vec2(e,0))-wave(p.xz+vec2(e,0)),2.*e,wave(p.xz-vec2(0,e))-wave(p.xz+vec2(0,e))));gl_Position=projectionMatrix*modelViewMatrix*vec4(p,1.);}`,
 fragmentShader:`uniform float time;uniform float storm;uniform float under;uniform vec3 eye;varying vec3 vP;varying vec3 vN;
 void main(){vec3 n=normalize(vN);vec3 v=normalize(eye-vP);float fres=pow(1.-abs(dot(n,v)),3.);float sun=pow(max(0.,dot(reflect(normalize(vec3(.35,-.8,-.3)),n),v)),75.);float weave=sin(vP.x*3.+sin(vP.z*1.7-time)*2.+time)*sin(vP.z*3.6-time*.7);float foam=smoothstep(.93,.99,weave)*.08+smoothstep(.6,1.5,vP.y)*storm*.3;vec3 c=mix(vec3(.035,.32,.37),vec3(.23,.65,.62),fres*.7+.2);c=mix(c,vec3(.11,.25,.3),storm*.48);c+=vec3(1.,.8,.42)*sun*.7+foam*vec3(.5,.67,.57);c=mix(c,vec3(.08,.42,.46),under*.7);gl_FragColor=vec4(c,mix(.94,.18,under));}`});
 const mesh=new THREE.Mesh(geo,material);mesh.renderOrder=3;scene.add(mesh);return {mesh,uniforms};
}
const sea=water();
// Wide, slowly moving sunlight volumes. Their geometry lives between surface and seabed.
const shafts=[];for(let i=0;i<8;i++){
 const geo=new THREE.ConeGeometry(1.4+i*.2,24,24,1,true);geo.translate(0,-12,0);const mat=new THREE.ShaderMaterial({transparent:true,depthWrite:false,side:THREE.DoubleSide,blending:THREE.AdditiveBlending,uniforms:{opacity:{value:.055}},vertexShader:`varying vec2 vUv;void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}`,fragmentShader:`uniform float opacity;varying vec2 vUv;void main(){float stripe=pow(sin(vUv.x*3.14159265),3.);float fade=sin(vUv.y*3.14159265);gl_FragColor=vec4(.48,.85,.76,opacity*stripe*fade);}`});
 const mesh=new THREE.Mesh(geo,mat);mesh.position.set(-13+i*4,1,-10-(i%3)*4);mesh.rotation.z=-.22;mesh.renderOrder=4;scene.add(mesh);shafts.push(mesh);
}
const caustics=new THREE.Mesh(new THREE.PlaneGeometry(90,90),new THREE.ShaderMaterial({transparent:true,depthWrite:false,blending:THREE.AdditiveBlending,uniforms:{time:{value:0}},vertexShader:`varying vec2 vUv;void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}`,fragmentShader:`uniform float time;varying vec2 vUv;void main(){vec2 p=vUv*120.;float a=sin(p.x+sin(p.y*.8+time*.5)*2.);float b=sin(p.y+sin(p.x*.7-time*.4)*2.);float f=pow(1.-abs(a*b),18.);gl_FragColor=vec4(.36,.74,.55,f*.13);}`}));caustics.rotation.x=-Math.PI/2;caustics.position.set(0,-16.32,-5);scene.add(caustics);
// Ripple rings around the drowning quay and dive entry; no stock overlays.
const ripples=[];for(let i=0;i<8;i++){const o=new THREE.Mesh(new THREE.RingGeometry(.94,1,64),new THREE.MeshBasicMaterial({color:'#deead1',transparent:true,opacity:.3,side:THREE.DoubleSide,depthWrite:false}));o.rotation.x=-Math.PI/2;o.position.set((i%4-1.5)*5,.24,3+Math.floor(i/4)*5);scene.add(o);ripples.push(o)}
// Animated crack geometry in the actual mosaic floor, opening across the quay.
const cracks=[];for(let j=0;j<5;j++){const pts=[];for(let i=0;i<16;i++)pts.push(new THREE.Vector3(-8+j*3.8+Math.sin(i*2.4+j)*.4,1.3,-8+i*.7));const g=new THREE.BufferGeometry().setFromPoints(pts),o=new THREE.Line(g,new THREE.LineBasicMaterial({color:'#493c31',transparent:true,opacity:.85}));scene.add(o);cracks.push(o);const vertices=new Float32Array(15*6*3),wide=new THREE.BufferGeometry();wide.setAttribute('position',new THREE.BufferAttribute(vertices,3));const ribbon=new THREE.Mesh(wide,new THREE.MeshBasicMaterial({color:'#3a3028',side:THREE.DoubleSide}));scene.add(ribbon);o.userData.ribbon=ribbon;o.userData.path=pts}
const sprayGeo=new THREE.BufferGeometry(),sprayPos=new Float32Array(300*3);sprayGeo.setAttribute('position',new THREE.BufferAttribute(sprayPos,3));const spray=new THREE.Points(sprayGeo,new THREE.PointsMaterial({color:'#e9ebd8',size:.07,transparent:true,opacity:.65,depthWrite:false}));spray.renderOrder=5;scene.add(spray);
let set;
function orientActor(actor,position,scale=1){actor.group.position.set(...position);actor.group.scale.setScalar(scale);const dx=camera.position.x-actor.group.getWorldPosition(new THREE.Vector3()).x,dz=camera.position.z-actor.group.getWorldPosition(new THREE.Vector3()).z;actor.group.rotation.y=Math.atan2(dx,dz)}
function draw(t){
 const s=stateAt(t);time=Math.max(0,Math.min(60,t));const {index,u}=s;const underwater=1-ramp(s.camera[1],-.8,.6),storm=s.storm?1:0;
 camera.position.set(...s.camera);look.set(...s.look);
 if(index===4||index===5){const strength=index===5?.075:.025;camera.position.x+=Math.sin(t*31)*strength;camera.position.y+=Math.sin(t*43)*strength*.65;look.x+=Math.sin(t*23)*strength*.4}
 camera.fov=s.shot.fov;camera.updateProjectionMatrix();camera.lookAt(look);
 scene.fog=new THREE.FogExp2(color.set('#d8ccaf').lerp(new THREE.Color('#075466'),underwater),mix(storm?.018:.009,.038,underwater));
 sun.color.set(storm?'#bfd8d5':'#ffdda0').lerp(new THREE.Color('#a4d4d6'),underwater);sun.intensity=mix(storm?1.3:3.05,1.75,underwater);sun.castShadow=!s.sinking;hemi.color.set('#ffe9bb').lerp(new THREE.Color('#9bc7c5'),underwater);hemi.groundColor.set('#626751').lerp(new THREE.Color('#123a42'),underwater);hemi.intensity=mix(1.65,1.6,underwater);rim.intensity=mix(1.0,1.2,underwater);aquaKey.intensity=underwater*2.1;
 set.ancient.position.y=s.sink;
 set.ancient.visible=index!==0&&!(index>=7&&index!==13);set.ruins.visible=index===0||index>=6&&index!==13;
 if(index===6)set.ancient.visible=true;
 spray.visible=index===5;for(let i=0;i<300;i++){const p=((t*.5+i*.071)%1),x=(i%50-25)*.72;const a=sprayGeo.attributes.position;a.setXYZ(i,x+Math.sin(i)*p*.7,.2+Math.sin(p*Math.PI)*(1.4+(i%7)*.17),2.4+Math.cos(i)*p*.9);a.needsUpdate=true}
 const pose=s.sinking?'alarmed':'idle';
 const all=[set.queen,set.attendant,...set.guards,...set.extras];
 for(let i=0;i<all.length;i++){
  const a=all[i];a.group.visible=i===0?[1,2,3,13].includes(index):![5,6].includes(index);paintActor(a,t,{pose:i>=4?'walk':pose,gesture:a.kind==='queen'?.5+.3*Math.sin(t*.7):.1,worry:s.sinking?1:0});
  // Plane-only yaw keeps a grounded cutout in the dimensional set.
  if(i>=4)a.group.position.x=-12+(i-4)*10+Math.sin(t*.35+i)*1.2+(s.sinking?(i%2?1:-1)*ramp(t,16,24)*7:0);
  const p=a.group.getWorldPosition(new THREE.Vector3());a.group.rotation.y=Math.atan2(camera.position.x-p.x,camera.position.z-p.z);
  if(s.sinking)a.group.rotation.z=Math.sin(t*12+i)*.04;else a.group.rotation.z=0;

 }
 for(const c of set.cloths){const pos=c.mesh.geometry.attributes.position;for(let j=0;j<pos.count;j++){const x=c.base[j*3],y=c.base[j*3+1],anch=(c.h/2-y)/c.h;pos.setZ(j,c.base[j*3+2]+Math.sin(x*3+t*(storm?5:2)+y)*(.1+storm*.16)*anch)}pos.needsUpdate=true;c.mesh.geometry.computeVertexNormals()}
 set.palms.forEach((p,i)=>{p.rotation.z=Math.sin(t*(storm?3:1)+i)*(.015+storm*.055)});
 set.ships.forEach((ship,i)=>{ship.visible=[2,3,13].includes(index);ship.position.y=Math.sin(t*1.3+i)*(.1+storm*.25);ship.rotation.z=Math.sin(t*1.4+i)*(.025+storm*.065)});
 set.boat.visible=index>=9&&index!==13;set.boat.position.y=.1+Math.sin(t*1.3)*.08;set.boat.rotation.z=Math.sin(t*1.5)*.025;
 sea.uniforms.time.value=t;sea.uniforms.storm.value=storm;sea.uniforms.under.value=underwater;sea.uniforms.eye.value.copy(camera.position);sea.mesh.visible=true;
 for(let i=0;i<shafts.length;i++){shafts[i].visible=underwater>.1;shafts[i].rotation.z=-.18+Math.sin(t*.23+i)*.025;shafts[i].material.uniforms.opacity.value=.032*underwater}
 caustics.visible=underwater>.1;caustics.material.uniforms.time.value=t;
 for(let i=0;i<ripples.length;i++){const o=ripples[i];o.visible=s.sinking||index===9;const phase=(t*.4+i*.17)%1;o.scale.setScalar(1+phase*(index===9?2:6));o.material.opacity=(1-phase)*.23;o.renderOrder=5}
 cracks.forEach((c,i)=>{c.visible=index===4||index===5;c.position.y=s.sink;c.geometry.setDrawRange(0,Math.floor(clamp((t-16-i*.13)/2.6)*16));const ribbon=c.userData.ribbon;ribbon.visible=c.visible;ribbon.position.y=s.sink;const verts=ribbon.geometry.attributes.position,path=c.userData.path,w=ramp(t,16.1+i*.13,19)*.065;for(let j=0;j<15;j++){const a=path[j],b=path[j+1],v=[[a.x-w,a.z],[a.x+w,a.z],[b.x-w,b.z],[a.x+w,a.z],[b.x+w,b.z],[b.x-w,b.z]];v.forEach(([x,z],k)=>verts.setXYZ(j*6+k,x,1.313,z))}verts.needsUpdate=true;ribbon.geometry.setDrawRange(0,Math.floor(clamp((t-16-i*.13)/2.6)*15)*6)});
 set.fallingColumns.forEach((c,i)=>{const progress=index===7?ramp(u,c.delay,Math.min(1,c.delay+.45)):s.collapse;c.pivot.rotation.z=progress*(1.37+i*.05)*c.dir;c.pivot.rotation.x=progress*.12});
 set.colossal.rotation.z=index===7?ramp(u,.45,1)*.09:.09*s.collapse;
 set.fish.forEach((f,i)=>{f.group.visible=underwater>.2;f.group.position.set(Math.sin(t*.18+f.seed)*13,-8-i%5*1.3+Math.sin(t*.7+i)*.15,-8+Math.cos(f.seed)*11);f.group.rotation.y=Math.cos(t*.18+f.seed)>0?0:Math.PI;f.tail.rotation.y=Math.sin(t*9+i)*.45});
 set.birds.forEach((b,i)=>{b.visible=underwater<.1&&!storm;b.position.set(Math.sin(t*.15+i)*28,12+i%3*2,-20+Math.cos(t*.15+i)*15);const a=b.geometry.attributes.position;a.setY(0,Math.sin(t*4+i)*.16);a.setY(2,Math.sin(t*4+i)*.16);a.needsUpdate=true});
 // Fine particles have depth, differing drift rates and deterministic absolute-time motion.

 for(let i=0;i<2;i++){
  const a=set.divers[i];a.group.visible=s.modern&&index!==13;a.shadow.visible=false;
  let p;if(index===9)p=[i?2.5:.7,mix(-.5,-11,smooth(u))-(i?1.2:0),mix(2,1,u)-i*2];
  else if(index===10)p=[mix(-2.5,-2.1,smooth(u))+i*5,-12.2+i*.9,-.5-i*3];
  else if(index===11)p=[-3+u*3+i*4,-11.8+i*.8,1-i*4];
  else if(index===12)p=[.3-i*4,-14.3+i*1.2,2.4-i*5];
  else p=[mix(1,2,u)+i*3,-12.5+i*.6,2-i*5];
  orientActor(a,p,i?.55:.65);paintActor(a,t,{swim:1,work:index===12?1:0});a.plane.rotation.z=index===9?mix(-.8,-.12,smooth(u)):-.1;
  const torch=set.torches[i];torch.group.visible=a.group.visible;torch.group.position.copy(a.group.position);const source=new THREE.Vector3(.85,0,.2).applyAxisAngle(up,a.group.rotation.y);torch.spot.position.copy(source);const target=new THREE.Vector3(-1.5+Math.sin(t*.7+i)*2,-14.6,-3.2);torch.spot.target.position.copy(target.clone().sub(a.group.position));const tip=source.clone(),direction=target.clone().sub(a.group.position).sub(tip);torch.beam.position.copy(tip.clone().addScaledVector(direction,.5));torch.beam.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),direction.clone().negate().normalize());torch.beam.scale.y=direction.length()/8;
 }
 for(const [particles,type] of [[set.silt,'silt'],[set.dust,'dust'],[set.bubbles,'bubble']]){
  particles.mesh.visible=type==='silt'?underwater>.1:type==='dust'?index>=4&&index<=8:s.modern&&index!==13;
  particles.mesh.material.opacity=type==='dust'?(index===7?.5:.2):type==='bubble'?.55:.3;
  const p=particles.mesh.geometry.attributes.position;
  for(let i=0;i<p.count;i++){
   const x=particles.base[i*3],y=particles.base[i*3+1],z=particles.base[i*3+2];
   if(type==='bubble'){const j=i%2,base=set.divers[j].group.position;p.setXYZ(i,base.x+.7+Math.sin(i*3.1+t)*.08,base.y+((i*.29+t*.8)%6),base.z+.1+Math.cos(i)*.18)}
   else if(type==='dust')p.setXYZ(i,x*.4,-16+((i*.23+t*.16)%3.5),z*.4-3);
   else p.setXYZ(i,x+Math.sin(t*.2+i)*.2,y+Math.sin(t*.15+i)*.3,z+Math.cos(t*.18+i)*.2);
  }p.needsUpdate=true;
 }
 set.survey.visible=index===12;
 // Sky/water color is composited beneath the transparent WebGL render; actors
 // and all sets remain real depth-tested geometry, never a backdrop slideshow.
 const grad=ctx.createLinearGradient(0,0,0,H);if(underwater>.5){grad.addColorStop(0,'#246f7c');grad.addColorStop(.45,'#0a5362');grad.addColorStop(1,'#082f3f')}else if(storm){grad.addColorStop(0,'#526f80');grad.addColorStop(.6,'#9cafaa');grad.addColorStop(1,'#b9bca3')}else{grad.addColorStop(0,'#4c9fb9');grad.addColorStop(.5,'#b6d5cb');grad.addColorStop(1,'#f7deb0')}ctx.fillStyle=grad;ctx.fillRect(0,0,W,H);
 if(underwater<.5&&!storm){ctx.save();const sunGlow=ctx.createRadialGradient(W*.16,H*.17,0,W*.16,H*.17,W*.45);sunGlow.addColorStop(0,'#fff2b4aa');sunGlow.addColorStop(1,'#ffdf8b00');ctx.fillStyle=sunGlow;ctx.fillRect(0,0,W,H);ctx.restore()}
 if(underwater<.1){ctx.fillStyle=storm?'#d5ded31c':'#fff5da30';for(let i=0;i<9;i++){const x=(((i*.197+t*.0009)%1.5)-.25)*W,y=H*(.08+(i%3)*.045);ctx.beginPath();ctx.ellipse(x,y,W*(.14+i%2*.04),H*.012,0,0,Math.PI*2);ctx.fill()}}
 const shadowKey=String(index);renderer.shadowMap.needsUpdate=index===7||shadowKey!==window.lastShadowKey;window.lastShadowKey=shadowKey;renderer.render(scene,camera);ctx.drawImage(renderer.domElement,0,0,W,H);
 // Lens treatment: very gentle, no large vignette obscuring archaeological detail.
 const vig=ctx.createRadialGradient(W*.5,H*.47,W*.18,W*.5,H*.47,H*.72);vig.addColorStop(0,'#00131b00');vig.addColorStop(1,underwater>.5?'#001c3855':'#25170835');ctx.fillStyle=vig;ctx.fillRect(0,0,W,H);
 if(storm&&underwater<.4){ctx.strokeStyle='#d3e7df38';ctx.lineWidth=Math.max(1,W/900);for(let i=0;i<80;i++){const x=((i*139+t*210)%1080)/1080*W,y=((i*197+t*940)%1920)/1920*H;ctx.beginPath();ctx.moveTo(x,y);ctx.lineTo(x-W*.009,y+H*.027);ctx.stroke()}}
 if(showCaptions){const cue=cues.find(q=>time>=q.start&&time<q.end);if(cue)paintCaptions(cue.text)}
 document.querySelector('#seek').value=time;document.querySelector('#time').textContent=`${time.toFixed(1)} / 60.0 · silent`;
 window.frameInfo={shot:s.shot.id,index,underwater,drawCalls:renderer.info.render.calls,triangles:renderer.info.render.triangles};
}
function paintCaptions(text){
 const scale=W/1080,lines=text.split('\n');let size=48*scale;ctx.font=`850 ${size}px Inter, sans-serif`;const max=W*.87;while(lines.some(t=>ctx.measureText(t).width>max)&&size>32*scale){size-=scale;ctx.font=`850 ${size}px Inter, sans-serif`}
 const y=H*.81;ctx.save();ctx.textAlign='center';ctx.textBaseline='middle';ctx.lineJoin='round';ctx.lineWidth=size*.19;ctx.strokeStyle='#102631';ctx.fillStyle='#fff8e8';ctx.shadowColor='#06182080';ctx.shadowBlur=8*scale;
 lines.forEach((line,i)=>{ctx.strokeText(line,W/2,y+i*size*1.28);ctx.fillText(line,W/2,y+i*size*1.28)});ctx.restore();
}
window.capturePair=t=>{const saved=showCaptions;showCaptions=false;draw(t);const image=output.toDataURL('image/jpeg',.96).split(',')[1];const cue=cues.find(q=>time>=q.start&&time<q.end);if(cue)paintCaptions(cue.text);const captioned=output.toDataURL('image/jpeg',.96).split(',')[1];showCaptions=saved;return {image,captioned,info:window.frameInfo}};
window.setT=t=>draw(t);window.setCaptions=value=>{showCaptions=!!value;draw(time)};
try{
 renderer=new THREE.WebGLRenderer({antialias:true,alpha:true,preserveDrawingBuffer:true,powerPreference:'high-performance'});renderer.setSize(W,H);renderer.setPixelRatio(1);renderer.shadowMap.enabled=true;renderer.shadowMap.autoUpdate=false;renderer.shadowMap.type=THREE.PCFSoftShadowMap;renderer.outputColorSpace=THREE.SRGBColorSpace;renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.12;renderer.setClearColor('#000000',0);
 set=buildSet(scene);
 const granite=await new THREE.TextureLoader().loadAsync('./assets/rose-granite.jpg');granite.colorSpace=THREE.SRGBColorSpace;granite.anisotropy=4;set.materials.sculptMat.map=granite;set.materials.sculptMat.bumpMap=granite;set.materials.sculptMat.bumpScale=.055;set.materials.sculptMat.needsUpdate=true;
 set.fish.forEach(f=>f.group.traverse(o=>{if(o.isMesh)o.castShadow=false}));
 [...set.palms,...set.ships,set.boat].forEach(g=>g.traverse(o=>{if(o.isMesh)o.castShadow=false}));set.cloths.forEach(c=>{c.mesh.castShadow=false});
 const relief=await new THREE.TextureLoader().loadAsync('./assets/carved-relief.jpg');relief.colorSpace=THREE.SRGBColorSpace;relief.anisotropy=4;set.materials.glyph.map=relief;set.materials.glyph.needsUpdate=true;set.inscribed.material.map=relief;set.inscribed.material.color.set('#d1cfae');set.inscribed.material.needsUpdate=true;
 const excluded=new Set([set.queen.group,set.attendant.group,...set.guards.map(a=>a.group),...set.extras.map(a=>a.group),...set.cloths.map(c=>c.mesh),...set.palms]);
 set.palms.forEach(p=>batchStatic(p));batchStatic(set.ancient,excluded);batchStatic(set.colossal);set.fallingColumns.forEach(c=>batchStatic(c.pivot));batchStatic(set.ruins,new Set([set.colossal,...set.fallingColumns.map(c=>c.pivot)]));
 const res=await fetch('./captions.srt');if(!res.ok)throw Error('Caption file unavailable');cues=parseSrt(await res.text());if(cues.length!==15||cues.at(-1).end!==60)throw Error('Expected the exact 60-second supplied SRT');
 await document.fonts.load('850 48px Inter');await document.fonts.ready;
 document.querySelector('#seek').oninput=e=>draw(Number(e.target.value));document.querySelector('#play').onclick=()=>{playing=!playing;if(playing&&time>=60)time=0;prev=performance.now();document.querySelector('#play').textContent=playing?'Pause':'Play'};
 document.querySelector('#captions').onclick=()=>{showCaptions=!showCaptions;document.querySelector('#captions').textContent=showCaptions?'CC on':'CC off';draw(time)};
 function tick(now){if(playing){const delta=Math.max(0,(now-prev)/1000);draw(Math.min(60,time+delta));if(time>=60){playing=false;document.querySelector('#play').textContent='Play'}}prev=now;requestAnimationFrame(tick)}requestAnimationFrame(tick);
 draw(0);window.renderSafe=true;
}catch(e){window.renderError=e.stack||e.message;document.querySelector('#error').textContent=window.renderError;console.error(e)}
