# TV6 — 2K video (5 parts)

Full story video, **2560×1440 (QHD) 24 fps**, h264 + AAC stereo, **no captions**.
All 495 scene images were AI-superresolved 2× (Real-ESRGAN anime-6B:
1376×768 → 2752×1536) before rendering, so the 2K frames carry real detail.

## Parts (watch in order)

| File | Length | Size | Covers |
|---|---|---|---|
| `tv6_2k_part1.mp4` | 8:21 | 87.5 MB | VO chapters 1–2 |
| `tv6_2k_part2.mp4` | 5:35 | 62.8 MB | VO chapter 3 |
| `tv6_2k_part3.mp4` | 5:41 | 59.3 MB | VO chapter 4 |
| `tv6_2k_part4.mp4` | 3:59 | 43.3 MB | VO chapter 5 |
| `tv6_2k_part5.mp4` | 8:12 | 70.0 MB | VO chapter 6 + final image hold (2 s tail) |

Total 31:40. Each part is under GitHub's 100 MB per-file limit; they split
exactly at the VO chapter boundaries (each part fades to black at the end,
the next fades in).

## Guarantees

- 482 SRT cues → 482 segments → 482 distinct images; one image per cue
  window, never reused, drift ≤ 1 frame per boundary.
- Audio is the original 6-part master voiceover (`audio/tv6_master.mp3`),
  sliced per part with no re-recording.
- The last SRT cue ends ~98 s before the VO does; the final image is held
  over that narration plus a 2 s silent tail.

## Rebuilding

```bash
# 1) upscale the art (needs torch + Real-ESRGAN, ~2.6 h on 2 cores)
#    -> images_up4x/ (gitignored)
# 2) render all 482 segments + silent video + full VO mux (output/, gitignored)
python3 build_video.py --res 2560x1440 --no-captions --crf 24 --images images_up4x
# 3) split into the 5 parts + mux each part's VO slice
python3 scripts/split_parts.py
# 4) copy output/tv6_2k_part*.mp4 to the repo root
```

Other options: `--res 1280x720` (720p), `--crf 26` (smaller), captions
burned back in by dropping `--no-captions` (uses `tv6.srt` +
`fonts/NotoSansDevanagari.ttf`).

The previous 720p single-file version is still in git history (commit
`7b24b5e`, file `tv6_final.mp4`) if ever needed.
