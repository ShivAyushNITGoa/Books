/* Talk to Society — CODE-DRAWN SCENE
   Every pixel is drawn here with canvas paths: the study, the desk, the lamp and
   the host character rig. No photographs, no bitmaps.

   Rules extracted from nateherkai/herk-edit-kit (MOTION_PHILOSOPHY.md):
   · Law 2  black is the canvas — negative space is the design, but the subject is LIT
   · Law 3  light is the brand, not colour — key pool, rim light, halos
   · Law 4  the camera never sleeps — breath, sway, blink, flicker always on
   · Law 7  palette is symbolic, 5 hues, each with a meaning
   · Law 10 one unifying texture — perspective grid + crosshair markers
   · Anti-pattern: no Math.random()/Date.now() — seeded harmonic hashes only
   Everything is a pure function of t so the renderers can step frame by frame.
*/

export const STAGE = { w: 1920, h: 1080 };

/* 5 symbolic hues (Law 7) */
export const PAL = {
  ink: "#0a0705",
  inkDeep: "#050302",
  oxblood: "#8f2f33",
  gold: "#e8b46a",
  teal: "#3fbdb0",
  cream: "#f4e6cf",
};

const hash = (n) => {
  const s = Math.sin(n * 127.1 + 0.7) * 43758.5453;
  return s - Math.floor(s);
};
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));

/* ---------- path helpers ---------- */
function P(ctx, pts, close = true) {
  ctx.beginPath();
  ctx.moveTo(pts[0][0], pts[0][1]);
  for (let i = 1; i < pts.length; i++) {
    const c = pts[i];
    if (c.length === 6) ctx.bezierCurveTo(c[0], c[1], c[2], c[3], c[4], c[5]);
    else if (c.length === 4) ctx.quadraticCurveTo(c[0], c[1], c[2], c[3]);
    else ctx.lineTo(c[0], c[1]);
  }
  if (close) ctx.closePath();
}
const vg = (ctx, y0, y1, s) => { const g = ctx.createLinearGradient(0, y0, 0, y1); for (const [p, c] of s) g.addColorStop(p, c); return g; };
const dg = (ctx, x0, y0, x1, y1, s) => { const g = ctx.createLinearGradient(x0, y0, x1, y1); for (const [p, c] of s) g.addColorStop(p, c); return g; };
const rg = (ctx, x, y, r, s) => { const g = ctx.createRadialGradient(x, y, 0, x, y, r); for (const [p, c] of s) g.addColorStop(p, c); return g; };

/* ---------- framing ---------- */
export function computeView(aspect) {
  if (aspect >= 1.4) return { cx: 960, cy: 540, vw: 1920, vh: 1080 };
  if (aspect >= 1) return { cx: 960, cy: 560, vw: 1440, vh: 1080 };
  const vh = 1450, vw = (vh * aspect) | 0;
  return { cx: 960, cy: 600, vw, vh };
}

/* Catmull-Rom through camera keyframes [t, cx, cy, zoom] */
export function cameraAt(keys, t) {
  let i = 0;
  while (i < keys.length - 2 && t >= keys[i + 1][0]) i++;
  const p0 = keys[i], p1 = keys[i + 1], pm = keys[Math.max(i - 1, 0)], pn = keys[Math.min(i + 2, keys.length - 1)];
  const h = Math.max(0.001, p1[0] - p0[0]);
  const u = clamp((t - p0[0]) / h, 0, 1);
  const u2 = u * u, u3 = u2 * u;
  const h00 = 2 * u3 - 3 * u2 + 1, h10 = u3 - 2 * u2 + u, h01 = -2 * u3 + 3 * u2, h11 = u3 - u2;
  const out = [];
  for (let k = 1; k <= 3; k++) {
    const m0 = ((p1[k] - pm[k]) / Math.max(0.001, p1[0] - pm[0])) * h;
    const m1 = ((pn[k] - p0[k]) / Math.max(0.001, pn[0] - p0[0])) * h;
    out.push(h00 * p0[k] + h10 * m0 + h01 * p1[k] + h11 * m1);
  }
  return out;
}

