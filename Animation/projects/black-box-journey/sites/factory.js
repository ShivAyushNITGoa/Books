import * as T from '../../../engine/vendor/three.module.js';
import {SITES} from '../choreography.js';

export function workbench(parent, x, z, k, width = 3.8) {
  const {box, M} = k;
  box(parent, x, 1.25, z, width, 0.18, 2, M.cream);
  box(parent, x, 1.12, z, width - 0.25, 0.12, 1.65, M.navy);
  for (const side of [-1, 1]) {
    for (const depth of [-0.7, 0.7]) {
      box(parent, x + side * (width / 2 - 0.35), 0.6, z + depth, 0.12, 1.2, 0.12, M.navy);
    }
  }
}

function testScreen(parent, x, index, k) {
  const {box, rod, mesh, M} = k;
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 320;
  const texture = new T.CanvasTexture(canvas);
  texture.colorSpace = T.SRGBColorSpace;
  box(parent, x, 3.1, -9.5, 3.4, 2.2, 0.25, M.navy);
  mesh(parent, new T.PlaneGeometry(3.1, 1.94), new T.MeshBasicMaterial({map: texture}), x, 3.1, -9.36);
  rod(parent, [x, 0.1, -9.5], [x, 2.1, -9.5], 0.07, M.steel);
  box(parent, x, 0.05, -9.5, 2, 0.1, 1, M.navy);
  return {canvas, tex: texture, index};
}

function toolWall(parent, k) {
  const {box, cyl, rod, M} = k;
  box(parent, 17.7, 3.3, -2, 0.12, 3.8, 6, M.steel);
  for (let i = 0; i < 8; i++) {
    const z = -4.4 + i * 0.68;
    rod(parent, [17.55, 2.8, z], [17.55, 4.2, z], 0.045, M.navy);
    const socket = cyl(parent, 17.53, 4.28, z, 0.11, 0.07, M.gold);
    socket.rotation.z = Math.PI / 2;
  }
  box(parent, 16.8, 1.0, -2, 1.8, 1.8, 5.5, M.teal);
  for (let i = 0; i < 5; i++) {
    box(parent, 15.87, 0.45 + i * 0.29, -2, 0.02, 0.02, 4.8, M.navy);
  }
}

export function buildFactory(scene, k) {
  const {box, cyl, rod, label, M, mat, batchStatic} = k;
  const group = new T.Group();
  group.position.set(0, SITES.factory.ground, 0);
  group.name = 'Factory interior and exterior are the same building';
  scene.add(group);

  box(group, 0, -0.10, 0, 36, 0.3, 26, mat('#b1bcbc'));
  box(group, -18, 5, 0, 0.28, 10, 26, M.cream);
  box(group, 18, 5, 0, 0.28, 10, 26, M.cream);
  box(group, 0, 5, -13, 36, 10, 0.28, M.teal);
  // The vehicle door is a real aperture. Camera does not fade the front wall.
  box(group, -13, 5, 13, 10, 10, 0.28, M.cream);
  box(group, 13, 5, 13, 10, 10, 0.28, M.cream);
  box(group, 0, 9, 13, 16, 2, 0.28, M.navy);
  box(group, 0, 10.2, 0, 36, 0.35, 26, M.cream);

  for (const x of [-15, -9, -3, 3, 9, 15]) {
    box(group, x, 9.7, 0, 0.18, 0.28, 25, M.steel);
    box(group, x, 9.35, 0, 0.9, 0.12, 5, M.white);
    rod(group, [x, 9.7, -12], [x + 2.5, 8.8, -12], 0.04, M.navy);
  }
  for (const x of [-17.6, 17.6]) {
    for (const z of [-11, -5, 1, 7]) box(group, x, 4.7, z, 0.2, 9.4, 0.3, M.steel);
  }
  for (let z = -11; z <= 11; z += 2) {
    box(group, -15, 0.06, z, 0.12, 0.025, 1, M.gold);
    box(group, 15, 0.06, z, 0.12, 0.025, 1, M.gold);
  }
  workbench(group, 0, 0, k, 3.7);
  workbench(group, -11, -7, k);
  workbench(group, 10, -7, k);
  for (const x of [-14, -10, -6, 6, 10, 14]) {
    box(group, x, 1.4, -11.7, 2.8, 2.8, 1.6, M.steel);
    for (let j = 0; j < 4; j++) {
      box(group, x, 0.4 + j * 0.6, -10.88, 2.4, 0.035, 0.03, M.navy);
      box(group, x + 0.8, 0.65 + j * 0.6, -10.86, 0.35, 0.05, 0.05, M.navy);
    }
  }
  for (const x of [-11, 11]) {
    box(group, x, 2.3, -6.8, 2.5, 1.9, 1.4, M.teal);
    cyl(group, x, 3.4, -6.8, 0.4, 0.25, M.steel);
    label(group, 'TEST RIG', x, 2.5, -6.08, 1.8, 0.4);
    for (const z of [-7.3, -6.3]) {
      rod(group, [x - 1, 1.4, z], [x - 1, 3.6, z], 0.07, M.steel);
    }
  }
  label(group, 'RECORDER DESIGN + FLIGHT SAFETY', 0, 6.2, -12.82, 10, 1);
  label(group, 'FLIGHT SYSTEMS / ENGINEERING', 0, 8.1, 13.18, 10, 0.7);
  label(group, 'EXIT', 0, 7.2, 12.8, 2.5, 0.65, Math.PI, '#347b67');
  const screens = [testScreen(group, -8, 0, k), testScreen(group, 8, 1, k)];
  toolWall(group, k);

  // Exterior reveals match what was just seen indoors: door, rooftop, yard.
  const yard = new T.Group();
  yard.position.set(0, 8.08, 48);
  yard.name = 'Factory access yard connects to regional road';
  scene.add(yard);
  box(yard, 0, -0.08, 0, 90, 0.12, 65, mat('#8b9691'));
  for (let i = -3; i <= 3; i++) box(yard, i * 9, 0.012, 0, 0.1, 0.03, 30, M.cream);
  box(yard, -30, 2.5, 4, 8, 5, 4, M.teal);
  box(yard, -34.8, 1.8, 4, 1.6, 3.5, 4, M.cream);
  for (const x of [-33, -27]) {
    const wheel = cyl(yard, x, 0.7, 6.1, 0.65, 0.3, M.navy);
    wheel.rotation.x = Math.PI / 2;
  }
  for (const x of [-46, 46]) {
    for (let z = -20; z <= 30; z += 8) {
      rod(yard, [x, 0, z], [x, 2.8, z], 0.065, M.steel);
    }
    rod(yard, [x, 2.0, -20], [x, 2.0, 30], 0.035, M.steel);
  }
  for (const x of [-10, 10]) {
    box(group, x, 10.65, -2, 5, 0.45, 8, M.teal);
    box(group, x, 10.95, -2, 4.4, 0.12, 7.3, M.navy);
  }
  batchStatic(group);
  batchStatic(yard);
  return {roots: [group, yard], screens};
}
