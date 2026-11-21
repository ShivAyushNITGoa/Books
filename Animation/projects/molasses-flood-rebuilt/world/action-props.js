import {T,group,box,ball,tube,segment,setSegment,batch,label,pail,material,colors} from '../engine/geometry.js';
import {clamp,smooth,mix,TAU} from '../engine/math.js';
import {episodeTime,fluidHeightAt,tableLocal,RAIL_POSTS} from './geography.js';

export function buildRailway(parent) {
  const root=group(parent),fixed=group(root);
  for(const x of [5.75,8.25]) {
    box(fixed,0x354a49,[x,5.55,-7],[.14,.18,20]);
    box(fixed,0x354a49,[x,5.55,35.5],[.14,.18,57]);
  }
  for(let z=-17;z<64;z+=1.1)if(z<3||z>7)box(fixed,0x6e5940,[7,5.33,z],[3.35,.16,.18]);
  for(const z of [...new Set(RAIL_POSTS.map(p=>p[1]))]) {
    for(const x of [5.75,8.25]) {
      box(fixed,0x425753,[x,2.65,z],[.2,5.3,.25]);
      box(fixed,0x5a6759,[x,.15,z],[.55,.3,.6]);
    }
    box(fixed,0x425753,[7,5.12,z],[3.5,.24,.32]);
    segment(fixed,0x425753,[5.75,.7,z],[8.25,4.8,z],.055);
  }
  const sag=group(root,[7,5.55,3]);
  for(const x of [-1.25,1.25])box(sag,0x354a49,[x,0,2],[.14,.18,4]);
  for(let z=.35;z<4;z+=1.1)box(sag,0x6e5940,[0,-.2,z],[3.35,.16,.18]);
  const post=group(root,[8.25,0,4]);
  box(post,0x425753,[0,2.65,0],[.2,5.3,.25]);
  const train=group(root,[7,5.72,-5]);
  const cars=[];
  for(const z of [0,-6.5]) {
    const car=group(train,[0,0,z]),shell=group(car);
    box(shell,0x724d38,[0,1.05,0],[2.45,1.8,5.9]);
    ball(shell,0x3d4944,[0,2.05,0],[1.36,.23,3.05]);
    for(const x of [-1.23,1.23])for(let zz=-2.1;zz<2.3;zz+=.83) {
      box(shell,0xd4bc8a,[x,1.38,zz],[.035,.73,.62]);
      box(shell,0x52483a,[x,1.38,zz],[.05,.035,.62]);
    }
    for(const x of [-.71,.71]) {
      box(shell,0x9a8867,[x,1.55,2.97],[.6,.65,.035]);
      ball(shell,0xeace8d,[x,.86,3],.09);
    }
    for(const x of [-1,1])for(const zz of [-1.7,1.7]) {
      const wheel=tube(shell,0x343d3c,[x,.05,zz],.27,.14);
      wheel.rotation.z=Math.PI/2;
    }
    batch(shell);cars.push(car);
  }
  batch(fixed);
  return {root,update(t){
    const e=episodeTime(t),damage=smooth((e-7)/6);
    sag.rotation.x=damage*.19;
    post.rotation.z=damage*-.28;
    train.position.z=e<0?-11:-11+8.5*smooth(Math.min(e,26)/26);
    train.rotation.z=damage*-.009;
    return {trainFront:train.position.z+3,gapStart:3,damage};
  }};
}

function buildHorse(parent) {
  const root=group(parent,[-8,0,6]),body=group(root);
  ball(body,0x836044,[0,1.25,0],[.37,.48,.85]);
  ball(body,0x836044,[0,1.68,.64],[.25,.52,.28]);
  ball(body,0x836044,[0,2.03,.81],[.24,.31,.32]);
  ball(body,0x5d4634,[0,1.96,1.07],[.23,.18,.26]);
  for(const x of [-.16,.16]) {
    ball(body,0x463c31,[x,2.29,.69],[.07,.20,.065]);
    ball(body,0x272d2b,[x*1.44,2.10,.89],[.021,.026,.018]);
  }
  segment(body,0x42362c,[0,1.59,.48],[0,2.1,.6],.075);
  for(const x of [-.23,.23])for(const z of [-.52,.52]) {
    segment(body,0x624b37,[x,1.13,z],[x,.58,z+.05],.065);
    segment(body,0x624b37,[x,.58,z+.05],[x,.13,z+.1],.052);
    ball(body,0x39372f,[x,.1,z+.12],[.09,.1,.12]);
  }
  segment(body,0x41362d,[0,1.45,-.73],[0,.85,-1.15],.055);
  const cart=group(root,[0,0,-2.2]);
  box(cart,0x8c6949,[0,.7,0],[1.55,.16,2.2]);
  for(const x of [-.72,.72])box(cart,0xa38157,[x,1.0,0],[.1,.48,2.2]);
  const wheels=[];
  for(const x of [-.88,.88])for(const z of [-.7,.7]) {
    const wheel=new T.Mesh(new T.TorusGeometry(.46,.055,6,20),material(0x514733));
    wheel.rotation.y=Math.PI/2;wheel.position.set(x,.47,z);cart.add(wheel);
    for(let i=0;i<6;i++)segment(cart,0x735838,[x,.47,z],[x,.47+Math.sin(i/6*TAU)*.42,z+Math.cos(i/6*TAU)*.42],.018);
    wheels.push(wheel);
  }
  for(const x of [-.45,.45])segment(root,0x66503b,[x,.85,-2],[x,1.0,.3],.037);
  batch(body);
  return {root,wheels,update(t){
    const e=episodeTime(t);
    const travel=e<0?Math.sin(t*.03)*.2:Math.min(2,e*.18);
    root.position.z=6+travel;
    wheels.forEach(w=>w.rotation.x=travel/.46);
  }};
}

