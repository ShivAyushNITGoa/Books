# Alexandria — Beneath the Mediterranean

A dedicated **60-second, 9:16 animated film** directed to the user's supplied English SRT. This is a new authored production, **not** the classroom renderer or the two rejected generic story demos. The approved/frozen classroom files remain unchanged as an archive, not a claim that they satisfy the newer quality target.

## Deliverables

Selected finished exports belong in `delivery/`. At the user’s request, the complete [captioned MP4](delivery/alexandria-captioned-720p.mp4) is published in GitHub alongside the source, exact SRT, poster and production manifest. The larger clean picture master remains a downloadable workspace artifact, ignored by Git.

- `alexandria-clean-720p.mp4`: clean picture master, **720 × 1280, 24 fps, 60 seconds**, **no audio track**. Native render, not an upscaled low-resolution animatic. Ready for the user's VO/edit.
- `alexandria-captioned-720p.mp4`: same animation with the supplied English captions burned in; **no audio track**.
- `captions.srt`: exact supplied 15 cues, each four seconds; wording and line breaks retained. The escaped `--&gt;` separators have been decoded to normal SRT `-->`.
- `poster.jpg` and `production.json`: selected frame and measured export/validation provenance.

The original clean and captioned editions remain **silent and unchanged**. At the user’s subsequent request, a separate **AI-narrated edition** is now included; no music or reference soundtrack is added. A future supplied VO can still be aligned to this 00:00–01:00 timeline without re-rendering the animation.

## Narrated edition (subsequently requested)

- [Watch/download the complete narrated MP4](delivery/alexandria-narrated-720p.mp4): same captioned picture, with English narration from the user-selected voice. **60 seconds, 720 × 1280, 24 fps, AAC mono 48 kHz**.
- [Standalone lossless VO](delivery/alexandria-voiceover.flac), ready to use in an editor.
- [Measured narration manifest](delivery/narration-production.json): source hashes, explicit per-cue trim boundaries, tempo adjustments and output measurements.

The script preserves every caption word; `1992` is spoken as “nineteen ninety-two.” Each of the 15 narration passages occupies its corresponding four-second caption window. Longer passages use pitch-preserving tempo adjustment (up to about 1.29×); shorter passages retain their natural rate with pauses. Source speech is not recreated by eSpeak or copied from the reference.

Rebuild the mix with Python 3.11+ and FFmpeg (or set `FFMPEG_PATH`):

```sh
python3 Animation/projects/alexandria/tools/add-voiceover.py
```

The build fully decodes the result, requires 1,440 video frames, checks encoded-picture SHA-256 equality against the silent captioned master and measures the AAC track’s loudness/true peak. The selected generated source takes are included as FLAC in `assets/narration/`; no speech service or credentials are needed to rebuild the mix. Measured delivery: **−16.05 LUFS integrated, −1.39 dBTP**. These are technical checks, not a claim of matching the reference narrator’s performance.

## Art and animation direction

- **Characters:** pale round illustrated faces and thin dark limbs, not realistic 3D human meshes. Cleopatra has a custom black wig, gold/teal diadem, collar, linen dress, jewelry and independent hand/face animation; attendants/guards have different costumes and props. Divers have articulated fin kicks, masks, tanks, hoses, torches and survey equipment.
- **Above-water set:** a dimensional royal harbour with fluted columns, cornices, carved relief panels, pediment ornament, mosaic paving, stairs, balustrades, Pharos-inspired lighthouse, side temples, city roof layers, cargo/amphorae, mooring ropes, palms, rigged ships and wind-deformed cloth.
- **Disaster:** branching fissures opening across the quay, continuous district subsidence, rougher shader-displaced sea, coastal spray/foam, rain, staged camera shake, a camera move through sea level, independently pivoting fallen columns, drifting debris/silt.
- **Underwater:** persistent ruined geography, monumental carved statuary, a toppled head, fallen columns/lintels, foundations, recovered relief slab, amphorae, coral/seagrass, fish/tail motion, suspended particles, bubbles, surface rays, moving caustics and sweeping dive-torch illumination.
- **Camera:** 15 authored four-second sequences, including close royal reveal, harbour establish, portico track, ground-level warning, storm view, sea-level descent, collapse, elapsed centuries, dive entry, monument reveal, survey close-up, restored-world recollection and final pullback.

