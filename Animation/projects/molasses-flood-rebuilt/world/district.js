import {T,group,box,ball,tube,segment,batch,label,barrel,colors,material} from '../engine/geometry.js';
import {seedRandom} from '../engine/math.js';
import {WAREHOUSES,tableLocal} from './geography.js';

/** One connected harbor district; no scene-sized ground plates or set visibility toggles. */
export function buildDistrict(parent) {
  const root=group(parent),staticRoot=group(root),random=seedRandom(1919);
  const obstacles=[];
  box(staticRoot,0xa89d87,[-20,-.36,25],[100,.7,146]);
  box(staticRoot,0x837f73,[0,-.035,27],[19,.06,94]);
  box(staticRoot,0x6a8787,[54,-.93,0],[48,.2,190]);
  box(staticRoot,0x6a8787,[-10,-.93,-78],[160,.2,59]);
  // L-shaped working waterfront physically joins tank wharf and eastern quay.
  box(staticRoot,0xb4a388,[28,.05,-1],[4,.6,139]);
  box(staticRoot,0xb4a388,[-5,.05,-46],[68,.6,4]);
  for(const side of [-1,1])box(staticRoot,0xb6ac96,[side*10.5,.13,26],[2.2,.3,96]);
  for(let z=-14;z<74;z+=1.25) {
    for(let x=-9;x<10;x+=1.35) {
      const shade=[0x8c897c,0x969080,0x898578][Math.floor(random()*3)];
      // Coarse irregular pavers are batched; seams are real inset geometry.
      box(staticRoot,shade,[x+(Math.round(z)%2)*.4,-.004,z],[1.30,.035,1.19]);
    }
  }
  for(let z=-41;z<67;z+=5.4) {
    tube(staticRoot,0x554c3e,[28.1,.63,z],.18,1.25);
    box(staticRoot,0x383f3c,[28.1,1.29,z],[.42,.12,.42]);
  }
  for(let x=-30;x<30;x+=5.8)tube(staticRoot,0x61523e,[x,.65,-44.8],.18,1.3);
  // Warehouse clusters are deliberately arranged around open camera corridors.
  for(const [x,z,w,d,h,c] of WAREHOUSES) {
    const g=building(staticRoot,x,z,w,d,h,c,random);
    obstacles.push({x,z,w,d,h,kind:'building'});
  }
  // Lamps, drains and handrails give the route human-scale foreground occlusion.
  for(const z of [-8,8,24,39,58]) {
    for(const side of [-1,1]) {
      const x=side*12.5;
      tube(staticRoot,0x344844,[x,2.18,z],.06,4.35);
      segment(staticRoot,0x344844,[x,4.3,z],[x-side*.6,4.3,z],.045);
      box(staticRoot,0x31433f,[x-side*.6,4.1,z],[.33,.47,.33]);
      ball(staticRoot,0xf5d9a1,[x-side*.6,4.1,z],[.12,.18,.12]);
      box(staticRoot,0x4e554c,[side*9.2,.014,z+2],[.38,.025,.68]);
      for(let i=0;i<5;i++)box(staticRoot,0xa6a18b,[side*9.2,.03,z+1.77+i*.11],[.31,.012,.035]);
    }
  }
  for(let i=0;i<18;i++) {
    const x=i%2?-12.5:25,z=-35+i*5.5;
    barrel(staticRoot,x,z);
    if(i%3===0)crate(staticRoot,x+1,z+1,.8);
  }
  for(let i=0;i<14;i++) {
    const x=-28+random()*15,z=55+random()*10;
    crate(staticRoot,x,z,.55+random()*.45);
  }
  // Connected distant shoreline and warehouses, rather than an empty horizon.
  box(staticRoot,0xa59b81,[-15,-.36,-82],[144,.7,28]);
  box(staticRoot,0xa59b81,[-65,-.36,-60],[18,.7,68]);
  for(let i=0;i<12;i++) {
    building(staticRoot,-65+i*10,-83,8.5,12,9+(i%4)*2.2,[0x92715b,0xa17b60,0x886657][i%3],random);
  }
  // Two simple distant cranes and cargo spars articulate the working harbor.
  for(const x of [-45,14]) {
    segment(staticRoot,0x665c43,[x,0,-66],[x,13,-66],.12);
    segment(staticRoot,0x665c43,[x,12,-66],[x+7,12,-66],.09);
    segment(staticRoot,0x746c50,[x+7,12,-66],[x+7,5,-66],.025);
  }
  const distillery=makeDistillery(staticRoot);
  const office=makeInvestigation(staticRoot);
  const court=makeCourt(staticRoot);
  const memorial=makeMemorial(staticRoot);
  const platform=makeRescuePlatform(staticRoot);
  const boat=makeBoat(root);
  batch(staticRoot);
  return {root,obstacles,boat,update(t){boat.position.y=Math.sin(t*.8)*.028;}};
}

