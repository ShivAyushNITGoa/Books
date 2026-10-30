# RISE OF LEGEND — production folder

Original Indian mythic-tech animated short. **2:00, 10 fps, 1,200 frames, 1920×1080.**
This folder is the single home for everything: story, board, animation, edit, audio, build, delivery.

> Pitch: [`CONCEPT.md`](CONCEPT.md) · Plan: [`PRODUCTION_PLAN.md`](PRODUCTION_PLAN.md) ·
> Timing animatic: [`08_delivery/animatic_slates.mp4`](08_delivery/animatic_slates.mp4)

---

## Status

| Stage | Artifact | State |
|---|---|---|
| Concept & legal distancing | `CONCEPT.md`, `00_admin/legal_checklist.md` | ✅ drafted |
| Script & VO | `01_script/` | ✅ Hindi + English, SRT timed |
| Timeline (32 shots) | `timeline.json` | ✅ locked, 1,200 frames |
| Timing animatic | `08_delivery/animatic_slates.mp4` | ✅ built, QC PASS |
| Storyboard | `02_storyboard/` | ⬜ empty (32 boards needed) |
| Animation | `04_animation/` | ⬜ empty |
| VO record | `06_audio/vo/` | ⬜ not recorded |
| Final delivery | `08_delivery/` | ⬜ waiting on art + VO |

---

## Folder map

```
rise_of_legend/
├── CONCEPT.md                  pitch: logline, cast, world, legal notes
├── PRODUCTION_PLAN.md          AUTHORITATIVE editing + build plan (read this)
├── timeline.json               single source of truth: 12 beats, 32 shots, 1,200 frames
├── 00_admin/                   legal checklist, clearances, credits
├── 01_script/                  VO script (hi/en) + vo_ep01.srt
├── 02_storyboard/              one board per shot: S01.png … S32.png
├── 03_animatic/                scratch animatic notes + review cuts
├── 04_animation/
│   ├── shots/                  THE delivery point: S01.png or S01.mp4 per shot
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

# 1. validate the timeline / see every shot and frame
python3 rise_of_legend/07_build/assemble_10fps.py --dry-run

# 2. rebuild the timing animatic from slates (no art needed)
python3 rise_of_legend/07_build/assemble_10fps.py --slates --build

# 3. once shot art exists in 04_animation/shots/, build the real animatic
python3 rise_of_legend/07_build/assemble_10fps.py --build

# 4. QC any file
python3 rise_of_legend/07_build/assemble_10fps.py --verify rise_of_legend/08_delivery/animatic_slates.mp4
```

Nothing in this folder touches the Talk2Society 24 fps pipeline (`build_video.py`,
`editing/`); it is a separate 10 fps toolchain on purpose (see `PRODUCTION_PLAN.md` §11).

## Hard rules

1. **`timeline.json` is the edit.** Every shot has a fixed frame count; the total is exactly 1,200.
2. **One shot = one asset = one frame count.** No retiming, no loops, no "we'll fix it in the edit".
3. **10 fps is the look, not a limitation** — animate on 3s, hold poses, cut hard (see plan §4).
4. **Original IP only** — no source-show names, likeness, costume, catchphrases or music.
5. Delivery is silent-safe: the cut must read with no audio at all.
