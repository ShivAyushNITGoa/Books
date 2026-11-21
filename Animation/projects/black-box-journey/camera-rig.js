import * as T from '../../engine/vendor/three.module.js';
import {stateAt, DURATION} from './choreography.js';

export const YAWS = Object.freeze({factory: 0, forest: -0.45, ocean: 0.2, rescue: 1, airport: -0.3});
export const RECORDER_EXTENTS = Object.freeze({
  x: [-1.12, 1.72],
  y: [-0.72, 1.02],
  z: [-0.72, 0.72],
});
export const CARRIER_EXTENTS = RECORDER_EXTENTS;

export function subjectMatrix(state) {
  return new T.Matrix4().compose(
    new T.Vector3(...state.hero),
    new T.Quaternion().setFromAxisAngle(new T.Vector3(0, 1, 0), YAWS[state.site]),
    new T.Vector3(0.8, 0.8, 0.8),
  );
}

export function corners(extents, matrix) {
  const output = [];
  for (const x of extents.x) {
    for (const y of extents.y) {
      for (const z of extents.z) output.push(new T.Vector3(x, y, z).applyMatrix4(matrix));
    }
  }
  return output;
}

/**
 * A deterministic shutter-independent orientation spline for travel. Looking
 * at independently moving world targets can whip around when an eye/aim pair
 * nearly crosses. Integrate a symmetric spherical Gaussian around the authored
 * bearing instead, then release that filtering gently in full-focus closeups.
 * It changes the ONE camera's rotation, not its position or the geography, and
 * does not blend rendered pictures. Seeking has exactly the same result.
 */
let orientationTrack;
function travelOrientation(state) {
  const rate = 120;
  if (!orientationTrack) {
    orientationTrack = [];
    const matrix = new T.Matrix4();
    const up = new T.Vector3(0, 1, 0);
    for (let i = 0; i <= Math.ceil(DURATION * rate); i++) {
      const sample = stateAt(i / rate);
      matrix.lookAt(new T.Vector3(...sample.eye), new T.Vector3(...sample.aim), up);
      const q = new T.Quaternion().setFromRotationMatrix(matrix);
      const last = orientationTrack.at(-1);
      if (last && last.dot(q) < 0) q.set(-q.x, -q.y, -q.z, -q.w);
      orientationTrack.push(q);
    }
  }
  const sum = new T.Vector4();
  for (let i = -21; i <= 21; i++) {
    const offset = i / 30;
    const index = Math.max(0, Math.min(orientationTrack.length - 1, (state.t + offset) * rate));
    const low = Math.floor(index);
    const high = Math.min(orientationTrack.length - 1, low + 1);
    const q = orientationTrack[low].clone().slerp(orientationTrack[high], index - low);
    const weight = Math.exp(-0.5 * (offset / 0.30) ** 2);
    sum.addScaledVector(new T.Vector4(q.x, q.y, q.z, q.w), weight);
  }
  return new T.Quaternion(sum.x, sum.y, sum.z, sum.w).normalize();
}

/**
 * Preserve authored off-centre composition. Only dolly backward as necessary
 * to protect handle, housing, locator and caption clearance in close views.
 * Log-sum-exp avoids corners introducing abrupt velocity changes at handoffs.
 * This is not a subject-follow camera during geographical travel.
 */
export function fitCamera(camera, state) {
  camera.position.set(...state.eye);
  const aim = new T.Vector3(...state.aim);
  camera.lookAt(aim);
  camera.updateMatrixWorld(true);
  const tanY = Math.tan(camera.fov * Math.PI / 360);
  const tanX = tanY * camera.aspect;
  const needs = [0];
  for (const point of corners(RECORDER_EXTENTS, subjectMatrix(state))) {
    const view = point.applyMatrix4(camera.matrixWorldInverse);
    const depth = -view.z;
    needs.push(
      Math.abs(view.x) / (tanX * 0.84) - depth,
      (view.y >= 0 ? view.y / (tanY * 0.75) : -view.y / (tanY * 0.55)) - depth,
    );
  }
  const largest = Math.max(...needs);
  const dolly = largest + Math.log(needs.reduce((sum, x) => sum + Math.exp((x - largest) * 8), 0)) / 8;
  const backward = camera.position.clone().sub(aim).normalize();
  camera.position.addScaledVector(backward, dolly * state.focus);
  camera.lookAt(aim);
  if (state.focus < 0.999999) {
    camera.quaternion.slerp(travelOrientation(state), 1 - state.focus);
  }
  camera.updateMatrixWorld(true);
  return dolly;
}

export function projectedBounds(points, camera) {
  const min = [Infinity, Infinity];
  const max = [-Infinity, -Infinity];
  for (const point of points) {
    const ndc = point.clone().project(camera);
    min[0] = Math.min(min[0], ndc.x);
    min[1] = Math.min(min[1], ndc.y);
    max[0] = Math.max(max[0], ndc.x);
    max[1] = Math.max(max[1], ndc.y);
  }
  return {min, max};
}

/**
 * Clip the illustrated person's conservative envelope against all six planes
 * in homogeneous coordinates BEFORE dividing by W. Behind-camera rectangles
 * otherwise create bogus apparent intersections during the long journeys.
 */
export function personBounds(person, camera) {
  const right = new T.Vector3().setFromMatrixColumn(camera.matrixWorld, 0);
  right.y = 0;
  right.normalize();
  const viewProjection = new T.Matrix4().multiplyMatrices(camera.projectionMatrix, camera.matrixWorldInverse);
  const bottom = person.bottom ?? 0.02;
  const top = person.top ?? 2.65;
  let polygon = [[-1, bottom], [1, bottom], [1, top], [-1, top]].map(([sign, y]) => {
    const point = new T.Vector3(person.x, y, person.z)
      .addScaledVector(right, sign * (person.halfWidth ?? 0.62));
    return new T.Vector4(point.x, point.y, point.z, 1).applyMatrix4(viewProjection);
  });
  for (const axis of ['x', 'y', 'z']) {
    for (const sign of [-1, 1]) {
      const clipped = [];
      for (let i = 0; i < polygon.length; i++) {
        const a = polygon[i];
        const b = polygon[(i + 1) % polygon.length];
        const da = a.w + sign * a[axis];
        const db = b.w + sign * b[axis];
        if (da >= 0) clipped.push(a);
        if ((da >= 0) !== (db >= 0)) clipped.push(a.clone().lerp(b, da / (da - db)));
      }
      polygon = clipped;
    }
  }
  if (!polygon.length) return {min: [1, 1], max: [-1, -1], visible: false};
  return {
    min: [Math.min(...polygon.map(v => v.x / v.w)), Math.min(...polygon.map(v => v.y / v.w))],
    max: [Math.max(...polygon.map(v => v.x / v.w)), Math.max(...polygon.map(v => v.y / v.w))],
    visible: true,
  };
}

export function overlap(a, b) {
  const width = Math.max(0, Math.min(a.max[0], b.max[0], 1) - Math.max(a.min[0], b.min[0], -1));
  const height = Math.max(0, Math.min(a.max[1], b.max[1], 1) - Math.max(a.min[1], b.min[1], -1));
  const bArea = Math.max(0, Math.min(b.max[0], 1) - Math.max(b.min[0], -1))
    * Math.max(0, Math.min(b.max[1], 1) - Math.max(b.min[1], -1));
  return bArea > 0 ? width * height / bArea : 0;
}
