# Revision: proportional bulb, correct immersion, stable lab floor, livelier action

This revision addresses the user's four corrections to the first delivered bulbous-bow film. The complete English narration, supplied 568-word body, 83 captions and 205.25-second running time are unchanged. The camera is still a continuous, purposeful rail; “a bit more dynamic” is not interpreted as permission to resume repeated circling.

## 1. Match the bulb to the ship

The original main bulb was a 20.6 m-long ellipsoid, with an additional spherical connector. It projected 11.9 m beyond the nominal stem; the connector reached 7 m in width. That produced an oversized, visibly two-lobed appendage.

The replacement is **one smooth, sheared ellipsoidal fairing**, not overlapping visible balls. Its maximum width is **3.7 m** against the ship's 25 m beam, and it projects **6 m** beyond the nominal stem of the 132 m hull. The aft part is concealed inside the forefoot, so the exposed shape blends into the hull. Analytic normals keep its surface smooth and avoid shading seams at the parametric wrap.

The camera's protected bulb envelope is generated from those same surface points. Leaders and focus targets have moved with the corrected geometry; the model is not merely scaled while obsolete large-camera bounds remain in use. Miniature ships share the corrected geometry at their existing scales.

These are coherent **illustration proportions**, not the optimised dimensions of a named real vessel or the result of naval-architecture calculations.

## 2. Correct the apparent excessive immersion

A more fundamental error accompanied the visual waterline: the original hull's side and end triangles faced **inward**. Back-face culling removed much of the visible above-water side plating. Raising the ship alone would not have repaired that appearance.

The side/end winding now points outward, the deck faces upward and follows the raked bow, and the keel underside is closed. This restores the continuous visible hull instead of leaving an apparent low-floating deck and isolated bow cap.

The ocean ship also rides 2 m higher relative to its original local waterline, giving a mean illustrated immersed draft of **8.4 m** and nominal deck freeboard of **10.2 m**. The original dry-docked ship stays on its supports, rather than being lifted with the ocean vessel. Small heave/pitch/roll add sea response without allowing the bulb to breach the water.

The overlapping base-ocean and local bow-wave layers previously blended twice over the same region. Their coverage is now mutually exclusive, so the local wave patch replaces the base water instead of coating the hull with a second semi-opaque layer. The explicitly explanatory transparent-water reveal remains; ordinary sailing shots retain a proper water surface.

## 3. Eliminate the lab-floor depth conflict

The coastal terrain and the laboratory floor originally both reached Y = 6 m. Moving-camera depth rounding therefore switched between coplanar surfaces, causing the reported flicker.

The laboratory now has a **0.72 m solid foundation slab**, with its top at **Y = 6.04 m**. The actual terrain mesh beneath the complete footprint is lowered to **Y = 5.35 m**, with boundary vertices inserted outside the slab edges. The slab reaches into that subgrade; it is not a floating floor or a polygon-offset-only workaround. Floor markings sit above the slab with their own small depth clearance, and the illustrated lab workers' foot elevations follow the new floor.

Unit tests sample the entire footprint. Browser world statistics also report the maximum real terrain-vertex height beneath the slab and require more than 0.65 m of floor/terrain separation. This tests the geometric cause, rather than only checking whether a single still happens to look clean.

A separate moving-camera pixel check samples 28 laboratory times, uses ray intersections to identify unobstructed floor rather than machinery/walls, and verifies the resulting slab pixels retain their expected colour. The reviewed browser run checked 377 visible points with no terrain-colour substitutions. The finishing tool repeats those screen-point checks against the actual encoded MP4, allowing a small codec/scaling colour tolerance. These are sampled temporal checks, not a claim of every-pixel/every-frame perceptual review.

## 4. Make the activity more dynamic, without restless camera work

- Small, slow ship heave, pitch and roll; no exaggerated pitching or rotating display.
- Stronger, moving bow wash and a turbulent trailing stern wake.
- Propeller animation on the sea vessel and the testing models.
- Two timed pond impacts whose wavefronts expand from the actual impact times before overlapping.
- Rotating towing-carriage wheels and subtly pulsing running lamps.
- Live research-screen sampling cursors and moving measurement dots, in addition to the existing wave/flow traces.
- A restrained ending approach that remains on the same side of the ship rather than swinging closer around the corrected small bulb.

These changes add action where the narration discusses water, testing and motion. They do not introduce unrelated people or another sequence of camera journeys.

## Regression and delivery checks

New tests explicitly check the bulb/beam and protrusion/length ratios, outward hull winding, upward deck normals, illustrated draft/freeboard limits, submerged bulb clearance and full-footprint floor/terrain separation. Existing full-script preservation and all-4,926-pose camera tests remain. Browser checks retain the below-water bulb and tow-model visibility regressions, with the bulb sample region moved away from the newly visible red hull plating.

The complete video is re-rendered from current source, rather than reusing old shots with the oversized bulb. The finishing tool then checks the actual MP4's frame count, full decode, black intervals, feature visibility and encoded voice level. Source and output hashes are recorded in `delivery/production.json`.

Review remains bounded: representative images and numerical/encoded-file checks are not every-frame human perceptual review, manual audio listening, scientific CFD validation or reference-film parity.