The illustration is an artistic reconstruction, **not a surveyed archaeological model**. The sinking montage compresses a long, complex history. Cleopatra is deliberately absent from the quake/submergence shots so the sequence does not assert she witnessed those events. The relief art is newly generated decorative set texture, not a photograph of an actual recovered artifact. See `assets/README.md`.

## Preview

From `Animation/` with the existing Node dependencies installed:

```sh
npm ci --ignore-scripts
# If needed, install a browser or set CHROMIUM_PATH to an installed Chromium/Chrome.
# Also supply FFMPEG_PATH or install ffmpeg for exports.
node tools/cli.mjs serve --port 3333
```

Open `/projects/alexandria/index.html` on the preview server. The default preview is 1080 × 1920, with captions. Append `?width=720&height=1280` for native-delivery review, or `&captions=off` for a clean picture preview. Play/pause, seek and CC controls are below the film. It is intentionally silent.

The server binds to `0.0.0.0`; runtime assets and URLs are local/same-origin. No CDN, cloud TTS, API key, downloaded character rig or missing plugin is required.

## Reproduce the export

```sh
# Still / all 15 shot midpoints (review only, not a full video):
node projects/alexandria/tools/render.mjs --width 720 --still 6 --out output/alexandria/royal-review.png
node projects/alexandria/tools/render.mjs --width 540 --review output/alexandria/shot-review

# Short range, then complete clean master at native delivery resolution:
node projects/alexandria/tools/render.mjs --width 720 --fps 24 --start 20 --end 22 --out output/alexandria/storm-test.mp4
node projects/alexandria/tools/render.mjs --width 720 --fps 24 --captions off --out output/alexandria/alexandria-clean-720p.mp4

# Fast caption pass on the completed clean master:
node projects/alexandria/tools/burn-captions.mjs

# Or a separate full render with captions:
node projects/alexandria/tools/render.mjs --width 720 --fps 24 --out output/alexandria/alexandria-captioned-720p.mp4

# Validate complete native files and move selected masters into local delivery/:
node projects/alexandria/tools/finalize.mjs

# Tests:
node --test projects/alexandria/tests/timeline.test.mjs
node projects/alexandria/tests/browser.mjs
npm test
npm run verify-lock
```

The renderer supports `--width 1080 --fps 30` for a more expensive export. **Do not describe a 1080p preview or still as a completed 1080p video.** The selected delivery exports above are 720p/24 fps. Software WebGL rendering in a two-core sandbox is slow; full frame export takes substantially longer than a short test.

Set `CHROMIUM_PATH` / `FFMPEG_PATH` if binaries are not in the normal dependency/system locations. The Arena fallback `/tmp/chromium` also needs `LD_LIBRARY_PATH=/tmp/al2023/lib:/tmp`; those temporary OS files are not bundled production resources.

## Source map

| File | Responsibility |
| --- | --- |
| `timeline.js` | Exact 60-second shot list, camera paths and physical chronology |
| `film.js` | 3D scene, lighting, animated water/atmosphere, performance staging, captions, playback/export API |
| `set.js` | Individually authored ancient harbour, ruin set, boats, artifacts, characters and equipment |
| `art.js` | Seeded material textures and bespoke animated cutout rigs |
| `batch.js` | Static geometry batching, preserving real depth-tested geometry and dynamic pivots |
| `captions.srt` | User's authoritative English text and timing |
| `tools/render.mjs` | Native still/range/full MP4 export; no audio/TTS path |
| `tools/burn-captions.mjs` | Burn exact captions into a completed master without re-rendering 3D |
| `tools/finalize.mjs` | Complete-file decode/frame/format/no-audio checks and deliberate selected-artifact publication |
| `tests/` | Timing/chronology/shot contracts plus real-WebGL 15-shot review smoke test |

Review is visual as well as technical: every shot midpoint, transition/destruction ranges, exposure, actor proportions/framing, first/last frames and final full-file decode. Passing tests is not a substitute for an audience's judgment of visual quality or evidence of parity with the railway reference.
