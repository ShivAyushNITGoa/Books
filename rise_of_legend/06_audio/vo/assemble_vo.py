#!/usr/bin/env python3
"""
Build the 2:00 guide VO track for Rise of Legend Ep. 1
=====================================================
Takes the five per-line recordings in `lines/`, trims the lead-in silence so each line
lands on its cue frame, evens the dialogue level to -18 LUFS, places every line at its
exact timecode, and writes `vo_ep01.wav` (120.0 s, 48 kHz mono) — the file
`07_build/assemble_10fps.py` muxes automatically.

Usage:
  python3 rise_of_legend/06_audio/vo/assemble_vo.py

Cue table is the same one used by the script/SRT:
  1  0:02.0  whisper (Badi Amma)   2  0:38.0  Zoya
  3  1:00.0  Badi Amma             4  1:44.0  Timir
  5  1:57.2  title
"""
import json
import re
import subprocess
import sys
import tempfile
from pathlib import Path

HERE = Path(__file__).resolve().parent
FF = None

# name, start_ms, window_s, atempo
CUES = [
    ("vo01_whisper", 2_000,  4.5, 1.00),
    ("vo02_zoya",   38_000,  2.0, 1.00),
    ("vo03_amma",   60_000,  4.0, 1.00),
    ("vo04_timir", 104_000,  3.5, 1.10),
    ("vo05_title", 117_200,  2.6, 1.00),
]
TOTAL = 120.0


def ffmpeg() -> str:
    import shutil
    hit = shutil.which("ffmpeg")
    if hit:
        return hit
    import imageio_ffmpeg
    return imageio_ffmpeg.get_ffmpeg_exe()


def duration(path: Path) -> float:
    err = subprocess.run([FF, "-hide_banner", "-i", str(path)],
                         capture_output=True, text=True).stderr
    m = re.search(r"Duration: (\d+):(\d+):(\d+\.\d+)", err)
    return int(m.group(1)) * 3600 + int(m.group(2)) * 60 + float(m.group(3))


def lufs(path: Path) -> float:
    r = subprocess.run([FF, "-hide_banner", "-i", str(path), "-af",
                        "loudnorm=I=-18:TP=-2:LRA=11:print_format=json",
                        "-f", "null", "-"], capture_output=True, text=True)
    stats = json.loads(r.stderr[r.stderr.rindex("{"):r.stderr.rindex("}") + 1])
    return float(stats["input_i"])


def prep(src: Path, dst: Path, tempo: float) -> float:
    """Trim lead-in, conform to 48 kHz mono, apply tempo. Returns the new duration."""
    chain = ("aresample=48000,aformat=sample_fmts=fltp:channel_layouts=mono,"
             "silenceremove=start_periods=1:start_threshold=-45dB:start_silence=0.05,"
             "asetpts=PTS-STARTPTS")
    if tempo != 1.0:
        chain += f",atempo={tempo:.3f}"
    subprocess.run([FF, "-y", "-hide_banner", "-loglevel", "error", "-i", str(src),
                    "-af", chain, "-ar", "48000", "-ac", "1",
                    "-c:a", "pcm_s16le", str(dst)], check=True)
    return duration(dst)


def main() -> int:
    global FF
    FF = ffmpeg()
    tmp = Path(tempfile.mkdtemp(prefix="t2s_vo_"))
    inputs, filters, trimmed = [], [], []

    print(f"{'line':<14}{'dur':>7}{'window':>8}{'tempo':>7}{'LUFS':>8}{'gain':>7}")
    for i, (name, at_ms, window, tempo) in enumerate(CUES):
        src = HERE / "lines" / f"{name}.wav"
        if not src.exists():
            sys.exit(f"missing line file: {src}")
        dst = tmp / f"{name}.wav"
        secs = prep(src, dst, tempo)
        if secs > window + 0.05:
            sys.exit(f"{name}: {secs:.2f}s does not fit its {window}s window — "
                     f"raise atempo or re-record")
        level = lufs(dst)
        gain = max(-12.0, min(12.0, -18.0 - level))
        print(f"{name:<14}{secs:>7.2f}{window:>8.2f}{tempo:>7.2f}{level:>8.1f}{gain:>+7.1f}")
        filters.append(f"[{i}:a]volume={gain:.2f}dB,adelay={at_ms}:all=1[a{i}]")
        inputs += ["-i", str(dst)]
        trimmed.append(dst)

    graph = (";".join(filters) + ";"
             + "".join(f"[a{i}]" for i in range(len(CUES)))
             + f"amix=inputs={len(CUES)}:normalize=0:duration=longest,"
               f"apad=whole_dur={TOTAL},atrim=0:{TOTAL},asetpts=N/SR/TB[a]")

    out = HERE / "vo_ep01.wav"
    subprocess.run([FF, "-y", "-hide_banner", "-loglevel", "error", *inputs,
                    "-filter_complex", graph, "-map", "[a]",
                    "-ar", "48000", "-ac", "1", "-c:a", "pcm_s16le", str(out)],
                   check=True)
    print(f"\nwrote {out.relative_to(HERE)}  {out.stat().st_size / 1e6:.1f} MB  "
          f"{duration(out):.2f}s  {lufs(out):.1f} LUFS")
    print("cue check (silencedetect speech onsets):")
    err = subprocess.run([FF, "-hide_banner", "-i", str(out), "-af",
                          "silencedetect=n=-38dB:d=0.30", "-f", "null", "-"],
                         capture_output=True, text=True).stderr
    ends = [float(x) for x in re.findall(r"silence_end: ([\d.]+)", err)]
    want = [c[1] / 1000 for c in CUES]
    hits = []
    for w in want:
        near = min(ends, key=lambda e: abs(e - w))
        hits.append(near)
    for w, h in zip(want, hits):
        print(f"  cue {w:6.2f}s -> speech {h:6.2f}s  (drift {h - w:+.2f}s)")
    return 0


if __name__ == "__main__":
    sys.exit(main())
