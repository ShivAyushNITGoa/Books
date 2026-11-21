# Whole-film analysis and structural rebuild

## Why the first delivery was not adequate

The user rejected the first film. Its previous passing codec, frame-count and browser tests did **not** establish that it met the requested animation quality. This project is a separate replacement, not a relabeling of that MP4. The earlier production and the completed ship film are preserved.

The first film's root problems were architectural:

1. Limbs could cycle while the root stayed in place. A walk-looking pose is not travel.
2. The camera used one short interpolation at each shot's beginning and then stopped.
3. Nine independently staged sets were enabled/disabled by the current shot. Reusing similar colors did not connect their geography.
4. A moving crest did not reliably communicate the retained liquid behind it. Depth/camera choices also made complete characters look like detached body parts.
5. Props, character actions and camera attention were scheduled separately, producing late or obstructed reveals.
6. The rounded-character construction needed coherent joints, stable hair coverage, consistent proportions and attached facial marks—not more flat artwork.

### Evidence, not just impressions

The rejected delivered file was decoded through all **5,344 frames**, producing 5,343 adjacent-frame measurements and 30 all-frame thumbnail-atlas pages. The audit's input SHA-256 is `5e306cb774e664f332043656b8f4c962137fb3fe2107fcc7715414e30ff5d930`. Scratch evidence is in `Animation/output/molasses-flood-v2/old-audit/`. Its large-change detector flagged 32 candidates; these are candidates, not a count of objectively bad cuts.

More decisively, inspection of `../molasses-flood/direction/timeline.js` shows the camera interpolation finishing after `min(1.1, shotDuration * .3)` seconds. Sampling that evaluator at every output frame finds **4,341 of 5,344 frames (81.23%) in its settled state**. This directly explains the repeated stops the user noticed. Optical flow alone could not prove this because moving water, captions and actors also change pixels.

The all-frame audit is machine-complete, not a claim that every native-resolution frame was individually inspected by a person. Visual review used overview/contact sheets and selected full-size frames, plus source-level diagnosis. The same distinction applies to the rebuild's review evidence.

## Correction ledger: the user's ten requirements

| Requirement | Structural change | Evidence/check | Remaining boundary |
|---|---|---|---|
| 1. Walk through the world | Authored world-space routes integrate distance; gait derives from that distance | Route derivative, accumulated distance, hold and stance-foot cancellation tests | Feet are authored IK, not a full dynamics/contact simulation |
| 2. Fix malformed/intersecting people | Joined tubular limbs, analytic two-bone IK, bounded reach, solid rounded bodies, crown cap; escape/staging lanes separated | Bone-length tests; browser limb endpoint checks; every-frame head-envelope separation | Endpoint/envelope checks cannot prove zero mesh intersections with every prop |
| 3. Flood persists | One Eulerian surface with crest, trailing surges, long-lived pool and residue | Post-front/cleanup depth tests and final-film review | Art-directed height field, not CFD or a volume-conserving solver |
| 4. Synchronize camera | Position and attention keys follow the unchanged narration landmarks | 41-beat review, action-window tests and camera telemetry | Fast transfers are necessary with the fixed narration and compact staging |
| 5. Higher-quality cast | Volumetric pale heads, bean torsos, capped clustered hair, ears, attached face marks, hats, collars, hands and shoes | Native-size close-ups and browser geometry checks | Procedural stylization; no exact replica or recovered reference rig claim |
| 6. Better scene connection | One continuous position spline and continuous bounded attention spline | C1 key-boundary checks and complete-frame camera samples | Narrative time changes remain, visibly labeled |
| 7. More world detail | Pavers, warehouse windows/brick courses, lamps, quay piles, crates, cranes, railway, distillery, runoff, harbor boat | Connected-world contact sheets | Composition is stylized and not photorealistic |
| 8. Continuous geography | Every location has a fixed coordinate in the same district | Shared location/building constants and camera/route clearance tests | Not an exact Boston street survey |
| 9. Avoid repeated angles/animation | No repeated camera keys/positions; varied heights, arcs, inserts, pail/paint/pull/measure/hose tasks | Unique-position checks and 41-beat review | Walking, blinking and background ripples naturally remain cyclic |
| 10. Always-moving, variable-speed camera | No transfer-then-freeze branch; one uninterrupted position evaluator | 5,344-frame speed/step audit, no stopped frames under its threshold | Nonzero numerical movement does not guarantee equal perceptual energy in every composition |

## Replacement architecture

### A. One coordinate system, not nine switched sets

