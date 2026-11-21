/* Talk to Society — Studio engine.
   Scene = code-drawn canvas characters (scene.js) -> Three.js optical printer
   (bloom + filmic grade + grain + vignette) -> DOM motion-graphics cards.

   Motion vocabulary, easings and pacing are the ones documented in
   nateherkai/herk-edit-kit MOTION_PHILOSOPHY.md. Everything is a pure function of
   time: window.setT(t) renders exactly one frame for the exporters. */
import * as THREE from "three";
import { EffectComposer } from "three/addons/postprocessing/EffectComposer.js";
import { RenderPass } from "three/addons/postprocessing/RenderPass.js";
import { UnrealBloomPass } from "three/addons/postprocessing/UnrealBloomPass.js";
import { OutputPass } from "three/addons/postprocessing/OutputPass.js";
import { ShaderPass } from "three/addons/postprocessing/ShaderPass.js";
import { drawFrame, computeView, cameraAt, PAL } from "./scene.js";
import { DEMO as HINDI_DEMO, ICONS as BASE_ICONS } from "./beats.js";

const FILM = window.STUDIO;
const q = new URLSearchParams(location.search);
const RECORD = q.get("record") === "1";
/* Beat sheets: ?timeline=demo (default, beats.js) | film (captions.js) | any key below. */
const SHEETS = { scarcity: "./beats-scarcity.js" };
const TL_PARAM = q.get("timeline") || "demo";
const TIMELINE = TL_PARAM === "film" ? "film" : SHEETS[TL_PARAM] ? TL_PARAM : "demo";
const SHEET = SHEETS[TIMELINE] ? await import(SHEETS[TIMELINE]) : null;
const DEMO = SHEET ? SHEET.DEMO : HINDI_DEMO;
const ICONS = { ...BASE_ICONS, ...(SHEET?.ICONS || {}) };
/* UI strings a beat sheet may override (defaults = the Hindi Talk to Society demo). */
const LABELS = { chip: "टॉक टू सोसाइटी", quote: "ओशो", outroBrand: "टॉक टू सोसाइटी", counter: "चेक किया", ...(DEMO.labels || {}) };
const [AW, AH] = (q.get("aspect") || "16:9").split(":").map(Number);
const ASPECT = AW / AH;
const PORTRAIT = ASPECT < 1;
const FPS = 30;

const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const smooth = (x) => x * x * (3 - 2 * x);
const hash = (n) => { const s = Math.sin(n * 127.1 + 0.7) * 43758.5453; return s - Math.floor(s); };
const env = (t, a, b, fi = 0.5, fo = 0.5) => smooth(clamp((t - a) / fi, 0, 1)) * smooth(clamp((b - t) / fo, 0, 1));
const backOut = (p) => { const c = 1.35, u = clamp(p, 0, 1) - 1; return 1 + (c + 1) * u * u * u + c * u * u; };
const expoOut = (p) => (p >= 1 ? 1 : 1 - Math.pow(2, -10 * clamp(p, 0, 1)));
const powIn = (p) => p * p * p;
const toSec = (s) => { const p = s.split(":").map(Number); return p.length === 3 ? p[0] * 3600 + p[1] * 60 + p[2] : p[0] * 60 + p[1]; };

/* ---------- timeline normalisation ---------- */
function chunkify(text, max = 3) {
  const w = text.split(/\s+/);
  const out = [];
  for (let i = 0; i < w.length; i += max) out.push(w.slice(i, i + max).join(" "));
  return out;
}

