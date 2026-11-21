import * as T from '../../../engine/vendor/three.module.js';
import {terrainHeight, hash2} from '../environment/field.js';

export function buildSeabedEvidence(scene, k) {
  const {box, cyl, ball, rod, M, mat, batchStatic} = k;
  const group = new T.Group();
  group.name = 'Wreckage and benthic habitat on continuous bathymetry';
  scene.add(group);
  const wing = box(group, 1171, terrainHeight(1171, 313) + 0.55, 313, 19, 0.18, 5, M.cream);
  wing.rotation.set(0.08, 0.36, -0.08);
  const engine = cyl(group, 1188, terrainHeight(1188, 314) + 0.9, 314, 1, 3.4, M.steel);
  engine.rotation.z = 1.3;
  const intake = cyl(group, 1186.4, terrainHeight(1188, 314) + 1.25, 314, 0.81, 0.05, M.navy);
  intake.rotation.z = 1.3;

  for (let i = 0; i < 310; i++) {
    const x = 1000 + hash2(i, 0, 307) * 510;
    const z = 100 + hash2(i, 1, 307) * 500;
    const y = terrainHeight(x, z);
    if (y > -3 || Math.hypot(x - 1180, z - 320) < 2.7) continue;
    const r = 0.2 + hash2(i, 2, 307) * 1.7;
    ball(group, x, y + r * 0.3, z, r, r * 0.6, r * 0.8, mat('#657c70'));
    if (i % 3 === 0) {
      for (let j = 0; j < 3; j++) {
        rod(group, [x, y, z], [x + 0.12 * j, y + 0.6 + hash2(i, j, 171), z + 0.1 * j], 0.035, M.green);
      }
    }
  }
  batchStatic(group);

  const fish = [];
  for (let i = 0; i < 28; i++) {
    const g = new T.Group();
    const body = mat(i % 2 ? '#c1c394' : '#6fa6a4');
    ball(g, 0, 0, 0, 0.25, 0.09, 0.055, body);
    const tail = k.mesh(g, new T.ConeGeometry(0.13, 0.2, 3), M.gold, 0.28, 0, 0);
    tail.rotation.z = Math.PI / 2;
    scene.add(g);
    fish.push({
      g,
      x: 1180 + (hash2(i, 1, 84) - 0.5) * 65,
      y: -37 + hash2(i, 2, 84) * 18,
      z: 320 + (hash2(i, 3, 84) - 0.5) * 65,
      p: hash2(i, 4, 84) * Math.PI * 2,
    });
  }
  return {root: group, fish};
}
