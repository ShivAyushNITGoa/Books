import * as T from '../../engine/vendor/three.module.js';
import {buildWorld} from './world.js';
import {stateAt, DURATION, FPS, SITES, clearance, clamp} from './choreography.js';
import {
  fitCamera, subjectMatrix, corners, RECORDER_EXTENTS,
  projectedBounds, personBounds, overlap,
} from './camera-rig.js';
import {terrainHeight, biomeAt} from './environment/field.js';
import {drawOverlay} from './ui/overlay.js';
import {animateWorld} from './direction/animation.js';
import {pointSegmentDistance} from './direction/curve.js';

const canvas = document.querySelector('#film');
const context = canvas.getContext('2d', {alpha: false});
const query = new URLSearchParams(location.search);
const WIDTH = Number(query.get('width') || 720);
const HEIGHT = WIDTH * 16 / 9;
canvas.width = WIDTH;
canvas.height = HEIGHT;
let world;
let renderer;
let narration;
let currentTime = 0;
let captionsEnabled = query.get('captions') !== 'off';
let playing = false;
const scene = new T.Scene();
const camera = new T.PerspectiveCamera(46, WIDTH / HEIGHT, 0.12, 13000);
const targetProbe = new T.Vector3();

function frameTelemetry(state, underwater) {
  const subjectBounds = projectedBounds(corners(RECORDER_EXTENTS, subjectMatrix(state)), camera);
  const heroNdc = new T.Vector3(...state.hero).project(camera);
  const cast = world.people.map(person => ({
    id: person.id,
    clearance: clearance(state.site, person),
    screenOverlap: person.site === state.site
      ? overlap(subjectBounds, personBounds({...person, bottom: person.y + 0.02, top: person.y + 2.65}, camera))
      : 0,
  }));
  const ground = terrainHeight(camera.position.x, camera.position.z);
  const biome = biomeAt(camera.position.x, camera.position.z);
  return {
    time: state.t,
    chapter: state.chapter,
    site: state.site,
    locationTitle: state.journey ? state.journey.name : SITES[state.site].name,
    focus: state.focus,
    journey: state.journey?.name || null,
    camera: camera.position.toArray(),
    target: camera.position.clone().addScaledVector(camera.getWorldDirection(new T.Vector3()), camera.position.distanceTo(new T.Vector3(...state.aim))).toArray(),
    authoredTarget: state.aim,
    rotation: camera.quaternion.toArray(),
    hero: state.hero,
    heroNdc: heroNdc.toArray(),
    screenBounds: subjectBounds,
    peopleClearance: cast,
    underwater,
    terrainHeight: ground,
    terrainClearance: camera.position.y - ground,
    coastDistance: biome.coast,
    forestWeight: biome.forest,
    continuousTake: true,
    motionBlending: false,
    drawCalls: renderer.info.render.calls,
    triangles: renderer.info.render.triangles,
  };
}

function render(time) {
  currentTime = clamp(time, 0, DURATION);
  const state = stateAt(currentTime);
  fitCamera(camera, state);
  const underwater = world.atmosphere.update(camera, currentTime);
  world.waterSystem.update(currentTime, camera, underwater);
  animateWorld(world, state, camera);
  renderer.render(scene, camera);
  context.drawImage(renderer.domElement, 0, 0, WIDTH, HEIGHT);
  // Exactly one temporal sample. The old travel ghosting made land boundaries
  // and shorelines harder to read; geographic movement is now shown directly.
  drawOverlay(context, WIDTH, state, camera, narration.captions, captionsEnabled);
  window.frameInfo = frameTelemetry(state, underwater);
  document.querySelector('#seek').value = currentTime;
  document.querySelector('#clock').textContent = `${Math.floor(currentTime / 60)}:${String(Math.floor(currentTime % 60)).padStart(2, '0')}`;
}

/**
 * Real geometry raycasts across all focus frames, including the single shared
 * terrain. Regional vegetation uses the same saved population, with explicit
 * root/crown segment tests in addition to camera-corridor planting exclusion.
 * During travel the hero is intentionally offscreen; clearance is still tested.
 */
