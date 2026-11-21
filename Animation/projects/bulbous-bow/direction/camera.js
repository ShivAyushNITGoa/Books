import * as T from '../../../engine/vendor/three.module.js';
import {bulbSurfacePoints} from '../assets/ship.js';
import {stateAt, DURATION} from './choreography.js';

export const FILM_FOV = 50;
let track;
function orientationAt(time) {
  const rate = 60;
  if (!track) {
    track = [];
    const up = new T.Vector3(0, 1, 0), matrix = new T.Matrix4();
    for (let i = 0; i <= Math.ceil(DURATION * rate); i++) {
      const state = stateAt(i / rate);
      matrix.lookAt(new T.Vector3(...state.eye), new T.Vector3(...state.aim), up);
      const q = new T.Quaternion().setFromRotationMatrix(matrix);
      if (track.length && track.at(-1).dot(q) < 0) q.set(-q.x, -q.y, -q.z, -q.w);
      track.push(q);
    }
  }
  const sum = new T.Vector4();
  for (let i = -12; i <= 12; i++) {
    const offset = i / 5;
    const index = Math.max(0, Math.min(track.length - 1, (time + offset) * rate));
    const a = Math.floor(index), b = Math.min(track.length - 1, a + 1);
    const q = track[a].clone().slerp(track[b], index - a);
    sum.addScaledVector(new T.Vector4(q.x, q.y, q.z, q.w), Math.exp(-0.5 * (offset / 0.9) ** 2));
  }
  return new T.Quaternion(sum.x, sum.y, sum.z, sum.w).normalize();
}

/** One physical camera: no turntable, object-centred orbit or replacement rig. */
export function setCamera(camera, state) {
  if(camera.fov!==FILM_FOV){camera.fov=FILM_FOV;camera.updateProjectionMatrix();}
  camera.position.set(...state.eye);
  camera.quaternion.copy(orientationAt(state.t));
  camera.updateMatrixWorld(true);
  // Portrait composition protects the COMPLETE explanatory feature, not the
  // whole 132 m hull during a close-up. Smooth backward fitting never orbits
  // or automatically recentres the object, and fades out before transitions.
  if (state.focusWeight > 0) {
    const tanY = Math.tan(camera.fov * Math.PI / 360), tanX = tanY * camera.aspect;
    const needs = [0];
    for (const point of focusPoints(state)) {
      const v = point.applyMatrix4(camera.matrixWorldInverse), depth = -v.z;
      needs.push(Math.abs(v.x)/(tanX*.88)-depth, (v.y>=0?v.y/(tanY*.76):-v.y/(tanY*.56))-depth);
    }
    const max = Math.max(...needs);
    const dolly = max + Math.log(needs.reduce((n,v)=>n+Math.exp((v-max)*6),0))/6;
    camera.position.addScaledVector(camera.getWorldDirection(new T.Vector3()), -dolly * state.focusWeight);
    camera.updateMatrixWorld(true);
  }
}
export function projectedEnvelope(points, camera) {
  const out = {min: [Infinity, Infinity], max: [-Infinity, -Infinity], inFront: true};
  for (const p of points) {
    const local = p.clone().applyMatrix4(camera.matrixWorldInverse);
    if (local.z >= -0.1) out.inFront = false;
    const ndc = p.clone().project(camera);
    for (let axis = 0; axis < 2; axis++) {
      const value = axis ? ndc.y : ndc.x;
      out.min[axis] = Math.min(out.min[axis], value); out.max[axis] = Math.max(out.max[axis], value);
    }
  }
  return out;
}
export function focusPoints(state) {
  const p = state.focus;
  if (['dry-bulb', 'sea-bulb'].includes(state.focusKind) || state.focusKind==='final-voyage' && state.t>200) {
    const origin = state.focusKind==='dry-bulb' ? [-420,0,0] : state.ship;
    return bulbSurfacePoints().filter(v=>v[2]<-63.8).map(v=>new T.Vector3(v[0]+origin[0],v[1]+origin[1],v[2]+origin[2]));
  }
  const size = ['dry-bulb', 'sea-bulb'].includes(state.focusKind) ? [3.2, 3.3, 6.3]
    : state.focusKind === 'tank-model' ? [0.9, 0.8, 4.2]
    : state.focusKind === 'design-model' ? [1.2, 1.6, 6]
    : state.focusKind === 'pond' ? [10, 0.5, 6] : [3.5, 2.5, 6.5];
  const points = [];
  for (const x of [-1, 1]) for (const y of [-1, 1]) for (const z of [-1, 1]) {
    points.push(new T.Vector3(p[0] + x * size[0], p[1] + y * size[1], p[2] + z * size[2]));
  }
  return points;
}
