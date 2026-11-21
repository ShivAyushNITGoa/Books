#!/usr/bin/env python3
"""Talk to Society - Python studio exporter.

Three.js scene (public/studio) -> Playwright (Python) frame stepping -> imageio-ffmpeg -> MP4

    pip install -r render/requirements.txt && playwright install chromium
    python render/export_mp4.py --aspect 16:9 --fps 30 --start 0 --end 30 --out renders/hook.mp4
    python render/export_mp4.py --aspect 9:16            # YouTube Shorts / Reels, 1080x1920
"""
import argparse
import functools
import http.server
import socketserver
import subprocess
import threading
from pathlib import Path

import imageio_ffmpeg
from playwright.sync_api import sync_playwright

ROOT = Path(__file__).resolve().parent.parent
STUDIO = ROOT / "public" / "studio"


def serve():
    class Quiet(http.server.SimpleHTTPRequestHandler):
        def log_message(self, *args, **kwargs):  # silence request logs
            pass

        extensions_map = {**http.server.SimpleHTTPRequestHandler.extensions_map, ".js": "text/javascript", ".mjs": "text/javascript"}

    handler = functools.partial(Quiet, directory=str(STUDIO))
    httpd = socketserver.ThreadingTCPServer(("127.0.0.1", 0), handler)
    threading.Thread(target=httpd.serve_forever, daemon=True).start()
    return httpd


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--aspect", default="16:9", choices=["16:9", "9:16"])
    ap.add_argument("--fps", type=int, default=30)
    ap.add_argument("--start", type=float, default=0)
    ap.add_argument("--end", type=float, default=None)
    ap.add_argument("--crf", type=int, default=17)
    ap.add_argument("--timeline", default="demo", choices=["demo", "film"])
    ap.add_argument("--audio", default=None, help="optional voice-over (mp3/wav) to mux in")
    ap.add_argument("--out", default=None)
    a = ap.parse_args()

    portrait = a.aspect == "9:16"
    w, h = (1080, 1920) if portrait else (1920, 1080)
    out = Path(a.out) if a.out else ROOT / "renders" / f"talk-to-society-{a.aspect.replace(':', 'x')}-py.mp4"
    out.parent.mkdir(parents=True, exist_ok=True)
    end = a.end if a.end else (1233 if a.timeline == "film" else 30)
    total = max(1, round((end - a.start) * a.fps))

    cmd = [imageio_ffmpeg.get_ffmpeg_exe(), "-y", "-loglevel", "error",
           "-f", "image2pipe", "-framerate", str(a.fps), "-vcodec", "mjpeg", "-i", "-"]
    if a.audio:
        cmd += ["-ss", str(a.start), "-i", a.audio]
    cmd += ["-c:v", "libx264", "-preset", "medium", "-crf", str(a.crf), "-pix_fmt", "yuv420p",
            "-r", str(a.fps), "-movflags", "+faststart"]
    cmd += ["-c:a", "aac", "-b:a", "256k", "-shortest"] if a.audio else ["-an"]
    cmd += [str(out)]

    httpd = serve()
    port = httpd.server_address[1]
    with sync_playwright() as p:
        browser = p.chromium.launch(args=["--no-sandbox", "--use-gl=angle", "--use-angle=swiftshader",
                                          "--enable-unsafe-swiftshader", "--ignore-gpu-blocklist"])
        page = browser.new_page(viewport={"width": w, "height": h}, device_scale_factor=1)
        page.goto(f"http://127.0.0.1:{port}/index.html?record=1&aspect={a.aspect}&timeline={a.timeline}")
        page.wait_for_function("window.__ready === true", timeout=90000)
        if not page.wait_for_function("window.__renderSafe === true", timeout=30000):
            raise RuntimeError("Render guard failed: tokens.css or Devanagari fonts did not resolve")
        enc = subprocess.Popen(cmd, stdin=subprocess.PIPE)
        for i in range(total):
            page.evaluate("(t) => window.setT(t)", a.start + i / a.fps)
            enc.stdin.write(page.screenshot(type="jpeg", quality=95, animations="disabled"))
            if i % 60 == 0:
                print(f"{i + 1}/{total} frames", flush=True)
        enc.stdin.close()
        status = enc.wait()
        browser.close()
    httpd.shutdown()
    if status:
        raise RuntimeError("ffmpeg failed")
    print("Saved", out, flush=True)


if __name__ == "__main__":
    main()
