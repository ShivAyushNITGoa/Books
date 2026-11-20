import fs from "node:fs";
import path from "node:path";
import { Readable } from "node:stream";
import { RENDER_DIR, readJob, validId } from "@/lib/render-jobs";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  if (!validId(id)) return new Response("bad id", { status: 400 });
  const job = readJob(id);
  if (!job || job.status.state !== "done" || !job.status.file) return new Response("not ready", { status: 404 });

  const kind = new URL(req.url).searchParams.get("kind") === "srt" ? "srt" : "mp4";
  const name = kind === "srt" ? job.status.srt : job.status.file;
  if (!name) return new Response("missing", { status: 404 });
  const file = path.join(RENDER_DIR, path.basename(name));
  if (!fs.existsSync(file)) return new Response("missing", { status: 404 });

  const size = fs.statSync(file).size;
  const type = kind === "srt" ? "application/x-subrip; charset=utf-8" : "video/mp4";
  const dl = new URL(req.url).searchParams.get("dl") === "1";
  const base: Record<string, string> = {
    "Content-Type": type,
    "Accept-Ranges": "bytes",
    ...(dl ? { "Content-Disposition": `attachment; filename="${path.basename(name)}"` } : {}),
  };

  const range = req.headers.get("range");
  if (range) {
    const m = /bytes=(\d*)-(\d*)/.exec(range);
    if (m) {
      const start = m[1] ? parseInt(m[1], 10) : 0;
      const end = m[2] ? Math.min(parseInt(m[2], 10), size - 1) : size - 1;
      if (start <= end && start < size) {
        const stream = Readable.toWeb(fs.createReadStream(file, { start, end })) as unknown as ReadableStream;
        return new Response(stream, {
          status: 206,
          headers: { ...base, "Content-Range": `bytes ${start}-${end}/${size}`, "Content-Length": String(end - start + 1) },
        });
      }
    }
  }
  const stream = Readable.toWeb(fs.createReadStream(file)) as unknown as ReadableStream;
  return new Response(stream, { headers: { ...base, "Content-Length": String(size) } });
}
