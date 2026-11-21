/**
 * The geographic source of truth.
 *
 * Everything samples this field: the land/ocean mesh, roads, beach, reeds,
 * tree roots, roadside furniture and the camera's terrain-clearance audit.
 * There are no forest platforms, square seabed plates or independent floors
 * outdoors. Building floors/aprons are civil works flattened into the field.
 * Coordinates are metres; Y=0 is mean sea level.
 */
export const REGION = Object.freeze({
  minX: -3600,
  maxX: 4900,
  minZ: -3700,
  maxZ: 4700,
  seed: 49071,
});

export function clamp(value, low = 0, high = 1) {
  return Math.max(low, Math.min(high, value));
}

export function mix(a, b, weight) {
  return a + (b - a) * weight;
}

export function smoothstep(low, high, value) {
  const u = clamp((value - low) / (high - low));
  return u * u * (3 - 2 * u);
}

export function hash2(x, z, seed = REGION.seed) {
  let n = Math.imul(x | 0, 374761393) ^ Math.imul(z | 0, 668265263) ^ seed;
  n = Math.imul(n ^ (n >>> 13), 1274126177);
  return ((n ^ (n >>> 16)) >>> 0) / 4294967296;
}

export function noise2(x, z, seed = REGION.seed) {
  const ix = Math.floor(x);
  const iz = Math.floor(z);
  const fx = smoothstep(0, 1, x - ix);
  const fz = smoothstep(0, 1, z - iz);
  return mix(
    mix(hash2(ix, iz, seed), hash2(ix + 1, iz, seed), fx),
    mix(hash2(ix, iz + 1, seed), hash2(ix + 1, iz + 1, seed), fx),
    fz,
  );
}

export function fbm(x, z, octaves = 4) {
  let amplitude = 0.55;
  let sum = 0;
  let total = 0;
  for (let octave = 0; octave < octaves; octave++) {
    sum += noise2(x, z, REGION.seed + octave * 5197) * amplitude;
    total += amplitude;
    x = x * 2.03 + 11.7;
    z = z * 1.97 - 4.8;
    amplitude *= 0.5;
  }
  return sum / total;
}

function gaussian(x, z, cx, cz, sx, sz, height) {
  return height * Math.exp(-(((x - cx) / sx) ** 2) - ((z - cz) / sz) ** 2);
}

/** Winding coast: headlands, a cove by the harbour and northern beaches. */
export function coastX(z) {
  return 884
    + 66 * Math.sin(z / 345)
    + 39 * Math.sin(z / 134 + 0.4)
    - 96 * Math.exp(-(((z - 756) / 155) ** 2))
    + 115 * Math.exp(-(((z + 640) / 290) ** 2));
}

export function coastDistance(x, z) {
  return x - coastX(z);
}

export function riverZ(x) {
  return 330 + Math.sin(x / 170) * 48 + Math.sin(x / 71) * 11;
}

export function riverDistance(x, z) {
  return Math.abs(z - riverZ(x));
}

/** Rounded, not rectangular, engineered level pads with continuous shoulders. */
function levelPad(value, x, z, cx, cz, halfX, halfZ, feather, height) {
  const dx = Math.max(0, Math.abs(x - cx) - halfX);
  const dz = Math.max(0, Math.abs(z - cz) - halfZ);
  return mix(height, value, smoothstep(0, feather, Math.hypot(dx, dz)));
}

export function terrainHeight(x, z) {
  const d = coastDistance(x, z);
  const n = fbm(x / 260, z / 260);
  let land = 7 + 19 * n;
  land += gaussian(x, z, -600, -820, 590, 490, 185);
  land += gaussian(x, z, 260, -1130, 330, 440, 120);
  land += gaussian(x, z, -1450, 500, 620, 820, 265);
  land += gaussian(x, z, 450, 1580, 420, 590, 100);
  land += (fbm(x / 95, z / 95, 3) - 0.5) * 4;

  // A shelf slopes all the way into deep water. It never ends at a square edge.
  const shoreWeight = smoothstep(-110, 6, d);
  const beach = -d * 0.085 + (n - 0.5) * 0.5;
  let height = mix(land, beach, shoreWeight);
  const offshore = smoothstep(0, 260, d);
  const ocean = -5 - 38 * smoothstep(0, 400, d) + (n - 0.5) * 5;
  height = mix(height, ocean, offshore);

  // The river is a continuous channel from inland hills into the estuary.
  const river = 1 - smoothstep(7, 70, riverDistance(x, z));
  const riverRange = smoothstep(-1400, -1100, x) * (1 - smoothstep(760, 950, x));
  const channel = 1.0 + Math.max(0, 580 - x) * 0.0012;

  height = levelPad(height, x, z, 0, 20, 53, 67, 65, 8);
  height = levelPad(height, x, z, 150, 650, 112, 235, 85, 8);
  height = levelPad(height, x, z, 420, -180, 13, 11, 21, 12);
  height = levelPad(height, x, z, 1180, 320, 14, 13, 28, -40);
  // The base meets the coast inland; the pier itself is a real raised structure.
  height = levelPad(height, x, z, 790, 760, 16, 11, 21, 8);
  // Carve the river last: civil-work shoulders cannot bury its surface.
  height = mix(height, channel - 1.7, river * riverRange);
  // Airport drainage follows the north boundary, never through the runway pad.
  height = levelPad(height, x, z, 150, 650, 112, 235, 24, 8);
  return height;
}

export function terrainNormal(x, z, epsilon = 0.7) {
  const dx = terrainHeight(x + epsilon, z) - terrainHeight(x - epsilon, z);
  const dz = terrainHeight(x, z + epsilon) - terrainHeight(x, z - epsilon);
  const length = Math.hypot(dx, 2 * epsilon, dz);
  return [-dx / length, 2 * epsilon / length, -dz / length];
}

export function biomeAt(x, z) {
  const height = terrainHeight(x, z);
  const coast = coastDistance(x, z);
  const moisture = fbm(x / 310 + 16, z / 310 - 18);
  const woodland = 1 - smoothstep(190, 520, z);
  const forest = woodland * smoothstep(-20, -150, coast) * (0.70 + moisture * 0.3);
  const wetland = (1 - smoothstep(20, 80, riverDistance(x, z)))
    * smoothstep(140, 700, x) * (1 - smoothstep(700, 940, x));
  const beach = 1 - smoothstep(9, 75, Math.abs(coast));
  const rock = smoothstep(80, 210, height);
  return {height, coast, moisture, forest, wetland, beach, rock};
}

export function infrastructureExclusion(x, z) {
  const factory = 1 - smoothstep(58, 93, Math.hypot(x, z - 18));
  const apronX = Math.abs(x - 140);
  const apronZ = Math.abs(z - 650);
  const airport = 1 - smoothstep(0, 42, Math.hypot(
    Math.max(0, apronX - 117), Math.max(0, apronZ - 240),
  ));
  const base = 1 - smoothstep(20, 40, Math.hypot(x - 790, z - 760));
  return Math.max(factory, airport, base);
}

export function segmentDistance2D(x, z, a, b) {
  const dx = b[0] - a[0];
  const dz = b[1] - a[1];
  const length2 = dx * dx + dz * dz;
  const u = length2 ? clamp(((x - a[0]) * dx + (z - a[1]) * dz) / length2) : 0;
  return Math.hypot(x - a[0] - u * dx, z - a[1] - u * dz);
}

export function routeDistance(x, z, points) {
  let distance = Infinity;
  for (let i = 1; i < points.length; i++) {
    distance = Math.min(distance, segmentDistance2D(x, z, points[i - 1], points[i]));
  }
  return distance;
}
