import {T,group,box,ball,segment,batch,colors,material} from '../engine/geometry.js';
import {Actor} from '../cast/actor.js';
import {castDefinitions} from '../cast/motion.js';
import {buildDistrict} from './district.js';
import {buildHarborRunoff} from './harbor-water.js';
import {buildTank} from './tank.js';
import {buildFlood} from './flood.js';
import {buildRailway,buildActionProps} from './action-props.js';
import {episodeTime,fluidHeightAt,narrativePhase} from './geography.js';
import {smooth} from '../engine/math.js';

export function buildWorld(scene) {
  const root=group(scene);
  root.name='connected-north-end-district';
  const district=buildDistrict(root);
  const tank=buildTank(root);
  const railway=buildRailway(root);
  const flood=buildFlood(root);
  const runoff=buildHarborRunoff(root);
  const actors=new Map();
  for(const definition of castDefinitions) {
    actors.set(definition.id,new Actor(root,definition));
  }
  const props=buildActionProps(root,actors);
  const building=group(root,[-12,0,18]);
  const houseStatic=group(building);
  box(houseStatic,0x9c7b52,[0,1.6,0],[3.4,3.2,3.7]);
  box(houseStatic,0x5d6250,[0,3.3,0],[3.8,.25,4.1]);
  for(const x of [-.9,.9]) {
    box(houseStatic,0xc5b48e,[x,1.8,1.86],[.72,.96,.06]);
    box(houseStatic,0x4f6d70,[x,1.8,1.9],[.53,.76,.04]);
  }
  box(houseStatic,0x594332,[0,.9,1.9],[.62,1.8,.07]);
  batch(houseStatic);
  const refuge=box(root,0x94866b,[-1,.10,13],[3.6,.2,5.2]);
  const neighborhoodDebris=[];
  for(let i=0;i<12;i++) {
    const plank=box(root,0xaa865b,[-11+Math.sin(i)*2,.3,18+Math.cos(i*2)*3],[.11,.1,1.4+i%3]);
    neighborhoodDebris.push(plank);
  }
  // Background vegetation has complete trunks and branch silhouettes.
  const trees=group(root);
  for(const [x,z] of [[-18,42],[12,47],[-12,64],[13,61]]) {
    segment(trees,0x6d5539,[x,0,z],[x,4.2,z],.15);
    for(let i=0;i<7;i++) {
      const a=i*1.7;
      segment(trees,0x6d5539,[x,2.4+i*.2,z],[x+Math.cos(a)*1.4,4+i*.15,z+Math.sin(a)],.04);
    }
  }
  batch(trees);
  return {
    root,actors,district,tank,flood,railway,props,
    update(t) {
      const actorTelemetry=[];
      district.update(t);
      const tankState=tank.update(t);
      const railState=railway.update(t);
      const floodState=flood.update(t);
      runoff.update(t);
      for(const actor of actors.values())actorTelemetry.push(actor.update(t));
      root.updateMatrixWorld(true);
      props.update(t);
      const e=episodeTime(t),damage=smooth((e-9)/8);
      building.rotation.z=damage*.27;
      building.position.x=-12+damage*1.2;
      building.position.z=18+damage*1.7;
      neighborhoodDebris.forEach((m,i)=>{
        m.visible=damage>.05;
        m.position.y=Math.max(.08,fluidHeightAt(m.position.x,m.position.z,t)+.055);
        m.rotation.set(0,i*.8,Math.sin(t*.6+i)*.03);
      });
      return {
        phase:narrativePhase(t),
        tank:tankState,
        railway:railState,
        flood:floodState,
        actors:actorTelemetry,
        connectedWorld:true,
        placeVisibilitySwitches:0,
      };
    },
  };
}
