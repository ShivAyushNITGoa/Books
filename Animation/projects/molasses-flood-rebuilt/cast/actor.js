import {T,group,ball,box,tube,segment,setSegment,batch,contactShadow,colors,material} from '../engine/geometry.js';
import {solveTwoBone,TAU,clamp} from '../engine/math.js';
import {actorState,gaitAt} from './motion.js';

/** Anatomically simple but volumetric, joined cartoon actor with analytic IK. */
export class Actor {
  constructor(parent,definition) {
    this.definition=definition;
    this.id=definition.id;
    this.scale=definition.scale||1;
    this.root=group(parent);
    this.root.name=`actor:${this.id}`;
    this.root.scale.setScalar(this.scale);
    this.root.userData.actorId=this.id;
    this.shadow=contactShadow(this.root,.56,.56);
    this.body=group(this.root,[0,1.15,0]);
    this.makeBody();
    this.head=group(this.root,[0,1.97,0]);
    this.makeHead();
    this.arms=[this.makeArm(-1),this.makeArm(1)];
    this.legs=[this.makeLeg(-1),this.makeLeg(1)];
    this.handTargets=[[-.48,.82,.08],[.48,.82,.08]];
    this.telemetry={};
  }

  makeBody() {
    const d=this.definition;
    const clothing=group(this.body);
    ball(clothing,d.color,[0,0,0],[.335,.49,.265]);
    // Collar conforms to the rounded torso rather than a floating chest label.
    const left=box(clothing,0xe8dcc6,[-.085,.31,.218],[.13,.17,.035]);
    left.rotation.z=.29;
    const right=box(clothing,0xe8dcc6,[.085,.31,.218],[.13,.17,.035]);
    right.rotation.z=-.29;
    for(const y of [-.22,-.03,.16])ball(clothing,0xc9aa67,[0,y,.26],[.022,.025,.013]);
    if(d.role==='volunteer') {
      box(clothing,0xe8dfce,[-.265,.1,.17],[.13,.2,.06]);
      box(clothing,0xa64742,[-.265,.1,.206],[.085,.035,.014]);
      box(clothing,0xa64742,[-.265,.1,.207],[.029,.12,.014]);
    }
    if(d.hat==='police') {
      ball(clothing,0xc9aa67,[-.15,.12,.25],[.045,.055,.013]);
    }
    if(d.role==='painter'||d.role==='distiller') {
      const apron=ball(clothing,0xb6a489,[0,-.03,.2],[.23,.37,.075]);
    }
    batch(clothing);
  }

  makeHead() {
    const d=this.definition;
    const fixed=group(this.head);
    ball(fixed,0xf6edd9,[0,0,0],[.48,.515,.46]);
    // A continuous cap closes the crown. Individual curls add silhouette,
    // but the cap prevents the old detached-curl / visible scalp holes.
    const capGeometry=new T.SphereGeometry(1,24,12,0,TAU,0,1.35);
    const cap=new T.Mesh(capGeometry,material(d.hair||0x513a29));
    cap.scale.set(.493,.53,.473);
    fixed.add(cap);
    const hair=d.hair||0x513a29;
    for(let ring=0;ring<2;ring++) {
      const count=ring?12:15;
      const y=ring?.39:.24;
      const radius=ring?.29:.405;
      for(let i=0;i<count;i++) {
        const a=i/count*TAU+(ring?.15:0);
        ball(fixed,hair,[Math.sin(a)*radius,y+Math.sin(i*2.3)*.018,Math.cos(a)*radius*.94],[.115,.12,.11]);
      }
    }
    // Small ears provide profile readability, not realistic facial anatomy.
    ball(fixed,0xeee0cb,[-.47,-.045,0],[.065,.09,.05]);
    ball(fixed,0xeee0cb,[.47,-.045,0],[.065,.09,.05]);
    if(d.hat)this.makeHat(fixed,d.hat);
    if(d.glasses)this.makeGlasses(fixed);
    batch(fixed);
    this.eyes=[];
    this.brows=[];
    for(const side of [-1,1]) {
      const x=side*.15;
      const z=.46*Math.sqrt(1-(x/.48)**2-(.018/.515)**2)+.008;
      this.eyes.push(ball(this.head,0x2d3334,[x,.018,z],[.026,.046,.012]));
      this.brows.push(segment(this.head,0x514536,[x-.055,.135,z-.007],[x+.055,.14,z-.007],.012));
    }
    this.mouth=ball(this.head,0x805d4e,[0,-.18,.443],[.063,.018,.009]);
  }

  makeHat(parent,kind) {
    const dark=kind==='sailor'?0xe3dece:kind==='fire'?0x5b4d38:0x334a59;
    const brim=ball(parent,dark,[0,.43,.035],[.51,.065,.49]);
    if(kind==='fire') {
      ball(parent,0x756046,[0,.53,-.02],[.38,.21,.37]);
      box(parent,0xc6a05c,[0,.51,.38],[.16,.16,.035]);
      segment(parent,0x9e814b,[0,.66,-.3],[0,.72,.28],.04);
    } else {
      tube(parent,dark,[0,.54,0],.36,.16);
      if(kind!=='sailor')ball(parent,0x263c47,[0,.43,.3],[.36,.035,.25]);
      if(kind==='police')ball(parent,0xc9aa67,[0,.55,.36],[.045,.05,.014]);
      if(kind==='sailor')tube(parent,0xf1ecdf,[0,.61,0],.39,.08);
    }
  }