function buildDemo() {
  const layers = [];
  const caps = [];
  const cuts = [];
  for (const b of DEMO.beats) {
    if (b.title) layers.push({ type: "title", a: b.t0, b: b.t1, kicker: b.title.kicker, words: b.title.words, size: b.title.size, sizeP: b.title.sizeP, accent: b.accent });
    if (b.rule) layers.push({ type: "rule", a: b.t0, b: b.t1, text: b.rule, accent: b.accent });
    if (b.card) layers.push({ type: "card", a: b.t0 + 0.55, b: b.t1 - 0.05, ...b.card, accent: b.card.accent || b.accent });
    if (b.phone) layers.push({ type: "phone", a: b.t0 + 0.3, b: b.t1 - 0.05, ...b.phone, accent: b.accent });
    if (b.quote) layers.push({ type: "quote", a: b.t0, b: b.t1, ...b.quote, accent: b.accent });
    if (b.outro) layers.push({ type: "outro", a: b.t0, b: b.t1, ...b.outro, accent: b.accent });
    const cs = b.cap;
    cs.forEach(([t, text], i) => {
      const end = i + 1 < cs.length ? cs[i + 1][0] : b.t1;
      caps.push({ a: t, b: end, text, accent: b.accent });
    });
    layers.push({ type: "chip", a: b.t0, b: b.t1, kicker: b.title?.kicker || b.quote ? "" : "", label: b.chip || b.title?.kicker || (b.quote ? LABELS.quote : LABELS.chip), accent: b.accent });
    cuts.push(b.t0);
  }
  cuts.push(DEMO.duration);
  return { name: DEMO.name, duration: DEMO.duration, layers, caps, cuts, beats: DEMO.beats, camera: null };
}

function buildFilm() {
  const layers = [];
  const caps = [];
  const cuts = [];
  FILM.chapters.forEach((c, i) => {
    const a = toSec(c.t);
    const b = FILM.chapters[i + 1] ? toSec(FILM.chapters[i + 1].t) : FILM.duration;
    cuts.push(a);
    layers.push({ type: "title", a, b: a + c.dur, kicker: c.label, words: c.title.split(" "), size: 118, accent: PAL.oxblood });
    layers.push({ type: "chip", a: a + c.dur, b, label: c.label, accent: PAL.oxblood });
  });
  FILM.cards.forEach((c) => {
    const a = toSec(c.t0), b = toSec(c.t1);
    if (c.type === "quote") layers.push({ type: "quote", a, b, text: c.text, src: c.src, accent: PAL.gold });
    else if (c.type === "card") layers.push({ type: "card", a, b, icon: "dots", title: c.title, body: c.body, accent: PAL.oxblood });
    else if (c.type === "host") layers.push({ type: "card", a, b, icon: "spine", title: c.name, body: c.sub, accent: PAL.gold });
    else if (c.type === "cta") layers.push({ type: "card", a, b, icon: "bubble", title: c.title, body: `${c.a} · ${c.b}`, accent: PAL.teal });
    else if (c.type === "outro") layers.push({ type: "outro", a, b, lines: c.lines, tag: c.tag, accent: PAL.cream });
  });
  FILM.cues.forEach(([t, text], i) => {
    const a = toSec(t);
    const b = Math.min(FILM.cues[i + 1] ? toSec(FILM.cues[i + 1][0]) : FILM.duration, a + 9);
    const chunks = chunkify(text, 3);
    const total = chunks.reduce((s, c) => s + c.length, 0);
    let cur = a;
    chunks.forEach((ch) => {
      const d = ((b - a) * ch.length) / total;
      caps.push({ a: cur, b: cur + d, text: ch, accent: PAL.oxblood });
      cur += d;
    });
  });
  return { name: FILM.title + " — full film", duration: FILM.duration, layers, caps, cuts, beats: null, camera: FILM.camera };
}

const TL = TIMELINE === "film" ? buildFilm() : buildDemo();
const DURATION = TL.duration;
const VIEW = computeView(ASPECT);

/* ---------- renderer ---------- */
const stage = document.querySelector("#stage");
const canvas = document.querySelector("#gl");
const renderer = new THREE.WebGLRenderer({ canvas, antialias: false, preserveDrawingBuffer: true, powerPreference: "high-performance" });
renderer.setPixelRatio(RECORD ? 1 : Math.min(window.devicePixelRatio || 1, 1.5));
renderer.outputColorSpace = THREE.SRGBColorSpace;

const scene = new THREE.Scene();
const cam = new THREE.OrthographicCamera(-1, 1, 1, -1, -1, 1);
const buf = document.createElement("canvas");
const bctx = buf.getContext("2d", { alpha: false });

