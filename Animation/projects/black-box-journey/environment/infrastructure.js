import * as T from '../../../engine/vendor/three.module.js';
import {terrainHeight, riverZ, routeDistance, smoothstep} from './field.js';

/** The same road centreline drives the mesh, traffic and vegetation setback. */
export const ROAD_NODES = [
  [0, 64], [45, 92], [125, 80], [205, 5], [305, -80],
  [370, -120], [465, -110], [555, -40], [610, 100], [628, 245],
  [640, riverZ(640) - 32], [640, riverZ(640) + 32], [640, 430], [700, 585], [765, 680], [785, 760],
];
export const AIRPORT_NODES = [
  [640, 430], [570, 500], [440, 565], [300, 580], [180, 580], [130, 595],
];

function centreline(nodes) {
  return new T.CatmullRomCurve3(
    nodes.map(([x, z]) => new T.Vector3(x, 0, z)), false, 'centripetal',
  );
}

export function roadDistance(x, z) {
  return Math.min(routeDistance(x, z, ROAD_NODES), routeDistance(x, z, AIRPORT_NODES));
}

/** Mesh ribbons follow the analytic field; a real bridge spans the river. */
function roadHeight(x, z) {
  const distance = Math.abs(z - riverZ(x));
  const natural = terrainHeight(x, z) + 0.13;
  const approach = (1 - smoothstep(25, 90, distance))
    * (1 - smoothstep(18, 70, Math.abs(x - 640)));
  return natural + Math.max(0, 24 - natural) * approach;
}

function ribbon(curve, width, count, material, lift = 0) {
  const positions = [];
  const uv = [];
  const indices = [];
  for (let i = 0; i <= count; i++) {
    const u = i / count;
    const p = curve.getPoint(u);
    const tangent = curve.getTangent(u);
    const normal = new T.Vector3(-tangent.z, 0, tangent.x).normalize();
    for (const side of [-1, 1]) {
      const x = p.x + normal.x * width * side / 2;
      const z = p.z + normal.z * width * side / 2;
      positions.push(x, roadHeight(x, z) + lift, z);
      uv.push((side + 1) / 2, u * count);
    }
    if (i < count) {
      const a = i * 2;
      indices.push(a, a + 2, a + 1, a + 1, a + 2, a + 3);
    }
  }
  const geometry = new T.BufferGeometry();
  geometry.setAttribute('position', new T.Float32BufferAttribute(positions, 3));
  geometry.setAttribute('uv', new T.Float32BufferAttribute(uv, 2));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();
  return new T.Mesh(geometry, material);
}

function makeTruck(k, color) {
  const {box, cyl, M, mat} = k;
  const group = new T.Group();
  box(group, 0, 1.2, 0, 2.2, 1.5, 4.4, mat(color));
  box(group, 0, 1.25, -2.6, 2.2, 1.7, 1.6, M.cream);
  box(group, 0, 1.6, -3.42, 1.8, 0.65, 0.025, M.teal);
  for (const x of [-1.15, 1.15]) {
    for (const z of [-2.4, 1.4]) {
      const wheel = cyl(group, x, 0.55, z, 0.51, 0.25, M.navy);
      wheel.rotation.z = Math.PI / 2;
    }
  }
  return group;
}

