# MASTER_PROMPT — Talk2Society episode production (v3, mixed-media edition)

> v3 (2026-10): the opening intro uses generated silent video clips, while
> all remaining SRT cues use still images. The proedit2 builder combines both
> with the raw VO, then splits, verifies, and delivers the finished parts.

End-to-end pipeline for turning one episode SRT + raw narration audio into
uploaded YouTube parts: intro clip prompts/assets → remaining image
prompts/assets → mixed-media build → split → verify → commit/push.

---

## 0. Standing rules (never break)

- **R1 — intro clips + image packs.** Generate one silent video clip for
  each consecutive opening/intro SRT cue, named with its exact cue label.
  Then generate still images for every later cue in packs of 10 (one manifest
  entry per image). Confirm the intro boundary with the user if unclear.
- **R2 — single run.** The full build runs as ONE command; never stop
  mid-build to edit code. Fix issues in a smoke run first.
- **R3 — 1 cue : 1 source asset : 1 duration.** Each cue uses exactly one
  labelled intro video clip or still image. `frames_i = floor(dur_i × 24)`;
  last frame absorbs remainder; drift ≤ 1 frame. Effects stay inside the
  cue's own segment. Clip audio is discarded; only the supplied master VO
  is used. No inserts, echoes, cards, or timing edits. Intro clips form one
  contiguous opening prefix, followed by still images.
- **R4 — Path A audio.** VO is copied/concatenated from the raw record only.
  No TTS, no re-record, no music/ambience/LUFS processing.
- **R5 — delivery.** Few parts (typically 3–5, never more than needed),
  each < 100 MB, **1920×1080 (≤1080p — never higher)** 24fps h264
  (CRF 24) yuv420p + AAC 48 kHz stereo, no LFS; parts land at repo root.
  Parts must abut exactly (frame-exact seams, audio never clipped/padded)
  and re-integrate with a concat stream-copy.
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
3. **Intro clip prompts** — use `editing/VIDEO_CLIP_PROMPT_FRAMEWORK.md`
   for the consecutive opening cues; record the intro-end cue.
4. **Still-image prompts/assets** — use `prompts/master_prompt_v7.txt`
   (`editing/IMAGE_PROMPT_FRAMEWORK_v7.txt`) for all cues after the intro.
   Keep `tvN_label_map.txt` as the sole cue-label authority. Generate intro
   clips in `video_clips_tvN/`; generate remaining stills in packs of 10 in
   `images_tvN/` + PROGRESS.txt.
5. **Cue classes** (new):
   `python3 editing/gen_cue_classes.py --srt tvN.srt --vo audio/tvN_master.mp3
   --manifest prompts/manifest.json --labels tvN_label_map.txt
   --chapters "<cue-start list>" --out prompts/cue_classes.json`
   → per-cue class (chapter/host/word/soft/punch/story), mood, lit, VO energy.
6. **Build** (dry-run → smoke `--limit 12` → full, one run):
   `python3 editing/build_video.py --res 1920x1080 --no-captions --crf 24
   --srt tvN.srt --name tvN --videos video_clips_tvN --images images_tvN
   --chapter-cues "<chapter list>" --cue-class prompts/cue_classes.json
   --style pro`
   Styles: `pro` (filmic), `art` (dreamy), `doc` (clean), `classic` (= kbv2).
   Cache `output/segments_{style}_proedit2_mixed`; atomic segment writes; final
   total = max(SRT span, VO) + 2 s with opening fade + closing dip.
7. **Deliver** — split into few, exact-seam parts at chapter bounds:
   `python3 editing/split_parts.py --name tvN --bounds "…"` (auto +2CRF
   retry under the 97MB cap) → `cp output/tvN_2k_part*.mp4 .` →
   `python3 editing/verify_parts.py --ep tvN --cues <N>` (expect OVERALL
   PASS) → one-ffmpeg-call-per-frame spot-checks → README + commit + push.
   Integration command (concat stream-copy) is printed by the splitter.

## 2. The proedit2 mixed-media editing language (what the builder applies automatically)

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

**THE SUBTLETY RULE (user-mandated):** effects/transitions must never
attract attention to themselves — their only job is to avoid a slideshow
feel. No sweep overlays, no whip moves; rare gentle punch-ins; blink-short
dips; quiet grain and vignettes. If an effect is noticeable, it is wrong.

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

**Builds are resumable.** Segment renders are atomic (`.tmp` → rename) and
cached in `output/segments_{style}_proedit2_mixed/`; if a full build is killed or
the sandbox restarts mid-run, just re-run the identical build command —
cached segments are skipped and only the missing ones re-render. Never
"repair" a partial segment by hand; a missing/corrupt file simply re-renders.
After any restart, re-check progress with `ls output/segments_*/ | wc -l`
(log counters can be ahead of the surviving cache).