function building(parent,x,z,width,depth,height,color,random) {
  const root=group(parent,[x,0,z]);
  box(root,color,[0,height/2,0],[width,height,depth]);
  box(root,0x55554c,[0,height+.13,0],[width+.5,.32,depth+.5]);
  box(root,0xc2ad89,[0,.36,depth/2+.06],[width,.7,.2]);
  box(root,0x754f38,[0,height+1.05,-depth*.2],[1.2,1.8,1.0]);
  // Brick courses and corners are deliberately less regular than the old blank boxes.
  for(let y=1;y<height;y+=.52) {
    box(root,0xaa8869,[0,y,depth/2+.012],[width,.026,.025]);
  }
  for(let level=0;level<3;level++) {
    for(let col=-1;col<=1;col++) {
      const xx=col*width*.28,yy=1.65+level*2.6;
      if(yy>height-.8)continue;
      box(root,0xd3bf98,[xx,yy,depth/2+.055],[1.55,1.9,.14]);
      box(root,0x526b70,[xx,yy+.02,depth/2+.14],[1.25,1.59,.06]);
      box(root,0xdac29a,[xx,yy,depth/2+.18],[.065,1.59,.025]);
      box(root,0xdac29a,[xx,yy+.1,depth/2+.18],[1.25,.065,.025]);
      box(root,0xd0b68b,[xx,yy-.98,depth/2+.20],[1.8,.12,.32]);
    }
  }
  const side=x<0?width/2:-width/2;
  for(let level=0;level<3;level++)for(const zz of [-depth*.25,depth*.25]) {
    box(root,0xc8b58f,[side+Math.sign(side)*.05,1.8+level*2.7,zz],[.12,1.9,1.45]);
    box(root,0x53686c,[side+Math.sign(side)*.13,1.8+level*2.7,zz],[.045,1.6,1.15]);
  }
  return root;
}

function crate(parent,x,z,size) {
  const g=group(parent,[x,size*.5,z]);
  box(g,0x99754e,[0,0,0],[size,size,size]);
  for(const yy of [-size*.35,size*.35])box(g,0x5b4b36,[0,yy,size*.51],[size*.93,.06,.04]);
  segment(g,0x604d36,[-size*.4,-size*.4,size*.52],[size*.4,size*.4,size*.52],.035);
  return g;
}

function makeDistillery(parent) {
  const root=group(parent,[-22,.36,-2]);
  box(root,0xb6a183,[0,-.17,0],[16,.34,14]);
  box(root,0x955e48,[0,3.5,-7],[16,7,.35]);
  for(const x of [-8,8])box(root,0x8b624b,[x,3.5,-2],[.4,7,10]);
  // Open-front loading door is actual access to the building, not a new set.
  for(const x of [-7.4,7.4])box(root,0x4e4c41,[x,3.5,6],[.35,7,.4]);
  box(root,0x514a3d,[0,7,6],[15,.35,.5]);
  label(root,'PURITY · DISTILLING WORKS',[0,6.15,-6.78],10,.75);
  tube(root,0xb17a49,[0,2,-3],.9,3.6);
  ball(root,0xbf8d55,[0,3.85,-3],[.9,.6,.9]);
  segment(root,0xb18853,[0,4.35,-3],[2.8,4.35,-3],.11);
  segment(root,0xb18853,[2.8,4.35,-3],[2.8,1.6,-1.7],.11);
  tube(root,0x82867a,[2.8,1.36,-1.7],.5,.45);
  box(root,0x6f533b,...tableLocal('distillery',root.position));
  for(const x of [-2.2,2.2])for(const z of [.9,2.1])box(root,0x5d4832,[x,.55,z],[.16,1.1,.16]);
  for(const x of [-5,5])for(const z of [-4,1])barrel(root,x,z);
  return root;
}

