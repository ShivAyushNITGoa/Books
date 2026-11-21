import * as T from '../../engine/vendor/three.module.js';
import {buildWorld} from './world.js';
import {stateAt, DURATION, FPS} from './direction/choreography.js';
import {setCamera, focusPoints, projectedEnvelope} from './direction/camera.js';
import {heightAt} from './environment/geography.js';
import {drawOverlay} from './ui/overlay.js';
import {clamp} from './direction/math.js';
import {personBounds, overlap} from '../black-box-journey/camera-rig.js';

const canvas = document.querySelector('#film'), ctx = canvas.getContext('2d', {alpha: false});
const query = new URLSearchParams(location.search);
const WIDTH = Number(query.get('width') || 720), HEIGHT = WIDTH * 16 / 9;
canvas.width = WIDTH; canvas.height = HEIGHT;
const scene = new T.Scene(), camera = new T.PerspectiveCamera(46, WIDTH / HEIGHT, 0.15, 13000);
let renderer, world, narration, time = 0, cc = query.get('captions') !== 'off', playing = false;

function telemetry(state, underwater) {
  const bounds = projectedEnvelope(focusPoints(state), camera);
  const target = camera.position.clone().addScaledVector(camera.getWorldDirection(new T.Vector3()), camera.position.distanceTo(new T.Vector3(...state.aim)));
  const shipOffset = camera.position.clone().sub(new T.Vector3(...state.ship));
  return {
    time: state.t, chapter: state.chapter, kind: state.focusKind, settled: state.settled,
    camera: camera.position.toArray(), target: target.toArray(), authoredTarget: state.aim,
    rotation: camera.quaternion.toArray(), focus: state.focus, bounds,
    ship: state.ship, shipBearing: Math.atan2(shipOffset.x, shipOffset.z),
    starboardSide: shipOffset.x > 0,
    terrainClearance: camera.position.y - heightAt(camera.position.x, camera.position.z),
    underwater, continuousTake: true, orbitController: false,
    people: world.people.map(p => ({id: p.id,
      distanceToFocus: Math.hypot(p.x - state.focus[0], p.y - state.focus[1], p.z - state.focus[2]),
      silhouetteOverlap: overlap(bounds, personBounds({...p, bottom: p.y + 0.02, top: p.y + 2.65}, camera)),
    })),
    drawCalls: renderer.info.render.calls, triangles: renderer.info.render.triangles,
  };
}
function render(t) {
  time = clamp(t, 0, DURATION);
  const state = stateAt(time); setCamera(camera, state);
  const underwater = world.update(state, camera);
  renderer.render(scene, camera); ctx.drawImage(renderer.domElement, 0, 0, WIDTH, HEIGHT);
  drawOverlay(ctx, WIDTH, state, camera, narration, cc);
  window.frameInfo = telemetry(state, underwater);
  document.querySelector('#seek').value = time;
  document.querySelector('#clock').textContent = `${Math.floor(time / 60)}:${String(Math.floor(time % 60)).padStart(2, '0')}`;
}

function auditCamera() {
  const c = new T.PerspectiveCamera(46, WIDTH / HEIGHT, 0.15, 13000);
  let previous, maxAngle = 0, maxStep = 0, minimumTerrain = Infinity;
  const issues = [], settledBounds = [], bearings = {dock: [], underway: [], ending: []};
  for (let frame = 0; frame < Math.round(DURATION * FPS); frame++) {
    const state = stateAt(frame / FPS); setCamera(c, state);
    const p = c.position, clearance = p.y - heightAt(p.x, p.z);
    minimumTerrain = Math.min(minimumTerrain, clearance);
    if (clearance < 0.7) issues.push({time: state.t, problem: 'terrain', clearance});
    if (p.y > -14 && p.y < 7 && state.t < 24) {
      if (Math.abs(p.x + 420) > 38 && Math.abs(p.x + 420) < 41 && Math.abs(p.z) < 102) issues.push({time: state.t, problem: 'dock side wall'});
      if (Math.abs(p.z + 100) < 1 && Math.abs(p.x + 420) < 39) issues.push({time: state.t, problem: 'closed dock gate'});
    }
    if (p.z < -650 && p.z > -750 && p.y > 6 && p.y < 30 && Math.abs(p.x + 200) > 28.5 && Math.abs(p.x + 200) < 30) issues.push({time: state.t, problem: 'laboratory side wall'});
    if (previous) {
      maxAngle = Math.max(maxAngle, c.quaternion.angleTo(previous.quaternion) * 180 / Math.PI);
      maxStep = Math.max(maxStep, c.position.distanceTo(previous.position));
    }
    previous = c.clone();
    if (state.settled) {
      const b = projectedEnvelope(focusPoints(state), c);
      if (!b.inFront || b.min[0] < -0.94 || b.max[0] > 0.94 || b.min[1] < -0.59 || b.max[1] > 0.80) {
        settledBounds.push({time: state.t, kind: state.focusKind, bounds: b});
      }
    }
    if (state.t < 23) bearings.dock.push(Math.atan2(p.x + 420, p.z));
    if (state.t > 29 && state.t < 104) bearings.underway.push(Math.atan2(p.x - state.ship[0], p.z - state.ship[2]));
    if (state.t > 187) bearings.ending.push(Math.atan2(p.x - state.ship[0], p.z - state.ship[2]));
    // Full-size hull half-beam <=12.5 m; actual camera remains outside it.
    if ((state.t > 29 && state.t < 104 || state.t > 187) && p.x - state.ship[0] < 17) issues.push({time: state.t, problem: 'ship hull'});
    if (p.x > -229 && p.x < -171 && p.z < -650 && p.z > -750) {
      if (p.y < 6.5 || p.y > 29.5) issues.push({time: state.t, problem: 'laboratory floor/roof'});
    }
    for (const plane of [-650, -750]) {
      if (Math.abs(p.z - plane) < 0.6 && p.x > -230 && p.x < -170 && (Math.abs(p.x + 200) > 18.5 || p.y > 25.5)) issues.push({time: state.t, problem: 'laboratory doorway'});
    }
  }
  const bearingRanges = Object.fromEntries(Object.entries(bearings).map(([key, values]) => [key, (Math.max(...values) - Math.min(...values)) * 180 / Math.PI]));
  return {frames: Math.round(DURATION * FPS), issues, settledBounds, maximumOrientationStep: maxAngle,
    maximumPositionStep: maxStep, minimumTerrainClearance: minimumTerrain, bearingRanges,
    repeatedOrbits: Object.values(bearingRanges).some(range => range > 90)};
}

