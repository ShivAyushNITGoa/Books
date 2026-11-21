import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import * as T from '../engine/vendor/three.module.js';
import {
  SITES, KEYS, PEOPLE, DURATION, FPS, stateAt, clearance, JOURNEYS,
} from '../projects/black-box-journey/choreography.js';
import {
  terrainHeight, terrainNormal, coastX, riverZ, hash2, biomeAt, REGION,
} from '../projects/black-box-journey/environment/field.js';
import {populationPlan, SPECIES} from '../projects/black-box-journey/environment/vegetation.js';
import {
  fitCamera, corners, RECORDER_EXTENTS, subjectMatrix, projectedBounds,
  personBounds, overlap,
} from '../projects/black-box-journey/camera-rig.js';

const camera = () => new T.PerspectiveCamera(46, 9 / 16, 0.12, 13000);
const samples = Array.from({length: Math.round(DURATION * FPS)}, (_, frame) => {
  const state = stateAt(frame / FPS);
  const view = camera();
  fitCamera(view, state);
  return {state, view};
});

function distance(a, b) {
  return Math.hypot(...a.map((value, index) => value - b[index]));
}

test('journey preserves supplied words, original English voice timing and SRT', () => {
  for (const file of ['script.txt', 'narration.json', 'delivery/captions.srt']) {
    assert.deepEqual(
      readFileSync(new URL('../projects/black-box-journey/' + file, import.meta.url)),
      readFileSync(new URL('../projects/black-box-locations/' + file, import.meta.url)),
    );
  }
  assert.equal(samples.length, 1561);
  assert.equal(Object.values(SITES).filter(site => site.indoors).length, 1);
  const sites = Object.values(SITES);
  for (let i = 0; i < sites.length; i++) {
    for (let j = 0; j < i; j++) assert.ok(distance(sites[i].p, sites[j].p) > 400);
  }
});

test('shared heightfield is finite, smoothly continuous and grounded at every site', () => {
  assert.ok(REGION.maxX - REGION.minX >= 8000);
  assert.ok(REGION.maxZ - REGION.minZ >= 8000);
  for (let z = -1600; z <= 2200; z += 63) {
    for (let x = -2200; x <= 2400; x += 71) {
      const h = terrainHeight(x, z);
      assert.ok(Number.isFinite(h));
      assert.ok(Math.abs(terrainHeight(x + 0.01, z) - h) < 0.08, `X seam at ${x}/${z}`);
      assert.ok(Math.abs(terrainHeight(x, z + 0.01) - h) < 0.08, `Z seam at ${x}/${z}`);
      assert.ok(Math.abs(Math.hypot(...terrainNormal(x, z)) - 1) < 1e-8);
    }
  }
  for (const id of ['factory', 'forest', 'ocean', 'airport']) {
    const site = SITES[id];
    assert.ok(Math.abs(terrainHeight(site.p[0], site.p[2]) - site.ground) < 1e-8, `${id} floats`);
  }
});

test('coast winds naturally and joins sea; river stays open to its estuary', () => {
  const shore = [];
  for (let z = -1300; z <= 1400; z += 70) {
    const x = coastX(z);
    shore.push(x);
    assert.ok(Math.abs(terrainHeight(x, z)) < 1, `Disconnected sea level at ${z}`);
    assert.ok(terrainHeight(x + 600, z) < -30, `No bathymetry at ${z}`);
  }
  assert.ok(Math.max(...shore) - Math.min(...shore) > 150, 'Rectangular coastline');
  for (let x = -850; x <= 740; x += 31) {
    const level = 1 + Math.max(0, 580 - x) * 0.0012;
    assert.ok(terrainHeight(x, riverZ(x)) < level - 0.8, `River buried by terrain at ${x}`);
  }
});

test('regional mixed forest occupies many neighbouring cells, not a crash-site ring', () => {
  const plan = populationPlan();
  assert.ok(plan.trees.length > 10000);
  assert.equal(SPECIES.length, 7);
  assert.ok(plan.counts.every(count => count > 100), 'Decorative species not actually populated');
  const occupied = new Set(plan.trees.map(tree => `${Math.floor(tree.x / 250)}:${Math.floor(tree.z / 250)}`));
  assert.ok(occupied.size > 130, 'Forest confined to a small exhibit area');
  assert.ok(plan.trees.filter(tree => Math.hypot(tree.x - 420, tree.z + 180) > 600).length > 7000);
  const xs = plan.trees.map(tree => tree.x);
  const zs = plan.trees.map(tree => tree.z);
  assert.ok(Math.max(...xs) - Math.min(...xs) > 2500);
  assert.ok(Math.max(...zs) - Math.min(...zs) > 2500);
  for (const tree of plan.trees.filter((_, i) => i % 23 === 0)) {
    assert.equal(tree.y, terrainHeight(tree.x, tree.z));
    assert.ok(biomeAt(tree.x, tree.z).coast < -20);
  }
  assert.equal(hash2(-10, 4, 77), hash2(-10, 4, 77));
});

