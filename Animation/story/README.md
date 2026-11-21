# Story World Studio

**Custom story worlds, illustrative cutout casts, dimensional props, English narration, captions and complete MP4 export.** Separate from the unchanged approved classroom film.

Start with the [production blueprint](BLUEPRINT.md), [full-runtime railroad reference analysis](REFERENCE_ANALYSIS.md), and [data/extension format](FORMAT.md). A user provides the story to the assistant; the assistant authors the shot plan, world, characters and missing custom animation. The CLI executes that authored plan—it is **not an arbitrary-prose-to-finished-film AI model**.

## Earlier technical examples — not the current quality target

The user rejected these prototypes as too far from the railroad reference, including the basic synthetic voice. They remain reproducibility examples only. The [Alexandria film](../projects/alexandria/README.md) is separately authored to a supplied SRT, with no generated replacement VO.

### Watch the earlier examples

- [Railway: full 36.8-second portrait demo](demos/railway.mp4) · [captions](demos/railway.srt) · [editable source](examples/railway/story.json)
- [Space garden: full 17.3-second landscape demo](demos/space-garden.mp4) · [captions](demos/space-garden.srt) · [editable source](examples/space-garden/story.json)
- [Demo export provenance](demos/production.json)

These are intentionally compact **360×640 / 640×360, 15 fps** end-to-end demonstrations. Their source projects target 720×1280 / 1280×720 at 30 fps; export at project defaults for those sizes. They show procedural baseline art and a **basic synthetic English voice**, not the reference's production polish. No reference frames or soundtrack are composited into them.

## Install

From `Animation/`:

```sh
npm ci
npx playwright install chromium
python3 -m venv .venv
.venv/bin/python -m pip install -r story/requirements.txt
export PYTHON="$PWD/.venv/bin/python"
npm test
npm run verify-lock
```

Python is needed only to **generate the default voice**; per-scene supplied English audio can bypass TTS. No cloud key, voice model download or online runtime call. FFmpeg comes from the existing Node dependency or `FFMPEG_PATH`; Chromium can use `CHROMIUM_PATH`. External engine/browser libraries remain install-time dependencies, not Git assets. Full Chrome uses its normal multiprocess renderer; only the Arena `/tmp/chromium` fallback (or explicit `CHROMIUM_SINGLE_PROCESS=1`) enables the sandbox-specific single-process/GL flags. See [third-party notices](../THIRD_PARTY.md).

## Prepare → preview → export

```sh
npm run story -- validate --project story/examples/railway/story.json
npm run story -- prepare --project story/examples/railway/story.json
npm run story -- serve --port 3344
```

Open `/story/engine/index.html?project=/output/story-railway/project.json` on port **3344**. Use the visible play/pause and timeline controls. All browser media URLs are same-origin; server listens on `0.0.0.0` for Arena previews. For the space example, prepare `story/examples/space-garden/story.json` then open `?project=/output/story-space-garden/project.json`.

```sh
# Review a native still and short range first:
npm run story -- render --project output/story-railway/project.json --still 8 --out output/railway-review.png
npm run story -- render --project output/story-railway/project.json --end 3 --out output/railway-test.mp4
# Complete final at the source project's native dimensions and fps:
npm run story -- render --project output/story-railway/project.json --out output/railway-final.mp4
# Optional low-resolution complete animatic:
npm run story -- render --project output/story-railway/project.json --width 360 --height 640 --fps 15 --out output/railway-small.mp4
```

MP4 includes voice + light walking foley + burned captions; an adjacent SRT is also written. Native video exports are not included merely because a native still was rendered. Outputs stay in ignored `Animation/output/`; copy only selected publishable artifacts into an explicit demo/project directory.

Each preparation uses a **fresh output directory**; it refuses to replace a completed one. To revise:

```sh
npm run story -- prepare --project story/examples/railway/story.json --out output/railway-take-two --speed 150
```

`--speed` controls the local eSpeak voice; measure the resulting clip rather than assuming an exact words/minute/duration. Supply each scene's optional `audio` path for another licensed narrator. Caption phrase timing within the measured clip is estimated; review/alignment remains a production task.

## Real tests

```sh
npm test                        # includes story contract, caption/timeline and CLI tests
npm run test:story:browser       # actual TTS + FFmpeg + Chromium; all example scenes; two short MP4 exports
npm run test:browser             # original classroom browser/export regression
npm run verify-lock
```

Browser story tests generate their own examples under ignored output, evaluate **every scene**, check deterministic seeking and changing frames, and encode **one-second** portrait/landscape H264/AAC ranges. The published demo files above are separately rendered **complete** examples. Do not confuse these two claims.

## Already supported vs bespoke production

Working: multiple locations/cast members, code-drawn props, continuous actor/prop paths, expressions/actions, camera target/zoom moves, illustrative 2.5D depth/shadows, local English TTS or per-scene supplied voice, measured scene timing, estimated phrase captions/SRT, absolute-time frame rendering, stills/ranges/full MP4s.

Bespoke work for each story: semantic adaptation, richer environmental dressing, unusual character silhouettes, specific hand/object interactions, advanced action timing, voice acting, fine caption alignment and visual/audio quality review. There is no universal asset synthesizer, arbitrary camera orbit, general physics engine or phoneme-perfect lip sync in this baseline. Extend the unlocked painter/rig system and tests rather than pretending a finite catalog already covers every story.
