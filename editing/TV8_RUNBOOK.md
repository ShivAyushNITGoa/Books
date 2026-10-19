# TV8_RUNBOOK — rebuild episode TV8 in a new chat (safe, deterministic)

> Paste this file (or point your agent at it) in a NEW conversation to
> recreate the TV8 video end-to-end. Every parameter is already filled in.
> All source assets are committed on branch `arena/927251ad-books` — the
> agent must NOT regenerate them.

## Starter message for the new chat (copy-paste)

> Read `editing/TV8_RUNBOOK.md` and execute it exactly. Rebuild the TV8
> video (professional proedit version) from the existing committed assets.
> Do not regenerate images. Follow R1–R6 from `editing/MASTER_PROMPT.md`.

## 0. Ground rules (why this is the safe path)

- **Everything needed is already in git** (fetch it first):
  `git fetch -q origin && git reset --hard -q origin/arena/927251ad-books`
  → brings back `tv8.srt`, `audio/tv8_master.mp3`, `images_tv8/` (331
  spot-checked jpgs), `prompts/manifest.json`, `prompts/cue_classes.json`,
  `tv8_label_map.txt`, the builder, and this runbook.
- **Do NOT regenerate images or prompts** — they are final and verified.
- **R2: the full build is ONE command** (below). Dry-run → smoke → one full
  run. Never stop the full run to edit code.
- **Commit + push the finished parts immediately** (the sandbox wipes
  uncommitted work; `output/` is gitignored and does NOT survive).
- Builds are resumable: if the render is killed mid-way, re-run the SAME
  command — cached segments in `output/segments_pro_proedit1/` are skipped.
- If a build must be left running across turns, use a background process.

## 1. Episode parameters (fixed)

| Param | Value |
|---|---|
| Episode name | `tv8` |
| SRT | `tv8.srt` (330 cues, authoritative) |
| VO (Path A, raw) | `audio/tv8_master.mp3` |
| Images | `images_tv8/` (331 jpgs, committed) |
| Manifest / labels | `prompts/manifest.json`, `tv8_label_map.txt` |
| Cue classes | `prompts/cue_classes.json` (committed) |
| Chapter cue-starts | `14,69,100,117,143,165,189,215,239,291` |
| Style | `pro` (subtle "invisible editing" — no sweep overlay, no whips) |
| Output spec | 2560×1440, 24fps, h264 CRF 24 yuv420p + AAC 48kHz, no captions |
| Total duration | 1171.74s = max(SRT 1169.74s, VO 1169.74s) + 2s |
| Split bounds (seconds) | `0,256.57,536.07,861.03,1171.74` |
| Parts | 4 files `tv8_2k_part1..4.mp4` (256.57 / 279.50 / 324.96 / 310.71s), each < 100MB, at repo root |
| Integration | concat stream-copy (command printed by the splitter) |
| Cues check | `verify_parts --ep tv8 --cues 330` |

## 2. Commands (run from the project root)

```bash
# 0. deps (after any wipe)
pip install -q --break-system-packages pillow imageio-ffmpeg numpy

# 1. smoke (12 cues) — optional but recommended once
python3 editing/build_video.py --limit 12 --res 2560x1440 --no-captions \
  --crf 24 --srt tv8.srt --name tv8 --images images_tv8 \
  --cue-class prompts/cue_classes.json \
  --chapter-cues "14,69,100,117,143,165,189,215,239,291" --style pro

# 2. FULL BUILD (one run, ~75-80 min on 2 cores) -> output/tv8_final.mp4
python3 editing/build_video.py --res 2560x1440 --no-captions --crf 24 \
  --srt tv8.srt --name tv8 --images images_tv8 \
  --cue-class prompts/cue_classes.json \
  --chapter-cues "14,69,100,117,143,165,189,215,239,291" --style pro

# 3. split into 4 parts — exact seams, audio unaffected (auto +2CRF if >cap)
python3 editing/split_parts.py --name tv8 \
  --bounds "0,256.57,536.07,861.03,1171.74"

# 4. parts must be at repo root before verify (verify globs cwd)
cp output/tv8_2k_part*.mp4 .
python3 editing/verify_parts.py --ep tv8 --cues 330   # expect OVERALL PASS

# integrate later with (seams are frame-exact):
#   printf "file '%s'\n" tv8_2k_part*.mp4 > list.txt
#   ffmpeg -f concat -safe 0 -i list.txt -c copy tv8_full_joined.mp4

# 5. frame QA — ONE ffmpeg call per frame (multi-output writes identical frames)
FF=$(python3 -c "import imageio_ffmpeg;print(imageio_ffmpeg.get_ffmpeg_exe())")
$FF -y -ss 0.4  -i tv8_2k_part1.mp4 -frames:v 1 /tmp/qa_p1.jpg
$FF -y -ss 55.0 -i tv8_2k_part2.mp4 -frames:v 1 /tmp/qa_p2.jpg
# ... >=2 frames per part (chapter opening + midpoint). Check: captions
# absent, frames differ (md5), motion/grade look right.

# 6. ship
# update README.md (TV8 proedit section: sizes, durations, verify PASS)
git add tv8_2k_part*.mp4 README.md && git commit -m "TV8 proedit: 11 verified 2K parts (proedit1 builder)" && git push -q origin arena/927251ad-books
```

## 3. Acceptance (all must pass)

- A1: 330 cues → 330 segments → 330 frame counts (build plan shows exact
  frame table; drift ≤ 1 frame).
- A2: 4 parts, 2560×1440 24fps h264+aac 48kHz, each < 100MB; part
  durations sum EXACTLY to 1171.74s (frame-exact seams, audio unaffected);
  concat stream-copy rejoins the master.
- A3: ≥2 distinct QA frames per part, no captions burned.
- A5: parts + README committed and pushed.

## 4. Failure recovery

- Sandbox wipe: `git fetch -q origin && git reset --hard -q
  origin/arena/927251ad-books` → everything above is restored; only
  `output/` (renders) is lost — re-run the full build command.
- Killed render: re-run the SAME build command (segment cache resumes).
- `verify_parts` finds "parts: []": parts were not copied to cwd (step 4).
- Never rebuild parts with different bounds; the bounds above match the
  shipped v1 split and the episode's chapter structure.