/* ---------- room ---------- */
function drawShelf(ctx, x0, x1, y0, y1, seed) {
  const cols = 3, rows = 3;
  const cw = (x1 - x0) / cols, rh = (y1 - y0) / rows;
  ctx.fillStyle = vg(ctx, y0, y1, [[0, "#4b2e1d"], [0.5, "#2e1c12"], [1, "#1a1009"]]);
  ctx.fillRect(x0, y0, x1 - x0, y1 - y0);
  for (let c = 0; c < cols; c++) {
    for (let r = 0; r < rows; r++) {
      const bx = x0 + c * cw + 12, by = y0 + r * rh + 6, bw = cw - 24, bh = rh - 22;
      let x = bx + 5;
      let i = seed + c * 97 + r * 13;
      while (x < bx + bw - 16) {
        const w = 11 + hash(i) * 15;
        const h = bh * (0.66 + hash(i + 5) * 0.34);
        const lean = hash(i + 9) > 0.9 ? 5 : 0;
        const tint = hash(i + 3);
        ctx.save();
        ctx.translate(x, by + bh);
        ctx.rotate((lean * Math.PI) / 180);
        ctx.fillStyle = tint < 0.34 ? "#6b4026" : tint < 0.6 ? "#83502c" : tint < 0.82 ? "#573318" : "#96633a";
        ctx.fillRect(0, -h, w, h);
        ctx.fillStyle = "rgba(255,222,170,.20)";
        ctx.fillRect(2, -h + 5, w - 4, 2.4);
        ctx.fillRect(2, -h * 0.55, w - 4, 1.8);
        ctx.restore();
        x += w + 2;
        i += 3.1;
      }
      ctx.fillStyle = vg(ctx, by + bh, by + bh + 12, [[0, "#8a5f38"], [1, "#3a2415"]]);
      ctx.fillRect(bx - 5, by + bh, bw + 10, 12);
      ctx.fillStyle = "rgba(255,214,150,.16)";
      ctx.fillRect(bx - 5, by + bh, bw + 10, 2);
    }
  }
  for (let c = 0; c <= cols; c++) {
    ctx.fillStyle = vg(ctx, y0, y1, [[0, "#5d3a24"], [1, "#241610"]]);
    ctx.fillRect(x0 + c * cw - 10, y0 - 24, 20, y1 - y0 + 44);
    ctx.fillStyle = "rgba(255,214,150,.10)";
    ctx.fillRect(x0 + c * cw - 10, y0 - 24, 2.5, y1 - y0 + 44);
  }
}

