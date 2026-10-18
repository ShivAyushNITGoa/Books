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
