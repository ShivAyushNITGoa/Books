# The black box — one continuous geographic journey

A substantial recreation after the user's request for a larger, mixed, continuous world and a visibly connected camera journey. The previous separate-location film was a partial improvement; this project replaces its bounded forest, rectangular terrain/water edges and disconnected outdoor plates.

## Film

- [New narrated MP4](delivery/black-box-continuous-geography-720p.mp4): **720 × 1280, 24 fps, 65.041667 s / 1,561 frames**, English VO and captions.
- [SRT](delivery/captions.srt), [poster](delivery/poster.jpg), [final production measurements](delivery/production.json), [actual per-frame camera trace](delivery/camera-trace.json).
- [Detailed analysis, problems caught and design rationale](ANALYSIS.md).
- Exact [supplied script](script.txt), [original narration timing](narration.json), shared [selected English narrator](../black-box/delivery/voiceover.flac). No substituted voice, rewritten text or speed change.

## What is materially different

**One shared 8.5 × 8.4 km geographic heightfield** supplies the land, forest hills, beach, shelf and 40 m seabed. It also supplies normals, roots, bridge supports and camera-clearance measurements. There is no forest platform or square underwater floor. Outdoor locations remain hundreds of metres apart but now have an intervening landscape that connects them visually and structurally.

The regional mixed forest contains **14,821 deterministic trees across seven tree types** in the reviewed build, with coherent changes in density, age, height, moisture and altitude. Forest extends kilometres beyond the wreckage, rather than being a ring planted around it. Broadleaf, conifer, birch, acacia, young growth and weathered snags combine with understorey, rocks, roots and fallen logs. Species counts and world bounds are recorded in the production manifest.

A winding coastline has headlands, coves, natural surf and a continuously submerged shelf. A river/estuary, real raised bridge, road/trail network, shoreline recovery base, lighthouse, boats, moving road vehicles and a complete regional airport help explain where the camera is travelling. Building pads are blended into the terrain; the pier connects to land with a ramp and has supports to the actual bathymetry.

### Camera journey

1. Factory interior → physical doorway → access yard and regional road.
2. Mixed woodland and ridges → wreckage clearing inside the larger forest.
3. Forest edge → headland/coast → search vessel → open-water dive.
4. Seabed → resurfacing → coastal recovery harbour.
5. Harbour → offshore beacon example, revisiting the same ocean geography.
6. Estuary/river bridge → airport approach → final recorder/cone demonstration.

**One camera. No cuts, teleports or picture crossfades. One temporal render sample per frame.** Independent C1 eye/aim curves, a deterministic quaternion travel-orientation field, bounded horizon bank, actual camera-to-terrain clearance, safe focus framing and left/right composition replace the earlier position-only interpretation of continuity. The small orientation inset traces the same physical route during travel; it is not a substitute shot.

Geographic travel is deliberately **time-compressed** to preserve the original 65-second voice track. The film is not a real-time drone flight or an accident reconstruction. Acoustic rings are explanatory graphics, not underwater GPS/radio or literal visible waves.

## Source architecture

This is a multi-module production implementation, not a few added tree props or line-count padding. Read the [analysis](ANALYSIS.md) for the reasoning and [environment/field.js](environment/field.js) for the geographic source of truth.

| Module | Responsibility |
|---|---|
| `environment/field.js` | Elevation, coastline, river, climate, normals, smooth engineering pads |
| `environment/terrain.js` | Connected indexed geometry, preserved biome vertex colours and surface grain |
| `environment/vegetation.js` | Regional mixed populations, corridor exclusion, spatially batched instances |
| `environment/infrastructure.js` | Sampled road/trail ribbons, markings, bridge, route-bound vehicles |
| `environment/water.js`, `atmosphere.js` | Shared sea/river/sky, surf, depth, cloud field and underwater haze |
| `sites/` | Factory, forest evidence, seabed evidence, coastal harbour and airport construction |
| `choreography.js`, `direction/` | Geographic timing, C1 motion, orientation transport, animated cast/props |
| `camera-rig.js` | Smooth framing protection, spherical travel orientation and homogeneous silhouette clipping |
| `ui/overlay.js` | English captions and a geographically correct journey inset |
| `film.js` | Deterministic playback/rendering, actual telemetry and visibility/terrain audits |
| `tools/` | Reproducible export, exact VO mux and final-file QA |

Generic procedural geometry, static batching, local Three.js, the existing OFL caption font and established flat illustrated character drawing are reused. There are no external stock scene images, photorealistic human meshes, remote CDNs, new speech models or runtime API credentials.

## Reproduce

From `Animation/`, with Node 20+, Python 3, `npm ci` and `npx playwright install chromium`:

```sh
npm test
node projects/black-box-journey/tests/browser.mjs
node projects/black-box-journey/tools/render.mjs --width 360 --review output/black-box-journey/review
node projects/black-box-journey/tools/render.mjs --width 720
python3 projects/black-box-journey/tools/finish.py
```

`CHROMIUM_PATH` and `FFMPEG_PATH` can select local executable installations. For playback, run `npm run preview` and open `/projects/black-box-journey/`. All browser resources use relative same-origin URLs. The film player has seek/play/CC controls and plays the original shared narration.

Only the requested final MP4, small poster, telemetry and production measurements are committed. High-resolution intermediates, contact sheets, logs and encoder/browser binaries stay ignored under `Animation/output/`.

## QA and honest review limits

- Unit tests cover exact words/timing, kilometre-scale terrain continuity, winding sea-level coast, unburied river, regional forest extent/species distribution/root grounding, C1 waypoints, every output-frame actual camera angle/position/terrain clearance, framing and character silhouette separation.
- Browser checks raycast actual static geometry and conservative nearby crowns at every full-focus frame; separately inspect all 1,561 camera/terrain positions; render 48 focus/transition/dive/approach poses twice to check seek determinism; check missing resources, captions and adjacent-frame movement.
- The finalizer validates all telemetry frames, maximum camera position and quaternion steps, subject framing and person clearance, then checks the **actual MP4** with full-file video/audio decode, black-interval detection, VO mux picture identity, measured loudness/peak, checksums and representative decoded stills.
- Manual visual review uses contact sheets and representative decoded frames, not an every-frame perceptual watch. No manual audio listening, forced speech alignment or reference-parity claim. Passing engineering checks is not a claim of user approval.