const mat = new THREE.ShaderMaterial({
  uniforms: { tMap: { value: null } },
  vertexShader: `varying vec2 vUv; void main(){ vUv = position.xy*.5+.5; gl_Position = vec4(position.xy,0.,1.); }`,
  fragmentShader: `uniform sampler2D tMap; varying vec2 vUv;
    void main(){ gl_FragColor = vec4(texture2D(tMap, vUv).rgb, 1.0); }`,
  depthTest: false, depthWrite: false,
});
const quad = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), mat);
quad.frustumCulled = false;
scene.add(quad);

const composer = new EffectComposer(renderer);
composer.addPass(new RenderPass(scene, cam));
const bloom = new UnrealBloomPass(new THREE.Vector2(512, 512), 0.9, 0.85, 0.42);
composer.addPass(bloom);
composer.addPass(new OutputPass());
const grade = new ShaderPass({
  uniforms: { tDiffuse: { value: null }, uTime: { value: 0 }, uRes: { value: new THREE.Vector2(1920, 1080) }, uWarm: { value: 0 } },
  vertexShader: `varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix*modelViewMatrix*vec4(position,1.); }`,
  fragmentShader: `
    uniform sampler2D tDiffuse; uniform float uTime, uWarm; uniform vec2 uRes; varying vec2 vUv;
    float h(vec2 p){ return fract(sin(dot(p, vec2(12.9898,78.233)))*43758.5453); }
    void main(){
      vec2 c = vUv-.5; float r = dot(c,c);
      vec2 off = c*r*.016;
      vec3 col = vec3(texture2D(tDiffuse, vUv+off).r, texture2D(tDiffuse, vUv).g, texture2D(tDiffuse, vUv-off).b);
      float lum = dot(col, vec3(.299,.587,.114));
      col = mix(col, col*vec3(.96,1.0,1.05), (1.-lum)*.20);          // cool the shadows
      col = mix(col, col*vec3(1.03,1.0,.96), uWarm*.35);              // warm swell on the payoff
      col = mix(col, col*col*(3.-2.*col), .22);                       // filmic contrast
      col *= 1. - smoothstep(.26,.92, length(c*vec2(1.06,1.0)))*.52;   // vignette, every scene
      float g = h(vUv*uRes + fract(uTime*7.31)*91.7) - .5;
      col += g * .05 * (1.-lum*.55);                                  // grain, every scene
      gl_FragColor = vec4(col, 1.);
    }`,
});
composer.addPass(grade);

function layout() {
  let W = window.innerWidth, H = window.innerHeight;
  let w = W, h = W / ASPECT;
  if (h > H) { h = H; w = H * ASPECT; }
  w = Math.floor(w); h = Math.floor(h);
  stage.style.width = w + "px"; stage.style.height = h + "px";
  stage.classList.toggle("portrait", PORTRAIT);
  document.documentElement.style.setProperty("--s", (w / (PORTRAIT ? 675 : 1920)) + "px");
  renderer.setSize(w, h, false);
  composer.setSize(w, h);
  const pr = renderer.getPixelRatio();
  buf.width = Math.round(w * pr); buf.height = Math.round(h * pr);
  grade.uniforms.uRes.value.set(buf.width, buf.height);
}
window.addEventListener("resize", () => { layout(); render(cur); });

/* crosshair markers (Law 10) — deterministic placement */
const gridEl = document.querySelector("#grid");
const crosses = [];
for (let i = 0; i < 16; i++) {
  const d = document.createElement("div");
  d.className = "cross";
  d.style.left = 4 + hash(i * 3.1) * 92 + "%";
  d.style.top = 6 + hash(i * 7.7) * 88 + "%";
  gridEl.appendChild(d);
  crosses.push(d);
}
const floor = gridEl.querySelector(".floor");

/* ---------- overlays ---------- */
const el = {};
["title", "rule", "card", "phone", "quote", "outro", "cap", "chip", "brand", "bar", "fade", "streak", "vign"].forEach((k) => (el[k] = document.querySelector("#" + (k === "rule" ? "rule-num" : k))));
const titleKick = el.title.querySelector(".kick"), titleLine = el.title.querySelector(".line");
const cardIco = el.card.querySelector(".ico"), cardTtl = el.card.querySelector(".ttl"), cardBody = el.card.querySelector(".body");
const phoneMsgs = el.phone.querySelector(".msgs"), phoneBar = el.phone.querySelector(".bar");
const capText = el.cap.querySelector("span"), capBar = el.cap.querySelector("u");
const chipEl = el.chip, brand = el.brand, barFill = el.bar.querySelector("i");
const outroLines = [...el.outro.querySelectorAll(".l")];

