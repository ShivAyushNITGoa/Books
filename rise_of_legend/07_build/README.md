# 07_build — the 10 fps assembler

`assemble_10fps.py` turns `../timeline.json` into a frame-exact 10 fps cut. It is deliberately
separate from the repo's 24 fps Talk2Society builder (`build_video.py`).

## Install

```bash
pip install -q --break-system-packages pillow imageio-ffmpeg
# ffmpeg is taken from FFMPEG_BIN, then PATH, then imageio-ffmpeg. No ffprobe needed.
```

## Commands

```bash
# validate timeline, list shots, report missing art
python3 rise_of_legend/07_build/assemble_10fps.py --dry-run

# slate timing pass (no art required) -> 08_delivery/animatic_slates.mp4
python3 rise_of_legend/07_build/assemble_10fps.py --slates --build

# first 6 shots only (~6 s render) -> 08_delivery/animatic_slates_first6.mp4
python3 rise_of_legend/07_build/assemble_10fps.py --slates --build --limit 6

# the real build from 04_animation/shots/ -> 08_delivery/ep01_animatic.mp4
python3 rise_of_legend/07_build/assemble_10fps.py --build

# QC any file
python3 rise_of_legend/07_build/assemble_10fps.py --verify rise_of_legend/08_delivery/animatic_slates.mp4
```

## What it does, step by step

1. **Validates** `timeline.json`: shot ids unique, frames > 0, shots sum to `total_frames`, beats sum
   to `total_frames`. Any mismatch = hard exit, nothing is rendered.
2. **Resolves one asset per shot**: `04_animation/shots/S01.mp4` → `S01.png` → missing.
   `kind: "color"` renders black; `kind: "title"` renders the title card.
3. **Renders each shot with `-frames:v <exact count>`**, so the cut cannot drift by a frame.
   - stills: stepped Ken Burns every 5 frames, ~3% total (`camera: push|pull`), otherwise locked off
   - clips: conformed to 10 fps, trimmed, or last-frame-held to the exact count
4. **Concatenates with `-c copy`** — no re-encode, no generation loss between shots.
5. **Muxes `06_audio/vo/vo_ep01.wav`** if it exists (`-t` the exact duration), else ships silent.
6. **Runs QC** and prints PASS/FAIL for resolution, fps, duration, frame count and audio presence.

## Why stepped camera moves

At 10 fps a smooth zoom reads as judder because there are only 10 samples per second. The builder
quantises the move: one position per 5 frames (2 held drawings/sec), total ≤ 3% per shot. If a shot
needs more movement than that, animate it — don't zoom it.

## Troubleshooting

| Symptom | Cause / fix |
|---|---|
| `timeline mismatch: shots sum to X` | a `frames` value was edited; fix the shot, not the total |
| `MISSING ARTWORK` | art not delivered; use `--slates`, or check the file name = shot id |
| QC `FAIL fps` | a clip was exported at 24/30 fps and `fps=` was bypassed — re-render, never force `-r` |
| QC `FAIL frames` | a shot clip is shorter than its window and tpad was disabled — use the builder's own path |
| Output has no audio | `06_audio/vo/vo_ep01.wav` missing, or `--no-vo` was passed |
| Render feels too fast/slow | the timeline is the truth: change `frames`, re-run `--dry-run`, then rebuild |

## Extending

- **Per-shot re-render** (later): add `--only S05` — the tool renders all 32 shots in ~30 s today.
- **Vertical cut**: pass `--timeline timeline_vertical.json`.
- **Subtitles**: burn with the ffmpeg recipe in `../05_edit/README.md`; the builder never burns text.
