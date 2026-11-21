import * as T from '../../../engine/vendor/three.module.js';
import {noise, hash, mix, ramp, smooth} from '../direction/math.js';
export const DOCK = [-420, 0, 0];
export const POND = [-165, 6.5, -450];
export const FLUME = [-180, 7.8, -575];
export const LAB = [-200, 6, -700];

export function coastX(z) {
  return -60 + 70 * Math.sin(z / 400) - 500 * Math.exp(-(((z + 150) / 100) ** 2));
}
export function heightAt(x, z) {
  const d = x - coastX(z);
  let land = 6 + 24 * noise(x / 300, z / 300) * ramp(-200, -700, x);
  land += 95 * Math.exp(-(((x + 1100) / 500) ** 2) - (((z + 700) / 800) ** 2));
  const sea = -3 - 36 * ramp(0, 400, d);
  let y = mix(land, sea, ramp(-45, 70, d));
  // The engineering campus is grounded in land, not a room holding the ocean.
  const campus = (1 - ramp(115, 160, Math.abs(z + 600))) * (1 - ramp(50, 105, Math.abs(x + 220)));
  y = mix(y, 6, campus * ramp(-120, -160, x));
  const garden = 1-ramp(24,48,Math.hypot(x+165,(z+450)*1.25));
  y=mix(y,6,garden);
  // This is a deliberately excavated dry dock; its physical retaining walls
  // cover the boundary. Outdoor terrain elsewhere has no square set floors.
  if (x > -459 && x < -381 && z > -100 && z < 100) y = -14;
  return y;
}

export function buildGeography(scene, k) {
  function axis(low, high, denseLow, denseHigh, extra) {
    const values = new Set(extra);
    for (let v = low; v <= high; v += 90) values.add(v);
    for (let v = denseLow; v <= denseHigh; v += 15) values.add(v);
    return [...values].sort((a, b) => a - b);
  }
  const xs = axis(-4400, 2600, -570, 600, [-460, -459, -381, -380]);
  const zs = axis(-4150, 2850, -1050, 150, [-101, -100, 100, 101]);
  const positions = [], colors = [], indices = [], color = new T.Color();
  for (let iz = 0; iz < zs.length; iz++) {
    for (let ix = 0; ix < xs.length; ix++) {
      const x = xs[ix], z = zs[iz], h = heightAt(x, z);
      positions.push(x, h, z);
      color.set(h < -20 ? '#28515a' : h < -1 ? '#7c9382' : x - coastX(z) > -70 ? '#bcb087' : '#7a8f57');
      color.multiplyScalar(0.93 + noise(x / 130, z / 130) * 0.14);
      colors.push(color.r, color.g, color.b);
      if (ix < xs.length - 1 && iz < zs.length - 1) {
        const i = iz * xs.length + ix, n = i + xs.length;
        indices.push(i, n, i + 1, i + 1, n, n + 1);
      }
    }
  }
  const geometry = new T.BufferGeometry();
  geometry.setAttribute('position', new T.Float32BufferAttribute(positions, 3));
  geometry.setAttribute('color', new T.Float32BufferAttribute(colors, 3));
  geometry.setIndex(indices); geometry.computeVertexNormals();
  const terrain = new T.Mesh(geometry, new T.MeshPhongMaterial({vertexColors: true, shininess: 1}));
  terrain.name = 'Continuous coastal land and harbour bathymetry'; scene.add(terrain);

  const treeGeometry = new T.ConeGeometry(1, 1, 6);
  const trunks = new T.CylinderGeometry(0.09, 0.13, 1, 5);
  const trees = [];
  for (let i = 0; i < 1800; i++) {
    const x = -1500 + hash(i, 0) * 1450, z = -1800 + hash(i, 1) * 3000;
    if (x > coastX(z) - 70 || heightAt(x, z) < 5) continue;
    if (Math.hypot(x + 420, z) < 145 || Math.hypot(x + 210, z + 610) < 220) continue;
    trees.push({x, z, y: heightAt(x, z), h: 7 + hash(i, 2) * 13});
  }
  const leaf = new T.InstancedMesh(treeGeometry, k.material('#557448'), trees.length);
  const bark = new T.InstancedMesh(trunks, k.M.wood, trees.length);
  const dummy = new T.Object3D();
  for (let i = 0; i < trees.length; i++) {
    const tree = trees[i];
    dummy.position.set(tree.x, tree.y + tree.h * 0.65, tree.z);
    dummy.scale.set(tree.h * 0.27, tree.h * 0.75, tree.h * 0.27); dummy.updateMatrix(); leaf.setMatrixAt(i, dummy.matrix);
    dummy.position.y = tree.y + tree.h * 0.28; dummy.scale.set(tree.h * 0.27, tree.h * 0.56, tree.h * 0.27);
    dummy.updateMatrix(); bark.setMatrixAt(i, dummy.matrix);
  }
  leaf.computeBoundingSphere(); bark.computeBoundingSphere(); scene.add(leaf, bark);
  return {terrain, trees: trees.length, stats: {worldWidthMeters: 7000, sharedLandAndSeabed: true, regionalTrees: trees.length}};
}
