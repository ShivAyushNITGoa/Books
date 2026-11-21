import * as T from '../../engine/vendor/three.module.js';
import {kit, texture, batchStatic, recorder} from './art.js';
import {SITES, PEOPLE} from './choreography.js';
import {YAWS} from './camera-rig.js';
import {buildTerrain} from './environment/terrain.js';
import {buildInfrastructure} from './environment/infrastructure.js';
import {buildVegetation} from './environment/vegetation.js';
import {buildWater} from './environment/water.js';
import {buildAtmosphere} from './environment/atmosphere.js';
import {terrainHeight} from './environment/field.js';
import {buildFactory} from './sites/factory.js';
import {buildForestEvidence} from './sites/forest.js';
import {buildCoast} from './sites/coast.js';
import {buildAirport} from './sites/airport.js';
import {buildSeabedEvidence} from './sites/seabed.js';

function contactTexture() {
  return texture(128, 128, context => {
    const gradient = context.createRadialGradient(64, 64, 1, 64, 64, 60);
    gradient.addColorStop(0, '#18352c78');
    gradient.addColorStop(1, '#18352c00');
    context.fillStyle = gradient;
    context.fillRect(0, 0, 128, 128);
  });
}

function groundShadow(scene, map, x, y, z, width, depth) {
  const mesh = new T.Mesh(new T.PlaneGeometry(width, depth), new T.MeshBasicMaterial({
    map,
    transparent: true,
    depthWrite: false,
    polygonOffset: true,
    polygonOffsetFactor: -1,
  }));
  mesh.position.set(x, y + 0.018, z);
  mesh.rotation.x = -Math.PI / 2;
  scene.add(mesh);
  return mesh;
}

function buildCast(scene, k, shadowMap) {
  return PEOPLE.map(person => {
    const group = new T.Group();
    group.position.set(person.x, person.y, person.z);
    const canvas = document.createElement('canvas');
    canvas.width = 384;
    canvas.height = 640;
    const tex = new T.CanvasTexture(canvas);
    tex.colorSpace = T.SRGBColorSpace;
    const plane = k.mesh(group, new T.PlaneGeometry(1.9, 2.8), new T.MeshBasicMaterial({
      map: tex, transparent: true, alphaTest: 0.05, side: T.DoubleSide,
    }), 0, 1.4, 0);
    group.name = person.id;
    scene.add(group);
    groundShadow(scene, shadowMap, person.x, person.y, person.z, 1.8, 1);
    return {...person, group, canvas, tex, plane};
  });
}

export function buildWorld(scene) {
  const k = {...kit(), batchStatic};
  const atmosphere = buildAtmosphere(scene);
  const terrain = buildTerrain(scene);
  const infrastructure = buildInfrastructure(scene, k);
  const vegetation = buildVegetation(scene);
  const waterSystem = buildWater(scene);
  const factory = buildFactory(scene, k);
  const forest = buildForestEvidence(scene, k);
  const coast = buildCoast(scene, k);
  const airport = buildAirport(scene, k);
  const seabed = buildSeabedEvidence(scene, k);
  const shadowMap = contactTexture();
  const people = buildCast(scene, k, shadowMap);
  const units = {};

  for (const [id, site] of Object.entries(SITES)) {
    units[id] = recorder(scene, site.p, YAWS[id], k);
    const supportY = id === 'factory' ? 9.34 : id === 'rescue' ? 3.84
      : id === 'airport' ? 9.92 : terrainHeight(site.p[0], site.p[2]);
    groundShadow(scene, shadowMap, site.p[0], supportY, site.p[2], 3, 2.3);
  }
  const rings = Array.from({length: 4}, () => {
    const ring = new T.Mesh(new T.TorusGeometry(1, 0.016, 5, 64), new T.MeshBasicMaterial({
      color: '#b5f8d5', transparent: true, depthWrite: false,
    }));
    scene.add(ring);
    return ring;
  });
  const roots = [
    ...factory.roots, forest.root, ...coast.roots, airport.root, seabed.root,
    infrastructure.group,
  ];
  return {
    roots,
    terrain,
    vegetation,
    atmosphere,
    infrastructure,
    waterSystem,
    units,
    people,
    screens: factory.screens,
    boats: coast.boats,
    departing: airport.departing,
    rings,
    fish: seabed.fish,
    stats: {
      terrain: terrain.stats,
      vegetation: vegetation.stats,
      infrastructure: infrastructure.stats,
      water: waterSystem.stats,
      independentIndoorRooms: 1,
      outdoorPlatformCount: 0,
      worldCoordinateSystem: 'one Y-up metre-based geographic world',
    },
  };
}
