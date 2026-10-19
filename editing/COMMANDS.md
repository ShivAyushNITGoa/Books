# COMMANDS — copy-paste production sheet

Run everything from the **project root** (the folder that contains
`tvN.srt`, `audio/`, `images_tvN/`, and this `editing/` folder). Replace
`tvN` with your episode name. `CH` = comma cue-start numbers for chapters
(example TV8: `14,69,100,117,143,165,189,215,239,291`).

## 0. Dependencies (after any sandbox wipe)

```bash
pip install -q --break-system-packages pillow imageio-ffmpeg numpy
```

## 1. Cue classes (intelligence sidecar)

```bash
python3 editing/gen_cue_classes.py --srt tvN.srt --vo audio/tvN_master.mp3 \
  --manifest prompts/manifest.json --labels tvN_label_map.txt \
  --chapters "CH" --out prompts/cue_classes.json
```

## 2. Build — dry-run, smoke, full (R2: full build is ONE run)

```bash
# plan only: frame table + mapping check
python3 editing/build_video.py --dry-run --srt tvN.srt --name tvN \
  --images images_tvN --cue-class prompts/cue_classes.json \
  --chapter-cues "CH" --style pro --res 2560x1440

# 12-cue smoke (renders + muxes output/tvN_test_12.mp4)
python3 editing/build_video.py --limit 12 --res 2560x1440 --no-captions \
  --crf 24 --srt tvN.srt --name tvN --images images_tvN \
  --cue-class prompts/cue_classes.json --chapter-cues "CH" --style pro

# FULL build -> output/tvN_final.mp4  (total = max(SRT span, VO) + 2s)
python3 editing/build_video.py --res 2560x1440 --no-captions --crf 24 \
  --srt tvN.srt --name tvN --images images_tvN \
  --cue-class prompts/cue_classes.json --chapter-cues "CH" --style pro
```

Styles: `--style pro` (filmic, default) | `art` (dreamy) | `doc` (clean) |
`classic` (neutral Ken Burns). Segment cache `output/segments_{style}_proedit1/`
— **re-run the same command to resume** after any interruption.

## 3. Split into few, integration-ready parts (R5: <100 MB each)

```bash
# bounds = 0.0, <chapter times>, <total seconds> — exact seams, audio
# unaffected; a part over the cap is auto re-encoded at +2 CRF
python3 editing/split_parts.py --name tvN \
  --bounds "0.0,T1,T2,T3,TOTAL"

cp output/tvN_2k_part*.mp4 .
python3 editing/verify_parts.py --ep tvN --cues 330   # expect OVERALL PASS

# integrate the parts back into one file (frame-exact, no re-encode):
printf "file '%s'\n" tvN_2k_part*.mp4 > list.txt
ffmpeg -f concat -safe 0 -i list.txt -c copy tvN_full_joined.mp4
```

## 4. Frame QA (ONE ffmpeg call per frame — multi-output writes identical frames)

```bash
FF=$(python3 -c "import imageio_ffmpeg;print(imageio_ffmpeg.get_ffmpeg_exe())")
$FF -y -ss 0.4  -i tvN_2k_part1.mp4 -frames:v 1 /tmp/qa1.jpg
$FF -y -ss 10.0 -i tvN_2k_part2.mp4 -frames:v 1 /tmp/qa2.jpg
# ...at least 2 frames per part: chapter opening + longest part midpoints
```

## 5. What the build prints (read it)

- `Clips/total` line → total must equal max(SRT span, VO) + 2 s.
- **Pacing report** (class → cuts/fades/cached) → mostly cuts is healthy;
  fades should cluster on soft/host only.
- **Same-shot warnings** (perceptual hash) → check flagged pairs for
  accidental repeated labels.

## 6. Failure recovery

```bash
# wipe recovery (back up modified tracked files to ~/ first!)
git fetch -q origin && git reset --hard -q origin/arena/927251ad-books
pip install -q --break-system-packages pillow imageio-ffmpeg numpy
# interrupted build -> just re-run the identical build command (cache resume)
```