function drawMap(ctx, x0, y0, w, h) {
  ctx.save();
  ctx.beginPath();
  ctx.rect(x0, y0, w, h);
  ctx.clip();
  ctx.fillStyle = dg(ctx, x0, y0, x0 + w, y0 + h, [[0, "#4a381f"], [0.6, "#372814"], [1, "#241a0d"]]);
  ctx.fillRect(x0, y0, w, h);
  ctx.strokeStyle = "rgba(255,222,170,.16)";
  ctx.lineWidth = 1.4;
  for (let i = 1; i < 7; i++) {
    ctx.beginPath(); ctx.moveTo(x0 + (w / 7) * i, y0); ctx.lineTo(x0 + (w / 7) * i, y0 + h); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(x0, y0 + (h / 5) * i); ctx.lineTo(x0 + w, y0 + (h / 5) * i); ctx.stroke();
  }
  // subcontinent
  ctx.beginPath();
  ctx.moveTo(x0 + w * 0.34, y0 + h * 0.14);
  ctx.bezierCurveTo(x0 + w * 0.56, y0 + h * 0.08, x0 + w * 0.78, y0 + h * 0.24, x0 + w * 0.82, y0 + h * 0.44);
  ctx.bezierCurveTo(x0 + w * 0.76, y0 + h * 0.64, x0 + w * 0.66, y0 + h * 0.82, x0 + w * 0.55, y0 + h * 0.94);
  ctx.bezierCurveTo(x0 + w * 0.47, y0 + h * 0.82, x0 + w * 0.38, y0 + h * 0.60, x0 + w * 0.28, y0 + h * 0.40);
  ctx.bezierCurveTo(x0 + w * 0.24, y0 + h * 0.26, x0 + w * 0.27, y0 + h * 0.16, x0 + w * 0.34, y0 + h * 0.14);
  ctx.fillStyle = "rgba(226,186,120,.26)";
  ctx.fill();
  ctx.strokeStyle = "rgba(255,232,190,.5)";
  ctx.lineWidth = 2.2;
  ctx.stroke();
  // compass rose
  ctx.strokeStyle = "rgba(255,232,190,.35)";
  ctx.lineWidth = 1.6;
  ctx.beginPath();
  ctx.moveTo(x0 + w * 0.86, y0 + h * 0.78);
  ctx.lineTo(x0 + w * 0.86, y0 + h * 0.62);
  ctx.moveTo(x0 + w * 0.86, y0 + h * 0.78);
  ctx.lineTo(x0 + w * 0.80, y0 + h * 0.72);
  ctx.moveTo(x0 + w * 0.86, y0 + h * 0.78);
  ctx.lineTo(x0 + w * 0.92, y0 + h * 0.72);
  ctx.stroke();
  ctx.restore();
  ctx.strokeStyle = "rgba(255,222,170,.22)";
  ctx.lineWidth = 6;
  ctx.strokeRect(x0 - 3, y0 - 3, w + 6, h + 6);
  ctx.strokeStyle = "rgba(0,0,0,.6)";
  ctx.lineWidth = 3;
  ctx.strokeRect(x0 - 6, y0 - 6, w + 12, h + 12);
}

function drawRoom(ctx) {
  ctx.fillStyle = dg(ctx, 0, 0, 700, 1080, [[0, "#3b251a"], [0.4, "#2a1a12"], [1, "#150d09"]]);
  ctx.fillRect(-220, -160, 2420, 1440);
  drawShelf(ctx, 50, 1160, 30, 620, 11);
  drawMap(ctx, 1300, 70, 500, 370);
  // wall mouldings
  ctx.strokeStyle = "rgba(255,222,170,.09)";
  ctx.lineWidth = 3;
  ctx.strokeRect(-150, -70, 220, 470);
  ctx.strokeRect(-150, 470, 220, 400);
  // wainscot
  ctx.fillStyle = vg(ctx, 620, 700, [[0, "#2a1a12"], [1, "#1a1109"]]);
  ctx.fillRect(-220, 620, 2420, 90);
  ctx.fillStyle = "rgba(255,214,150,.10)";
  ctx.fillRect(-220, 622, 2420, 2.5);
}

/* ---------- desk, lamp ---------- */
const DESK_Y = 962;
function drawDesk(ctx) {
  ctx.fillStyle = dg(ctx, 0, DESK_Y, 0, 1080, [[0, "#7a4a2a"], [0.10, "#55331d"], [0.45, "#2e1c11"], [1, "#0d0806"]]);
  ctx.fillRect(-220, DESK_Y, 2420, 300);
  // lit front edge
  ctx.fillStyle = "#4a2c19";
  ctx.fillRect(-220, DESK_Y - 14, 2420, 16);
  ctx.fillStyle = "rgba(255,226,168,.34)";
  ctx.fillRect(-220, DESK_Y - 14, 2420, 3);
  // warm sheen where the lamp lands
  ctx.globalCompositeOperation = "lighter";
  ctx.fillStyle = rg(ctx, 420, DESK_Y + 10, 780, [
    [0, `rgba(255,206,138,${0.20})`],
    [0.45, `rgba(226,150,78,${0.08})`],
    [1, "rgba(0,0,0,0)"],
  ]);
  ctx.fillRect(-220, DESK_Y - 60, 1500, 360);
  ctx.globalCompositeOperation = "source-over";
  ctx.lineWidth = 1.2;
  for (let i = 0; i < 22; i++) {
    const gy = DESK_Y + 20 + i * 8.5;
    ctx.strokeStyle = `rgba(255,214,150,${0.015 + hash(i) * 0.022})`;
    ctx.beginPath();
    ctx.moveTo(-220, gy);
    ctx.bezierCurveTo(500, gy + Math.sin(i) * 6, 1300, gy - Math.sin(i * 2) * 5, 2300, gy + Math.sin(i * 3) * 4);
    ctx.stroke();
  }
}

