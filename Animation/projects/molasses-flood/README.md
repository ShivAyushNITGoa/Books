# The Great Molasses Flood — completed narrated film

**The Day a Giant Wave of Molasses Destroyed a City Street**

## Watch

- **[Finished narrated MP4 — 720 × 1280, 24 fps, 3:42.67](delivery/molasses-flood-narrated-720p.mp4)**
- [Watch page](watch.html) · [Editable real-time animation preview](index.html)
- [English captions (SRT)](delivery/captions.srt) · [Full normalized voiceover (FLAC)](delivery/voiceover.flac)

The finished MP4 contains the complete recorded narrative, burned-in English captions and quiet original industrial/water sound effects. The FLAC is the clean narration-only stem. The interactive animation preview plays that clean narration; **the final MP4 is authoritative for the sound-effects mix**.

## Analysis and direction

- **[Deep transcript analysis / production plan](PLAN.md)** — causal structure, dramatic pacing, Dario-led dimensional character construction, motivated camera grammar, set/prop/action design, audio, historical guardrails and acceptance criteria.
- **[41-shot edit decision list](direction/SHOT_LIST.md)** — exact boundaries from the measured voice.
- **[Historical source and editorial ledger](ACCURACY.md)** — competing accounts, estimate qualifiers, reconstruction limits and both spoken railway corrections.
- [`direction/shots.json`](direction/shots.json) — editable camera positions, independent targets, action and narration per shot.
- [`delivery/QA.json`](delivery/QA.json) — final-file hash, codec/frame/duration checks, loudness, decode and test results.

Nine original sets cover the North End tank/street, leaking seam, distillery, viscosity insert, rescue platform, engineering office, court, harbor and memorial. Characters are original rounded 3D cartoon rigs with dimensional heads/hair, compact torsos, thin tubular limbs and head-attached facial marks. The camera makes purposeful short transfers and then settles; this is **not** the previously rejected flat engineer, a narrated slideshow or a claim of exact Dario production-tool replication.

### Editorial note

The script's two elevated-train derailment lines were changed to railway damage and a train stopping short of sagging tracks, following Smithsonian's specific account. Boston's own retrospective page differs; the conflict is disclosed rather than hidden. The supplied narrative working text is preserved in `script-supplied.txt`; the recorded edit is `script.txt`. No other body-text change is made between those saved production inputs. See the ledger for the limits of that comparison.

The visual failure is a non-graphic **tank rupture**, not a fireball. Wave height, speed and clock time are historical estimates. Geometry, flood motion, uniforms, geography, court and memorial are illustrative—not engineering simulation, surveyed reconstruction or archival evidence.

## Reproduce

Requires the existing Animation Node dependencies, Python 3 standard library, Chromium and FFmpeg. Everything needed at runtime is local; there are no remote textures, hosted APIs or private credentials. The eight narration takes are intentionally published so regeneration does **not** require calling a speech service.

```sh
# From the repository root:
python3 Animation/projects/molasses-flood/tools/prepare_audio.py
python3 Animation/projects/molasses-flood/tools/plan.py
python3 Animation/projects/molasses-flood/tools/mix_audio.py
node Animation/projects/molasses-flood/tools/render.mjs \
  --out output/molasses-flood/molasses-picture.mp4
python3 Animation/projects/molasses-flood/tools/finalize.py

node --test Animation/projects/molasses-flood/tests/*.test.mjs
node Animation/projects/molasses-flood/tools/check_browser.mjs
node --test Animation/tests/*.test.mjs
node Animation/tools/verify-lock.mjs --strict-originals \
  --base 56c4e7e98603309e453fc675241c1b9012113e84
```

For the sandbox Chromium build, prefix Node browser/render commands with:

```sh
LD_LIBRARY_PATH=/tmp/al2023/lib:/tmp CHROMIUM_PATH=/tmp/chromium
```

Those temporary sandbox paths are not portable runtime assets. A normal Playwright Chromium installation needs no such prefix. Set `FFMPEG_PATH` when the repository's existing FFmpeg fallback is unavailable.

`tools/render.mjs` also supports `--still <seconds>`, `--start`, `--end`, `--width`, `--fps`, `--captions off`, and `--review output/molasses-flood/review`. Intermediates and diagnostic frames stay in ignored `Animation/output/`.

### Delivery specifications and limits

- 720 × 1280 H.264 / yuv420p / BT.709, 24 fps; AAC mono, 48 kHz; MP4 fast-start.
- 5,344 picture frames, 222⅔ seconds. Output canvas and typography are 720p; antialiased 3D viewport is 540 × 960, composited up to the canvas.
- Eight complete narration takes using previously selected English `voice-02`, reused for continuity—not a new molasses-specific voice audition.
- 85 ordered captions; activity/word-weight estimated timing, **not forced alignment**. No complete manual audio-listening or phonetic lip-sync claim.
- 41 authored shots and nine sets. Full-file decode and technical checks do not imply the user has approved the aesthetic.
- Original `world.js`, `film.js` and directing code are project-specific. Shared local Three.js and Inter retain the notices already under `Animation/engine/vendor/` and `Animation/engine/fonts/`.
- The earlier ship film, rejected character test and all locked originals are preserved unchanged.