let painted = { key: "", words: "", card: "", phone: "", outro: "", chip: "" };

function setAccent(a) {
  document.documentElement.style.setProperty("--accent", a);
  stage.style.setProperty("--accent", a);
}

function showTitle(t, L, p, out) {
  if (painted.key !== L.a + L.kicker) {
    painted.key = L.a + L.kicker;
    titleKick.textContent = L.kicker;
    titleLine.innerHTML = L.words.map((w, i) => `<span class="w${i === 0 ? " hot" : ""}">${w}</span>`).join(" ");
    // 9:16: landscape sizes overflow the narrow frame; beats may set sizeP, else scale down (cap 100)
    const ts = PORTRAIT ? Math.min(L.sizeP || (L.size || 120) * 0.72, 100) : (L.size || 120);
    titleLine.style.setProperty("--ts", ts + "");
  }
  const ws = [...titleLine.children];
  ws.forEach((w, i) => {
    const wp = clamp((t - L.a - 0.1 - i * 0.16) / 0.42, 0, 1);
    const e = expoOut(wp);
    w.style.opacity = String(e * out);
    w.style.transform = `translateY(${(1 - e) * (i === 0 ? 60 : 26)}px) scale(${0.86 + e * 0.14})`;
    w.style.filter = `blur(${(1 - e) * 10}px)`;
  });
  titleKick.style.opacity = String(clamp((t - L.a - 0.05) / 0.4, 0, 1) * out);
  titleKick.style.transform = `translateX(${(1 - clamp((t - L.a) / 0.5, 0, 1)) * -40}px)`;
}

