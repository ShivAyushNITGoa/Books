# Why Ships Have a Strange Bulge Under Their Nose

A complete **205.25-second narrated portrait film** using the user's entire supplied English script (568 body words). The new direction deliberately avoids the previous film's repeated object-centred camera journeys: explanations are held from one side, with purposeful travel between actual outdoor and indoor settings.

## Review revision

The current film incorporates the user's requested corrections: a **smaller single-piece bulb**, restored outward-facing hull plating and a **higher-riding ship**, a lab floor physically separated from the terrain to remove depth flicker, and more active wakes, sea response, pond impacts and testing machinery. English VO, full script and duration are unchanged. See [the changes, geometric causes and regression checks](REVISION.md).

## Delivery

- [Watch/download the narrated film](delivery/bulbous-bow-narrated-720p.mp4) — H.264/AAC, **720 × 1280, 24 fps, 4,926 frames**.
- [English captions](delivery/captions.srt), also burned into the video.
- [Selected English voiceover](delivery/voiceover.flac), [poster](delivery/poster.jpg), [delivery measurements](delivery/production.json).
- [Original full script](script.txt), [caption/chapter timing](narration.json), [direction and review notes](DIRECTION.md).

The MP4 is the finished deliverable; the browser animation is editable production source, not a replacement for an exported video. The final-file production manifest is written by `tools/finish.py` only after successful mux, full decode, audio measurement and frame-count checks.

## Story and staging

| Programme time | Explanatory action |
|---|---|
| 0–29 s | A dry-docked cargo ship exposes the apparent design mistake below its bow. Camera descends within the excavated dock, then rises to leave. |
| 29–64 s | The moving ship displaces water; bow-wave energy is linked to engine work. Calm starboard bow views, not a turntable. |
| 64–85 s | One descent below the waterline reveals the bulb, with illustrated flow tracers. |
| 85–105 s | Bow and bulb wave components are shown separately and combined; cancellation is partial. |
| 105–120 s | Two sources in a real outdoor ripple pond demonstrate superposition. |
| 120–157 s | An outdoor model-design basin connects efficiency with speed/loading and contrasts matched and off-design conditions. |
| 157–176 s | Camera enters an actual separate naval laboratory, where a carriage tows a miniature model and screens show schematic measurements. |
| 176–187 s | Travel past a working cargo terminal connects many voyages with operating economics. |
| 187–205.25 s | Return to the ocean for the final wave-maker reveal, then a short ending hold. |

This is a continuous, time-compressed geographic journey, not a real-time shipyard flight. Two full-size ships occupy the dry dock and ocean; **only miniature models** are in the model-testing facilities. People use the established flat illustrated character drawing on upright billboards, not full 3D human meshes.

## Physical explanation: scope and limitations

The waves are **dimensionless teaching schematics**, not a hydrodynamic simulation. Opposed sinusoidal components illustrate how one part of a wave system can weaken another. The result is not completely flat. A phase/amplitude mismatch illustrates why an off-design bulb may increase resistance. No numerical fuel-saving percentage, measured towing force, Reynolds/Froude equivalence or CFD accuracy is claimed. Real ship wave fields, viscous effects and optimisation are more complex than this explanatory model.

The pond analogy is explicitly an analogy, not a literal hydrodynamic model of a translating ship. Underwater flow lines are illustrative tracers. The entire supplied script is retained; explanatory disclaimers supplement it rather than rewriting its narration.

## Source map

- `assets/ship.js`: parametric hull bands, bulb, deck, bridge, containers, fittings, propeller and miniature variants.
- `environment/geography.js`: shared coastal terrain/seabed, excavated dock, garden grading and regional trees.
- `environment/facilities.js`: dock engineering structures, pond garden, outdoor basin, separate tow-tank building and cargo terminal.
- `environment/waves.js`: ocean/bow wave shaders, two-source pond surface, model-basin waves and underwater tracers.
- `environment/atmosphere.js`: daylight and smoothly changing underwater visibility.
- `direction/`: chapter timing, independently authored eye/aim rail, smooth quaternion orientations and portrait feature-framing protection.
- `world.js`: deterministic world assembly, illustrated cast, carriage/model movement and animated research screens.
- `ui/overlay.js`: English captions, feature leaders and compact wave/energy/operating-condition schematics.
- `film.js`, `index.html`: deterministic canvas playback, audio controls and camera telemetry.
- `tools/prepare_audio.py`: original selected-take assembly, loudness normalisation and speech-activity/word-weight captions.
- `tools/render.mjs`, `tools/finish.py`: actual frame export, narration mux and final-file QA.

Shared local dependencies are referenced, not duplicated: bundled Three.js, the OFL caption font, static geometry batching, established illustrated character drawing and the local preview/media tooling. No stock imagery, external CDN or credentials are required to play the film source.

## Reproduce

From the repository root, install the existing `Animation` Node dependencies and a compatible Playwright Chromium. FFmpeg is resolved by the repository media helper; Python finishing accepts `FFMPEG_PATH`.

```sh
node --test Animation/projects/bulbous-bow/tests/production.test.mjs
node Animation/projects/bulbous-bow/tests/browser.mjs

# Optional: rebuild the unchanged selected voice from its eight source takes.
python3 Animation/projects/bulbous-bow/tools/prepare_audio.py

# Representative review images (ignored intermediates).
node Animation/projects/bulbous-bow/tools/render.mjs \
  --width 360 --review output/bulbous-bow/review

# Full-resolution rendered picture, then narration and delivery QA.
node Animation/projects/bulbous-bow/tools/render.mjs \
  --width 720 --out output/bulbous-bow/bulbous-bow-clean-720p.mp4
python3 Animation/projects/bulbous-bow/tools/finish.py

# Preserve the approved original projects.
node Animation/tools/verify-lock.mjs --strict-originals \
  --base 56c4e7e98603309e453fc675241c1b9012113e84
```

The sandbox's compatible Chromium needs `CHROMIUM_PATH=/tmp/chromium` and `LD_LIBRARY_PATH=/tmp/al2023/lib:/tmp`; those temporary runtime paths are not project dependencies. On a normal installation use Playwright's installed browser instead.

For browser playback, run the existing animation preview server and open `/projects/bulbous-bow/index.html`. Rendering is deterministic and supports arbitrary seek times, caption toggling, review stills and start/end ranges. Intermediate videos, raw PCM, screenshots and telemetry stay in ignored `Animation/output/bulbous-bow/`, not Git.

## Review honesty

Automated tests check the complete script/caption text, timing, interference teaching model, dry-dock/terrain clearance, portrait feature framing and lack of ship-circling over every delivery frame. Browser review checks representative poses and catches JavaScript **and shader compilation** errors. Final finishing checks decode, black intervals, frame count, picture-stream preservation and narration loudness. Representative rendered images were visually inspected; this is not a claim of manual listening, human review of every frame or parity with the supplied railway reference.
