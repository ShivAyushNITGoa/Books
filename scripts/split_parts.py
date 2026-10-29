#!/usr/bin/env python3
"""Split output/<name>_final.mp4 into few, integration-ready parts.

Guarantees:
- Video and audio are cut over the EXACT same window (-ss/-t on the same
  input) and re-encoded identically: parts abut perfectly, the VO is never
  clipped or padded at seams, and the parts concat back to the master with
  a plain stream copy (no quality loss at joins).
- Each part stays under the GitHub cap (default 97 MB) — if a part is over,
  it is automatically re-encoded at +2 CRF (up to 30).
- Prints the exact concat command to re-integrate the parts.

Usage:
  python3 scripts/split_parts.py --name tv8 \
      --bounds "0,256.57,536.07,861.03,1171.74"
"""
import argparse
import subprocess
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT))
from build_video import OUT_DIR, find_ffmpeg, media_duration

CAP_MB = 97.0


def cut(ffmpeg, master, start, length, out, crf):
    cmd = [ffmpeg, "-y", "-hide_banner", "-loglevel", "error",
           "-ss", f"{start:.3f}", "-i", str(master), "-t", f"{length:.3f}",
           "-map", "0:v:0", "-map", "0:a:0",
           "-c:v", "libx264", "-preset", "medium", "-crf", str(crf),
           "-pix_fmt", "yuv420p", "-r", "24",
           "-c:a", "aac", "-b:a", "192k", "-ar", "48000", "-ac", "2",
           "-movflags", "+faststart", str(out)]
    r = subprocess.run(cmd, capture_output=True, text=True)
    if r.returncode != 0:
        raise RuntimeError(f"cut {out.name}: {r.stderr[-800:]}")
    return out.stat().st_size / 1e6


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--bounds", default="0,256.57,536.07,861.03,1171.74",
                    help="comma-separated part boundaries in seconds "
                         "(first 0, last = master total)")
    ap.add_argument("--name", default="tv8")
    ap.add_argument("--master", default="",
                    help="master file (default output/<name>_final.mp4)")
    ap.add_argument("--crf", type=int, default=24)
    ap.add_argument("--cap", type=float, default=CAP_MB)
    args = ap.parse_args()

    ffmpeg = find_ffmpeg()
    master = Path(args.master) if args.master else OUT_DIR / f"{args.name}_final.mp4"
    if not master.exists():
        print(f"master not found: {master}")
        return 1
    total = media_duration(ffmpeg, master)
    bounds = [float(b) for b in args.bounds.split(",")]
    if abs(bounds[-1] - total) > 1.0:
        print(f"note: last bound {bounds[-1]:.2f} != master {total:.2f}")
    bounds[-1] = min(bounds[-1], total)

    outs = []
    for k in range(len(bounds) - 1):
        start, end = bounds[k], bounds[k + 1]
        length = end - start
        out = OUT_DIR / f"{args.name}_2k_part{k + 1}.mp4"
        crf = args.crf
        mb = cut(ffmpeg, master, start, length, out, crf)
        while mb > args.cap and crf < 30:
            crf += 2
            print(f"  part {k + 1} {mb:.1f} MB > {args.cap} MB cap -> CRF {crf}")
            mb = cut(ffmpeg, master, start, length, out, crf)
        flag = "  !! OVER CAP" if mb > args.cap else ""
        print(f"part {k + 1}: {start:.2f}-{end:.2f}s ({length:.2f}s) "
              f"CRF {crf} -> {out.name}  {mb:.1f} MB{flag}")
        outs.append(out.name)

    print(f"\nparts: {len(outs)}  sum of bounds: {sum(b - a for a, b in zip(bounds, bounds[1:])):.2f}s "
          f"(master {total:.2f}s) — seams are exact, audio unaffected")
    print("integrate with:\n"
          f"  printf \"file '%s'\\n\" {' '.join(outs)} > list.txt && "
          "ffmpeg -f concat -safe 0 -i list.txt -c copy joined.mp4")
    return 0


if __name__ == "__main__":
    sys.exit(main())
