# Direction, implementation choices and checks

These notes document the original production and the issues caught during its first export. For the user's subsequent proportional-bulb, waterline, floor-flicker and activity corrections, see the current [revision report](REVISION.md). Current measurements are in `delivery/production.json`.

## What the new correction changes

The previous production had gradually acquired more elaborate camera travel. That improvement was not a licence to keep orbiting every new subject. The user's new instruction is specific: do not round the camera around the object and do not repeatedly move across the film as before.

Here, the ship is not mounted on a revolving display. Its bow points along negative Z and the ocean camera stays to starboard. The bow-wave explanation occupies a sustained rail view; vertical movement is reserved for the below-waterline reveal. The dock, ocean and ending bearing ranges are measured independently. In the reviewed camera audit they remain approximately 9°, 23° and 22°, respectively, rather than travelling around the ship. These ranges describe position relative to the ship, not a claim that the camera never changes its orientation during geographic transit.

Independent eye and aim curves still allow useful composition and parallax. A smoothed quaternion orientation field reduces abrupt travel turns without replacing the camera. A portrait fit correction moves backward along the current view only when an explanatory feature would otherwise be clipped. It does not recenter the entire ship or orbit around it. Its weight fades before transitions so switching the feature being protected does not teleport the camera.

The bulb is the focus during close explanation, not the whole 132 m hull. Deliberately excluding part of a large hull from a close-up is different from cropping the bulb being discussed. The analytical focus envelope follows the rounded bulb's surface and excludes its hull-occluded neck; pond and model envelopes use conservative bounding corners. Final visual review is still required because numerical framing cannot judge the composition's artistic quality.

## Script drives the geography

The opening needs a dry environment to show the appendage without pretending the ocean has become an indoor exhibition. A genuinely excavated dock therefore has a lower floor, retaining walls, closed sea gate, keel supports, stairs, cranes and inspection personnel. Negative camera Y does not automatically mean underwater: the atmosphere and sea shader explicitly recognise the dock bounds.

An offshore vessel is a separate full-size ship. The camera rises over the dock to reach the coast rather than showing that dry-docked vessel sailing through a closed gate. The regional terrain extends kilometres, so travel is through one shared geographic field, not cuts between small floating floor squares.

The pond analogy receives an actual garden setting. Two stones and two overlapping ripple sources share one water surface. A nearby path connects the garden with an outdoor design basin and then a separate naval laboratory. The laboratory has real door openings, floor, roof, structural beams, tank, towing carriage, scale ship and schematic research monitors. Full-size ocean vessels never appear inside it.

Cargo economics is staged at a terminal rather than as another unrelated exhibit in the lab. The ending returns once to the original offshore subject. The route is time-compressed; the film does not claim its camera or ships obey real transit speeds across the coastal geography.

## Visual explanation, not fabricated simulation

The ship's bulb is below the normal waterline and forward of its narrow bow. Its red underwater coating, bulb geometry and flow tracers distinguish it from an above-water decorative prow. Container stacks, bridge windows, railings, loading marks, bollards, aerials, propeller and rudder provide dimensional context.

The wave field is intentionally schematic. It combines a main sinusoid with a smaller, approximately opposed component. The default combined amplitude is 0.36 of the dimensionless main component; this number is only the internal teaching model, **not a physical resistance coefficient or fuel-saving ratio**. A changed phase/amplitude illustrates off-design conditions, including a combined amplitude greater than the original component. No complete cancellation is shown or claimed.

Real ship optimisation involves hull interaction, viscous effects, wave spectra, speed, draft and scale effects absent from these graphics. Research monitors are labelled schematic; no invented CFD solver, experimental calibration or numerical towing results are presented. Captioned narration retains the user's explanation and its operating-condition caveats.

## Character/world lessons carried forward

The established illustrated people are reused as flat drawings on upright planes. Their role is to establish scale and research/inspection activity, not to become full 3D human figures or foreground obstructions. Positions are authored away from the bulb and scale models. The world, props and camera are rebuilt for this script; the previous aircraft-recorder environments are not copied into this film.