function render(t) {
  cur = clamp(t, 0, DURATION);
  const T = cur;

  /* --- camera --- */
  let c;
  if (TL.beats) {
    const b = TL.beats.find((x) => T >= x.t0 && T < x.t1) || TL.beats[TL.beats.length - 1];
    const p = smooth(clamp((T - b.t0) / (b.t1 - b.t0), 0, 1));
    c = [0, 0, 0].map((_, k) => b.cam[0][k] + (b.cam[1][k] - b.cam[0][k]) * p);
  } else {
    c = cameraAt(TL.camera, T);
  }
  // handheld drift (Law 4: camera never sleeps)
  const hx = Math.sin(T * 0.31) * 0.0035 + Math.sin(T * 0.77 + 1.3) * 0.0018;
  const hy = Math.cos(T * 0.27) * 0.003 + Math.sin(T * 0.61 + 0.4) * 0.0015;
  const cut = nearestCut(T);
  const kick = Math.exp(-Math.max(0, T - cut) * 9) * 0.012;
  c = [c[0] + hx + kick * Math.sin(T * 40), c[1] + hy - kick * Math.cos(T * 33), c[2] * (1 + Math.sin(T * 0.9) * 0.004)];

  /* --- rig --- */
  const activeCap = TL.caps.find((x) => T >= x.a - 2 / FPS && T < x.b);
  const beat = TL.beats ? TL.beats.find((x) => T >= x.t0 && T < x.t1) : null;
  const speaking = !!(activeCap && !(beat && beat.rig.still));
  const flick = 0.93 + (hash(Math.floor(T * 24)) - 0.5) * 0.10 + Math.sin(T * 2.9) * 0.03;
  let yaw = 0;
  if (beat) {
    const p = smooth(clamp((T - beat.t0) / (beat.t1 - beat.t0), 0, 1));
    yaw = (beat.rig.yaw || 0) * (0.6 + 0.4 * p);
  } else yaw = Math.sin(T * 0.14) * 0.3;
  const rig = {
    yaw, pitch: Math.sin(T * 0.5) * 0.12, brow: (beat?.rig.brow ?? 0) + Math.sin(T * 0.9) * 0.1,
    blink: blinkAt(T), mouth: speaking ? 0.22 + 0.78 * Math.abs(Math.sin(T * 11.3)) * Math.abs(Math.sin(T * 3.7)) : 0.06,
    companion: !!(beat?.rig.companion), companionA: beat?.rig.companionA ?? 0.9,
    flick, view: VIEW,
  };
  const warm = beat?.rig.warm ? smooth(clamp((T - beat.t0) / 1.2, 0, 1)) : 0;

  /* --- paint the scene, feed the printer --- */
  drawFrame(bctx, buf.width, buf.height, T, c, rig);
  mat.uniforms.tMap.value.needsUpdate = true;
  grade.uniforms.uTime.value = T;
  grade.uniforms.uWarm.value = warm;
  bloom.strength = 0.62 + 0.30 * (rig.flick - 0.93) * 8;
  composer.render();

  /* --- overlays --- */
  const ov = document.querySelector("#ov");
  setAccent(beat ? beat.accent : PAL.oxblood);
  brand.style.opacity = String(0.8 * env(T, 1.2, DURATION - 1.5, 1.2, 1.2));
  el.brand.style.zIndex = "0";
  floor.style.backgroundPositionY = `${(T * 12) % 96}px`;
  crosses.forEach((d, i) => { d.style.opacity = String(0.18 + 0.42 * Math.abs(Math.sin(T * (0.6 + hash(i) * 0.7) + i * 2.1))); });

  for (const L of TL.layers) {
    if (T < L.a - 0.05 || T > L.b + 0.05) continue;
    const dur = L.b - L.a;
    // whip exit (kit default transition): y -150, blur 30px, power2.in, 0.33s
    const outP = clamp((T - (L.b - 0.33)) / 0.33, 0, 1);
    const out = 1 - powIn(outP);
    const whip = powIn(outP) * 150;
    const blur = powIn(outP) * 26;

    if (L.type === "title") {
      el.title.style.opacity = "1";
      el.title.style.transform = `translateY(${whip}px)`;
      el.title.style.filter = `blur(${blur}px)`;
      showTitle(T, L, 0, out);
    } else if (L.type === "rule") {
      painted.rule = painted.rule === L.text ? painted.rule : (el.rule.textContent = L.text, L.text);
      const p = env(T, L.a, L.b, 0.8, 0.4);
      el.rule.style.opacity = String(p * 0.9);
      el.rule.style.transform = `translateY(${whip * 0.6}px) scale(${0.9 + p * 0.1})`;
    } else if (L.type === "card") {
      if (painted.card !== L.a + L.title) {
        painted.card = L.a + L.title;
        cardIco.innerHTML = `<svg viewBox="0 0 120 90" aria-hidden="true">${ICONS[L.icon] || ICONS.dots}</svg>`;
        cardTtl.textContent = L.title;
        cardBody.textContent = L.body;
      }
      const p = backOut(clamp((T - L.a) / 0.5, 0, 1));
      el.card.style.opacity = String(clamp((T - L.a) / 0.35, 0, 1) * out);
      el.card.style.transform = `translateX(${(1 - p) * 70 + whip}px)`;
      el.card.style.filter = `blur(${blur}px)`;
    } else if (L.type === "phone") {
      if (painted.phone !== L.a) {
        painted.phone = L.a;
        phoneBar.children[0].textContent = L.time || "2:14";
        phoneMsgs.innerHTML = (L.msgs || [])
          .map((m) => m.who === "typing"
            ? `<div class="msg them"><span class="typing"><i></i><i></i><i></i></span></div>`
            : `<div class="msg ${m.who}">${m.text}${m.seen ? `<span class="seen">${m.seen}</span>` : ""}</div>`)
          .join("");
      }
      const p = backOut(clamp((T - L.a) / 0.5, 0, 1));
      el.phone.style.opacity = String(clamp((T - L.a) / 0.3, 0, 1) * out);
      el.phone.style.transform = `translateY(${(1 - p) * 60 + whip}px)`;
      const msgs = [...phoneMsgs.children];
      msgs.forEach((m, i) => {
        const mp = clamp((T - L.a - 0.25 - i * 0.22) / 0.4, 0, 1);
        m.style.opacity = String(expoOut(mp));
        m.style.transform = `translateY(${(1 - expoOut(mp)) * 22}px)`;
      });
      if (L.counter) {
        const n = 1 + Math.floor(clamp((T - L.a) / 1.2, 0, 1) * 21);
        phoneBar.children[1].textContent = `${LABELS.counter} ×${n}`;
      } else phoneBar.children[1].textContent = "chat";
    } else if (L.type === "quote") {
      const p = env(T, L.a, L.b, 0.9, 0.7);
      el.quote.style.opacity = String(p);
      el.quote.querySelector(".qt").style.transform = `scale(${0.94 + p * 0.06}) translateY(${whip * 0.3}px)`;
      el.vign.style.opacity = String(0.55 + p * 0.45);
    } else if (L.type === "outro") {
      if (painted.outro !== L.a) {
        painted.outro = L.a;
        el.outro.querySelector(".brand").textContent = LABELS.outroBrand;
        outroLines.forEach((l, i) => (l.textContent = L.lines[i] || ""));
        el.outro.querySelector(".tag").textContent = L.tag || "";
      }
      const p = env(T, L.a, L.b, 1.0, 1.4);
      el.outro.style.opacity = String(p);
      el.outro.querySelector(".mark").style.transform = `rotate(45deg) scale(${0.85 + p * 0.15})`;
      el.outro.querySelector(".mark").style.filter = `blur(${(1 - p) * 12}px)`;
      outroLines.forEach((l, i) => {
        const lp = expoOut(clamp((T - L.a - 0.5 - i * 0.55) / 0.7, 0, 1));
        l.style.opacity = String(lp);
        l.style.transform = `translateY(${(1 - lp) * 24}px)`;
      });
      el.vign.style.opacity = String(0.5 + p * 0.5);
    }
  }
  // hide layers that are out of range
  for (const [k, node] of [["title", el.title], ["rule", el.rule], ["card", el.card], ["phone", el.phone], ["quote", el.quote], ["outro", el.outro]]) {
    const live = TL.layers.some((L) => L.type === k && T >= L.a - 0.05 && T <= L.b + 0.05);
    if (!live) node.style.opacity = "0";
  }
  if (!TL.layers.some((L) => (L.type === "quote" || L.type === "outro") && T >= L.a && T <= L.b)) el.vign.style.opacity = "1";

  /* chip */
  const busy = TL.layers.some((L) => ["title", "rule", "quote", "outro"].includes(L.type) && T >= L.a - 0.05 && T <= L.b);
  const chip = busy ? null : TL.layers.find((L) => L.type === "chip" && T >= L.a && T < L.b);
  if (chip) {
    if (painted.chip !== chip.a) { painted.chip = chip.a; chipEl.innerHTML = `<b>${chip.label}</b>`; }
    const p = env(T, chip.a, chip.b, 0.5, 0.5);
    chipEl.style.opacity = String(p * 0.95);
    chipEl.style.transform = `translateY(${(1 - p) * -14}px)`;
  } else chipEl.style.opacity = "0";

  /* captions: hard swap, 2 frames early, progress underline */
  if (activeCap) {
    if (painted.capText !== activeCap.a) {
      painted.capText = activeCap.a;
      capText.textContent = activeCap.text;
    }
    el.cap.style.setProperty("--accent", activeCap.accent || PAL.oxblood);
    el.cap.style.opacity = "1";
    capBar.style.width = `${clamp((T - activeCap.a) / (activeCap.b - activeCap.a), 0, 1) * 100}%`;
  } else { el.cap.style.opacity = "0"; capBar.style.width = "0%"; }

  /* whip streak at every cut (Law 5) */
  const sp = clamp((T - (cut - 0.18)) / 0.36, 0, 1);
  if (sp > 0 && sp < 1 && cut > 0.5) {
    el.streak.style.opacity = String(Math.sin(Math.PI * sp));
    el.streak.style.transform = `translateX(${-120 + sp * 340}%) skewX(-14deg)`;
  } else el.streak.style.opacity = "0";

  /* fade in/out */
  el.fade.style.opacity = String(1 - Math.min(smooth(clamp(T / 1.2, 0, 1)), smooth(clamp((DURATION - T) / 2.4, 0, 1))));
  el.bar.style.opacity = RECORD ? "0" : "1";
  barFill.style.width = (T / DURATION) * 100 + "%";
}

