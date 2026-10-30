# `editing/` — deep analysis + GitHub state

**Date:** 2026-10-30 · **Branch:** `arena/56044e2c-books` (HEAD `a3d6e04`) · **Scope:** the
`editing/` production kit, the four builders/scripts it ships, how they line up with the rest of
the repo, and the GitHub side of the project.

---

## 0. TL;DR

* The kit is **coherent and mostly good code**: 2,346 lines, one builder with a clean per-cue
  timeline, frame-exact output (verified), a deterministic cue-class sidecar, and honest docs.
* It also has **four ship-blocking defects** that I reproduced live:
  1. **Crash at any resolution other than 1920×1080** (hard-coded parallax mask).
  2. **Segment cache ignores resolution / CRF / media source** → silently ships stale renders.
  3. **Wrong-episode voice-over** fallback: a build for `tv11` silently picks `tv7_master.mp3`.
  4. **`--limit` smoke builds produce a 19-minute file with 16 seconds of picture.**
* The **mixed-media (intro clips → stills) feature is brand-new and untested by any committed
  episode** — there is no `video_clips_*` folder anywhere in the repo.
* Docs contradict the code in six places, most importantly **R0 "subtlety" / R3 "no cards"** vs.
  the builder unconditionally drawing **chapter title lockups + kinetic word type** (10 + 24
  overlays on TV8's committed cue classes).
* Repo health: **1.63 GiB `.git` pack, ~930 MB working tree, 1513 tracked files, no tests, no CI,
  no requirements file.** It is heading for the GitHub size ceiling.

---

## 1. What I inspected and how

* Read every file in `editing/` (all 11 files, 2,346 lines).
* Diffed `editing/*.py` against the root/`scripts/` duplicates to find drift.
* Ran the real scripts against the real TV8/TV11 assets, including a purpose-built scratch
  project (`/tmp/mixproj`) with **synthetic intro clips** so the new video path was actually
  exercised (it has never been run in this repo).
* Probed the shipped deliverables with `ffmpeg` (no `ffprobe` dependency).
* Checked GitHub: PRs, branches, remote HEADs, repo weight, tracked file sizes.

Everything below marked “reproduced” was executed, not inferred.

---

## 2. GitHub / branch reality

| Item | State |
|---|---|
| Repo | `ShivAyushNITGoa/Books`, default branch `main` (`d76c49a`) |
| PR #4 “Arena/927251ad books” | **OPEN**, head `arena/927251ad-books` = **`a3d6e04`** — i.e. exactly this session's base commit |
| PR #5 “Add editing folder from arena/927251ad-books” | **MERGED** (2026-10-19) — that is where `editing/` entered `main` |
| PR #6, #3, #2, #1 | closed / merged |
| This session's branch | `arena/56044e2c-books`, no commits on top of `a3d6e04`, **no PR yet** |
| Remote heads | `main`, `arena/927251ad-books` only |

Implications:

* All of the repo content you are looking at is **PR #4's head**, which is still unmerged. The
  `editing/` folder was merged separately in PR #5, so the two lines of work are running in
  parallel — a drift risk already visible in the docs (see §9).
* `editing/TV8_RUNBOOK.md`, `editing/COMMANDS.md` and `editing/MASTER_PROMPT.md` all tell the
  agent to recover with `git reset --hard origin/arena/927251ad-books`. **On any other branch
  that command destroys the session's work.** Two of them also hard-code that branch as the
  source of truth for assets.
* Repo weight: `size-pack: 1.63 GiB`, working tree ~933 MB, largest tracked file 90 MB
  (`tv8_2k_part1.mp4`). GitHub starts warning at 1 GB and hard-caps individual files at 100 MB
  (currently OK, but 90 MB is one re-encode away from the cap). No LFS, no `.gitattributes`.

---

## 3. Folder inventory

| File | Lines | Role | Verdict |
|---|---|---|---|
| `build_video.py` | 1002 | The mixed-media builder (intro clips + stills, grade, motion, transitions, QC) | Strong core, 3 real bugs |
| `gen_cue_classes.py` | 174 | Cue classes / mood / lit / energy / onset sidecar | Reproduces committed TV8 classes exactly |
| `split_parts.py` | 91 | Chapter-split into <97 MB parts, CRF bump on overflow | Works; imports the wrong module |
| `verify_parts.py` | 76 | A1/A2 delivery checks | Passes on shipped parts, but checks less than it claims |
| `MASTER_PROMPT.md` | 103 | Paste-ready production prompt (v3 mixed-media) | Drifts from root `MASTER_PROMPT.md` |
| `COMMANDS.md` | 106 | Copy-paste run sheet | Correct, except stale branch in recovery |
| `EDITING_LANGUAGE.md` | 130 | Pro-edit spec | Good, but 3 stale sections |
| `IMAGE_PROMPT_FRAMEWORK_v7.txt` | 399 | SRT→still prompts for post-intro cues | Correctly excludes intro cues |
| `VIDEO_CLIP_PROMPT_FRAMEWORK.md` | 52 | SRT→silent intro clip prompts | Clean, consistent with builder rules |
| `TV8_RUNBOOK.md` | 143 | Historical TV8 rebuild | Stale branch, wrong part count, old builder paths |
| `README.md` | 70 | Kit index + per-episode workflow | Accurate |

Duplication with the rest of the repo:

```
editing/build_video.py      ← 940-line root build_video.py (proedit1)  → 62-line diff (video support)
editing/gen_cue_classes.py  ← scripts/gen_cue_classes.py               → 1-line diff (ROOT)
editing/split_parts.py      ← scripts/split_parts.py                   → 1-line diff (ROOT)
editing/verify_parts.py     ← scripts/verify_parts.py                  → 1-line diff (ROOT)
build_tv7plus.py            ← the older TV7-plus Ken Burns pipeline (delivered look for TV8/TV9)
```

So there are **two builders** (`build_video.py`, `build_tv7plus.py`) and **two copies of every
helper script**, kept in sync by hand.

---

## 4. How the pipeline actually works

```
tvN.srt ──parse_srt──► cues[n, start, end, text, label]
                        │
audio/tvN_master.mp3 ───┤ (VO duration)
                        ▼
                    plan(): per-cue segments, frames_i = int(dur_i*24),
                            last segment absorbs remainder  ← frame-exact
                        │
video_clips_tvN/*.mp4 ──┤ find_video(label) wins over find_image(label)
images_tvN/#label.jpg ──┘ prefix enforced: video-after-image = hard error
                        ▼
render_clip():  [video: fps=24, tpad(clone), trim(dur), setpts] or [-loop 1 -t dur]
                → scale/crop → zoompan Ken Burns (+wobble/breathing)
                → 2.5D parallax (still, chapter/host/long story only)
                → tmix (180° shutter) → grade (eq/curves/rgbashift/blur)
                → bloom on lit cues → chapter title / word type overlay
                → fades (in/out) → yuv420p 24fps libx264
                        ▼
output/segments_pro_proedit2_mixed/NNN.mp4  (atomic .tmp → .mp4, resumable)
                        ▼
concat -c copy → output/video_only.mp4 → mux raw VO (AAC 96k, -t total)
                        ▼
output/tvN_final.mp4 → split_parts (re-encode per part, CRF bump) → verify_parts
```

Key invariants that **do** hold:

* one asset per cue (no reuse, no placeholders, missing asset = exit 2);
* intro clips must be a contiguous prefix (verified live);
* per-cue frame counts = `int(dur×24)` (verified: 95/80/80/129 frames for 3.96/3.33/3.33/5.38 s);
* VO is muxed raw, clip audio discarded;
* segment writes are atomic, so an interrupted build resumes.

---

## 5. Verified working (what I actually ran)

| Check | Command | Result |
|---|---|---|
| Mapping, all stills | `build_video.py --dry-run --srt tv8.srt --images images_tv8` | 330/330 assets, OK |
| Mixed mapping | scratch project, 2 clips + 6 stills | `2 intro clips, 6 still images`, correct order |
| Prefix guard | added a clip at cue 6 after stills | `ERROR: intro video cue 6 appears after a still-image cue` |
| Frame exactness | counted frames per rendered segment | exact, incl. 30 fps and 25 fps source clips conformed to 24 |
| Full build @1080p | 2-cue project, parallax cue | PASS, 14.00 s, 1920×1080 24 fps h264+aac |
| Cue-class sidecar | regenerated TV8 → `/tmp` | **0 differing cues** vs committed `prompts/cue_classes.json` (330) |
| Shipped parts | `verify_parts --ep tv8 --cues 330` / `--ep tv11 --cues 319` | OVERALL PASS (3 and 4 parts) |
| Python | `py_compile` on every script | all compile |

---

## 6. P0 — ship-blocking defects (all reproduced)

### P0-1 · Builder crashes at any resolution other than 1920×1080

`make_fgmask_png()` renders the 2.5D parallax alpha mask at a **hard-coded 1920×1080**
(`editing/build_video.py:555`), then composits it with `alphamerge` against a frame rendered at
`W×H` (`:629`). Any `--res` other than 1920×1080 → hard failure.

**Reproduced** (`--limit 8 --res 640x360`, cue 8 is a ≥7 s story cue → parallax path):

```
RuntimeError: segment 0-28 (full): [Parsed_alphamerge_8] Input frame sizes do not match
(640x360 vs 1920x1080) ... Failed to configure output pad
```

This kills:
* the documented smoke/resolution override (`--res 2560x1440` is explicitly advertised);
* every non-1080p workflow (`--res 854x480` in the help text, 1280×720 default claim);
* any QHD archive render.

**Fix**

```python
def make_fgmask_png():
    p = GFX_DIR / f"fgmask_{W}x{H}.png"          # per-resolution cache
    ...
    w, h = W, H                                   # was: w, h = 1920, 1080
```

Note the cache name must include the resolution too — otherwise the first-run mask is reused at
the second resolution and the crash returns.

### P0-2 · Segment cache is keyed only by cue number

```python
seg_dir = OUT_DIR / f"segments_{args.style}_{STYLE_TAG}"   # :869
def _cached(p): return p.exists() and p.stat().st_size > 2048
```

`W/H`, `CRF`, `--images/--videos` paths and the actual media files are **not** part of the key.
Swapping a still for an intro clip, changing the resolution, changing CRF, or re-generating a
frame silently reuses the old render.

**Reproduced** — asked for 1920×1080 after a 640×360 run:

```
Clips : 4   output 1171.74s @ 1920x1080 24fps
Stage 1 : rendering 0 segments (4 cached)
DONE ...
Stream #0:0: Video: h264, 640x360        ← shipped at the wrong resolution
```

Only a later `verify_parts` would catch this, and only for the 1920×1080 case.

**Fix** — fold the recipe into the cache directory, e.g.

```python
src_hash = hashlib.md5("|".join(
    f"{s['label']}:{m.name}:{m.stat().st_mtime_ns}:{k}"
    for s, m, k in mapped).encode()).hexdigest()[:8]
seg_dir = OUT_DIR / f"segments_{args.style}_{STYLE_TAG}_{W}x{H}_q{CRF}_{src_hash}"
```

### P0-3 · Wrong-episode voice-over, silently

```python
vo = AUD_DIR / f"{args.name}_master.mp3"     # :783
if vo is None: vo = find_audio(AUD_DIR)      # :788 → first audio file alphabetically
```

If `<name>_master.mp3` is missing, the builder grabs the **first audio file in `audio/`**.

**Reproduced** — TV11 has images, SRT, and delivered parts, but no `audio/tv11_master.mp3`:

```
$ python3 editing/build_video.py --dry-run --srt tv11.srt --name tv11 --images images_tv11
Master VO     : tv7_master.mp3
```

A full TV11 rebuild would mux Subhas Chandra Bose narration under the TV11 script, render for two
hours, and produce a plausible-looking file. Nothing errors.

**Fix**

```python
cand = AUD_DIR / f"{args.name}_master.mp3"
if not cand.exists():
    print(f"ERROR: expected {cand}; refusing to fall back to another episode's VO.")
    return 2
```

(Keep `find_audio` only for the legacy `build_tv7plus` path, or gate it behind `--vo`.)

### P0-4 · `--limit` smoke builds produce an unwatchable, oversized file

`build()` computes `total = max(srt_end, vo_dur) + 2` from the **whole** episode (`:835`) and uses
it for the final `-t` (`:931`, `:945`), while `plan(..., limit=N)` correctly shrinks the timeline
to `cues[N-1].end + 1` (`:315`). The concat video is N cues long; the mux forces the full VO.

**Reproduced** (`--limit 4` on TV8, full 19.5-minute master present):

```
Clips : 4   output 1171.74s (19.5 min) @ 640x360 24fps
DONE: output/tv8_test_4.mp4 (14.5 MB)
Duration: 00:19:29.71          ← 16 s of picture, ~19 min of audio
```

The smoke file is useless for QA, takes ~55 s just to mux, and contradicts the kit's own
“12-cue smoke build → `output/tvN_test_12.mp4`” promise. It also makes `--limit` verdicts about
duration meaningless.

**Fix** — have `plan()` return the limited `total`, use that for the printed duration and `-t`, and
name the output after the limited span.

---

## 7. P1 — correctness / maintainability

### P1-5 · Docs forbid exactly what the builder draws (R0 / R3 vs titles & word type)

* `editing/MASTER_PROMPT.md` R0: “effects/transitions must never attract attention… If an effect
  is noticeable, it is wrong.” R3: “No inserted shots, **cards**, echo frames…”. The closing
  paragraph: “NEVER add: **title/chapter/end cards**, idents…”.
* `editing/EDITING_LANGUAGE.md` §3 still says “Title/chapter flash-cards… do not re-add”.
* But `build_video.py:648-700` **always** draws, for `--style` any and `--cue-class` present:
  a Devanagari chapter title lockup + TALK2SOCIETY kicker on `chapter` cues, and a 118 px kinetic
  word on `word` cues. TV8's committed sidecar contains **10 chapter + 24 word cues** → 34
  overlays that the rule text forbids.

Both behaviours can be defended, but not simultaneously. Decide: either gate the overlays behind
`--chapter-titles`/`--kinetic-type` (off by default, matching R0/R3) or rewrite R0/R3 to say
“typographic beats are allowed at chapter openings and single-word frames”.

### P1-6 · `editing/` scripts import the *root* builder, not the kit's

`gen_cue_classes.py:28` and `split_parts.py:23` do `sys.path.insert(0, str(ROOT))` where
`ROOT = Path.cwd()`, so the **root** `build_video.py` wins over the sibling one. Confirmed:

```
resolved module: /home/user/Books/build_video.py | STYLE_TAG: proedit1
```

Harmless today (`parse_srt`, `find_ffmpeg`, `OUT_DIR`, `media_duration` are identical), but the kit
claims to be self-contained, and a future divergence in `parse_srt` would silently change SRT
labels/classes. Also makes `editing/` non-portable to a project that only ships the kit plus a
root builder of a different vintage.

**Fix:** insert `Path(__file__).resolve().parent` first, or import the helpers from a tiny shared
`t2s_common.py` that both copies use.

### P1-7 · VO PCM cache is episode-agnostic → cross-episode cue classes

`gen_cue_classes.py:59` caches decoded audio as `output/vo_pcm_s16le_8k.raw` and **never
invalidates it**. Run TV8 then TV9 in the same checkout and TV9's `energy`/`onset` values (which
drive pacing, punch-ins and hard-vs-dip choices) are computed from TV8's narration. It also goes
stale if the VO is re-exported.

