import * as T from '../../../engine/vendor/three.module.js';
import {batchStatic, canvasTexture} from '../assets/drawing.js';
import {DOCK, POND, FLUME, LAB, LAB_FLOOR_Y, heightAt} from './geography.js';
import {hash} from '../direction/math.js';

function crane(parent, k, x, z, height, reach) {
  const {box, rod, M} = k;
  for (const side of [-1, 1]) {
    box(parent, x + side * 6, height / 2, z, 1.5, height, 2, M.yellow);
    rod(parent, [x + side * 6, 4, z], [x - side * 6, height - 5, z], 0.15, M.steel);
  }
  box(parent, x, height, z, reach, 2, 3, M.yellow);
  box(parent, x + reach * 0.27, height - 2.3, z, 5, 3, 4, M.teal);
  rod(parent, [x - reach * 0.28, height, z], [x - reach * 0.28, height - 15, z], 0.06, M.dark);
  box(parent, x - reach * 0.28, height - 15.4, z, 4, 0.45, 2, M.steel);
}

export function buildDock(scene, k) {
  const {box, rod, cyl, label, M} = k;
  const root = new T.Group(); root.position.set(...DOCK); scene.add(root);
  root.name = 'Excavated dry dock, not an ocean exhibit';
  box(root, 0, -14.0, 0, 77, 0.5, 198, M.steel);
  for (const x of [-39.5, 39.5]) {
    box(root, x, -3.5, 0, 3, 21, 204, M.cream);
    box(root, x, 7.2, 0, 7, 0.5, 204, M.steel);
    for (let z = -95; z < 100; z += 5) {
      box(root, x, 7.5, z, 5.8, 0.035, 0.35, M.yellow);
      rod(root, [x, 7.7, z], [x, 9.0, z], 0.055, M.navy);
    }
    rod(root, [x, 9, -98], [x, 9, 98], 0.045, M.navy);
  }
  box(root, 0, -3.5, 100, 82, 21, 3, M.cream);
  // The sea gate is closed while the floor is dry. Camera flies over it rather
  // than claiming that a full-size ship sails through this dry compartment.
  box(root, 0, -3.5, -100, 78, 21, 2, M.teal);
  label(root, 'DRY-DOCK / HULL INSPECTION', 0, 4.2, -98.9, 34, 2.6);
  for (let z = -52; z <= 55; z += 13) {
    box(root, 0, -12.1, z, 8.5, 3.2, 4.5, M.wood);
  }
  for (let i = 0; i < 14; i++) {
    const z = -87 + i * 1.5;
    box(root, 29, -13.5 + i * 1.5, z, 7, 0.25, 1.5, M.steel);
  }
  for (const x of [-57, 57]) {
    const craneRoot = new T.Group(); craneRoot.position.set(x, 7, 38); root.add(craneRoot);
    crane(craneRoot, k, 0, 0, 43, 42);
  }
  for (const [x, z] of [[24, -63], [27, -72], [23, -47]]) {
    box(root, x, -12.7, z, 2.5, 2, 1.5, M.teal);
    cyl(root, x, -11.45, z, 0.5, 0.4, M.steel);
  }
  batchStatic(root);
  return {root};
}

function screen(parent, k, x, y, z, title, width = 5) {
  const canvas = document.createElement('canvas'); canvas.width = 640; canvas.height = 400;
  const texture = new T.CanvasTexture(canvas); texture.colorSpace = T.SRGBColorSpace;
  k.box(parent, x, y, z, width + 0.3, width * 0.625 + 0.3, 0.25, k.M.navy);
  const face = new T.Mesh(new T.PlaneGeometry(width, width * 0.625), new T.MeshBasicMaterial({map: texture}));
  face.position.set(x, y, z + 0.14); parent.add(face);
  return {canvas, texture, title};
}