  makeGlasses(parent) {
    for(const side of [-1,1]) {
      const x=side*.15,z=.455;
      for(const y of [-.063,.106])segment(parent,0x4e4d46,[x-.108,y,z],[x+.108,y,z],.013);
      for(const xx of [x-.108,x+.108])segment(parent,0x4e4d46,[xx,-.063,z],[xx,.106,z],.013);
    }
    segment(parent,0x4e4d46,[-.04,.035,.46],[.04,.035,.46],.013);
    for(const side of [-1,1])segment(parent,0x4e4d46,[side*.26,.065,.455],[side*.45,.065,.03],.014);
  }

  makeArm(side) {
    const upper=segment(this.root,0x31383b,[0,0,0],[0,1,0],.043);
    const lower=segment(this.root,0x31383b,[0,0,0],[0,1,0],.039);
    const elbow=ball(this.root,0x31383b,[0,0,0],.046);
    const hand=ball(this.root,0xf2e5d1,[0,0,0],[.088,.095,.083]);
    return {side,upper,lower,elbow,hand};
  }

  makeLeg(side) {
    const upper=segment(this.root,0x30383b,[0,0,0],[0,1,0],.051);
    const lower=segment(this.root,0x30383b,[0,0,0],[0,1,0],.047);
    const knee=ball(this.root,0x30383b,[0,0,0],.053);
    const foot=group(this.root);
    const shoe=group(foot);
    ball(shoe,0x513e31,[0,0,.065],[.12,.095,.21]);
    ball(shoe,0x3f342b,[0,-.037,.06],[.122,.047,.21]);
    batch(shoe);
    return {side,upper,lower,knee,foot};
  }

  update(t) {
    const state=actorState(this.definition,t);
    this.state=state;
    this.root.position.set(state.x,state.y,state.z);
    this.root.rotation.y=state.yaw;
    const stride=state.speed>1.4?.97:.78;
    const amplitude=Math.min(1,state.speed/.9);
    const phase=state.distance/stride*TAU;
    const bob=state.walking?Math.sin(phase*2)*.018*amplitude:Math.sin(t*1.3)*.008;
    this.body.position.y=1.15+bob;
    this.head.position.y=1.97+bob;
    this.head.rotation.set(0,Math.sin(t*.65+this.id.length)*.025,state.action==='brace'?-.07:Math.sin(t*.5)*.018);
    const blink=((t+this.id.length*.21)%4.1)<.12;
    for(const eye of this.eyes)eye.scale.y=blink?.006:.046;
    this.mouth.scale.y=state.action==='brace'?.035:.018;
    const groundContacts=[];
    for(const leg of this.legs) {
      const foot=gaitAt(state.distance,state.speed,leg.side,stride);
      const hip=[leg.side*.145,.86+bob-(state.walking?.03:0),0];
      const ankle=[foot.x,foot.y,foot.z];
      const ik=solveTwoBone(hip,ankle,.39,.40,[0,0,1]);
      setSegment(leg.upper,hip,ik.joint,.051);
      setSegment(leg.lower,ik.joint,ik.end,.047);
      leg.knee.position.fromArray(ik.joint);
      leg.foot.position.fromArray(ankle);
      leg.foot.rotation.x=foot.swing?-.14*Math.sin(foot.phase*TAU):0;
      groundContacts.push({side:leg.side,stance:!foot.swing,y:foot.y});
    }
    this.handTargets=this.actionHands(t,state,phase,amplitude);
    for(let i=0;i<2;i++) {
      const arm=this.arms[i];
      const shoulder=[arm.side*.30,1.43+bob,0];
      const ik=solveTwoBone(shoulder,this.handTargets[i],.34,.35,[arm.side*.8,0,.45]);
      setSegment(arm.upper,shoulder,ik.joint,.043);
      setSegment(arm.lower,ik.joint,ik.end,.039);
      arm.elbow.position.fromArray(ik.joint);
      arm.hand.position.fromArray(ik.end);
    }
    this.telemetry={id:this.id,position:[state.x,state.y,state.z],speed:state.speed,walking:state.walking,action:state.action,distance:state.distance,groundContacts};
    return this.telemetry;
  }

  actionHands(t,state,phase,amplitude) {
    const targets=[[-.46,.83,.08],[.46,.83,.08]];
    if(state.walking) {
      for(let i=0;i<2;i++)targets[i][2]+=.19*Math.sin(phase+i*Math.PI)*amplitude;
    }
    if(state.action==='brace') {
      targets[0]=[-.47,1.18,.37];
      targets[1]=[.40,1.20,.48];
    }
    if(state.action==='pull') {
      targets[0]=[-.22,1.12,.55];
      targets[1]=[.20,1.15,.55];
    }
    if(state.action==='paint') {
      const lift=Math.sin((t-70)*2)*.12;
      targets[1]=[.18,1.45+lift,.57];
      targets[0]=[-.3,1.02,.36];
    }
    if(state.action==='pail')targets[0]=[-.24,.95,.42];
    if(state.action==='measure'||state.action==='work') {
      targets[0]=[-.27,1.12,.49];
      targets[1]=[.25,1.13,.48+Math.sin(t*1.5)*.035];
    }
    if(state.action==='hose') {
      targets[0]=[-.16,1.1,.54];
      targets[1]=[.19,1.03,.52];
    }
    return targets;
  }

  handWorld(side=1) {
    this.root.updateWorldMatrix(true,true);
    return this.arms[side>0?1:0].hand.getWorldPosition(new T.Vector3());
  }
}
