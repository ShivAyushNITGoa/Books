export const clamp = (value, low = 0, high = 1) => Math.max(low, Math.min(high, value));
export const mix = (a, b, u) => a + (b - a) * u;
export const smooth = value => { const u = clamp(value); return u * u * (3 - 2 * u); };
export const ramp = (a, b, value) => smooth((value - a) / (b - a));
export function hash(x, z, seed = 8921) {
  let n = Math.imul(x | 0, 374761393) ^ Math.imul(z | 0, 668265263) ^ seed;
  n = Math.imul(n ^ (n >>> 13), 1274126177);
  return ((n ^ (n >>> 16)) >>> 0) / 4294967296;
}
export function noise(x, z) {
  const a = Math.floor(x), b = Math.floor(z), u = smooth(x - a), v = smooth(z - b);
  return mix(mix(hash(a, b), hash(a + 1, b), u), mix(hash(a, b + 1), hash(a + 1, b + 1), u), v);
}

/** Shape-preserving C1 cubic, avoiding terrain-penetrating spline overshoots. */
export function sample(keys, time, from = 1, dimensions = 3) {
  let i = 0;
  while (i < keys.length - 2 && time > keys[i + 1][0]) i++;
  const a = keys[i], b = keys[i + 1], dt = b[0] - a[0];
  const u = clamp((time - a[0]) / dt), u2 = u * u, u3 = u2 * u;
  function tangent(index, column) {
    if (!index || index === keys.length - 1) return 0;
    const p = keys[index - 1], c = keys[index], n = keys[index + 1];
    const l = (c[column] - p[column]) / (c[0] - p[0]);
    const r = (n[column] - c[column]) / (n[0] - c[0]);
    return l * r <= 0 ? 0 : 1.6 * l * r / (l + r);
  }
  return Array.from({length: dimensions}, (_, axis) => {
    const j = from + axis;
    return (2 * u3 - 3 * u2 + 1) * a[j] + (u3 - 2 * u2 + u) * dt * tangent(i, j)
      + (-2 * u3 + 3 * u2) * b[j] + (u3 - u2) * dt * tangent(i + 1, j);
  });
}
export function segmentDistance(p, a, b) {
  const d = b.map((v, i) => v - a[i]);
  const length2 = d.reduce((s, v) => s + v * v, 0);
  const t = length2 ? clamp(d.reduce((s, v, i) => s + v * (p[i] - a[i]), 0) / length2) : 0;
  return Math.hypot(...p.map((v, i) => v - a[i] - t * d[i]));
}