**Fix:** `raw = out_dir / f"vo_pcm_{episode}_{vo_mtime_ns}.raw"`.

### P1-8 · `verify_parts.py` checks less than it advertises

* It prints `A2: total parts duration …` but **never compares** it to the master/`max(SRT,VO)+2`.
* It does not check seam abutment, part count (3–5), contiguous numbering, or that parts are at
  the repo root.
* Hard-codes `1920×1080` / `24 fps` (fine as a delivery gate, but undocumented).
* `f"{i['dur']:.2f}"` raises `TypeError` if the duration regex misses (corrupt/tiny file) instead
  of failing the check.
* `srt_cues()` splits on `\n\n`; CRLF SRTs would report 1 cue. (Current SRTs are LF — fine today.)

**Fix:** add `--total` and `--parts` args, assert `abs(total-expected) <= 0.12`, guard `None`
durations, count files.

### P1-9 · Runbooks contain destructive, stale instructions

* `editing/TV8_RUNBOOK.md:14, 96-99`, `editing/COMMANDS.md:96`, `editing/MASTER_PROMPT.md:98`:
  `git reset --hard -q origin/arena/927251ad-books`. That branch is PR #4's head — pinned, and
  wrong for every future session. The safe form is `origin/<current-branch>` or a copy-first
  recovery.
