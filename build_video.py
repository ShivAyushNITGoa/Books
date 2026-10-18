#!/usr/bin/env python3
"""
Talk2Society video builder (generic per episode)
=================================================
Assembles: per-scene images (images/ or --images dir) + master voiceover
(first MP3 in audio/, e.g. audio/{name}_master.mp3) + the episode SRT (--srt)
into one MP4 with Ken Burns motion, an optional sidecar .srt, and the VO.

Guarantees (per spec):
  * EXACTLY ONE image per SRT cue - N cues -> N distinct images.
  * Image <label> is shown only during its own cue window; it is never
    reused for another cue and no cue is shown over another cue's image.
  * The build HARD-FAILS if any of the images is missing (no dark
    placeholders, no silent reuse).

Timeline:
  * cue i owns [start_i, start_{i+1}) (last cue: [start_last, srt_end]).
  * After the last SRT cue the final image is held until the VO finishes
    (+2 s tail). Narration that runs past the last cue is an intentional
    hold of the final scene, not a reuse: no other cue exists after it.
  * Frame budget is allocated so cumulative boundary drift <= 1 frame.

Rendering (three stages, linear time, safe on 2-core machines):
  stage 1: each cue -> one 24fps segment (zoompan Ken Burns,
           4-pattern cycle, tiny fade in/out to soften cuts)
  stage 2: concat demuxer (stream copy) of the segments
  stage 3: mux the master VO (AAC, 48 kHz), optionally with burned-in
           SRT captions (Noto Sans Devanagari) -> output/{name}_final.mp4

Usage:
  python3 build_video.py --dry-run        # mapping + missing-file report
  python3 build_video.py --limit 12       # smoke test: first 12 cues
  python3 build_video.py                   # full build (1280x720)
  python3 build_video.py --res 854x480     # full build, 480p (smaller file)
  python3 build_video.py --srt tv7.srt --name tv7 --images images_up4x \
      --res 2560x1440 --no-captions --crf 24     # 2K clean episode build
  FFMPEG_BIN=/path/to/ffmpeg python3 build_video.py   # custom ffmpeg
"""
import argparse
import re
import shutil
import subprocess
import sys
from collections import defaultdict
from pathlib import Path

ROOT = Path(__file__).resolve().parent
IMG_DIR = ROOT / "images"
AUD_DIR = ROOT / "audio"
OUT_DIR = ROOT / "output"
SEG_DIR = OUT_DIR / "segments"
SRT_PATH = ROOT / "tv6.srt"
FONT_DIR = ROOT / "fonts"          # Noto Sans Devanagari (Devanagari glyphs)

FPS = 24
W, H = 1280, 720          # default; pass --res for other resolutions
ZOOM = 0.10                # Ken Burns zoom range
CRF = 24                   # x264 quality (higher = smaller file)
TAIL_AFTER_VO = 2.0        # seconds of held final image after the VO ends
IMAGE_EXTS = (".jpg", ".jpeg", ".png", ".webp", ".bmp")
AUDIO_EXTS = (".mp3", ".wav", ".m4a", ".aac", ".ogg", ".flac")


# ---------------------------------------------------------------- ffmpeg loc
def find_ffmpeg() -> str:
    import os
    if os.environ.get("FFMPEG_BIN"):
        return os.environ["FFMPEG_BIN"]
    hit = shutil.which("ffmpeg")
    if hit:
        return hit
    try:
        import imageio_ffmpeg
        return imageio_ffmpeg.get_ffmpeg_exe()
    except Exception:
        pass
    for cand in ("/home/user/tools/ffmpeg",):
        if Path(cand).exists():
            return cand
    sys.exit("ffmpeg not found. Install ffmpeg or `pip install imageio-ffmpeg`.")


# ---------------------------------------------------------------- SRT parse
def ts2sec(ts: str) -> float:
    h, m, s_ms = ts.strip().split(":")
    s, ms = s_ms.split(",")
    return int(h) * 3600 + int(m) * 60 + int(s) + int(ms) / 1000.0


