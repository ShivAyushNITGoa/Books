/** Deterministic scalar/vector math shared by animation and headless tests. */
export const TAU = Math.PI * 2;
export const clamp = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x));
export const mix = (a, b, u) => a + (b - a) * u;
export const smooth = x => { x = clamp(x); return x * x * (3 - 2 * x); };
export const easeRange = (t, a, b) => smooth((t - a) / (b - a));
export const add = (a, b) => a.map((x, i) => x + b[i]);
export const sub = (a, b) => a.map((x, i) => x - b[i]);
export const scale = (a, k) => a.map(x => x * k);
export const length = a => Math.hypot(...a);
export const distance = (a, b) => length(sub(a, b));
export const lerp3 = (a, b, u) => a.map((x, i) => mix(x, b[i], u));
export const normalize = a => scale(a, 1 / (length(a) || 1));
export const dot = (a, b) => a.reduce((s, x, i) => s + x * b[i], 0);
export const cross = (a, b) => [a[1]*b[2]-a[2]*b[1], a[2]*b[0]-a[0]*b[2], a[0]*b[1]-a[1]*b[0]];
export const mod = (a, b) => ((a % b) + b) % b;
export function seedRandom(seed = 1919) {
  return () => {
    seed |= 0;
    seed = seed + 0x6D2B79F5 | 0;
    let t = Math.imul(seed ^ seed >>> 15, 1 | seed);
    t ^= t + Math.imul(t ^ t >>> 7, 61 | t);
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  };
}
export function hermite(a, b, va, vb, u, dt) {
  const h00 = 2*u*u*u - 3*u*u + 1;
  const h10 = u*u*u - 2*u*u + u;
  const h01 = -2*u*u*u + 3*u*u;
  const h11 = u*u*u - u*u;
  return a.map((v, i) => h00*v + h10*dt*va[i] + h01*b[i] + h11*dt*vb[i]);
}
export function tangent(keys, i, field) {
  const a = keys[Math.max(0, i-1)];
  const b = keys[Math.min(keys.length-1, i+1)];
  return scale(sub(b[field], a[field]), 1 / (b.t-a.t));
}
export function spline(keys, t, field = 'position') {
  let i = keys.findIndex((k, j) => j < keys.length-1 && t < keys[j+1].t);
  if (i < 0) i = keys.length-2;
  i = Math.max(0, i);
  const a = keys[i], b = keys[i+1];
  const dt = b.t-a.t;
  const u = clamp((t-a.t)/dt);
  return hermite(a[field], b[field], tangent(keys,i,field), tangent(keys,i+1,field), u, dt);
}
/** Two-bone analytic IK with a stable, caller-authored bend direction. */
export function solveTwoBone(root, target, upper, lower, pole) {
  let delta = sub(target, root);
  const requested = length(delta);
  const d = clamp(requested, Math.abs(upper-lower)+.0001, upper+lower-.0001);
  const forward = normalize(delta);
  let side = sub(pole, scale(forward, dot(pole, forward)));
  if (length(side)<.0001) side = cross(forward,[0,0,1]);
  side = normalize(side);
  const along = (upper*upper + d*d - lower*lower)/(2*d);
  const perpendicular = Math.sqrt(Math.max(0, upper*upper-along*along));
  return {
    joint: add(root, add(scale(forward,along),scale(side,perpendicular))),
    end: add(root,scale(forward,d)),
    reachError: Math.max(0, requested-upper-lower),
  };
}

/**
 * Shape-preserving C1 interpolation for attention targets. An ordinary
 * Catmull/Hermite target can overshoot a sign or face during a transfer,
 * even when the camera position is perfectly continuous. These monotone
 * component tangents keep each aim coordinate inside its neighboring keys.
 */
export function monotoneSpline(keys,t,field='target') {
  let i=keys.findIndex((k,j)=>j<keys.length-1&&t<keys[j+1].t);
  if(i<0)i=keys.length-2;
  i=Math.max(0,i);
  const a=keys[i],b=keys[i+1],dt=b.t-a.t;
  const derivative=(index,axis)=>{
    const left=Math.max(0,index-1),right=Math.min(keys.length-1,index+1);
    if(index===0||index===keys.length-1) {
      return (keys[right][field][axis]-keys[left][field][axis])/(keys[right].t-keys[left].t);
    }
    const h0=keys[index].t-keys[left].t;
    const h1=keys[right].t-keys[index].t;
    const d0=(keys[index][field][axis]-keys[left][field][axis])/h0;
    const d1=(keys[right][field][axis]-keys[index][field][axis])/h1;
    if(d0*d1<=0)return 0;
    const w0=2*h1+h0,w1=h1+2*h0;
    return (w0+w1)/(w0/d0+w1/d1);
  };
  return hermite(a[field],b[field],a[field].map((_,axis)=>derivative(i,axis)),
    b[field].map((_,axis)=>derivative(i+1,axis)),clamp((t-a.t)/dt),dt);
}
