# editing/ — Talk2Society professional video-building kit

Everything needed to produce a full episode video in **any new chat or
conversation**, using only this folder + the episode's raw materials
(VO audio, SRT). No session memory required.

## Start here in a new chat

1. Paste **`MASTER_PROMPT.md`** into the conversation — it is a complete
   production prompt with all rules (R1–R6) and the full pipeline.
2. Give the AI: the episode SRT (`tvN.srt`), the raw VO
   (`audio/tvN_master.mp3`), and a chapter cue-start list (or ask it to
   derive one).
3. It will generate image prompts → images (packs of 10) → cue classes →
   a professional edit (`--style pro`) → verified YouTube parts.

## Contents

| File | What it is |
|---|---|
| `MASTER_PROMPT.md` | Paste-ready agent prompt for new chats (rules + pipeline). |
| `EDITING_LANGUAGE.md` | Full proedit spec: camera, transitions, grade, QC, styles, tuning. |
| `COMMANDS.md` | Copy-paste command sheet for every stage. |
| `IMAGE_PROMPT_FRAMEWORK_v7.txt` | The image-prompt master prompt (SRT → scene prompts, Talk2Society style/identity rules). |
| `build_video.py` | The professional builder (proedit1): motion, transitions, grade, FX, punch-ins, QC, pacing report. |
| `gen_cue_classes.py` | Cue-class intelligence sidecar generator (class/mood/lit/VO-energy). |
| `split_parts.py` | Splits the master into <100 MB chapter parts. |
| `verify_parts.py` | Automated delivery checks (size, streams, duration, cue frames). |

All scripts are **self-contained**: they use the current working directory
as the project root, so run them as `python3 editing/<script>.py …` from
the folder that holds `tvN.srt`. Dependencies: `pip install
--break-system-packages pillow imageio-ffmpeg numpy` (ffmpeg comes with
imageio-ffmpeg; no ffprobe needed).

## What the builder produces

A filmic, human-edited 2560×1440 24fps video from 1 cue = 1 image = 1
duration (strict R3 timing): eased hand-held camera moves, subject-aware
framing, class-paced cuts/dips/fades with chapter beats, intra-cue
punch-ins, emotional colour grading with day→night drift, bloom + lamp
flicker on lit scenes, film grain, vignette, living-paint light sweeps —
all chosen from the cue's class, mood, and real VO energy. Four looks:
`--style pro|art|doc|classic`.

## Quick smoke check that the kit works

```bash
pip install -q --break-system-packages pillow imageio-ffmpeg numpy
python3 editing/build_video.py --dry-run --srt tvN.srt --name tvN \
  --images imagesTvN --style pro
```
