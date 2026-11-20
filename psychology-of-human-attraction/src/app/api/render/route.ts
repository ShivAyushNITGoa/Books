import { NextResponse } from "next/server";
import fs from "node:fs";
import path from "node:path";
import { spawn } from "node:child_process";
import {
  MAX_DURATION,
  RENDER_DIR,
  listJobs,
  metaPath,
  readJob,
  statusPath,
  validId,
  type JobMeta,
} from "@/lib/render-jobs";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(req: Request) {
  const id = new URL(req.url).searchParams.get("id");
  if (id) {
    if (!validId(id)) return NextResponse.json({ error: "bad id" }, { status: 400 });
    const job = readJob(id);
    if (!job) return NextResponse.json({ error: "not found" }, { status: 404 });
    return NextResponse.json(job);
  }
  return NextResponse.json({ jobs: listJobs() });
}

export async function POST(req: Request) {
  const body = (await req.json().catch(() => ({}))) as Record<string, unknown>;
  const aspect = body.aspect === "9:16" ? "9:16" : "16:9";
  const fps = [24, 30, 60].includes(Number(body.fps)) ? Number(body.fps) : 30;
  const start = Math.max(0, Math.min(MAX_DURATION - 1, Number(body.start) || 0));
  const end = Math.max(start + 1, Math.min(MAX_DURATION, Number(body.end) || MAX_DURATION));
  const crf = Math.max(12, Math.min(28, Number(body.crf) || 17));
  const timeline = body.timeline === "film" || body.timeline === "scarcity" ? body.timeline : "demo";
  // beat sheets that ship with a voice-over track get it muxed in automatically
  const VOICEOVER: Record<string, string> = { scarcity: path.join("vo", "scarcity", "voiceover.wav") };
  const audio = VOICEOVER[timeline] && fs.existsSync(VOICEOVER[timeline]) ? ["--audio", VOICEOVER[timeline]] : [];

  fs.mkdirSync(RENDER_DIR, { recursive: true });
  const running = listJobs().find((j) => j.status.state === "running" || j.status.state === "queued");
  if (running) {
    return NextResponse.json({ error: "A render is already running", id: running.meta.id }, { status: 409 });
  }

  const id = `r${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;
  const out = path.join("renders", `talk-to-society-${aspect.replace(":", "x")}-${Math.round(start)}-${Math.round(end)}s-${id}.mp4`);
  const script = path.join(process.cwd(), "render", "render.mjs");
  const child = spawn(
    process.execPath,
    [script, "--timeline", timeline, "--aspect", aspect, "--fps", String(fps), "--start", String(start), "--end", String(end), "--crf", String(crf), "--out", out, "--status", statusPath(id), ...audio],
    { cwd: process.cwd(), detached: true, stdio: "ignore" },
  );
  child.unref();
  const meta: JobMeta = { id, pid: child.pid ?? 0, aspect, fps, start, end, crf, createdAt: Date.now() };
  fs.writeFileSync(metaPath(id), JSON.stringify(meta));
  fs.writeFileSync(statusPath(id), JSON.stringify({ state: "queued", message: "Starting Chromium + Three.js" }));
  return NextResponse.json({ id, meta });
}