function nearestCut(t) {
  let best = 0;
  for (const c of TL.cuts) if (c <= t && c > best) best = c;
  return best;
}
function blinkAt(t) {
  const k = Math.floor(t / 3.4);
  for (let i = -1; i <= 1; i++) {
    const bt = (k + i) * 3.4 + hash(k + i) * 2.2;
    const d = t - bt;
    if (d > 0 && d < 0.13) return Math.sin((d / 0.13) * Math.PI);
  }
  return 0;
}

/* ---------- preview playback ---------- */
let cur = 0, playing = false, last = 0;
function tick(ts) {
  if (!playing) return;
  const dt = last ? (ts - last) / 1000 : 0; last = ts;
  let nt = cur + dt;
  if (nt >= DURATION) { nt = DURATION; playing = false; post({ type: "state", playing: false }); }
  render(nt);
  if (playing) requestAnimationFrame(tick);
}
function play() { if (cur >= DURATION - 0.05) cur = 0; playing = true; last = 0; post({ type: "state", playing: true }); requestAnimationFrame(tick); }
function pause() { playing = false; post({ type: "state", playing: false }); }
function post(m) { if (window.parent !== window) window.parent.postMessage({ source: "studio", ...m }, "*"); }
window.addEventListener("message", (e) => {
  const m = e.data || {};
  if (m.type === "play") play();
  else if (m.type === "pause") pause();
  else if (m.type === "seek") render(m.t);
});
window.addEventListener("keydown", (e) => {
  if (e.code === "Space") { e.preventDefault(); playing ? pause() : play(); }
  if (e.key === "ArrowRight") render(cur + 2);
  if (e.key === "ArrowLeft") render(cur - 2);
});
stage.addEventListener("click", () => { if (!RECORD) (playing ? pause() : play()); });
setInterval(() => post({ type: "time", t: cur }), 100);

