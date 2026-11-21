# Revision: reference-shaped integral bow and slow moving-camera direction

This revision addresses the latest continuous-bow and slow-camera requests while preserving the previous flotation and laboratory-floor corrections. The complete English narration, supplied 568-word body, 83 captions and 205.25-second running time are unchanged. The camera is still a continuous, purposeful rail; “a bit more dynamic” is not interpreted as permission to resume repeated circling.

## 1. Continuous reference-shaped hull, not an attached bulb

The latest user reference (`reference/user-bow.png`) shows a lower stem swelling into a rounded forefoot, with its upper shoulder flowing concavely back into the stem. The previous revision's separate sheared ellipsoid did **not** meet that request, even though its intersection was concealed. It has been removed entirely.

The replacement is one **closed, welded, indexed hull mesh**. Every waterline begins at the reference-shaped stem curve and flows aft into the ship's beam. The extended lower stem, shoulder, sides, keel and deck share vertices and edges. Red underwater paint, navy topsides and cream deck are material groups on this same mesh—not separate intersecting hull/bulb surfaces. This remains true in the miniature models. The comparison model has the same topology with an unextended stem.

The exposed forward swelling is approximately **3.19 m wide** against a 25 m beam and projects **6 m** beyond the nominal stem of the 132 m hull. Its lowest edge stays near the keel; the upper shoulder curves directly into the hull, without a cylindrical neck or a capped attachment. These are illustration proportions, not an optimised real-vessel design.

Regression tests check every indexed edge has exactly two incident faces with opposing directions, every vertex belongs to the same connected component, and the closed hull has Euler characteristic 2. Tests also check outward side winding, upward deck and downward keel. This replaces the previous weak “single surface” test, which only checked the ellipsoid's dimensions.

The portrait focus envelope is sampled directly from the new hull forefoot. It is not the obsolete bounding box of the removed ellipsoid.

## 2. Correct the apparent excessive immersion

A more fundamental error accompanied the visual waterline: the original hull's side and end triangles faced **inward**. Back-face culling removed much of the visible above-water side plating. Raising the ship alone would not have repaired that appearance.

The side/end winding now points outward, the deck faces upward and follows the raked bow, and the keel underside is closed. This restores the continuous visible hull instead of leaving an apparent low-floating deck and isolated bow cap.

The ocean ship also rides 2 m higher relative to its original local waterline, giving a mean illustrated immersed draft of **8.4 m** and nominal deck freeboard of **10.2 m**. The original dry-docked ship stays on its supports, rather than being lifted with the ocean vessel. Small heave/pitch/roll add sea response without allowing the bulb to breach the water.

The overlapping base-ocean and local bow-wave layers previously blended twice over the same region. Their coverage is now mutually exclusive, so the local wave patch replaces the base water instead of coating the hull with a second semi-opaque layer. The explicitly explanatory transparent-water reveal remains; ordinary sailing shots retain a proper water surface.

## 3. Eliminate the lab-floor depth conflict

The coastal terrain and the laboratory floor originally both reached Y = 6 m. Moving-camera depth rounding therefore switched between coplanar surfaces, causing the reported flicker.

The laboratory now has a **0.72 m solid foundation slab**, with its top at **Y = 6.04 m**. The actual terrain mesh beneath the complete footprint is lowered to **Y = 5.35 m**, with boundary vertices inserted outside the slab edges. The slab reaches into that subgrade; it is not a floating floor or a polygon-offset-only workaround. Floor markings sit above the slab with their own small depth clearance, and the illustrated lab workers' foot elevations follow the new floor.

Unit tests sample the entire footprint. Browser world statistics also report the maximum real terrain-vertex height beneath the slab and require more than 0.65 m of floor/terrain separation. This tests the geometric cause, rather than only checking whether a single still happens to look clean.

A separate moving-camera pixel check samples 28 laboratory times, uses ray intersections to identify unobstructed floor rather than machinery/walls, and verifies the resulting slab pixels retain their expected colour. The browser run checks unobstructed floor samples with no terrain-colour substitutions. Each candidate now checks the actual raster-pixel footprint (nine depth rays), not just the unrounded projected world point, so moving-camera edge pixels on machinery/walls are not misclassified as exposed slab. The finishing tool repeats those screen-point checks against the actual encoded MP4, allowing a small codec/scaling colour tolerance. These are sampled temporal checks, not a claim of every-pixel/every-frame perceptual review.

## 4. More moving-camera dynamism, at a restrained pace

The latest instruction explicitly requests more **camera movement**, not just animated machinery. The explanation rails now use slow lateral tracking, dolly and small crane moves:

- Dry-dock detail: a roughly 9 m track over five seconds through the close forefoot view.
- Underwater reveal: a roughly 12 m relative track over 8.5 seconds.
- Design-basin explanation: a continuous roughly 24 m rail over 24 seconds instead of a long near-static hold.
- Bow-wave explanation, pond analogy, laboratory carriage and ending also have graduated position/height changes.

The first three explanation intervals have explicit relative camera-speed regression limits of 3, 3 and 2 m/s respectively. These limits apply to the authored explanation rail, not the film's deliberately time-compressed inter-location travel. Gaussian-smoothed orientation and shape-preserving eye/aim interpolation remain. A fixed 50-degree vertical field of view gives the newly integrated shoulder room without backing the dock camera through a wall. Full-timeline tests still require safe framing, terrain/wall clearance and limited ship-bearing ranges; this is **not** a return to repeated circling.

The previously corrected higher flotation, slow sea response, active wakes, propellers, pond impacts, carriage wheels/lamps and live research-screen traces remain unchanged.

## Regression and delivery checks

New tests explicitly check the bulb/beam and protrusion/length ratios, outward hull winding, upward deck normals, illustrated draft/freeboard limits, submerged bulb clearance and full-footprint floor/terrain separation. Existing full-script preservation and all-4,926-pose camera tests remain. Browser checks retain the below-water bulb and tow-model visibility regressions, with the bulb sample region moved away from the newly visible red hull plating.

The complete video is re-rendered from current source, rather than reusing old shots with the oversized bulb. The finishing tool then checks the actual MP4's frame count, full decode, black intervals, feature visibility and encoded voice level. Source and output hashes are recorded in `delivery/production.json`.

Review remains bounded: representative images and numerical/encoded-file checks are not every-frame human perceptual review, manual audio listening, scientific CFD validation or reference-film parity.

### Completed latest-export evidence

- Production tests: **13/13**; repository tests: **52/52**; approved-original lock: **40 bundled / 20 original files passed**.
- Browser: **27 representative frames**, **4,926 audited camera poses**, no shader/runtime errors.
- Final encoded video: **205.25 s, 4,926 frames, 720 × 1280 at 24 fps**; full decode and picture-preserving narration mux passed; no unexpected black intervals.
- Final encoded floor: **28 sampled times, 446 depth-confirmed unobstructed pixels, zero failed samples**.
- Encoded feature masks: **5,496 bulb pixels at 79 s**, **10,424 tow-model pixels at 172 s**.
- Encoded voice level: **−16.19 LUFS / −1.36 dBTP**; original voiceover, script, captions and timing remain byte-for-byte unchanged.
- Dock / underway / ending ship-bearing spans: **16.74° / 22.63° / 21.24°**, all below the 25° non-circling regression threshold.
- Representative final encoded contact-sheet frames visually inspected. Review limitations above still apply.

The authoritative MP4 checksum and source hashes are in `delivery/production.json`.
