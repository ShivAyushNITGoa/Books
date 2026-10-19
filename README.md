# TV7 — Talk2Society production repo

2K documentary build for episode **TV7** ("नेताजी सुभाष चंद्र बोस" — Subhas Chandra Bose).
202 scene images (AI, V6 style) + provided voice-over, assembled into a 2560×1440 24fps film
with Ken Burns motion, xfade transitions and a subtitle sidecar (no burned-in captions).

## Watch order (the files at repo root)

| File | Content | Duration | Size |
|------|---------|----------|------|
| `tv7_2k_part1.mp4` | Episode part 1 (cues 1–100) | 321.85s | 58.2 MB |
| `tv7_2k_part2.mp4` | Episode part 2 (cues 101–202) | 331.83s | 60.0 MB |

Play `part1` then `part2`, back to back. Parts are h264 2560×1440 24fps + AAC 48kHz stereo.
Each part is <100MB (Git LFS is not used). Subtitles: `tv7.srt` sidecar.

## Rebuild from scratch

```bash
# Stage 2 — VO master (raw concat, no edits) and part boundary
python3 scripts/build_master_audio.py          # -> audio/tv7_master.mp3 + boundaries

# Stage 5 skipped: build uses the 2768x1536 scene art in images/ directly.

# Stage 6 — assemble (dry-run, smoke, full)
python3 build_video.py --dry-run --srt tv7.srt --name tv7
python3 build_video.py --limit 12 --res 2560x1440 --srt tv7.srt --name tv7   # smoke
python3 build_video.py --res 2560x1440 --no-captions --crf 24 \
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

TV8 was rebuilt from the committed SRT, master VO, cue classes, and existing `images_tv8/` artwork. No images or prompts were regenerated.

## Rebuild commands

```bash
# Plan / asset check
python3 editing/build_video.py --dry-run --srt tv8.srt --name tv8 \
  --images images_tv8 --cue-class prompts/cue_classes.json \
  --chapter-cues "14,69,100,117,143,165,189,215,239,291" \
  --style pro --res 2560x1440

# 12-cue smoke test
python3 editing/build_video.py --limit 12 --res 2560x1440 --no-captions \
  --crf 24 --srt tv8.srt --name tv8 --images images_tv8 \
  --cue-class prompts/cue_classes.json \
  --chapter-cues "14,69,100,117,143,165,189,215,239,291" --style pro

# Full 330-cue build -> output/tv8_final.mp4
python3 editing/build_video.py --res 2560x1440 --no-captions --crf 24 \
  --srt tv8.srt --name tv8 --images images_tv8 \
  --cue-class prompts/cue_classes.json \
  --chapter-cues "14,69,100,117,143,165,189,215,239,291" --style pro

# Chapter parts -> copy to repository root, then verify
python3 editing/split_parts.py --srt tv8.srt --name tv8 \
  --vo audio/tv8_master.mp3 \
  --bounds "0.0,50.55,256.57,369.93,450.77,536.07,609.79,689.77,785.75,861.03,1015.61,1171.74"
cp output/tv8_2k_part*.mp4 .
python3 editing/verify_parts.py --ep tv8 --cues 330
```

## Verified delivery

- **Master:** `output/tv8_final.mp4`, 410,273,039 bytes; planned timeline 1171.74 s, mux container reports 1171.83 s (19:31.83). The raw VO is 1169.74 s, with the specified 2 s video tail.
- **Edit:** 330 SRT cues mapped to 330 distinct committed cue images; proedit1 camera/motion, grade, and transitions; no burned captions.
- **Parts:** 11 files, 2560×1440 at 24 fps, H.264 + AAC 48 kHz stereo; every part is below 100 MB and no LFS is used. `verify_parts.py` reported `OVERALL: PASS` (330 cues, summed duration 1178.77 s including accepted seam rounding).
- **Part sizes / durations:**

| Part | Duration | Size |
|---|---:|---:|
| 1 | 51.50 s | 17.9 MB |
| 2 | 206.02 s | 70.4 MB |
| 3 | 113.36 s | 39.0 MB |
| 4 | 80.84 s | 26.9 MB |
| 5 | 85.30 s | 29.3 MB |
| 6 | 73.72 s | 25.6 MB |
| 7 | 79.98 s | 29.4 MB |
| 8 | 95.98 s | 34.6 MB |
| 9 | 75.28 s | 28.1 MB |
| 10 | 154.58 s | 56.5 MB |
| 11 | 162.21 s | 52.1 MB |

Frame QA extracted two frames from each part (22 total); all 22 frame hashes were distinct and the frames were visually checked. A few of the original committed illustrations contain integrated speech-bubble/diagram lettering; no subtitle track was burned into the video.

## Pro editor (proedit1)

`editing/build_video.py --style pro|art|doc|classic` uses `prompts/cue_classes.json` for chapter/host/word/soft/punch/story classes, text-driven mood, per-cue VO energy, and lamp/lit tags. The pro style applies eased Ken Burns motion, saliency-aware framing, motion continuity, within-cue punch-ins, class-driven cuts/dips/fades, emotional grade, day-to-night drift, bloom/flicker, film grain, vignette, and a light sweep. Voiceover remains Path A; no music, ambience, or loudness processing is added.
