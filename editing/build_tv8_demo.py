#!/usr/bin/env python3
"""Render a short, subtle TV8 editing demo from the committed source assets.

Uses the first clean cue-boundary window between 30 and 40 seconds (currently
35.59s), one source image per cue, and the original master MP3 copied without
re-encoding. It intentionally avoids directional/vertical blur wipes.

Run from the project root:
  python3 editing/build_tv8_demo.py --out tv8_demo_35s.mp4
"""
from __future__ import annotations

import argparse
import json
import subprocess
import sys
from pathlib import Path

ROOT = Path.cwd()
sys.path.insert(0, str(ROOT / "editing"))
import build_video as core  # noqa: E402

FPS = 24
WIDTH, HEIGHT = 2560, 1440
AUDIO = ROOT / "audio" / "tv8_master.mp3"
SRT = ROOT / "tv8.srt"
IMAGES = ROOT / "images_tv8"
CLASSES = ROOT / "prompts" / "cue_classes.json"


def esc_path(path: Path) -> str:
    # FFmpeg filter-graph paths need escaping for ':' and apostrophe.
    return str(path.resolve()).replace("\\", "\\\\").replace(":", r"\:").replace("'", r"\'")


def choose_demo_cues(cues):
    """Take a contiguous opening window ending on a cue boundary in [30, 40]."""
    end_index = next((i for i in range(1, len(cues))
                      if 30.0 <= cues[i]["start"] <= 40.0), None)
    if end_index is None:
        raise RuntimeError("No cue boundary in the 30–40 second demo window")
    chosen = cues[:end_index]
    total = cues[end_index]["start"]
    return chosen, total


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--out", default="tv8_demo_35s.mp4",
                    help="output MP4 path relative to the project root")
    args = ap.parse_args()

    for p in (SRT, AUDIO, CLASSES, IMAGES):
        if not p.exists():
            raise SystemExit(f"Missing TV8 source asset: {p}")

    ffmpeg = core.find_ffmpeg()
    cues_all = core.parse_srt(SRT)
    cues, total = choose_demo_cues(cues_all)
    class_map = {int(k): v for k, v in json.loads(CLASSES.read_text()).items()}
    core.IMG_DIR = IMAGES
    image_index = core.index_images()

    shots = []
    for i, cue in enumerate(cues):
        start = 0.0 if i == 0 else cue["start"]
        end = cues[i + 1]["start"] if i + 1 < len(cues) else total
        img = core.find_image(image_index, cue["label"], cue["n"])
        if not img:
            raise SystemExit(f"Missing cue image: {cue['label']}")
        shots.append({**cue, "start": start, "end": end, "dur": end - start,
                      "image": img, "tag": class_map.get(cue["n"], {})})

    # Quantize each cue to frames; only the final demo cue absorbs rounding.
    target_frames = round(total * FPS)
    for shot in shots[:-1]:
        shot["frames"] = max(int(shot["dur"] * FPS), 2)
    shots[-1]["frames"] = max(target_frames - sum(s["frames"] for s in shots[:-1]), 2)

    cmd = [ffmpeg, "-y", "-hide_banner", "-loglevel", "error"]
    for s in shots:
        cmd += ["-loop", "1", "-framerate", str(FPS), "-t",
                f"{s['frames'] / FPS:.6f}", "-i", str(s["image"])]
    audio_idx = len(shots)
    cmd += ["-i", str(AUDIO)]

    graph = []
    for i, s in enumerate(shots):
        cls = s["tag"].get("class", "story")
        mood = s["tag"].get("mood", "neutral")
        energy = float(s["tag"].get("energy", 0.5))
        ax, ay = core.image_anchor(s["image"])
        nframes = s["frames"]
        # Gentle cosine easing, motion-continuity drift, and sub-pixel
        # handheld motion. No vertical smear or blur-pass effect.
        u = f"min(max(on/{max(nframes - 1, 1)},0),1)"
        ease = f"(0.5-0.5*cos(PI*{u}))"
        amp = 0.022 if cls == "word" else 0.030 + 0.006 * min(energy, 1.0)
        # Keep a consistent screen direction through the story run; host cues
        # settle into a nearly locked reverse drift as a deliberate beat.
        direction = -1 if cls == "host" else 1
        pan = (0.016 if cls == "host" else 0.030) * direction
        seed = (i * 7 + 3) % 23
        z = f"1+{amp:.4f}*{ease}"
        x = (f"(iw-iw/zoom)*({ax:.3f}+({pan:.3f})*{ease})+"
             f"(iw-iw/zoom)*0.0012*sin(on*0.071+{seed})")
        y = (f"(ih-ih/zoom)*{ay:.3f}+"
             f"(ih-ih/zoom)*0.0012*sin(on*0.053+{seed + 5})")

        sat = 0.97
        contrast = 1.035
        br = "-0.025*exp(-3*t)"  # subtle exposure settle in each cue
        if mood == "dark":
            sat, contrast = 0.91, 1.045
        elif mood == "light":
            sat, contrast, br = 1.03, 1.035, "0.012-0.025*exp(-3*t)"
        fade_in = 0.48 if i == 0 else (0.10 if cls == "host" else 0.0)
        fade_out = 0.28 if i == len(shots) - 1 else (0.10 if cls == "host" else 0.0)

        chain = [
            f"[{i}:v]scale={WIDTH}:{HEIGHT}:force_original_aspect_ratio=increase:flags=lanczos",
            f"crop={WIDTH}:{HEIGHT}",
            f"zoompan=z='{z}':x='{x}':y='{y}':d={nframes}:s={WIDTH}x{HEIGHT}:fps={FPS}",
            # Tiny roll drift with overscan, not a blur or wipe.
            "scale=2688:1512:flags=lanczos",
            f"rotate='0.0022*sin(t*0.16+{seed})':ow=iw:oh=ih:c=black",
            f"crop={WIDTH}:{HEIGHT}",
            f"eq=contrast={contrast:.3f}:saturation={sat:.3f}:brightness='{br}':eval=frame",
            "colorbalance=rs=0.012:gs=0.002:bs=-0.004:rm=0.004:bm=-0.003",
            "noise=alls=2:allf=t+u",
            "vignette=angle=PI/5.2",
            f"split=2[base{i}][bloom_src{i}]",
        ]
        graph.append(",".join(chain))
        # Highlight-only bloom: the source art stays sharp; only a faint warm
        # halo is screen-blended back. This is not a directional blur/wipe.
        graph.append(f"[bloom_src{i}]curves=all='0/0 0.65/0 0.85/0.3 1/0.6',"
                     f"gblur=sigma=8[glow{i}]")
        post = [f"[base{i}][glow{i}]blend=all_mode=screen:all_opacity=0.055"]
        if fade_in > 0:
            post.append(f"fade=t=in:st=0:d={fade_in:.3f}:color=0x140b08")
        if fade_out > 0:
            post.append(f"fade=t=out:st={max(s['frames']/FPS-fade_out, 0):.3f}:"
                        f"d={fade_out:.3f}:color=0x140b08")
        post += ["format=yuv420p", f"trim=end_frame={nframes}",
                 "setpts=PTS-STARTPTS[v%d]" % i]
        graph.append(",".join(post))

    graph.append("".join(f"[v{i}]" for i in range(len(shots))) +
                 f"concat=n={len(shots)}:v=1:a=0[vout]")
    cmd += ["-filter_complex", ";".join(graph),
            "-map", "[vout]", "-map", f"{audio_idx}:a:0",
            "-frames:v", str(target_frames),
            "-c:v", "libx264", "-preset", "medium", "-crf", "24",
            "-pix_fmt", "yuv420p", "-r", str(FPS),
            # Stream-copy the original MP3: no resampling, volume, or encoding.
            "-c:a", "copy", "-t", f"{total:.3f}",
            "-movflags", "+faststart", str(ROOT / args.out)]

    print(f"TV8 demo: cues 1–{len(shots)}, {len(shots)} source images, "
          f"{total:.2f}s / {target_frames} video frames")
    print("Look: slow eased push/pan, tiny handheld/roll, gentle grade/grain, "
          "host dips; no directional blur. Audio: original MP3 stream copy.")
    print("Cue plan:")
    for s in shots:
        print(f"  {s['n']:3d} #{s['label']:<8} {s['frames']:3d} frames "
              f"{s['dur']:.2f}s {s['image'].name}")
    result = subprocess.run(cmd)
    if result.returncode:
        return result.returncode
    out = ROOT / args.out
    print(f"DONE: {out} ({out.stat().st_size / 1e6:.1f} MB)")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
