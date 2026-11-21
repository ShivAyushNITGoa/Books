import * as T from '../../../engine/vendor/three.module.js';
export {batchStatic} from '../../alexandria/batch.js';
export function canvasTexture(width, height, draw) {
  const canvas = document.createElement('canvas');
  canvas.width = width; canvas.height = height;
  draw(canvas.getContext('2d'));
  const texture = new T.CanvasTexture(canvas);
  texture.colorSpace = T.SRGBColorSpace;
  return texture;
}

export function drawingKit() {
  const materials = new Map();
  const cube = new T.BoxGeometry(1, 1, 1);
  const cylinder = new T.CylinderGeometry(1, 1, 1, 10);
  const sphere = new T.SphereGeometry(1, 16, 10);
  function material(color, shininess = 14) {
    const key = color + ':' + shininess;
    if (!materials.has(key)) materials.set(key, new T.MeshPhongMaterial({color, shininess, specular: '#778d88'}));
    return materials.get(key);
  }
  function mesh(parent, geometry, mat, x = 0, y = 0, z = 0, scale = [1, 1, 1]) {
    const object = new T.Mesh(geometry, mat);
    object.position.set(x, y, z); object.scale.set(...scale); parent.add(object);
    return object;
  }
  const box = (p, x, y, z, w, h, d, m) => mesh(p, cube, m, x, y, z, [w, h, d]);
  const cyl = (p, x, y, z, r, h, m) => mesh(p, cylinder, m, x, y, z, [r, h, r]);
  const ball = (p, x, y, z, w, h, d, m) => mesh(p, sphere, m, x, y, z, [w, h, d]);
  function rod(p, a, b, r, m) {
    const start = new T.Vector3(...a), end = new T.Vector3(...b);
    const object = cyl(p, ...start.clone().add(end).multiplyScalar(0.5).toArray(), r, start.distanceTo(end), m);
    object.quaternion.setFromUnitVectors(new T.Vector3(0, 1, 0), end.sub(start).normalize());
    return object;
  }
  function label(parent, text, x, y, z, width, height, yaw = 0, bg = '#173d47', ink = '#f4edd3') {
    const texture = canvasTexture(1024, Math.max(96, Math.round(1024 * height / width)), c => {
      c.fillStyle = bg; c.fillRect(0, 0, c.canvas.width, c.canvas.height);
      c.fillStyle = ink; c.font = '850 80px Caption'; c.textAlign = 'center'; c.textBaseline = 'middle';
      c.fillText(text, 512, c.canvas.height / 2, 965);
    });
    const plane = mesh(parent, new T.PlaneGeometry(width, height), new T.MeshBasicMaterial({map: texture, side: T.DoubleSide}), x, y, z);
    plane.rotation.y = yaw;
    return plane;
  }
  const M = Object.fromEntries(Object.entries({
    navy: '#173944', teal: '#397b7a', cream: '#e3ddbf', white: '#e9e9d7',
    red: '#b54f3b', orange: '#e99343', steel: '#8a9e9a', dark: '#324c50',
    wood: '#8d7958', green: '#687f4c', sand: '#bcae81', yellow: '#d7b45a',
  }).map(([key, value]) => [key, material(value)]));
  return {material, mesh, box, cyl, ball, rod, label, M};
}
