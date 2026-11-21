# Scarcity & Attraction — Refined Edition (v2)

This is a new 30-second cut of the same English narration, not a new topic. The user-approved `classroom-scarcity-30s.mp4` and its original classroom scene are preserved for comparison. The design remains two flat, expressive cartoon figures with stick limbs in one persistent dimensional classroom; there are no slides or location changes.

## Substantive changes from v1

### Acting and facial timing

- Mouth opening is driven by a measured 60 Hz RMS envelope of the **narration**, rather than a repeating sine wave throughout each speaker's entire turn. Silence closes the mouth. The synthesized Foley is excluded from the envelope.
- Separate worried, curious, neutral and happy face states; an acknowledgment nod during the result, eye direction toward the phone/book, and blinks that do not permanently close the happy character's eyes.
- Gestures interpolate into and out of their poses instead of abruptly appearing. Walk cycles ease into travel and settle on arrival; a small observational step-back gives the demonstrator space.
- The friend takes a different path at the end so their head no longer sits directly behind the foreground reader's head.

This is **amplitude-driven cartoon speaking**, not phoneme-level lip sync or motion capture.

### Prop continuity

- The world-space phone follows the character's drawn hand, tips down and settles on the side desk; there is no separate sprite phone disappearing as a duplicate desk phone appears. The screen has a simple local chat texture.
- One thin, articulated world-space stick arm permits the flat explainer to reach the dimensional jars. The hand, lid and cookie use a shared deterministic action track: lift lid, set it down, reach into the jar, show a cookie, return it and replace the lid.
- The actual desk book moves into the reader's hands and a physical paper surface turns near the end, instead of a book graphic suddenly appearing over the torso. This is stylized cartoon prop animation, not a full fixed-length-body physics simulation.

### Camera and staging

- Monotone cubic Hermite interpolation gives C1-continuous position and target paths without the old per-keyframe start/stop behavior or interpolation overshoot.
- Reblocked close-ups and two-shots, with a study insert that includes the two jars and the complete explainer's face, rather than two half-faces at the edges.
- Focal face bounds are tested at phone, demonstration and reading shots. Background subjects can leave the frame as attention changes.
- Character quad size and vertical anchoring are corrected so the drawn feet meet the floor; walking/breathing retains a small stylized body bob.

### Rendering and readability

- Native **1080×1920** scene raster and text composition, rather than rendering a 720×1280 frame and upscaling it. Character canvases are now 1024×1536.
- Lower exposure, less saturated timber materials and a more balanced fill/key combination keep the warm-room look without washing out cream faces. Character ink/fill colors are no longer altered by the environment's tone mapper.
- Cleaner, shorter world-space chalkboard wording. Caption size increases from 55 to 59 logical pixels, while retaining safe-area fitting, the local heavy Inter font, and dark outlined cream letters.
- A two-line closing sentence is held briefly over the reading/page-turn payoff. No static logo card or end-slide replaces the room.

### Sound

- Existing English voice-over is unchanged.
- Quiet, deterministic procedural Foley: two muted phone vibrations, footsteps, wood taps for phone/lid handling and paper rustle. No third-party recordings and no music bed.
- Effects sit well below narration, are mildly ducked under it, and the mix retains approximately 1 dB of peak headroom before AAC encoding.

## Files

- New MP4: `public/demo/classroom-scarcity-30s-v2.mp4`.
- Poster, downloadable SRT and interactive-preview MP3 share that basename.
- Interactive world: `/classroom-v2/index.html`.
- Source: `public/classroom-v2/world.js`.
- Generated mouth envelope: `public/classroom-v2/voice-envelope.json`.
- Audio build: `render/polish_audio.py`; lossless intermediate mix is in ignored `renders/`.
- Browser regression test: `render/test-classroom-v2.mjs`.

## Reproduce

Run commands from `psychology-of-human-attraction/`, with the Next.js studio running at port 3000:

```sh
python3 -m pip install -r render/requirements-audio.txt
python3 render/polish_audio.py
# The interactive MP3 is already included; to regenerate it:
node_modules/ffmpeg-static/ffmpeg -y -i renders/classroom-v2-mix.wav \
  -b:a 160k public/demo/classroom-scarcity-30s-v2.mp3
node render/stickworld.mjs --refined --preview
node render/test-classroom-v2.mjs
node render/stickworld.mjs --refined
```

Set `CHROMIUM_PATH` when using an external Chromium executable; the sandbox installation also requires `LD_LIBRARY_PATH=/tmp/al2023/lib:/tmp`. `STUDIO_URL` can override the world URL for export. All 900 frames are rendered at their exact frame times, regardless of interactive-preview playback speed.

## Verification

- Browser preflight passed: native canvas size, constant scene object count, foot anchor, speech/silence envelope behavior, phone and cookie phases, focal face bounds, deterministic random-access seeking, within-shot motion, walking, play/pause, no page exceptions, and studio asset registration.
- At 6/16/26 seconds, the focal faces fit inside the portrait frame; this is a composition check, not a claim that every background object is always visible.
- Export duration, stream properties, audio peaks and extracted-frame review are checked after encoding.

### Completed MP4 checks

- 30.00 seconds; 900 decoded frames; native 1080×1920 at 30 fps.
- H.264 High video and AAC 48 kHz mono audio; fast-start MP4; 13,273,068 bytes (13.3 decimal MB).
- Encoded audio mean −18.0 dBFS, maximum −1.0 dBFS; no clipping detected.
- Reviewed eight frames extracted from the encoded MP4 at 2, 6, 11.6, 13.6, 16, 20, 24 and 28.5 seconds.
- Final browser regression tests pass, including deterministic seeks during both attached-phone and sampled-cookie shots. TypeScript and JavaScript checks pass.
- Previous classroom and Stickworld videos are unchanged. The refined edition is first in Demo Videos, with a new reading-pose poster and its own download links.
