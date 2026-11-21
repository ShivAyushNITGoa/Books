import * as T from '../../../engine/vendor/three.module.js';
import {interference} from '../environment/waves.js';
import {clamp, ramp} from '../direction/math.js';

function panel(c, x, y, w, h, title) {
  c.fillStyle = '#153944eb'; c.beginPath(); c.roundRect(x, y, w, h, 10); c.fill();
  c.fillStyle = '#f2e8c9'; c.font = '17px Caption'; c.fillText(title, x + 16, y + 29, w - 30);
  c.strokeStyle = '#82a5a180'; c.lineWidth = 1;
  c.beginPath(); c.moveTo(x + 16, y + 43); c.lineTo(x + w - 16, y + 43); c.stroke();
}
function waveform(c, x, y, width, amplitude, time, component, mismatch = 0) {
  c.strokeStyle = component === 'hull' ? '#8bd6e3' : component === 'bulb' ? '#e9b76c' : '#b3e3b0';
  c.lineWidth = component === 'result' ? 3.5 : 2.5; c.beginPath();
  for (let i = 0; i <= width; i++) {
    const phase = i / width * Math.PI * 4 - time * 1.7;
    const v = interference(phase, 0.64, mismatch)[component];
    if (!i) c.moveTo(x, y - v * amplitude); else c.lineTo(x + i, y - v * amplitude);
  }
  c.stroke();
}
function wavePanel(c, state, conditions = false) {
  const x = 391, y = 143, w = 299, h = 245;
  const title = conditions ? state.condition.mismatch > 1 ? 'OFF-DESIGN CONDITIONS' : 'MATCHED SPEED + DRAFT' : 'PARTIAL CANCELLATION';
  panel(c, x, y, w, h, title);
  const mismatch = conditions ? state.condition.mismatch : 0;
  for (const [i, name] of ['hull', 'bulb', 'result'].entries()) {
    const yy = y + 78 + i * 57;
    c.fillStyle = '#e7e8d3'; c.font = '13px Caption'; c.fillText({hull: 'BOW WAVE', bulb: 'BULB WAVE', result: 'COMBINED'}[name], x + 15, yy - 13);
    c.strokeStyle = '#6b92917a'; c.lineWidth = 1; c.beginPath(); c.moveTo(x + 15, yy + 8); c.lineTo(x + w - 16, yy + 8); c.stroke();
    waveform(c, x + 16, yy + 8, w - 34, 12, state.t, name, mismatch);
  }
  c.fillStyle = '#a7c5bc'; c.font = '11px Caption'; c.fillText('RELATIVE AMPLITUDE · SCHEMATIC', x + 15, y + h - 12);
}
function energyPanel(c, state, reduced = false) {
  panel(c, 410, 145, 280, 210, reduced ? 'LESS WAVE-MAKING' : 'WAVES REQUIRE ENERGY');
  c.strokeStyle = '#c7cfb3'; c.lineWidth = 3;
  c.strokeRect(438, 214, 91, 48);
  for (let i = 0; i < 3; i++) { c.beginPath(); c.arc(456 + i * 27, 238, 9, 0, Math.PI * 2); c.stroke(); }
  c.beginPath(); c.moveTo(530, 237); c.lineTo(563, 237); c.lineTo(554, 230); c.moveTo(563, 237); c.lineTo(554, 244); c.stroke();
  waveform(c, 572, 237, 91, reduced ? 10 : 20, state.t, 'hull');
  c.fillStyle = '#eee8cf'; c.font = '15px Caption'; c.fillText('ENGINE → WAVE ENERGY', 429, 294);
  c.fillStyle = '#b5cdb9'; c.font = '13px Caption';
  c.fillText(reduced ? 'Less power may maintain speed' : 'More power can mean more fuel', 429, 322, 240);
}
function pondPanel(c, state) {
  panel(c, 418, 144, 272, 153, 'TWO SOURCES · ONE SURFACE');
  c.fillStyle = '#8bd6e3'; c.beginPath(); c.arc(455, 218, 7, 0, Math.PI * 2); c.fill();
  c.fillStyle = '#e9b76c'; c.beginPath(); c.arc(526, 218, 7, 0, Math.PI * 2); c.fill();
  c.fillStyle = '#ebead3'; c.font = '15px Caption'; c.fillText('+', 487, 223); c.fillText('=', 550, 223);
  waveform(c, 577, 218, 87, 18, state.t, 'result');
  c.fillStyle = '#c5d6c5'; c.font = '13px Caption'; c.fillText('Larger and smaller oscillations', 433, 269, 243);
}
function testingPanel(c) {
  panel(c, 431, 143, 259, 152, 'TEST · MEASURE · REFINE');
  const labels = ['Hull flow', 'Wave interaction', 'Required tow force'];
  labels.forEach((label, index) => {
    c.fillStyle = '#9bcdb7'; c.beginPath(); c.arc(451, 213 + index * 28, 3, 0, Math.PI * 2); c.fill();
    c.fillStyle = '#e5e7cc'; c.font = '15px Caption'; c.fillText(label, 465, 218 + index * 28);
  });
}
function tradePanel(c) {
  panel(c, 433, 144, 257, 196, 'REPEATED OCEAN VOYAGES');
  const labels = ['Electronics', 'Clothing', 'Food', 'Machinery'];
  labels.forEach((label, index) => {
    c.fillStyle = ['#be7752', '#76998c', '#d6b66e', '#68919f'][index]; c.fillRect(451, 203 + index * 27, 27, 16);
    c.fillStyle = '#eeead2'; c.font = '14px Caption'; c.fillText(label, 490, 216 + index * 27);
  });
}
function captions(c, time, cues) {
  const cue = cues.find(item => time >= item.start && time < item.end);
  if (!cue) return;
  c.font = '31px Caption';
  const lines = []; let line = '';
  for (const word of cue.text.split(/\s+/)) {
    const next = line ? line + ' ' + word : word;
    if (line && c.measureText(next).width > 625) { lines.push(line); line = word; } else line = next;
  }
  if (line) lines.push(line);
  const y = 1083 - (lines.length - 1) * 21;
  const gradient = c.createLinearGradient(0, 950, 0, 1205);
  gradient.addColorStop(0, '#0c293600'); gradient.addColorStop(0.5, '#0c2936c5'); gradient.addColorStop(1, '#0c293640');
  c.fillStyle = gradient; c.fillRect(0, 950, 720, 255);
  c.textAlign = 'center'; c.lineWidth = 4.5; c.lineJoin = 'round';
  lines.forEach((text, i) => {
    c.strokeStyle = '#183946'; c.strokeText(text, 360, y + i * 42);
    c.fillStyle = '#fff6db'; c.fillText(text, 360, y + i * 42);
  });
  c.textAlign = 'left';
}
function bulbLeader(c, camera, state) {
  if (!['dry-bulb', 'sea-bulb'].includes(state.focusKind) || !state.settled) return;
  const point = new T.Vector3(...state.focus).project(camera);
  if (Math.abs(point.x) > 0.9 || Math.abs(point.y) > 0.75 || point.z > 1) return;
  const x = (point.x + 1) * 360, y = (1 - point.y) * 640;
  c.strokeStyle = '#efd48a'; c.lineWidth = 2; c.beginPath(); c.arc(x, y, 8, 0, Math.PI * 2); c.stroke();
  c.beginPath(); c.moveTo(x + 8, y - 5); c.lineTo(Math.min(610, x + 85), Math.max(420, y - 85)); c.stroke();
  const title = state.t < 63 ? 'THE STRANGE BULGE' : 'BULBOUS BOW';
  c.font = '18px Caption'; c.lineWidth = 4; c.strokeStyle = '#193e48'; c.fillStyle = '#fff0c3';
  const tx = Math.min(515, x + 60), ty = Math.max(410, y - 96);
  c.strokeText(title, tx, ty); c.fillText(title, tx, ty);
}

