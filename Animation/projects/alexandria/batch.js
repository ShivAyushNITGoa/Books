import * as THREE from '../../engine/vendor/three.module.js';
/** Bake static meshes by material, retaining dynamic rigs, cloth and pivots.
 * This is geometry batching, not a flattened image: lighting, occlusion and camera
 * perspective still work on every vertex. Instanced meshes keep their instances. */
export function batchStatic(root,excluded=new Set()){
 root.updateMatrixWorld(true);const inverse=root.matrixWorld.clone().invert(),buckets=new Map(),remove=[];
 function visit(o){if(excluded.has(o))return;if(o.isMesh&&!o.isInstancedMesh&&!Array.isArray(o.material)){
  const key=o.material.uuid+':'+o.castShadow;let b=buckets.get(key);if(!b)buckets.set(key,b={material:o.material,shadow:o.castShadow,geos:[]});
  const geo=o.geometry.index?o.geometry.toNonIndexed():o.geometry.clone();geo.applyMatrix4(new THREE.Matrix4().multiplyMatrices(inverse,o.matrixWorld));b.geos.push(geo);remove.push(o);
 }else if(o.isInstancedMesh)return;for(const c of o.children)visit(c)}visit(root);
 for(const o of remove)o.removeFromParent();
 for(const b of buckets.values()){
  const g=new THREE.BufferGeometry();for(const name of ['position','normal','uv']){
   const size=name==='uv'?2:3,len=b.geos.reduce((n,geo)=>n+(geo.attributes[name]?.count||geo.attributes.position.count)*size,0),data=new Float32Array(len);let offset=0;
   for(const geo of b.geos){const a=geo.attributes[name];if(a)data.set(a.array,offset);offset+=geo.attributes.position.count*size}g.setAttribute(name,new THREE.BufferAttribute(data,size));
  }
  const mesh=new THREE.Mesh(g,b.material);mesh.castShadow=b.shadow;mesh.receiveShadow=true;root.add(mesh);b.geos.forEach(g=>g.dispose());
 }
}
