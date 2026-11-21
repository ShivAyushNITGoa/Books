# Carry-forward lessons from the black-box iterations

The user explicitly asked to list the improvements from the first black-box film to the latest and **use them in future videos as required**. Treat these as standing production lessons, not one-off black-box fixes. Apply them according to each new script, brief and approved style; do not automatically copy this film's locations, duration, distances, tree count, thresholds or narration.

## Iteration history

| Iteration | Main change | Remaining problem / status |
|---|---|---|
| `projects/black-box/` | Supplied English script, selected narration and continuous-camera explainer | Rejected: predominantly linear movement, centre-pinned recorder, one-sided views and apparent character/device intersections |
| `projects/black-box-rebuilt/` | Independent curved camera/subject/aim choreography, multiple sides, left/right composition, more complete recorder artwork, grounded staging and physical/projected clearance checks | Rejected geography: factory, forest and water still co-located as exhibits in one pavilion |
| `projects/black-box-locations/` | Genuine distant factory, remote forest, ocean/seabed, coastal recovery pier and airport, connected by continuous time-compressed travel | User called it “a bit good”; requested larger mixed habitats, continuous geography and clearer journeys |
| `projects/black-box-journey/` | Shared regional land-to-seabed field, large mixed forest, natural coast, river/estuary, connected infrastructure, clearer travel bearings, rotation-flip prevention and broader regression/encode review | Latest delivered iteration; technical checks and delivery do not imply artistic approval or reference parity |

## Reusable improvements

1. **Direct the camera, not just movement.** Independently plan eye, aim and subject/action paths. Use motivated curves, changes of height, distance and bearing; avoid an entire film becoming a straight conveyor move.
2. **Vary composition.** Use left/right framing, broad establishing views, close details and reveals. Do not pin the important prop to the same screen position throughout.
3. **Finish every visible side.** Model/draw rear, end, top, labels, attachments and support details before taking the camera around them. Multilateral views should explain the object rather than merely accumulate orbit degrees.
4. **Prevent physical and apparent intersections.** Test world-space clearance and projected silhouettes using the actual camera, aspect ratio and actor elevations. Include hands, clothing and protruding attachments, not just object centres.
5. **Ground the action.** Keep feet, wheels, workbenches, bridge supports and props connected to plausible support surfaces. Illustrated people remain upright rather than inheriting camera pitch/roll.
6. **Respect distinct locations.** Put genuinely far-away story events in appropriate separate environments. A miniature forest or water exhibit inside a room does not represent a remote forest or open ocean unless the brief explicitly asks for a diorama.
7. **Make the intervening geography continuous.** Use consistent terrain, shoreline and bathymetry. Match roads, rivers, roots, building pads and supports to it; avoid square outdoor floor plates, abrupt coast edges and disconnected seabed patches.
8. **Build large, varied environments where the story needs them.** Extend habitats beyond the immediate subject, with coherent density, multiple silhouettes, sizes/ages and foreground/background layers. More repeated assets alone are not environmental depth.
9. **Show the journey.** Use approaches, exits, horizon, scale and recurring landmarks to connect places. Avoid spending travel time looking at empty ground. A small map may assist orientation but must not replace the actual geographic journey.
10. **Validate rotation as well as position.** Continuous eye/aim coordinates can still cause 180° flips. Check orientation changes, bank, camera-to-terrain clearance and real door/building exits. Choose thresholds appropriate to each film.
11. **Keep continuity honest.** Preserve no-cut direction where required. Do not disguise teleports with fades or ghosted picture blends. Clearly distinguish time-compressed geographic travel from a physically plausible real-time flight.
12. **Preserve accepted words, voice and visual language.** Do not replace narration just to accommodate a new camera. Respect English/text requirements, supplied timing and the flat illustrated-character/3D-style environment brief, unless the user changes them.
13. **Use modular, reproducible implementation.** Separate geography, environments, cast/props, direction, captions, rendering and QA. Keep shared assets local, deterministic seeking stable and intermediate datasets/renders out of Git. Substantial engineering matters; line count is not an artistic-quality metric.
14. **Review the complete timeline and the final encode.** Check all output-frame geometry/motion invariants, plus representative rendered transitions and actual MP4 stills. Test captions, missing resources, audio/video decode, loudness and mux integrity. Preserve requested final video/source delivery and provide a permanent GitHub link when requested.
15. **Keep lessons and limitations explicit.** Passing tests is not user approval, every-frame perceptual review, manual audio listening or reference-film parity. Record what was actually checked and carry corrections into the next project before production begins.

## Newest camera correction — bulbous-bow brief

For the next ship film the user explicitly asked **not to round/circle the camera around the object and not to move repeatedly around the film as before**. This overrides any assumption that the black-box project's multi-sided camera work should become a standard orbit recipe. Use calm, purposeful staging and held explanatory views; reserve travel and height changes for genuine reveals or changes of place. Varying composition does not require circling a subject. Do not carry black-box minimum-azimuth thresholds into a brief that asks for less camera movement. The [bulbous-bow direction notes](../projects/bulbous-bow/DIRECTION.md) document the application and checks.

## Use before every new film

- Read the new script and identify its required locations, geography, characters, action, visual style and audio/camera constraints.
- Build a beat/route plan and identify which lessons above apply. Resolve conflicts with the current brief rather than blindly copying black-box staging.
- Design the world and cast together, then review short representative focus and travel previews **before** the long export.
- Add meaningful project-specific regression gates; review transitions, not only chapter midpoint stills.
- Validate and inspect the final file, document review limits and deliver the requested video and source.

See also [`../STYLE_GUIDE.md`](../STYLE_GUIDE.md), [`../projects/black-box-journey/ANALYSIS.md`](../projects/black-box-journey/ANALYSIS.md) and the latest project's production manifest. The frozen approved originals remain unchanged.
