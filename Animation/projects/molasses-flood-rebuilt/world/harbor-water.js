import {T,group,segment,material} from '../engine/geometry.js';
import {smooth,clamp} from '../engine/math.js';
import {episodeTime} from './geography.js';

/** Brown runoff joins the connected waterfront rather than switching sets. */
export function buildHarborRunoff(parent) {
  const root=group(parent);
  const geometry=new T.PlaneGeometry(25,40,28,36);
  geometry.rotateX(-Math.PI/2);
  geometry.translate(42.5,-.815,18);
  const position=geometry.getAttribute('position');
  const base=position.array.slice();
  const colors=new Float32Array(base.length);
  geometry.setAttribute('color',new T.BufferAttribute(colors,3));
  const surface=new T.Mesh(geometry,new T.MeshStandardMaterial({color:0xffffff,vertexColors:true,roughness:.5,metalness:.025}));
  root.add(surface);
  const outlet=segment(root,0x514d3c,[28.7,.12,18],[31.1,-.74,18],.19);
  const syrup=segment(root,0x664027,[29.9,-.2,18],[31.3,-.78,18],.14);
  return {root,update(t){
    const episode=episodeTime(t);
    const arrival=smooth((episode-5)/23);
    root.visible=arrival>0;
    if(!root.visible)return;
    for(let i=0;i<base.length;i+=3) {
      const x=base[i],z=base[i+2];
      const spread=Math.exp(-Math.pow((z-18)/(5+(x-30)*.7),2));
      const extent=smooth((arrival*28-(x-30))/8);
      const density=clamp(spread*extent*.82);
      // The opaque patch blends into the same base-water color at every edge.
      const edge=1-smooth((Math.abs(z-18)-15)/5);
      const d=density*edge;
      colors[i]=.125*(1-d)+.19*d;
      colors[i+1]=.225*(1-d)+.092*d;
      colors[i+2]=.225*(1-d)+.045*d;
      position.array[i+1]=-.811+Math.sin(x*.5+z*.35+t*.8)*.006;
    }
    position.needsUpdate=true;
    geometry.getAttribute('color').needsUpdate=true;
    geometry.computeVertexNormals();
  }};
}
