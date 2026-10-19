# EDITING_LANGUAGE — proedit1 professional builder spec

What `editing/build_video.py` applies automatically, and how to tune it.
Everything below stays inside R3 (1 cue : 1 image : 1 duration) — effects
are in-segment or re-frame the cue's own image inside its own window.

## 1. Input intelligence (`editing/gen_cue_classes.py` → `cue_classes.json`)

Per cue, the sidecar carries:
- `class` — `chapter` (chapter openings) | `host` (presenter lines) | `word`
  (single-word punch frames) | `soft` (quiet/reflective) | `punch`
  (impact/anger) | `story` (default narrative).
- `mood` — `warm|true|deep|stark` from text keywords.
- `lit` — lamp/light scenes get bloom + flicker.
- `energy` — RMS loudness of the VO over that cue (ffmpeg 8 kHz PCM,
  p90-normalised), driving cut-vs-dip choice and motion speed.

Class sources: `--chapters` list, `--labels` map (`#Host`, `#S#`/`#W#`
word frames), text regexes, and energy z-scores.

## 2. Camera & motion

- Eased Ken Burns (smoothstep in/out), 6 patterns (push/pull/orbit L-R/
  drift), motion amplitude scaled by class + VO energy (punch = fast,
  soft = slow, word = locked-off).
- Handheld wobble (two incommensurate sines) + breathing zoom — human,
  never mechanical.
- Subject-aware framing: PIL saliency analysis caches face/subject anchors
  (`output/anchors_cache.json`); pans prefer motion continuity (neighbour
  cues with similar anchors continue the pan direction).
- Intra-cue punch-ins: on long holds (≥4.5 s), ~60% of story cues and all
  punch cues get a punch-in/punch-out or whip reframe mid-cue — same image,
  own window, timing untouched. Word cues never punch (stillness = impact).

## 3. Transitions & timeline

Vocabulary chosen per cut pair (class + energy):
- **Hard cut** — punch/word/host and any high-energy boundary.
- **Warm dip to black** (short, warm colour) — story boundaries.
- **Soft fade** (double-fade overlap, 1:1 frames preserved) — soft/host.
- Chapter cues and the episode open/close get black beats with light-leak
  pulses (overlay PNG, animated opacity).
- Opening: 0.5 s fade-from-black. End: 3 s dip. Total = max(SRT, VO)+2 s.
- Exposure settle ("paint-settle"): 2-step soft-focus + exposure ramp on
  the first ~0.9 s of each segment after a cut.

## 4. Colour & atmosphere

- Emotional grade per cue: warm (soft/story warm), deep (story dark/host),
  stark (word/punch), true (chapter) via eq + colorbalance.
- Day→night drift across the episode (brightness/gamma curve) and
  bleach-bypass look on chapter cues.
- Lit cues: bloom/halation (split + gblur + screen), lamp flicker on
  `lit` cues. All cues: chromatic fringe (rgbashift ±1px), animated grain
  (`noise=allf=t+u`), class-scaled vignette.
- Living-paint light sweep: soft diagonal sweep PNG overlay drifting
  across the frame once per segment (direction alternates).
- Style presets: `pro` (full chain above), `art` (softer, dreamier: more
  blur/grain/sweep, lighter grade), `doc` (clean: minimal grade, no sweep,
  light grain), `classic` (kbv2-era neutral Ken Burns + dips only).

## 5. Audio & text (policy)

- VO is muxed raw (Path A / R4). No music/ambience/ducking/LUFS work.
- No burned captions in delivered builds (`--no-captions`). The caption
  path exists for inspect-only builds.

## 6. QC (per build)

- Same-shot duplicate detection (perceptual hash warnings — check for
  repeated labels in one chapter).
- Pacing report: cuts vs fades vs cached per class — a healthy episode has
  mostly hard cuts, a few dips/fades, and fades only on soft/host.

## 7. Deliberate exclusions (do not re-add inside R3/R4/R6)

Title/chapter flash-cards, end cards, channel idents (R6 + total timing);
ghost-echo bleed, PiP, split-screen, recap shots (R3); true
cross-dissolves (R3 frame budget); music, ambience, risers, −14 LUFS
masters (R4); 60fps minterpolate/optical-flow (2-core CPU); per-pixel
procedural geq FX (dust/shimmer/godrays) — too slow at 2K; lens-breathing
and mirror gimmicks (taste).

## 8. Tuning knobs

- `--style pro|art|doc|classic` — the whole palette/motion/sweep package.
- `--chapter-cues` — cue numbers where chapter beats fall.
- `--cue-class` — path to the sidecar (omit for classic kb-style run).
- `--crf`, `--res`, `--limit N` (smoke), `--dry-run` (plan + frame table).
- Class/mood/keyword tables live in `gen_cue_classes.py` (PUNCH_RE,
  SOFT_RE, HOST_RE, mood/lit regexes) and `build_video.py` (`policy_for`,
  `fades_for`, `grade_exprs`, `STYLES`).
