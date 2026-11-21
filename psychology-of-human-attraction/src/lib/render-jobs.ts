import fs from "node:fs";
import path from "node:path";

export const RENDER_DIR = path.join(process.cwd(), "renders");
export const MAX_DURATION = 1233;

export type JobMeta = {
  id: string;
  pid: number;
  aspect: "16:9" | "9:16";
  fps: number;
  start: number;
  end: number;
  crf: number;
  createdAt: number;
};

export type JobStatus = {
  state: "queued" | "running" | "done" | "error";
  frame?: number;
  total?: number;
  fps?: number;
  eta?: number;
  file?: string;
  srt?: string;
  bytes?: number;
  message?: string;
};

export const validId = (id: string) => /^[a-z0-9-]{4,60}$/.test(id);
export const metaPath = (id: string) => path.join(RENDER_DIR, `${id}.meta.json`);
export const statusPath = (id: string) => path.join(RENDER_DIR, `${id}.status.json`);

export function pidAlive(pid: number) {
  try {
    process.kill(pid, 0);
    return true;
  } catch {
    return false;
  }
}

function readJson<T>(p: string): T | null {
  try {
    return JSON.parse(fs.readFileSync(p, "utf8")) as T;
  } catch {
    return null;
  }
}

export function readJob(id: string) {
  const meta = readJson<JobMeta>(metaPath(id));
  if (!meta) return null;
  let status = readJson<JobStatus>(statusPath(id)) ?? { state: "queued" as const };
  if ((status.state === "running" || status.state === "queued") && !pidAlive(meta.pid)) {
    // process vanished without writing a final status
    status = { ...status, state: "error", message: status.message === "Done" ? "Done" : "Renderer stopped unexpectedly" };
  }
  return { meta, status };
}

export function listJobs() {
  if (!fs.existsSync(RENDER_DIR)) return [];
  return fs
    .readdirSync(RENDER_DIR)
    .filter((f) => f.endsWith(".meta.json"))
    .map((f) => readJob(f.replace(".meta.json", "")))
    .filter((j): j is NonNullable<typeof j> => !!j)
    .sort((a, b) => b.meta.createdAt - a.meta.createdAt)
    .slice(0, 8);
}
