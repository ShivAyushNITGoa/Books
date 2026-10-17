#!/usr/bin/env python3
"""Split the 2K silent video (output/video_only.mp4) into 5 parts at the
VO chapter boundaries and mux each part's voiceover slice.

Part boundaries (seconds, from the 6 VO part lengths):
  0 / 499.67 / 835.40 / 1175.91 / 1414.12 / 1897.05 (VO end)
Video parts (last gets a +2 s held-image tail):
  1: 0      - 499.67    (VO parts 1-2)
  2: 499.67 - 835.40    (VO part 3)
  3: 835.40 - 1175.91   (VO part 4)
  4: 1175.91- 1414.12   (VO part 5)
  5: 1414.12- 1899.083  (VO part 6 + 2 s tail)

Each part stays under GitHub's 100 MB cap (stream-copy video + AAC 92k).
Usage: python3 scripts/split_parts.py
"""
import subprocess
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT))
from build_video import (SRT_PATH, AUD_DIR, OUT_DIR, find_ffmpeg,
                         media_duration, parse_srt)

VIDEO = OUT_DIR / "video_only.mp4"
BOUNDS = [0.0, 499.67, 835.40, 1175.91, 1414.12, 1899.083]
CAP_MB = 97.0


def main():
    ffmpeg = find_ffmpeg()
    cues = parse_srt(SRT_PATH)
    vo = sorted((p for p in AUD_DIR.iterdir() if p.suffix == ".mp3"))[0]
    vo_dur = media_duration(ffmpeg, vo)

    # map each boundary to the first cue starting at/after it
    idx = []
    for b in BOUNDS:
        hit = next((i for i, c in enumerate(cues) if c["start"] >= b - 0.05),
                   len(cues))
        idx.append(hit)

    print(f"VO duration {vo_dur:.2f}s, boundaries -> cue indexes {idx}")
    for k in range(len(BOUNDS) - 1):
        i0, i1 = idx[k], idx[k + 1]
        v_start = cues[i0]["start"] if i0 else 0.0
        v_end = BOUNDS[k + 1] if k + 1 == len(BOUNDS) - 1 else cues[i1]["start"]
        a_end = min(v_end, vo_dur)

        segs = list(range(i0 + 1, i1 + 1))
        lst = OUT_DIR / f"part{k + 1}_list.txt"
        paths = [str(OUT_DIR / "segments" / f"{n:03d}.mp4") for n in segs]
        lst.write_text("".join("file '" + p + "'\n" for p in paths),
                       encoding="utf-8")

        out = OUT_DIR / f"tv6_2k_part{k + 1}.mp4"
        cmd = [ffmpeg, "-y", "-hide_banner", "-loglevel", "error",
               "-f", "concat", "-safe", "0", "-i", str(lst),
               "-ss", f"{v_start:.3f}", "-to", f"{a_end:.3f}", "-i", str(vo),
               "-map", "0:v:0", "-map", "1:a:0",
               "-c:v", "copy",
               "-c:a", "aac", "-b:a", "92k", "-ar", "48000", "-ac", "2",
               "-movflags", "+faststart", str(out)]
        print(f"part {k + 1}: cues {segs[0]}-{segs[-1]}  "
              f"video {v_start:.2f}-{v_end:.2f}s  audio ->{a_end:.2f}s")
        r = subprocess.run(cmd, capture_output=True, text=True)
        if r.returncode != 0:
            print("FAILED:", r.stderr[-1000:])
            return 1
        mb = out.stat().st_size / 1e6
        flag = "  !! OVER CAP" if mb > CAP_MB else ""
        print(f"  -> {out.name}  {mb:.1f} MB{flag}")
        if mb > CAP_MB:
            print("  (re-encode this part at CRF+1 or re-split the boundary)")
    print("SPLIT DONE")
    return 0


if __name__ == "__main__":
    sys.exit(main())