function buildDemonstration(parent) {
  const root=group(parent,[-6,.28,17]);
  const fixed=group(root);
  box(fixed,0x8a6947,...tableLocal('demonstration',root.position));
  for(const x of [-1.6,1.6])for(const z of [-.6,.6])box(fixed,0x655037,[x,.48,z],[.14,.97,.14]);
  const cups=[],spoons=[],streams=[],drops=[];
  for(let i=0;i<2;i++) {
    const x=i?.88:-.88;
    const cup=group(root,[x,0,0]);
    tube(cup,0xe2d5b7,[0,1.27,0],.43,.39);
    tube(cup,i?0x50301e:0x7c9f9e,[0,1.475,0],.38,.018);
    const text=label(cup,i?'MOLASSES':'WATER',[0,1.25,.44],.86,.23);
    cups.push({root:cup,text});
    const spoon=group(root,[x,0,0]);
    ball(spoon,0xc7c5ac,[0,2.35,0],[.17,.025,.25]);
    segment(spoon,0xbabca9,[0,2.35,-.16],[0,2.98,-.5],.025);
    spoons.push(spoon);
    streams.push(tube(root,i?0x624024:0x9cb8b4,[x,1.9,0],i?.055:.018,.8));
    const beads=[];
    for(let j=0;j<5;j++)beads.push(ball(root,0x9cb8b4,[x,2,0],[.032,.06,.032]));
    drops.push(beads);
  }
  batch(fixed);
  return {root,update(t){
    const demo=t>=123&&t<=132;
    for(let i=0;i<2;i++) {
      cups[i].root.visible=i===1||demo;
      cups[i].text.visible=demo||t>=22.2;
      spoons[i].visible=i===1||demo;
      streams[i].visible=i===1;
      for(let j=0;j<5;j++) {
        drops[i][j].visible=demo&&i===0;
        drops[i][j].position.y=2.29-((t*2.6+j*.17)%.8);
      }
    }
  }};
}

export function buildActionProps(parent,actors) {
  const root=group(parent),horse=buildHorse(root),demo=buildDemonstration(root);
  const childPail=pail(root,[-5.7,0,-10]);
  const roller=group(root);
  const rollerHead=tube(roller,0x795136,[0,0,0],.105,.46);
  rollerHead.rotation.z=Math.PI/2;
  const rollerHandle=segment(root,0xc2a16d,[0,0,0],[0,1,0],.025);
  const rope=segment(root,0xd5bd8a,[0,0,0],[1,0,0],.026);
  const hose=segment(root,0x354946,[0,0,0],[0,1,0],.045);
  const nozzle=tube(root,0xa28f61,[0,0,0],.065,.24);
  const water=[];
  for(let i=0;i<25;i++)water.push(ball(root,0xc1d2c3,[0,0,0],[.025,.025,.025]));
  const sand=box(root,0xc3ad7d,[3,.76,15],[.7,.025,1.7]);
  const ledger=label(root,'ENGINEER REVIEW · INSPECTION REQUIRED',[-18.5,2.1,26.2],4,.42);
  return {root,rope,update(t){
    horse.update(t);demo.update(t);
    const child=actors.get('child'),painter=actors.get('tank-worker');
    childPail.visible=t>=25&&t<84;
    if(t>=64&&t<=70) {
      const h=child.handWorld(-1);
      childPail.position.copy(h).add(new T.Vector3(0,-.64,0));
    } else childPail.position.set(-5.7,0,-10);
    const painting=t>=70&&t<=76;
    roller.visible=rollerHandle.visible=painting;
    if(painting) {
      const hand=painter.handWorld(1);
      const contact=new T.Vector3(-4.0,2.15+Math.sin((t-70)*2)*.35,-10.45);
      roller.position.copy(contact);
      setSegment(rollerHandle,hand,contact,.025);
    }
    const rescue=t<22.5||(t>=138&&t<150);
    rope.visible=rescue;
    if(rescue) {
      setSegment(rope,actors.get('survivor').handWorld(1),actors.get('policeman').handWorld(-1),.026);
    }
    const wash=t>=182&&t<=193;
    hose.visible=nozzle.visible=wash;
    const hand=actors.get('policeman').handWorld(1);
    if(wash) {
      const nozzleEnd=hand.clone().add(new T.Vector3(-.27,-.03,-.45));
      setSegment(hose,new T.Vector3(7.4,.78,20),hand,.045);
      setSegment(nozzle,hand,nozzleEnd,.065);
      water.forEach((m,i)=>{
        const f=((t-182)*1.25+i/25)%1;
        m.visible=true;
        m.position.copy(nozzleEnd).add(new T.Vector3(-f*3.2,Math.sin(f*Math.PI)*.35-f*.85,-f*2));
      });
    } else water.forEach(m=>m.visible=false);
    sand.visible=t>=183;
    sand.scale.x=1+smooth((t-183)/8)*3;
    ledger.visible=t>=195;
  }};
}
