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

Same pipeline as TV7 with `--srt tv8.srt --name tv8 --images images_tv8` at every build call.

## Stage 5–7 (TV8)

```bash
python3 build_video.py --dry-run --srt tv8.srt --name tv8 --images images_tv8
python3 build_video.py --limit 12 --res 1920x1080 --srt tv8.srt --name tv8 --images images_tv8   # smoke
python3 build_video.py --res 1920x1080 --no-captions --crf 24 \
        --srt tv8.srt --name tv8 --images images_tv8                                              # full

# Stage 6 — chapter splits (cue starts 14,69,100,117,143,165,189,215,239,291 -> 11 parts)
python3 scripts/split_parts.py --srt tv8.srt --name tv8 --vo audio/tv8_master.mp3 \
        --bounds "0.0,50.55,256.57,369.93,450.77,536.07,609.79,689.77,785.75,861.03,1015.61,1171.74"

# Acceptance
python3 scripts/verify_parts.py --ep tv8 --cues 330
```

## Episode facts (TV8)

- SRT: 330 cues, span 00:00:00,370–00:19:29,490 (`tv8.srt`)
- VO: provided "video 8 full.mp3", raw copy = 1169.74s (Path A; no edits)
- Build: max(SRT, VO) + 2s tail = 1171.74s; 330 segments, 1:1 cue:segment
- Images: 330 scenes + #Host plate, label-named (`#0-00.jpg` … `#19-28.jpg`), no upscale step
- Parts: `tv8_2k_part1.mp4` … `tv8_2k_part11.mp4` (chapter cuts at cues 14/69/100/117/143/165/189/215/239/291)
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
