import * as T from '../../../engine/vendor/three.module.js';
import {batchStatic} from './drawing.js';
import {mix, clamp, smooth} from '../direction/math.js';

export const SHIP = Object.freeze({length: 132, beam: 25, draft: 10.4, deckY: 8.2,
  bowZ: -66, bulbZ: -68.8, afloatOffset: 2.0});
// Single fair body: 3.7 m maximum width, 6 m beyond the nominal stem,
// rather than the previous 20.6 m ellipsoid and separate spherical connector.
export const BULB = Object.freeze({frontZ:-72, rearZ:-60.4, radiusX:1.85, radiusY:1.7, centreY:-6.8, slope:.095});
export function bulbSurfacePoints() {
  const points=[],centreZ=(BULB.frontZ+BULB.rearZ)/2,rz=(BULB.rearZ-BULB.frontZ)/2;
  for(let i=0;i<=48;i++){
    const phi=i/48*Math.PI,z=centreZ-rz*Math.cos(phi),s=Math.sin(phi);
    for(let j=0;j<=32;j++){
      const theta=j/32*Math.PI*2;
      points.push([BULB.radiusX*s*Math.cos(theta),BULB.centreY+BULB.slope*(z-centreZ)+BULB.radiusY*s*Math.sin(theta),z]);
    }
  }
  return points;
}
export function bulbGeometry() {
  const points=bulbSurfacePoints(),indices=[],rows=points.length/33;
  for(let i=0;i<rows-1;i++)for(let j=0;j<32;j++){
    const a=i*33+j,b=a+1,n=a+33;indices.push(a,b,n,b,n+1,n);
  }
  const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(points.flat(),3));
  g.setIndex(indices);
  const centreZ=(BULB.frontZ+BULB.rearZ)/2,rz=(BULB.rearZ-BULB.frontZ)/2;
  const normals=points.flatMap(([x,y,z])=>{
    const ny=(y-BULB.centreY-BULB.slope*(z-centreZ))/(BULB.radiusY**2);
    return new T.Vector3(x/BULB.radiusX**2,ny,(z-centreZ)/rz**2-BULB.slope*ny).normalize().toArray();
  });
  g.setAttribute('normal',new T.Float32BufferAttribute(normals,3));return g;
}

const STATIONS = [
  [-66, 0.24], [-63, 3.4], [-57, 7.2], [-46, 10.9], [-28, 12.5],
  [0, 12.5], [30, 12.2], [48, 11.5], [59, 9.2], [66, 4.6],
];
function halfBeam(z) {
  let i = 0;
  while (i < STATIONS.length - 2 && z > STATIONS[i + 1][0]) i++;
  const a = STATIONS[i], b = STATIONS[i + 1];
  return mix(a[1], b[1], smooth((z - a[0]) / (b[0] - a[0])));
}

/** Real closed hull sections, not a scaled rectangular box with a ball glued on. */
export function hullBand(minimumY, maximumY, bands) {
  const positions = [], indices = [];
  const stations = 66;
  for (let s = 0; s <= stations; s++) {
    const z = -66 + s / stations * 132;
    const w = halfBeam(z);
    for (const side of [-1, 1]) {
      for (let b = 0; b <= bands; b++) {
        const y = mix(minimumY, maximumY, b / bands);
        const shape = y < -8 ? mix(0.3, 0.80, clamp((y + 10.4) / 2.4))
          : y < 0 ? mix(0.80, 1, (y + 8) / 8) : 1;
        const bow = 1 - smooth((z + 66) / 12);
        const rake = bow * mix(4, -2.5, (y + 10.4) / 18.6);
        positions.push(side * w * shape, y, z + rake);
      }
    }
  }
  const row = 2 * (bands + 1);
  for (let s = 0; s < stations; s++) {
    for (let side = 0; side < 2; side++) {
      for (let b = 0; b < bands; b++) {
        const a = s * row + side * (bands + 1) + b, n = a + row;
        if (side) indices.push(a, n, a + 1, a + 1, n, n + 1);
        else indices.push(a, a + 1, n, a + 1, n + 1, n);
      }
    }
  }
  // Fore and aft end caps are visible in the dry dock and broad departure.
  for (const s of [0, stations]) {
    const base = s * row;
    for (let b = 0; b < bands; b++) {
      const a = base + b, c = base + bands + 1 + b;
      if (!s) indices.push(a, c, a + 1, c, c + 1, a + 1);
      else indices.push(a, a + 1, c, c, a + 1, c + 1);
    }
  }
  // Correct exterior winding. The original sides and end caps faced inward,
  // so above-water plating vanished under back-face culling: a false deep-draft
  // appearance that cannot be repaired by simply raising the ship.
  for(let i=0;i<indices.length;i+=3)[indices[i+1],indices[i+2]]=[indices[i+2],indices[i+1]];
  if(minimumY===-SHIP.draft)for(let s=0;s<stations;s++){
    const a=s*row,c=a+bands+1,n=a+row;indices.push(a,c,n,c,n+bands+1,n);
  }
  const geometry = new T.BufferGeometry();
  geometry.setAttribute('position', new T.Float32BufferAttribute(positions, 3));
  geometry.setIndex(indices); geometry.computeVertexNormals();
  return geometry;
}

