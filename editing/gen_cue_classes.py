#!/usr/bin/env python3
"""Generate a per-cue edit-class sidecar for build_video.py.

Reads the episode SRT + the master VO + (optionally) the image-prompt
manifest, and tags every cue with the editorial intelligence the builder
needs to edit like a person instead of a slideshow:

  class   : chapter | host | word | soft | punch | story
  mood    : dark | light | neutral          (text-driven grading)
  lit     : bool                            (lamp/window/fire cues -> bloom/flicker)
  energy  : 0..1                            (VO loudness in that cue's window)

Usage (TV8):
  python3 scripts/gen_cue_classes.py --srt tv8.srt --vo audio/tv8_master.mp3 \
      --manifest prompts/manifest.json --labels tv8_label_map.txt \
      --chapters "14,69,100,117,143,165,189,215,239,291" \
      --out prompts/cue_classes.json
"""
import argparse
import array
import json
import re
import subprocess
import sys
from pathlib import Path

ROOT = Path.cwd()  # run from the episode project root (folder with tvN.srt)
sys.path.insert(0, str(ROOT))
from build_video import find_ffmpeg, parse_srt  # noqa: E402

WORD_RE = re.compile(r"single word frame", re.I)
HOST_RE = re.compile(r"\bhost\b|chandradipti", re.I)
LIT_RE = re.compile(
    r"\b(lamp|lantern|light|lit|candle|fire|flame|glow|gleam|dawn|window|"
    r"lamplight|lamp\b|diya|candlelit)", re.I)
DARK_RE = re.compile(
    r"\b(fear|defeat|defeatist|refus|refused|insult|disgrace|criticis|shouting|"
    r"storm|warning|danger|no chance|no praise|not coming|failed|did not run|"
    r"poor|low marks|waste|wasted|excuse|crutch|burden|heavy|dark|slumped|"
    r"lonely|leaking|cracking|obstacle|mistake|doubt|bleak)\b", re.I)
LIGHT_RE = re.compile(
    r"\b(hope|resolve|proud|pride|earned|warm|wisdom|wise|liberated|freedom|"
    r"clarity|clear|confident|steady|growing|growth|trust|trusted|helpful|"
    r"beginning|optimistic|hopeful|courage|gentle strength|kind|calm|composed|"
    r"self-reliance|celebrate|reward|flourish|win)\b", re.I)
PUNCH_RE = re.compile(
    r"\b(punch|slap|crash|shatter|impact|arrow|arrows|lightning|shouting|"
    r"storm|refusal|refused|grinding|frustrated|criticism arrows|"
    r"chain-link|insult|disgrace)\b", re.I)
SOFT_RE = re.compile(
    r"\b(rest|resting|mirror|reflection|quiet|gently|gentle|kindness|patience|"
    r"patient|breath|pause|dawn|twilight|humble|meditat|contemplat|slowly|"
    r"smallness|whisper|silence|still|calm|composed|grateful|wistful|"
    r"receptive|permission|nurtur|warm|solemn|pensive|acceptance)\b", re.I)


def vo_energy(ffmpeg, vo: Path, cues, out_dir: Path):
    """Per-cue RMS loudness of the VO, normalised to 0..1 (p90 = 1)."""
    raw = out_dir / "vo_pcm_s16le_8k.raw"
    if not raw.exists():
        out_dir.mkdir(parents=True, exist_ok=True)
        subprocess.run([ffmpeg, "-y", "-hide_banner", "-loglevel", "error",
                        "-i", str(vo), "-ac", "1", "-ar", "8000",
                        "-f", "s16le", str(raw)], check=True)
    a = array.array("h")
    a.frombytes(raw.read_bytes())
    sr = 8000
    vals = []
    for c in cues:
        i0 = max(0, int(c["start"] * sr))
        i1 = min(len(a), max(i0 + 1, int(c["end"] * sr)))
        win = a[i0:i1]
        rms = (sum(v * v for v in win) / len(win)) ** 0.5 if win else 0.0
        vals.append(rms)
    ordered = sorted(v for v in vals if v > 0)
    p90 = ordered[int(len(ordered) * 0.9)] if ordered else 1.0
    return [min(1.0, v / p90) for v in vals]


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--srt", required=True)
    ap.add_argument("--vo", required=True)
    ap.add_argument("--manifest", default="")
    ap.add_argument("--labels", default="")
    ap.add_argument("--chapters", default="")
    ap.add_argument("--out", required=True)
    args = ap.parse_args()

    cues = parse_srt(ROOT / args.srt)
    ffmpeg = find_ffmpeg()
    energies = vo_energy(ffmpeg, ROOT / args.vo, cues, ROOT / "output")

    # manifest extras: which cues are host plugs / "Single word frame"
    host_cues, word_cues = set(), set()
    if args.manifest and args.labels:
        man = json.loads((ROOT / args.manifest).read_text())
        labs = [ln.strip().split("|")[1] for ln in
                (ROOT / args.labels).read_text().splitlines() if ln.strip()]
        host_cues = set(man.get("host_cues", []))
        for i, lab in enumerate(labs, start=1):
            if WORD_RE.search(man["labels"].get("#" + lab, "")):
                word_cues.add(i)

    chapters = {int(x) for x in args.chapters.split(",") if x.strip()}

    # energy z-scores adapt to the VO's own dynamics
    nz = [e for e in energies if e > 0]
    mean = sum(nz) / max(len(nz), 1)
    var = sum((e - mean) ** 2 for e in nz) / max(len(nz), 1)
    std = var ** 0.5 or 1.0

    out = {}
    for c, e in zip(cues, energies):
        n, text = c["n"], c["text"]
        if n in chapters:
            cls = "chapter"
        elif n in host_cues or HOST_RE.search(text):
            cls = "host"
        elif n in word_cues:
            cls = "word"
        elif PUNCH_RE.search(text) or e > mean + 0.9 * std:
            cls = "punch"
        elif SOFT_RE.search(text) or e < mean - 0.6 * std:
            cls = "soft"
        else:
            cls = "story"
        mood = ("dark" if DARK_RE.search(text) else
                "light" if LIGHT_RE.search(text) else "neutral")
        out[str(n)] = {
            "class": cls,
            "mood": mood,
            "lit": bool(LIT_RE.search(text)),
            "energy": round(e, 3),
        }

    Path(ROOT / args.out).parent.mkdir(parents=True, exist_ok=True)
    Path(ROOT / args.out).write_text(json.dumps(out, indent=1), encoding="utf-8")
    tally = {}
    for v in out.values():
        tally[v["class"]] = tally.get(v["class"], 0) + 1
    print(f"wrote {args.out}: {len(out)} cues  {tally}")


if __name__ == "__main__":
    main()
