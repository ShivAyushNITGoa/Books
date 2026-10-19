# MASTER_PROMPT — Talk2Society episode production (v2, professional-builder edition)

> v2 (2026-10): supersedes the v1 chat contract. Adds the proedit1 builder
> (`build_video.py --style pro`) and the cue-class intelligence layer
> (`scripts/gen_cue_classes.py`). All v1 rules (R1–R6, Path A) are preserved
> unchanged — v2 only upgrades the visual/editing layer.

End-to-end pipeline for turning one episode of narration + SRT into uploaded
YouTube parts. Every episode: transcript/tagging → SRT → VO → prompts →
images → build → split → verify → commit.

---

## 0. Standing rules (never break)

- **R1 — packs of 10.** Generate images in batches of 10 (`generate_image`
  calls in parallel, one manifest entry per call). Never one-at-a-time.
- **R2 — single run.** The full build runs as ONE command; never stop
  mid-build to edit code. Fix issues in a smoke run first.
- **R3 — 1 cue : 1 image : 1 duration.** `frames_i = floor(dur_i × 24)`,
  last frame absorbs remainder; drift ≤ 1 frame. ALL effects (motion,
  punch-ins, dips, grade) stay inside the cue's own segment or reframe the
  cue's own image within its own window. No inserts, no echoes, no cards.
- **R4 — Path A audio.** VO is copied/concatenated from the raw record only.
  No TTS, no re-record, no music/ambience/LUFS processing.
- **R5 — delivery.** Parts ≤ 100 MB each, 2560×1440 24fps h264 (CRF 24)
  yuv420p + AAC 48 kHz stereo, no LFS; parts land at repo root.
- **R6 — no burned captions.** Clean build = `--no-captions`.
- No upscaling of generated images. Prompt images must match the actual
  spoken cue texts (verify against the episode SRT). Prompt packs ship at
  once, never in parts.
- Branch: `arena/927251ad-books` only. Commit + push every increment
  (the sandbox wipes uncommitted work). `.gitignore` = exactly
  `output/`, `images_up4x/`, `models/`, `__pycache__/`.
- Env notes: no ffprobe (parse `ffmpeg -i` stderr); 2-core/4 GB CPU; pip
  deps `pillow imageio-ffmpeg numpy --break-system-packages` after wipes;
  extract QA frames one ffmpeg call per frame (multi-output writes
  identical frames).

## 1. Stages (per episode `tvN`)

0. **Transcript** — raw record → tagged transcript + `tagging_rationale.md`.
1. **SRT** — `tvN.srt`, cues authoritative (TV8: 330).
2. **VO** — Path A: `audio/tvN_master.mp3`.
3. **Prompts** — `prompts/master_prompt_v7.txt` (image-prompt framework) →
   `prompts/manifest.json` + `tvN_label_map.txt` (cue→label sole source).
4. **Images** — R1 packs of 10 → `images_tvN/` + PROGRESS.txt.
5. **Cue classes** (new):
   `python3 scripts/gen_cue_classes.py --srt tvN.srt --vo audio/tvN_master.mp3
   --manifest prompts/manifest.json --labels tvN_label_map.txt
   --chapters "<cue-start list>" --out prompts/cue_classes.json`
   → per-cue class (chapter/host/word/soft/punch/story), mood, lit, VO energy.
6. **Build** (dry-run → smoke `--limit 12` → full, one run):
   `python3 build_video.py --res 2560x1440 --no-captions --crf 24 --srt
   tvN.srt --name tvN --images images_tvN --chapter-cues "<chapter list>"
   --cue-class prompts/cue_classes.json --style pro`
   Styles: `pro` (filmic), `art` (dreamy), `doc` (clean), `classic` (= kbv2).
   Cache `output/segments_{style}_proedit1`; atomic segment writes; final
   total = max(SRT span, VO) + 2 s with opening fade + closing dip.
7. **Deliver** — split at chapter bounds:
   `python3 scripts/split_parts.py --srt tvN.srt --name tvN --vo
   audio/tvN_master.mp3 --bounds "…"` → `cp output/tvN_2k_part*.mp4 .` →
   `python3 scripts/verify_parts.py --ep tvN --cues <N>` (expect OVERALL
   PASS) → one-ffmpeg-call-per-frame spot-checks → README + commit + push.

## 2. The proedit1 editing language (what the builder applies automatically)

Driven by cue classes + mood + lit + VO energy from `cue_classes.json`:

- **Camera**: eased 6-pattern Ken Burns, handheld wobble + breathing,
  saliency-anchored framing (`output/anchors_cache.json`), motion-continuity
  pan runs, class-driven pacing (punch fast, soft slow, word locked-off),
  intra-cue punch-ins/whips on long holds (same image, own window).
- **Transitions**: hard cut (punch/word/host), warm dip (story), soft fade
  (soft), chapter & open/close black beats with light-leak pulses.
- **Grade/atmosphere**: emotional colour per cue, day→night drift,
  bleach-bypass chapters, bloom + lamp flicker on lit cues, exposure settle
  after cuts, chromatic fringe, animated grain, class vignette,
  living-paint light sweep.
- **QC**: same-shot phash duplicate warnings + pacing report per build.

Deliberately out (rule-touch decisions; documented so nobody re-adds them
inside the 1:1 contract): title/chapter/end cards & idents (R6, total
timing), ghost-echo/PiP/split/recap (R3), true cross-dissolves (R3),
music/ambience/risers/LUFS (R4), 60fps optical flow & per-pixel procedural
FX (2-core CPU). Available later only as separate tools outside R3.

## 3. Failure recovery

Sandbox wipes: `git fetch -q origin && git reset --hard -q
origin/arena/927251ad-books` (first copy any modified tracked files to
`~/`). Reinstall pip deps. `verify_parts` globs the REPO ROOT — always
`cp output/*_part*.mp4 .` first. Long builds go to a background process;
keep steps short (chained long commands get aborted).
