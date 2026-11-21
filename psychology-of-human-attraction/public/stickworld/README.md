# Stickworld — single-set 2.5D animation

Open `/stickworld/index.html` in the studio website. Play, pause and scrub the 30-second scene; audio is the existing English Scarcity & Attraction narration.

This is a replacement visual direction, not a filter on the old host: two circle-head, line-limb stick figures on one persistent perspective-room set. The scene uses Canvas paths, soft shadows, shaded furniture and a camera transform. There are no slide transitions, floating chapter cards, human body meshes, or external plugin dependencies. Screen-space elements are limited to branding and subtitles.

## Blocking

- 0–8s: establish the room, move in towards the phone user; blinking, mouth movement and phone-hand motion.
- 8–14.5s: the teal figure walks to the table; the coral figure explains and gestures towards the cookie jars. A cookie moves from the jar towards their hand.
- 14.5–19s: camera moves closer to the two jars and the speaking figure.
- 19–25.5s: camera widens; teal answers with an open-hand gesture and walks away from the phone towards the book; coral shifts position.
- 25.5–30s: settle into the same room, with breathing and facial movement continuing. The set never changes.

Mouth motion is a stylized speaking cycle, not phoneme-level lip sync. The narration and cookie-jar study attribution are preserved from the earlier demo; the study tests cookie desirability, not human romantic attraction.

## Rendering

Run the studio at port 3000, then:

```sh
node render/stickworld.mjs --preview
node render/stickworld.mjs
```

`CHROMIUM_PATH` may select a locally installed Chromium. `STUDIO_URL` may override `http://127.0.0.1:3000/stickworld/index.html`. The sandbox Chromium also needs `LD_LIBRARY_PATH=/tmp/al2023/lib:/tmp`.

The exporter calls `window.setT(frame/30)` for all 900 frames, then encodes H.264/AAC with ffmpeg-static. Art is drawn at 720×1280 and upscaled to 1080×1920 for the MP4. Output: `public/demo/stickworld-scarcity-30s.mp4`. Preview images go in ignored `renders/`. The downloadable SRT retains the original verbatim narration; burned-in captions condense a few phrases for readability.
