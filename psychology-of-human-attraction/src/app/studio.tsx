"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

type Chapter = { t: number; label: string; title: string };
type Aspect = "16:9" | "9:16";
type Status = {
  state: "queued" | "running" | "done" | "error";
  frame?: number;
  total?: number;
  fps?: number;
  eta?: number;
  message?: string;
  bytes?: number;
};
type Job = { meta: { id: string; aspect: Aspect; fps: number; start: number; end: number; crf: number }; status: Status };

const DURATION = 30;
const fmt = (s: number) => `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(Math.floor(s % 60)).padStart(2, "0")}`;
const parseTime = (v: string) => {
  if (v.includes(":")) {
    const [m, s] = v.split(":").map(Number);
    return (m || 0) * 60 + (s || 0);
  }
  return Number(v) || 0;
};

type Timeline = "demo" | "film" | "scarcity";
/* Finished renders shipped in public/demo/ (see vo/scarcity/SCRIPT.md for how they were made). */
const DEMO_VIDEOS = [
  {
    file: "stickworld-scarcity-30s",
    title: "Scarcity & Attraction — Stickworld",
    meta: "NEW · Continuous 2.5D stick-figure animation · 9:16 · 0:30 · English voice-over",
    portrait: true,
    mb: 0,
  },
  {
    file: "scarcity-attraction-30s-shorts-9x16",
    title: "Scarcity & Attraction — previous style",
    meta: "YouTube Shorts / Reels · 9:16 · 1080×1920 · 0:30 · English voice-over",
    portrait: true,
    mb: 20.9,
  },
  {
    file: "scarcity-attraction-30s-en",
    title: "Scarcity & Attraction — previous style",
    meta: "YouTube · 16:9 · 1920×1080 · 0:30 · English voice-over",
    portrait: false,
    mb: 23.4,
  },
  {
    file: "talk-to-society-demo-30s",
    title: "Talk to Society — 30s demo",
    meta: "16:9 · 1920×1080 · 0:30 · Hindi captions · no audio",
    portrait: false,
    mb: 18.6,
  },
];
const SCARCITY_PRESETS = [
  { name: "Full demo · 30s", start: "0:00", end: "0:30" },
  { name: "Hook + setup · 0–8.1s", start: "0:00", end: "8.1" },
  { name: "Cookie-jar study · 8.1–17.6s", start: "8.1", end: "17.6" },
  { name: "Payoff + outro · 17.6–30s", start: "17.6", end: "0:30" },
];
const SCARCITY_BEATS = [
  { t: 0, label: "HOOK", title: "Always available?" },
  { t: 4.05, label: "BEAT 02 · ALWAYS ON", title: "Instant replies. Always yes." },
  { t: 8.11, label: "THE STUDY · 1975", title: "Same cookie. Two jars." },
  { t: 14.47, label: "THE RESULT", title: "Nearly empty jar = more desirable" },
  { t: 17.6, label: "THE PRINCIPLE", title: "Scarcity signals value." },
  { t: 19.12, label: "BUT —", title: "Not hard to get." },
  { t: 21.17, label: "THE REAL SCARCITY", title: "A full life." },
  { t: 25.36, label: "OUTRO", title: "Be someone worth missing." },
];
const DEMO_PRESETS = [
  { name: "Full demo · 30s", start: "0:00", end: "0:30" },
  { name: "Hook · 0–2.4s", start: "0:00", end: "2.4" },
  { name: "Rules 1–3 · 6.8–13.6s", start: "6.8", end: "13.6" },
  { name: "Quote + payoff · 18–23.6s", start: "18", end: "23.6" },
];
const FILM_PRESETS = [
  { name: "Hook · 0:00–0:30", start: "0:00", end: "0:30" },
  { name: "Osho quote · 1:55–2:25", start: "1:55", end: "2:25" },
  { name: "Rule 1 · 4:05–4:35", start: "4:05", end: "4:35" },
  { name: "Full film · 20:33", start: "0:00", end: "20:33" },
];
const DEMO_BEATS = [
  { t: 0, label: "बीट 01 · हुक", title: "अगर कोई भाव नहीं देता" },
  { t: 2.4, label: "बीट 02 · कोशिश", title: "और ज़्यादा कोशिश" },
  { t: 4.6, label: "बीट 03 · चक्र", title: "बार-बार चेक" },
  { t: 6.8, label: "रूल 01", title: "रिश्ते को अकेले चलाना बंद" },
  { t: 9.2, label: "रूल 02", title: "थोड़े अटेंशन को प्यार न मानें" },
  { t: 11.4, label: "रूल 03", title: "अपनी कीमत साबित करना बंद" },
  { t: 13.6, label: "रूल 04", title: "जलाने का खेल मत खेलिए" },
  { t: 15.8, label: "रूल 05 · समाधान", title: "अपनी बात साफ़ कहिए" },
  { t: 18, label: "ओशो", title: "प्रेम एक स्वतंत्रता का दान है" },
  { t: 20.8, label: "निष्कर्ष", title: "आत्मसम्मान मज़बूत करें" },
  { t: 23.6, label: "आउट्रो", title: "टॉक टू सोसाइटी" },
];
const QUALITY = [
  { name: "Draft", crf: 24 },
  { name: "Studio", crf: 17 },
  { name: "Master", crf: 14 },
];

