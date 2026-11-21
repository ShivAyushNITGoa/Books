import * as T from '../../../engine/vendor/three.module.js';
import {
  terrainHeight, biomeAt, hash2, noise2, infrastructureExclusion,
  smoothstep, coastDistance, riverDistance,
} from './field.js';
import {roadDistance} from './infrastructure.js';
import {KEYS, FOCUS, stateAt, SITES} from '../choreography.js';
import {pointSegmentDistance} from '../direction/curve.js';

export const SPECIES = Object.freeze([
  {name: 'Scots pine', type: 'conifer', color: '#355f47', scale: 1.12},
  {name: 'Mountain fir', type: 'fir', color: '#416b4a', scale: 1.25},
  {name: 'Broadleaf oak', type: 'broadleaf', color: '#617c43', scale: 1.0},
  {name: 'Silver birch', type: 'birch', color: '#94a35b', scale: 0.92},
  {name: 'Coastal acacia', type: 'acacia', color: '#627a46', scale: 0.85},
  {name: 'Young sapling', type: 'sapling', color: '#708e48', scale: 0.52},
  {name: 'Weathered snag', type: 'snag', color: '#7a8063', scale: 0.78},
]);

const dummy = new T.Object3D();
const tint = new T.Color();
const up = new T.Vector3(0, 1, 0);

function mergeParts(parts) {
  const positions = [];
  const normals = [];
  for (const {geometry, scale, position} of parts) {
    const g = geometry.index ? geometry.toNonIndexed() : geometry.clone();
    g.scale(...scale);
    g.translate(...position);
    positions.push(...g.attributes.position.array);
    normals.push(...g.attributes.normal.array);
    g.dispose();
  }
  const result = new T.BufferGeometry();
  result.setAttribute('position', new T.Float32BufferAttribute(positions, 3));
  result.setAttribute('normal', new T.Float32BufferAttribute(normals, 3));
  result.computeBoundingSphere();
  return result;
}

function crownGeometry(type) {
  const cone = new T.ConeGeometry(1, 1, 6, 1);
  const leaf = new T.IcosahedronGeometry(1, 0);
  const parts = [];
  function add(geometry, scale, position) {
    parts.push({geometry, scale, position});
  }
  if (type === 'conifer' || type === 'fir') {
    const layers = type === 'fir' ? 3 : 2;
    for (let i = 0; i < layers; i++) {
      add(cone, [0.22 - i * 0.035, 0.48, 0.22 - i * 0.035], [0, 0.55 + i * 0.13, 0]);
    }
  } else if (type === 'acacia') {
    add(leaf, [0.40, 0.17, 0.32], [-0.08, 0.75, 0]);
    add(leaf, [0.26, 0.15, 0.26], [0.19, 0.80, -0.02]);
  } else if (type === 'birch') {
    add(leaf, [0.18, 0.32, 0.18], [-0.04, 0.65, 0]);
    add(leaf, [0.15, 0.22, 0.15], [0.08, 0.86, 0.04]);
  } else if (type !== 'snag') {
    add(leaf, [0.29, 0.29, 0.26], [-0.10, 0.65, 0.02]);
    add(leaf, [0.26, 0.28, 0.29], [0.13, 0.72, -0.05]);
    add(leaf, [0.23, 0.23, 0.22], [0.00, 0.87, 0.02]);
  }
  cone.dispose();
  leaf.dispose();
  return parts.length ? mergeParts(parts) : null;
}

/**
 * Sample the ENTIRE regional forest, not a circular ring around a story prop.
 * Coherent moisture/altitude fields vary species and spacing continuously.
 * Small local exclusions keep the real camera corridor and hero sightlines
 * clear; those exclusions do not remove the surrounding hillsides or canopy.
 */
function cameraConstraints() {
  const travel = [];
  const sightlines = [];
  for (let t = 19.8; t < 54; t += 0.10) {
    const a = stateAt(t).eye;
    const b = stateAt(t + 0.1).eye;
    if (a[1] < 90 || b[1] < 90) travel.push([a, b]);
  }
  for (const [id, a, b] of FOCUS) {
    if (id !== 'forest') continue;
    for (let t = a; t < b; t += 0.10) {
      sightlines.push([stateAt(t).eye, SITES[id].p]);
    }
  }
  return {travel, sightlines};
}

function unsafeTree(x, y, z, height, constraints) {
  const trunk = [x, y + height * 0.5, z];
  for (const [a, b] of constraints.travel) {
    if (Math.abs(x - a[0]) > 90 && Math.abs(x - b[0]) > 90) continue;
    if (pointSegmentDistance(trunk, a, b) < height * 0.48 + 2.8) return true;
  }
  for (const [a, b] of constraints.sightlines) {
    if (pointSegmentDistance([x, y + height * 0.65, z], a, b) < height * 0.38 + 1.8) return true;
  }
  const heroDistance = Math.hypot(x - 420, z + 180);
  return heroDistance < 8.8;
}

