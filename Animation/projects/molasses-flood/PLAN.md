# The Day a Giant Wave of Molasses Destroyed a City Street
## Transcript analysis and production treatment

**Delivery:** a complete English-narrated portrait film, 720 × 1280, 24 fps, **222⅔ seconds / 5,344 picture frames**. Eight unhurried narration takes; 85 English caption cues; 41 authored shots; nine original dimensional sets. This is a complete story, not a five-second test or a proposal in place of a video. The final file and verification results are indexed in [README.md](README.md).

**Visual direction:** the user's latest Dario reference governs **both characters and camera**, superseding the rejected flat engineer. The source is a reference for shape, depth and directing grammar—not footage to reuse or a historical source. Our production uses original Three.js geometry and our own rigs; no claim is made about the reference creator's software.

## 1. What the transcript is actually doing

### The dramatic engine

The hook creates a category error: a familiar food ingredient behaves like a fast, destructive industrial flood. Its force comes from **volume, stored gravitational energy and the urban setting**, not supernatural syrup. The reveal should make the audience reconsider the opening images, then the investigation should make them reconsider the disaster itself: strange does not mean inexplicable or unavoidable.

The underlying argument is a chain:

> Industrial demand → large storage tank → inadequate design and testing → visible leaks → concealment instead of repair → structural failure → a dense, viscous flood → difficult rescue → legal responsibility → oversight.

The film must show links in that chain. A tank explosion followed by unrelated disaster postcards would miss the point. The **leaking seam and bucket** are recurring visual evidence: first a curiosity, then a warning, finally the closing indictment.

### Structure and repetition

The script describes destruction twice. The opening is an experiential cold open; the later passage belongs to the chronological reconstruction. They require different coverage:

- **First pass:** street-level threat, one witness reaction, then the ingredient reveal. Avoid giving away every engineering conclusion.
- **Second pass:** tank failure and outward flow, estimates presented as estimates, railway damage and the stopped train. Show cause and spatial relationships rather than merely replaying the opening.

Likewise, the first leak scene establishes what residents saw; the investigation returns to it as evidence. The last shot returns to the seam as a moral conclusion. These repeats are motivated visual rhymes, not padding.

### Tone progression

1. **Alarm and disbelief:** short, legible shots, no gore or comedy falls.
2. **Orientation and scale:** a readable wide view with the tank, people and elevated railway in one perspective world.
3. **Warning signs:** slower human-scale shots with a child, pail, seam, worker and paint.
4. **Failure and propagation:** more energetic transfers and physical movement, without shaky-camera chaos.
5. **Entrapment and rescue:** restrained effort, deliberate hand-to-rope contact, clear safe platform.
6. **Loss:** a composed memorial pause; no bodies, injured animals or cheerful character reactions.
7. **Accountability:** tangible plate, rivets, ruler, document and court setting.
8. **Aftermath and warning:** washing, sand, harbor, review and a return to the unrepaired seam.

The audience should finish thinking **preventable industrial negligence**, not “a funny food accident.”

## 2. Editorial and historical guardrails

Read [ACCURACY.md](ACCURACY.md) for the source ledger and the two spoken train-line changes. The supplied narrative working text is retained separately in `script-supplied.txt`; `script.txt` is the recorded edit. No narrative section is omitted and narration is not sped up to fit a predetermined duration.

- **Train:** sources conflict. The film follows Smithsonian's specific approaching-train account: damaged supports and sagging track, train stopped short. Do not stage a passenger train falling into the street.
- **Tank failure:** “exploded” is retained as the script's colloquial word; the image and on-screen heading explicitly show a **structural rupture**, not a bomb, flame or detonation. The animation is schematic plate separation and shell collapse, not fracture mechanics.
- **Height/speed/time:** retain the requested reported 15 ft and estimated 35 mph / 56 km/h, but do not pretend these are surveyed measurements. Other published wave-height and clock-time accounts differ.
- **Physics:** denser is not the same property as more viscous. The spoon insert qualitatively contrasts drainage, not density measurements. No quicksand mechanism, instantaneous solid sugar block or impossible negative buoyancy is asserted.
- **Industrial use:** the separate distillery makes alcohol; the tank stores molasses, not explosives. Wartime demand is historical context, not a claim that the January 1919 tank was a bomb factory.
- **Responsibility:** an illustrative court set represents the civil process. Its 1925 liability label is not a reproduction of a particular courtroom or a verbatim judgment.
- **Place:** period-inspired North End streets and harbor, not an exact surveyed reconstruction. The memorial is an original commemorative composition, **not a facsimile of today's plaque**.

## 3. Character system and acting

### Shape language

