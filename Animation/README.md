# Animation — locked reference + reusable video kit

The approved **Refined Edition** is preserved unchanged. This folder is a self-contained resource bundle for making new script-driven videos in the same **flat, expressive cartoon-character / dimensional classroom** style.

## Before making the next video

Use the [first-to-latest black-box improvement history and future-production checklist](story/PRODUCTION_LESSONS.md). The user explicitly requested carrying these lessons into future videos **as required by the new script**, not copying this film's settings or treating test passes as artistic approval.

## Current film: The Great Molasses Flood

[Molasses-flood production](projects/molasses-flood/README.md) includes the complete **222⅔-second narrated portrait film**, 41 authored shots across nine original dimensional cartoon sets, English captions, quiet original effects, an [in-depth transcript/production plan](projects/molasses-flood/PLAN.md), and a [historical/editorial ledger](projects/molasses-flood/ACCURACY.md). It applies the latest Dario-led **character and camera** direction together. The two train-derailment lines are conservatively edited to damaged supports and a train stopping short; conflicting accounts and reconstruction limits are documented. Earlier films and locked originals remain unchanged.

## Previous film: Why Ships Have a Strange Bulge Under Their Nose

[Bulbous-bow production](projects/bulbous-bow/README.md) uses the complete supplied **568-word English script** and user-selected narration in a **205.25-second portrait film**. The [actual narrated MP4](projects/bulbous-bow/delivery/bulbous-bow-narrated-720p.mp4) accompanies editable source, English captions and final-file QA. Dry dock, open sea, ripple pond, outdoor design basin, a separate model-testing laboratory and cargo terminal support the explanation. Direction explicitly follows the user's newest correction: **calmer one-sided ship views, no repeated camera circling**, with partial-interference and speed/loading caveats rather than numerical CFD/fuel claims.

## Previous film: Black box — one continuous geographic journey

[Continuous-geography production](projects/black-box-journey/README.md) substantially rebuilds the previous film into one shared **8.5 × 8.4 km land-to-seabed field**, with a regional mixed forest (14,821 trees / seven types in the reviewed build), natural winding coast, river/estuary, connected roads/bridge, coastal recovery harbour and airport. The camera shows the route between places, with horizon/landmark reveals and a small geographic orientation inset. Exact English script and selected narration are retained; travel is explicitly time-compressed, with **no cuts, teleports or picture blending**.

Read the [deep review and design rationale](projects/black-box-journey/ANALYSIS.md). The [previous multi-location film](projects/black-box-locations/README.md) was described by the user as a partial improvement, but its small forest and disconnected terrain plates required further recreation. Earlier [first](projects/black-box/README.md) and [second](projects/black-box-rebuilt/README.md) films remain rejected historical iterations, not approved examples.

## Alexandria — supplied SRT and custom animation

[Alexandria production](projects/alexandria/README.md) is a dedicated 60-second royal-harbour / underwater-exploration animation, not a re-run of the earlier classroom/story prototypes. It preserves the supplied SRT and includes the original silent masters plus a subsequently requested narrated edition. The earlier classroom and railway/space-garden demos are retained as historical technical prototypes, **not accepted visual-quality benchmarks**.

## Story-specific worlds, cast, English voice and captions

The separate [Story World Studio](story/README.md) expands beyond the classroom: custom locations, multiple characters/props, actions/camera, generated English narration, captions and MP4 assembly. Read the [production blueprint](story/BLUEPRINT.md) and [full-runtime railroad reference analysis](story/REFERENCE_ANALYSIS.md). Two complete small demos and editable source are included. The assistant authors/adapts each story; this is not a one-command arbitrary-prose-to-film model. The approved classroom release stays unchanged.

## Approved video and lock

- [Watch/download the approved 30-second MP4](locked/source/public/demo/classroom-scarcity-30s-v2.mp4)
- [Lock policy and reproduction notes](locked/README.md)
- [SHA-256 manifest](locked/manifest.json)
- Original approved source commit: `4f52b6d`. The original video outside this folder is also preserved, so the previously shared link still works.

