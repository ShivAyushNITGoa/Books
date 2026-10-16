#!/usr/bin/env python3
"""
TV6 video builder
=================
Assembles: label-named images + single master voiceover + TV6 SRT
into one MP4 with Ken Burns motion, crossfades at cue boundaries,
and a sidecar .srt.

Usage:
  python3 build_video.py --dry-run          # mapping + missing-file report (no render)
  python3 build_video.py --limit 12         # smoke test: first 12 cues only
  python3 build_video.py                    # full build -> output/tv6_final.mp4

Conventions (per agreed spec):
  - images/ files named by scene label: 0-00.jpg, 3-00-890.png, 29-58.jpg
    (leading '#' optional; jpg/jpeg/png/webp/bmp; fallback: 001.jpg..482.jpg by cue number)
  - audio/ contains ONE master VO file (mp3/wav/m4a/aac/ogg/flac)
  - music/ optionally one bed track (ducked under VO)
  - image i is shown from cue i start to cue i+1 start (SRT timestamps)
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
MUS_DIR = ROOT / "music"
OUT_DIR = ROOT / "output"
SRT_PATH = ROOT / "tv6.srt"

FPS = 30
W, H = 1920, 1080
SCALE_W, SCALE_H = 2560, 1440   # pre-zoompan oversample
FADE_DEFAULT = 0.5
AUDIO_EXTS = (".mp3", ".wav", ".m4a", ".aac", ".ogg", ".flac")
IMAGE_EXTS = (".jpg", ".jpeg", ".png", ".webp", ".bmp")


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
        sys.exit("ffmpeg not found. Install ffmpeg or `pip install imageio-ffmpeg`.")


# ---------------------------------------------------------------- SRT parse
def ts2sec(ts: str) -> float:
    h, m, s_ms = ts.strip().split(":")
    s, ms = s_ms.split(",")
    return int(h) * 3600 + int(m) * 60 + int(s) + int(ms) / 1000.0


def parse_srt(path: Path):
    """Return cues: list of dicts with n, start, end, text, and label."""
    text = path.read_text(encoding="utf-8")
    blocks = re.split(r"\n\s*\n", text.strip())
    cues = []
    for b in blocks:
        lines = b.strip().split("\n")
        if len(lines) >= 2 and "-->" in lines[1]:
            n = int(lines[0].strip())
            t = lines[1]
            start_str = t.split("-->")[0].strip()
            end = ts2sec(t.split("-->")[1])
            body = " ".join(l.strip() for l in lines[2:])
            cues.append({"n": n, "start_str": start_str,
                         "start": ts2sec(start_str), "end": end, "text": body})
    # labels exactly per spec: M-SS (M unpadded, SS 2 digits), ms truncated;
    # later collision carries millisecond suffix
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


# ---------------------------------------------------------------- geometry
def plan_timeline(cues, fade: float, total: float, limit=None):
    """Per-clip durations and xfade offsets (see derivation in notes).

    Boundary B_i = start of cue i+1.  Transition i centred on B_i:
    O_i = B_i - fade/2.  Clip durations: D0 = O1 + fade,
    Di = (O{i+1} - Oi) + fade, Dlast = total - Olast.
    Two extra frames of margin are added per clip so xfade never starves.
    """
    if limit:
        cues = cues[:limit]
        total = cues[-1]["end"] + 1.0
    n = len(cues)
    bounds = [cues[i + 1]["start"] for i in range(n - 1)]
    offs = [b - fade / 2.0 for b in bounds]
    clips = []
    for i in range(n):
        if i == 0:
            dur = offs[0] + fade if n > 1 else total
        elif i == n - 1:
            dur = total - offs[i - 1]
        else:
            dur = offs[i] - offs[i - 1] + fade
        clips.append({"n": cues[i]["n"], "label": cues[i]["label"],
                      "dur": dur, "frames": int(round(dur * FPS)) + 2})
    return cues, clips, offs, total


def kenburns(i: int, frames: int):
    """4-pattern cycle; explicit on-based formulas (no stateful zoom)."""
    k = 0.10
    d = max(frames, 2)
    cy = "ih/2-(ih/zoom/2)"
    cx = "iw/2-(iw/zoom/2)"
    p = i % 4
    if p == 0:      # slow zoom in
        return (f"1+{k}*on/{d}", cx, cy)
    if p == 1:      # slow zoom out
        return (f"{1 + k}-{k}*on/{d}", cx, cy)
    if p == 2:      # pan right
        return ("1.06", f"(iw-iw/zoom)*on/{d}", cy)
    return ("1.06", f"(iw-iw/zoom)*(1-on/{d})", cy)  # pan left


# ---------------------------------------------------------------- filtergraph
def write_filter_script(path: Path, clips, offs, total, fade, vo_idx, mus_idx):
    L = []
    for i, c in enumerate(clips):
        z, x, y = kenburns(i, c["frames"])
        L.append(
            f"[{i}:v]scale={SCALE_W}:{SCALE_H}:force_original_aspect_ratio=increase,"
            f"crop={SCALE_W}:{SCALE_H},"
            f"zoompan=z='{z}':x='{x}':y='{y}':d={c['frames']}:s={W}x{H}:fps={FPS},"
            f"format=yuv420p,setsar=1,fps={FPS},settb=AVTB[v{i}]"
        )
    prev = "v0"
    for i in range(1, len(clips)):
        out = f"x{i}"
        L.append(f"[{prev}][v{i}]xfade=transition=fade:"
                 f"duration={fade:.3f}:offset={offs[i - 1]:.3f}[{out}]")
        prev = out
    L.append(f"[{prev}]format=yuv420p,setsar=1[vout]")

    a = f"[{vo_idx}:a]aresample=48000,aformat=channel_layouts=stereo," \
        f"loudnorm=I=-16:TP=-1.5:LRA=11,atrim=0:{total:.3f},apad[vo]"
    if mus_idx is not None:
        a += (";[vo]asplit=2[vo1][vo2];"
              f"[{mus_idx}:a]aresample=48000,aformat=channel_layouts=stereo,"
              f"atrim=0:{total:.3f},apad,volume=1.0[mus];"
              "[mus][vo1]sidechaincompress=threshold=0.02:ratio=12:"
              "attack=25:release=300[mduck];"
              "[vo2][mduck]amix=inputs=2:duration=first:normalize=0[aout]")
    else:
        a += ";[vo]anull[aout]"
    L.append(a)
    path.write_text(";\n".join(L) + "\n", encoding="utf-8")
    return len(L)


# ---------------------------------------------------------------- build
def build(args):
    ffmpeg = find_ffmpeg()
    cues_all = parse_srt(SRT_PATH)
    idx = index_images()
    vo = find_audio(AUD_DIR)
    mus = find_audio(MUS_DIR)

    n_cues = len(cues_all)
    collisions = sum(1 for c in cues_all if "-" in c["label"].rsplit("-", 2)[-1]) \
        if False else 0
    # proper collision count: label has ms suffix => 3 hyphen-groups beyond M-SS
    collisions = sum(1 for c in cues_all
                     if len(c["label"].split("-")) > 2)

    missing, found = [], []
    for c in cues_all:
        hit = find_image(idx, c["label"], c["n"])
        (found if hit else missing).append((c, hit))

    print(f"SRT cues        : {n_cues}   (collisions with ms suffix: {collisions})")
    print(f"Images found    : {len(found)} / {n_cues}")
    print(f"Master VO       : {vo.name if vo else 'NOT FOUND'}")
    print(f"Music bed       : {mus.name if mus else '(none)'}")

    if missing and not args.allow_missing and not args.dry_run and not args.limit:
        print(f"\nMISSING {len(missing)} images (first 15):")
        for c, _ in missing[:15]:
            print(f"  cue {c['n']:>3}  #{c['label']:<12} -> expected "
                  f"images/{c['label']}.jpg")
        print("\nAdd the files (or rerun with --allow-missing / --limit).")
        return 2

    if args.dry_run:
        print("\nMapping sample (cue -> label -> file):")
        for c, hit in (found + missing)[:5] + (found + missing)[-3:]:
            print(f"  {c['n']:>3}  #{c['label']:<12}  "
                  f"{hit.name if hit else '(missing)'}")
        if vo:
            vd = media_duration(ffmpeg, vo)
            span = cues_all[-1]["end"]
            print(f"\nVO duration     : {vd:.2f}s   SRT span: {span:.2f}s"
                  f"   drift: {vd - span:+.2f}s")
            if abs(vd - span) > 3.0:
                print("  !! drift > 3s — check the VO matches the script.")
        print("\nDry run OK. Run without --dry-run to render.")
        return 0

    # ---- timeline
    if vo:
        total = media_duration(ffmpeg, vo)
        total = max(total, cues_all[-1]["end"])
    else:
        total = cues_all[-1]["end"]
    if args.limit:
        total = min(total, cues_all[min(args.limit, n_cues) - 1]["end"] + 1.0)

    # auto-clamp fade to the tightest cue gap
    gaps = [cues_all[i + 1]["start"] - cues_all[i]["start"] for i in range(n_cues - 1)]
    min_gap = min(gaps) if gaps else 1.0
    fade = min(FADE_DEFAULT, 0.9 * min_gap)

    cues, clips, offs, total = plan_timeline(cues_all, fade, total, limit=args.limit)
    print(f"Fade            : {fade:.3f}s (min cue gap {min_gap:.3f}s)")
    print(f"Output duration : {total:.2f}s  ({total / 60:.1f} min), {len(clips)} clips")

    # ---- inputs
    inputs = []
    placeholder = None
    for c in cues:
        hit = find_image(idx, c["label"], c["n"])
        if hit:
            inputs += ["-i", str(hit)]
        else:
            if placeholder is None:
                placeholder = True
            inputs += ["-f", "lavfi", "-i",
                       f"color=c=0x1a1210:s={W}x{H}:d=1:r={FPS}"]
    vo_idx = len(cues)
    if vo:
        inputs += ["-i", str(vo)]
    else:
        inputs += ["-f", "lavfi", "-i",
                   f"anullsrc=r=48000:cl=stereo:d={total:.3f}"]
    mus_idx = None
    if mus and not args.no_music:
        mus_idx = vo_idx + 1
        inputs += ["-i", str(mus)]

    fc = OUT_DIR / "fc.txt"
    write_filter_script(fc, clips, offs, total, fade, vo_idx, mus_idx)

    out = OUT_DIR / (f"tv6_test_{args.limit}.mp4" if args.limit else "tv6_final.mp4")
    cmd = [ffmpeg, "-y", "-hide_banner", "-loglevel", "warning", "-stats"]
    cmd += inputs
    cmd += ["-filter_complex_script", str(fc),
            "-map", "[vout]", "-map", "[aout]",
            "-c:v", "libx264", "-preset", "faster", "-crf", "19",
            "-pix_fmt", "yuv420p", "-r", str(FPS),
            "-c:a", "aac", "-b:a", "192k", "-ar", "48000",
            "-t", f"{total:.3f}", "-movflags", "+faststart",
            str(out)]

    print(f"\nRendering -> {out}")
    r = subprocess.run(cmd)
    if r.returncode != 0:
        print("ffmpeg failed — see errors above.")
        return r.returncode

    shutil.copy(SRT_PATH, OUT_DIR / "tv6.srt")
    size_mb = out.stat().st_size / 1e6
    print(f"DONE: {out}  ({size_mb:.1f} MB)")
    print(f"Sidecar subtitles: {OUT_DIR / 'tv6.srt'}")
    return 0


if __name__ == "__main__":
    ap = argparse.ArgumentParser()
    ap.add_argument("--dry-run", action="store_true")
    ap.add_argument("--limit", type=int, default=0, help="build only first N cues")
    ap.add_argument("--allow-missing", action="store_true",
                    help="use dark placeholders for missing images")
    ap.add_argument("--no-music", action="store_true")
    sys.exit(build(ap.parse_args()))
