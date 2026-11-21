# Approved visual contract

> Scope: this document is the approved **classroom** contract. The newer separate [story-world extension](story/BLUEPRINT.md) retains illustrative cutout characters but deliberately permits story-specific environments, multiple locations, casts and props. It does not change the frozen approved classroom film.

Canonical reference: [`locked/source/public/demo/classroom-scarcity-30s-v2.mp4`](locked/source/public/demo/classroom-scarcity-30s-v2.mp4). The approved bytes and source are frozen; new projects should change **content and direction**, not silently replace this visual language.

## Keep

- Flat cartoon cutout characters inside a dimensional, lit room.
- Oversized warm cream faces, heavy dark outlines, outlined oval eyes, small dark pupils, simple hair silhouettes and expressive mouths/eyebrows.
- Simple teal hoodie / mustard waistcoat clothing and thin dark stick arms/legs. No realistic human anatomy or full human body mesh.
- Visible acting: blinking, gaze, reactions, gesturing, walking where motivated, and speaking-mouth motion tied to narration amplitude when audio is available.
- One continuous physical world, with real furniture depth, foreground/background layers, warm timber, a green board, sunlight and grounded shadows.
- Motivated camera framing: establish the room, focus on a speaker or prop, allow reactions, settle the ending. Do not substitute sliding cards for animation.
- Heavy cream/white captions with a dark outline, short readable phrases and safe-area fitting. Keep captions away from focal faces.
- Narration in front of restrained action sounds. No unrequested music, stock clips or plugin dependencies.

## New scripts may change

Text, duration, audio, caption language/font coverage, speaker turns, cue timing, expressions, gaze, floor paths, camera keys, board wording and the enabled supported props. Portrait and landscape framing are both allowed; compose each deliberately.

## New engine work needs review

Additional actors, locations, costume styles, specialized object interactions, new motions or lighting redesigns are engine extensions—not a reason to edit the approved reference. Preserve the existing baseline, add new assets/actions separately, and compare a short preview against the canonical video before making a new default. A new approved style/release should receive its own identity rather than replacing `locked/`.

The generic engine provides reusable staging, not automatic story understanding or collision-free cinematography. Storyboards and approximate timings still require human review.

## Later quality correction

The user subsequently rejected the classroom's visual quality relative to the railroad reference and rejected the generic railway/space-garden demonstrations and their basic VO. The frozen classroom version remains an integrity archive, **not the current production-quality target**. For the newer supplied-SRT Alexandria production, use dedicated story-specific world/asset/action authoring under `projects/alexandria/`, preserve English timing, and do not synthesize a substitute voice. Never label the older prototypes as evidence of reference-level polish.

## Mandatory camera and blocking review after the black-box correction

The user rejected the first continuous-camera black-box film for linear movement, people appearing to intersect the recorder, a centre-pinned subject and predominantly one-sided views. **Do not repeat that staging as the default.** The rebuilt implementation and regression examples are in `projects/black-box-rebuilt/`.

Before future film delivery:

1. **Choreograph, do not merely track.** A continuous take is not synonymous with a conveyor-belt translation. Independently author subject path, camera path and aim; use motivated curves, changes of height/distance and reveals. A straight or held segment can serve a beat, but must not accidentally become the whole film's direction.
2. **Compose the whole story.** Deliberately use left/right and broad/close compositions when appropriate. Avoid pinning the hero at the exact same screen point throughout, and avoid decorative jitter masquerading as reframing.
3. **Visit the object, not only its front.** Plan useful changes of bearing; finish the rear, ends, top, labels and attachments before showing them. Avoid a fixed camera offset dressed up as an orbit.
4. **Block in world space and image space.** Include hands, costume, beacon, handle, carrier and support geometry in conservative clearance tests. Also inspect projected silhouettes so depth separation does not merely make a person *look* embedded in the hero. Use the actual render camera/aspect ratio, not an unrelated test camera.
5. **Keep feet and supports grounded.** Upright cutouts must not inherit camera pitch/roll. Devices should rest on or be visibly carried by appropriate support. Match wheel/rail gauge, direction and contact heights if using a carrier.
6. **Check between the storyboard poses.** Sample the complete timeline at delivery frame rate for camera continuity, cropping, collisions and foreground obstructions. A chapter-midpoint contact sheet alone is insufficient. Near-plane/frustum clipping must be handled correctly in projection tests.
7. **Protect storytelling visibility.** Check the important subject against fixtures and foreground props; move/reshape the set or camera rather than accepting a brief obstructed transition. Keep the important device, faces and hands clear of subtitles and frame edges.
8. **Review the finished encode as well as source previews.** Inspect representative transitions, close views, reverse angles and ending frames from the actual MP4; run complete-file decode/audio checks. Record the method and limits honestly. Neither a CI pass nor an unbroken camera path proves reference-level art quality.
9. **Preserve the user's words and selected voice.** Do not regenerate/replace accepted narration merely to fit a new camera. If a user has asked for silence or will supply VO, retain that requirement until they explicitly change it.
10. **Carry corrections forward in the repository.** Add project-specific regression gates and update this checklist. Do not label rejected iterations as approved templates. The rebuilt project's envelope, azimuth, framing and sightline gates are examples; choose meaningful dimensions/thresholds for each new story, not arbitrary numbers copied without review.

11. **Respect story geography.** When a script/user calls for far-apart locations, build genuinely separate environments: indoor factory, outdoor remote forest, open ocean/seabed, etc. Do not place forest/water/crash exhibits in the same room or diorama and call it multi-location. Establish exterior skies, terrain/coastlines, site-specific structures and meaningful spatial separation. If cuts are prohibited, use a continuous motivated journey; document time compression rather than disguising a teleport. Review the transitions and add location-distance, indoor/outdoor and building-exit regressions. The rejected `black-box-rebuilt` pavilion is the counterexample; `black-box-locations` is the corrective implementation, pending user approval.

12. **Distance alone does not create a continuous world.** Large, mixed habitats must extend beyond the immediate prop set. Use a shared terrain/bathymetry and coherent biome model; avoid circular tree rings, square forest floors, rectangular shore edges and isolated seabed plates. Roads, rivers, coastlines, bridge supports, vegetation roots and civil-work shoulders must agree geometrically. Compose actual travel with horizon and recurring landmarks, not long views of empty ground or a map replacing scenery. Validate camera **orientation as well as position**: independent eye/aim curves can still introduce 180° flips. Preserve deterministic seeking and check all delivery-frame quaternion steps, bank, terrain clearance and cast silhouettes. The user's partial acceptance of `black-box-locations` did not approve its small, patch-like world; see the deeper correction in `black-box-journey/ANALYSIS.md`.
