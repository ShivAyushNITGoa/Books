import * as T from '../../engine/vendor/three.module.js';
import {texture,random} from '../alexandria/art.js';
import {batchStatic} from '../alexandria/batch.js';
export {texture,random,batchStatic};
export function kit(){
 const cache=new Map(),boxG=new T.BoxGeometry(1,1,1),cylG=new T.CylinderGeometry(1,1,1,16),ballG=new T.SphereGeometry(1,16,10);
 const mat=(color,shininess=12)=>{const k=color+shininess;if(!cache.has(k))cache.set(k,new T.MeshPhongMaterial({color,shininess,specular:'#7c9392'}));return cache.get(k)};
 function mesh(p,g,m,x=0,y=0,z=0,s=[1,1,1]){const o=new T.Mesh(g,m);o.position.set(x,y,z);o.scale.set(...s);p.add(o);return o}
 const box=(p,x,y,z,w,h,d,m)=>mesh(p,boxG,m,x,y,z,[w,h,d]);
 const cyl=(p,x,y,z,r,h,m)=>mesh(p,cylG,m,x,y,z,[r,h,r]);
 const ball=(p,x,y,z,rx,ry,rz,m)=>mesh(p,ballG,m,x,y,z,[rx,ry,rz]);
 function rod(p,a,b,r,m){const v=new T.Vector3(...a),w=new T.Vector3(...b),o=cyl(p,...v.clone().add(w).multiplyScalar(.5).toArray(),r,v.distanceTo(w),m);o.quaternion.setFromUnitVectors(new T.Vector3(0,1,0),w.sub(v).normalize());return o}
 function label(p,text,x,y,z,w,h,rotation=0,bg='#183d4b',ink='#fff3d2'){
  const tex=texture(1024,Math.max(96,Math.round(1024*h/w)),c=>{c.fillStyle=bg;c.fillRect(0,0,c.canvas.width,c.canvas.height);c.fillStyle=ink;c.font='850 85px Caption';c.textAlign='center';c.textBaseline='middle';c.fillText(text,512,c.canvas.height/2,950)});
  const o=mesh(p,new T.PlaneGeometry(w,h),new T.MeshBasicMaterial({map:tex,side:T.DoubleSide}),x,y,z);o.rotation.y=rotation;return o;
 }
 const M={cream:mat('#e8e2c7'),white:mat('#f0f3e4'),navy:mat('#203c4a'),teal:mat('#357f87'),steel:mat('#9caeb0',65),black:mat('#1a2d37'),orange:mat('#ff6c28',45),gold:mat('#dfb464'),green:mat('#3a6650'),wood:mat('#927450'),dark:mat('#647b7b')};
 return {mat,mesh,box,cyl,ball,rod,label,M};
}
export function recorder(parent,p,yaw,k){
 const {box,cyl,rod,label,M}=k,g=new T.Group();g.position.set(...p);g.rotation.y=yaw;g.scale.setScalar(.8);parent.add(g);
 const shell=new T.MeshPhongMaterial({color:'#ff6c28',shininess:42,specular:'#aebfb9'});
 box(g,0,0,0,1.9,1.1,1.18,shell);box(g,0,-.63,0,2.18,.16,1.42,M.steel);
 for(const x of [-.98,.98])box(g,x,0,0,.1,1.17,1.28,shell);
 for(const z of [-.43,.43]){box(g,0,.58,z,2.05,.1,.12,M.steel);for(const x of [-.98,.98])cyl(g,x,.66,z,.065,.04,M.navy)}
 for(const x of [-.4,.4])rod(g,[x,.6,0],[x,.92,0],.045,M.navy);rod(g,[-.4,.92,0],[.4,.92,0],.045,M.steel);
 label(g,'FLIGHT RECORDER',0,.18,.604,1.4,.28,0,'#f4edcf','#213b45');label(g,'FLIGHT RECORDER',0,.18,-.604,1.4,.28,Math.PI,'#f4edcf','#213b45');
 label(g,'DO NOT OPEN',0,-.13,.605,1.1,.18,0,'#edba76','#213b45');label(g,'CRASH SURVIVABLE',0,-.13,-.605,1.4,.18,Math.PI,'#edba76','#213b45');
 // Vents have their own lower band, separate from ALL labels.
 for(const z of [-.62,.62])for(let i=0;i<8;i++)box(g,-.68+i*.18,-.43,z,.055,.13,.025,M.navy);
 for(const sign of [-1,1]){box(g,sign*1.045,0,0,.035,.8,.75,M.steel);for(let j=0;j<4;j++)box(g,sign*1.068,.18-j*.12,0,.018,.03,.48,M.navy)}
 const beacon=cyl(g,1.28,-.23,0,.17,.66,M.steel);beacon.rotation.z=Math.PI/2;const cap=cyl(g,1.63,-.23,0,.16,.035,M.navy);cap.rotation.z=Math.PI/2;
 const bands=new T.Group();g.add(bands);for(const x of [-.83,.83])for(const z of [-.614,.614])box(bands,x,0,z,.105,1.03,.016,new T.MeshBasicMaterial({color:'#fff0b0'}));
 batchStatic(g,new Set([bands]));batchStatic(bands);return {g,shell,bands};
}
export function airplane(parent,k,scale=1){
 const {box,cyl,ball,label,M}=k,g=new T.Group();g.scale.setScalar(scale);parent.add(g);const fus=cyl(g,0,0,0,.7,12,M.white);fus.rotation.z=Math.PI/2;
 ball(g,-6,0,0,1.3,.69,.69,M.white);ball(g,6,0,0,1,.6,.6,M.white);
 for(const z of [-.69,.69]){box(g,-5.8,.14,z,.9,.38,.04,M.teal);for(let i=0;i<15;i++)box(g,-4.7+i*.64,.2,z,.29,.30,.035,M.navy)}
 const wing=box(g,.1,-.17,0,2.3,.15,11,M.cream);wing.rotation.y=.22;
 for(const s of [-1,1]){const e=cyl(g,-.7,-.8,s*3.2,.46,1.8,M.steel);e.rotation.z=Math.PI/2;const intake=cyl(g,-1.62,-.8,s*3.2,.36,.035,M.navy);intake.rotation.z=Math.PI/2;box(g,5,.08,s*1.8,1.5,.13,3.8,M.white)}
 const tail=box(g,4.9,1.2,0,1.8,2.8,.13,M.teal);tail.rotation.z=-.25;
 label(g,'AERO',4.9,1.5,.08,1.3,.35);label(g,'AERO',4.9,1.5,-.08,1.3,.35,Math.PI);batchStatic(g);return g;
}
