# The black box — rebuilt staging and cinematography

**This is the replacement for the rejected linear version in `../black-box/`.** The world layout, recorder/carrier, character blocking, camera route and composition system are newly authored. The user's complete script, approved English VO and caption timing are deliberately preserved—not regenerated or sped up.

## Watch / download

- [Rebuilt narrated MP4](delivery/black-box-rebuilt-narrated-720p.mp4) — **65.041667 seconds, native 720 × 1280, 24 fps**, English VO + captions.
- [English SRT](delivery/captions.srt), [poster](delivery/poster.jpg), [measured production manifest](delivery/production.json).
- [Actual rendered per-frame camera/blocking trace](delivery/camera-trace.json).
- [Original selected VO](../black-box/delivery/voiceover.flac), lossless mono 48 kHz. Shared rather than duplicated.

The selected final MP4 is published in Git at the user's request. Full-resolution intermediate encodes and review sheets stay in ignored `Animation/output/black-box-rebuilt/`.

## What changed in response to the four corrections

| Rejected mistake | Rebuilt approach | Regression gate |
|---|---|---|
| Predominantly linear travelling shot | A looping, height-varying recorder route in a compact circular aviation/search pavilion; a separate curved camera path | Both X and Z travel exceed 15 scene metres; continuously interpolated independent paths |
| People appearing to enter the recorder | New, separated blocking; upright yaw-only cutouts with grounded feet; conservative carrier/person volumes **and** projected silhouette-envelope checks | Every delivery frame is checked for physical clearance and zero person/recorder envelope overlap |
| Recorder pinned at screen centre | Independently authored aim points, opposing left/right compositions and broad/close distances | Subject passes both horizontal thirds; normalized X span exceeds 0.65 |
| Camera remaining on one side | Front, back and both ends are authored; camera crosses multiple compass bearings and elevations | Unwrapped viewing azimuth spans more than 360°; distance changes by more than 1.7× |

**One camera, no cuts, no replacement shot cameras and no full-screen transition fades.** Independent C1 Hermite curves drive the recorder, camera and aim. A smooth analytical dolly-back protects the complete carrier, beacon, handle and wheels from cropping **without automatically recentering the object**.

### Additional corrections

- Recorder mounted on a wheeled inspection trolley, not floating through workbenches or people. Rail gauge, wheel contact, curved cross-tie orientation and support heights match the carrier route.
- New four-sided housing, rear markings, end plates, top handle, fasteners, support blocks and beacon, so reverse angles do not expose an unfinished object.
- Smaller equipment labels instead of giant cropped slogan banners.
- Grounded, upright people: camera pitch cannot tilt their feet off the floor.
- Static-set **centre sightline raycasts across all 1,561 frames**, including the transitions—not only the narration chapter midpoints. The final export refuses to begin if a static foreground fixture obscures the recorder's centre. This caught and removed brief tree/aircraft obstructions during review.
- Fish steer around a conservative recorder exclusion zone instead of swimming through its shell.
- Softer daylight, static cached architectural shadows and practical contact shadows.
- Dedicated lower-screen caption protection; full carrier framing is validated at every frame.

## Set and interpretation

The setting is a connected **educational research diorama**: suspended airliner, flight-data and cockpit-audio instruments, inspection equipment, wreckage/forest props, an open-water basin, search lights and traffic cones. The carrier follows a looping demonstration route. It is not a literal reconstruction of a crash or a claim that a recorder actually rides a rail through an accident.

The crash-survivable recorder is illustrative, not a certified manufacturer's mechanical model. Real flight-data and cockpit-voice functions may be in separate or combined units. Expanding beacon rings represent **acoustic** locating pulses, not underwater radio. No film frames, soundtrack, accident footage or new stock media are reused.

Flat illustrated engineers/investigators are retained within the dimensional set; they are not realistic 3D human meshes. Generic drawing helpers, local Three.js, geometry batching and the local OFL font are reused from the bundle. The rejected film's staging and camera are not reused. See `Animation/THIRD_PARTY.md`.

## Preview

From `Animation/`, after installing the bundle's pinned Node dependencies:

```sh
node --input-type=module -e "import {serve} from './tools/server.mjs'; await serve({port:3377,entry:'/projects/black-box-rebuilt/index.html?width=540'}); console.log('Rebuilt preview on 3377');"
```

Play/Pause includes the existing English VO; seeking and CC are supported. Live-preview frame rate depends on the device; the exported MP4 has the fixed delivery frame rate.

## Rebuild and review

Requires Node 22, Python 3.11+, the bundle's pinned Playwright, Chrome/Chromium and FFmpeg. Set `CHROMIUM_PATH` and `FFMPEG_PATH` if required. No speech service is needed: the selected original source takes/mix are already bundled in the previous project.

From `Animation/`:

```sh
# Review 27 story and transition positions before committing to a full export.
node projects/black-box-rebuilt/tools/render.mjs --width 360 \
  --review output/black-box-rebuilt/review

# Native full export. Audits every static centre sightline before frame 0.
node projects/black-box-rebuilt/tools/render.mjs --width 720 --fps 24 \
  --out output/black-box-rebuilt/black-box-rebuilt-clean-720p.mp4

# Validate the actual rendered blocking trace, mux existing VO, fully decode,
# measure audio, and extract finished-video review frames.
python3 projects/black-box-rebuilt/tools/finish.py
```

The finalizer rejects: incomplete traces, non-contiguous frame times, camera jumps, insufficient azimuth/framing variation, character clearance/overlap failures, carrier cropping, wrong native format, missing AAC, unexpected near-black intervals or out-of-bounds loudness. It verifies that audio muxing leaves the encoded picture unchanged. The source hashes and actual delivered metrics are recorded in `delivery/production.json`.

### QA limits

Scene metres are illustrative units. Collision volumes and projected rectangles are deliberately conservative **envelopes**, not per-pixel segmentation. The static ray audit tests the recorder **centre** against opaque set geometry, not every pixel of the frame; normal background/foreground occlusion elsewhere is possible. These automated checks supplement—do not replace—visual review. A passing test does not establish parity with the railway reference or guarantee perfect art direction.

## Tests / source

```sh
# From repository root:
npm --prefix Animation test
# From Animation/:
node projects/black-box-rebuilt/tests/browser.mjs
```

- `choreography.js`: new independent paths, material timing and character placements/clearance volumes.
- `camera-rig.js`: smooth framing safety, projection and homogeneous-frustum-clipped silhouette bounds. Shared by playback, export and tests, so tests do not approximate a different camera.
- `world.js`: newly authored pavilion, mounted aircraft, equipment, supported inspection carrier, complete recorder and illustrated people.
- `film.js`: rendering, absolute-time acting, original VO playback, caption layout and real-scene sightline audit.
- `narration.json`, `script.txt`, `delivery/captions.srt`: unchanged narration words and timing.
- `tools/render.mjs`, `tools/finish.py`: frame export, dense telemetry and complete-file delivery validation.
- `../../tests/black-box-rebuilt.test.mjs`: every-frame physical/projected blocking, composition spread, azimuth/distance variation, framing and path continuity.
- `tests/browser.mjs`: real WebGL review of 27 story/transition positions, all-frame static sightlines, missing assets, deterministic seeking, motion and CC toggle.

Future productions must follow the expanded cinematography/blocking checklist in `Animation/STYLE_GUIDE.md` rather than treating a technically successful encode as a visual-quality approval.
