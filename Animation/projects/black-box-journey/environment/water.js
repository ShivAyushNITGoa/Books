import * as T from '../../../engine/vendor/three.module.js';
import {riverZ, terrainHeight, hash2} from './field.js';

function riverMesh() {
  const positions = [];
  const indices = [];
  const segments = 220;
  for (let i = 0; i <= segments; i++) {
    const x = -1300 + i / segments * 2240;
    const z = riverZ(x);
    const width = 6 + Math.max(0, x - 500) * 0.043;
    const y = Math.max(0.12, 1 + Math.max(0, 580 - x) * 0.0012);
    positions.push(x, y, z - width, x, y, z + width);
    if (i < segments) {
      const n = i * 2;
      indices.push(n, n + 1, n + 2, n + 1, n + 3, n + 2);
    }
  }
  const geometry = new T.BufferGeometry();
  geometry.setAttribute('position', new T.Float32BufferAttribute(positions, 3));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();
  return new T.Mesh(geometry, new T.MeshPhongMaterial({
    color: '#527f79', shininess: 80, specular: '#aaccc3', side: T.DoubleSide,
  }));
}

export function buildWater(scene) {
  const uniforms = {
    time: {value: 0},
    underwater: {value: 0},
    eye: {value: new T.Vector3()},
  };
  const material = new T.ShaderMaterial({
    uniforms,
    transparent: true,
    depthWrite: false,
    side: T.DoubleSide,
    vertexShader: `
      uniform float time;
      varying vec3 vWorld;
      varying float vWave;
      void main() {
        vec3 p=position;
        float a=sin(p.x*.040+time*.72);
        float b=sin(p.z*.061-time*.48);
        float c=sin((p.x+p.z)*.112+time*.9);
        p.y+=a*.20+b*.14+c*.045;
        vWave=a*.5+b*.3+c*.2;
        vWorld=p;
        gl_Position=projectionMatrix*modelViewMatrix*vec4(p,1.0);
      }
    `,
    fragmentShader: `
      uniform float time;
      uniform float underwater;
      uniform vec3 eye;
      varying vec3 vWorld;
      varying float vWave;
      float coast(float z) {
        return 884.0+66.0*sin(z/345.0)+39.0*sin(z/134.0+.4)
          -96.0*exp(-pow((z-756.0)/155.0,2.0))
          +115.0*exp(-pow((z+640.0)/290.0,2.0));
      }
      void main() {
        float d=vWorld.x-coast(vWorld.z);
        float depth=smoothstep(5.,280.,d);
        vec3 color=mix(vec3(.19,.51,.46),vec3(.055,.27,.36),depth);
        vec3 direction=normalize(eye-vWorld);
        float fresnel=pow(1.0-abs(direction.y),3.0);
        color=mix(color,vec3(.65,.78,.75),fresnel*.62);
        float streak=sin(vWorld.x*.19+sin(vWorld.z*.13)*2.+time*.5);
        float glitter=pow(max(0.,streak*vWave),12.0);
        color+=glitter*vec3(.4,.43,.30);
        float shore=1.0-smoothstep(0.,32.,abs(d));
        float surf=pow(max(0.,sin(d*.66-time*1.1+sin(vWorld.z*.06))),8.0)*shore;
        color=mix(color,vec3(.86,.89,.74),surf*.78);
        float distanceFog=smoothstep(800.,3900.,distance(eye,vWorld));
        color=mix(color,vec3(.69,.79,.76),distanceFog*.65);
        color=mix(color,vec3(.18,.43,.46),underwater*.5);
        gl_FragColor=vec4(color,mix(.94,.48,underwater));
      }
    `,
  });
  const geometry = new T.PlaneGeometry(10000, 10000, 100, 100);
  geometry.rotateX(-Math.PI / 2);
  const ocean = new T.Mesh(geometry, material);
  ocean.name = 'Continuous open sea with natural surf and depth gradient';
  ocean.renderOrder = 2;
  scene.add(ocean);
  const river = riverMesh();
  river.name = 'River feeds estuary and open ocean';
  scene.add(river);

  const count = 190;
  const particles = new Float32Array(count * 3);
  for (let i = 0; i < count; i++) {
    const x = 1180 + (hash2(i, 0, 97) - 0.5) * 85;
    const z = 320 + (hash2(i, 1, 97) - 0.5) * 85;
    let y = -39 + hash2(i, 2, 97) * 34;
    // Do not put opaque bright dots directly in the explanatory close-up.
    if (Math.hypot(x - 1180, z - 320) < 3) y = -18;
    particles.set([x, y, z], i * 3);
  }
  const dustGeometry = new T.BufferGeometry();
  dustGeometry.setAttribute('position', new T.BufferAttribute(particles, 3));
  const dust = new T.Points(dustGeometry, new T.PointsMaterial({
    color: '#acd6c2', size: 0.06, transparent: true, opacity: 0.38,
    depthWrite: false, sizeAttenuation: true,
  }));
  dust.name = 'Sparse suspended plankton, no opaque screen overlay';
  scene.add(dust);

  return {
    ocean,
    river,
    uniforms,
    dust,
    update(time, camera, underwater) {
      uniforms.time.value = time;
      uniforms.underwater.value = underwater;
      uniforms.eye.value.copy(camera.position);
      dust.visible = underwater > 0.1;
    },
    stats: {seaWidthMeters: 10000, continuousRiver: true, artificialWaterWalls: 0},
  };
}
