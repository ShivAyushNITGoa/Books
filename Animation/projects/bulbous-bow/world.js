import * as T from '../../engine/vendor/three.module.js';
import {drawingKit, canvasTexture} from './assets/drawing.js';
import {vesselMotion} from './direction/motion.js';
import {buildShip, SHIP} from './assets/ship.js';
import {buildGeography, DOCK, FLUME, LAB, LAB_FLOOR_Y} from './environment/geography.js';
import {buildDock, buildResearchCampus, buildTerminal} from './environment/facilities.js';
import {buildWaves} from './environment/waves.js';
import {buildAtmosphere} from './environment/atmosphere.js';
import {drawPerson} from '../black-box-rebuilt/world.js';
import {ramp, clamp, mix} from './direction/math.js';

export const CAST = [
  {id: 'dock-engineer', kind: 'engineer', x: -398, y: -13.73, z: -58},
  {id: 'dock-surveyor', kind: 'search', x: -441, y: 7.5, z: -45},
  {id: 'basin-engineer', kind: 'engineer', x: -166, y: 6.4, z: -574},
  {id: 'tank-engineer', kind: 'engineer', x: -215, y: LAB_FLOOR_Y + .02, z: -710},
  {id: 'data-engineer', kind: 'engineer', x: -177, y: LAB_FLOOR_Y + .02, z: -719},
];
function buildCast(scene, k) {
  return CAST.map(spec => {
    const canvas = document.createElement('canvas'); canvas.width = 384; canvas.height = 640;
    const tex = new T.CanvasTexture(canvas); tex.colorSpace = T.SRGBColorSpace;
    const group = new T.Group(); group.position.set(spec.x, spec.y, spec.z); scene.add(group);
    const plane = k.mesh(group, new T.PlaneGeometry(1.9, 2.8), new T.MeshBasicMaterial({map: tex, transparent: true, alphaTest: 0.05, side: T.DoubleSide}), 0, 1.4, 0);
    const shadowMap = canvasTexture(64, 64, c => {
      const g = c.createRadialGradient(32, 32, 1, 32, 32, 30);
      g.addColorStop(0, '#173e4260'); g.addColorStop(1, '#173e4200'); c.fillStyle = g; c.fillRect(0, 0, 64, 64);
    });
    const shadow = k.mesh(scene, new T.PlaneGeometry(1.8, 1), new T.MeshBasicMaterial({map: shadowMap, transparent: true, depthWrite: false}), spec.x, spec.y + 0.025, spec.z);
    shadow.rotation.x = -Math.PI / 2;
    return {...spec, canvas, tex, group, plane};
  });
}

function drawMonitors(screens, state) {
  for (const [index, screen] of screens.entries()) {
    const c = screen.canvas.getContext('2d'), t = state.t;
    c.fillStyle = '#153944'; c.fillRect(0, 0, 640, 400);
    c.fillStyle = '#e9e8ca'; c.font = '25px Caption'; c.fillText(screen.title, 24, 38, 595);
    c.strokeStyle = '#3f6167'; c.lineWidth = 1;
    for (let x = 20; x < 640; x += 40) { c.beginPath(); c.moveTo(x, 65); c.lineTo(x, 350); c.stroke(); }
    for (let y = 80; y < 350; y += 40) { c.beginPath(); c.moveTo(20, y); c.lineTo(620, y); c.stroke(); }
    if (index === 1) {
      // Explanatory flow lines around a model profile, explicitly not CFD data.
      for (let line = -4; line <= 4; line++) {
        c.strokeStyle = line % 2 ? '#e3bb6b' : '#8ecabb'; c.lineWidth = 2; c.beginPath();
        for (let x = 20; x < 620; x += 3) {
          const bulge = Math.exp(-(((x - 270) / 100) ** 2)) * (line > 0 ? 1 : -1) * 35;
          const y = 205 + line * 20 + bulge + Math.sin(x * 0.025 - t) * 3;
          if (x === 20) c.moveTo(x, y); else c.lineTo(x, y);
        }
        c.stroke();
      }
      c.fillStyle = '#c9d2b8'; c.beginPath(); c.ellipse(315, 205, 110, 27, 0, 0, Math.PI * 2); c.fill();
    } else {
      for (let line = 0; line < 3; line++) {
        c.strokeStyle = ['#97d1cb', '#e9bc68', '#f1edc9'][line]; c.lineWidth = 3; c.beginPath();
        for (let x = 20; x < 620; x++) {
          const phase = x * 0.022 - t * 1.3;
          const amplitude = line === 2 ? 18 : 45;
          const y = 130 + line * 72 + Math.sin(phase + (line === 1 ? Math.PI : 0)) * amplitude;
          if (x === 20) c.moveTo(x, y); else c.lineTo(x, y);
        }
        c.stroke();
      }
    }
    c.fillStyle = '#b5d1c0'; c.font = '18px Caption'; c.fillText('SCHEMATIC / RELATIVE VALUES ONLY', 24, 380);
    // Live sampling cursor and measurement dots make the ongoing test legible.
    const cursor=24+((t*.11)%1)*580;
    c.strokeStyle='#efc16a';c.lineWidth=2;c.beginPath();c.moveTo(cursor,65);c.lineTo(cursor,350);c.stroke();
    for(let i=0;i<8;i++){
      const x=40+i*72,y=272+Math.sin(i*.8-t*1.3)*24;
      c.fillStyle='#f0c780';c.beginPath();c.arc(x,y,3.8,0,Math.PI*2);c.fill();
    }
    screen.texture.needsUpdate = true;
  }
}

