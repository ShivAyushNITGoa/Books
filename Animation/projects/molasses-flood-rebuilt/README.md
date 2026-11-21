# The Great Molasses Flood — connected-world rebuild

Replacement for the rejected first molasses film. This version changes the motion/world architecture rather than only retouching materials. It preserves the complete selected narration, conservative railway wording, 222⅔-second duration and 85 English caption cues.

**Read [the whole-film analysis and ten-point correction ledger](ANALYSIS_AND_FIXES.md).** Technical checks do not mean the user has approved this revision.

## Watch / delivery

- Interactive source player: [`index.html`](index.html), served over HTTP.
- [Watch/download the complete narrated MP4](delivery/molasses-flood-rebuilt-narrated-720p.mp4).
- Captions: [`delivery/captions.srt`](delivery/captions.srt).
- [Actual delivery measurements/checksum](delivery/QA.json), [all-frame audit](delivery/FRAME_AUDIT.json), and [final review / remaining limits](delivery/REVIEW.md).
- Historical/editorial evidence: [`../molasses-flood/ACCURACY.md`](../molasses-flood/ACCURACY.md).

The output container is 720×1280 / 24 fps / H.264 + AAC. The 3D viewport is 540×960, composited under native-resolution 720×1280 graphics/captions. Do not call it a native-720 3D render.

## Source map

| Path | Responsibility |
|---|---|
| `engine/math.js` | Deterministic vector math, Hermite and bounded attention interpolation, analytic IK |
| `engine/geometry.js` | Shared 3D primitives/materials, stable segment transforms, static batching |
| `cast/motion.js` | Distance-integrated routes, gait, actor/action scheduling |
| `cast/actor.js` | Joined rounded bodies, capped hair, attached facial marks, IK limbs and tasks |
| `world/geography.js` | Shared locations, warehouse blocks, ground, episode clock, retained fluid depth |
| `world/district.js` | Connected wharf/streets/buildings/quays and explanatory stations |
| `world/tank.js` | Closed thick panel construction, leakage/paint, outward failure hinges |
| `world/flood.js` | Global persistent surface, surges, debris and eddies |
| `world/harbor-water.js` | Gradual brown harbor runoff |
| `world/action-props.js` | Damaged railway/stopping train, horse/cart, demonstration, pail/roller/rope/hose |
| `world/index.js` | One shared scene assembly and deterministic update |
| `direction/camera.js` | Always-moving position route and bounded continuous attention |
| `direction/beats.json` | 41 narration landmarks, not set-switch instructions |
| `ui/overlay.js` | Captions, labeled time shifts, source-geography inset |
| `film.js` | Browser player, audio synchronization, seek/export/debug hooks |
| `tests/` | Route/contact, geometry-math, temporal/geographic/camera regression checks |
| `tools/` | Picture export, browser checks, unchanged audio mix, source manifest and final-file validation |

The selected narration is a **shared local asset** at `../molasses-flood/delivery/voiceover.flac`; the eight original takes and ten-effect cue ledger remain in that prior project. The rebuild does not need a new voice selection or duplicate 19 MB voiceover file. Its final MP4 is standalone.

## Reproduce

From the repository root, install the existing kit dependencies if necessary:

```sh
cd Animation
npm ci
npx playwright install chromium
cd ..
```

Serve the source player:

```sh
node Animation/projects/molasses-flood-rebuilt/tools/serve.mjs
# Open the printed URL, or the Arena live preview.
```

The shared server binds to `0.0.0.0`. Browser asset/audio URLs are relative; there is no browser-facing localhost API dependency.

### 1. Tests and protected-original integrity

