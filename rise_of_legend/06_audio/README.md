# 06_audio — VO, score, sound design

```
06_audio/
├── vo/       vo_ep01.wav   (48 kHz, 24-bit, mono, raw) ← the builder muxes this automatically
├── music/    original score + stems
└── sfx/      hits, whooshes, ambience (+ LICENCES.md)
```

## VO

**A guide track already exists:** `vo/vo_ep01.wav` (120.00 s, 48 kHz mono) with three distinct
synthetic voices — Badi Amma (whisper, lesson, title), Zoya, and Timir. See
[`vo/VOICES.md`](vo/VOICES.md) for the voice map, provenance and rebuild command.
It is a timing/performance guide, **not** the release VO.

- Record the five lines in `01_script/vo_script.md`; total file length 2:00 with silence between lines.
- 48 kHz / 24-bit / mono / raw. No EQ, compression, noise reduction or de-essing.
- Peaks ≤ −6 dBFS, average ≈ −18 dBFS.
- File name fixed: **`vo_ep01.wav`** — the builder looks for exactly this. Overwrite the guide with the
  recorded artist (same name, same 120.00 s, same five cue starts) and rebuild.

## Score

**A bed already exists:** `music/score_ep01.wav` (120.000 s, 48 kHz mono, ≈ −27 dBFS RMS), generated
by [`music/make_score.py`](music/make_score.py) with NumPy — sine drones, filtered noise wind, sub
booms on the five cue anchors, a bowed shimmer and a low pulse. Nothing is sampled or downloaded, so
the score is original by construction and carries no clearance risk.

```bash
python3 rise_of_legend/06_audio/music/make_score.py     # ~9 s to render
```

The script already obeys the two edit rules below: it is **silent for the first 7.9 s** (the whisper)
and **hard-muted for S25** (94.0–97.4 s, the ether-step). The five sub hits land on 2.0 / 38.0 /
60.0 / 104.0 / 117.2 s, the same anchors as the VO cues.

- Original composition only. **No** source-show theme, cover, remix or soundalike.
- Deliver stems: drums / low drone / tonal bed / transition hits, 48 kHz 24-bit WAV.
- Two rules from the edit: **no music under the whisper** (0:00–0:08) and **total silence at S25**
  (ether-step, ~1:34–1:37).

## SFX

- Five element signatures (see `../04_animation/README.md` §element language) must be audible before
  the visual reads — sound sells the power switch.
- Keep `LICENCES.md` listing every third-party file, its licence and its source URL.

## Mix targets

| Item | Target |
|---|---|
| Integrated loudness | −14 LUFS |
| True peak | ≤ −1.5 dBTP |
| Dialogue anchor | −16 LUFS short-term |
| Music under VO | duck to −24 LUFS |
| Output | 48 kHz, stereo, AAC 192 kbps for delivery |

## Naming

`music/score_ep01_v1.wav`, `sfx/fire_palm_impact_01.wav`, `vo/take_03_line2.wav`.
Version numbers in the filename, never "final_final".
