# Reference analysis and revised 30-second demo

## Sources examined

- Five user-provided classroom stills (`image-1.png` through `image-5.png`).
- `ShivAyushNITGoa/Books`, `main:final.mp4`: 38.27 seconds, 1080×1920, 30 fps, H.264/AAC. Downloaded with the GitHub API into ignored `renders/reference/` for inspection, not duplicated in Git.
- Examined samples across the video at roughly three-second intervals, plus a nine-frame sequence from 9–12 seconds. This analysis concerns visual style, not a transcription of its narration.

## 1. Character construction

These are not anatomically proportioned human models, nor bare line-only stickmen. They are **cartoon cutouts with stick limbs**:

- Very large, nearly circular pale heads; head plus hair occupies roughly two-fifths to one-half of a standing figure's visible height in the supplied stills. Seated framing makes the head appear even more dominant.
- Dark brown/near-black outlines, with heavier silhouette contours and finer facial details. Rounded strokes avoid the appearance of a mechanical skeleton.
- Large white oval eyes with small dark pupils. Eye outlines remain clearly separate from the face. Eyebrows communicate anxiety, anger or reassurance independently of the eyes.
- A mouth that changes shape substantially: open O, broad grin with pale teeth and dark interior, closed smile, or clenched rectangular teeth. Reaction shots prioritize expression over anatomical realism.
- Flat scalloped brown hair or a simple dark cap-like side part. Hair shape and clothing color identify characters across camera distances.
- Simple graphic torsos: teal hoodie, mustard waistcoat, blue pajamas. Clothes have only a few identifying details (strings, pocket, buttons, bow tie); there is no realistic chest, muscle, hand or finger anatomy.
- Thin dark arm/leg strokes ending in small oval hands/feet. Poses such as hands at the head, raised fist, open palm and hanging shoulders are readable silhouettes.
- Small graphic emotion accents: sweat drop, thought dots, colored angry face. These should support a specific reaction rather than decorate every frame.

**Revision:** cream face, outlined oval eyes, scalloped hair, teal hoodie and mustard waistcoat; line limbs; independent eyebrows, blink, pupil direction, worried O mouth, speaking cycle and relieved smile. No full human body mesh.

## 2. Environment and material language

The classroom stills obtain most of their depth from the room, not the characters:

- Dimensional desks have a top, apron, thickness and dark legs; papers/pencils sit on the top surface.
- Wooden floors have visible plank divisions and long grain. Lower walls use warm horizontal paneling; the green board is framed in wood.
- The board, clock, desks and wall establish stable room landmarks. Repeated desks create foreground, middle-ground and background layers.
- Warm amber/orange illumination is contrasted with green/blue-gray areas. The shared MP4 changes palettes between bedroom, explanation and meeting scenes, but retains pale outlined cutout faces.
- Long directional shadows, bright floor patches, shaded furniture faces and diagonal light shafts are major depth cues.
- Texture is simplified and somewhat stylized rather than photorealistic. It should not overpower a character's facial contours.

**Revision:** one actual dimensional classroom with procedural wood textures, desks in multiple depth layers, a permanent study board and clock, a blue window, warm directional light, furniture shadows, projected cutout shadows and restrained light shafts. Character artwork stays flat.

## 3. Camera and composition

- The reference stills range from a face/torso close-up to rows of desks and a wide classroom view. Characters can occupy very different screen sizes while the furniture anchors their location.
- A close-up is motivated by emotion; a wider view is motivated by another character reacting or the room becoming relevant.
- The shared MP4 includes multiple sets, explanation panels and transitions. The 9–12 second sample moves across the illustrated explanation layout. Those panels are NOT a pattern to reproduce here, because the user's explicit direction is a single room and no slideshow.

**Revision:** perspective camera dolly/pan between an establishing view, worried phone-user close-up, two-character study setup, jar detail, two-shot and relieved reading payoff. Real parallax comes from 3D room geometry. There are no moving scene-sized cards, chapter slides or room replacements.

## 4. Acting and timing

A still image cannot prove a full motion cycle. Across the sampled video frames, facial state, hand pose, framing and location vary. The useful principle is to make those changes motivated and readable rather than merely move the camera over a static drawing.

**Revised blocking, on the existing English Scarcity & Attraction narration:**

| Time | Action in the same room | Camera motivation |
| --- | --- | --- |
| 0–4s | Hoodie character worries, checks phone, raises a hand to the head; brows, pupils and mouth react | Establish room, dolly toward reaction |
| 4–8s | Phone-checking hand motion and impatient sway; puts phone on side desk | Hold attention on the behavior |
| 8–11s | Walks to the demo table; waistcoat character begins explaining with raised hands | Widen/pan to include study props |
| 11–17.6s | Scarce jar lid opens; one cookie is sampled and shown in the explainer's hand | Move closer to the real jars |
| 17.6–21.3s | Explanation resolves; hoodie character answers with an open-hand gesture | Return to a two-shot |
| 21.3–25.3s | Hoodie character walks across the room toward the book desk | Follow the moving figure |
| 25.3–30s | Holds an open book, relaxes into a smile; idle motion continues | Settle into the payoff framing |

Speaking-mouth animation is a stylized amplitude cycle, not phoneme-accurate lip sync. The camera and poses are smooth, absolute functions of time, so offline export does not drop motion frames.

## 5. Caption treatment

The stills use heavy white/light lettering with a thick nearly-black outline, centered in the lower portion of the frame. Captions appear in short phrases, not paragraph cards.

**Revision:** local Inter font at weight 900, cream-white fill and thick dark rounded outline. Use the existing narration-timed SRT, verbatim, in short chunks. Caption sizing is constrained to the portrait safe area. No dark rounded subtitle box, header badge or floating infographic layer.

## 6. What is not being claimed

- This is a code-drawn interpretation of the supplied visual language, not extraction of the original video's rigs, project files or animation plugin.
- Characters are animated 2D canvas textures facing the camera in a lit 3D environment; they are not full 3D human figures.
- The cookie study concerns cookie desirability, not a direct experimental demonstration about romantic attraction. The final self-respect framing is retained from the existing narration.
- Artwork is rendered at 720×1280 and exported at 1080×1920. Output dimensions do not imply native 1080p artwork.

## Deliverables and reproduction

- Preview: `/classroom/index.html` (Play/Pause and seek).
- MP4: `public/demo/classroom-scarcity-30s.mp4`.
- Poster and SRT alongside the MP4.
- Source: `public/classroom/world.js`, using the existing vendored Three.js and local font. No image-generation assets, remote CDN or new runtime packages.

With the studio running on port 3000:

```sh
node render/stickworld.mjs --reference --preview
node render/stickworld.mjs --reference
```

In the Arena sandbox, prepend `LD_LIBRARY_PATH=/tmp/al2023/lib:/tmp CHROMIUM_PATH=/tmp/chromium` if using its local Chromium. Preview PNGs and downloaded reference material remain in ignored `renders/`.

## Completed export checks

- 30.00 seconds, 1080×1920, 30 fps, H.264 + AAC 48 kHz mono; 23,324,276 bytes.
- Audio mean −18 dBFS and peak −1 dBFS, with no detected clipping.
- Reviewed eight extracted MP4 frames from 0.5–28 seconds, covering the establish, phone close-up, walking, study setup, jar detail, two-shot and book payoff.
- TypeScript typecheck and JavaScript syntax check pass.
- `render/test-classroom.mjs` passes: repeatable random-access frames, motion within a shot, walking, seeking, playback/pause, no page exceptions, demo-section registration, poster and subtitle availability.