**Never edit `locked/`.** Create projects in `projects/` and extend `engine/`. `npm run verify-lock` checks the approved bytes and, when present, the original files in the parent repository. The included GitHub workflow also rejects changes to an already-existing locked release relative to its base commit. This is an integrity guard, not a GitHub permission/administrator lock; enable the workflow as a required branch check for merge enforcement.

See the [approved visual contract](STYLE_GUIDE.md) before directing a new script or extending the engine.

## Folder map

```text
Animation/
  locked/                 exact approved source, video, audio, tools + checksum manifest
  engine/                 reusable room, characters, lighting, captions, project validator
    fonts/                Inter + Noto Devanagari and full OFL notices
    vendor/               Three.js r170 + MIT license
    project.schema.json   editor assistance; runtime checks add cross-field validation
  story/                  custom-world blueprint, reference analysis, renderer, TTS, examples + demos
  tools/                  script import, audio preparation, static server, renderer, lock check
  templates/script.txt    editable two-speaker script starter
  examples/curiosity/     20-second portrait, different subject (silent animatic)
  examples/conversation/  16-second landscape, two speakers (silent animatic)
  projects/               your new projects; never overwrite the approved reference
  references/             five supplied images, final.mp4 and ScriptForge prompt text
  tests/                  unit, media, server, integrity and optional browser/export tests
  output/                 generated renders (ignored by Git)
```

Characters, hair, clothes, furniture, glass jars, shadows and wood textures are drawn/generated in code. There are no missing Blender files, remote image/CDN dependencies, API keys or required GrowKaz plugin. The reference images/video are for visual study, not composited into the animation. Runtime dependencies are installed from the pinned package lock; Chromium/ffmpeg binaries are not checked into Git.

## Setup

Node.js 20+ (22 recommended), npm, Chromium and ffmpeg are required.

```sh
cd Animation
npm ci
npx playwright install chromium
npm run verify-lock
npm test
npm run preview
```

Open port **3333** (or use the live preview). The server binds to `0.0.0.0`; client-side assets use same-origin URLs. To choose a different port, append `-- --port 3334` to `npm run preview`.

If browser/ffmpeg downloads are blocked:

```sh
npm ci --ignore-scripts
# Use an already installed executable:
CHROMIUM_PATH=/path/to/chromium FFMPEG_PATH=/path/to/ffmpeg npm run render -- --project examples/curiosity/project.json
```

`FFMPEG_PATH` takes precedence over ffmpeg-static; a system `ffmpeg` is the final fallback. Chromium must match the host OS and have its shared libraries installed. The tested Arena Linux sandbox used `/tmp/chromium` with `LD_LIBRARY_PATH=/tmp/al2023/lib:/tmp`; those temporary paths are **not portable assets**. A normal Playwright browser installation does not need those sandbox-specific variables. The classroom Node pipeline needs no Python; the optional story-world baseline TTS uses Python and `story/requirements.txt`. Archived reproduction tools have separate requirements under `locked/source/render/`.

## Make a video from a new script

### 1. Write the text

Plain text works. To assign dialogue, place `[primary]` or `[secondary]` at the beginning of a paragraph; a tag applies until the next tag. Tags are direction, not spoken or captioned text.

```text
[primary] Why does a good question matter?
[secondary] Because the first answer is not always the whole story.
[primary] So look closer, listen, and stay curious.
```

### 2. Import your narration and optional timed captions

```sh
node tools/cli.mjs init --name my-video \
  --script /path/to/script.txt \
  --audio /path/to/narration.mp3 \
  --srt /path/to/captions.srt
```

Omit `--srt` if you do not have captions yet. Audio is decoded to mono PCM, the **actual audio length** sets the project duration, and a narration-only mouth envelope plus preview MP3 and render mix are prepared locally. No TTS or transcription service is called.

**Timing limitation:** without SRT, captions and speaker-turn timing are approximate word-weighted estimates, not forced alignment. Import an accurate SRT and review/edit actor speech turns for final delivery. Even with SRT, speaker turns inferred from paragraph text need review because ordinary SRT does not identify speakers.