const LAMP = { x: 268, y: DESK_Y - 6 };
function drawLamp(ctx, t, flick) {
  const { x: bx, y: by } = LAMP;
  ctx.save();
  ctx.strokeStyle = "#9a7538";
  ctx.lineWidth = 12;
  ctx.beginPath();
  ctx.moveTo(bx - 44, by - 6);
  ctx.quadraticCurveTo(bx - 14, by - 120, bx + 2, by - 178);
  ctx.stroke();
  ctx.strokeStyle = "rgba(255,232,180,.4)";
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(bx - 48, by - 8);
  ctx.quadraticCurveTo(bx - 18, by - 120, bx - 2, by - 178);
  ctx.stroke();
  ctx.fillStyle = vg(ctx, by - 40, by + 12, [[0, "#c69a4d"], [1, "#5a3d1a"]]);
  ctx.beginPath(); ctx.ellipse(bx - 46, by, 78, 17, 0, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.ellipse(bx - 46, by - 15, 46, 13, 0, 0, Math.PI * 2); ctx.fill();
  const sx = bx + 4, sy = by - 214;
  ctx.fillStyle = rg(ctx, sx, sy + 30, 210, [[0, `rgba(248,206,138,${0.95 * flick})`], [0.45, `rgba(224,158,86,${0.9 * flick})`], [0.8, `rgba(186,120,58,.85)`], [1, "rgba(150,92,40,.6)"]]);
  ctx.beginPath();
  ctx.moveTo(sx - 138, sy + 46);
  ctx.quadraticCurveTo(sx - 100, sy - 60, sx, sy - 64);
  ctx.quadraticCurveTo(sx + 108, sy - 58, sx + 138, sy + 46);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = "rgba(255,240,200,.6)";
  ctx.lineWidth = 3;
  ctx.beginPath(); ctx.moveTo(sx - 138, sy + 46); ctx.lineTo(sx + 138, sy + 46); ctx.stroke();
  ctx.strokeStyle = "rgba(255,232,180,.4)";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(sx + 112, sy + 46);
  ctx.quadraticCurveTo(sx + 118 + Math.sin(t * 0.8) * 3, sy + 92, sx + 112, sy + 132);
  ctx.stroke();
  // desk pool + bounce into the room
  ctx.globalCompositeOperation = "lighter";
  ctx.fillStyle = rg(ctx, sx - 20, DESK_Y + 40, 560, [
    [0, `rgba(255,200,124,${0.26 * flick})`],
    [0.42, `rgba(226,152,76,${0.10 * flick})`],
    [1, "rgba(0,0,0,0)"],
  ]);
  ctx.fillRect(-220, DESK_Y - 120, 1400, 420);
  ctx.restore();
}

/* ---------- THE HOST (procedural rig) ----------
   Local origin = base of neck at desk level. Head centre ≈ (0,-190). Torso 0..205. */
const SKIN = ["#5a3626", "#a06b4a", "#c88f66", "#8a5638"];

function drawHost(ctx, t, rig) {
  const breathe = Math.sin(t * 1.35) * 0.007;
  const sway = Math.sin(t * 0.42) * 0.012;
  const yaw = rig.yaw, pitch = rig.pitch || 0;

  ctx.save();
  ctx.scale(1 + breathe, 1 + breathe);
  ctx.rotate(sway);

  /* shawl — oxblood velvet (object metaphor: the weight he carries) */
  P(ctx, [[-198, 22], [-224, 92], [-216, 172], [-198, 212], [198, 212], [220, 168], [224, 88], [196, 20], [146, -8], [-146, -8]]);
  ctx.fillStyle = dg(ctx, -220, 0, 220, 212, [[0, "#6d2427"], [0.3, "#9b363a"], [0.62, "#7a2a2e"], [1, "#451518"]]);
  ctx.fill();
  ctx.lineWidth = 3;
  for (let i = 0; i < 9; i++) {
    const o = -180 + i * 46;
    ctx.strokeStyle = i % 2 ? "rgba(0,0,0,.26)" : "rgba(255,190,180,.13)";
    ctx.beginPath();
    ctx.moveTo(o * 0.72, -6);
    ctx.bezierCurveTo(o * 0.9, 62, o * 0.86, 140, o * 0.78, 205);
    ctx.stroke();
  }
  // shawl rim
  ctx.strokeStyle = "rgba(255,222,180,.16)";
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(-198, 212);
  ctx.quadraticCurveTo(0, 226, 198, 212);
  ctx.stroke();

  /* blazer + crew neck */
  P(ctx, [[-158, 14], [-186, 78], [-178, 152], [-170, 210], [170, 210], [180, 148], [186, 74], [154, 12], [106, -20], [-106, -20]]);
  ctx.fillStyle = dg(ctx, -186, 0, 186, 210, [[0, "#282924"], [0.42, "#3f423c"], [0.75, "#1d1e1a"], [1, "#0e0f0d"]]);
  ctx.fill();
  P(ctx, [[-112, -16], [-138, 52], [-132, 130], [-126, 210], [126, 210], [134, 128], [140, 50], [112, -16], [58, -42], [-58, -42]]);
  ctx.fillStyle = "#0c0c0b";
  ctx.fill();

  /* arms reaching to the desk */
  for (const s of [-1, 1]) {
    P(ctx, [
      [s * 146, 16], [s * 196, 62], [s * 204, 128], [s * 188, 190],
      [s * 116, 206], [s * 108, 148], [s * 112, 84], [s * 92, 34]
    ]);
    ctx.fillStyle = dg(ctx, s * 96, 16, s * 200, 206, [[0, "#30312c"], [0.5, "#454740"], [1, "#171814"]]);
    ctx.fill();
  }

  /* neck */
  P(ctx, [[-42, -112], [-38, -34], [-58, 4], [58, 4], [38, -34], [42, -112]]);
  ctx.fillStyle = dg(ctx, -42, -114, 42, 6, [[0, SKIN[1]], [0.45, SKIN[2]], [1, SKIN[3]]]);
  ctx.fill();
  ctx.fillStyle = "rgba(0,0,0,.34)";
  ctx.beginPath(); ctx.ellipse(0, 0, 60, 24, 0, 0, Math.PI * 2); ctx.fill();

  /* --- clasped hands on the desk (drawn first so the head never overlaps them) --- */
  ctx.save();
  ctx.translate(Math.sin(t * 0.5) * 3, Math.sin(t * 1.1) * 2);
  ctx.fillStyle = dg(ctx, -120, 150, 120, 210, [[0, SKIN[2]], [0.5, SKIN[1]], [1, SKIN[3]]]);
  P(ctx, [[-104, 162], [-66, 140], [-14, 134], [38, 138], [92, 148], [116, 174], [104, 206], [-88, 210]]);
  ctx.fill();
  ctx.lineWidth = 2.2;
  ctx.strokeStyle = "rgba(64,36,24,.6)";
  for (let i = 0; i < 4; i++) {
    ctx.beginPath();
    ctx.moveTo(-62 + i * 40, 146 + (i % 2) * 6);
    ctx.quadraticCurveTo(-42 + i * 40, 176, -56 + i * 40, 206);
    ctx.stroke();
  }
  ctx.fillStyle = "#2a2823";
  ctx.beginPath(); ctx.roundRect(100, 152, 34, 54, 8); ctx.fill();
  ctx.strokeStyle = "rgba(255,214,150,.5)";
  ctx.lineWidth = 2;
  ctx.beginPath(); ctx.roundRect(102, 154, 30, 50, 7); ctx.stroke();
  ctx.restore();

  /* --- head --- */
  ctx.save();
  ctx.translate(yaw * 11, pitch * 9);
  ctx.rotate(yaw * 0.05 + pitch * 0.02);

  ctx.fillStyle = SKIN[3];
  ctx.beginPath(); ctx.ellipse(-94, -176, 15, 26, -0.12, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.ellipse(94, -176, 15, 26, 0.12, 0, Math.PI * 2); ctx.fill();

  P(ctx, [
    [-92, -196], [-102, -250], [-82, -306], [-32, -334], [26, -338],
    [78, -318], [98, -268], [98, -212], [94, -164], [76, -128],
    [40, -102], [-14, -100], [-60, -118], [-86, -152]
  ]);
  ctx.fillStyle = dg(ctx, -100, -340, 100, -100, [[0, SKIN[1]], [0.34, SKIN[2]], [0.7, "#c1875e"], [1, SKIN[3]]]);
  ctx.fill();

  ctx.save();
  ctx.clip();
  ctx.fillStyle = "rgba(96,54,34,.34)";
  P(ctx, [[-92, -300], [-58, -320], [-38, -240], [-58, -150], [-92, -150]]); ctx.fill();
  ctx.fillStyle = "rgba(96,54,34,.24)";
  P(ctx, [[68, -258], [98, -238], [96, -160], [68, -130]]); ctx.fill();
  ctx.fillStyle = "rgba(255,222,182,.16)";
  ctx.beginPath(); ctx.ellipse(4, -270, 62, 30, -0.12, 0, Math.PI * 2); ctx.fill();
  ctx.restore();

  // hair
  P(ctx, [
    [-98, -206], [-110, -262], [-82, -318], [-22, -344], [34, -342],
    [86, -318], [104, -258], [100, -214], [94, -236], [72, -292],
    [12, -318], [-50, -306], [-84, -262], [-90, -220]
  ]);
  ctx.fillStyle = dg(ctx, -110, -350, 110, -200, [[0, "#21211d"], [0.4, "#3b3b33"], [0.72, "#1d1e1a"], [1, "#0f100e"]]);
  ctx.fill();
  ctx.lineWidth = 2;
  for (let i = 0; i < 7; i++) {
    const o = -82 + i * 30;
    ctx.strokeStyle = i % 2 ? "rgba(196,178,150,.16)" : "rgba(0,0,0,.5)";
    ctx.beginPath();
    ctx.moveTo(o, -318 + hash(i) * 8);
    ctx.quadraticCurveTo(o + 12, -296, o + 20, -252 - hash(i + 2) * 16);
    ctx.stroke();
  }

  // beard
  P(ctx, [
    [-86, -168], [-90, -120], [-68, -78], [-28, -56], [18, -54],
    [64, -74], [90, -116], [92, -168], [68, -136], [28, -120], [-28, -122], [-64, -140]
  ]);
  ctx.fillStyle = dg(ctx, -90, -170, 90, -50, [[0, "#1d1e1b"], [0.45, "#34322c"], [1, "#131412"]]);
  ctx.fill();
  ctx.lineWidth = 1.6;
  for (let i = 0; i < 12; i++) {
    const o = -74 + i * 13;
    ctx.strokeStyle = "rgba(210,190,160,.12)";
    ctx.beginPath();
    ctx.moveTo(o, -130 + hash(i) * 10);
    ctx.lineTo(o + 3, -84 - hash(i + 1) * 20);
    ctx.stroke();
  }

  // brows
  ctx.strokeStyle = "#1d1a16";
  ctx.lineWidth = 9;
  ctx.lineCap = "round";
  const br = rig.brow;
  ctx.beginPath(); ctx.moveTo(-62, -226 + br * -3); ctx.quadraticCurveTo(-40, -236 + br * -4, -16, -228); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(16, -228); ctx.quadraticCurveTo(40, -236 + br * -4, 62, -226 + br * -3); ctx.stroke();

  // eyes
  for (const s of [-1, 1]) {
    const ex = s * 38, ey = -208;
    const open = 1 - rig.blink;
    ctx.fillStyle = "#e3d9c6";
    ctx.beginPath(); ctx.ellipse(ex, ey, 20, 11 * open + 0.6, 0, 0, Math.PI * 2); ctx.fill();
    if (open > 0.15) {
      ctx.fillStyle = "#3d2c1f";
      ctx.beginPath(); ctx.ellipse(ex + yaw * 3, ey, 10, 10 * open, 0, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = "#0b0907";
      ctx.beginPath(); ctx.ellipse(ex + yaw * 3, ey, 4.6, 4.8 * open, 0, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = "rgba(255,244,224,.75)";
      ctx.beginPath(); ctx.arc(ex + yaw * 3 - 3.5, ey - 3.5, 1.9, 0, Math.PI * 2); ctx.fill();
    }
    ctx.strokeStyle = "rgba(28,20,14,.9)";
    ctx.lineWidth = 2.6;
    ctx.beginPath();
    ctx.moveTo(ex - 20, ey - 8);
    ctx.quadraticCurveTo(ex, ey - 14 - 10 * rig.blink, ex + 20, ey - 8);
    ctx.stroke();
    ctx.strokeStyle = "rgba(64,44,30,.65)";
    ctx.beginPath();
    ctx.moveTo(ex - 18, ey + 9 * open);
    ctx.quadraticCurveTo(ex, ey + 14 * open, ex + 18, ey + 8 * open);
    ctx.stroke();
    ctx.fillStyle = "rgba(96,54,34,.20)";
    ctx.beginPath(); ctx.ellipse(ex, ey + 21, 18, 7, 0, 0, Math.PI * 2); ctx.fill();
  }

  // nose
  ctx.strokeStyle = "rgba(96,58,40,.6)";
  ctx.lineWidth = 3;
  ctx.beginPath(); ctx.moveTo(-4, -206); ctx.quadraticCurveTo(-12, -178, -8, -166); ctx.stroke();
  ctx.strokeStyle = "rgba(255,228,190,.26)";
  ctx.beginPath(); ctx.moveTo(6, -206); ctx.quadraticCurveTo(12, -180, 8, -166); ctx.stroke();
  ctx.fillStyle = "rgba(76,44,30,.55)";
  ctx.beginPath(); ctx.ellipse(0, -160, 16, 6, 0, 0, Math.PI * 2); ctx.fill();

  // mouth — opens while a caption is on screen
  const mo = rig.mouth;
  ctx.fillStyle = "#3d211d";
  ctx.beginPath();
  ctx.moveTo(-30, -126);
  ctx.quadraticCurveTo(0, -118 - mo * 16, 30, -126);
  ctx.quadraticCurveTo(0, -104 + mo * 20, -30, -126);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = "rgba(198,158,138,.6)";
  ctx.lineWidth = 2;
  ctx.beginPath(); ctx.moveTo(-30, -126); ctx.quadraticCurveTo(0, -120 - mo * 10, 30, -126); ctx.stroke();
  ctx.restore(); // head

  ctx.restore(); // body
}

/* rim light — Law 3 */
function drawRim(ctx, rig) {
  ctx.save();
  ctx.translate(960, 760);
  ctx.globalCompositeOperation = "lighter";
  ctx.strokeStyle = `rgba(255,206,140,${0.34 + 0.16 * (rig.flick || 1)})`;
  ctx.lineWidth = 5;
  ctx.beginPath();
  ctx.moveTo(-198, 34);
  ctx.bezierCurveTo(-226, 96, -218, 168, -200, 206);
  ctx.stroke();
  ctx.restore();
}

/* companion silhouette — "the other person" (rule beats) */
function drawCompanion(ctx, t, alpha) {
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.translate(1620, 830);
  P(ctx, [[-104, 60], [-132, 130], [-126, 200], [126, 200], [132, 128], [102, 56], [48, 16], [-48, 16]]);
  ctx.fillStyle = "#20201d";
  ctx.fill();
  ctx.beginPath(); ctx.ellipse(0, -34 + Math.sin(t * 1.2) * 2, 62, 76, 0, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = "rgba(255,214,150,.14)";
  ctx.beginPath(); ctx.ellipse(-26, -52, 22, 28, 0, 0, Math.PI * 2); ctx.fill();
  ctx.restore();
}

/* light shafts through the room */
function drawShafts(ctx, t, flick) {
  ctx.save();
  ctx.globalCompositeOperation = "lighter";
  const sx = LAMP.x + 4, sy = LAMP.y - 190;
  for (let i = 0; i < 7; i++) {
    const a = -0.30 + i * 0.13 + Math.sin(t * 0.13 + i) * 0.02;
    const w = 70 + hash(i * 3) * 80;
    const k = (0.06 + 0.06 * hash(i * 7)) * flick * (0.7 + 0.3 * Math.sin(t * 0.5 + i * 2));
    const g = ctx.createLinearGradient(sx, sy, sx + Math.sin(a) * 1300, sy + Math.cos(a) * 1300);
    g.addColorStop(0, `rgba(255,216,150,${k})`);
    g.addColorStop(0.5, `rgba(255,190,110,${k * 0.4})`);
    g.addColorStop(1, "rgba(0,0,0,0)");
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.moveTo(sx, sy);
    ctx.lineTo(sx + Math.sin(a - 0.02) * 1300 - w, sy + Math.cos(a) * 1300);
    ctx.lineTo(sx + Math.sin(a + 0.02) * 1300 + w, sy + Math.cos(a) * 1300);
    ctx.closePath();
    ctx.fill();
  }
  ctx.restore();
}

/* key light pool — lifts the subject out of the black canvas (Law 2 + Law 3) */
function drawKey(ctx, cam, flick, zoom) {
  const fx = 960 + (cam[0] - 0.5) * 260;
  const fy = 560 + (cam[1] - 0.5) * 220;
  ctx.save();
  ctx.globalCompositeOperation = "lighter";
  ctx.fillStyle = rg(ctx, fx, fy, 980 / zoom, [
    [0, `rgba(255,220,170,${0.52 * flick})`],
    [0.26, `rgba(240,172,104,${0.28 * flick})`],
    [0.58, `rgba(158,98,48,${0.10})`],
    [1, "rgba(0,0,0,0)"],
  ]);
  ctx.fillRect(-220, -160, 2420, 1440);
  ctx.restore();
}

/* ---------- main entry: one frame ---------- */
/* rig: {yaw,pitch,brow,blink,mouth,flick,companion,companionA,view} */
export function drawFrame(ctx, W, H, t, cam, rig) {
  const view = rig.view;
  const zoom = cam[2];
  const w = view.vw / zoom, h = view.vh / zoom;
  const cx = clamp(view.cx + (cam[0] - 0.5) * view.vw, w / 2 - 120, STAGE.w - w / 2 + 120);
  const cy = clamp(view.cy + (cam[1] - 0.5) * view.vh, h / 2 - 110, STAGE.h - h / 2 + 110);
  const s = W / w;

  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.fillStyle = PAL.inkDeep;
  ctx.fillRect(0, 0, W, H);
  ctx.save();
  ctx.translate(W / 2, H / 2);
  ctx.scale(s, s);
  ctx.translate(-cx, -cy);

  const px = (cx - STAGE.w / 2) * 0.05, py = (cy - STAGE.h / 2) * 0.05;

  drawKey(ctx, cam, rig.flick, zoom);
  ctx.save();
  ctx.translate(px * 2.4, py * 2.4);
  drawRoom(ctx);
  ctx.restore();

  if (rig.companion) drawCompanion(ctx, t, rig.companionA ?? 0.9);

  ctx.save();
  ctx.translate(960 + px, 760 + py);
  drawHost(ctx, t, rig);
  ctx.restore();

  drawRim(ctx, rig);

  ctx.save();
  ctx.translate(px * 1.6, py * 1.6);
  drawDesk(ctx);
  drawLamp(ctx, t, rig.flick);
  ctx.restore();

  drawShafts(ctx, t, rig.flick);
  ctx.restore();
}