export function buildInfrastructure(scene, k) {
  const {box, rod, cyl, label, M, mat, batchStatic} = k;
  const group = new T.Group();
  group.name = 'Connected road network, river bridge and roadside landmarks';
  scene.add(group);
  const asphalt = mat('#69746c');
  const shoulder = mat('#aaa68b');
  const marking = mat('#dbcf9e');
  const curves = [centreline(ROAD_NODES), centreline(AIRPORT_NODES)];
  const roadMeshes = [];

  for (const curve of curves) {
    const count = 400;
    const border = ribbon(curve, 8.7, count, shoulder);
    const road = ribbon(curve, 7.2, count, asphalt, 0.035);
    group.add(border, road);
    roadMeshes.push(border, road);
    for (let i = 3; i < 380; i += 5) {
      const u = i / count;
      const p = curve.getPoint(u);
      const tangent = curve.getTangent(u);
      const dash = box(group, p.x, roadHeight(p.x, p.z) + 0.08, p.z,
        0.16, 0.025, 2.7, marking);
      dash.rotation.y = Math.atan2(tangent.x, tangent.z);
    }
    for (let i = 5; i < 385; i += 14) {
      const p = curve.getPoint(i / count);
      const tangent = curve.getTangent(i / count);
      const normal = new T.Vector3(-tangent.z, 0, tangent.x).normalize();
      for (const side of [-1, 1]) {
        const x = p.x + normal.x * 5.3 * side;
        const z = p.z + normal.z * 5.3 * side;
        const y = terrainHeight(x, z);
        box(group, x, y + 0.48, z, 0.13, 0.95, 0.13, M.cream);
        box(group, x, y + 0.71, z + 0.075, 0.11, 0.14, 0.025, M.orange);
      }
    }
  }

  const searchTrail = centreline([[370, -120], [393, -145], [410, -165], [420, -177]]);
  const trail = ribbon(searchTrail, 2.4, 100, mat('#9a9465'), 0.025);
  group.add(trail);
  roadMeshes.push(trail);

  // A raised river crossing is seen on the return journey to the airport.
  const bridgeX = 640;
  const bridgeZ = riverZ(bridgeX);
  const bridgeY = 23.9;
  box(group, bridgeX, bridgeY - 0.25, bridgeZ, 10, 0.5, 58, M.steel);
  for (const x of [bridgeX - 4.8, bridgeX + 4.8]) {
    rod(group, [x, bridgeY + 1.2, bridgeZ - 29], [x, bridgeY + 1.2, bridgeZ + 29], 0.07, M.cream);
    for (let z = bridgeZ - 28; z <= bridgeZ + 28; z += 4) {
      rod(group, [x, bridgeY, z], [x, bridgeY + 1.25, z], 0.055, M.steel);
    }
  }
  for (const z of [bridgeZ - 18, bridgeZ + 18]) {
    for (const x of [bridgeX - 3, bridgeX + 3]) {
      const bottom = terrainHeight(x, z);
      cyl(group, x, (bridgeY + bottom) / 2, z, 0.4, bridgeY - bottom, M.steel);
    }
  }

  // A few inhabited landmarks give scale without copying identical blocks.
  const buildings = [
    {x: -58, z: 105, w: 22, d: 14, h: 8, color: '#c6c0a2'},
    {x: 112, z: 120, w: 13, d: 11, h: 6, color: '#e0d1ad'},
    {x: 565, z: 205, w: 17, d: 13, h: 7, color: '#c7ccaf'},
    {x: 733, z: 625, w: 24, d: 15, h: 9, color: '#d3c4a4'},
  ];
  for (const b of buildings) {
    const y = terrainHeight(b.x, b.z);
    box(group, b.x, y + b.h / 2, b.z, b.w, b.h, b.d, mat(b.color));
    const roof = box(group, b.x, y + b.h + 0.45, b.z, b.w + 1.3, 0.9, b.d + 1.3, M.teal);
    roof.rotation.z = 0.025;
    for (let x = b.x - b.w / 2 + 2; x < b.x + b.w / 2 - 1; x += 3) {
      box(group, x, y + b.h * 0.6, b.z + b.d / 2 + 0.02, 1.2, 1.8, 0.04, M.navy);
    }
  }

  for (const [x, z, text] of [
    [190, 45, 'FOREST ROAD'], [570, 74, 'COAST  →'], [533, 522, 'AIRPORT  ←'],
  ]) {
    const y = terrainHeight(x, z);
    rod(group, [x, y, z], [x, y + 3.3, z], 0.08, M.steel);
    label(group, text, x, y + 3.1, z + 0.05, 5, 0.9);
  }

  const vehicles = [
    {mesh: makeTruck(k, '#d19d5e'), curve: curves[0], phase: 0.18, speed: 0.00045},
    {mesh: makeTruck(k, '#5d8c88'), curve: curves[0], phase: 0.73, speed: -0.0003},
    {mesh: makeTruck(k, '#e2b44c'), curve: curves[1], phase: 0.38, speed: 0.0003},
  ];
  for (const v of vehicles) {
    scene.add(v.mesh);
    batchStatic(v.mesh);
  }
  // Keep indexed ribbons intact; unlike the old batching helper they carry
  // specific vertex normals and topology that should not be rewritten.
  batchStatic(group, new Set(roadMeshes));
  return {
    group,
    curves,
    vehicles,
    update(time) {
      for (const vehicle of vehicles) {
        const u = ((vehicle.phase + time * vehicle.speed) % 1 + 1) % 1;
        const p = vehicle.curve.getPoint(u);
        const direction = vehicle.curve.getTangent(u);
        vehicle.mesh.position.set(p.x, roadHeight(p.x, p.z), p.z);
        vehicle.mesh.rotation.y = Math.atan2(-direction.x, -direction.z);
      }
    },
    stats: {roadLengthMeters: curves.reduce((n, c) => n + c.getLength(), 0), bridges: 1},
  };
}
