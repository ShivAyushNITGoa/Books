import {SITES, stateAt, DURATION, smooth} from '../choreography.js';
import {coastX, riverZ} from '../environment/field.js';

function rounded(context, x, y, width, height, radius, color) {
  context.fillStyle = color;
  context.beginPath();
  context.roundRect(x, y, width, height, radius);
  context.fill();
}

function drawGeographyMap(context, state, camera) {
  if (!state.journey) return;
  const journey = state.journey;
  const opacity = smooth((state.t - journey.start) / 0.28)
    * smooth((journey.end - state.t) / 0.28);
  context.save();
  context.globalAlpha = opacity * 0.94;
  context.translate(482, 134);
  rounded(context, 0, 0, 207, 166, 9, '#153a44dc');
  context.save();
  context.beginPath();
  context.roundRect(7, 7, 193, 128, 5);
  context.clip();
  const point = (x, z) => [14 + (x + 80) / 1390 * 181, 12 + (z + 320) / 1280 * 118];
  context.fillStyle = '#3e726f';
  context.fillRect(0, 0, 207, 135);
  context.fillStyle = '#71835c';
  context.beginPath();
  context.moveTo(0, 0);
  for (let z = -500; z <= 1300; z += 15) {
    const [x, y] = point(coastX(z), z);
    context.lineTo(x, y);
  }
  context.lineTo(0, 160);
  context.closePath();
  context.fill();
  context.strokeStyle = '#a5c7b0';
  context.lineWidth = 1;
  context.beginPath();
  for (let x = -200; x < 950; x += 20) {
    const [px, py] = point(x, riverZ(x));
    if (x === -200) context.moveTo(px, py); else context.lineTo(px, py);
  }
  context.stroke();

  context.strokeStyle = '#f5d596';
  context.lineWidth = 1.2;
  context.beginPath();
  for (let t = 20; t <= state.t; t += 0.08) {
    const eye = stateAt(t).eye;
    const [x, y] = point(eye[0], eye[2]);
    if (t === 20) context.moveTo(x, y); else context.lineTo(x, y);
  }
  context.stroke();
  for (const [id, site] of Object.entries(SITES)) {
    const [x, y] = point(site.p[0], site.p[2]);
    context.fillStyle = '#e2e7cb';
    context.beginPath();
    context.arc(x, y, 2.5, 0, Math.PI * 2);
    context.fill();
    context.font = '10px Caption';
    context.fillText({factory: 'FACTORY', forest: 'FOREST', ocean: 'SEA', rescue: 'PIER', airport: 'AIRPORT'}[id], x + 4, y - 4);
  }
  const [cx, cy] = point(camera.position.x, camera.position.z);
  context.fillStyle = '#ff984f';
  context.beginPath();
  context.arc(cx, cy, 4.5, 0, Math.PI * 2);
  context.fill();
  context.restore();
  context.fillStyle = '#f4e8c9';
  context.font = '12px Caption';
  context.fillText('ONE CONNECTED LANDSCAPE', 12, 151);
  context.restore();
}

function drawCaptions(context, time, captions) {
  const cue = captions.find(item => time >= item.start && time < item.end);
  if (!cue) return;
  context.font = '31px Caption';
  const lines = [];
  let line = '';
  for (const word of cue.text.split(/\s+/)) {
    const next = line ? line + ' ' + word : word;
    if (line && context.measureText(next).width > 625) {
      lines.push(line);
      line = word;
    } else line = next;
  }
  if (line) lines.push(line);
  const y = 1083 - (lines.length - 1) * 21;
  const gradient = context.createLinearGradient(0, 952, 0, 1200);
  gradient.addColorStop(0, '#0c263600');
  gradient.addColorStop(0.5, '#0c2636ba');
  gradient.addColorStop(1, '#0c263630');
  context.fillStyle = gradient;
  context.fillRect(0, 952, 720, 248);
  context.textAlign = 'center';
  context.lineWidth = 4.5;
  context.lineJoin = 'round';
  lines.forEach((text, index) => {
    context.strokeStyle = '#173443';
    context.strokeText(text, 360, y + index * 42);
    context.fillStyle = '#fff9e7';
    context.fillText(text, 360, y + index * 42);
  });
  context.textAlign = 'left';
}

export function drawOverlay(context, width, state, camera, captions, showCaptions) {
  context.save();
  context.scale(width / 720, width / 720);
  const vignette = context.createRadialGradient(360, 560, 300, 360, 640, 960);
  vignette.addColorStop(0, '#12303a00');
  vignette.addColorStop(1, '#12303a20');
  context.fillStyle = vignette;
  context.fillRect(0, 0, 720, 1280);
  rounded(context, 29, 28, 263, 43, 6, '#183c48e8');
  context.fillStyle = '#ff7838';
  context.fillRect(29, 28, 5, 43);
  context.fillStyle = '#fff0d3';
  context.font = '21px Caption';
  context.fillText('THE BLACK BOX', 45, 57);
  const title = (state.journey ? state.journey.name : SITES[state.site].name).toUpperCase();
  context.font = '16px Caption';
  const titleWidth = Math.min(654, context.measureText(title).width + 24);
  rounded(context, 29, 82, titleWidth, 32, 5, '#173d49d8');
  context.fillStyle = '#e4eee0';
  context.fillText(title, 40, 104, 630);
  drawGeographyMap(context, state, camera);
  if (showCaptions) drawCaptions(context, state.t, captions);
  context.fillStyle = '#c0d4d655';
  context.fillRect(29, 1239, 662, 3);
  context.fillStyle = '#fa8245';
  context.fillRect(29, 1239, 662 * state.t / DURATION, 3);
  context.restore();
}
