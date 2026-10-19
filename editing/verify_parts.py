#!/usr/bin/env python3
"""Acceptance checks A1/A2 for episode parts. No ffprobe - parses ffmpeg -i stderr.

Usage: python3 scripts/verify_parts.py --ep tv8 --cues 330
"""
import argparse
import subprocess
import sys
from pathlib import Path

ROOT = Path.cwd()  # run from the episode project root (where the parts are)
FF = None
import imageio_ffmpeg
FF = imageio_ffmpeg.get_ffmpeg_exe()


def probe(path):
    r = subprocess.run([FF, "-i", str(path)], capture_output=True, text=True)
    err = r.stderr
    info = {"path": path.name, "bytes": path.stat().st_size}
    import re
    m = re.search(r"Duration: (\d+):(\d+):(\d+\.\d+)", err)
    info["dur"] = int(m.group(1)) * 3600 + int(m.group(2)) * 60 + float(m.group(3)) if m else None
    m = re.search(r"Video: (\w+).*, (\d+)x(\d+).* (\d+(?:\.\d+)?) fps", err)
    if m:
        info["vcodec"], info["w"], info["h"], info["fps"] = m.group(1), int(m.group(2)), int(m.group(3)), float(m.group(4))
    m = re.search(r"Audio: (\w+).* (\d+) Hz", err)
    if m:
        info["acodec"], info["ar"] = m.group(1), int(m.group(2))
    return info


def srt_cues(path):
    blocks = [b for b in path.read_text(encoding="utf-8").split("\n\n") if b.strip()]
    return len(blocks)


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--ep", default="tv7", help="episode slug (files <ep>.srt, <ep>_2k_part*.mp4)")
    ap.add_argument("--cues", type=int, default=None, help="expected cue count (A1)")
    args = ap.parse_args()
    srt = ROOT / f"{args.ep}.srt"
    parts = sorted(ROOT.glob(f"{args.ep}_2k_part*.mp4"))
    print(f"episode: {args.ep} | parts: {[p.name for p in parts]}")
    if not parts:
        print("OVERALL: FAIL (no parts)")
        return 1
    cues = srt_cues(srt)
    print(f"A1: SRT cues = {cues} (expected {args.cues})")
    ok = (args.cues is None or cues == args.cues)
    total = 0.0
    for p in parts:
        i = probe(p)
        total += i["dur"] or 0
        size_mb = i["bytes"] / 1e6
        checks = [
            i.get("w") == 1920 and i.get("h") == 1080,
            i.get("fps") == 24.0,
            i.get("vcodec") == "h264",
            i.get("acodec") == "aac",
            i.get("ar") == 48000,
            i["bytes"] < 100_000_000,
        ]
        status = "PASS" if all(checks) else "FAIL"
        if not all(checks):
            ok = False
        print(f"  {p.name}: {i['dur']:.2f}s {size_mb:.1f}MB {i.get('w')}x{i.get('h')} "
              f"{i.get('fps')}fps {i.get('vcodec')}+{i.get('acodec')} {i.get('ar')}Hz -> {status}")
    print(f"A2: total parts duration {total:.2f}s")
    print("OVERALL:", "PASS" if ok else "FAIL")
    return 0 if ok else 1


if __name__ == "__main__":
    sys.exit(main())