- Pale, rounded head volumes; compact bean-shaped clothing; clustered brown curls wrapping onto crown, sides and rear.
- Thin dark cylindrical arms and legs, spherical mitten hands and small rounded brown shoes.
- Minimal eyes, brows and mouth attached to the dimensional head, not painted in screen space. The inspector's glasses follow the head in perspective.
- Matte materials, warm cream faces, teal/slate/muted-red clothing. Avoid realistic anatomy, photoreal skin, broad rectangular jackets, flat whole-person cards and pasted-on facial graphics.
- A reduced child scale, caps, sailor hat, worker uniform and volunteer armband distinguish roles. These are generic illustrative witnesses, **not invented portraits of named victims**.

### Action ownership

| Role | Purposeful action | Restraint |
|---|---|---|
| Resident | Walks ordinary street; reacts and moves away from the wave | No slapstick tumble or graphic impact |
| Child | Reaches toward the pail below the leaking seam | No invented dialogue or named identity |
| Worker | Inspects repeated leaks; works the paint roller | Paint is concealment, never shown as a real repair |
| Survivor | Small frustrated motions in the sticky flood; takes rescue rope | Does not sink out of sight or flail comically |
| Police / sailor / volunteer | Approach on raised platform, brace and pull | Hands and rope endpoints update in world space |
| Inspector | Looks and gestures at steel, rivets, ruler and records | Not a lip-synced presenter delivering the off-screen narration |
| Cleanup worker | Directs water toward residue; sand area grows | No magic instant restoration of the neighborhood |

Locomotion is driven by explicit shot action and time. Walk-cycle swings, slight torso bob and head motion provide life without moving every joint continuously. Task poses settle. The rescuer's feet are staged on the raised platform instead of passing through it; the rescue rope is connected to the actual animated hand transforms.

## 4. World and prop design

All runtime geometry is procedural and local. Shared vendor and font resources already in `Animation/` retain their existing license notices.

1. **North End street:** large riveted cylindrical tank, street joints, brick/wood-inspired buildings with recessed-looking window color blocks, roof cornices/chimneys, lamps, horse/cart, elevated railway, two-car train, wooden outbuilding, flood mesh and debris. Tank proportions approximately follow the published 50 ft height / 90 ft diameter relationship; the whole neighborhood is an illustrative model, not a scale map.
2. **Leaking seam:** close steel-wall section with panel joints and rivets, persistent drips, pail, child, worker, clipboard and brown paint. Reused as evidence and closing warning.
3. **Distillery:** barrels, copper-toned still, overhead piping and collection vessel. Distinct from the street tank.
4. **Property insert:** water and molasses cups with physical labels, lifted spoons, fast droplets versus a persistent thick strand. Explicit qualitative analogy, not a lab result.
5. **Rescue zone:** viscous pool, boards and wreckage, raised working platform, survivor, responders, hand-connected rope, hose and sand.
6. **Engineering office:** warm paneled room, windows, worktable, steel plate/rivets, ruler and evidence label; positive review label replaces inadequate-test evidence during the oversight beat.
7. **Court:** raised bench, civilian figures and 1925 responsibility anchor. Stylized representation of the long legal process.
8. **Harbor:** quay, mooring posts, waterfront buildings, working boat and brown residue extending into water.
9. **Memorial:** original commemorative slab and 21 small candles, bare winter-inspired trees and a still composition.

The tank rupture and flood are **art-directed geometry animation**, not fluid/structural simulation. Crest ripples, moving fronts, drifting debris, separated plates and tilted timber communicate the event without claiming engineering precision. Static set geometry is batched by material; cast and task props retain independent transforms.

## 5. Camera language: transfer → settle → action

The camera is a real perspective camera, not a global scale applied to a flat composition. Authored position and aim are independent. Buildings, train supports, faces, hands and props occupy different depths, yielding actual parallax and occlusion.

- Every shot has a specific start and settled position/target. Transfer lasts up to **1.1 seconds**, capped at 30% of short shots. Smooth acceleration/deceleration makes that transfer decisive without a violent whip.
- Most of each shot is a **settled reading/action interval**. No constant decorative drift, endlessly orbiting subjects or repeated circling.
- Tank wides trade facial detail for spatial scale; seam and rescue shots trade geographic breadth for readable human effort. The shot list makes that alternation intentional.
- Short left/right offsets and elevation changes reveal depth. Cuts are allowed and are authored; this is **not falsely advertised as a continuous take**.
- Native portrait reviews caught cropped workers and over-tight tank shots. Cameras were widened and the investigation cast restaged in depth, rather than treating an arbitrary camera-origin audit as proof of good framing.
- The railway view looks along the rails toward the stopped train and foreground sag. The camera never implies the train plunged off the structure.
- A quiet memorial composition separates the casualty count from explanatory inserts.