export function buildWorld(scene) {
  const k = drawingKit();
  const atmosphere = buildAtmosphere(scene);
  const geography = buildGeography(scene, k);
  const dock = buildDock(scene, k);
  const campus = buildResearchCampus(scene, k);
  const terminal = buildTerminal(scene, k);
  const dryShip = buildShip(scene, k, {name: 'ATLAS'}); dryShip.root.position.set(...DOCK);
  const oceanShip = buildShip(scene, k, {name: 'MERIDIAN'});
  const outdoorModel = buildShip(scene, k, {name: 'DESIGN MODEL', scale: 0.075, miniature: true});
  const plainModel = buildShip(scene, k, {name: 'REFERENCE MODEL', scale: 0.045, miniature: true, bulb: false});
  plainModel.root.position.set(-198, 8.1, -586);
  k.box(scene, -198, 7.1, -586, 2.5, 2, 8.4, k.M.steel);
  const tankModel = buildShip(scene, k, {name: 'TOW MODEL', scale: 0.055, miniature: true});
  const waves = buildWaves(scene);
  const people = buildCast(scene, k);
  const stones = [-4, 4].map((x, i) => {
    const rock = k.ball(scene, -165 + x, 9, -450, 0.32, 0.24, 0.28, k.M.steel);
    return {rock, impact: 109.2 + i * 1.2};
  });
  return {
    atmosphere, geography, dock, campus, terminal, dryShip, oceanShip,
    outdoorModel, plainModel, tankModel, waves, people,
    staticRoots: [dock.root, ...campus.roots, terminal.root],
    stats: {...geography.stats, shipLengthMeters: 132, shipBeamMeters: 25,
      fullSizeShips: 2, miniatureModels: 3, fullSizeShipsIndoors: 0,
      bulbWidthMeters: 3.7, bulbProjectionBeyondStemMeters: 6,
      nominalWaterlineLiftMeters: SHIP.afloatOffset, meanImmersedDraftMeters: SHIP.draft-SHIP.afloatOffset,
      nominalFreeboardMeters: SHIP.deckY+SHIP.afloatOffset, labFloorY: LAB_FLOOR_Y,
      water: waves.stats, repeatedOrbitController: false},
    update(state, camera) {
      oceanShip.root.position.set(...state.ship);
      const motion=vesselMotion(state.t);
      oceanShip.root.rotation.set(motion.pitch,0,motion.roll);
      oceanShip.propeller.rotation.z = state.t * 4.8;
      outdoorModel.propeller.rotation.z=state.t*5.5;
      tankModel.propeller.rotation.z=state.t*6.2;
      outdoorModel.root.position.set(FLUME[0], FLUME[1] + .15 + .025*Math.sin(state.t*2) + mix(0, -0.28, ramp(145, 153, state.t)), -570 - 10 * ramp(123, 152, state.t));
      tankModel.root.position.set(LAB[0], LAB[1] + 2.91 + .012*Math.sin(state.t*3), state.modelZ);
      campus.carriage.position.z = state.modelZ - LAB[2];
      for(const wheel of campus.wheels)wheel.quaternion.copy(wheel.userData.axle).multiply(new T.Quaternion().setFromAxisAngle(new T.Vector3(0,1,0),(state.modelZ+666)/.55));
      campus.lamps.forEach((lamp,i)=>lamp.scale.setScalar(.18+.05*(.5+.5*Math.sin(state.t*4+i*Math.PI))));
      drawMonitors(campus.screens, state);
      for (const person of people) {
        drawPerson(person, state.t, camera.position);
        person.plane.rotation.y = Math.atan2(camera.position.x - person.x, camera.position.z - person.z);
      }
      for (const stone of stones) {
        const age = Math.max(0, state.t - stone.impact + 0.75);
        stone.rock.position.y = 6.5 + Math.max(-0.5, 2.75 - 4.9 * age * age);
      }
      const underwater = atmosphere.update(camera, state);
      waves.update(state, camera, underwater);
      return underwater;
    },
  };
}
