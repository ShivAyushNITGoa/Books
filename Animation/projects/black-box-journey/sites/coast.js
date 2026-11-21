import * as T from '../../../engine/vendor/three.module.js';
import {terrainHeight, coastX, hash2} from '../environment/field.js';
import {workbench} from './factory.js';

function rescueBoat(scene, k, x, z, yaw) {
  const {box, rod, label, M, batchStatic} = k;
  const group = new T.Group();
  group.position.set(x, 0, z);
  group.rotation.y = yaw;
  scene.add(group);
  box(group, 0, 0.6, 0, 11, 1.8, 4, M.white);
  box(group, 0, 1.9, 0, 6, 1, 3.4, M.orange);
  box(group, -1, 3.1, 0, 4, 1.5, 3, M.cream);
  for (const sign of [-1, 1]) {
    box(group, -1, 3.2, sign * 1.55, 2.8, 0.75, 0.035, M.teal);
    rod(group, [-4.5, 2, sign * 1.8], [4.5, 2, sign * 1.8], 0.04, M.steel);
  }
  rod(group, [1, 2, 0], [1, 7, 0], 0.07, M.steel);
  label(group, 'SEARCH + RESCUE', 2.5, 1.9, 1.73, 4, 0.55);
  label(group, 'SEARCH + RESCUE', 2.5, 1.9, -1.73, 4, 0.55, Math.PI);
  batchStatic(group);
  return group;
}

function buildPier(scene, k) {
  const {box, cyl, rod, label, M, batchStatic} = k;
  const group = new T.Group();
  group.position.set(835, 2.5, 760);
  group.name = 'Recovery pier physically joined to coastal base';
  scene.add(group);
  box(group, -10, -0.12, 0, 40, 0.24, 14, M.wood);
  for (const x of [-25, -15, -5, 5]) {
    for (const z of [-5.5, 5.5]) {
      const bottom = terrainHeight(835 + x, 760 + z) - 2.5;
      cyl(group, x, bottom / 2, z, 0.25, -bottom, M.wood);
    }
  }
  for (let x = -28; x <= 8; x += 0.42) {
    box(group, x, 0.015, 0, 0.025, 0.03, 14, M.navy);
  }
  workbench(group, 0, 0, k, 3.7);
  // Ramp endpoints meet the mainland level and pier level exactly.
  const a = new T.Vector3(790, 8.0, 760);
  const b = new T.Vector3(815, 2.5, 760);
  const midpoint = a.clone().add(b).multiplyScalar(0.5).sub(group.position);
  const ramp = box(group, ...midpoint.toArray(), a.distanceTo(b), 0.20, 5, M.wood);
  ramp.rotation.z = Math.atan2(b.y - a.y, b.x - a.x);
  for (const side of [-1, 1]) {
    rod(group, [790 - 835, 6.5, side * 2.4], [815 - 835, 1.0, side * 2.4], 0.055, M.steel);
  }
  for (const x of [-24, -12, 7]) {
    cyl(group, x, 0.23, 5.8, 0.18, 0.45, M.navy);
  }
  label(group, 'RECOVERY PIER', -15, 1.1, -6.9, 7, 0.6, Math.PI);
  batchStatic(group);
  return group;
}

export function buildCoast(scene, k) {
  const {box, cyl, ball, rod, label, M, mat, batchStatic} = k;
  const land = new T.Group();
  land.name = 'Harbour base, continuous rocky shoreline and lighthouse headland';
  scene.add(land);
  box(land, 790, 12, 760, 20, 8, 17, M.cream);
  box(land, 790, 16.4, 760, 22, 0.65, 19, M.teal);
  label(land, 'COASTAL RESCUE', 790, 13.2, 768.6, 13, 1.15);
  box(land, 790, 10.5, 768.55, 4.5, 5, 0.1, M.teal);
  for (const x of [783, 797]) box(land, x, 12.5, 768.55, 3, 2.4, 0.05, M.navy);
  for (const x of [778, 803]) rod(land, [x, 8, 769], [x, 14, 769], 0.07, M.steel);

  // Several kilometres of shoreline detail, not a single rectangular beach.
  for (let i = 0; i < 170; i++) {
    const z = -1500 + hash2(i, 2, 171) * 3900;
    const x = coastX(z) + (hash2(i, 1, 171) - 0.5) * 85;
    if (Math.hypot(x - 835, z - 760) < 40) continue;
    const y = terrainHeight(x, z);
    const radius = 0.7 + hash2(i, 3, 171) * 5;
    ball(land, x, y + radius * 0.25, z, radius, radius * 0.65, radius * 0.8,
      mat(i % 2 ? '#7e8b7d' : '#9b9b7f'));
  }
  const lx = coastX(-460) - 55;
  const lz = -460;
  const ly = terrainHeight(lx, lz);
  cyl(land, lx, ly + 9, lz, 2.4, 18, M.cream);
  cyl(land, lx, ly + 19, lz, 3, 2, M.teal);
  cyl(land, lx, ly + 21, lz, 3.2, 0.6, M.navy);
  for (const x of [-2.2, 2.2]) rod(land, [lx + x, ly + 18, lz], [lx + x, ly + 20.7, lz], 0.08, M.steel);
  batchStatic(land);
  const pier = buildPier(scene, k);
  const boats = [
    rescueBoat(scene, k, 1212, 296, 0.35),
    rescueBoat(scene, k, 895, 795, -0.35),
  ];
  return {roots: [land, pier], boats, lighthouse: [lx, ly + 18, lz]};
}
