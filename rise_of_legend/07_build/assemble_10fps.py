#!/usr/bin/env python3
"""
Rise of Legend — 10 fps animatic assembler
==========================================
Builds the 2:00 short from `timeline.json` (the single source of truth).

One shot = one source asset = one exact frame count. Nothing is retimed,
nothing is looped past its shot, and the total is always 1,200 frames @ 10 fps.

Modes
  --dry-run (default) : validate the timeline, print the shot table, check assets
  --build             : render every shot, concat frame-exactly, mux the VO
  --slates            : use generated slate cards instead of finished artwork
  --limit N           : build only the first N shots (fast smoke test)
  --verify FILE       : QC an existing file (fps / size / duration / frames / audio)

Typical
  python3 rise_of_legend/07_build/assemble_10fps.py --dry-run
  python3 rise_of_legend/07_build/assemble_10fps.py --slates --build --limit 6
  python3 rise_of_legend/07_build/assemble_10fps.py --slates --build
  python3 rise_of_legend/07_build/assemble_10fps.py --build
  python3 rise_of_legend/07_build/assemble_10fps.py --verify rise_of_legend/08_delivery/animatic_slates.mp4

Deps: pillow, imageio-ffmpeg (or FFMPEG_BIN / ffmpeg on PATH).
"""
import argparse
import json
import os
import re
import shutil
import subprocess
import sys
import textwrap
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]      # rise_of_legend/
ART = ROOT / "04_animation"
DELIV = ROOT / "08_delivery"
WORK = ROOT / "output"
SLATES = WORK / "slates"


# ----------------------------------------------------------------- ffmpeg
def find_ffmpeg() -> str:
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
    sys.exit("ffmpeg not found. `pip install imageio-ffmpeg` or set FFMPEG_BIN.")


def run(cmd, quiet=True):
    r = subprocess.run(cmd, capture_output=True, text=True)
    if r.returncode != 0:
        raise RuntimeError(f"{' '.join(map(str, cmd))[:160]}…\n{r.stderr[-900:]}")
    return r


def probe(ff, path: Path):
    err = subprocess.run([ff, "-hide_banner", "-i", str(path)],
                         capture_output=True, text=True).stderr
    info = {"path": path, "bytes": path.stat().st_size}
    m = re.search(r"Duration:\s*(\d+):(\d+):(\d+(?:\.\d+)?)", err)
    info["dur"] = (int(m.group(1)) * 3600 + int(m.group(2)) * 60
                   + float(m.group(3))) if m else None
    vline = next((ln for ln in err.splitlines() if "Video:" in ln), "")
    vm = re.search(r"(?:^|[ ,])(\d{2,5})x(\d{2,5})(?=[ ,])", vline)
    fm = re.search(r"([\d.]+) fps", vline)
    if vm:
        info.update(w=int(vm.group(1)), h=int(vm.group(2)))
    if fm:
        info["fps"] = float(fm.group(1))
    if vline:
        info["vcodec"] = vline.split("Video:")[1].strip().split(" ")[0]
    m = re.search(r"Audio:\s*(\w+).*?(\d+) Hz", err)
    if m:
        info.update(acodec=m.group(1), ar=int(m.group(2)))
    return info


def count_frames(ff, path: Path) -> int:
    err = subprocess.run([ff, "-hide_banner", "-i", str(path), "-f", "null", "-"],
                         capture_output=True, text=True).stderr
    hits = re.findall(r"frame=\s*(\d+)", err)
    return int(hits[-1]) if hits else 0


# ----------------------------------------------------------------- timeline
def load_timeline(path: Path):
    tl = json.loads(path.read_text(encoding="utf-8"))
    fps = int(tl["fps"])
    total = int(tl["total_frames"])
    cur = 0
    seen = set()
    for s in tl["shots"]:
        if s["id"] in seen:
            sys.exit(f"duplicate shot id {s['id']}")
        seen.add(s["id"])
        if int(s["frames"]) <= 0:
            sys.exit(f"{s['id']}: frames must be > 0")
        s["start_frame"] = cur
        s["start"] = cur / fps
        s["dur"] = int(s["frames"]) / fps
        cur += int(s["frames"])
    if cur != total:
        sys.exit(f"timeline mismatch: shots sum to {cur} frames, total_frames={total}")
    beat_sum = sum(int(b["frames"]) for b in tl.get("beats", []))
    if beat_sum and beat_sum != total:
        sys.exit(f"beat mismatch: beats sum to {beat_sum}, total_frames={total}")
    tl["_fps"] = fps
    return tl


