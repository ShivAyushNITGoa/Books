# EDITING_LANGUAGE — proedit2 mixed-media professional builder spec

What `editing/build_video.py` applies automatically, and how to tune it.
Everything below stays inside R3 (1 cue : 1 source asset : 1 duration): effects stay within the cue window and never add timeline footage.

**THE SUBTLETY RULE (user-mandated):** effects and transitions must NEVER
attract the viewer's attention to the effect. Their only job is to avoid a
slideshow feel. No overlay sweeps (the vertical blur pass was removed as
distraction), no whip moves, rare and gentle punch-ins, blink-short dips,
soft vignettes, quiet grain. If an effect is noticeable, it is wrong.

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

## 1.1 Mixed-media timeline

- Opening/intro cues may use generated silent video clips; these must be a
  contiguous prefix of the SRT. Every cue after the intro uses a labelled
  still image. A matching video label takes precedence over an image label.
- Exactly one source asset belongs to each SRT cue. Source video audio is
  discarded; only the supplied master VO is muxed. The SRT remains the source
  of truth for cue positions and durations.
- Clips are normalized to 24 fps and trimmed to their cue window. If a clip
  is short, the final frame is held; no clip is looped or time-stretched.
  Intro clips skip still-only parallax compositing and split-source
  punch-ins, while retaining their own grade, transitions, and effects.
- The intro-to-image handoff is a normal adjacent cue boundary; no extra
  transition footage or timing is inserted.

## 2. Camera & motion

- Eased Ken Burns (smoothstep in/out), 6 patterns (push/pull/orbit L-R/
  drift), motion amplitude scaled by class + VO energy (punch = fast,
  soft = slow, word = locked-off).
- Handheld wobble (two incommensurate sines) + breathing zoom — human,
  never mechanical.
- Subject-aware framing: PIL saliency analysis caches face/subject anchors
  (`output/anchors_cache.json`); pans prefer motion continuity (neighbour
  cues with similar anchors continue the pan direction).
- Intra-cue punch-ins: on long holds (≥4.5 s), rare (~12% of story cues)
  and gentle (~1.05×) push-ins with a slow settle back; impact cues get one
  calm push-in — same image, own window, timing untouched. Word cues never
  punch (stillness = impact). No whips, no fast travels.

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
- Lit cues: bloom/halation (split + gblur + screen), subtle lamp flicker
  on `lit` cues. All cues: near-invisible chromatic fringe (rgbashift
  ±1px), quiet animated grain (`noise=allf=t+u`), soft class vignette.
- (REMOVED — user-rejected: the living-paint vertical sweep overlay. It
  read as a blur bar crossing the frame and pulled attention. Never re-add.)
- Style presets: `pro` (full chain above), `art` (softer, dreamier: more
  blur/grain/sweep, lighter grade), `doc` (clean: minimal grade, no sweep,
  light grain), `classic` (kbv2-era neutral Ken Burns + dips only).

## 5. Motion graphics (user-requested pass — "dynamic")

- **Chapter title lockups** — Devanagari titles rendered to RGBA PNGs
  (Noto Sans Devanagari, `fonts/`), animated: fade+rise on the chapter
  cue's own window, with a small TALK2SOCIETY kicker. Titles via
  `--chapter-titles "…|…|…"` (chapter order) or auto-derived from the cue.
- **Kinetic word type** — word cues show the spoken word as a warm
  typographic element (fade+rise, mid-frame), timed inside the cue.
- **Feathered light streaks** — a soft 2D-falloff warm glow sweeps once
  across chapter openings (reads as light, never as a bar).
- **2.5D parallax depth** — chapter/host/long-story cues composite a
  soft-masked foreground layer drifting at a different rate than a
  slightly blurred background (single-image parallax feel).
- **Dynamic motion grammar** — punch/word cues accelerate into the cut
  (no end settle), story/soft settle both ends; motion amplitude scales
  with VO energy.

## 6. Audio & text (policy)

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
