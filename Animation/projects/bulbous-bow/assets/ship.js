import * as T from '../../../engine/vendor/three.module.js';
import {batchStatic} from './drawing.js';
import {mix, clamp, smooth, sample} from '../direction/math.js';

export const SHIP = Object.freeze({length:132, beam:25, draft:10.4, deckY:8.2,
  bowZ:-66, bulbZ:-68.8, afloatOffset:2});
export const BULB = Object.freeze({frontZ:-72, rootZ:-60, bottomY:-10.0, shoulderY:-3.5});

// User-reference silhouette: a rounded forefoot, full rising shoulder and
// concave fairing into the stem. These are the HULL's stem stations, not a
// second object's centreline or an intersecting primitive.
export const STEM = Object.freeze([
  [-10.4,-61.8],[-10,-64],[-9.4,-67.3],[-8.6,-70.5],[-7.5,-72],
  [-6.5,-71.9],[-5.5,-70.8],[-4.5,-68.3],[-3.5,-65.6],[-2.4,-65.15],
  [0,-66],[8.2,-68.5],
].map(Object.freeze));
const STATIONS=[[-66,0],[-63,3.4],[-57,7.2],[-46,10.9],[-28,12.5],
  [0,12.5],[30,12.2],[48,11.5],[59,9.2],[66,4.6]];
function halfBeam(z){
  let i=0;while(i<STATIONS.length-2&&z>STATIONS[i+1][0])i++;
  const a=STATIONS[i],b=STATIONS[i+1];
  return mix(a[1],b[1],smooth((z-a[0])/(b[0]-a[0])));
}
export function stemZ(y,bulb=true){
  return bulb ? sample(STEM,clamp(y,-SHIP.draft,SHIP.deckY),1,1)[0]
    : -66+mix(4,-2.5,(y+SHIP.draft)/(SHIP.draft+SHIP.deckY));
}
function sectionScale(y){
  return y< -8 ? mix(.30,.80,clamp((y+10.4)/2.4)) : y<0 ? mix(.80,1,(y+8)/8) : 1;
}
export function hullPoint(y,u,side=1,bulb=true){
  const front=stemZ(y,bulb),z=mix(front,66,u),scale=sectionScale(y);
  // A shared fair waterline joins the extended stem to the actual ship beam.
  // There is no cylindrical neck, duplicate skin, internal cap or root seam.
  const join=-46;
  const w=z<join ? halfBeam(join)*scale*Math.sin(clamp((z-front)/(join-front))*Math.PI/2)**1.1
    : halfBeam(z)*scale;
  return [side*w,y,z];
}

/** One closed, welded, indexed hull including bulb, stem, keel and deck.
 * The red/navy/cream paint changes material groups, NOT the underlying mesh.
 * Every edge has two incident triangles, including at the bulb's shoulder.
 */
export function hullGeometry({bulb=true,miniature=false}={}){
  const ns=miniature?48:80,nl=miniature?32:48,nu=miniature?12:20;
  const ys=Array.from({length:nl+1},(_,i)=>mix(-SHIP.draft,0,i/nl));
  ys.push(...Array.from({length:nu},(_,i)=>(i+1)/nu*SHIP.deckY));
  const ring=ns*2+1,positions=[],indices=[],groups=[];
  for(const y of ys){
    for(let i=0;i<=ns;i++)positions.push(...hullPoint(y,(i/ns)**1.3,1,bulb));
    for(let i=ns;i>0;i--)positions.push(...hullPoint(y,(i/ns)**1.3,-1,bulb));
  }
  for(let row=0;row<ys.length-1;row++){
    const start=indices.length;
    for(let j=0;j<ring;j++){
      const a=row*ring+j,b=row*ring+(j+1)%ring,n=a+ring,m=b+ring;
      indices.push(a,n,b,b,n,m);
    }
    groups.push([start,indices.length-start,ys[row+1]<=0?0:1]);
  }
  const bottom=positions.length/3;positions.push(0,-SHIP.draft,0);
  const top=positions.length/3;positions.push(0,SHIP.deckY,0);
  let start=indices.length;
  for(let j=0;j<ring;j++)indices.push(bottom,j,(j+1)%ring);
  groups.push([start,indices.length-start,0]);start=indices.length;
  const offset=(ys.length-1)*ring;
  for(let j=0;j<ring;j++)indices.push(top,offset+(j+1)%ring,offset+j);
  groups.push([start,indices.length-start,2]);
  const geometry=new T.BufferGeometry();
  geometry.setAttribute('position',new T.Float32BufferAttribute(positions,3));
  geometry.setIndex(indices);geometry.computeVertexNormals();
  const paint=[];
  for(const g of groups){const last=paint.at(-1);if(last&&last[2]===g[2]&&last[0]+last[1]===g[0])last[1]+=g[1];else paint.push([...g]);}
  for(const g of paint)geometry.addGroup(...g);
  geometry.computeBoundingSphere();
  geometry.userData={integratedBulb:bulb,connectedHullSkins:1,independentBulbMeshes:0,ringVertices:ring,rows:ys.length};
  return geometry;
}

let featurePoints;
export function bulbSurfacePoints(){
  if(!featurePoints){
    featurePoints=[];
    for(let y=-9.9;y<=-3.5+.001;y+=.2)for(let u=0;u<=.115+.001;u+=.005){
      for(const side of [-1,1]){const p=hullPoint(y,u,side);if(p[2]<-63.8)featurePoints.push(p);}
    }
  }
  return featurePoints;
}
export function exposedBulbWidth(){
  return 2*Math.max(...bulbSurfacePoints().filter(p=>p[2]<-68.5).map(p=>Math.abs(p[0])));
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
  const skin=mesh(root,hullGeometry({bulb,miniature}),[M.red,M.navy,M.cream]);
  skin.name='Continuous hull, integral forefoot and flared stem';
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
  return {root, propeller, skin, integratedBulb: bulb, containers: count, scale, length: 132 * scale,
    bowPoint: [0, -7.5, -72], lower: skin, upper: skin};
}
