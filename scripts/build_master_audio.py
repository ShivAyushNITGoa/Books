#!/usr/bin/env python3
"""
TV6 master voiceover builder
============================
Concatenates the six TV6 narration parts (in fixed order) into
audio/tv6_master.mp3, which is the single VO track for the video.

Order & alignment (verified against tv6.srt by energy cross-correlation):
    p1 -> 00:00:00    (SRT starts 00:00:00,290)
    p2 -> 00:03:04    (SRT boundary ~00:03:04)
    p3 -> 00:08:19
    p4 -> 00:13:55
    p5 -> 00:19:35
    p6 -> 00:23:34
The parts were sliced from the master narration, so simple back-to-back
concatenation reproduces the SRT timeline (measured drift < 0.2 s at the
first four boundaries).

NOTE: the SRT ends at 00:29:58,970, but the narration continues until
~00:31:37. The video therefore holds the final scene image until the
audio finishes (see build_video.py).

Usage:
    python3 scripts/build_master_audio.py
"""
import shutil
import subprocess
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
PARTS = [  # fixed order
    "TV6  p1.mp3",
    "TV6 p2.mp3",
    "TV6 p3.mp3",
    "TV6 P4.mp3",
    "TV6 P5.mp3",
    "TV6 P6.mp3",
]
OUT = ROOT / "audio" / "tv6_master.mp3"


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


def main() -> int:
    ffmpeg = find_ffmpeg()
    for p in PARTS:
        f = ROOT / p
        if not f.exists():
            sys.exit(f"missing part: {p}")
    OUT.parent.mkdir(parents=True, exist_ok=True)

    cmd = [ffmpeg, "-y", "-hide_banner", "-loglevel", "error", "-stats"]
    for p in PARTS:
        cmd += ["-i", str(ROOT / p)]
    n = len(PARTS)
    chains = [f"[{i}:a]aresample=48000,aformat=channel_layouts=stereo[a{i}]" for i in range(n)]
    chains.append("".join(f"[a{i}]" for i in range(n)) + f"concat=n={n}:v=0:a=1[out]")
    cmd += [
        "-filter_complex", ";".join(chains),
        "-map", "[out]",
        "-c:a", "libmp3lame", "-b:a", "128k",
        str(OUT),
    ]
    print("Building", OUT)
    r = subprocess.run(cmd)
    if r.returncode != 0:
        return r.returncode
    dur = subprocess.run([ffmpeg, "-hide_banner", "-i", str(OUT)],
                         capture_output=True, text=True)
    import re
    m = re.search(r"Duration:\s*([\d:]+\.?\d*)", dur.stderr)
    print(f"DONE: {OUT}  duration {m.group(1) if m else '?'}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
