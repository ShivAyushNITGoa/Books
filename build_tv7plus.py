#!/usr/bin/env python3
"""build_tv7plus.py — TV7-style builder (Ken Burns + crossfades), refined.

The TV7 look: every cue is its own Ken Burns clip; cue boundaries are
gentle crossfades (xfade), the picture stays clean (no grain, no graphics
overlays, no parallax), and the whole episode flows as one continuous
dissolve chain. This "tv7plus" revision keeps that language and adds:

  * eased 6-pattern Ken Burns (smoothstep, not linear) with per-cue
    amplitude variation
  * subject-aware framing (edge-energy anchor per image, optional Pillow)
  * varied fade rhythm (0.40 / 0.55 / 0.70 s hashed per boundary, clamped
    to cue gaps) so the dissolves feel human, not metronomic
  * VO-energy pacing of motion when --cue-class is given
  * subtle finish: lanczos resample, whisper print-curve, light vignette,
    gentle open/close fades
  * VO is muxed RAW (Path A: resample/trim only — never processed)

Usage:
  python3 build_tv7plus.py --dry-run --srt tv8.srt --name tv8 --images images_tv8
  python3 build_tv7plus.py --limit 12 --srt tv8.srt --name tv8 --images images_tv8
  python3 build_tv7plus.py --srt tv8.srt --name tv8 --images images_tv8 \\
      --cue-class prompts/cue_classes.json
"""
import argparse
import hashlib
import re
import shutil
import subprocess
import sys
from collections import defaultdict
from pathlib import Path

ROOT = Path(__file__).resolve().parent
OUT_DIR = ROOT / "output"
MUS_DIR = ROOT / "music"

FPS = 24
FADE_SET = (0.40, 0.55, 0.70)     # weighted below via hash
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
    text = path.read_text(encoding="utf-8")
    cues = []
    for b in re.split(r"\n\s*\n", text.strip()):
        lines = b.strip().split("\n")
        if len(lines) >= 2 and "-->" in lines[1]:
            n = int(lines[0].strip())
            start_str = lines[1].split("-->")[0].strip()
            end = ts2sec(lines[1].split("-->")[1])
            body = " ".join(l.strip() for l in lines[2:])
            cues.append({"n": n, "start_str": start_str,
                         "start": ts2sec(start_str), "end": end, "text": body})
    cnt = defaultdict(int)
    for c in cues:
        h, m, s_ms = c["start_str"].split(":")
        s, ms = s_ms.split(",")
        base = f"{int(h) * 60 + int(m)}-{int(s):02d}"
        cnt[base] += 1
        c["label"] = base if cnt[base] == 1 else f"{base}-{ms}"
    return cues


# ---------------------------------------------------------------- assets
def index_images(img_dir: Path):
    idx = {}
    if img_dir.exists():
        for p in sorted(img_dir.iterdir()):
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