export function populationPlan() {
  const trees = [];
  const constraints = cameraConstraints();
  const counts = new Array(SPECIES.length).fill(0);
  const cell = 18;
  for (let iz = -110; iz <= 88; iz++) {
    for (let ix = -125; ix <= 61; ix++) {
      const x = ix * cell + (hash2(ix, iz, 41) - 0.5) * cell * 0.85;
      const z = iz * cell + (hash2(ix, iz, 42) - 0.5) * cell * 0.85;
      const b = biomeAt(x, z);
      if (b.height < 2 || b.coast > -22 || b.height > 255) continue;
      if (infrastructureExclusion(x, z) > 0.08 || roadDistance(x, z) < 9) continue;
      const patch = noise2(x / 105, z / 105, 613);
      const density = b.forest * (0.58 + patch * 0.32) + (1 - b.forest) * 0.07;
      if (hash2(ix, iz, 43) > density) continue;
      const speciesRandom = hash2(ix, iz, 44);
      let species;
      if (b.coast > -150) species = speciesRandom < 0.7 ? 4 : 2;
      else if (b.height > 95) species = speciesRandom < 0.55 ? 1 : 0;
      else species = speciesRandom < 0.24 ? 0 : speciesRandom < 0.49 ? 2
        : speciesRandom < 0.73 ? 3 : speciesRandom < 0.88 ? 1 : speciesRandom < 0.97 ? 5 : 6;
      const height = (9 + hash2(ix, iz, 45) * 12) * SPECIES[species].scale;
      if (unsafeTree(x, b.height, z, height, constraints)) continue;
      trees.push({x, y: b.height, z, height, species, yaw: hash2(ix, iz, 46) * Math.PI * 2});
      counts[species]++;
    }
  }
  return {trees, counts, cell};
}

function installInstances(scene, geometry, material, trees, scale, offset = 0) {
  if (!geometry || !trees.length) return null;
  const mesh = new T.InstancedMesh(geometry, material, trees.length);
  mesh.name = material.name;
  for (let i = 0; i < trees.length; i++) {
    const tree = trees[i];
    dummy.position.set(tree.x, tree.y + offset * tree.height, tree.z);
    dummy.rotation.set(0, tree.yaw, 0);
    dummy.scale.set(tree.height * scale[0], tree.height * scale[1], tree.height * scale[2]);
    dummy.updateMatrix();
    mesh.setMatrixAt(i, dummy.matrix);
    tint.setScalar(0.85 + hash2(i, tree.species, 819) * 0.3);
    mesh.setColorAt(i, tint);
  }
  mesh.instanceMatrix.needsUpdate = true;
  mesh.computeBoundingSphere();
  scene.add(mesh);
  return mesh;
}

export function buildVegetation(scene) {
  const plan = populationPlan();
  const meshes = [];
  const trunkGeometry = new T.CylinderGeometry(0.018, 0.029, 0.65, 5, 1);
  for (let species = 0; species < SPECIES.length; species++) {
    const definition = SPECIES[species];
    const trees = plan.trees.filter(tree => tree.species === species);
    const bark = new T.MeshPhongMaterial({
      color: definition.type === 'birch' ? '#b8b8a0' : '#776746', shininess: 1,
    });
    bark.name = `${definition.name} trunks`;
    const foliage = new T.MeshPhongMaterial({color: definition.color, shininess: 1, flatShading: true});
    foliage.name = `${definition.name} crowns`;
    // Spatial batches let the renderer reject whole offscreen forest cells.
    // A single enormous InstancedMesh needlessly transformed every regional
    // tree even when the camera was inside the factory or below the sea.
    const cells = new Map();
    for (const tree of trees) {
      const key = `${Math.floor(tree.x / 512)}:${Math.floor(tree.z / 512)}`;
      if (!cells.has(key)) cells.set(key, []);
      cells.get(key).push(tree);
    }
    const crown = crownGeometry(definition.type);
    for (const cellTrees of cells.values()) {
      meshes.push(installInstances(scene, trunkGeometry, bark, cellTrees, [1, 1, 1], 0.325));
      if (crown) meshes.push(installInstances(scene, crown, foliage, cellTrees, [1, 1, 1]));
    }
  }

  // Understorey is a distinct population: bushes/reeds/ferns, not tiny pines.
  const shrubGeometry = new T.IcosahedronGeometry(1, 0);
  const shrubs = [];
  for (let i = 0; i < 2100; i++) {
    const x = -100 + hash2(i, 1, 98) * 1100;
    const z = -430 + hash2(i, 2, 98) * 1550;
    const y = terrainHeight(x, z);
    if (y < 1.5 || infrastructureExclusion(x, z) > 0.05 || roadDistance(x, z) < 7) continue;
    if (Math.hypot(x - 420, z + 180) < 5 || Math.hypot(x - 1180, z - 320) < 5) continue;
    shrubs.push({x, y, z, height: 0.7 + hash2(i, 3, 98) * 1.5, species: 2, yaw: i});
  }
  const shrubMaterial = new T.MeshPhongMaterial({color: '#6b7d44', flatShading: true});
  const shrubMesh = installInstances(scene, shrubGeometry, shrubMaterial, shrubs, [1.1, 0.6, 0.9], 0.30);
  meshes.push(shrubMesh);

  return {
    meshes: meshes.filter(Boolean),
    trees: plan.trees,
    stats: {
      trees: plan.trees.length,
      species: SPECIES.map((definition, i) => ({name: definition.name, count: plan.counts[i]})),
      shrubs: shrubs.length,
      footprintMeters: {width: 3348, depth: 3564},
      spatialInstanceBatches: meshes.filter(Boolean).length,
      distribution: 'coherent biomes across the entire connected region; no story-centred tree ring',
    },
  };
}