* `TV8_RUNBOOK.md:52` commit message says **“11 verified 2K parts”**; TV8 ships **3** parts
  (`369.96 / 415.83 / 386.00 s`).
* `TV8_RUNBOOK.md` §5/§2 still points at `scripts/split_parts.py` / `scripts/verify_parts.py` and
  `build_tv7plus.py` even though the kit ships its own copies — a reader can't tell which is
  authoritative.

### P1-10 · The new intro-clip feature has zero committed assets or tests

`README.md` and `MASTER_PROMPT.md` make intro clips the default workflow, but:
* no `video_clips_tv*` directory exists in the repo;
* no committed episode was built with `--videos`;
* there is no test, fixture, or sample clip;
* the only way to find P0-1 was a scratch build.

That is exactly how a headline feature ships broken. Add `tests/` with a 3-cue fixture (2 synthetic
clips + 1 still + 2 s silent VO) and a `make smoke` target.

---

## 8. P2 — polish, hygiene, and things that will bite later

| # | Issue | Where |
|---|---|---|
| P2-11 | Docstring still promises “slow living-painting light sweep overlay across **every scene**”, but the sweep was removed for R0; `make_sweep_png()` (47 lines) is dead, `sweep` is threaded through 5 functions and always `None` | `build_video.py:53, 479, 570, 722, 867` |
| P2-12 | `--res` help says “default 1280x720”, argparse default is `1920x1080` | `:974-975` |
| P2-13 | Mood vocabulary mismatch: docs say `warm\|true\|deep\|stark`, code emits `dark\|light\|neutral` | `EDITING_LANGUAGE.md` §1 vs `gen_cue_classes.py:160-162` |
| P2-14 | Missing-asset message always says “expected a matching video in <vid dir>/ **or** image”, even when no clips are intended (`--videos none`) | `:827` |
| P2-15 | `output/` is gitignored yet `output/tv10_final.mp4` (44 MB) and `output/tv11_final.mp4` (77 MB) are tracked | `.gitignore` vs `git ls-files` |
| P2-16 | Parts are re-encoded per part from an already-CRF-24 master (generation loss) and AAC audio is re-encoded per part, so “audio never clipped/padded” at seams is approximate (AAC priming ≈ 21 ms/part) | `split_parts.py:32-45` |
| P2-17 | `numpy` is a documented dependency but never imported; `pillow` deprecation warnings from `getdata()` (removal 2027) | `README.md`, `image_anchor`, `phash64` |
| P2-18 | `.git` is 1.63 GiB / 930 MB tree with no LFS — every arena clone pays for it; 90 MB part is one re-encode from GitHub's 100 MB hard cap | repo-wide |
| P2-19 | Two builders (`build_video.py`, `build_tv7plus.py`) and two copies of three helpers; nobody records which one produced which delivered part (README mentions both) | repo-wide |