# ---------------------------------------------------------------- analysis
def img_anchor(path: Path):
    """Subject-bias centre (0..1): edge-energy centroid blended to centre."""
    try:
        from PIL import Image, ImageFilter
        im = Image.open(path).convert("L").resize((64, 64))
        edges = im.filter(ImageFilter.FIND_EDGES)
        px = list(edges.getdata())
        tot = sum(px)
        if tot <= 0:
            return 0.5, 0.5
        cx = sum((i % 64) * v for i, v in enumerate(px)) / tot / 63.0
        cy = sum((i // 64) * v for i, v in enumerate(px)) / tot / 63.0
        return (0.5 + (cx - 0.5) * 0.5, 0.5 + (cy - 0.5) * 0.5)
    except Exception:
        return 0.5, 0.5


def load_energies(path: Path):
    """cue-number -> energy 0..1 from cue_classes.json (optional)."""
    import json
    try:
        d = json.loads(path.read_text(encoding="utf-8"))
        return {int(k): float(v.get("energy", 0.5)) for k, v in d.items()}
    except Exception:
        return {}


# ---------------------------------------------------------------- timeline
def pick_fades(cues, total_fade):
    """Per-boundary fade lengths: varied, always under the local gap."""
    out = []
    for i in range(len(cues) - 1):
        gap = cues[i + 1]["start"] - cues[i]["start"]
        h = int(hashlib.md5(f"fd{i}".encode()).hexdigest(), 16)
        f = FADE_SET[h % 3] * (0.75 + 0.5 * ((h >> 4) % 10) / 10.0)
        f = min(f, 0.85 * gap, total_fade * 1.6)
        out.append(round(max(0.18, f), 3))
    return out


def plan_timeline(cues, fades, total, limit=None):
    """Clip durations + xfade offsets for per-boundary fade lengths.

    Boundary B_i = start of cue i+1; transition i starts at
    O_i = B_i - fades[i]/2.  Clip i spans its cue plus half-fade margins.
    """
    if limit:
        cues = cues[:limit]
        total = cues[-1]["end"] + 1.0
    n = len(cues)
    bounds = [cues[i + 1]["start"] for i in range(n - 1)]
    offs = [b - fades[i] / 2.0 for i, b in enumerate(bounds)]
    clips = []
    for i in range(n):
        if n == 1:
            dur = total
        elif i == 0:
            dur = bounds[0] + fades[0] / 2.0
        elif i == n - 1:
            dur = total - offs[-1]
        else:
            dur = (bounds[i] - bounds[i - 1]) + (fades[i - 1] + fades[i]) / 2.0
        clips.append({"n": cues[i]["n"], "label": cues[i]["label"],
                      "dur": dur, "frames": int(round(dur * FPS)) + 2})
    return cues, clips, offs, total


# ---------------------------------------------------------------- motion
def kenburns(i: int, frames: int, energy: float, ax: float, ay: float):
    """6-pattern eased Ken Burns with per-cue amplitude variation."""
    d = max(frames, 2)
    t = f"(on/{d})"
    e = f"({t}*{t}*(3-2*{t}))"                    # smoothstep ease
    h = int(hashlib.md5(f"kb{i}".encode()).hexdigest(), 16)
    k = 0.075 + 0.045 * ((h >> 2) % 10) / 10.0 + 0.035 * energy
    cx = f"(iw-iw/zoom)*{min(0.68, max(0.32, ax + ((h >> 8) % 9 - 4) / 100)):.3f}"
    cy = f"(ih-ih/zoom)*{min(0.68, max(0.32, ay + ((h >> 12) % 9 - 4) / 100)):.3f}"
    p = h % 6
    if p == 0:                                    # slow push in
        return f"(1+{k:.4f}*{e})", cx, cy
    if p == 1:                                    # slow pull out
        return f"({1 + k:.4f}-{k:.4f}*{e})", cx, cy
    if p == 2:                                    # drift right
        return f"(1+{k / 2:.4f})", f"(iw-iw/zoom)*{e}", cy
    if p == 3:                                    # drift left
        return f"(1+{k / 2:.4f})", f"(iw-iw/zoom)*(1-{e})", cy
    if p == 4:                                    # diagonal in
        return (f"(1+{k:.4f}*{e})",
                f"(iw-iw/zoom)*({0.28 + 0.24 * (h % 5) / 5:.2f}+0.10*{e})", cy)
    return (f"({1 + k:.4f}-{k:.4f}*{e})",         # diagonal out
            f"(iw-iw/zoom)*({0.62 - 0.24 * (h % 5) / 5:.2f}+0.10*{e})", cy)


# ---------------------------------------------------------------- filtergraph
def write_filter_script(path: Path, clips, offs, fades, total,
                        vo_idx, mus_idx, w, h, sw, sh):
    L = []
    for i, c in enumerate(clips):
        z, x, y = kenburns(i, c["frames"], c.get("energy", 0.5),
                           *c.get("anchor", (0.5, 0.5)))
        L.append(
            f"[{i}:v]scale={sw}:{sh}:force_original_aspect_ratio=increase"
            f":flags=lanczos,"
            f"crop={sw}:{sh},"
            f"zoompan=z='{z}':x='{x}':y='{y}':d={c['frames']}:s={w}x{h}"
            f":fps={FPS},format=yuv420p,setsar=1,fps={FPS},settb=AVTB[v{i}]"
        )
    prev = "v0"
    for i in range(1, len(clips)):
        out = f"x{i}"
        L.append(f"[{prev}][v{i}]xfade=transition=fade:"
                 f"duration={fades[i - 1]:.3f}:offset={offs[i - 1]:.3f}[{out}]")
        prev = out
    tout = max(total - 1.2, 1.0)
    L.append(f"[{prev}]curves=master='0/0.02 0.5/0.5 1/0.98',"
             f"vignette=angle=PI/4.5,"
             f"fade=t=in:st=0:d=0.5,fade=t=out:st={tout:.3f}:d=1.2,"
             f"format=yuv420p,setsar=1[vout]")

    a = (f"[{vo_idx}:a]aresample=48000,aformat=channel_layouts=stereo,"
         f"atrim=0:{total:.3f},apad[vo]")
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
    srt_path = ROOT / args.srt
    img_dir = ROOT / args.images
    cues_all = parse_srt(srt_path)
    idx = index_images(img_dir)

    vo = None
    if args.name:
        cand = ROOT / "audio" / f"{args.name}_master.mp3"
        if cand.exists():
            vo = cand
    if vo is None:
        vo = find_audio(ROOT / "audio")
    mus = find_audio(MUS_DIR)

    W, H = (int(x) for x in args.res.lower().split("x"))
    SW, SH = int(W * 4 / 3), int(H * 4 / 3)       # pre-zoompan oversample

    energies = load_energies(ROOT / args.cue_class) if args.cue_class else {}

    n_cues = len(cues_all)
    missing, found = [], []
    for c in cues_all:
        hit = find_image(idx, c["label"], c["n"])
        (found if hit else missing).append((c, hit))

    print(f"Style           : tv7plus (TV7 crossfade look, refined)")
    print(f"SRT cues        : {n_cues}")
    print(f"Images found    : {len(found)} / {n_cues}")
    print(f"Master VO       : {vo.name if vo else 'NOT FOUND'}")

    if missing and not args.allow_missing and not args.dry_run and not args.limit:
        print(f"\nMISSING {len(missing)} images (first 15):")
        for c, _ in missing[:15]:
            print(f"  cue {c['n']:>3}  #{c['label']}")
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
        print("\nDry run OK. Run without --dry-run to render.")
        return 0

    # ---- timeline
    if vo:
        total = max(media_duration(ffmpeg, vo), cues_all[-1]["end"])
    else:
        total = cues_all[-1]["end"]
    total += args.tail

    fades = pick_fades(cues_all, args.fade)
    if args.limit:
        total = min(total, cues_all[min(args.limit, n_cues) - 1]["end"] + 1.0)
    cues, clips, offs, total = plan_timeline(cues_all, fades, total,
                                             limit=args.limit)
    fades = fades[:len(clips) - 1]
    for c in clips:
        c["energy"] = energies.get(c["n"], 0.5)
        c["anchor"] = img_anchor(find_image(idx, c["label"], c["n"])
                                 or img_dir / "missing.jpg")
    print(f"Fade rhythm     : {sorted(set(fades))}s across {len(fades)} boundaries")
    print(f"Output duration : {total:.2f}s  ({total / 60:.1f} min), "
          f"{len(clips)} clips  {W}x{H} @{FPS}fps")

    # ---- inputs
    inputs = []
    for c in cues:
        hit = find_image(idx, c["label"], c["n"])
        if hit:
            inputs += ["-i", str(hit)]
        else:
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

    OUT_DIR.mkdir(exist_ok=True)
    fc = OUT_DIR / "fc_tv7plus.txt"
    write_filter_script(fc, clips, offs, fades, total, vo_idx, mus_idx,
                        W, H, SW, SH)

    out = OUT_DIR / (f"{args.name}_test_{args.limit}.mp4" if args.limit
                     else f"{args.name}_final.mp4")
    cmd = [ffmpeg, "-y", "-hide_banner", "-loglevel", "warning", "-stats"]
    cmd += inputs
    cmd += ["-filter_complex_script", str(fc),
            "-map", "[vout]", "-map", "[aout]",
            "-c:v", "libx264", "-preset", args.preset, "-crf", str(args.crf),
            "-pix_fmt", "yuv420p", "-r", str(FPS),
            "-c:a", "aac", "-b:a", "192k", "-ar", "48000",
            "-t", f"{total:.3f}", "-movflags", "+faststart",
            str(out)]

    print(f"\nRendering -> {out}")
    r = subprocess.run(cmd)
    if r.returncode != 0:
        print("ffmpeg failed — see errors above.")
        return r.returncode

    size_mb = out.stat().st_size / 1e6
    print(f"DONE: {out}  ({size_mb:.1f} MB)")
    return 0


if __name__ == "__main__":
    ap = argparse.ArgumentParser()
    ap.add_argument("--dry-run", action="store_true")
    ap.add_argument("--limit", type=int, default=0)
    ap.add_argument("--allow-missing", action="store_true")
    ap.add_argument("--no-music", action="store_true")
    ap.add_argument("--srt", default="tv8.srt")
    ap.add_argument("--name", default="tv8")
    ap.add_argument("--images", default="images_tv8")
    ap.add_argument("--cue-class", default="",
                    help="cue_classes.json for VO-energy motion pacing")
    ap.add_argument("--res", default="1920x1080")
    ap.add_argument("--crf", type=int, default=20)
    ap.add_argument("--preset", default="medium")
    ap.add_argument("--fade", type=float, default=0.55,
                    help="base crossfade length (varied per boundary)")
    ap.add_argument("--tail", type=float, default=2.0)
    sys.exit(build(ap.parse_args()))
