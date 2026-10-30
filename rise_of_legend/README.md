# RISE OF LEGEND — production folder

Original Indian mythic-tech animated short. **2:00, 10 fps, 1,200 frames, 1920×1080.**
This folder is the single home for everything: story, board, animation, edit, audio, build, delivery.

> Pitch: [`CONCEPT.md`](CONCEPT.md) · Plan: [`PRODUCTION_PLAN.md`](PRODUCTION_PLAN.md) ·
> Script: [`01_script/script_ep01.md`](01_script/script_ep01.md) ·
> **The film: [`08_delivery/ep01_master.mp4`](08_delivery/ep01_master.mp4)** (art + VO + score) ·
> VO-only cut: [`08_delivery/ep01_animatic.mp4`](08_delivery/ep01_animatic.mp4) ·
> Boards: [`08_delivery/boards_contact_sheet.jpg`](08_delivery/boards_contact_sheet.jpg)

---

## Status

| Stage | Artifact | State |
|---|---|---|
| Concept & legal distancing | `CONCEPT.md`, `00_admin/legal_checklist.md` | ✅ drafted |
| Script & VO | `01_script/script_ep01.md`, `vo_script.md`, `vo_ep01.srt`, `shot_script.csv` | ✅ full 32-shot AV script + timed SRT |
| Timeline (32 shots) | `timeline.json` | ✅ locked, 1,200 frames |
| Timing animatic (slates) | `08_delivery/animatic_slates.mp4` | ✅ guide VO, QC PASS |
| Storyboard art, 30 frames | `04_animation/shots/S01–S30.jpg` | ✅ generated from code — 100% original |
| Board contact sheet | `08_delivery/boards_contact_sheet.jpg` | ✅ 6×5 grid of all 30 frames |
| Animatic with art + VO | `08_delivery/ep01_animatic.mp4` | ✅ 120.0 s, QC PASS |
| Score (generated) | `06_audio/music/score_ep01.wav` | ✅ 120.000 s, original, silent at S25 |
| **The film (master)** | `08_delivery/ep01_master.mp4` | ✅ 120.0 s, −16.6 LUFS, QC PASS |
| Storyboard prompts (alt. route) | `02_storyboard/PROMPTS.md` | ✅ 30 prompts, if you'd rather use a T2I model |
| Animation (motion) | `04_animation/` | ⬜ stills only — no inbetweens yet |
| VO guide (3 voices) | `06_audio/vo/vo_ep01.wav` + `VOICES.md` | ✅ synthetic guide, cue-accurate |
| VO record (human) | `06_audio/vo/` | ⬜ not recorded — replaces the guide |
| Final delivery | `08_delivery/` | ⏳ animatic done; master still needs human VO + grade |

---

## Folder map

```
rise_of_legend/
├── CONCEPT.md                  pitch: logline, cast, world, legal notes
├── PRODUCTION_PLAN.md          AUTHORITATIVE editing + build plan (read this)
├── timeline.json               single source of truth: 12 beats, 32 shots, 1,200 frames
├── 00_admin/                   legal checklist, clearances, credits
├── 01_script/                  script_ep01.md (32-shot AV script), vo_script.md,
│                              vo_ep01.srt, shot_script.csv
├── 02_storyboard/              make_boards.py (draws all 30 boards), PROMPTS.md (T2I route)
├── 03_animatic/                scratch animatic notes + review cuts
├── 04_animation/
│   ├── shots/                  THE delivery point: S01–S30.jpg (board art), S01.mp4 optional
│   ├── characters/             turnarounds, expression sheets, mouth charts
│   ├── backgrounds/            BG plates (1920×1080, 9:16-safe margins)
│   ├── fx/                     the five element VFX rigs
│   └── cycles/                 reusable breathing / walk / cape / shawl cycles
├── 05_edit/                    conform notes, EDL, subtitle burn
├── 06_audio/
│   ├── vo/                     vo_ep01.wav (48 kHz, mono)
│   ├── music/                  original score stems
│   └── sfx/                    hits, whooshes, ambience
├── 07_build/
│   ├── assemble_10fps.py       the builder (timeline → 10 fps master)
│   └── README.md               commands + ffmpeg recipes
└── 08_delivery/                animatic + final masters + vertical cut
```

## Quick start

```bash
pip install -q --break-system-packages pillow imageio-ffmpeg      # once

# 0. (re)draw the 30 boards — pure code, no external art
python3 rise_of_legend/02_storyboard/make_boards.py
python3 rise_of_legend/02_storyboard/make_boards.py --only S01 S22     # preview a few

# 1. validate the timeline / see every shot and frame
python3 rise_of_legend/07_build/assemble_10fps.py --dry-run

# 2. rebuild the timing animatic from slates (no art needed)
python3 rise_of_legend/07_build/assemble_10fps.py --slates --build

# 3. build the animatic from the boards in 04_animation/shots/
python3 rise_of_legend/07_build/assemble_10fps.py --build --crf 23

# 3b. build the film: boards + VO + score, faded, normalised to -16 LUFS
python3 rise_of_legend/06_audio/music/make_score.py
python3 rise_of_legend/07_build/assemble_10fps.py --build --crf 25 --fade \
  --music rise_of_legend/06_audio/music/score_ep01.wav --lufs -16 --name ep01_master

# 4. QC any file
python3 rise_of_legend/07_build/assemble_10fps.py --verify rise_of_legend/08_delivery/ep01_animatic.mp4
```

Nothing in this folder touches the Talk2Society 24 fps pipeline (`build_video.py`,
`editing/`); it is a separate 10 fps toolchain on purpose (see `PRODUCTION_PLAN.md` §11).

## Hard rules

1. **`timeline.json` is the edit.** Every shot has a fixed frame count; the total is exactly 1,200.
2. **One shot = one asset = one frame count.** No retiming, no loops, no "we'll fix it in the edit".
3. **10 fps is the look, not a limitation** — animate on 3s, hold poses, cut hard (see plan §4).
4. **Original IP only** — no source-show names, likeness, costume, catchphrases or music.
6. **Sound is synthesised too.** The score bed is generated by `06_audio/music/make_score.py`; the
   guide VO uses stock synthetic voices. No library music, no samples, no theme.
7. **Art is drawn by code.** `02_storyboard/make_boards.py` builds every frame from flat shapes
   and palette values — no stock images, no third-party artwork, no fonts, no traced photos
   (see [`04_animation/PROVENANCE.md`](04_animation/PROVENANCE.md)).
5. Delivery is silent-safe: the cut must read with no audio at all.
