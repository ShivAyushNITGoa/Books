import {T} from './engine/geometry.js';
import {clamp,distance} from './engine/math.js';
import {buildWorld} from './world/index.js';
import {cameraAt,cameraAudit,cameraSpeed,DURATION} from './direction/camera.js';
import {drawOverlay} from './ui/overlay.js';

const params=new URLSearchParams(location.search);
const W=Number(params.get('width')||720),H=W*16/9;
const canvas=document.querySelector('#film');
const ctx=canvas.getContext('2d',{alpha:false});
canvas.width=W;canvas.height=H;
const scene=new T.Scene();
scene.background=new T.Color(0xa8bcb2);
scene.fog=new T.Fog(0xa8bcb2,95,240);
const camera=new T.PerspectiveCamera(45,W/H,.12,320);
const renderer=new T.WebGLRenderer({antialias:params.get('aa')!=='off',preserveDrawingBuffer:true,alpha:false,powerPreference:'high-performance'});
renderer.setSize(Math.round(W*.75),Math.round(H*.75),false);
renderer.setPixelRatio(1);
renderer.outputColorSpace=T.SRGBColorSpace;
renderer.toneMapping=T.ACESFilmicToneMapping;
renderer.toneMappingExposure=1.04;
scene.add(new T.HemisphereLight(0xf6edcf,0x5f7168,1.85));
const key=new T.DirectionalLight(0xffdfad,2.45);
key.position.set(-30,48,32);scene.add(key);
const fill=new T.DirectionalLight(0xc4dfdf,.7);
fill.position.set(30,14,-30);scene.add(fill);
let world,narration,beats,time=0,playing=false,cc=params.get('captions')!=='off';

function beatAt(t) {
  return beats.find(b=>t>=b.start&&t<b.end)||beats.at(-1);
}

function render(t) {
  time=clamp(t,0,DURATION);
  const authored=cameraAt(time);
  const telemetry=world.update(time);
  camera.position.fromArray(authored.position);
  camera.lookAt(...authored.target);
  camera.updateMatrixWorld();
  renderer.render(scene,camera);
  ctx.drawImage(renderer.domElement,0,0,W,H);
  const beat=beatAt(time);
  drawOverlay(ctx,W,H,{t:time,camera:authored.position,target:authored.target},narration,cc);
  window.frameInfo={
    t:time,chapter:beat.id,action:beat.action,
    camera:authored.position,target:authored.target,
    cameraSpeed:cameraSpeed(time),continuous:true,
    drawCalls:renderer.info.render.calls,
    triangles:renderer.info.render.triangles,
    actors:telemetry.actors,
    flood:telemetry.flood,
    railway:telemetry.railway,
  };
  document.querySelector('#seek').value=time;
  document.querySelector('#clock').textContent=`${Math.floor(time/60)}:${String(Math.floor(time%60)).padStart(2,'0')}`;
}

function inspectWorld() {
  const issues=[],matrixIssues=[];
  scene.updateMatrixWorld(true);
  scene.traverse(o=>{
    if(!o.matrixWorld.elements.every(Number.isFinite))matrixIssues.push(o.name||o.id);
  });
  for(const actor of world.actors.values()) {
    if(actor.state.walking&&actor.state.speed<.015)issues.push({id:actor.id,problem:'walk without translation'});
  }
  return {issues,matrixIssues,actors:window.frameInfo.actors,placeVisibilitySwitches:0};
}

async function boot() {
  [narration,beats]=await Promise.all(['narration.json','direction/beats.json'].map(async file=>{
    const response=await fetch(file);
    if(!response.ok)throw Error(`${file}: ${response.status}`);
    return response.json();
  }));
  await document.fonts.load('750 24px Film');
  world=buildWorld(scene);
  window.setT=render;
  window.getShots=()=>beats;
  window.auditCamera=cameraAudit;
  window.inspectWorld=inspectWorld;
  window.filmScene=scene;
  window.filmWorld=world;
  window.filmCamera=camera;
  render(0);
  window.renderSafe=true;
  const audio=document.querySelector('#vo');
  const play=document.querySelector('#play');
  play.onclick=async()=>{
    if(playing){audio.pause();playing=false;play.textContent='Play';return;}
    try {
      audio.currentTime=time;
      await audio.play();
      playing=true;play.textContent='Pause';requestAnimationFrame(tick);
    } catch(error) {
      playing=false;play.textContent='Play';console.error('Audio playback:',error);
    }
  };
  document.querySelector('#seek').max=DURATION;
  document.querySelector('#seek').oninput=e=>{
    render(Number(e.target.value));audio.currentTime=time;
  };
  document.querySelector('#cc').onclick=()=>{cc=!cc;render(time);};
  audio.onended=()=>{playing=false;play.textContent='Play';};
  function tick(){
    if(!playing)return;
    render(audio.currentTime);requestAnimationFrame(tick);
  }
}
boot().catch(error=>{window.renderError=error.stack||String(error);console.error(error);});