/* ---------- boot ---------- */
window.setT = (t) => render(t);
window.__duration = DURATION;
window.__ready = false;
layout();
const tex = new THREE.CanvasTexture(buf);
tex.colorSpace = THREE.SRGBColorSpace;
tex.minFilter = THREE.LinearFilter;
tex.magFilter = THREE.LinearFilter;
tex.generateMipmaps = false;
mat.uniforms.tMap.value = tex;
/* Hard font gate: never render before the Devanagari faces are really usable.
   Without this, a headless render produces tofu boxes for every Hindi glyph. */
const FACES = [
  ["400 40px NSD", "अआ"], ["700 40px NSD", "अआ"], ["700 40px NSerif", "अआ"], ["600 20px InterLocal", "AB"],
];
window.__fontsOk = false;
for (let attempt = 0; attempt < 40; attempt++) {
  try {
    await Promise.all(FACES.map(([f, g]) => document.fonts.load(f, g)));
  } catch {}
  const ok = FACES.every(([f, g]) => document.fonts.check(f, g));
  if (ok) { window.__fontsOk = true; break; }
  await new Promise((r) => setTimeout(r, 250));
}
if (!window.__fontsOk) console.error("[studio] Devanagari fonts failed to load — Hindi will render as tofu");
await document.fonts.ready;
/* Render guard: tokens.css must have applied too, otherwise every var() font/gradient
   is empty -> invisible headlines and tofu captions. */
const probe = document.querySelector("#cap");
const cssOk = getComputedStyle(probe).fontFamily.includes("NSD");
window.__renderSafe = window.__fontsOk && cssOk;
if (!cssOk) console.error("[studio] tokens.css did not apply — overlays would render unstyled");
render(Number(q.get("t") || 0));
window.__ready = true;
post({
  type: "ready", duration: DURATION, timeline: TIMELINE,
  beats: TL.beats ? TL.beats.map((b) => ({ t: b.t0, label: b.title?.kicker || (b.quote ? LABELS.quote : LABELS.chip), title: b.title?.words.join(" ") || b.quote?.text || b.outro?.lines?.[0] || "" })) : [],
});
if (q.get("autoplay") === "1") play();
