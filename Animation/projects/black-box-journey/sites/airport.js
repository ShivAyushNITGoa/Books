import * as T from '../../../engine/vendor/three.module.js';
import {airplane} from '../art.js';

function trafficCone(parent, k, x, z, scale = 1) {
  const {box, mesh, M} = k;
  const group = new T.Group();
  group.position.set(x, 0.11, z);
  group.scale.setScalar(scale);
  parent.add(group);
  box(group, 0, 0.05, 0, 0.95, 0.1, 0.95, M.navy);
  mesh(group, new T.ConeGeometry(0.38, 1.5, 20), M.orange, 0, 0.82, 0);
  for (const y of [0.65, 1.03]) {
    const r = 0.38 * (1 - (y - 0.08) / 1.5);
    mesh(group, new T.CylinderGeometry(r - 0.025, r + 0.025, 0.15, 20), M.white, 0, y, 0);
  }
}

export function buildAirport(scene, k) {
  const {box, cyl, rod, label, M, mat, batchStatic} = k;
  const group = new T.Group();
  group.position.set(130, 8, 650);
  group.name = 'Working airport integrated into lowland terrain and access road';
  scene.add(group);
  box(group, 0, 0.02, 0, 130, 0.15, 180, mat('#969f94'));
  box(group, 45, 0.025, -30, 22, 0.15, 460, mat('#626f70'));
  for (let z = -230; z <= 180; z += 22) box(group, 45, 0.112, z, 0.5, 0.035, 9, M.cream);
  for (const x of [-40, -20, 0, 20]) box(group, x, 0.112, 25, 0.15, 0.03, 70, M.gold);
  for (const z of [-218, 169]) {
    for (const x of [37, 40, 43, 46, 49, 52]) {
      box(group, x, 0.12, z, 1.3, 0.025, 12, M.white);
    }
  }
  box(group, 0, 0.7, 0, 3.5, 1.4, 2.5, M.navy);
  box(group, 0, 1.82, 0, 3.1, 0.2, 2.1, M.steel);
  trafficCone(group, k, 3.5, 0.3, 1.25);
  trafficCone(group, k, 5.2, -4, 1);
  trafficCone(group, k, -4, -4, 0.8);

  const towerX = -38;
  const towerZ = -110;
  box(group, towerX, 12, towerZ, 7, 24, 7, M.cream);
  box(group, towerX, 25.5, towerZ, 14, 4, 12, M.teal);
  box(group, towerX, 28, towerZ, 15, 0.5, 13, M.navy);
  for (const side of [-1, 1]) {
    box(group, towerX, 25.8, towerZ + side * 6.1, 12, 1.8, 0.05, M.navy);
  }
  label(group, 'REGIONAL AIRPORT', -58, 9, -59.8, 24, 1.5);
  box(group, -65, 7, -80, 40, 14, 38, M.cream);
  box(group, -65, 14.4, -80, 42, 0.5, 40, M.teal);
  for (let x = -82; x <= -48; x += 5) {
    box(group, x, 7, -60.8, 3.2, 6, 0.04, M.navy);
  }

  // Service equipment, apron lights and fencing provide scale in aerial views.
  for (const [x, z] of [[-24, -42], [-29, -42], [-34, -42]]) {
    box(group, x, 0.65, z, 3.5, 1.1, 1.8, M.steel);
    for (const side of [-1, 1]) {
      const wheel = cyl(group, x + side * 1.25, 0.3, z + 0.95, 0.28, 0.14, M.navy);
      wheel.rotation.x = Math.PI / 2;
    }
  }
  for (const [x, z] of [[-50, 54], [-50, -45], [20, -70]]) {
    rod(group, [x, 0.1, z], [x, 16, z], 0.12, M.steel);
    box(group, x, 16, z, 4, 0.28, 1.5, M.white);
  }
  for (let z = -248; z <= 195; z += 12) {
    for (const x of [29, 61]) {
      cyl(group, x, 0.28, z, 0.1, 0.35, M.steel);
      box(group, x, 0.5, z, 0.23, 0.13, 0.23, M.gold);
    }
  }
  const parked = airplane(group, k, 1.7);
  parked.position.set(-25, 3, 51);
  parked.rotation.y = 0.55;
  const departing = airplane(scene, k, 1.4);
  batchStatic(group);
  return {root: group, departing};
}