test('camera position and authored aim are C1 at every waypoint', () => {
  const epsilon = 1e-5;
  for (const [time] of KEYS.slice(1, -1)) {
    for (const field of ['eye', 'aim']) {
      const a = stateAt(time - epsilon)[field];
      const b = stateAt(time)[field];
      const c = stateAt(time + epsilon)[field];
      const left = a.map((v, i) => (b[i] - v) / epsilon);
      const right = b.map((v, i) => (c[i] - v) / epsilon);
      assert.ok(distance(left, right) < 0.3, `${field} velocity kink at ${time}`);
    }
  }
});

test('all 1561 actual camera poses avoid terrain, cuts, orientation flips and excessive bank', () => {
  let previous;
  let minClearance = Infinity;
  let maxAngle = 0;
  let maxStep = 0;
  for (const {state, view} of samples) {
    const p = view.position;
    const ground = terrainHeight(p.x, p.z);
    minClearance = Math.min(minClearance, p.y - ground);
    if (previous) {
      maxAngle = Math.max(maxAngle, view.quaternion.angleTo(previous.quaternion) * 180 / Math.PI);
      maxStep = Math.max(maxStep, p.distanceTo(previous.position));
    }
    const right = new T.Vector3().setFromMatrixColumn(view.matrixWorld, 0);
    assert.ok(Math.abs(Math.asin(right.y) * 180 / Math.PI) < 7, `Horizon rolls at ${state.t}`);
    previous = view;
  }
  assert.ok(minClearance > 2.5, `Camera enters terrain: ${minClearance}`);
  assert.ok(maxAngle < 10, `Cut-like rotation: ${maxAngle} degrees/frame`);
  assert.ok(maxStep < 30, `Position jump: ${maxStep}`);
});

test('full-focus framing is safe and every frame keeps people out of the recorder silhouette', () => {
  const xs = [];
  for (const {state, view} of samples) {
    const box = projectedBounds(corners(RECORDER_EXTENTS, subjectMatrix(state)), view);
    if (state.focus > 0.999) {
      xs.push(new T.Vector3(...state.hero).project(view).x);
      assert.ok(box.min[0] >= -0.842 && box.max[0] <= 0.842, `Horizontal crop ${state.t}`);
      assert.ok(box.min[1] >= -0.552 && box.max[1] <= 0.752, `Caption crop ${state.t}`);
    }
    for (const person of PEOPLE) {
      assert.ok(clearance(person.site, person) > 1.2);
      if (person.site !== state.site) continue;
      const bounds = personBounds({...person, bottom: person.y + 0.02, top: person.y + 2.65}, view);
      assert.ok(overlap(box, bounds) < 0.0001, `${person.id} intersects at ${state.t}`);
    }
  }
  assert.ok(Math.min(...xs) < -0.3 && Math.max(...xs) > 0.3);
});

test('camera leaves through real factory door and journeys expose meaningful horizontal travel', () => {
  for (const {state, view} of samples.filter(({state}) => state.t < 22)) {
    const [x, y, z] = view.position.toArray();
    if (Math.abs(x) < 18 && z > -13 && z < 13) assert.ok(y < 17.6);
    if (z > 12.7 && z < 13.3) assert.ok(Math.abs(x) < 7.8 && y < 15.8);
  }
  for (const journey of JOURNEYS) {
    const travel = samples.filter(({state}) => state.t >= journey.start && state.t < journey.end);
    const wide = travel.filter(({view}) => {
      const dir = view.getWorldDirection(new T.Vector3());
      return Math.abs(dir.y) < 0.65 && view.position.y > 5;
    });
    assert.ok(wide.length >= 12, `${journey.name} is only a downward whip`);
    assert.ok(distance(travel[0].view.position.toArray(), travel.at(-1).view.position.toArray()) > 300);
  }
});