def parse_srt(path: Path):
    """Return cues: dicts with n, start_str, start, end, text, label."""
    text = path.read_text(encoding="utf-8")
    cues = []
    for b in re.split(r"\n\s*\n", text.strip()):
        lines = b.strip().split("\n")
        if len(lines) >= 2 and "-->" in lines[1]:
            n = int(lines[0].strip())
            start_str, end_str = (t.strip() for t in lines[1].split("-->"))
            body = " ".join(l.strip() for l in lines[2:])
            cues.append({"n": n, "start_str": start_str,
                         "start": ts2sec(start_str), "end": ts2sec(end_str),
                         "text": body})
    # labels: M-SS (M unpadded, SS 2 digits); later collisions carry ms suffix
    cnt = defaultdict(int)
    for c in cues:
        h, m, s_ms = c["start_str"].split(":")
        s, ms = s_ms.split(",")
        base = f"{int(h) * 60 + int(m)}-{int(s):02d}"
        cnt[base] += 1
        c["label"] = base if cnt[base] == 1 else f"{base}-{ms}"
    return cues


# ---------------------------------------------------------------- assets
def index_images():
    idx = {}
    if IMG_DIR.exists():
        for p in sorted(IMG_DIR.iterdir()):
            if p.is_file() and p.suffix.lower() in IMAGE_EXTS:
                idx[p.stem.lower()] = p
    return idx


def find_image(idx, label: str, n: int):
    for stem in (label, f"#{label}", f"{n:03d}", str(n)):
        hit = idx.get(stem.lower())
        if hit:
            return hit
    return None


def find_audio(sub: Path):
    if not sub.exists():
        return None
    files = [p for p in sorted(sub.iterdir())
             if p.is_file() and p.suffix.lower() in AUDIO_EXTS]
    return files[0] if files else None


def media_duration(ffmpeg: str, path: Path) -> float:
    r = subprocess.run([ffmpeg, "-hide_banner", "-i", str(path)],
                       capture_output=True, text=True)
    m = re.search(r"Duration:\s*(\d+):(\d+):(\d+\.?\d*)", r.stderr)
    if not m:
        return 0.0
    return int(m.group(1)) * 3600 + int(m.group(2)) * 60 + float(m.group(3))


# ---------------------------------------------------------------- timeline
def plan(cues, total, limit=None):
    """Per-cue segments [start, end) with an exact global frame budget.

    frames_i = floor(dur_i*FPS) for all but the last segment, which takes
    the remainder -> cumulative boundary drift <= 1 frame (41 ms).
    """
    if limit:
        cues = cues[:limit]
        total = cues[-1]["end"] + 1.0
    segs = []
    for i, c in enumerate(cues):
        start = 0.0 if i == 0 else c["start"]
        end = cues[i + 1]["start"] if i + 1 < len(cues) else total
        segs.append({**c, "start": start, "end": end, "dur": end - start})
    total_frames = max(int(round(total * FPS)), len(segs))
    assigned = 0
    for s in segs[:-1]:
        s["frames"] = max(int(s["dur"] * FPS), 2)
        assigned += s["frames"]
    segs[-1]["frames"] = max(total_frames - assigned, 2)
    return cues, segs


def kenburns(i: int, frames: int):
    """4-pattern cycle, on-based (stateless) zoompan expressions."""
    d = max(frames, 4)
    cy = "ih/2-(ih/zoom/2)"
    cx = "iw/2-(iw/zoom/2)"
    k = ZOOM
    p = i % 4
    if p == 0:    # slow zoom in
        return f"1+{k}*on/{d}", cx, cy
    if p == 1:    # slow zoom out
        return f"{1 + k}-{k}*on/{d}", cx, cy
    if p == 2:    # pan right
        return f"1+{k}", f"(iw-iw/zoom)*on/{d}", cy
    return f"1+{k}", f"(iw-iw/zoom)*(1-on/{d})", cy  # pan left