export function deckGeometry() {
  const shape = new T.Shape();
  for (let i = 0; i <= 66; i++) {
    const z = -66 + i * 2, width = halfBeam(z);
    if (!i) shape.moveTo(-width, -(z-2.5*(1-smooth((z+66)/12)))) ; else shape.lineTo(-width, -(z-2.5*(1-smooth((z+66)/12))));
  }
  for (let i = 66; i >= 0; i--) {
    const z = -66 + i * 2; shape.lineTo(halfBeam(z), -(z-2.5*(1-smooth((z+66)/12))));
  }
  shape.closePath();
  const geometry = new T.ShapeGeometry(shape);
  geometry.rotateX(-Math.PI / 2); geometry.translate(0, SHIP.deckY, 0);
  return geometry;
}

function addContainers(parent, k, miniature) {
  const {box, material, M} = k;
  const colors = ['#ba6c4c', '#6c8a82', '#d3b066', '#526f7a', '#a6ac8a'];
  let count = 0;
  for (let row = 0; row < 8; row++) {
    for (let col = 0; col < 4; col++) {
      const levels = row > 5 ? 2 : 3;
      for (let level = 0; level < levels; level++) {
        const x = (col - 1.5) * 5.3, z = -37 + row * 9.3, y = 10 + level * 3.4;
        const color = material(colors[(row * 3 + col + level) % colors.length]);
        box(parent, x, y, z, 4.9, 3.2, 8.8, color);
        if (!miniature) {
          // Corrugation and locking rails on the visible long sides.
          for (const side of [-1, 1]) {
            for (let i = 0; i < 6; i++) {
              box(parent, x + side * 2.47, y, z - 3.7 + i * 1.45, 0.055, 2.9, 0.075, M.dark);
            }
          }
          box(parent, x, y - 1.5, z - 4.43, 4.7, 0.08, 0.05, M.steel);
        }
        count++;
      }
    }
  }
  return count;
}

export function buildShip(parent, k, {scale = 1, bulb = true, miniature = false, name = 'MARIANNE'} = {}) {
  const {mesh, box, cyl, ball, rod, label, M, material} = k;
  const root = new T.Group(); root.scale.setScalar(scale); parent.add(root);
  root.name = name;
  const lower = mesh(root, hullBand(-10.4, 0, 6), M.red);
  const upper = mesh(root, hullBand(0, 8.2, 3), M.navy);
  const deck = mesh(root, deckGeometry(), M.cream);
  deck.material = deck.material.clone(); deck.material.side = T.DoubleSide;
  const bulbGroup = new T.Group(); root.add(bulbGroup);
  if (bulb) {
    mesh(bulbGroup, bulbGeometry(), M.red);
  }
  const count = addContainers(root, k, miniature);
  // Aft accommodation/bridge, with genuine depth on every visible facade.
  box(root, 0, 14.1, 51, 20, 12, 16, M.white);
  box(root, 0, 21, 51, 23, 2.8, 17.5, M.cream);
  for (const side of [-1, 1]) {
    box(root, side * 11.55, 21, 51, 0.06, 1.3, 16, M.teal);
    for (let z = 45; z <= 57; z += 3) box(root, side * 10.05, 14.4, z, 0.05, 1.4, 1.5, M.navy);
  }
  box(root, 0, 21, 42.19, 20.5, 1.3, 0.05, M.teal);
  box(root, 3.5, 25, 55, 4, 6, 5, M.orange);
  box(root, 3.5, 28.1, 55, 4.2, 0.45, 5.2, M.navy);
  rod(root, [-4, 22.5, 51], [-4, 34, 51], 0.12, M.steel);
  rod(root, [-8, 31, 51], [1, 31, 51], 0.10, M.steel);
  for (const z of [-60, -53]) {
    for (const x of [-3, 3]) cyl(root, x, 8.65, z, 0.45, 0.8, M.steel);
  }
  for (const sign of [-1, 1]) {
    for (let z = -58; z < 65; z += 8) {
      const x = sign * (halfBeam(z) - 0.4);
      rod(root, [x, 8.3, z], [x, 9.5, z], 0.035, M.white);
    }
    rod(root, [sign * 12, 9.4, -40], [sign * 12, 9.4, 42], 0.035, M.white);
  }
  // Propeller and rudder are below the stern, not under the bow.
  rod(root, [0, -7.5, 57], [0, -7.5, 67], 0.22, M.steel);
  const propeller = new T.Group(); propeller.position.set(0, -7.5, 65); root.add(propeller);
  for (let i = 0; i < 4; i++) {
    const blade = box(propeller, 0, 1.2, 0, 0.65, 2.8, 0.24, M.yellow);
    blade.rotation.z = i * Math.PI / 2;
    blade.position.set(Math.sin(i * Math.PI / 2) * 1.1, Math.cos(i * Math.PI / 2) * 1.1, 0);
  }
  box(root, 0, -6.5, 69, 0.25, 5.5, 3, M.navy);
  if (!miniature) {
    label(root, name, 11.1, 4.2, -43, 8.5, 1.4, Math.PI / 2, '#173944');
    for (const side of [-1, 1]) {
      for (let y = -8; y <= 2; y += 1) box(root, side * 5.8, y, -59, 0.05, 0.05, 0.7, M.white);
    }
  }
  batchStatic(root, new Set([propeller])); batchStatic(propeller);
  return {root, propeller, bulb: bulbGroup, containers: count, scale, length: 132 * scale,
    bowPoint: [0, -7.1, -72], lower, upper};
}
