import {T,group,box,ball,material,colors} from '../engine/geometry.js';
import {seedRandom,clamp,smooth} from '../engine/math.js';
import {fluidHeightAt,floodFrontAt,episodeTime,residueAt} from './geography.js';

/**
 * Persistent Eulerian height field. Cells remain inundated after the crest
 * passes. Three broad surges, small ripples, eddies and retained muck share
 * one global episode clock; no scene action can turn them off/reset them.
 * This is art-directed shallow flood geometry, not a calibrated CFD solver.
 */
export function buildFlood(parent) {
  const root=group(parent);
  const nx=80,nz=130;
  const geometry=new T.PlaneGeometry(52,80,nx,nz);
  geometry.rotateX(-Math.PI/2);
  geometry.translate(1,0,27);
  const base=geometry.getAttribute('position').array.slice();
  const vertexColors=new Float32Array(base.length);
  geometry.setAttribute('color',new T.BufferAttribute(vertexColors,3));
  const fluidMaterial=new T.MeshStandardMaterial({color:0xffffff,vertexColors:true,roughness:.84,metalness:0,side:T.DoubleSide});
  const surface=new T.Mesh(geometry,fluidMaterial);
  surface.frustumCulled=false;
  root.add(surface);
  const debris=[];
  const random=seedRandom(2300000);
  for(let i=0;i<55;i++) {
    const home=[(random()-.5)*18,-5+random()*62];
    const plank=box(root,[0x8e6344,0x96734e,0xbaa078][i%3],[home[0],0,home[1]],[.09+random()*.13,.09,1.2+random()*1.4]);
    debris.push({mesh:plank,home,phase:random()*7,angle:random()*Math.PI});
  }
  for(let i=0;i<9;i++) {
    const home=[(random()-.5)*17,random()*48];
    const crate=box(root,0x806348,[home[0],0,home[1]],[.55,.5,.6]);
    debris.push({mesh:crate,home,phase:random()*7,angle:random()*Math.PI});
  }
  const eddies=[];
  for(const [x,z] of [[7,3],[7,12],[7,21],[-9,24],[9,39]]) {
    const geo=new T.TorusGeometry(.7,.018,4,32,Math.PI*1.55);
    const m=new T.Mesh(geo,material(0x8c6040,.4));
    m.rotation.x=-Math.PI/2;
    root.add(m);eddies.push({mesh:m,x,z});
  }
  const pos=geometry.getAttribute('position');
  return {
    root,surface,debris,
    update(t) {
      const e=episodeTime(t),front=floodFrontAt(t);
      root.visible=e>=0;
      if(e<0)return {front,wet:false};
      for(let i=0;i<base.length;i+=3) {
        const x=base[i],z=base[i+2];
        const h=fluidHeightAt(x,z,t);
        pos.array[i+1]=h;
        const variation=.94+.07*Math.sin(x*.8+z*.6)+.035*Math.sin(x*2.4-z*.9+t*.3);
        // Linear-space colors: deep treacle, never a clean blue-water sheet.
        vertexColors[i]=.19*variation;
        vertexColors[i+1]=.078*variation;
        vertexColors[i+2]=.035*variation;
      }
      pos.needsUpdate=true;
      geometry.getAttribute('color').needsUpdate=true;
      geometry.computeVertexNormals();
      for(const d of debris) {
        const age=Math.max(0,e-(d.home[1]+10)/2.4);
        const travel=Math.min(8,age*.22);
        const x=d.home[0]+Math.sin(age*.12+d.phase)*.25;
        const z=d.home[1]+travel;
        const h=fluidHeightAt(x,z,t);
        d.mesh.visible=residueAt(x,z,t)>.25&&h>.02;
        d.mesh.position.set(x,h+.08,z);
        d.mesh.rotation.set(Math.sin(t*.9+d.phase)*.025,d.angle+age*.012,Math.sin(t*.6+d.phase)*.035);
      }
      for(const eddy of eddies) {
        const h=fluidHeightAt(eddy.x,eddy.z,t);
        eddy.mesh.visible=h>.15;
        eddy.mesh.position.set(eddy.x,h+.013,eddy.z);
        eddy.mesh.rotation.z=t*.2;
      }
      return {front,wet:true,retainedDepth:fluidHeightAt(0,15,t)};
    },
  };
}
