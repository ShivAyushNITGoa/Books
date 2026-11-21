import * as T from '../../../engine/vendor/three.module.js';
import {
  REGION, terrainHeight, terrainNormal, biomeAt, noise2, smoothstep, mix,
} from './field.js';

const PALETTE = {
  grass: new T.Color('#718849'),
  meadow: new T.Color('#a2a467'),
  forest: new T.Color('#445e38'),
  moss: new T.Color('#5d7249'),
  sand: new T.Color('#d1bd8d'),
  rock: new T.Color('#8a9282'),
  mud: new T.Color('#69755a'),
  seabed: new T.Color('#647c70'),
};

/**
 * Nonuniform axes put resolution where the camera actually visits, while the
 * same indexed surface continues to the horizon. No overlapping LOD patches,
 * skirt walls or mismatched terrain edges are introduced.
 */
function sampleAxis(minimum, maximum, denseLow, denseHigh) {
  const axis = [];
  let value = minimum;
  while (value < maximum) {
    axis.push(value);
    const distance = Math.max(denseLow - value, value - denseHigh, 0);
    const step = mix(10, 85, smoothstep(0, 1800, distance));
    value += step;
  }
  axis.push(maximum);
  return axis;
}

function groundColor(x, z, result) {
  const b = biomeAt(x, z);
  const variation = noise2(x / 39, z / 39);
  result.copy(PALETTE.grass).lerp(PALETTE.meadow, variation * 0.6);
  result.lerp(PALETTE.forest, b.forest * 0.72);
  result.lerp(PALETTE.moss, b.moisture * 0.20);
  result.lerp(PALETTE.mud, b.wetland * 0.7);
  result.lerp(PALETTE.rock, b.rock * 0.8);
  result.lerp(PALETTE.sand, b.beach * 0.85);
  result.lerp(PALETTE.seabed, smoothstep(-0.5, -12, b.height));
  result.multiplyScalar(0.94 + variation * 0.12);
  return result;
}

export function buildTerrain(scene) {
  const xs = sampleAxis(REGION.minX, REGION.maxX, -180, 1420);
  const zs = sampleAxis(REGION.minZ, REGION.maxZ, -400, 1050);
  const width = xs.length;
  const depth = zs.length;
  const positions = new Float32Array(width * depth * 3);
  const normals = new Float32Array(positions.length);
  const colors = new Float32Array(positions.length);
  const uvs = new Float32Array(width * depth * 2);
  const indices = [];
  const color = new T.Color();

  for (let row = 0; row < depth; row++) {
    for (let col = 0; col < width; col++) {
      const i = row * width + col;
      const x = xs[col];
      const z = zs[row];
      positions.set([x, terrainHeight(x, z), z], i * 3);
      normals.set(terrainNormal(x, z), i * 3);
      groundColor(x, z, color).toArray(colors, i * 3);
      uvs.set([x / 75, z / 75], i * 2);
      if (col < width - 1 && row < depth - 1) {
        const next = i + width;
        indices.push(i, next, i + 1, i + 1, next, next + 1);
      }
    }
  }

  const geometry = new T.BufferGeometry();
  geometry.setAttribute('position', new T.BufferAttribute(positions, 3));
  geometry.setAttribute('normal', new T.BufferAttribute(normals, 3));
  geometry.setAttribute('color', new T.BufferAttribute(colors, 3));
  geometry.setAttribute('uv', new T.BufferAttribute(uvs, 2));
  geometry.setIndex(indices);
  geometry.computeBoundingSphere();

  const material = new T.MeshPhongMaterial({
    vertexColors: true,
    shininess: 1,
    specular: '#182a20',
  });
  // Object-space grass/sand grain, not a large stretched photographic texture.
  material.onBeforeCompile = shader => {
    shader.vertexShader = shader.vertexShader
      .replace('#include <common>', '#include <common>\nvarying vec3 vGroundPosition;')
      .replace('#include <begin_vertex>', '#include <begin_vertex>\nvGroundPosition=position;');
    shader.fragmentShader = shader.fragmentShader
      .replace('#include <common>', `#include <common>
        varying vec3 vGroundPosition;
        float groundHash(vec2 p){return fract(sin(dot(p,vec2(12.9898,78.233)))*43758.5453);}`)
      .replace('#include <color_fragment>', `#include <color_fragment>
        float grain=groundHash(floor(vGroundPosition.xz*2.0));
        float ripple=sin(vGroundPosition.x*1.1+sin(vGroundPosition.z*.4)*2.0);
        float wet=1.0-smoothstep(-4.0,1.0,vGroundPosition.y);
        diffuseColor.rgb*=.96+grain*.07+ripple*wet*.025;`);
  };

  const mesh = new T.Mesh(geometry, material);
  mesh.name = 'ONE connected land-to-seabed heightfield';
  mesh.userData.occluder = true;
  scene.add(mesh);

  return {
    mesh,
    stats: {
      vertices: width * depth,
      triangles: indices.length / 3,
      bounds: REGION,
      continuousSurface: true,
      disconnectedOutdoorPlatforms: 0,
    },
  };
}
