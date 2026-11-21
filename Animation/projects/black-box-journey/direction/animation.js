import {drawPerson} from '../../black-box-rebuilt/world.js';
import {smooth, clamp} from '../choreography.js';

function drawScreens(screens, time) {
  for (const {canvas, tex, index} of screens) {
    const context = canvas.getContext('2d');
    context.fillStyle = '#123542';
    context.fillRect(0, 0, 512, 320);
    context.strokeStyle = '#345963';
    context.lineWidth = 1;
    for (let x = 0; x < 512; x += 32) {
      context.beginPath();
      context.moveTo(x, 52);
      context.lineTo(x, 320);
      context.stroke();
    }
    for (let y = 64; y < 320; y += 32) {
      context.beginPath();
      context.moveTo(0, y);
      context.lineTo(512, y);
      context.stroke();
    }
    context.fillStyle = '#e4e9ce';
    context.font = '24px Caption';
    context.fillText(index ? 'COCKPIT VOICE' : 'FLIGHT DATA', 20, 34);
    for (let line = 0; line < (index ? 1 : 3); line++) {
      context.strokeStyle = index ? '#efc67b' : ['#9be5c2', '#dfc06f', '#96ccdd'][line];
      context.lineWidth = 3;
      context.beginPath();
      for (let x = 0; x < 512; x++) {
        const y = index
          ? 170 + Math.sin(x * 0.19 - time * 6) * (22 + Math.sin(x * 0.047 + time) * 25)
          : 100 + line * 65 + Math.sin(x * 0.025 + time + line) * 17;
        if (x) context.lineTo(x, y); else context.moveTo(x, y);
      }
      context.stroke();
    }
    context.fillStyle = '#bbd8c9';
    context.font = '18px Caption';
    context.fillText(index ? 'RECORDING AUDIO' : 'ALT / SPD / HDG / ACC', 20, 300);
    tex.needsUpdate = true;
  }
}

export function animateWorld(world, state, camera) {
  const t = state.t;
  const units = world.units;
  units.factory.shell.color.set('#718d95').lerp(units.factory.shell.color.clone().set('#ff722d'), clamp(state.orange));
  if (t > 18.8 && t < 26) {
    units.factory.shell.color.set('#142b35').lerp(units.factory.shell.color.clone().set('#ff722d'), clamp(state.orange));
  }
  units.forest.shell.color.set('#172d36');
  units.ocean.shell.color.set('#172d36').lerp(units.ocean.shell.color.clone().set('#ff722d'), smooth((t - 39.5) / 1));
  units.rescue.shell.color.set('#7c9191').lerp(units.rescue.shell.color.clone().set('#ff722d'), smooth((t - 39.5) / 1));
  units.airport.shell.color.set('#ff722d');
  for (const [id, unit] of Object.entries(units)) {
    unit.bands.visible = ['airport', 'rescue', 'ocean'].includes(id) && state.reflect > 0.2;
  }

  for (const person of world.people) {
    // Billboard yaw only. Camera elevation must not tilt feet into the ground.
    drawPerson(person, t, camera.position);
    person.plane.rotation.y = Math.atan2(camera.position.x - person.x, camera.position.z - person.z);
  }
  drawScreens(world.screens, t);
  world.infrastructure.update(t);
  world.boats.forEach((boat, index) => {
    boat.position.y = Math.sin(t * 0.8 + index) * 0.15;
    boat.rotation.z = Math.sin(t * 0.7 + index) * 0.018;
  });

  const departure = smooth((t - 56) / 9);
  world.departing.position.set(175 + departure * 300, 11 + departure * 90, 720 - departure * 1000);
  world.departing.rotation.y = 0.1 + departure * 0.12;
  world.departing.rotation.z = -departure * 0.07;
  for (const fish of world.fish) {
    const x = fish.x + Math.sin(t * 0.35 + fish.p) * 1.1;
    const z = fish.z;
    const dx = x - 1180;
    const dz = z - 320;
    const distance = Math.max(0.001, Math.hypot(dx, dz));
    // Stable softplus excludes fish from the recorder without teleports.
    const v = (distance - 3) * 3;
    const radius = 3 + (v > 30 ? v : Math.log1p(Math.exp(v))) / 3;
    fish.g.position.set(1180 + dx / distance * radius,
      fish.y + Math.sin(t * 0.7 + fish.p) * 0.08, 320 + dz / distance * radius);
    fish.g.rotation.y = Math.sin(t * 0.5 + fish.p) * 0.3;
  }
  for (let i = 0; i < world.rings.length; i++) {
    const ring = world.rings[i];
    const phase = (t * 0.6 + i / 4) % 1;
    ring.visible = t > 47 && t < 50.1;
    ring.position.set(1181.3, -39.58, 320.1);
    ring.quaternion.copy(camera.quaternion);
    ring.scale.setScalar(0.2 + phase * 5);
    ring.material.opacity = (1 - phase) * 0.65;
  }
}
