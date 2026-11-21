# Black box — five distant locations, one continuous camera

Replacement for **both rejected black-box iterations**, specifically correcting the second version's single-room geography. A forest and underwater exhibit inside a hangar is **not** an acceptable substitute for separate story locations.

## Delivery

- [Narrated 720 × 1280 MP4](delivery/black-box-multilocation-narrated-720p.mp4), 65.041667 s, 24 fps, 1,561 frames, English captions.
- [Captions](delivery/captions.srt), [production measurements](delivery/production.json), [poster](delivery/poster.jpg), [actual per-frame camera trace](delivery/camera-trace.json).
- Exact supplied [script](script.txt), original [narration timing](narration.json), and shared [selected narrator](../black-box/delivery/voiceover.flac). No replacement voice or rewritten script.

## Genuine geography

All coordinates are metres in **one continuous world**, not alternate props inside a common room. Five recorder examples exist at their respective sites throughout; they are not teleported on a hidden carrier. The forest and ocean illustrate alternative hypothetical crash conditions, not a single aircraft crashing twice.

| Site | X / Z | Environment |
|---|---|---|
| Factory | 0 / 0 | Enclosed engineering room, roof, walls, workbench, electronic testing rigs; camera leaves through open vehicle door |
| Remote forest | 420 / −180 | Outdoor forest, irregular terrain, trees, scattered aircraft wreckage, ground search crew; no roof/walls |
| Open ocean | 1180 / 320 | Open water, offshore search vessel, continuous dive to seabed, wreckage, fish and acoustic locator illustration; no tank/glass/room |
| Recovery pier | 835 / 760 | Outdoor coastal pier, access ramp, rescue base and boat; orange/reflection demonstration |
| Airport | 130 / 650 | Separate outdoor apron/runway, control tower, traffic cones, departing aircraft |

Every pair is more than 400 metres apart. The sea surface extends 8 km. Only the factory is indoors. Terrain, shoreline and sky remain visible during aerial travel. The camera returns offshore for the underwater acoustic-beacon sentence, then travels overland to the airport.

**No cuts, teleports, full-screen fades or replacement shot cameras.** One fixed-FOV camera follows continuous C1 shape-preserving cubic eye/aim paths. Long travel is deliberately time-compressed to retain the existing 65-second narration; it is not real-time aviation or a physically plausible camera-drone speed. A second temporal exposure during travel samples that same moving camera (not a crossfade between locations). Important close views use gentle focus-weighted dolly protection without centre-pinning.

## Retained corrections

Independent eye/aim paths give left/right composition, elevation changes and front/rear/end views. Flat illustrated people remain upright, with grounded feet and procedural gestures/blinks; no realistic 3D human meshes. The full recorder is authored on all sides. World-space clearance and conservative projected character/recorder silhouette tests prevent apparent intersections. Factory screens are separate from the hero and show flight-data/cockpit waveforms.

The locator rings are an **explanatory acoustic-wave visual**, not underwater GPS, radio or visible light. Aircraft/wreckage are generic non-graphic illustrations, not a specific accident reconstruction or certified equipment model.

## Run / reproduce

From `Animation/`, after `npm ci` and `npx playwright install chromium`:

```sh
npm test
node projects/black-box-locations/tests/browser.mjs
node projects/black-box-locations/tools/render.mjs --width 360 --review output/black-box-locations/review
node projects/black-box-locations/tools/render.mjs --width 720
python3 projects/black-box-locations/tools/finish.py
```

Use `CHROMIUM_PATH` / `FFMPEG_PATH` when executables are outside the normal installation. For playback, `npm run preview`, then open `/projects/black-box-locations/`; Play uses the original shared voiceover, and CC toggles captions. Browser assets use same-origin relative URLs.

## QA scope and limits

- Node regressions: exact script/VO timing/captions, pairwise geography, only-one-indoor-site, continuous eye/aim velocity at every key, all delivery-frame focus composition, character clearance and silhouette checks (including travel), multilateral views, camera exits through factory door rather than roof/walls.
- Browser regressions: static centre-sightline raycasts for **every full-focus delivery frame**, representative rendered focus/transit/dive/return poses, deterministic seeks, motion, caption toggle and missing-asset errors. The recorder is intentionally not required on screen during long geographical transit.
- Finalizer: 1,561 ordered telemetry frames; focus framing and character checks; actual camera steps and per-site azimuth; full-file video/audio decode, black-interval detection, stream identity through VO mux, loudness/peak measurement, checksums and representative stills from the **actual final MP4**.
- Manual visual review is representative frames/contact sheets, not an every-frame perceptual watch. No manual audio listening, forced speech alignment or railroad-reference visual-parity claim. Automated gates are not a substitute for artistic approval.

Native-size intermediate encodes, reviews and logs remain ignored under `Animation/output/black-box-locations/`; only the requested final film, poster, trace and measurements are committed.