// QA-only: compare ray-confirmed slab pixels across moving-camera lab frames.
// Scene depth, not an arbitrary screen rectangle, determines which pixels are
// genuinely unobstructed floor. This hook is never run during frame export.
function sampleLabFloor() {
  const ray=new T.Raycaster(),target=new T.Vector3();
  const roots=[...world.staticRoots,world.geography.terrain,world.tankModel.root];
  const samples=[];
  for(const x of [-228,-226,-224,-192,-190,-188])for(let z=-745;z<=-655;z+=3){
    target.set(x,world.stats.labFloorY,z);
    const p=target.clone().project(camera);
    if(p.z>=1||Math.abs(p.x)>.9||p.y>.3||p.y<-.55)continue;
    const px=Math.round((p.x+1)*WIDTH/2),py=Math.round((1-p.y)*HEIGHT/2);
    // Test the raster pixel footprint, not just the projected world point.
    // At grazing angles one pixel of rounding can land on a wall or machine.
    let clear=true;
    for(const dx of [-1,0,1])for(const dy of [-1,0,1]){
      ray.setFromCamera(new T.Vector2((px+dx+.5)/WIDTH*2-1,1-(py+dy+.5)/HEIGHT*2),camera);
      ray.far=1000;
      const hit=ray.intersectObjects(roots,true)[0];
      if(!hit||Math.abs(hit.point.y-world.stats.labFloorY)>.04||hit.face.normal.y<.9)clear=false;
    }
    if(!clear)continue;
    const [r,g,b]=ctx.getImageData(px,py,1,1).data;
    samples.push({point:[x,world.stats.labFloorY,z],screen:[px,py],pixel:[r,g,b],slabColor:r>80&&r>=g*.97&&r>b*1.05});
  }
  return samples;
}

function playback() {
  const audio = document.querySelector('#vo'), button = document.querySelector('#play');
  button.onclick = async () => {
    if (playing) { audio.pause(); playing = false; button.textContent = 'Play'; return; }
    if (time > DURATION - 0.1) time = 0;
    audio.currentTime = time; await audio.play(); playing = true; button.textContent = 'Pause'; requestAnimationFrame(tick);
  };
  document.querySelector('#seek').oninput = event => { time = Number(event.target.value); audio.currentTime = time; render(time); };
  document.querySelector('#cc').onclick = () => { cc = !cc; render(time); };
  function tick() {
    if (!playing) return; render(audio.currentTime);
    if (audio.ended || time >= DURATION - 0.05) { playing = false; audio.pause(); button.textContent = 'Play'; }
    else requestAnimationFrame(tick);
  }
}

async function init() {
  try {
    await document.fonts.load('31px Caption'); narration = await (await fetch('narration.json')).json();
    renderer = new T.WebGLRenderer({antialias: true, alpha: false, preserveDrawingBuffer: true, powerPreference: 'high-performance'});
    renderer.setSize(WIDTH, HEIGHT, false); renderer.setPixelRatio(1);
    renderer.outputColorSpace = T.SRGBColorSpace; renderer.toneMapping = T.ACESFilmicToneMapping; renderer.toneMappingExposure = 1.02;
    world = buildWorld(scene);
    window.setT = render; window.setCaptions = enabled => { cc = enabled; render(time); };
    window.auditCamera = auditCamera; window.worldStats = world.stats; window.filmDuration = DURATION;
    window.sampleLabFloor = sampleLabFloor;
    render(0); playback(); window.renderSafe = true;
  } catch (error) { window.renderError = error.stack; console.error(error); }
}
init();