export function buildResearchCampus(scene, k) {
  const {box, rod, cyl, ball, label, M} = k;
  const garden = new T.Group(); scene.add(garden); garden.name = 'Waterside garden and physical interference pond';
  // Low masonry retaining edge, rather than a square floating water card.
  const pondRim = new T.Mesh(new T.TorusGeometry(15.5, 0.65, 5, 48), M.cream);
  pondRim.rotation.x = Math.PI / 2; pondRim.scale.y = 0.65;
  pondRim.position.set(...POND); garden.add(pondRim);
  const basin = cyl(garden, POND[0], 4.6, POND[2], 15.2, 3, M.dark);
  basin.scale.z *= 0.65;
  for (let i = 0; i < 80; i++) {
    const angle = hash(i, 1) * Math.PI * 2, r = 17 + hash(i, 2) * 17;
    const x = POND[0] + Math.cos(angle) * r, z = POND[2] + Math.sin(angle) * r;
    if (x > -135) continue;
    const y = Math.max(6, heightAt(x, z));
    ball(garden, x, y + 0.4, z, 0.9, 0.6, 0.8, M.green);
    if (i % 3 === 0) rod(garden, [x, y, z], [x, y + 2.1, z], 0.04, M.wood);
  }
  // A real continuous walking path joins pond, outdoor basin, laboratory.
  box(garden, -164, 6.14, -521, 8, 0.25, 110, M.sand);
  box(garden, -181, 6.14, -618, 8, 0.25, 55, M.sand);
  for (const z of [-478, -506, -537, -614]) {
    rod(garden, [-148, 6, z], [-148, 10.5, z], 0.08, M.steel);
    box(garden, -148, 10.7, z, 1.2, 0.2, 1.2, M.cream);
  }
  const outdoor = new T.Group(); outdoor.position.set(FLUME[0], 6, FLUME[2]); scene.add(outdoor);
  outdoor.name = 'Outdoor wave-design basin';
  box(outdoor, 0, 0.2, 0, 36, 0.4, 55, M.cream);
  for (const x of [-7, 7]) box(outdoor, x, 1.3, 0, 0.65, 2.6, 40, M.steel);
  for (const z of [-20, 20]) box(outdoor, 0, 1.3, z, 14, 2.6, 0.6, M.steel);
  label(outdoor, 'DESIGN SPEED + LOADING', 0, 5.5, -20.4, 18, 1.4, 0);
  const outdoorScreen = screen(outdoor, k, -12, 5, -15, 'OPERATING ENVELOPE', 6);

  const lab = new T.Group(); lab.position.set(...LAB); scene.add(lab);
  lab.name = 'Naval research tow tank: only scale models are indoors';
  box(lab, 0, LAB_FLOOR_Y-LAB[1]-.36, 0, 58, .72, 100, M.cream);
  for (const x of [-29, 29]) box(lab, x, 12, 0, 0.3, 24, 100, M.teal);
  // Front and rear openings are real, aligned with the camera's one-way rail.
  for (const z of [-50, 50]) {
    box(lab, -24, 12, z, 10, 24, 0.3, M.cream);
    box(lab, 24, 12, z, 10, 24, 0.3, M.cream);
    box(lab, 0, 22, z, 38, 4, 0.3, M.navy);
  }
  box(lab, 0, 24.3, 0, 58, 0.6, 100, M.cream);
  for (let z = -45; z <= 45; z += 10) {
    box(lab, 0, 23.6, z, 57, 0.4, 0.4, M.steel);
    box(lab, 0, 22.9, z, 15, 0.2, 1.2, M.white);
  }
  box(lab, 0, 0.5, 0, 12.5, 1, 76, M.navy);
  for (const x of [-6.5, 6.5]) box(lab, x, 2, 0, 0.55, 4, 76, M.steel);
  for (const z of [-38, 38]) box(lab, 0, 2, z, 13, 4, 0.5, M.steel);
  for (const x of [-9, 9]) {
    box(lab, x, .065, 0, 0.2, .025, 84, M.yellow);
    box(lab, x, 5.7, 0, 0.24, 0.4, 84, M.steel);
  }
  const labScreens = [screen(lab, k, -18, 7.4, -23, 'FLOW FIELD / SCHEMATIC', 8), screen(lab, k, 18, 7.4, -23, 'TOW FORCE / RELATIVE', 8)];
  for (const x of [-18, 18]) {
    box(lab, x, 1.3, -21, 10, 0.22, 3, M.steel);
    for (const side of [-1, 1]) box(lab, x + side * 4, 0.6, -21, 0.16, 1.2, 2.5, M.navy);
  }
  label(lab, 'NAVAL HYDRODYNAMICS / MODEL TESTING', 0, 18.5, 50.2, 34, 2);
  const carriage = new T.Group(); lab.add(carriage);
  for (const x of [-9, 9]) {
    box(carriage, x, 6.9, 0, 1.1, 2.2, 5, M.yellow);
    rod(carriage, [x, 6, 0], [0, 9.5, 0], 0.12, M.steel);
  }
  box(carriage, 0, 9.5, 0, 20, 0.6, 3, M.yellow);
  rod(carriage, [0, 9.5, 0], [0, 3, 0], 0.055, M.steel);
  const wheels=[];
  for(const x of [-9,9])for(const z of [-1.7,1.7]){
    const wheel=cyl(carriage,x,6,z,.55,.30,M.navy);wheel.rotation.z=Math.PI/2;wheel.userData.axle=wheel.quaternion.clone();wheels.push(wheel);
  }
  const lamps=[ball(carriage,-8.5,8.35,0,.22,.22,.22,M.red),ball(carriage,8.5,8.35,0,.22,.22,.22,M.green)];
  batchStatic(garden); batchStatic(outdoor); batchStatic(lab, new Set([carriage])); batchStatic(carriage,new Set([...wheels,...lamps]));
  return {roots: [garden, outdoor, lab], lab, outdoor, carriage, wheels, lamps, floorY: LAB_FLOOR_Y, screens: [outdoorScreen, ...labScreens]};
}

export function buildTerminal(scene, k) {
  const {box, label, M, material} = k;
  const root = new T.Group(); scene.add(root); root.name = 'Working cargo terminal and coastal access route';
  box(root, -158, 5.5, -900, 260, 1, 190, M.steel);
  const colors = ['#b87051', '#a9b187', '#d7b76a', '#4c7c83'];
  for (let i = 0; i < 70; i++) {
    const x = -265 + i % 10 * 21, z = -975 + Math.floor(i / 10) * 24;
    box(root, x, 9.5, z, 17, 7, 9, material(colors[i % 4]));
    if (i % 3 === 0) box(root, x, 16.6, z, 17, 7, 9, material(colors[(i + 1) % 4]));
  }
  for (const [i, text] of ['ELECTRONICS', 'CLOTHING', 'FOOD', 'MACHINERY'].entries()) {
    label(root, text, -230 + i * 50, 10, -987, 17, 2, Math.PI);
  }
  for (const x of [-140, -50]) crane(root, k, x, -830, 55, 75);
  batchStatic(root); return {root};
}