function auditStaticSightlines() {
  const auditCamera = new T.PerspectiveCamera(46, WIDTH / HEIGHT, 0.12, 13000);
  const ray = new T.Raycaster();
  const bad = [];
  const solids = [world.terrain.mesh];
  for (const root of world.roots) {
    root.traverse(object => {
      if (object.isMesh && !object.isInstancedMesh && !object.material.transparent) solids.push(object);
    });
  }
  const nearbyTrees = Object.fromEntries(Object.entries(SITES).map(([id, site]) => [id,
    world.vegetation.trees.filter(tree => Math.hypot(tree.x - site.p[0], tree.z - site.p[2]) < 80),
  ]));
  scene.updateMatrixWorld(true);
  for (let f = 0; f < Math.round(DURATION * FPS); f++) {
    const state = stateAt(f / FPS);
    if (state.focus < 0.999) continue;
    fitCamera(auditCamera, state);
    targetProbe.set(...state.hero);
    const direction = targetProbe.clone().sub(auditCamera.position);
    ray.set(auditCamera.position, direction.clone().normalize());
    ray.near = 0.12;
    ray.far = direction.length() - 0.3;
    const hit = ray.intersectObjects(solids, false)[0];
    if (hit) bad.push({
      time: f / FPS,
      site: state.site,
      point: hit.point.toArray(),
      object: hit.object.name || hit.object.parent?.name || 'static geometry',
      color: hit.object.material.color?.getHexString(),
    });
    for (const tree of nearbyTrees[state.site]) {
      const centre = [tree.x, tree.y + tree.height * 0.7, tree.z];
      const distance = pointSegmentDistance(centre, auditCamera.position.toArray(), state.hero);
      if (distance < tree.height * 0.35) bad.push({
        time: f / FPS, site: state.site, object: 'conservative tree crown', point: centre,
      });
    }
  }
  return bad;
}

function auditJourney() {
  const auditCamera = new T.PerspectiveCamera(46, WIDTH / HEIGHT, 0.12, 13000);
  const result = {minimumTerrainClearance: Infinity, maximumCameraStep: 0, samples: [], collisions: []};
  let previous;
  for (let f = 0; f < Math.round(DURATION * FPS); f++) {
    const state = stateAt(f / FPS);
    fitCamera(auditCamera, state);
    const p = auditCamera.position;
    const ground = terrainHeight(p.x, p.z);
    result.minimumTerrainClearance = Math.min(result.minimumTerrainClearance, p.y - ground);
    if (p.y - ground < 0.8) result.collisions.push({time: f / FPS, kind: 'terrain', clearance: p.y - ground});
    if (previous) result.maximumCameraStep = Math.max(result.maximumCameraStep, p.distanceTo(previous));
    previous = p.clone();
    if (state.journey && f % 8 === 0) {
      result.samples.push({time: f / FPS, eye: p.toArray(), coastDistance: biomeAt(p.x, p.z).coast});
    }
  }
  return result;
}

function attachPlayback() {
  const audio = document.querySelector('#vo');
  const playButton = document.querySelector('#play');
  playButton.onclick = async () => {
    if (playing) {
      playing = false;
      audio.pause();
      playButton.textContent = 'Play';
      return;
    }
    if (currentTime > DURATION - 0.1) currentTime = 0;
    audio.currentTime = currentTime;
    await audio.play();
    playing = true;
    playButton.textContent = 'Pause';
    requestAnimationFrame(tick);
  };
  document.querySelector('#seek').oninput = event => {
    audio.currentTime = Number(event.target.value);
    render(Number(event.target.value));
  };
  document.querySelector('#cc').onclick = () => {
    captionsEnabled = !captionsEnabled;
    render(currentTime);
  };
  function tick() {
    if (!playing) return;
    render(audio.currentTime);
    if (audio.ended || currentTime > DURATION - 0.05) {
      playing = false;
      audio.pause();
      playButton.textContent = 'Play';
    } else requestAnimationFrame(tick);
  }
}

async function init() {
  try {
    await document.fonts.load('31px Caption');
    narration = await (await fetch('narration.json')).json();
    renderer = new T.WebGLRenderer({
      antialias: true,
      alpha: false,
      preserveDrawingBuffer: true,
      powerPreference: 'high-performance',
    });
    renderer.setSize(WIDTH, HEIGHT, false);
    renderer.setPixelRatio(1);
    renderer.outputColorSpace = T.SRGBColorSpace;
    renderer.toneMapping = T.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 0.98;
    world = buildWorld(scene);
    window.setT = render;
    window.setCaptions = enabled => {
      captionsEnabled = enabled;
      render(currentTime);
    };
    window.filmDuration = DURATION;
    window.worldStats = world.stats;
    window.auditStaticSightlines = auditStaticSightlines;
    window.auditJourney = auditJourney;
    render(0);
    attachPlayback();
    window.renderSafe = true;
  } catch (error) {
    window.renderError = error.stack;
    console.error(error);
  }
}

init();