export function drawOverlay(c, width, state, camera, narration, cc) {
  c.save(); c.scale(width / 720, width / 720);
  const vignette = c.createRadialGradient(360, 570, 300, 360, 640, 930);
  vignette.addColorStop(0, '#153b4600'); vignette.addColorStop(1, '#153b4624'); c.fillStyle = vignette; c.fillRect(0, 0, 720, 1280);
  c.fillStyle = '#163c47e8'; c.beginPath(); c.roundRect(29, 28, 356, 44, 7); c.fill();
  c.fillStyle = '#e9aa59'; c.fillRect(29, 28, 5, 44);
  c.fillStyle = '#fbefd1'; c.font = '21px Caption'; c.fillText(state.t < 64 ? 'A SHIP’S STRANGE NOSE' : 'THE BULBOUS BOW', 45, 58);
  c.font = '16px Caption'; const title = state.viewLabel.toUpperCase();
  c.fillStyle = '#193e49da'; c.fillRect(29, 84, Math.min(658, c.measureText(title).width + 22), 31);
  c.fillStyle = '#e1e8d0'; c.fillText(title, 40, 106);
  if (state.overlay === 'bow-energy') energyPanel(c, state);
  if (state.overlay === 'interference') wavePanel(c, state);
  if (state.overlay === 'ripples') pondPanel(c, state);
  if (state.overlay === 'power') energyPanel(c, state, true);
  if (state.overlay === 'conditions') wavePanel(c, state, true);
  if (state.overlay === 'testing') testingPanel(c);
  if (state.overlay === 'trade') tradePanel(c);
  bulbLeader(c, camera, state);
  if (state.t > 86 && state.t < 155) {
    c.fillStyle = '#193e49c0'; c.fillRect(29, 1193, 347, 25);
    c.fillStyle = '#d3d9bf'; c.font = '12px Caption'; c.fillText('WAVE ILLUSTRATION · NOT CFD OR FUEL DATA', 39, 1211);
  }
  if (cc) captions(c, state.t, narration.captions);
  c.fillStyle = '#c9d7c653'; c.fillRect(29, 1240, 662, 3);
  c.fillStyle = '#e6ac60'; c.fillRect(29, 1240, 662 * state.t / narration.duration, 3);
  c.restore();
}
