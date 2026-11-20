#!/usr/bin/env python3
"""Assemble per-beat voice-over clips into one track + a timing map.

    python3 render/build_vo.py vo/scarcity --tempo 1.08 --lead 0.35 --gap 0.14

For every NN-*.wav clip (sorted): speed up with atempo, trim leading/trailing
silence, shorten internal pauses to --pause seconds, then lay clips end to end.
Writes  <dir>/voiceover.wav  and  <dir>/timings.json  (per clip: start, end, and
speech segments in track time) so the beat sheet can be cut to the real audio.
"""
import argparse
import json
import re
import subprocess
import wave
from pathlib import Path

import imageio_ffmpeg
import numpy as np

FF = imageio_ffmpeg.get_ffmpeg_exe()
SR = 48000


def load(path: Path, tempo: float) -> np.ndarray:
    raw = subprocess.run([FF, "-v", "error", "-i", str(path), "-af", f"atempo={tempo}",
                          "-ac", "1", "-ar", str(SR), "-f", "f32le", "-"],
                         check=True, capture_output=True).stdout
    return np.frombuffer(raw, dtype=np.float32).copy()


def speech_segments(x: np.ndarray, thresh_db=-40.0, min_sil=0.15, win=0.01):
    """Return [(start, end)] seconds of non-silent audio."""
    n = int(SR * win)
    frames = len(x) // n
    rms = np.sqrt(np.mean(x[: frames * n].reshape(frames, n) ** 2, axis=1) + 1e-12)
    loud = 20 * np.log10(rms) > thresh_db
    segs, start = [], None
    for i, v in enumerate(loud):
        if v and start is None:
            start = i
        if not v and start is not None:
            segs.append([start * win, i * win]); start = None
    if start is not None:
        segs.append([start * win, frames * win])
    merged = []
    for s in segs:  # merge gaps shorter than min_sil (those are not pauses)
        if merged and s[0] - merged[-1][1] < min_sil:
            merged[-1][1] = s[1]
        else:
            merged.append(s)
    return [(max(0, a - 0.03), b + 0.05) for a, b in merged]


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("dir")
    ap.add_argument("--tempo", type=float, default=1.0)
    ap.add_argument("--lead", type=float, default=0.35, help="silence before the first word")
    ap.add_argument("--gap", type=float, default=0.14, help="silence between clips")
    ap.add_argument("--pause", type=float, default=0.24, help="max internal pause")
    ap.add_argument("--total", type=float, default=30.0, help="pad track to this length")
    a = ap.parse_args()

    d = Path(a.dir)
    clips = sorted(p for p in d.glob("*.wav") if re.match(r"\d\d-", p.name))
    out = [np.zeros(int(SR * a.lead), np.float32)]
    t = a.lead
    timings = []
    for i, p in enumerate(clips):
        x = load(p, a.tempo)
        segs = speech_segments(x)
        clip_start = t
        spans = []
        for j, (s, e) in enumerate(segs):
            if j:
                pause = min(a.pause, s - segs[j - 1][1])
                out.append(np.zeros(int(SR * pause), np.float32)); t += pause
            chunk = x[int(s * SR): int(e * SR)]
            spans.append([round(t, 3), round(t + len(chunk) / SR, 3)])
            out.append(chunk); t += len(chunk) / SR
        timings.append({"clip": p.name, "start": round(clip_start, 3), "end": round(t, 3), "speech": spans})
        if i < len(clips) - 1:
            out.append(np.zeros(int(SR * a.gap), np.float32)); t += a.gap
    if t < a.total:
        out.append(np.zeros(int(SR * (a.total - t)), np.float32))
    y = np.concatenate(out)
    y = y / max(1e-6, float(np.abs(y).max())) * 0.89  # peak ≈ -1 dBFS
    with wave.open(str(d / "voiceover.wav"), "wb") as w:
        w.setnchannels(1); w.setsampwidth(2); w.setframerate(SR)
        w.writeframes((y * 32767).astype("<i2").tobytes())
    (d / "timings.json").write_text(json.dumps({"speech_end": round(t, 3), "clips": timings}, indent=2))
    for c in timings:
        print(f'{c["clip"]:<18} {c["start"]:6.2f} → {c["end"]:6.2f}')
    print(f"speech ends at {t:.2f}s; track length {len(y) / SR:.2f}s")


if __name__ == "__main__":
    main()
