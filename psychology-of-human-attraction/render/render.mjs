#!/usr/bin/env node
/* Talk to Society — Node.js studio renderer
   Three.js scene (public/studio) -> Playwright/Chromium frame stepping -> ffmpeg -> MP4 (+ SRT)

   node render/render.mjs --aspect 16:9 --fps 30 --start 0 --end 30 --out renders/hook.mp4
   Options: --aspect 16:9|9:16  --width N --height N  --fps N  --start S --end S
            --crf N  --png (lossless frames)  --audio file.mp3  --status file.json  --out file.mp4
*/
import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import { spawn } from "node:child_process";
import { fileURLToPath } from "node:url";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const studioDir = path.join(root, "public", "studio");
const { chromium } = require("playwright");
const ffmpegPath = require("ffmpeg-static");

/* ---- args ---- */
const argv = process.argv.slice(2);
const opt = {};
for (let i = 0; i < argv.length; i++) {
  if (argv[i].startsWith("--")) {
    const k = argv[i].slice(2);
    const v = argv[i + 1] && !argv[i + 1].startsWith("--") ? argv[++i] : "true";
    opt[k] = v;
  }
}
const aspect = opt.aspect || "16:9";
const portrait = aspect === "9:16";
const W = Number(opt.width || (portrait ? 1080 : 1920));
const H = Number(opt.height || (portrait ? 1920 : 1080));
const FPS = Number(opt.fps || 30);
const START = Number(opt.start || 0);
const crf = String(opt.crf || 17);
const out = path.resolve(root, opt.out || `renders/talk-to-society-${aspect.replace(":", "x")}.mp4`);
fs.mkdirSync(path.dirname(out), { recursive: true });

/* ---- script data (shared with the browser) ---- */
const sandbox = {};
new Function("window", fs.readFileSync(path.join(studioDir, "captions.js"), "utf8"))(sandbox);
const sandbox2 = {};
// Beat sheets are ES modules for the browser; strip `export` so new Function can evaluate them.
// Keep this map in sync with SHEETS in public/studio/main.js.
const SHEETS = { demo: "beats.js", scarcity: "beats-scarcity.js" };
const sheetFile = SHEETS[opt.timeline] || SHEETS.demo;
const beatsSrc = fs
  .readFileSync(path.join(studioDir, sheetFile), "utf8")
  .replace(/^export\s+/gm, "");
new Function("window", beatsSrc + "\nwindow.DEMO = typeof DEMO === 'undefined' ? null : DEMO;")(sandbox2);
const STUDIO = sandbox.STUDIO;
const DEMO_BEATS = sandbox2.DEMO ? sandbox2.DEMO.beats : [];
const END = opt.end ? Number(opt.end) : (opt.timeline === "film" ? STUDIO.duration : (sandbox2.DEMO?.duration || 30));
const total = Math.max(1, Math.round((END - START) * FPS));

function writeStatus(s) {
  if (!opt.status) return;
  try { fs.writeFileSync(opt.status, JSON.stringify(s)); } catch {}
}

/* ---- SRT sidecar ---- */
function toSrtTime(sec) {
  const ms = Math.round(sec * 1000);
  const p = (n, l = 2) => String(n).padStart(l, "0");
  return `${p(Math.floor(ms / 3600000))}:${p(Math.floor(ms / 60000) % 60)}:${p(Math.floor(ms / 1000) % 60)},${p(ms % 1000, 3)}`;
}
function buildSrt() {
  const sec = (s) => { const p = s.split(":").map(Number); return p[0] * 60 + p[1]; };
  const cues = STUDIO.cues.map(([t, text], i, a) => {
    const s = sec(t); const n = a[i + 1] ? sec(a[i + 1][0]) : 1230;
    return { s, e: Math.min(n, s + 9), text };
  }).filter((c) => c.e > START && c.s < END);
  return cues.map((c, i) => `${i + 1}\n${toSrtTime(Math.max(0, c.s - START))} --> ${toSrtTime(Math.min(END, c.e) - START)}\n${c.text}\n`).join("\n");
}
function buildDemoSrt() {
  const cues = [];
  for (const b of (opt.timeline && opt.timeline !== "demo" ? DEMO_BEATS : (STUDIO.demo || DEMO_BEATS))) {
    const cs = b.cap;
    cs.forEach(([t, text], i) => {
      const end = i + 1 < cs.length ? cs[i + 1][0] : b.t1;
      if (end > START && t < END) cues.push({ s: t, e: end, text });
    });
  }
  return cues.map((c, i) => `${i + 1}\n${toSrtTime(Math.max(0, c.s - START))} --> ${toSrtTime(Math.min(END, c.e) - START)}\n${c.text}\n`).join("\n");
}