The definitive camera values and narration-driven boundaries live in [`direction/shots.json`](direction/shots.json). The readable [41-shot edit decision list](direction/SHOT_LIST.md) gives exact in/out points. `tools/plan.py` regenerates both, including portrait-framing refinements.

## 6. Timing and edit rhythm

| Chapter | Approximate interval | Dramatic job | Coverage |
|---|---:|---|---|
| 1 | 0–24.53 s | Threat → difficulty → molasses reveal | Street, survivor, ingredient insert |
| 2 | 24.53–56.69 s | Date/place → tank scale → industrial purpose | Geographic wide, tank, distillery |
| 3 | 56.69–76.34 s | Construction → leak → children → concealment | Seam, pail, worker, roller |
| 4 | 76.34–102.63 s | Ordinary afternoon → rumble → rupture → estimates | Street, seam, failure, wave |
| 5 | 102.63–121.47 s | Urban destruction and railway near-miss | Street/outbuilding, track/train |
| 6 | 121.47–152.78 s | Escape physics → rescue → human cost | Survivor, spoon insert, platform, memorial |
| 7 | 152.78–177.85 s | Evidence → avoidable failure → responsibility | Office, seam, court |
| 8 | 177.85–222.67 s | Cleanup → oversight → lasting warning | Street, wash, harbor, office, memorial, seam |

Narration is the timing authority. The audio preparation script decodes all eight selected takes, measures speech activity, inserts 0.35 s initial lead / 0.30 s take gaps / final tail, normalizes the voice, and extends to a whole 24 fps frame count. No artificial speech rate change is applied.

Caption groups follow measured speech activity and word weights. Paragraph boundaries are interpolated through those caption landmarks for shot timing. **This is not forced alignment**; phonetic synchronization and verbatim manual listening are not claimed. The short “It leaked” insert is intentionally brief; longer evidence/cleanup passages get uninterrupted task time rather than stretching short narration across excessive cuts.

## 7. Graphic and sound treatment

- Warm muted amber/teal palette; cream faces and clear head silhouettes; hemisphere/key/fill lighting and subtle vignette.
- Compact top anchor, rather than giant scene-sized word cards; key estimates carry qualifiers. Local Inter supplies export captions; physical-world signs use generated local textures.
- Captions are burned into the default export with a high-contrast dark backing and generous bottom margin. The full English SRT is also delivered separately. The preview's CC control can hide them.
- Reuse the previously selected English `voice-02` for narrator continuity. It was not newly auditioned or newly chosen specifically for molasses; provenance states that explicitly.
- Original, quiet procedural rumble/metal/water/wood effects are placed on major actions. No copyrighted music, borrowed soundtrack, synthesized singing or sensational human/animal distress calls.
- Loss and conclusion are allowed to breathe. Foley supports the explanation; speech remains foreground.

## 8. Export and acceptance checks

1. Normalize/assemble narration and verify that all recorded take text matches the edited script after whitespace normalization.
2. Regenerate 41 contiguous shots from the actual audio metadata. Test every frame's timeline selection and the mathematical camera track.
3. Load all runtime assets locally in Chromium; capture one readable still per shot plus important larger views. Check console/network errors and deterministic arbitrary-time seeking.
4. Inspect a short encoded motion range before exporting the entire film. Earlier review caught and corrected an absolute mouth-scale bug, portrait clipping and feet/platform intersection.
5. Render **all 5,344 frames** at 24 fps, then mux the full voice/effects mix. Output canvas/text are 720 × 1280; the antialiased 3D viewport is 540 × 960 and composited up to that canvas. Do not mislabel this as native 720p geometry sampling.
6. Inspect representative decoded final-file frames and transition sequences. Decode the entire final audio/video stream, count actual frames, verify codec/dimensions/duration, and measure final audio loudness/peak.
7. Keep intermediate frames/mixes/diagnostics under ignored `Animation/output/molasses-flood/`. Publish the deliberately chosen final MP4, selected voice takes, FLAC voiceover, captions, plan, source and compact QA evidence—not thousands of scratch images.
8. Run repository tests, project tests and strict frozen-original integrity checks. Commit and push only the current Arena branch; do not replace the ship film or locked archives.

### Honest limits

This is an authored stylized explainer, not an exact reconstruction of Boston geography, the original tank's stress distribution, a measured fluid solver, archival victim portraits or an independently expert-reviewed documentary. Frame coverage tests establish technical completeness, not user approval of artistic similarity. The caption timing is approximate, and no full manual audio listening claim is made. Those limits do not substitute a plan for the requested completed film: the delivered MP4 is the final production artifact.
