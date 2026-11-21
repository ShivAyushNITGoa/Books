import {T,group,box,ball,tube,segment,label,batch,material,colors} from '../engine/geometry.js';
import {TAU,clamp,smooth,easeRange} from '../engine/math.js';
import {episodeTime} from './geography.js';

/** Closed solid curved steel panel, including thickness and edge caps. */
function steelPanelGeometry(start,end,radius,height,thickness=.075) {
  const positions=[],indices=[];
  const steps=6;
  for(let layer=0;layer<2;layer++) {
    const r=radius-layer*thickness;
    for(let j=0;j<=steps;j++) {
      const a=start+(end-start)*j/steps;
      for(const y of [0,height])positions.push(Math.sin(a)*r,y,Math.cos(a)*r);
    }
  }
  const stride=(steps+1)*2;
  function quad(a,b,c,d){indices.push(a,b,c,a,c,d);}
  for(let j=0;j<steps;j++) {
    const a=j*2,b=a+2;
    quad(a,b,b+1,a+1);
    quad(stride+a+1,stride+b+1,stride+b,stride+a);
    quad(a,stride+a,stride+b,b);
    quad(a+1,b+1,stride+b+1,stride+a+1);
  }
  quad(0,1,stride+1,stride);
  quad(steps*2,stride+steps*2,stride+steps*2+1,steps*2+1);
  const geometry=new T.BufferGeometry();
  geometry.setAttribute('position',new T.Float32BufferAttribute(positions,3));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();
  return geometry;
}

export function buildTank(parent) {
  const root=group(parent,[0,0,-26]);
  const base=group(root);
  tube(base,0x817e6c,[0,.1,0],16.3,.2);
  const panels=[];
  for(let i=0;i<20;i++) {
    const start=i/20*TAU,end=(i+1)/20*TAU;
    const mid=(start+end)/2;
    const pivot=group(root,[Math.sin(mid)*16,0,Math.cos(mid)*16]);
    const fixed=group(pivot,[-Math.sin(mid)*16,0,-Math.cos(mid)*16]);
    const geometry=steelPanelGeometry(start,end,16,18);
    const plate=new T.Mesh(geometry,material(i%3===0?0x70513c:0x79553d,.79));
    fixed.add(plate);
    for(let y=1.2;y<18;y+=2.8) {
      for(let j=0;j<6;j++) {
        const a=start+(end-start)*j/5;
        ball(fixed,0xc0a27a,[Math.sin(a)*16.035,y,Math.cos(a)*16.035],.038);
      }
      const points=[];
      for(let j=0;j<7;j++) {
        const a=start+(end-start)*j/6;
        points.push(new T.Vector3(Math.sin(a)*16.025,y-.13,Math.cos(a)*16.025));
      }
      const line=new T.Mesh(new T.TubeGeometry(new T.CatmullRomCurve3(points),6,.023,4,false),material(0x4f4033));
      fixed.add(line);
    }
    batch(fixed);
    panels.push({pivot,mid,index:i});
  }
  const roof=group(root,[0,18.07,0]);
  tube(roof,0x947756,[0,0,0],16.05,.16);
  const roofSeams=group(roof);
  for(let i=0;i<12;i++)segment(roofSeams,0x725e46,[0,.09,0],[Math.sin(i/12*TAU)*15.8,.09,Math.cos(i/12*TAU)*15.8],.025);
  batch(roofSeams);
  const signRoot=group(root);
  label(signRoot,'PURITY DISTILLING · MOLASSES STORAGE',[0,10.5,16.08],10,.8);
  label(signRoot,'50 FT HIGH · 90 FT ACROSS',[0,8.9,16.08],8,.6);
  // Thin leak trails follow the actual cylindrical skin, not a disconnected wall.
  const stains=group(root);
  for(let i=0;i<7;i++) {
    const x=-5.7+Math.sin(i*3)*.13;
    const z=Math.sqrt(16*16-x*x)+.035;
    const y=.6+i*.44;
    segment(stains,0x49301f,[x,y-.34,z],[x+.035,y+.18,z],.012+i*.001);
  }
  const drops=[];
  for(let i=0;i<5;i++)drops.push(ball(root,0x4a2c19,[-5.7,1,15], [.03,.075,.03]));
  const paint=group(root);
  for(let i=0;i<15;i++) {
    const x=-4.1+(i-7)*.13,z=Math.sqrt(256-x*x)+.05;
    segment(paint,0x805438,[x,.4,z],[x,3.1,z],.073);
  }
  batch(paint);batch(stains);batch(base);
  return {
    root,panels,
    update(t) {
      const e=episodeTime(t);
      const failure=smooth((e-0)/8);
      for(const p of panels) {
        const stagger=smooth((e-(p.index%5)*.23)/6.5);
        p.pivot.quaternion.setFromAxisAngle(new T.Vector3(Math.cos(p.mid),0,-Math.sin(p.mid)),stagger*(1.48+(p.index%4)*.025));
        p.pivot.position.y=stagger*.08;
      }
      roof.visible=e<5;
      roof.position.y=18.07-17.6*failure;
      roof.rotation.set(failure*.08,0,failure*-.055);
      signRoot.visible=e<4;
      stains.visible=e<0;
      paint.visible=t>=70&&t<85;
      drops.forEach((drop,i)=>{
        drop.visible=e<0&&t>=25;
        const x=-5.7,z=Math.sqrt(256-x*x)+.12;
        drop.position.set(x,3.2-((t*.8+i*.53)%2.9),z);
      });
      return {failure,panels:panels.length};
    },
  };
}
