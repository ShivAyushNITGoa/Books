import * as T from '../../../engine/vendor/three.module.js';
import {terrainHeight, hash2} from '../environment/field.js';

/** Crash evidence occupies a small clearing INSIDE the regional forest. */
export function buildForestEvidence(scene, k) {
  const {box, cyl, ball, rod, M, mat, batchStatic} = k;
  const group = new T.Group();
  group.position.set(420, 12, -180);
  group.name = 'Non-graphic forest wreckage grounded in shared terrain';
  scene.add(group);

  const fuselage = cyl(group, -8, 1.3, -7, 1.2, 18, M.white);
  fuselage.rotation.z = 1.48;
  for (let i = 0; i < 11; i++) {
    box(group, -15 + i * 1.2, 1.8, -5.85, 0.5, 0.55, 0.05, M.navy);
  }
  const wing = box(group, -6, 0.5, -8, 15, 0.18, 4, M.cream);
  wing.rotation.set(0.1, -0.35, 0.15);
  const tail = box(group, 8, 2.8, -8, 3.5, 5.5, 0.18, M.teal);
  tail.rotation.z = 0.45;
  const tornRim = cyl(group, 1.05, 1.3, -7, 1.22, 0.12, M.steel);
  tornRim.rotation.z = Math.PI / 2;
  const darkInterior = cyl(group, 1.13, 1.3, -7, 1.08, 0.04, M.navy);
  darkInterior.rotation.z = Math.PI / 2;

  for (let i = 0; i < 34; i++) {
    const x = -15 + hash2(i, 1, 19) * 31;
    const z = -14 + hash2(i, 2, 19) * 10;
    const y = terrainHeight(420 + x, -180 + z) - 12;
    const fragment = box(group, x, y + 0.25, z,
      0.2 + hash2(i, 3, 19) * 1.6, 0.06, 0.3 + hash2(i, 4, 19), i % 2 ? M.steel : M.cream);
    fragment.rotation.set(hash2(i, 5, 19) * 0.4, i * 0.7, hash2(i, 6, 19) * 0.4);
  }

  // Rocks, fallen timber, roots and ferns continue beyond the clearing.
  for (let i = 0; i < 230; i++) {
    const x = (hash2(i, 1, 119) - 0.5) * 160;
    const z = (hash2(i, 2, 119) - 0.5) * 160;
    if (Math.hypot(x, z) < 3.1) continue;
    const y = terrainHeight(420 + x, -180 + z) - 12;
    const scale = 0.15 + hash2(i, 3, 119) * 0.7;
    ball(group, x, y + scale * 0.3, z, scale, scale * 0.4, scale * 0.7,
      mat(i % 2 ? '#7c8467' : '#93957a'));
  }
  for (const [x, z, yaw] of [[-17, 4, 0.6], [12, 10, -0.7], [-8, -24, 1.5]]) {
    const y = terrainHeight(420 + x, -180 + z) - 12;
    const log = cyl(group, x, y + 0.37, z, 0.38, 7, M.wood);
    log.rotation.set(Math.PI / 2, 0, yaw);
    for (let i = 0; i < 3; i++) {
      rod(group, [x + i - 1, y + 0.2, z], [x + i, y + 1.0, z + 0.5], 0.065, M.wood);
    }
  }
  // Survey stakes give investigators a grounded activity without graphic injury.
  for (const [x, z] of [[-10, 5], [10, 6], [12, -12]]) {
    const y = terrainHeight(420 + x, -180 + z) - 12;
    rod(group, [x, y, z], [x, y + 0.9, z], 0.035, M.gold);
    box(group, x + 0.2, y + 0.75, z, 0.4, 0.2, 0.025, M.orange);
  }
  batchStatic(group);
  return {root: group};
}
