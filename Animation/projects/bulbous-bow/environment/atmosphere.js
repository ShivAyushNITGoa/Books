import * as T from '../../../engine/vendor/three.module.js';
import {ramp} from '../direction/math.js';
export function buildAtmosphere(scene) {
  const day = new T.Color('#bfd0c7'), under = new T.Color('#225a64');
  scene.background = day.clone(); scene.fog = new T.Fog(day, 650, 4000);
  const hemi = new T.HemisphereLight('#f9edce', '#476e72', 1.85); scene.add(hemi);
  const sun = new T.DirectionalLight('#ffe2b4', 2.4); sun.position.set(-600, 900, -300); scene.add(sun);
  const rim = new T.DirectionalLight('#afd4d2', 0.85); rim.position.set(300, 200, 400); scene.add(rim);
  const dockLight = new T.PointLight('#f4dfbe', 2000, 120, 2); dockLight.position.set(-410, 1, -50); scene.add(dockLight);
  const labLight = new T.PointLight('#eff4d9', 400, 90, 2); labLight.position.set(-200, 24, -700); scene.add(labLight);
  const sky = new T.Mesh(new T.SphereGeometry(6200, 16, 10), new T.ShaderMaterial({
    side: T.BackSide, depthWrite: false, fog: false,
    vertexShader: 'varying vec3 v;void main(){v=position;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}',
    fragmentShader: `varying vec3 v;void main(){vec3 n=normalize(v);float h=smoothstep(-.03,.8,n.y);
      vec3 c=mix(vec3(.77,.84,.77),vec3(.26,.55,.69),h);
      float cloud=sin(n.x*22.+sin(n.z*18.))*sin(n.z*27.);c=mix(c,vec3(.9,.9,.8),smoothstep(.72,.98,cloud)*smoothstep(.1,.3,n.y)*.45);
      gl_FragColor=vec4(c,1.);}`,
  })); scene.add(sky);
  return {
    update(camera, state) {
      // Being below Y=0 in the excavated dry dock is not being underwater.
      const inDryDock = camera.position.x > -459 && camera.position.x < -381
        && camera.position.z > -100 && camera.position.z < 100;
      const underwater = inDryDock ? 0 : 1 - ramp(-1, 0.8, camera.position.y);
      hemi.intensity = 1.85 - underwater * 0.4;
      scene.fog.color.copy(day).lerp(under, underwater); scene.background.copy(scene.fog.color);
      scene.fog.near = 650 * (1 - underwater) + 12 * underwater;
      scene.fog.far = 4000 * (1 - underwater) + 155 * underwater;
      sky.visible = underwater < 0.999; sky.position.copy(camera.position);
      return underwater;
    },
  };
}
