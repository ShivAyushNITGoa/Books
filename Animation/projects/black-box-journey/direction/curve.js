/** Pure deterministic, shape-preserving cubic interpolation. */
export function clamp(x, low = 0, high = 1) {
  return Math.max(low, Math.min(high, x));
}

export function smooth(x) {
  const u = clamp(x);
  return u * u * (3 - 2 * u);
}

export function sampleKeys(keys, time, startColumn, dimensions = 3) {
  let index = 0;
  while (index < keys.length - 2 && time > keys[index + 1][0]) index++;
  const a = keys[index];
  const b = keys[index + 1];
  const span = b[0] - a[0];
  const u = clamp((time - a[0]) / span);
  const u2 = u * u;
  const u3 = u2 * u;

  function tangent(i, column) {
    if (i === 0 || i === keys.length - 1) return 0;
    const previous = keys[i - 1];
    const current = keys[i];
    const next = keys[i + 1];
    const left = (current[column] - previous[column]) / (current[0] - previous[0]);
    const right = (next[column] - current[column]) / (next[0] - current[0]);
    if (left * right <= 0) return 0;
    return 0.8 * 2 * left * right / (left + right);
  }

  return Array.from({length: dimensions}, (_, axis) => {
    const column = startColumn + axis;
    return (2 * u3 - 3 * u2 + 1) * a[column]
      + (u3 - 2 * u2 + u) * span * tangent(index, column)
      + (-2 * u3 + 3 * u2) * b[column]
      + (u3 - u2) * span * tangent(index + 1, column);
  });
}

export function pointSegmentDistance(point, start, end) {
  const delta = end.map((v, i) => v - start[i]);
  const length2 = delta.reduce((n, v) => n + v * v, 0);
  const offset = point.map((v, i) => v - start[i]);
  const fraction = length2 ? clamp(offset.reduce((n, v, i) => n + v * delta[i], 0) / length2) : 0;
  return Math.hypot(...point.map((v, i) => v - start[i] - fraction * delta[i]));
}