function makeInvestigation(parent) {
  const root=group(parent,[-18.5,.56,29]);
  box(root,0xb2a081,[0,-.15,0],[9,.3,7]);
  for(const x of [-4,4])for(const z of [-3,3])tube(root,0x6f583b,[x,1.9,z],.09,3.8);
  box(root,0x5a5e4c,[0,3.85,-2.3],[9,.18,2.4]);
  for(const x of [-3,-1,1,3])box(root,0x6f583b,[x,3.85,.6],[.12,.15,3.3]);
  box(root,0x755238,...tableLocal('investigation',root.position));
  for(const x of [-1.8,1.8])for(const z of [-.65,.65])box(root,0x5d462e,[x,.53,z],[.15,1.1,.15]);
  box(root,0xe4d3aa,[0,1.21,0],[3.5,.025,1.5]);
  box(root,0x7c8680,[.1,1.30,0],[1.5,.14,.7]);
  for(const x of [-.4,0,.4])ball(root,0xc9b681,[x,1.4,.05],.055);
  segment(root,0xc9a14c,[-.75,1.43,.52],[.8,1.43,.52],.025);
  label(root,'ENGINEERING REVIEW',[0,3,-2.9],6,.6);
  label(root,'LEAKS RECORDED · TESTS INADEQUATE',[0,2.2,-2.85],5,.52);
  return root;
}

function makeCourt(parent) {
  const root=group(parent,[18,.46,35]);
  box(root,0xb9a98d,[0,-.18,0],[14,.36,10]);
  box(root,0xbaa786,[0,4,-5],[14,8,.45]);
  for(const x of [-6,6])tube(root,0xd3c29d,[x,3.5,1],.38,7);
  box(root,0x907b5a,[0,7.3,1],[14,.5,2]);
  box(root,0x70503a,[0,1.45,-1.7],[7,.2,1.9]);
  box(root,0x684b36,[0,.7,-1.6],[6.5,1.4,.22]);
  label(root,'COURT · LIABILITY FINDING, 1925',[0,5.9,-4.72],7,.7);
  label(root,'THE OWNERS WERE RESPONSIBLE',[0,2.6,-4.7],6,.6);
  return root;
}

function makeRescuePlatform(parent) {
  const root=group(parent,[5.3,0,17.5]);
  for(let i=0;i<9;i++)box(root,i%2?0xa4865c:0x92724e,[(i-4)*.55,.63,0],[.53,.18,7]);
  for(const x of [-2.1,2.1])for(const z of [-3,3])box(root,0x6b5338,[x,.31,z],[.25,.62,.25]);
  const rampGeo=new T.BufferGeometry();
  rampGeo.setAttribute('position',new T.Float32BufferAttribute([
    -2.5,.72,3.5, 2.5,.72,3.5, 2.5,0,7.5,
    -2.5,.72,3.5, 2.5,0,7.5, -2.5,0,7.5,
    -4.8,0,-3.5, -2.5,.72,-3.5, -2.5,.72,-1.1,
    -4.8,0,-3.5, -2.5,.72,-1.1, -4.8,0,-1.1,
  ],3));
  rampGeo.computeVertexNormals();
  root.add(new T.Mesh(rampGeo,new T.MeshStandardMaterial({color:0x8f754f,roughness:.9,side:T.DoubleSide})));
  return root;
}

function makeMemorial(parent) {
  const root=group(parent,[0,.18,37]);
  box(root,0xa9a389,[0,-.1,0],[7,.2,5]);
  box(root,0x5a665f,[0,1.3,-1],[4.8,2.6,.42]);
  label(root,'THE GREAT MOLASSES FLOOD',[0,2.2,-.776],4.3,.4);
  label(root,'21 LIVES LOST · 1919',[0,1.52,-.775],3.9,.45);
  label(root,'REMEMBER THE WARNINGS',[0,.8,-.774],4,.4);
  for(let i=0;i<21;i++) {
    const x=(i%7-3)*.37,z=.4+Math.floor(i/7)*.34;
    tube(root,0xe8dabc,[x,.17,z],.055,.3);
    ball(root,0xf1c472,[x,.37,z],[.025,.06,.025]);
  }
  return root;
}

function makeBoat(parent) {
  const root=group(parent,[38,0,18]);
  ball(root,0x344c4e,[0,-.1,0],[1.6,.9,3.6]);
  box(root,0x7b6850,[0,.52,0],[2.6,.13,5.6]);
  box(root,0xd3c39d,[0,1.2,-.3],[1.9,1.35,2.25]);
  box(root,0x4b676b,[0,1.38,.84],[1.35,.55,.035]);
  box(root,0x4a5147,[0,1.95,-.3],[2.2,.18,2.5]);
  tube(root,0x52554b,[0,2.15,-1.1],.27,1.0);
  segment(root,0x8a7651,[0,.6,1.7],[0,4.1,1.7],.055);
  for(const x of [-1.3,1.3])segment(root,0xb2a07c,[x,.6,-2.5],[x,.6,2.4],.035);
  return root;
}