def tc(frames: int, fps: int) -> str:
    sec, f = divmod(frames, fps)
    return f"{sec // 60}:{sec % 60:02d}.{f}"


# ----------------------------------------------------------------- slates
def _font(size):
    from PIL import ImageFont
    for p in ("/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf",
              "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf"):
        if Path(p).exists():
            return ImageFont.truetype(p, size)
    return ImageFont.load_default(size=size)


def make_slate(shot, tl, path: Path):
    """A readable production slate: id, beat, action, timecode, frame count."""
    from PIL import Image, ImageDraw
    W, H = int(tl["width"]), int(tl["height"])
    fps = tl["_fps"]
    im = Image.new("RGB", (W, H), (11, 14, 26))
    d = ImageDraw.Draw(im)
    brass, cream, dim = (201, 162, 39), (245, 236, 214), (120, 130, 160)

    for y in range(H):                                    # soft vertical wash
        v = int(6 * (1 - y / H))
        if v:
            d.line([(0, y), (W, y)], fill=(11 + v, 14 + v, 26 + v))
    d.rectangle([70, 70, W - 70, H - 70], outline=(45, 52, 78), width=3)
    d.rectangle([70, 70, 78, H - 70], fill=brass)

    if shot.get("kind") == "title":
        f1, f2 = _font(150), _font(54)
        d.text((W // 2, H // 2 - 90), "RISE OF LEGEND", font=f1,
               fill=cream, anchor="mm")
        d.line([(W // 2 - 220, H // 2 + 10), (W // 2 + 220, H // 2 + 10)],
               fill=brass, width=5)
        d.text((W // 2, H // 2 + 90), tl.get("episode", ""), font=f2,
               fill=(214, 200, 170), anchor="mm")
        d.text((W // 2, H - 150), f"{shot['id']} · {shot['frames']}f",
               font=_font(30), fill=dim, anchor="mm")
        im.save(path)
        return path

    beat = next((b for b in tl.get("beats", []) if b["id"] == shot["beat"]), None)
    d.text((130, 150), f"{shot['id']}   BEAT {shot['beat']}"
           + (f" — {beat['name'].upper()}" if beat else ""),
           font=_font(44), fill=brass)
    d.text((130, 250), f"{tc(shot['start_frame'], fps)} → "
           f"{tc(shot['start_frame'] + shot['frames'], fps)}"
           f"   ·   {shot['frames']} frames   ·   cam: {shot['camera']}",
           font=_font(34), fill=dim)
    body = textwrap.fill(shot["action"], width=42)
    d.multiline_text((130, 380), body, font=_font(64), fill=cream, spacing=22)
    d.text((130, H - 190), "SLATE — artwork not yet delivered",
           font=_font(32), fill=dim)
    im.save(path)
    return path


# ----------------------------------------------------------------- render
def render_shot(ff, shot, src, out, tl, crf):
    fps = tl["_fps"]
    W, H = int(tl["width"]), int(tl["height"])
    n = int(shot["frames"])
    base = [ff, "-y", "-hide_banner", "-loglevel", "error"]

    if shot.get("kind") == "color" or src is None:
        return run(base + ["-f", "lavfi", "-i", f"color=c=black:s={W}x{H}:r={fps}",
                           "-frames:v", str(n), "-r", str(fps),
                           "-c:v", "libx264", "-preset", "medium", "-crf", str(crf),
                           "-pix_fmt", "yuv420p", str(out)])

    # stepped on 5s (2 held drawings/sec): a ~3% move over the whole shot,
    # quantised so it reads as limited animation instead of smooth 24 fps
    steps = max(1, n // 5)
    is_video = src.suffix.lower() in (".mp4", ".mov", ".mkv", ".webm")
    steps = max(1, n // 5)
    z = {"push": f"1+0.030*floor(on/5)/{steps}",
         "pull": f"1.030-0.030*floor(on/5)/{steps}"}.get(shot.get("camera"), None)
    if is_video:
        dur = n / fps
        pre = (f"fps={fps},tpad=stop_mode=clone:stop_duration={dur:.3f},"
               f"trim=duration={dur:.3f},setpts=PTS-STARTPTS,")
        z = None                      # clips already carry their own motion
    else:
        pre = ""
    vf = (pre + f"scale={W}:{H}:force_original_aspect_ratio=increase:flags=lanczos,"
          f"crop={W}:{H}")
    if z:
        # stepped on 5s -> reads as 10 fps limited animation, never smooth 24 fps
        vf += (f",zoompan=z='{z}':x='(iw-iw/zoom)/2':y='(ih-ih/zoom)/2'"
               f":d={n}:s={W}x{H}:fps={fps}")
    vf += f",fps={fps},format=yuv420p"
    src_in = (["-i", str(src)] if is_video
              else ["-loop", "1", "-framerate", str(fps), "-i", str(src)])
    return run(base + src_in + ["-vf", vf, "-frames:v", str(n), "-r", str(fps),
                                "-c:v", "libx264", "-preset", "medium",
                                "-crf", str(crf), str(out)])


def build(args):
    tl = load_timeline(Path(args.timeline))
    fps = tl["_fps"]
    shots = tl["shots"][:args.limit] if args.limit else tl["shots"]
    total_frames = sum(int(s["frames"]) for s in shots)
    total_sec = total_frames / fps
    ff = find_ffmpeg()

    print(f"Project       : {tl['project']} — {tl['episode']}")
    print(f"Format        : {tl['width']}x{tl['height']} @ {fps} fps"
          f"   {total_frames} frames / {total_sec:.1f}s"
          + (f"   (limit: first {len(shots)} shots)" if args.limit else ""))

    missing = []
    for s in shots:
        if s.get("kind") in ("color", "title"):
            continue
        p = ART / s["source"]
        mov = p.with_suffix(".mp4")
        s["_src"] = mov if mov.exists() else p
        if not s["_src"].exists():
            missing.append((s["id"], p))
    if missing and not args.slates:
        print(f"\nMISSING ARTWORK ({len(missing)}/{len(shots)} shots):")
        for sid, p in missing[:12]:
            print(f"  {sid}  {p.relative_to(ROOT)}")
        print("  … use --slates for a timing pass, or drop art in 04_animation/shots/")
        if args.build:
            return 2
        print("\nDry run (artwork incomplete).")

    if args.dry_run or not args.build:
        print("\n shot  beat  start     frames   cam   action")
        for s in shots:
            flag = "" if (s.get("kind") in ("color", "title")
                          or s.get("_src", Path()).exists()) else "  [missing]"
            print(f" {s['id']}  {s['beat']:>4}  {tc(s['start_frame'], fps):>7}  "
                  f"{s['frames']:>5}   {s['camera']:<5} {s['action'][:58]}{flag}")
        print(f"\nTotal: {len(shots)} shots, {total_frames} frames, "
              f"{total_sec:.1f}s @ {fps} fps")
        return 0 if not missing or args.slates else 2

    # ---- render
    WORK.mkdir(exist_ok=True)
    seg_dir = WORK / "shots"
    seg_dir.mkdir(exist_ok=True)
    SLATES.mkdir(exist_ok=True)
    for i, s in enumerate(shots, 1):
        out = seg_dir / f"{s['id']}.mp4"
        src = None
        if s.get("kind") == "color":
            src = None
        elif args.slates or not s.get("_src", Path()).exists():
            src = make_slate(s, tl, SLATES / f"{s['id']}.png")
        else:
            src = s["_src"]
        render_shot(ff, s, src, out, tl, args.crf)
        kind = ("title" if s.get("kind") == "title" else
                "color" if s.get("kind") == "color" or src is None else
                "slate" if src and SLATES in Path(src).parents else "art")
        print(f"  [{i:>2}/{len(shots)}] {s['id']}  {s['frames']:>3}f  {kind}")

    # ---- concat (stream copy: frame-exact, no re-encode)
    lst = seg_dir / "concat.txt"
    lst.write_text("".join(f"file '{seg_dir / (s['id'] + '.mp4')}'\n"
                           for s in shots), encoding="utf-8")
    silent = WORK / "animatic_silent.mp4"
    run([ff, "-y", "-hide_banner", "-loglevel", "error", "-f", "concat",
         "-safe", "0", "-i", str(lst), "-c", "copy", str(silent)])

    # ---- mux VO
    DELIV.mkdir(exist_ok=True)
    stem = "animatic_slates" if args.slates else "ep01_animatic"
    if args.limit:
        stem += f"_first{len(shots)}"
    out = DELIV / f"{stem}.mp4"
    vo = Path(args.vo) if args.vo else ROOT / tl.get("vo", "")
    if not vo.is_absolute() and not vo.exists():
        vo = ROOT / vo
    if Path(vo).exists() and not args.no_vo:
        run([ff, "-y", "-hide_banner", "-loglevel", "error", "-i", str(silent),
             "-i", str(vo), "-map", "0:v:0", "-map", "1:a:0", "-c:v", "copy",
             "-c:a", "aac", "-b:a", "192k", "-ar", "48000", "-ac", "2",
             "-t", f"{total_sec:.3f}", "-movflags", "+faststart", str(out)])
        audio_note = f"VO muxed: {Path(vo).name}"
    else:
        shutil.copy(silent, out)
        audio_note = "no VO found — silent animatic"
    size = out.stat().st_size / 1e6
    print(f"\nDONE: {out.relative_to(ROOT.parent)}  ({size:.1f} MB)  {audio_note}")
    verify(ff, out, tl, total_frames, expect_audio=Path(vo).exists() and not args.no_vo)
    return 0


# ----------------------------------------------------------------- verify
def verify(ff, path: Path, tl, expect_frames=None, expect_audio=None):
    fps = tl["_fps"] if tl else 10
    i = probe(ff, path)
    frames = count_frames(ff, path)
    checks = []

    def chk(name, ok, got):
        checks.append(ok)
        print(f"  {'PASS' if ok else 'FAIL'}  {name:<14} {got}")

    print(f"\nQC {path.name}: {i['bytes'] / 1e6:.1f} MB")
    chk("resolution", (i.get("w"), i.get("h")) == (tl["width"], tl["height"]),
        f"{i.get('w')}x{i.get('h')}")
    chk("fps", i.get("fps") == float(fps), f"{i.get('fps')} (want {fps})")
    chk("duration", i["dur"] is not None
        and abs(i["dur"] - frames / fps) < 0.15, f"{i.get('dur')}s for {frames}f")
    if expect_frames:
        chk("frames", frames == expect_frames, f"{frames} (want {expect_frames})")
    else:
        print(f"  INFO  frames         {frames}")
    if expect_audio is not None:
        chk("audio", ("acodec" in i) == expect_audio,
            f"{i.get('acodec', 'none')} {i.get('ar', '')}")
    ok = all(checks)
    print(f"  OVERALL: {'PASS' if ok else 'FAIL'}")
    return ok


def main():
    ap = argparse.ArgumentParser(description="Rise of Legend 10 fps assembler")
    ap.add_argument("--timeline", default=str(ROOT / "timeline.json"))
    ap.add_argument("--build", action="store_true", help="render and assemble")
    ap.add_argument("--slates", action="store_true",
                    help="use generated slate cards instead of artwork")
    ap.add_argument("--dry-run", action="store_true", help="validate + print table")
    ap.add_argument("--limit", type=int, default=0, help="first N shots only")
    ap.add_argument("--crf", type=int, default=20)
    ap.add_argument("--vo", default="", help="override VO path")
    ap.add_argument("--no-vo", action="store_true")
    ap.add_argument("--verify", default="", help="QC an existing file")
    a = ap.parse_args()

    if a.verify:
        tl = load_timeline(Path(a.timeline))
        ok = verify(find_ffmpeg(), Path(a.verify), tl)
        return 0 if ok else 1
    if not a.build:
        a.dry_run = True
    return build(a)


if __name__ == "__main__":
    sys.exit(main())