`world/geography.js` is the shared coordinate authority. The tank is centered at `(0, 0, -26)`. The distillery is west, the railway runs along the east side of the street, the rescue platform sits below it, the investigation table is northwest of the remembrance display, and the harbor joins the eastern quay. The static ground spans the route rather than appearing one shot at a time.

The warehouse layout is shared between the actual builder and clearance tests. This matters: an early rebuild placed a warehouse across the distillery camera path. A new every-frame volume test found **282 colliding camera samples** in that draft. Moving the warehouse west opened a real physical corridor; the fix was not to make the obstacle invisible when the camera approached.

The final geography has no scene-sized place visibility switches. Local objects still have legitimate state changes: the tank roof fails, droplets appear during leakage, a pail is used, and the hose runs only during cleanup. That is different from hiding an entire neighborhood to fake a location change.

### B. Travel, gait and complete limbs

`cast/motion.js` evaluates each route using an integrated trapezoidal speed profile. Root displacement and accumulated distance therefore agree during acceleration, steady travel and deceleration. Holds add no distance. Travel direction supplies heading.

`gaitAt` converts traveled distance to stride phase. During stance, local foot motion cancels root displacement on straight segments. During swing, the foot lifts and returns with eased fore/aft travel. The rig's arms and legs use analytic two-bone IK with explicit poles, so elbows and knees have a stable bend direction. Segment endpoints meet at the corresponding joint meshes. Hands are placed at the solved endpoint rather than at an unreachable requested point.

The faces are geometry on the head, not screen-space eyes pasted over a billboard. Hair uses a continuous scalp cap beneath the curls, preventing holes between independent hair balls. Hat/collar/ear/shoe geometry stays attached during three-quarter and profile views.

An all-frame crowd audit found two escape lanes converging and an escaping porter passing too close to a waiting sailor. Those routes/staging positions were separated. A subsequent prop audit also found torso/table-edge overlap, railway-column crossings, a horse/cart crossing and escape paths through the damaged-house/courthouse area. Table standing positions and working orientation were corrected; separate escape corridors and staggered rescue arrivals now go around those obstacles. The regression suite checks actual shared tabletop bounds, column clearance, horse/cart and remembrance-board envelopes, the damaged-house/court wall, and head envelopes for every actor pair at every output frame outside the explicitly labeled rewind. The rewind is excluded because it deliberately relocates the story in time, not because ordinary motion is allowed to teleport.

### C. Flood memory

The flood surface covers one global field. Each cell uses front arrival, crest/trailing-wave terms, a slowly decaying retained pool and local ripple variation. Once reached, the street does not snap back to its pre-failure color/depth after the crest moves away. Debris floats on the same evaluated surface. Cleanup gradually reduces local depth; it does not erase the entire flooded district.

The survivor is staged near a small refuge and the responders use a raised loading platform with visible approach boards. Immersion still hides some feet/legs. That is intentional depth, but a head-only silhouette can read as malformed anatomy, so the browser report flags head-near-surface observations for visual review. Earlier drafts flagged a responder and then a child near the cold-open crest. The opening was reframed and the child now genuinely escapes during the cold open. The final browser sample report contains no head-near-surface warnings; that sampling result is not an all-frame anatomical guarantee.

Material roughness was increased after the review showed broad white highlights hiding the brown surface. The harbor also receives a gradual brown runoff patch rather than remaining uniformly clean through narration about contaminated water.

### D. Continuous, bounded camera attention

`direction/camera.js` contains one position route for the entire film. Position uses time-scaled cubic Hermite interpolation. Shared derivatives make key boundaries C1 continuous; there is no shot-boundary position reset or settled hold.

A simple position spline was insufficient. The ordinary aim spline overshot the courthouse lettering during a rapid transfer even when the authored aim keys were correct. `monotoneSpline` now supplies shape-preserving attention tangents. Each aim component stays within its neighboring authored coordinates while remaining C1 continuous. The camera can move continuously without swinging its attention past the intended subject.

There are no exact repeated position keys or repeated frame positions at the tested precision. Slower prop/character arcs alternate with faster district transfers and high reveals. This is a technical continuous-take construction, not a claim of a physically plausible real camera operator carrying equipment through the historical disaster.

## Narrative and historical continuity

The complete existing eight-take narration, its 222⅔-second duration, 85 caption cues and conservative train corrections are retained. No replacement voice was invented or silently selected. The generated audio mix is byte-identical to the previous lossless mix before AAC encoding; its quiet ten procedural effects remain timed to the same narration events.

The historical editorial ledger remains [the original accuracy document](../molasses-flood/ACCURACY.md). In particular:

