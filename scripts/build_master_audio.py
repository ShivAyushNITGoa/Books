#!/usr/bin/env python3
"""Stage 2 (Path A) - raw-concatenate the provided VO MP3s in order -> audio/{ep}_master.mp3.

R4: concat is the only allowed operation on provided VO MP3s. MPEG audio
streams concatenate cleanly at frame boundaries, so a byte-level concat
is a raw concat (no re-encode). Part boundaries are recorded in
audio/{ep}_vo_boundaries.json for Stage 7 part splits.
"""
import json
import re
import subprocess
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
EP = "tv7"


def mp3_duration(path: Path) -> float:
    """Pure-Python MPEG frame-header walk (no ffprobe in this sandbox)."""
    data = path.read_bytes()
    i = 0
    n = len(data)
    # skip ID3v2 if present
    if data[:3] == b"ID3":
        size = ((data[6] & 0x7F) << 21) | ((data[7] & 0x7F) << 14) | ((data[8] & 0x7F) << 7) | (data[9] & 0x7F)
        i = 10 + size
    br_v1 = [0, 32, 40, 48, 56, 64, 80, 96, 112, 128, 160, 192, 224, 256, 320]
    br_v2 = [0, 8, 16, 24, 32, 40, 48, 56, 64, 80, 96, 112, 128, 144, 160]
    sr = {3: [44100, 48000, 32000], 2: [22050, 24000, 16000], 0: [11025, 12000, 8000]}
    total = 0.0
    first = True
    while i < n - 4:
        if data[i] == 0xFF and (data[i + 1] & 0xE0) == 0xE0:
            ver = (data[i + 1] >> 3) & 3
            layer = (data[i + 1] >> 1) & 3
            br_idx = (data[i + 2] >> 4) & 15
            sr_idx = (data[i + 2] >> 2) & 3
            pad = (data[i + 2] >> 1) & 1
            if ver != 3 and ver != 2 and ver != 0:
                i += 1; continue
            if layer != 1:
                i += 1; continue
            if br_idx in (0, 15) or sr_idx == 3:
                i += 1; continue
            bitrate = (br_v1 if ver == 3 else br_v2)[br_idx] * 1000
            samplerate = sr[ver][sr_idx]
            samples = 1152 if ver == 3 else 576
            flen = int(samples / 8 * bitrate / samplerate) + pad
            if flen <= 4:
                i += 1; continue
            total += samples / samplerate
            i += flen
            first = False
        else:
            i += 1
    return total


def main() -> int:
    parts = sorted(ROOT.glob(f"{EP.upper()} *.mp3")) + sorted(ROOT.glob(f"{EP.upper()}*.mp3"))
    # canonical order p1..pN (spacing/case variants allowed by the spec)
    def key(p: Path):
        m = re.search(r"[pP]\s*(\d+)", p.stem)
        return int(m.group(1)) if m else 0
    parts = sorted(set(parts), key=key)
    parts = [p for p in parts if key(p)]
    if not parts:
        print("no VO parts found"); return 2
    out_dir = ROOT / "audio"
    out_dir.mkdir(exist_ok=True)
    master = out_dir / f"{EP}_master.mp3"
    dur = 0.0
    bounds = [0.0]
    with open(master, "wb") as w:
        for p in parts:
            w.write(p.read_bytes())
            d = mp3_duration(p)
            dur += d
            bounds.append(round(dur, 2))
            print(f"  {p.name}: {d:.2f}s")
    (out_dir / f"{EP}_vo_boundaries.json").write_text(
        json.dumps({"parts": [p.name for p in parts],
                    "part_durations": [round(mp3_duration(p), 2) for p in parts],
                    "boundaries_s": bounds[:-1], "total_s": bounds[-1]}, indent=2))
    print(f"master: {master}  bytes={master.stat().st_size}  ~{dur:.2f}s")
    print(f"VO chapter boundaries (Stage 7): {bounds}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
