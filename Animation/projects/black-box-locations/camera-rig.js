import * as T from '../../engine/vendor/three.module.js';
import {SITES} from './choreography.js';
export const YAWS={factory:0,forest:-.45,ocean:.2,rescue:1,airport:-.3};
export const RECORDER_EXTENTS={x:[-1.12,1.72],y:[-.72,1.02],z:[-.72,.72]};
export const CARRIER_EXTENTS=RECORDER_EXTENTS;
export function subjectMatrix(s){return new T.Matrix4().compose(new T.Vector3(...s.hero),new T.Quaternion().setFromAxisAngle(new T.Vector3(0,1,0),YAWS[s.site]),new T.Vector3(.8,.8,.8))}
export function corners(extents,matrix){const out=[];for(const x of extents.x)for(const y of extents.y)for(const z of extents.z)out.push(new T.Vector3(x,y,z).applyMatrix4(matrix));return out}
export function fitCamera(camera,s){
 camera.position.set(...s.eye);const aim=new T.Vector3(...s.aim);camera.lookAt(aim);camera.updateMatrixWorld(true);
 const tanY=Math.tan(camera.fov*Math.PI/360),tanX=tanY*camera.aspect,needs=[0];
 for(const point of corners(CARRIER_EXTENTS,subjectMatrix(s))){const v=point.applyMatrix4(camera.matrixWorldInverse),depth=-v.z;needs.push(Math.abs(v.x)/(tanX*.84)-depth,(v.y>=0?v.y/(tanY*.75):-v.y/(tanY*.55))-depth)}
 const max=Math.max(...needs),dolly=max+Math.log(needs.reduce((n,x)=>n+Math.exp((x-max)*8),0))/8;
 camera.position.addScaledVector(camera.position.clone().sub(aim).normalize(),dolly*s.focus);camera.lookAt(aim);camera.updateMatrixWorld(true);return dolly;
}
export function projectedBounds(points,camera){const min=[Infinity,Infinity],max=[-Infinity,-Infinity];for(const p of points){const v=p.clone().project(camera);min[0]=Math.min(min[0],v.x);min[1]=Math.min(min[1],v.y);max[0]=Math.max(max[0],v.x);max[1]=Math.max(max[1],v.y)}return {min,max}}
export function personBounds(p,camera){
 const right=new T.Vector3().setFromMatrixColumn(camera.matrixWorld,0);right.y=0;right.normalize();const vp=new T.Matrix4().multiplyMatrices(camera.projectionMatrix,camera.matrixWorldInverse);
 let polygon=[[-1,p.bottom??.02],[1,p.bottom??.02],[1,p.top??2.65],[-1,p.top??2.65]].map(([sign,y])=>{const v=new T.Vector3(p.x,y,p.z).addScaledVector(right,sign*(p.halfWidth??.62));return new T.Vector4(v.x,v.y,v.z,1).applyMatrix4(vp)});
 // Homogeneous clipping prevents false screen overlaps when a person passes
 // behind the camera or outside the frustum. It does not hide the character.
 for(const axis of ['x','y','z'])for(const sign of [-1,1]){const out=[];for(let i=0;i<polygon.length;i++){const a=polygon[i],b=polygon[(i+1)%polygon.length],da=a.w+sign*a[axis],db=b.w+sign*b[axis];if(da>=0)out.push(a);if((da>=0)!==(db>=0))out.push(a.clone().lerp(b,da/(da-db)))}polygon=out}
 if(!polygon.length)return {min:[1,1],max:[-1,-1],visible:false};
 return {min:[Math.min(...polygon.map(v=>v.x/v.w)),Math.min(...polygon.map(v=>v.y/v.w))],max:[Math.max(...polygon.map(v=>v.x/v.w)),Math.max(...polygon.map(v=>v.y/v.w))],visible:true};
}
export function overlap(a,b){const w=Math.max(0,Math.min(a.max[0],b.max[0],1)-Math.max(a.min[0],b.min[0],-1)),h=Math.max(0,Math.min(a.max[1],b.max[1],1)-Math.max(a.min[1],b.min[1],-1));const area=Math.max(0,Math.min(b.max[0],1)-Math.max(b.min[0],-1))*Math.max(0,Math.min(b.max[1],1)-Math.max(b.min[1],-1));return area>0?w*h/area:0}
