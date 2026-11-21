import * as T from '../../../engine/vendor/three.module.js';
export {T};
export const colors = {
  cream:0xf7eedb, ink:0x292e31, brick:0x9c5d49, mortar:0xcbb795,
  slate:0x415d70, teal:0x377c80, red:0xaa5752, gold:0xc9a15c,
  ground:0xa89e89, syrup:0x48291d, copper:0xb57b49, wood:0x876447,
};
const cache = new Map();
const cube = new T.BoxGeometry(1,1,1);
const sphere = new T.SphereGeometry(1,24,16);
const smallSphere = new T.SphereGeometry(1,8,6);
const curlSphere = new T.SphereGeometry(1,12,8);
const cylinder = new T.CylinderGeometry(1,1,1,16);
export function material(color, roughness=.85, metalness=0) {
  const key = `${color}:${roughness}:${metalness}`;
  if (!cache.has(key)) cache.set(key,new T.MeshStandardMaterial({color,roughness,metalness}));
  return cache.get(key);
}
export function mesh(parent, geometry, color, position, size=[1,1,1]) {
  const m = new T.Mesh(geometry, typeof color==='object'?color:material(color));
  m.position.fromArray(position);
  m.scale.fromArray(size);
  parent.add(m);
  return m;
}
export function group(parent, position=[0,0,0]) {
  const g = new T.Group();
  g.position.fromArray(position);
  parent.add(g);
  return g;
}
export const box = (p,c,pos,size) => mesh(p,cube,c,pos,size);
export const ball = (p,c,pos,size) => mesh(p,typeof size==='number'&&size<.07?smallSphere:Array.isArray(size)&&Math.max(...size)<.14?curlSphere:sphere,c,pos,typeof size==='number'?[size,size,size]:size);
export const tube = (p,c,pos,r,h) => mesh(p,cylinder,c,pos,[r,h,r]);
export function setSegment(m, a, b, radius) {
  const start = a.isVector3?a:new T.Vector3(...a);
  const end = b.isVector3?b:new T.Vector3(...b);
  const d = end.clone().sub(start);
  const len = Math.max(.00001,d.length());
  m.position.copy(start).addScaledVector(d,.5);
  m.scale.set(radius,len,radius);
  m.quaternion.setFromUnitVectors(new T.Vector3(0,1,0),d.divideScalar(len));
}
export function segment(p,c,a,b,r=.035) {
  const m = mesh(p,cylinder,c,[0,0,0]);
  setSegment(m,a,b,r);
  return m;
}
export function label(parent,text,position,width=3,height=.55,opts={}) {
  const canvas=document.createElement('canvas');
  canvas.width=1024;
  canvas.height=Math.max(64,Math.round(1024*height/width));
  const ctx=canvas.getContext('2d');
  ctx.fillStyle=opts.background||'#ede0bf';
  ctx.fillRect(0,0,canvas.width,canvas.height);
  ctx.strokeStyle=opts.color||'#324344';
  ctx.lineWidth=6;
  ctx.strokeRect(10,10,1004,canvas.height-20);
  ctx.fillStyle=opts.color||'#324344';
  ctx.textAlign='center';
  ctx.textBaseline='middle';
  ctx.font=`700 ${Math.min(canvas.height*.53,1024/(text.length*.59))}px serif`;
  ctx.fillText(text,512,canvas.height/2,970);
  const texture=new T.CanvasTexture(canvas);
  texture.colorSpace=T.SRGBColorSpace;
  const m=new T.Mesh(new T.PlaneGeometry(width,height),new T.MeshBasicMaterial({map:texture,side:T.DoubleSide}));
  m.position.fromArray(position);
  parent.add(m);
  return m;
}
let aoTexture;
export function contactShadow(parent,radius=.5,opacity=.22) {
  if (!aoTexture) {
    const c=document.createElement('canvas');c.width=c.height=64;
    const x=c.getContext('2d'), g=x.createRadialGradient(32,32,1,32,32,31);
    g.addColorStop(0,'rgba(24,25,24,.65)');
    g.addColorStop(.45,'rgba(24,25,24,.3)');
    g.addColorStop(1,'rgba(24,25,24,0)');
    x.fillStyle=g;x.fillRect(0,0,64,64);
    aoTexture=new T.CanvasTexture(c);
  }
  const m=new T.Mesh(new T.PlaneGeometry(radius*2,radius*2),new T.MeshBasicMaterial({map:aoTexture,transparent:true,opacity,depthWrite:false}));
  m.rotation.x=-Math.PI/2;m.position.y=.018;parent.add(m);return m;
}
/** Merge only immutable, opaque geometry. Texture labels and dynamic rigs stay independent. */
export function batch(root) {
  root.updateWorldMatrix(true,true);
  const inverse=root.matrixWorld.clone().invert();
  const bins=new Map(), old=[];
  root.traverse(o=>{
    if (!o.isMesh||o.material.map||o.material.transparent) return;
    let bin=bins.get(o.material);
    if (!bin) bins.set(o.material,bin={position:[],normal:[]});
    const g=o.geometry.clone();
    g.applyMatrix4(inverse.clone().multiply(o.matrixWorld));
    const flat=g.index?g.toNonIndexed():g;
    bin.position.push(flat.getAttribute('position').array.slice());
    bin.normal.push(flat.getAttribute('normal').array.slice());
    old.push(o);g.dispose();if(flat!==g)flat.dispose();
  });
  old.forEach(o=>o.removeFromParent());
  for (const [mat,bin] of bins) {
    const g=new T.BufferGeometry();
    for(const name of ['position','normal']) {
      const length=bin[name].reduce((n,a)=>n+a.length,0);
      const result=new Float32Array(length);let offset=0;
      for(const a of bin[name]){result.set(a,offset);offset+=a.length;}
      g.setAttribute(name,new T.BufferAttribute(result,3));
    }
    g.computeBoundingSphere();root.add(new T.Mesh(g,mat));
  }
}
export function barrel(parent,x,z) {
  const root=group(parent,[x,0,z]);
  tube(root,0x815639,[0,.65,0],.43,1.3);
  for(const y of [.14,.65,1.16])tube(root,0x424948,[0,y,0],.445,.055);
  return root;
}
export function pail(parent,position=[0,0,0]) {
  const root=group(parent,position);
  tube(root,0x858b83,[0,.22,0],.245,.44);
  tube(root,colors.syrup,[0,.446,0],.21,.014);
  const handle=new T.Mesh(new T.TorusGeometry(.23,.017,6,20,Math.PI),material(0x323b3b));
  handle.position.y=.44;root.add(handle);return root;
}