---

## 9. Doc ↔ code contradictions (quick table)

| Doc claim | Reality |
|---|---|
| `EDITING_LANGUAGE` §1 mood = `warm\|true\|deep\|stark` | code emits `dark\|light\|neutral` |
| `EDITING_LANGUAGE` §3 “Opening: 0.5 s fade-from-black. End: 3 s dip” | code: `min(0.70, dur*0.40)` in, `min(1.10, dur*0.45)` out |
| `EDITING_LANGUAGE` §3 “Title/chapter flash-cards… do not re-add” | code draws them on every `chapter` cue |
| `MASTER_PROMPT` R3/R0 “no cards”, “effects must be invisible” | code draws titles, kickers, 118 px word type |
| `EDITING_LANGUAGE` §4 “`art` = more blur/grain/**sweep**” | all styles have `sweep=0`; sweep code dead |
| `build_video.py` module docstring “light sweep overlay across every scene” | removed by R0 |
| `--res` help “default 1280x720” | default `1920x1080` |
| `COMMANDS` example cache `output/segments_{style}_proedit2_mixed/` | true — and that key is P0-2 |
| `TV8_RUNBOOK` “11 verified 2K parts” | 3 parts |
| README “dependencies … numpy” | numpy unused |

---

## 10. Suggested patch plan (smallest safe order)

1. **P0-1** — `make_fgmask_png`: use `W,H` + resolution in the cache filename. *~3 lines.*
2. **P0-3** — require `audio/<name>_master.mp3`; hard-fail otherwise. *~5 lines.*
3. **P0-2** — fold `W×H`, `CRF`, style, and a hash of `(label, media name, mtime)` into
   `seg_dir`. *~8 lines.*
4. **P0-4** — return the limited total from `plan()`, use it for the banner and both `-t` values,
   and suffix the output with the limited span. *~6 lines.*
5. **P1-6** — import helpers from `Path(__file__).parent`, not `cwd`. *2 lines each.*
6. **P1-7** — cache PCM per episode + mtime. *1 line.*
7. **P1-8** — `verify_parts --total/--parts`, `None`-safe durations, contiguity check.
8. **P1-9** — replace the hard-coded branch in all recovery snippets with a copy-first recipe.
9. **P1-5** — decide overlays: gate behind a flag (recommended) or amend R0/R3.
10. **P1-10** — add `tests/` + `make smoke` (3-cue fixture) so the video path stays covered.
11. **P2** — delete the sweep code, fix the `--res` help, align mood names, untrack `output/`,
    add `requirements.txt`.

---

## 11. Decisions I need from you

1. **Overlays:** keep chapter titles + kinetic word type (and rewrite R0/R3), or make them
   opt-in (and keep the subtlety rule absolute)?
2. **Mixed media:** which episode is the first real intro-clip build? I can stub
   `video_clips_tvN/` scaffolding and a prompt pack from the SRT so it is testable.
3. **VO for TV11:** `audio/tv11_master.mp3` is missing from the repo — where is the master, or
   was TV11 delivered from a VO that lives only outside git?
4. **Repo weight:** do you want `output/*.mp4` and the delivered parts moved to Releases/LFS
   before the pack crosses GitHub's comfortable range?

---

*Everything under §5 was executed in this sandbox against the real repository assets; the scratch
project lives in `/tmp/mixproj` and `/tmp/px` and is not part of the repo.*