```sh
mkdir -p Animation/output/molasses-flood-rebuilt
node --test Animation/projects/molasses-flood-rebuilt/tests/*.test.mjs \
  > Animation/output/molasses-flood-rebuilt/project-tests.log 2>&1
node --test Animation/tests/*.test.mjs \
  > Animation/output/molasses-flood-rebuilt/repository-tests.log 2>&1
node --test Animation/projects/molasses-flood/tests/*.test.mjs \
  > Animation/output/molasses-flood-rebuilt/previous-project-tests.log 2>&1
node Animation/tools/verify-lock.mjs --strict-originals \
  --base 56c4e7e98603309e453fc675241c1b9012113e84 \
  > Animation/output/molasses-flood-rebuilt/lock.log 2>&1
```

### 2. Review actual browser geometry and seek repeatability

```sh
node Animation/projects/molasses-flood-rebuilt/tools/browser-check.mjs \
  > Animation/output/molasses-flood-rebuilt/browser-check.log 2>&1
node Animation/projects/molasses-flood-rebuilt/tools/render.mjs \
  --review output/molasses-flood-rebuilt/review
node Animation/projects/molasses-flood-rebuilt/tools/render.mjs \
  --start 130 --end 136 --out output/molasses-flood-rebuilt/motion-review.mp4
```

Review both stills and movement. The browser report separates hard failures from observations requiring visual judgment. In this sandbox the Chromium executable requires these prefixes:

```sh
LD_LIBRARY_PATH=/tmp/al2023/lib:/tmp CHROMIUM_PATH=/tmp/chromium \
  node Animation/projects/molasses-flood-rebuilt/tools/browser-check.mjs
```

These `/tmp` paths are environment-specific, not portable repository dependencies. On a normal Playwright installation omit both variables.

### 3. Freeze runtime inputs, mix, render, finalize

```sh
node Animation/projects/molasses-flood-rebuilt/tools/source-manifest.mjs
python3 Animation/projects/molasses-flood-rebuilt/tools/mix_audio.py
node Animation/projects/molasses-flood-rebuilt/tools/render.mjs \
  --out output/molasses-flood-rebuilt/molasses-picture.mp4 \
  > Animation/output/molasses-flood-rebuilt/render.log 2>&1
python3 Animation/projects/molasses-flood-rebuilt/tools/finalize.py \
  > Animation/output/molasses-flood-rebuilt/finalize.log 2>&1
```

Do not edit the runtime between source fingerprinting and the completed export. The finalizer rejects source drift, incomplete telemetry, failed browser/tests/lock checks, incorrect streams/frame count, dropped/duplicate frames and unsuitable measured audio level. It uses FFmpeg's `-fps_mode passthrough`, not the removed `-vsync` option.

The unchanged mix is regenerated in ignored output without rewriting the first film. Override `FFMPEG_PATH` if FFmpeg is not on PATH or installed at `Animation/node_modules/ffmpeg-static/ffmpeg`.

### 4. Audit all decoded final-file frames

```sh
python3 Animation/references/dario-character-camera/audit_frames.py \
  Animation/projects/molasses-flood-rebuilt/delivery/molasses-flood-rebuilt-narrated-720p.mp4 \
  Animation/output/molasses-flood-rebuilt/all-frame-audit
python3 Animation/projects/molasses-flood-rebuilt/tools/summarize-audit.py
```

This optional diagnostic requires NumPy, OpenCV and Pillow. It is shared measurement tooling, not reference footage reuse. It produces all-frame thumbnail atlases and per-frame measurements. It does not certify historical physical realism, perfect framing or artistic approval.

## Preservation and limits

The first molasses delivery remains as a rejected historical iteration. The completed ship film and frozen approved classroom archive are not rewritten. Large scratch images, full telemetry, atlases and PCM stay under ignored `Animation/output/`.

The new scene is compositional geography, not a surveyed Boston map. The flood is an authored height field, not CFD. Rewind, later legal finding and remembrance are explicitly labeled narrative time shifts. The demonstration table and remembrance display are persistent explanatory props and can be seen before their narrated close-up. Partial immersion can hide lower limbs. Source/geometry tests reduce specific regressions but cannot prove zero intersection in every possible pose or perfect visual similarity to the Dario reference.