Without audio, use `--duration 45` to create a **silent animatic**. Its mouths simulate speech; there is no synthesized narration. A silent 30-second animatic is the default when neither audio nor duration is supplied.

### 3. Direct the scene

Edit `projects/my-video/project.json`, not the engine or lock:

- Board text, video title, arbitrary duration (up to 1 hour), output dimensions and fps.
- One or two actors with hoodie/waistcoat styles, positions and walking paths.
- Speech turns, emotions, gaze, gesture/phone/book/nod cues.
- Camera position and look-at keyframes.
- Verbatim caption cues and optional quiet Foley events.

See [PROJECT_FORMAT.md](PROJECT_FORMAT.md) for a complete field/action guide. Starter camera/cue generation is a rough first pass, not an automatic cinematographer. Review framing, collisions, speaker assignment and timing before a long render. The frozen cookie demonstration includes its bespoke sampling choreography; generic projects default to no cookie jars. New actions, locations or additional characters need engine extensions rather than new text alone.

```sh
npm run validate -- --project projects/my-video/project.json
npm run preview -- --project projects/my-video/project.json
```

### 4. Rebuild audio after editing Foley

```sh
node tools/cli.mjs prepare --project projects/my-video/project.json \
  --audio /path/to/narration.mp3
```

For a deliberately changed narration length, add `--retime` to scale all caption, speech, movement, camera and Foley times. **Review the scaled timings afterward.** Without that flag, a duration mismatch is an error.

### 5. Render

```sh
# Check a still / short low-resolution section first:
npm run render -- --project projects/my-video/project.json \
  --still 2 --width 360 --height 640 --out output/check.png
npm run render -- --project projects/my-video/project.json \
  --start 0 --end 2 --width 360 --height 640 --out output/check.mp4

# Full-size MP4 + clipped-to-range SRT:
npm run render -- --project projects/my-video/project.json
```

Output defaults to `output/my-video.mp4` plus `.srt`. Frames are rendered offline at exact frame times, not screen-recorded in real time. Audio is muxed when provided; silent projects export without an audio track. Range exports seek narration and rebase captions. Outputs are written atomically, and the CLI refuses destinations outside `output/` so it cannot overwrite `locked/`.

The default is native **1080×1920 / 30 fps**. Landscape **1920×1080** and other even dimensions are supported in the project; preview/render size overrides must preserve the project's aspect ratio. Text uses local Inter/Devanagari fonts. Other writing systems may need an added font; multilingual word timing and phoneme-level lip sync are not automatic.

## Preview or re-render the approved scene

```sh
npm run preview -- --locked
npm run render -- --locked --still 16 --out output/approved.png
npm run render -- --locked --out output/approved-rerender.mp4
```

This preview is the exact frozen source, not a generic recreation. The included lossless approved mix is used for re-rendering. The authoritative approved MP4 is included; re-encoding need not reproduce identical video bytes. See `locked/README.md` before using archived rebuild scripts.

## Save/share projects

Only `projects/*/media/` and generated `output/` are ignored by default; project JSON and script text are eligible for Git. If publishing a new project, intentionally include its media (`git add -f projects/my-video/media`) or document its external storage. Do not publish private scripts/narration accidentally. The preview server has **no authentication** and exposes public bundle/project assets; do not use it as a private media host.

Copying this entire `Animation/` folder is sufficient for the included engine and examples after installing declared dependencies. It does not depend on the old Next.js app, PostgreSQL, the rest of the repository or files under `/tmp`.

## Verification

```sh
npm test                         # dependency-free Node tests, including lock hashes
npm run verify-lock
npm run test:browser              # requires installed Chromium + ffmpeg
```

Tested: different text and 3/16/20-second durations, two speakers, both portrait and landscape, narration/SRT import, envelope generation, playback/seek, deterministic generic frames, a short H.264/AAC export with rebased SRT, frozen-scene preview and refusal to overwrite protected output paths. [THIRD_PARTY.md](THIRD_PARTY.md) describes bundled licenses and reference attribution.
