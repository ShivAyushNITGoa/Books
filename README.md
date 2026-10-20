# TV7 — Talk2Society production repo

2K documentary build for episode **TV7** ("नेताजी सुभाष चंद्र बोस" — Subhas Chandra Bose).
202 scene images (AI, V6 style) + provided voice-over, assembled into a 1920×1080 24fps film
with Ken Burns motion, xfade transitions and a subtitle sidecar (no burned-in captions).

## Watch order (the files at repo root)

| File | Content | Duration | Size |
|------|---------|----------|------|
| `tv7_2k_part1.mp4` | Episode part 1 (cues 1–100) | 321.85s | 58.2 MB |
| `tv7_2k_part2.mp4` | Episode part 2 (cues 101–202) | 331.83s | 60.0 MB |

Play `part1` then `part2`, back to back. Parts are h264 1920×1080 24fps + AAC 48kHz stereo.
Each part is <100MB (Git LFS is not used). Subtitles: `tv7.srt` sidecar.

## Rebuild from scratch

```bash
# Stage 2 — VO master (raw concat, no edits) and part boundary
python3 scripts/build_master_audio.py          # -> audio/tv7_master.mp3 + boundaries

# Stage 5 skipped: build uses the 2768x1536 scene art in images/ directly.

# Stage 6 — assemble (dry-run, smoke, full)
python3 build_video.py --dry-run --srt tv7.srt --name tv7
python3 build_video.py --limit 12 --res 1920x1080 --srt tv7.srt --name tv7   # smoke
python3 build_video.py --res 1920x1080 --no-captions --crf 24 \
        --srt tv7.srt --name tv7                                             # full (from images/)

# Stage 7 — parts sized for git (bounds = VO chapter boundaries)
python3 scripts/split_parts.py --srt tv7.srt --name tv7 --bounds "0,317.23,651.82"

# Acceptance
python3 scripts/verify_parts.py
```

## Episode facts

- SRT: 202 cues, span 649.21s (`tv7.srt`)
- VO: provided "TV7 P1.mp3" + "TV7 P2.mp3", raw-concatenated = 649.82s (Path A; no edits)
- Build: max(SRT, VO) + 2s tail = 651.82s; boundary drift ≤1 frame
- Images: 202, one per cue, label-named (`#0-00.jpg` … `#10-47.jpg`), 2768×1536 (used as-is; no upscale step)
- Transitions: 0.2s xfade; Ken Burns 4-pattern cycle, 10% zoom; no captions burned in (R6)

---

# Talk2Society — Episode 8 (TV8)

Final look = TV7 language (Ken Burns + gentle crossfades, clean picture),
built with `build_tv7plus.py` — see `editing/TV8_RUNBOOK.md` §5.

## Build (TV8, TV7-plus)

```bash
python3 build_tv7plus.py --dry-run --srt tv8.srt --name tv8 --images images_tv8 \
        --cue-class prompts/cue_classes.json
bash run_tv7plus_full.sh    # 17 packs of 20 cues -> assemble, ~60 min (4GB-safe)

# Stage 6 — 3 delivery parts (exact master cuts, CRF 24, 97MB cap)
python3 scripts/split_parts.py --name tv8 --bounds "0,369.93,785.75,1171.74"
cp -f output/tv8_2k_part*.mp4 .

# Acceptance
python3 scripts/verify_parts.py --ep tv8 --cues 330
```

## Episode facts (TV8)

- SRT: 330 cues, span 00:00:00,370–00:19:29,490 (`tv8.srt`)
- VO: provided "video 8 full.mp3", raw copy = 1169.74s (Path A; no edits)
- Build: max(SRT, VO) + 2s tail = 1171.74s; 330 clips, 1:1 cue:clip
- Images: 330 scenes + #Host plate, label-named (`#0-00.jpg` … `#19-28.jpg`), no upscale step
- Style: TV7 crossfade Ken Burns (eased 6-pattern motion, subject anchors,
  varied 0.22–0.84s fade rhythm, whisper-ducked music, light grade + vignette)
- Parts: `tv8_2k_part1.mp4` … `tv8_2k_part3.mp4` (369.96s / 415.83s / 386.00s;
  93.7 / 81.4 / 78.2 MB), seams abut, concat stream-copy rejoins the master
- All parts 1920×1080 24fps h264+aac 48kHz, each <100MB, no LFS; no captions burned in (R6)

## Pro editor (kb proedit1) — humanistic motion & transitions

`build_video.py --style pro|art|doc|classic` plus `--cue-class prompts/cue_classes.json`
(from `scripts/gen_cue_classes.py`): cue classes (chapter/host/word/soft/punch/story),
text-driven mood, per-cue VO energy, lamp/lit tags. Camera: eased 6-pattern Ken Burns
with handheld wobble + breathing, saliency-anchored framing, motion-continuity pan runs,
intra-cue punch-ins/whips. Transitions: hard cut / warm dip / soft fade vocabulary,
chapter & open/close black beats with light-leak pulses, paint-settle focus. Grade:
emotional colour per cue, day→night drift, bloom on lit cues, lamp flicker, exposure
settle, chromatic fringe, animated grain, class vignette, living-paint light sweep.
QC: same-shot duplicate warnings + pacing report. Timing stays R3-exact (all effects
in-segment), VO stays Path A raw, no burned captions.

## TV8 — professional rebuild (proedit + motion graphics) — 2026-10-20

Full re-edit of TV8 with the motion-graphics builder (`build_video.py
--style pro` + `--chapter-titles`): chapter title lockups (Noto Sans
Devanagari, TALK2SOCIETY kicker), kinetic word type on word cues,
feathered warm light streaks at chapter openings, 2.5D parallax depth on
hero cues, VO-stress-timed punch-ins, film print curve + luma-keyed
halation + deband + 180-degree shutter cadence. Delivery is now **3 parts
at 1920x1080** (24fps h264 CRF24 + AAC 48kHz, exact-abutting seams,
audio stream-untouched): part1 369.96s/78.3MB, part2 415.83s/89.8MB,
part3 386.00s/84.2MB — `verify_parts --ep tv8 --cues 330` OVERALL PASS.
Integrate: `printf "file '%s'\n" tv8_2k_part*.mp4 > list.txt && ffmpeg -f
concat -safe 0 -i list.txt -c copy tv8_full_joined.mp4`.