Shared code is used for a purpose: material/static batching avoids thousands of redundant draw calls, the local font keeps exported text stable, and deterministic animation makes browser inspection and final rendering use the same poses. Test counts and code volume are not substitutes for artistic approval.

## Problems actually caught before export

1. **Portrait close-up crop:** the first analytical rail allowed parts of the rounded bulb and pond to leave the portrait safe area. A feature-envelope fit was added and its transition weights checked at every delivery frame.
2. **Dry-dock gate intersection:** an early camera solution backed toward the closed gate while descending. The entry and close-up rail were moved inward and the dock gate/side-wall test now covers every dock frame.
3. **Abrupt travel orientation:** early geographic turns produced roughly 8.5° frame-to-frame orientation changes. Broader quaternion smoothing reduced the maximum to approximately 3° per frame. This largest motion is during travel, not an explanatory orbit.
4. **Garden grading:** the unmodified coastal ground stood above the proposed pond's surface. Garden grading now blends to the basin elevation instead of burying it.
5. **Pond shader failure:** the ellipse clip generated GLSL `float / int` for an integral radius. Browser console review caught the compilation error, which a JavaScript `pageerror` listener alone would miss. Explicit floating-point literals fixed it; both browser tests and rendering now treat console errors as failures.
6. **Pond basin scale:** assigning Z scale overwrote the cylinder radius; multiplying it preserves the intended elliptical basin proportions.
7. **Back-facing basin sign:** the outdoor sign orientation was corrected after image inspection.
8. **Caption boundaries:** speech-activity bins initially gave adjacent captions a 20 ms overlap. Assembly now clamps each end to the following start; all text remains unchanged.

9. **Final-encode water occlusion:** final contact-sheet review found that the ocean's two transparent layers became effectively opaque as the fitted camera rose near the surface. The bulb explanation now uses a smoothly weighted transparent-water cutaway during the reveal and ending. This is an explanatory visibility treatment, not a claim about natural ocean clarity.
10. **Final-encode laboratory wall:** the model's changing position and late laboratory rail caused the portrait fit to back outside the room. The late rail now follows the model from inside the room before leaving through the rear opening; explicit laboratory side-wall collision checks were added. The affected deterministic frame ranges were re-rendered, with orientation smoothing's full temporal support included, and assembled before repeating final-file QA.

A conservative person/model rectangle-overlap flag also occurred during the laboratory shot. The actual maximum-flag frame was inspected: the person is behind the far tank wall, which correctly hides their body, and does not cover the boat. Rectangle overlap is not automatically visible occlusion; the depth-tested final image matters.

These were checks against the actual new implementation, not claims that every possible intersection or visual flaw has been mathematically eliminated.

## Evidence and review limits

`tests/production.test.mjs` verifies script/caption word preservation, timing, illustrative superposition, off-design behaviour, dimensions, terrain and all 4,926 camera poses. It checks dry-dock walls/gate, ocean hull clearance, portrait envelopes and limited ship bearing ranges.

`tests/browser.mjs` loads the real scene, checks shader/runtime errors and samples 27 programme times, including the pond and model laboratory. Pixel-region regression checks specifically require the red bulb to remain visible at 79 seconds and the light-coloured tow model to remain visible at 172 seconds; camera-envelope checks alone did not catch their earlier occlusion. The renderer also performs the complete analytical camera audit before exporting frames. The final MP4 is decoded in full by FFmpeg, its frame count and stream formats are checked, unexpected black intervals are rejected, and its unchanged picture stream is verified after voiceover mux. Final narration loudness is measured from the encoded AAC, not assumed from the source FLAC.

The production manifest records those final measurements and source hashes. Raw PCM, duplicate picture-only video, detailed render traces and review images remain ignored output rather than inflating the Git delivery. Manual listening, every-frame human perceptual review, scientifically validated hydrodynamics and reference-film parity are **not** claimed.
