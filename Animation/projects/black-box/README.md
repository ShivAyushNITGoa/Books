# Why the black box is orange

A new narrated **9:16 explainer with one continuous camera and no camera cuts**, authored to the user's supplied script. This is a separate production; Alexandria, the older demos and the frozen classroom archive are not replaced.

## Selected delivery

- [Full narrated, captioned MP4](delivery/black-box-continuous-narrated-720p.mp4) — **65.041667 seconds, native 720 × 1280, 24 fps**, H.264 / AAC.
- [Standalone lossless VO](delivery/voiceover.flac) — user-selected AI English narrator, mono 48 kHz.
- [English captions](delivery/captions.srt), [poster](delivery/poster.jpg), [measured production manifest](delivery/production.json).
- [Rendered camera trace](delivery/camera-trace.json) — actual position/target from every exported frame, not just an intended storyboard.

The selected MP4 is explicitly published in Git at the user's request. Intermediate encodes, contact sheets and review images stay in ignored `Animation/output/black-box/`.

## Direction: a connected search diorama

The recorder is the recurring subject of a single travelling demonstration. A physically connected aviation-design/search exhibit contains a workbench, airliner model, animated flight-data and cockpit-audio displays, hypothetical black coating, wreckage, forest patch, two open-water cross-sections, search equipment, a diver, reflective strips, acoustic-beacon visualization and the final traffic-cone/recovery comparison.

The camera dollies along the exhibit, arcs from one side of the recorder to the other, changes height and descends into the underwater demonstration. The hero model travels along the same continuous route. This is an **illustrative diorama**, not a claim that one recorder literally flies through an aircraft accident or an engineered reconstruction of a real crash.

- **No shot selection, camera replacement, teleport, hard transition or full-frame dissolve.** `stateAt()` continuously evaluates the same rig throughout the film.
- One perspective camera, fixed 43° field of view. Position and aim are continuous across every waypoint; velocity eases to zero at held teaching positions.
- Persistent spatial references: hangar pillars, floor rails, expansion grid, orange cable, benches and nearby exhibit stations remain in the same world.
- Dimensional low-poly sets and recorder with illustrated cutout engineers/investigators, rather than realistic 3D people.
- Moving hand gestures, flight-data traces, cockpit waveform, fish, diver fin kicks, water level motion, sweeping light and beacon rings.
- Orange → hypothetical black → orange is a continuous material transition, not a scene cut.
- Readable English captions follow the supplied script, with sentence pauses measured from the selected speech takes. A few long sentences are divided into shorter subtitle phrases.

## Narration and accuracy notes

`script.txt` is the user's full supplied text. Caption tests compare every script word in order. Eight generated source takes are included as FLAC under `assets/narration/`; the mix preserves their **original speaking rate**. Only inter-take pauses and final padding are added; there is no pitch shift or time compression. The voice was selected by the user earlier in this conversation and reused for this request. No reference narration, music, cloned public figure or local eSpeak voice is used here.

This is a simplified explainer, not an avionics design. Real flight-data and cockpit-voice recording functions can be in separate or combined units; the single illustrated recorder represents these functions. Its fasteners, labels, beacon and airliner are original illustrative geometry, not a certified manufacturer's model. Expanding rings visualize **acoustic** locator pulses, not underwater radio reception. Reflective strip glints and search lighting are explanatory animation rather than a photometric simulation.

## Local preview

From `Animation/`, after the bundle's pinned Node dependencies are installed:

```sh
node --input-type=module -e "import {serve} from './tools/server.mjs'; await serve({port:3366,entry:'/projects/black-box/index.html?width=540'}); console.log('Black box preview on port 3366');"
```

Or use the existing server/CLI, then open `/projects/black-box/index.html`. The page supports Play/Pause with VO, seeking and CC. The video export is independent of real-time preview performance.

## Rebuild

Python 3.11+, Node 22, the bundle's pinned Playwright, a Chrome/Chromium install and FFmpeg are required. Set `CHROMIUM_PATH` and/or `FFMPEG_PATH` if they are not installed at the usual locations. No speech API is needed: the selected source takes are bundled.

```sh
# From repository root: assemble original-rate audio, timeline and SRT.
python3 Animation/projects/black-box/tools/audio.py

# From Animation/: render the continuous take at its native delivery size.
node projects/black-box/tools/render.mjs --width 720 --fps 24 \
  --out output/black-box/black-box-clean-720p.mp4

# Mux the narration (video stream copy), validate and package selected delivery.
python3 projects/black-box/tools/finish.py
```

For a review before a full render:

```sh
node projects/black-box/tools/render.mjs --width 540 \
  --review output/black-box/review
node projects/black-box/tools/render.mjs --width 720 --still 41.1 \
  --out output/black-box/review.png
```

`finish.py` performs a full-file decode of video and audio, requires the full frame count/native format, rejects unexpected near-black intervals, measures AAC loudness and true peak, and verifies that muxing did not change the encoded picture bitstream. It checks the **actual rendered frame-by-frame camera trace** for finite values, contiguous times and unexpected position jumps. It also extracts 15 representative finished-video frames into an ignored contact sheet for visual review. The script does not equate these technical checks with artistic reference parity.

## Tests and source

```sh
npm --prefix Animation test
# From Animation/:
node projects/black-box/tests/browser.mjs
```

- `timeline.js`: one continuous camera/hero route and continuous material/atmosphere transitions.
- `set.js`: connected hangar/search diorama, original airliner and recorder, illustrated engineer/investigator art.
- `film.js`: renderer, camera application, absolute-time motion, waveforms, captions, playback/VO controls.
- `timeline.json`: measured narration chapter durations and captions.
- `tools/audio.py`, `tools/render.mjs`, `tools/finish.py`: reproducible assembly/export/validation.
- `../../tests/black-box.test.mjs`: exact script-word retention, every-frame continuity, waypoint continuity, colour and underwater timing, measured chapter coverage.
- `tests/browser.mjs`: real WebGL checks across 15 times, nonblank frames, missing-resource errors, deterministic seek-back, adjacent-frame motion and CC toggle.

Reuses the bundle's local Three.js (MIT), renamed Inter-derived Alexandria Caption font (SIL OFL), deterministic art helpers, diver illustration and static-geometry batching. See `Animation/THIRD_PARTY.md` and `../alexandria/assets/Inter-OFL.txt`. No reference footage is incorporated.