/* ---- tiny static server for the Three.js studio ---- */
const MIME = { ".html": "text/html", ".js": "text/javascript", ".mjs": "text/javascript", ".css": "text/css", ".jpg": "image/jpeg", ".jpeg": "image/jpeg", ".png": "image/png", ".ttf": "font/ttf", ".otf": "font/otf", ".woff": "font/woff", ".woff2": "font/woff2", ".json": "application/json" };
const server = http.createServer((req, res) => {
  const u = decodeURIComponent(new URL(req.url, "http://x").pathname);
  const file = path.normalize(path.join(studioDir, u === "/" ? "index.html" : u));
  if (!file.startsWith(studioDir) || !fs.existsSync(file) || fs.statSync(file).isDirectory()) { res.writeHead(404); return res.end(); }
  res.writeHead(200, { "Content-Type": MIME[path.extname(file)] || "application/octet-stream" });
  fs.createReadStream(file).pipe(res);
});
await new Promise((r) => server.listen(0, "127.0.0.1", r));
const port = server.address().port;

/* ---- browser + ffmpeg ---- */
// Optional overrides for environments without Playwright's bundled browser:
//   CHROMIUM_PATH=/path/to/chrome  CHROMIUM_ARGS="--single-process --no-zygote"
const browser = await chromium.launch({
  ...(process.env.CHROMIUM_PATH ? { executablePath: process.env.CHROMIUM_PATH } : {}),
  args: ["--no-sandbox", "--use-gl=angle", "--use-angle=swiftshader", "--enable-unsafe-swiftshader", "--ignore-gpu-blocklist", "--disable-gpu-vsync",
    ...(process.env.CHROMIUM_ARGS ? process.env.CHROMIUM_ARGS.split(/\s+/).filter(Boolean) : [])]
});
let ff;
try {
  const page = await browser.newPage({ viewport: { width: W, height: H }, deviceScaleFactor: 1 });
  page.on("pageerror", (e) => console.error("page error:", e.message));
  const timeline = opt.timeline || "demo";
  await page.goto(`http://127.0.0.1:${port}/index.html?record=1&aspect=${aspect}&timeline=${timeline}`);
  await page.waitForFunction("window.__ready === true", null, { timeout: 90000 });
  const ok = await page
    .waitForFunction("window.__renderSafe === true", null, { timeout: 30000 })
    .then(() => true)
    .catch(() => false);
  if (!ok) throw new Error("Render guard failed: token stylesheet or Devanagari fonts did not resolve — aborting to avoid tofu/invisible output");

  const png = opt.png === "true";
  const args = ["-y", "-loglevel", "error", "-f", "image2pipe", "-framerate", String(FPS), "-vcodec", png ? "png" : "mjpeg", "-i", "-"];
  if (opt.audio) args.push("-ss", String(START), "-i", path.resolve(opt.audio));
  args.push("-c:v", "libx264", "-preset", "medium", "-crf", crf, "-pix_fmt", "yuv420p", "-r", String(FPS),
    "-vf", "format=yuv420p", "-movflags", "+faststart", "-color_primaries", "bt709", "-color_trc", "bt709", "-colorspace", "bt709");
  if (opt.audio) args.push("-c:a", "aac", "-b:a", "256k", "-shortest"); else args.push("-an");
  args.push(out);
  ff = spawn(ffmpegPath, args, { stdio: ["pipe", "inherit", "inherit"] });
  const ffDone = new Promise((res, rej) => { ff.on("close", (c) => (c ? rej(new Error("ffmpeg exited " + c)) : res())); ff.on("error", rej); });
  ff.stdin.on("error", () => {});

  const t0 = Date.now();
  writeStatus({ state: "running", frame: 0, total, message: "Rendering frames" });
  for (let i = 0; i < total; i++) {
    await page.evaluate((t) => window.setT(t), START + i / FPS);
    const buf = await page.screenshot(png ? { type: "png" } : { type: "jpeg", quality: 95, animations: "disabled" });
    if (!ff.stdin.write(buf)) await new Promise((r) => ff.stdin.once("drain", r));
    if (i % 10 === 0 || i === total - 1) {
      const el = (Date.now() - t0) / 1000, rate = (i + 1) / el;
      writeStatus({ state: "running", frame: i + 1, total, fps: +rate.toFixed(2), eta: Math.round((total - i - 1) / rate), message: "Rendering frames" });
      if (i % 60 === 0) console.log(`${i + 1}/${total} frames  ${rate.toFixed(2)} fps`);
    }
  }
  ff.stdin.end();
  writeStatus({ state: "running", frame: total, total, message: "Encoding MP4" });
  await ffDone;
  const srt = out.replace(/\.mp4$/, ".srt");
  fs.writeFileSync(srt, timeline === "film" ? buildSrt() : buildDemoSrt());
  writeStatus({ state: "done", frame: total, total, file: path.basename(out), srt: path.basename(srt), bytes: fs.statSync(out).size, message: "Done" });
  console.log("Saved", out);
} catch (e) {
  console.error(e);
  writeStatus({ state: "error", message: String(e && e.message ? e.message : e) });
  process.exitCode = 1;
} finally {
  await browser.close().catch(() => {});
  server.close();
}
