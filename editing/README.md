# editing/ — Talk2Society professional video-building kit

Everything needed to produce a full episode in a new chat using this folder
and the episode's source materials. The current visual pipeline uses **video
clips for the opening intro cues**, followed by **still images for every
remaining cue**.

## Per-episode workflow

1. Provide the episode SRT (`tvN.srt`), raw narration audio
   (`audio/tvN_master.mp3`), and identify the intro boundary if it is not
   clear from the SRT structure.
2. Generate one labelled video clip for each consecutive opening/intro cue
   in the SRT. Save clips in `video_clips_tvN/`, using the exact cue labels
   from `tvN_label_map.txt` (for example `0-00.mp4`). No embedded speech,
   music, text, or logos; the builder uses the supplied master VO.
3. Generate still images for every cue after the intro, in packs of 10, and
   save them in `images_tvN/`, again using the exact SRT cue labels. No
   generated text in the art.
4. Generate cue classes, then build the full video with the SRT, raw VO,
   intro clips, still images, effects, and transitions. The builder treats
   the clips as the opening contiguous cue block and images as the rest.
5. Split at chapter boundaries, verify and visually spot-check the parts,
   then commit/push the delivery parts and README to the current branch.

## Contents

| File | What it is |
|---|---|
| `MASTER_PROMPT.md` | Paste-ready production-agent prompt (current mixed-media workflow). |
| `VIDEO_CLIP_PROMPT_FRAMEWORK.md` | Rules for making SRT-aligned intro-video prompts. |
| `EDITING_LANGUAGE.md` | Pro-edit specification: camera, transitions, grade, QC, styles, tuning. |
| `COMMANDS.md` | Copy-paste commands for cue classes, mixed-media build, splitting, and QA. |
| `IMAGE_PROMPT_FRAMEWORK_v7.txt` | SRT-to-scene image prompts for the non-intro cues. |
| `build_video.py` | Mixed-media builder: intro clips + stills, motion, transitions, grade, effects, QC, pacing report. |
| `gen_cue_classes.py` | Cue-class intelligence sidecar generator (class/mood/lit/VO-energy). |
| `split_parts.py` | Splits the master into <100 MB chapter parts. |
| `verify_parts.py` | Automated delivery checks (size, streams, duration, cue frames). |
| `TV8_RUNBOOK.md` | Historical TV8 rebuild instructions for its existing all-image assets. |

Run scripts from the project root (the folder containing the episode SRT,
`audio/`, the media folders, and `editing/`). Dependencies:
`pip install --break-system-packages pillow imageio-ffmpeg numpy` (ffmpeg is
provided by imageio-ffmpeg; no ffprobe required).

## Builder media mapping and timing

- An exact label-matched clip in `--videos` takes precedence over an image
  with the same label. The video cues must form one continuous prefix of the
  SRT; the builder rejects a clip that appears after an image cue.
- Every cue needs exactly one source asset: one intro clip or one still.
  The clip's source audio is discarded. Its picture is trimmed to the cue
  window; if it ends early, its last frame is held to preserve exact timing.
- Still images get the existing camera moves and image treatment. Intro
  clips receive the same cue timing, grade, transitions, and effects, but no
  image-only parallax split or source-resetting punch-in.
- Cue windows remain frame-accurate at 24 fps; VO stays on Path A and is
  muxed separately. No clip's embedded audio is used.

The finished video uses subtle editing: class-paced cuts/dips/fades,
per-cue grading and atmosphere, and opening/closing beats. Styles:
`--style pro|art|doc|classic`.

## Smoke check

```bash
pip install -q --break-system-packages pillow imageio-ffmpeg numpy
python3 editing/build_video.py --dry-run --srt tvN.srt --name tvN \
  --videos video_clips_tvN --images images_tvN --style pro
```
