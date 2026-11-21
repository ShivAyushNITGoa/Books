import * as T from '../../../engine/vendor/three.module.js';
import {smoothstep} from './field.js';

export function buildAtmosphere(scene) {
  const dayColor = new T.Color('#bed0c7');
  const seaColor = new T.Color('#21575f');
  scene.background = dayColor.clone();
  scene.fog = new T.Fog(dayColor, 600, 4300);

  const ambient = new T.HemisphereLight('#f9edca', '#536d65', 1.75);
  const sun = new T.DirectionalLight('#ffdeb0', 2.5);
  sun.position.set(-500, 750, 350);
  const rim = new T.DirectionalLight('#a6cfd0', 0.7);
  rim.position.set(500, 260, -600);
  scene.add(ambient, sun, rim);
  const factoryLight = new T.PointLight('#ffedc2', 100, 28, 2);
  factoryLight.position.set(0, 16, 0);
  scene.add(factoryLight);

  const uniforms = {time: {value: 0}};
  const sky = new T.Mesh(new T.SphereGeometry(7000, 24, 14), new T.ShaderMaterial({
    side: T.BackSide,
    depthWrite: false,
    fog: false,
    uniforms,
    vertexShader: `
      varying vec3 vDirection;
      void main(){
        vDirection=position;
        gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);
      }
    `,
    fragmentShader: `
      uniform float time;
      varying vec3 vDirection;
      float hash(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
      float noise(vec2 p){
        vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);
        return mix(mix(hash(i),hash(i+vec2(1,0)),f.x),
          mix(hash(i+vec2(0,1)),hash(i+1.),f.x),f.y);
      }
      void main(){
        vec3 n=normalize(vDirection);
        float h=smoothstep(-.02,.85,n.y);
        vec3 c=mix(vec3(.77,.83,.75),vec3(.27,.55,.68),h);
        float sunlight=pow(max(0.,dot(n,normalize(vec3(-.5,.75,.35)))),190.);
        c+=sunlight*vec3(.8,.65,.37);
        vec2 p=n.xz/max(.12,n.y)*2.8+vec2(time*.001,0);
        float clouds=noise(p)*.6+noise(p*2.1)*.27+noise(p*4.2)*.13;
        float coverage=smoothstep(.59,.76,clouds)*smoothstep(.03,.18,n.y);
        c=mix(c,vec3(.91,.90,.78),coverage*.82);
        gl_FragColor=vec4(c,1.);
      }
    `,
  }));
  sky.name = 'Shared horizon, distant haze and slow continuous cloud field';
  scene.add(sky);

  return {
    sky,
    update(camera, time) {
      const underwater = 1 - smoothstep(-1.2, 0.9, camera.position.y);
      ambient.intensity = 1.75 - underwater * 0.62;
      rim.intensity = 0.7 + underwater * 0.25;
      scene.fog.color.copy(dayColor).lerp(seaColor, underwater);
      scene.background.copy(scene.fog.color);
      scene.fog.near = 600 * (1 - underwater) + 6 * underwater;
      scene.fog.far = 4300 * (1 - underwater) + 120 * underwater;
      sky.visible = underwater < 0.999;
      sky.position.copy(camera.position);
      uniforms.time.value = time;
      return underwater;
    },
  };
}
