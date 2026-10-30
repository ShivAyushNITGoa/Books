# COMMANDS — mixed-media production sheet

Run from the project root (the folder containing `tvN.srt`, `audio/`,
`video_clips_tvN/`, `images_tvN/`, and `editing/`). Replace `tvN` with the
episode slug. `CH` is the comma-separated cue-start list for chapters.

## Media handoff

- `video_clips_tvN/`: one silent intro video per consecutive opening SRT
  cue, named with the exact cue label (for example `0-00.mp4`).
- `images_tvN/`: one still for every cue after the intro, using the same
  SRT label scheme (for example `1-32.jpg`).
- Video cues must form one contiguous prefix; clips after a still cue cause
  the builder to fail. If both matching assets exist, the video wins.
- The master VO is loaded from `audio/tvN_master.mp3`; generated clip audio
  is discarded. The SRT controls positioning and cue durations.

## 0. Dependencies (after a sandbox wipe)

```bash
pip install -q --break-system-packages pillow imageio-ffmpeg numpy
```

## 1. Cue classes (intelligence sidecar)

```bash
python3 editing/gen_cue_classes.py --srt tvN.srt --vo audio/tvN_master.mp3 \
  --manifest prompts/manifest.json --labels tvN_label_map.txt \
  --chapters "CH" --out prompts/cue_classes.json
```

## 2. Build — dry-run, smoke, full

```bash
# mapping and timeline check: reports video clips vs still images by cue
python3 editing/build_video.py --dry-run --srt tvN.srt --name tvN \
  --videos video_clips_tvN --images images_tvN \
  --cue-class prompts/cue_classes.json --chapter-cues "CH" \
  --style pro --res 1920x1080

# 12-cue smoke build -> output/tvN_test_12.mp4
python3 editing/build_video.py --limit 12 --res 1920x1080 --no-captions \
  --crf 24 --srt tvN.srt --name tvN \
  --videos video_clips_tvN --images images_tvN \
  --cue-class prompts/cue_classes.json --chapter-cues "CH" --style pro

# FULL build -> output/tvN_final.mp4
python3 editing/build_video.py --res 1920x1080 --no-captions --crf 24 \
  --srt tvN.srt --name tvN \
  --videos video_clips_tvN --images images_tvN \
  --cue-class prompts/cue_classes.json --chapter-cues "CH" --style pro
```

Total duration is `max(SRT span, VO duration) + 2s`. The builder applies the
same 24fps frame budget, grading, and in-cue transitions to both media types.
Video audio is never used; short clips hold their last frame through the end
of their cue. Styles: `pro` (filmic, default) | `art` (dreamy) | `doc`
(clean) | `classic` (neutral Ken Burns). Cache:
`output/segments_{style}_proedit2_mixed/`; rerun the identical build command to resume.

## 3. Split into a few delivery parts

```bash
# bounds = 0.0, <chapter times>, <total seconds>; exact seams, master VO
# unaffected; a part over the cap is auto-re-encoded at +2 CRF
python3 editing/split_parts.py --name tvN \
  --bounds "0.0,T1,T2,T3,TOTAL"

cp output/tvN_2k_part*.mp4 .
python3 editing/verify_parts.py --ep tvN --cues 330   # expect OVERALL PASS

# Rejoin later (frame-exact seams, no re-encode):
printf "file '%s'\n" tvN_2k_part*.mp4 > list.txt
ffmpeg -f concat -safe 0 -i list.txt -c copy tvN_full_joined.mp4
```

## 4. Frame QA

Extract at least two frames per part (chapter opening and midpoint), one
ffmpeg call per frame:

```bash
FF=$(python3 -c "import imageio_ffmpeg;print(imageio_ffmpeg.get_ffmpeg_exe())")
$FF -y -ss 0.4  -i tvN_2k_part1.mp4 -frames:v 1 /tmp/qa1.jpg
$FF -y -ss 10.0 -i tvN_2k_part2.mp4 -frames:v 1 /tmp/qa2.jpg
```

Check that cues are aligned, clips/images appear in the intended order,
source audio is absent, VO is present, and no captions are burned in.

## 5. Read the build report

- `Assets found` must equal the number of cues; video clips must be an
  opening prefix and stills must cover all later cues.
- Total duration must equal `max(SRT span, VO duration) + 2s`.
- Review the pacing report and same-shot warnings; visually spot-check
  transitions at the intro-to-image handoff.

## 6. Failure recovery

```bash
# Before destructive recovery, back up any modified tracked files.
git fetch -q origin && git reset --hard -q origin/arena/927251ad-books
pip install -q --break-system-packages pillow imageio-ffmpeg numpy
# An interrupted build resumes from cached atomic segments when rerun.
```
