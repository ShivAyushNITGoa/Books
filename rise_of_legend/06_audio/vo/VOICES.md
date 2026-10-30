# VOICE SHEET — guide track

Three distinct voices for four speakers, because the whisper and the title are **Badi Amma**
off-screen (see `01_script/vo_script.md`).

| Character | Voice | Used for | Register |
|---|---|---|---|
| **Badi Amma** | `voice-00` — mature feminine, warm, unhurried | cue 1 (whisper), cue 3 (lesson), cue 5 (title) | the authority in the film; same person at three distances |
| **Zoya** | `voice-01` — young feminine, bright, quick | cue 2 | urgent, mid-shout, cut off by the pillar |
| **Timir** | `voice-02` — low masculine, flat, compressed | cue 4 | no breath between clauses; never raises his voice |
| Arin | — | — | **silent by design.** He never speaks in episode 1. |

## Files

```
06_audio/vo/
├── lines/
│   ├── vo01_whisper.wav    Badi Amma, off — "जब आख़िरी मोहर टूटेगी…"
│   ├── vo02_zoya.wav       Zoya — "अरिन, भागो!"
│   ├── vo03_amma.wav       Badi Amma — "एक साँस, एक शक्ति, एक चुनाव।"
│   ├── vo04_timir.wav      Timir — "तुमने भीड़ चुनी…"
│   └── vo05_title.wav      Badi Amma, title — "पाँच साँसें। एक रक्षक।"
├── assemble_vo.py          builds the 2:00 track
└── vo_ep01.wav             120.00 s, 48 kHz mono — the file the builder muxes
```

## Timing (verified after assembly)

| Cue | Land | Line | Raw | In track | Window | Level |
|---|---|---|---|---|---|---|
| 1 | 0:02.0 | whisper | 3.49 s | 3.38 s | 4.5 s | ≈ −18 LUFS |
| 2 | 0:38.0 | Zoya | 1.83 s | 1.71 s | 2.0 s | ≈ −18 LUFS |
| 3 | 1:00.0 | Badi Amma | 3.32 s | 3.18 s | 4.0 s | ≈ −18 LUFS |
| 4 | 1:44.0 | Timir | 3.80 s | 3.21 s (atempo 1.10) | 3.5 s | ≈ −18 LUFS |
| 5 | 1:57.2 | title | 2.47 s | 2.35 s | 2.6 s | ≈ −18 LUFS |

Lead-in silence is trimmed to 50 ms so each line starts within **half a frame** of its cue
(measured drift +0.04 to +0.05 s). Timir's take was 9% fast-forwarded to fit his 3.5 s window.

Rebuild any time:

```bash
python3 rise_of_legend/06_audio/vo/assemble_vo.py      # writes vo_ep01.wav
python3 rise_of_legend/07_build/assemble_10fps.py --slates --build   # muxes it
```

## What this track is — and is not

**It is** a timing/performance guide: correct lines, correct speakers, correct cue frames, so the
animatic plays with real voices instead of silence.

**It is not** the final VO. Synthetic voices read flat — they do not whisper, shout, or hold a beat.
For release, replace `vo_ep01.wav` with the recorded artist (same file name, same 120.00 s, same
five cue starts) and rebuild; nothing else changes.

## Provenance

- Generated **2026-10-30** for this project with generic synthesized voices (Arena speech tool).
- **No cloning**: these are stock synthetic voices, not models of any real actor or person, and no
  source-show performer's voice was imitated.
- Do not present the guide as a human performance, and do not ship it as the final mix without
  checking the platform's synthetic-media disclosure rules.