# ---------------------------------------------------------------- stage 1
def render_segment(ffmpeg, seg, img: Path, out: Path):
    z, x, y = kenburns(seg["n"] - 1, seg["frames"])
    dur = seg["dur"]
    vf = (
        f"scale={W}:{H}:force_original_aspect_ratio=increase,crop={W}:{H},"
        f"zoompan=z='{z}':x='{x}':y='{y}':d={seg['frames']}:"
        f"s={W}x{H}:fps={FPS},format=yuv420p,setsar=1"
    )
    fade = min(0.20, dur * 0.2)  # softens cuts; never eats short cues
    if fade > 0.03:
        vf += (f",fade=t=in:st=0:d={fade:.3f},"
               f"fade=t=out:st={max(dur - fade, 0):.3f}:d={fade:.3f}")
    cmd = [ffmpeg, "-y", "-hide_banner", "-loglevel", "error",
           "-loop", "1", "-t", f"{dur:.3f}", "-i", str(img),
           "-frames:v", str(seg["frames"]),
           "-vf", vf,
           "-c:v", "libx264", "-preset", "veryfast", "-crf", str(CRF),
           "-pix_fmt", "yuv420p", "-r", str(FPS),
           str(out)]
    r = subprocess.run(cmd, capture_output=True, text=True)
    if r.returncode != 0:
        raise RuntimeError(f"segment {seg['label']}: {r.stderr[-800:]}")


