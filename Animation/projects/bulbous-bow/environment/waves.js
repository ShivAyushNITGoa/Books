import * as T from '../../../engine/vendor/three.module.js';
import {POND, FLUME, LAB} from './geography.js';
import {ramp, mix} from '../direction/math.js';

/** Dimensionless pedagogical model; not CFD or a resistance prediction. */
export function interference(phase, gain = 0.64, mismatch = 0) {
  const hull = Math.sin(phase);
  const bulb = gain * Math.sin(phase + Math.PI + mismatch);
  return {hull, bulb, result: hull + bulb};
}
export function conditionAt(progress) {
  // A favourable operating point is contrasted with mismatched conditions.
  const mismatch = ramp(0.54, 0.83, progress) * 2.4;
  const gain = mix(0.64, 0.49, ramp(0.55, 0.9, progress));
  return {gain, mismatch, qualitativeOnly: true};
}

const oceanVertex = `
  uniform float time;
  uniform vec3 ship;
  uniform float localPatch;
  uniform float waveGain;
  uniform float mismatch;
  varying vec3 vWorld;
  varying float vEnergy;
  void main(){
    vec3 p=(modelMatrix*vec4(position,1.)).xyz;
    vec2 d=p.xz-vec2(ship.x,ship.z-66.);
    float r=length(d);
    float envelope=exp(-r*.027)*smoothstep(2.,7.,abs(d.x));
    float phase=r*.37-time*1.65;
    float hull=sin(phase);
    float bulb=waveGain*sin(phase+3.14159265+mismatch);
    float edge=1.-smoothstep(70.,105.,max(abs(d.x),abs(d.y)));
    float swell=(hull+bulb)*envelope*edge*localPatch;
    p.y+=swell*.95;
    vWorld=p;vEnergy=swell;
    gl_Position=projectionMatrix*viewMatrix*vec4(p,1.);
  }
`;
const oceanFragment = `
  uniform float time;
  uniform float underwater;
  uniform float reveal;
  uniform vec3 eye;
  uniform vec3 ship;
  uniform float localPatch;
  varying vec3 vWorld;
  varying float vEnergy;
  void main(){
    // A genuinely dry dock has no ocean plane crossing its hull inspection bay.
    if(vWorld.x>-459.&&vWorld.x<-381.&&vWorld.z>-100.&&vWorld.z<100.)discard;
    float grain=sin(vWorld.x*.22+sin(vWorld.z*.17+time*.4))*sin(vWorld.z*.26-time*.7);
    float fresnel=pow(1.-abs(normalize(eye-vWorld).y),3.);
    vec3 color=mix(vec3(.055,.30,.38),vec3(.35,.60,.61),fresnel*.8);
    color+=grain*.016;
    color=mix(color,vec3(.68,.81,.74),max(0.,vEnergy-.26)*.37);
    float wake=smoothstep(.85,.99,sin(abs(vWorld.x-ship.x)*.52-(vWorld.z-ship.z+66.)*.13-time*.7));
    float behind=smoothstep(-67.,-50.,vWorld.z-ship.z)*(1.-smoothstep(80.,180.,vWorld.z-ship.z));
    float side=1.-smoothstep(12.,48.,abs(vWorld.x-ship.x));
    color+=wake*behind*side*.06;
    color=mix(color,vec3(.13,.40,.46),underwater*.35);
    float fog=smoothstep(900.,3800.,distance(eye,vWorld));
    color=mix(color,vec3(.68,.79,.77),fog*.7);
    float alpha=mix(.97,.47,underwater);
    alpha=mix(alpha,.10,reveal);
    if(localPatch>.5)alpha*=1.-smoothstep(75.,108.,max(abs(vWorld.x-ship.x),abs(vWorld.z-ship.z+66.)));
    gl_FragColor=vec4(color,alpha);
  }
`;

function rippleSurface(parent, x, y, z, width, depth, elliptical = false) {
  const uniforms = {time: {value: 0}, originA: {value: new T.Vector2(-4, 0)}, originB: {value: new T.Vector2(4, 0)}, mode: {value: 0}, mismatch: {value: 0}};
  const geometry = new T.PlaneGeometry(width, depth, 48, 64); geometry.rotateX(-Math.PI / 2);
  const material = new T.ShaderMaterial({
    uniforms, side: T.DoubleSide,
    vertexShader: `
      uniform float time;uniform vec2 originA;uniform vec2 originB;uniform float mode;uniform float mismatch;
      varying vec3 v;varying float h;
      void main(){
        vec3 p=position;
        float ra=length(p.xz-originA),rb=length(p.xz-originB);
        float a=sin(ra*2.-time*3.4)*exp(-ra*.07);
        float b=sin(rb*2.-time*3.4+mismatch)*exp(-rb*.07);
        h=mix((a+b)*.15,sin(p.z*1.7-time*3.)*.15+sin(p.z*1.7-time*3.+3.14159+mismatch)*.1,mode);
        p.y+=h;v=p;gl_Position=projectionMatrix*modelViewMatrix*vec4(p,1.);
      }`,
    fragmentShader: `
      varying vec3 v;varying float h;
      void main(){
        ${elliptical ? `if(length(vec2(v.x/${(width / 2).toFixed(4)},v.z/${(depth / 2).toFixed(4)}))>1.)discard;` : ''}
        vec3 c=mix(vec3(.12,.40,.44),vec3(.63,.80,.68),h*1.3+.35);
        gl_FragColor=vec4(c,1.);
      }`,
  });
  const mesh = new T.Mesh(geometry, material); mesh.position.set(x, y, z); parent.add(mesh);
  return {mesh, uniforms};
}