- The railway is damaged and the approaching train stops short of the sagging section. The film does not restore the rejected derailment claim.
- The 15-foot/35-mph statements are retrospective estimates, not measurements produced by this animation.
- The failure is not attributed with certainty to one exact trigger.
- Saltwater/sand cleanup and brown harbor water retain their documented basis.
- The 1925 finding is explicitly a later legal phase, not a literal proceeding on the flooded 1919 wharf.

The cold open rewinds visibly at **22.5–25 seconds**. Before/after failure use the same geography. The legal and remembrance stations are explanatory staging in that district; the memorial display and demonstration table can be visible early. This avoids disappearing sets but is not a literal historical one-take record. A future more cinematic production could replace those persistent explanatory props with staged deliveries/builds, at additional animation cost.

## Review and regression methodology

The [beat-by-beat ledger](direction/REVIEW_LEDGER.md) maps every narration interval to its intended treatment and includes a chronological critique of the rejected film.

The rebuild went through multiple complete 41-beat contact-sheet passes. Revisions included:

- correcting the tank panels' collapse axis from an upright fan to outward hinge rotation;
- reducing seams/rivets that overwhelmed the tank surface;
- opening the distillery approach and investigation camera corridor;
- moving a streetlamp out of the investigation foreground;
- moving the remembrance display away from a foreground obstruction;
- replacing an overbroad investigation canopy with an open beam structure;
- keeping inspection framing on the cast longer before the legal transfer;
- moving the cleanup camera west of the railway supports;
- reframing and narrowing the courthouse lettering for the portrait field;
- separating escape/staging routes rather than accepting interpenetrating heads;
- reducing wet-surface glare and adding connected distant shoreline detail.

### What the tests establish

The project tests sample every output frame for finite cast state and camera movement, test route/gait math, verify narration preservation and action windows, check retained flood depth, verify C1 camera boundaries and bounded attention, and check head-envelope/warehouse/tabletop/column/horse/board/house/court clearances. The browser checks sample the actual Three.js geometry and repeat nonsequential seeks, validating limb endpoints, finite world matrices and state/image repeatability within a small software-renderer tolerance.

The finalizer requires test/browser/lock reports, verifies runtime source hashes, checks full-render telemetry, muxes audio, decodes the complete compressed video/audio streams, measures loudness and extracts one frame per narration beat from the final file. The separate reference diagnostic can then generate an all-frame atlas/flow audit of the final MP4.

### What they do not establish

- A test pass is not user approval or an objective style-match score.
- Head envelopes and bone endpoints are not a complete mesh/prop collision solver.
- Thumbnail atlases are not native-resolution inspection of every face in every frame.
- Feature-flow diagnostics do not recover the true 3D camera.
- Captions use speech activity and word weights, not forced phoneme alignment.
- The scene is not a calibrated fluid, structural, pedestrian or historical-survey simulation.
- No complete manual listening or phonetic lip-sync claim is made.

## Output and reproducibility

See [README.md](README.md) for exact commands and the source map. `delivery/QA.json` is written only after the full render/mux/decode checks complete; consult it for the actual delivered checksum and measurements, not numbers from the rejected film.

The deliverable container is **720×1280 at 24 fps**. To keep software rendering practical, the 3D viewport is **540×960**, composited beneath native 720×1280 captions/graphics. It must not be described as a native-720 3D render. Scratch frames, atlases, PCM and telemetry stay under ignored `Animation/output/`; only selected delivery media and compact QA are published.


## Completed revision measurements

The final delivered-file review is [here](delivery/REVIEW.md). The revised MP4 fully decoded to **5,344 frames**, with no duplicate/dropped frames. All **40** project tests, **52** kit tests, **143** browser samples and **12** seek checks passed; the final browser sample report has no warnings. Protected originals passed their strict integrity check.

The final all-frame diagnostic covers 5,343 adjacent pairs and 30 atlas pages. Median adjacent-frame absolute difference rose from **0.064** in the rejected file to **3.107** in the rebuild. Median reliable environment-proxy translation rose from **0.005** to **0.536 pixels/frame** at the diagnostic's 360×640 analysis resolution. These screen-space comparisons support the visible increase in motion, but are not a recovered-camera measurement or artistic score. All 5,344 actual camera samples remain above the .035-units/s movement threshold. See [FRAME_AUDIT.json](delivery/FRAME_AUDIT.json) for distributions and caveats.

The final compressed-file 41-beat contact sheets, five duration-spanning overview sheets and two temporal strips were reviewed. Some foreground occlusion, oblique sign cropping and persistent explanatory staging remain expressly disclosed rather than hidden behind test results.