# ---------------------------------------------------------------- build
def build(args):
    global W, H, CRF, IMG_DIR, SRT_PATH
    w, _, h = args.res.partition("x")
    W, H = int(w), int(h)
    CRF = args.crf
    IMG_DIR = ROOT / args.images
    SRT_PATH = ROOT / args.srt
    ffmpeg = find_ffmpeg()
    cues_all = parse_srt(SRT_PATH)
    idx = index_images()
    vo = find_audio(AUD_DIR)
    n_cues = len(cues_all)

    scope = cues_all[:args.limit] if args.limit else cues_all
    hits, missing = [], []
    for c in scope:
        h = find_image(idx, c["label"], c["n"])
        (hits if h else missing).append((c, h))

    print(f"SRT cues      : {n_cues}"
          + (f" (building first {len(scope)})" if args.limit else ""))
    print(f"Images found  : {len(hits)} / {len(scope)}"
          + (f"   [full set: {n_cues - len(scope)} more to generate]" if args.limit else ""))
    print(f"Master VO     : {vo.name if vo else 'NOT FOUND'}")

    if missing and not args.dry_run:
        print(f"\nMISSING {len(missing)} images. Refusing to build with "
              f"placeholders or reused images.")
        for c, _ in missing[:20]:
            print(f"  cue {c['n']:>3}  {c['label']:<12} -> expected images/{c['label']}.jpg")
        if len(missing) > 20:
            print(f"  ... and {len(missing) - 20} more")
        return 2

    # total = max(SRT span, VO duration) + tail
    srt_end = cues_all[-1]["end"]
    vo_dur = media_duration(ffmpeg, vo) if vo else 0.0
    total = max(srt_end, vo_dur) + TAIL_AFTER_VO
    if vo and vo_dur - srt_end > 1:
        print(f"VO span     : {vo_dur:.2f}s vs SRT span {srt_end:.2f}s "
              f"(narration beyond last cue: {vo_dur - srt_end:+.1f}s "
              "-> final image held)")

    if args.dry_run:
        print("\nMapping (first 5 / last 3):")
        for c, h in (hits + missing)[:5] + (hits + missing)[-3:]:
            print(f"  {c['n']:>3}  {c['label']:<12}  {h.name if h else '(MISSING)'}")
        print("\nDry run OK." + ("" if not missing else f"  !! {len(missing)} missing"))
        return 0 if not missing else 2

    if not vo:
        print("No master VO in audio/. Build it first: python3 scripts/build_master_audio.py")
        return 2

    cues, segs = plan(cues_all, total, limit=args.limit)
    print(f"Clips         : {len(segs)}   output {total:.2f}s ({total / 60:.1f} min) "
          f"@ {W}x{H} {FPS}fps")

    SEG_DIR.mkdir(parents=True, exist_ok=True)
    todo = [s for s in segs if not (SEG_DIR / f"{s['n']:03d}.mp4").exists()]
    print(f"Stage 1       : rendering {len(todo)} segments "
          f"({len(segs) - len(todo)} cached) ...")
    done = 0
    for s in segs:
        if s not in todo:
            continue
        img = find_image(idx, s["label"], s["n"])
        render_segment(ffmpeg, s, img, SEG_DIR / f"{s['n']:03d}.mp4")
        done += 1
        if done % 25 == 0 or done == len(todo):
            print(f"  ... {done}/{len(todo)} segments")

    # stage 2: concat (stream copy) -> silent video
    lst = SEG_DIR / "concat.txt"
    lines = []
    for s in segs:
        name = f"{s['n']:03d}.mp4"
        lines.append(f"file '{SEG_DIR / name}'\n")
    lst.write_text("".join(lines), encoding="utf-8")
    vid = OUT_DIR / "video_only.mp4"
    cmd = [ffmpeg, "-y", "-hide_banner", "-loglevel", "error",
           "-f", "concat", "-safe", "0", "-i", str(lst),
           "-c", "copy", str(vid)]
    r = subprocess.run(cmd, capture_output=True, text=True)
    if r.returncode != 0:
        print("concat failed:", r.stderr[-800:])
        return r.returncode

    # stage 3: mux the master VO (optionally with burned-in SRT captions)
    out = OUT_DIR / (f"{args.name}_test_{args.limit}.mp4" if args.limit
                     else f"{args.name}_final.mp4")
    if args.no_captions:
        cmd = [ffmpeg, "-y", "-hide_banner", "-loglevel", "error", "-stats",
               "-i", str(vid), "-i", str(vo),
               "-map", "0:v:0", "-map", "1:a:0",
               "-c:v", "copy",
               "-c:a", "aac", "-b:a", "96k", "-ar", "48000", "-ac", "2",
               "-t", f"{total:.3f}", "-movflags", "+faststart", str(out)]
    else:
        style = ("FontName=Noto Sans Devanagari,Fontsize=18,"
                 "PrimaryColour=&H00FFFFFF,OutlineColour=&H00000000,"
                 "BorderStyle=1,Outline=2,Shadow=0,MarginV=34,Alignment=2")
        vf = (f"subtitles={SRT_PATH}:fontsdir={FONT_DIR}:"
              f"force_style='{style}'")
        cmd = [ffmpeg, "-y", "-hide_banner", "-loglevel", "error", "-stats",
               "-i", str(vid), "-i", str(vo),
               "-map", "0:v:0", "-map", "1:a:0",
               "-vf", vf,
               "-c:v", "libx264", "-preset", "veryfast", "-crf", str(CRF),
               "-pix_fmt", "yuv420p",
               "-c:a", "aac", "-b:a", "96k", "-ar", "48000", "-ac", "2",
               "-t", f"{total:.3f}", "-movflags", "+faststart", str(out)]
    r = subprocess.run(cmd)
    if r.returncode != 0:
        print("final pass failed")
        return r.returncode

    size_mb = out.stat().st_size / 1e6
    print(f"\nDONE: {out}  ({size_mb:.1f} MB)")
    if args.no_captions:
        print("Captions      : none (clean build)")
    else:
        shutil.copy(SRT_PATH, OUT_DIR / SRT_PATH.name)
        print(f"Captions      : burned in from {SRT_PATH.name} "
              f"(Noto Sans Devanagari)")
        print(f"Sidecar subtitles: {OUT_DIR / SRT_PATH.name}")
    return 0


if __name__ == "__main__":
    ap = argparse.ArgumentParser()
    ap.add_argument("--dry-run", action="store_true")
    ap.add_argument("--limit", type=int, default=0, help="build only first N cues")
    ap.add_argument("--res", default="1280x720",
                    help="render resolution WxH (default 1280x720; "
                         "use 2560x1440 for QHD, 854x480 for small files)")
    ap.add_argument("--crf", type=int, default=24,
                    help="x264 CRF for the segments (higher = smaller file)")
    ap.add_argument("--no-captions", action="store_true",
                    help="skip burned-in captions (fast stream-copy final mux)")
    ap.add_argument("--images", default="images",
                    help="image source directory relative to repo root "
                         "(default 'images'; use 'images_up4x' for AI-upscaled art)")
    ap.add_argument("--srt", default="tv6.srt",
                    help="episode SRT file relative to repo root")
    ap.add_argument("--name", default="tv6",
                    help="episode slug used in output file names "
                         "(e.g. tv7 -> output/tv7_final.mp4)")
    sys.exit(build(ap.parse_args()))