export function buildWaves(scene) {
  const uniforms = {time: {value: 0}, ship: {value: new T.Vector3()}, eye: {value: new T.Vector3()},
    underwater: {value: 0}, reveal: {value: 0}, localPatch: {value: 0}, waveGain: {value: 0.64}, mismatch: {value: 0}};
  const baseGeometry = new T.PlaneGeometry(10000, 10000, 1, 1); baseGeometry.rotateX(-Math.PI / 2);
  const material = new T.ShaderMaterial({uniforms, vertexShader: oceanVertex, fragmentShader: oceanFragment,
    transparent: true, depthWrite: false, side: T.DoubleSide});
  const ocean = new T.Mesh(baseGeometry, material); ocean.renderOrder = 2; scene.add(ocean);
  const localUniforms = Object.fromEntries(Object.entries(uniforms).map(([key, value]) => [key, {value: value.value?.clone ? value.value.clone() : value.value}]));
  localUniforms.localPatch.value = 1;
  const localGeometry = new T.PlaneGeometry(220, 220, 100, 100); localGeometry.rotateX(-Math.PI / 2);
  const patch = new T.Mesh(localGeometry, new T.ShaderMaterial({uniforms: localUniforms, vertexShader: oceanVertex, fragmentShader: oceanFragment,
    transparent: true, depthWrite: false, side: T.DoubleSide, polygonOffset: true, polygonOffsetFactor: -1}));
  patch.renderOrder = 3; scene.add(patch);
  const pond = rippleSurface(scene, POND[0], POND[1], POND[2], 30, 19.5, true);
  const outdoor = rippleSurface(scene, FLUME[0], FLUME[1], FLUME[2], 13, 39);
  const tank = rippleSurface(scene, LAB[0], LAB[1] + 2.8, LAB[2], 12, 75);
  outdoor.uniforms.mode.value = 1; tank.uniforms.mode.value = 1;

  const flowRoot = new T.Group(); scene.add(flowRoot);
  const flowMaterial = new T.LineBasicMaterial({color: '#b9e6d8', transparent: true, opacity: 0.65});
  const arrows = [];
  for (const side of [-1, 1]) {
    for (const level of [-8.0, -5.4]) {
      const points = [];
      for (let i = 0; i <= 60; i++) {
        const u = i / 60, z = -88 + u * 42;
        const x = side * (4.6 + Math.sin(u * Math.PI / 2) * 7.8);
        points.push(new T.Vector3(x, level, z));
      }
      const curve = new T.CatmullRomCurve3(points);
      const line = new T.Line(new T.BufferGeometry().setFromPoints(points), flowMaterial);
      flowRoot.add(line);
      for (let n = 0; n < 3; n++) {
        const dot = new T.Mesh(new T.SphereGeometry(0.18, 6, 4), new T.MeshBasicMaterial({color: '#d4f5cf'}));
        flowRoot.add(dot); arrows.push({dot, curve, phase: n / 3});
      }
    }
  }
  return {
    ocean, patch, pond, outdoor, tank, flowRoot,
    update(state, camera, underwater) {
      const t = state.t;
      for (const u of [uniforms, localUniforms]) {
        u.time.value = t; u.ship.value.set(...state.ship); u.eye.value.copy(camera.position);
        u.underwater.value = underwater; u.reveal.value = ramp(64,68,t)*(1-ramp(83,87,t))+ramp(199,203,t); u.waveGain.value = state.waveGain; u.mismatch.value = state.mismatch;
      }
      patch.position.set(state.ship[0], 0.018, state.ship[2] - 66);
      pond.uniforms.time.value = Math.max(0, t - 108);
      outdoor.uniforms.time.value = t; outdoor.uniforms.mismatch.value = state.condition.mismatch;
      tank.uniforms.time.value = t;
      flowRoot.position.set(...state.ship); flowRoot.visible = state.flowVisible;
      for (const arrow of arrows) arrow.dot.position.copy(arrow.curve.getPoint((t * 0.10 + arrow.phase) % 1));
    },
    stats: {model: 'dimensionless explanatory interference, not CFD', fullCancellationClaimed: false, oceanMeters: 10000},
  };
}