export default function Studio() {
  const [aspect, setAspect] = useState<Aspect>("16:9");
  const [timeline, setTimeline] = useState<Timeline>("demo");
  const [t, setT] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [ready, setReady] = useState(false);
  const [chapters, setChapters] = useState<Chapter[]>(DEMO_BEATS);
  const frame = useRef<HTMLIFrameElement>(null);

  const [start, setStart] = useState("0:00");
  const [end, setEnd] = useState("0:30");
  const [fps, setFps] = useState(30);
  const [crf, setCrf] = useState(17);
  const [job, setJob] = useState<Job | null>(null);
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);

  const send = useCallback((m: object) => frame.current?.contentWindow?.postMessage(m, "*"), []);

  useEffect(() => {
    const onMsg = (e: MessageEvent) => {
      const m = e.data;
      if (!m || m.source !== "studio") return;
      if (m.type === "ready") {
        setReady(true);
        setChapters(m.beats?.length ? m.beats : DEMO_BEATS);
      } else if (m.type === "time") setT(m.t);
      else if (m.type === "state") setPlaying(m.playing);
    };
    window.addEventListener("message", onMsg);
    return () => window.removeEventListener("message", onMsg);
  }, []);

  // resume tracking of a running job after reload
  useEffect(() => {
    fetch("/api/render")
      .then((r) => r.json())
      .then((d: { jobs: Job[] }) => {
        const latest = d.jobs?.[0];
        if (latest) setJob(latest);
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (!job || (job.status.state !== "running" && job.status.state !== "queued")) return;
    const id = setInterval(async () => {
      const r = await fetch(`/api/render?id=${job.meta.id}`);
      if (r.ok) setJob(await r.json());
    }, 1500);
    return () => clearInterval(id);
  }, [job]);

  const seek = (v: number) => {
    setT(v);
    send({ type: "seek", t: v });
  };
  const toggle = () => send({ type: playing ? "pause" : "play" });
  const changeAspect = (a: Aspect) => {
    if (a === aspect) return;
    setReady(false);
    setPlaying(false);
    setAspect(a);
  };
  const changeTimeline = (tl: Timeline) => {
    if (tl === timeline) return;
    setReady(false);
    setPlaying(false);
    setTimeline(tl);
    setStart("0:00");
    setEnd(tl === "film" ? "20:33" : "0:30");
    setChapters(tl === "demo" ? DEMO_BEATS : tl === "scarcity" ? SCARCITY_BEATS : []);
  };

  const startRender = async () => {
    setErr("");
    setBusy(true);
    try {
      const r = await fetch("/api/render", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ aspect, fps, crf, timeline, start: parseTime(start), end: parseTime(end) }),
      });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error || "Failed to start");
      const j = await fetch(`/api/render?id=${d.id}`).then((x) => x.json());
      setJob(j);
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Failed");
    } finally {
      setBusy(false);
    }
  };

  const active = useMemo(() => {
    let i = -1;
    chapters.forEach((c, k) => {
      if (t >= c.t) i = k;
    });
    return i;
  }, [chapters, t]);

  const running = job && (job.status.state === "running" || job.status.state === "queued");
  const pct = job?.status.total ? Math.round(((job.status.frame ?? 0) / job.status.total) * 100) : 0;
  const reqFrames = Math.max(1, Math.round((parseTime(end) - parseTime(start)) * fps));

  return (
    <div className="min-h-screen bg-[#0c0706] text-[#f1e3cc]">
      <header className="flex flex-wrap items-center justify-between gap-3 border-b border-[#3a2418] px-6 py-4">
        <div className="flex items-center gap-3">
          <span className="grid h-9 w-9 rotate-45 place-items-center border border-[#e0b27a] bg-[#7d2a2e]" />
          <div>
            <h1 className="text-lg font-semibold tracking-[0.3em] text-[#f3d3a4]">TALK TO SOCIETY</h1>
            <p className="text-xs text-[#a58d73]">Studio · Three.js motion engine · Node.js &amp; Python MP4 pipeline</p>
          </div>
        </div>
        <div className="flex gap-2 text-xs">
          {(["16:9", "9:16"] as Aspect[]).map((a) => (
            <button
              key={a}
              onClick={() => changeAspect(a)}
              className={`rounded-full border px-4 py-2 font-semibold transition ${
                aspect === a ? "border-[#e0b27a] bg-[#e0b27a] text-[#1a0d09]" : "border-[#4a3020] text-[#cdb593] hover:border-[#e0b27a]"
              }`}
            >
              {a === "16:9" ? "▭ 16:9 · 1920×1080" : "▯ 9:16 · 1080×1920"}
            </button>
          ))}
        </div>
      </header>

      <main className="mx-auto grid max-w-[1500px] gap-6 p-6 lg:grid-cols-[minmax(0,1fr)_420px]">
        <section className="min-w-0">
          <div className="flex justify-center rounded-2xl border border-[#3a2418] bg-black p-3">
            <div
              className="relative w-full overflow-hidden rounded-lg bg-black"
              style={aspect === "16:9" ? { aspectRatio: "16 / 9" } : { aspectRatio: "9 / 16", maxHeight: "72vh", width: "auto" }}
            >
              <iframe
                key={aspect}
                ref={frame}
                title="Studio preview"
                src={`/studio/index.html?aspect=${aspect}&timeline=${timeline}`}
                className="absolute inset-0 h-full w-full border-0"
              />
              {!ready && <div className="absolute inset-0 grid place-items-center bg-black text-sm text-[#a58d73]">Loading scene…</div>}
            </div>
          </div>

          <div className="mt-4 rounded-2xl border border-[#3a2418] bg-[#140b08] p-4">
            <div className="flex items-center gap-4">
              <button
                onClick={toggle}
                disabled={!ready}
                className="h-11 w-24 rounded-full bg-[#e0b27a] text-sm font-bold text-[#1a0d09] disabled:opacity-40"
              >
                {playing ? "❚❚ Pause" : "▶ Play"}
              </button>
              <div className="relative flex-1">
                <input
                  type="range"
                  min={0}
                  max={DURATION}
                  step={0.1}
                  value={t}
                  onChange={(e) => seek(Number(e.target.value))}
                  className="w-full accent-[#e0b27a]"
                />
                <div className="pointer-events-none absolute inset-x-0 top-1/2 h-0">
                  {chapters.map((c) => (
                    <i key={c.t} className="absolute block h-3 w-px -translate-y-1/2 bg-[#9d3437]" style={{ left: `${(c.t / DURATION) * 100}%` }} />
                  ))}
                </div>
              </div>
              <span className="w-28 text-right font-mono text-sm text-[#cdb593]">
                {fmt(t)} / {fmt(DURATION)}
              </span>
            </div>
            <p className="mt-2 text-xs text-[#8d7660]">Preview runs live in WebGL (software GPUs may play below 30 fps — the MP4 export is frame-exact).</p>
          </div>

          <div className="mt-4 rounded-2xl border border-[#3a2418] bg-[#140b08] p-4">
            <h2 className="mb-3 text-xs font-semibold tracking-[0.25em] text-[#e0b27a]">{timeline === "film" ? "CHAPTERS" : "BEATS"}</h2>
            <div className="grid gap-2 sm:grid-cols-2">
              {chapters.map((c, i) => (
                <button
                  key={c.t}
                  onClick={() => seek(c.t + 0.5)}
                  className={`flex items-center gap-3 rounded-lg border px-3 py-2 text-left text-sm transition ${
                    i === active ? "border-[#9d3437] bg-[#2a1210]" : "border-[#2e1c13] hover:border-[#6b4a31]"
                  }`}
                >
                  <span className="font-mono text-xs text-[#e0b27a]">{fmt(c.t)}</span>
                  <span className="min-w-0">
                    <span className="block truncate text-[11px] text-[#a58d73]">{c.label}</span>
                    <span className="block truncate font-medium">{c.title}</span>
                  </span>
                </button>
              ))}
            </div>
          </div>

          <div id="demo-videos" className="mt-4 rounded-2xl border border-[#3a2418] bg-[#140b08] p-4">
            <h2 className="mb-1 text-xs font-semibold tracking-[0.25em] text-[#e0b27a]">DEMO VIDEOS</h2>
            <p className="mb-2 text-xs text-[#8d7660]">New: one continuous room with animated stick figures, shaded 2D props and a camera that follows the action. Previous-style demos are kept below for reference.</p>
            <a className="mb-4 inline-block text-sm text-[#e0b27a] underline" href="/stickworld/index.html">Open interactive Stickworld scene ↗</a>
            <div className="grid items-start gap-4 md:grid-cols-[minmax(0,0.62fr)_minmax(0,1fr)]">
              {DEMO_VIDEOS.map((v) => (
                <figure
                  key={v.file}
                  className={`overflow-hidden rounded-xl border border-[#2e1c13] bg-[#0c0706] ${v.portrait ? "md:row-span-2" : ""}`}
                >
                  <video
                    controls
                    playsInline
                    preload="metadata"
                    poster={`/demo/${v.file}.jpg`}
                    className="w-full bg-black"
                    style={{ aspectRatio: v.portrait ? "9 / 16" : "16 / 9" }}
                    src={`/demo/${v.file}.mp4`}
                  />
                  <figcaption className="p-3">
                    <span className="block text-sm font-semibold text-[#f3d3a4]">{v.title}</span>
                    <span className="block text-[11px] text-[#a58d73]">{v.meta}</span>
                    <span className="mt-2 flex gap-2">
                      <a
                        className="flex-1 rounded-full bg-[#e0b27a] py-1.5 text-center text-xs font-bold text-[#1a0d09]"
                        href={`/demo/${v.file}.mp4`}
                        download
                      >
                        ⬇ MP4 {v.mb ? `(${v.mb} MB)` : ""}
                      </a>
                      <a className="rounded-full border border-[#4a3020] px-3 py-1.5 text-center text-xs" href={`/demo/${v.file}.srt`} download>
                        SRT
                      </a>
                    </span>
                  </figcaption>
                </figure>
              ))}
            </div>
          </div>
        </section>

        <aside className="space-y-6">
          <div className="rounded-2xl border border-[#3a2418] bg-[#140b08] p-5">
            <h2 className="mb-4 text-xs font-semibold tracking-[0.25em] text-[#e0b27a]">RENDER MP4</h2>
            <div className="mb-3 flex gap-2">
              {([["demo", "30s DEMO"], ["scarcity", "30s EN · SCARCITY"], ["film", "FULL FILM 20:33"]] as const).map(([k, label]) => (
                <button
                  key={k}
                  onClick={() => changeTimeline(k)}
                  className={`rounded-full border px-3 py-1 text-xs font-semibold transition ${
                    timeline === k ? "border-[#e0b27a] bg-[#e0b27a] text-[#1a0d09]" : "border-[#4a3020] text-[#cdb593] hover:border-[#e0b27a]"
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
            <div className="mb-3 flex flex-wrap gap-2">
              {(timeline === "film" ? FILM_PRESETS : timeline === "scarcity" ? SCARCITY_PRESETS : DEMO_PRESETS).map((p) => (
                <button
                  key={p.name}
                  onClick={() => {
                    setStart(p.start);
                    setEnd(p.end);
                  }}
                  className="rounded-full border border-[#4a3020] px-3 py-1 text-xs text-[#cdb593] hover:border-[#e0b27a]"
                >
                  {p.name}
                </button>
              ))}
            </div>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <label className="block">
                <span className="text-xs text-[#a58d73]">Start (mm:ss)</span>
                <input value={start} onChange={(e) => setStart(e.target.value)} className="mt-1 w-full rounded-md border border-[#4a3020] bg-[#0c0706] px-3 py-2 font-mono" />
              </label>
              <label className="block">
                <span className="text-xs text-[#a58d73]">End (mm:ss)</span>
                <input value={end} onChange={(e) => setEnd(e.target.value)} className="mt-1 w-full rounded-md border border-[#4a3020] bg-[#0c0706] px-3 py-2 font-mono" />
              </label>
            </div>
            <div className="mt-3 grid grid-cols-2 gap-3 text-sm">
              <div>
                <span className="text-xs text-[#a58d73]">Frame rate</span>
                <div className="mt-1 flex gap-1">
                  {[24, 30, 60].map((f) => (
                    <button key={f} onClick={() => setFps(f)} className={`flex-1 rounded-md border px-2 py-2 ${fps === f ? "border-[#e0b27a] bg-[#2a1a10]" : "border-[#4a3020]"}`}>
                      {f}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <span className="text-xs text-[#a58d73]">Quality</span>
                <div className="mt-1 flex gap-1">
                  {QUALITY.map((q) => (
                    <button key={q.name} onClick={() => setCrf(q.crf)} className={`flex-1 rounded-md border px-1 py-2 text-xs ${crf === q.crf ? "border-[#e0b27a] bg-[#2a1a10]" : "border-[#4a3020]"}`}>
                      {q.name}
                    </button>
                  ))}
                </div>
              </div>
            </div>
            <p className="mt-3 text-xs text-[#8d7660]">
              {aspect === "16:9" ? "1920×1080" : "1080×1920"} · {timeline === "demo" ? "30s demo beat sheet" : timeline === "scarcity" ? "30s English demo + voice-over" : "full 20:33 film"} ·{" "}
              {reqFrames.toLocaleString()} frames · H.264 yuv420p · SRT sidecar
            </p>
            <button
              onClick={startRender}
              disabled={busy || !!running}
              className="mt-4 w-full rounded-full bg-gradient-to-r from-[#9d3437] to-[#e0b27a] py-3 text-sm font-bold text-[#1a0d09] disabled:opacity-40"
            >
              {running ? "Rendering…" : "▶ Render with Three.js + Node.js"}
            </button>
            {err && <p className="mt-3 text-sm text-red-400">{err}</p>}

            {job && (
              <div className="mt-5 rounded-xl border border-[#2e1c13] bg-[#0c0706] p-4 text-sm">
                <div className="flex items-center justify-between text-xs text-[#a58d73]">
                  <span>
                    {job.meta.aspect} · {fmt(job.meta.start)}–{fmt(job.meta.end)} · {job.meta.fps}fps
                  </span>
                  <span className={job.status.state === "error" ? "text-red-400" : job.status.state === "done" ? "text-emerald-400" : "text-[#e0b27a]"}>
                    {job.status.state.toUpperCase()}
                  </span>
                </div>
                <div className="mt-3 h-2 overflow-hidden rounded-full bg-[#2a1a10]">
                  <div className="h-full bg-gradient-to-r from-[#9d3437] to-[#e0b27a] transition-all" style={{ width: `${job.status.state === "done" ? 100 : pct}%` }} />
                </div>
                <p className="mt-2 text-xs text-[#a58d73]">
                  {job.status.message}
                  {job.status.state === "running" && job.status.total ? ` · ${job.status.frame}/${job.status.total} frames · ${job.status.fps ?? "–"} fps · ETA ${fmt(job.status.eta ?? 0)}` : ""}
                </p>
                {job.status.state === "done" && (
                  <div className="mt-4 space-y-3">
                    <video controls className="w-full rounded-md bg-black" style={{ maxHeight: 280 }} src={`/api/render/${job.meta.id}/file`} />
                    <div className="flex gap-2">
                      <a className="flex-1 rounded-full bg-[#e0b27a] py-2 text-center text-xs font-bold text-[#1a0d09]" href={`/api/render/${job.meta.id}/file?dl=1`}>
                        ⬇ Download MP4 {job.status.bytes ? `(${(job.status.bytes / 1048576).toFixed(1)} MB)` : ""}
                      </a>
                      <a className="rounded-full border border-[#4a3020] px-4 py-2 text-center text-xs" href={`/api/render/${job.meta.id}/file?kind=srt&dl=1`}>
                        SRT
                      </a>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="rounded-2xl border border-[#3a2418] bg-[#140b08] p-5 text-xs leading-relaxed text-[#cdb593]">
            <h2 className="mb-3 text-xs font-semibold tracking-[0.25em] text-[#e0b27a]">PIPELINE · COMMAND LINE</h2>
            <p className="mb-1 text-[#a58d73]">Node.js (Playwright + ffmpeg-static):</p>
            <pre className="mb-3 overflow-x-auto rounded-md bg-black p-3 font-mono text-[11px] text-[#ffd9a3]">{`node render/render.mjs \\
  --timeline demo --aspect 16:9 --fps 30 \\
  --out renders/demo.mp4      # 30s demo
node render/render.mjs \\
  --timeline film --aspect 9:16 \\
  --out renders/film.mp4      # 20:33 film`}</pre>
            <p className="mb-1 text-[#a58d73]">Python (playwright 1.65.2 + imageio-ffmpeg 0.8.1):</p>
            <pre className="mb-3 overflow-x-auto rounded-md bg-black p-3 font-mono text-[11px] text-[#ffd9a3]">{`pip install -r render/requirements.txt
playwright install chromium
python render/export_mp4.py --timeline demo --aspect 9:16`}</pre>
            <p className="text-[#8d7660]">
              Add <code className="text-[#ffd9a3]">--audio voiceover.mp3</code> to mux your narration. Every frame is a pure function of time
              (<code className="text-[#ffd9a3]">window.setT(t)</code>), so renders are reproducible. Software WebGL renders ≈1–3 fps; use the range
              presets for quick cuts and a GPU machine for the full film.
            </p>
          </div>
        </aside>
      </main>
    </div>
  );
}
