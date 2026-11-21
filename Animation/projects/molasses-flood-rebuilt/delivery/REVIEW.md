# Final delivered-file review

## File actually checked

- `molasses-flood-rebuilt-narrated-720p.mp4`
- 75,794,909 bytes
- SHA-256: `99eddae4a4ce53f0bdacbf4b4ac0eaa6ce605b4ac33449b3a5a1fb30f0139ffe`
- 720×1280 container, 24 fps, 5,344 frames, 222⅔ seconds
- 540×960 rendered 3D viewport beneath native 720×1280 captions/graphics
- Full selected eight-take narration, ten quiet original effects, 85 caption cues

## Completed checks

| Check | Result |
|---|---|
| Complete compressed video/audio decode | PASS |
| Decoded frames | 5,344 |
| Dropped / duplicated frames | 0 / 0 |
| Project regression tests | 40 passed |
| Existing kit regression tests | 52 passed |
| Previous molasses project tests | 7 passed separately |
| Protected-original integrity | 40 bundled files; 20/20 original files checked |
| Actual-browser sampled states | 143; no errors/issues/warnings |
| Nonsequential seek checks | 12 passed |
| Narration loudness / true peak | −16.04 LUFS / −1.41 dBTP |
| Runtime fingerprint drift during export | None |
| All-frame diagnostic | 5,344 frames / 5,343 adjacent pairs / 30 atlas pages |
| Numerically stopped camera samples below .035 units/s | 0 |

See `QA.json` for source fingerprints and `FRAME_AUDIT.json` for compact measurements against the rejected film. The all-frame diagnostic found zero large-change candidates under its particular joint image/histogram threshold, versus 32 in the rejected file. **That is not proof that every transition is aesthetically ideal or that a generic detector can certify the absence of cuts.** The actual camera's continuity is established independently by its evaluator and frame telemetry.

## Visual evidence reviewed

The reviewed images were decoded from this final MP4, not only captured from an earlier browser draft:

- All 41 narration-beat frames, assembled as four full-film contact sheets.
- All five 2.5-second overview sheets spanning the complete duration.
- Temporal strips at 45–54 seconds and 137–146 seconds, showing actual world-space walking and staggered rescue arrivals while the camera moves.
- Prior draft close-ups of the character construction, cold open, rescue and legal station, with corresponding fixes carried into the frozen runtime.

Evidence is under ignored `Animation/output/molasses-flood-rebuilt/`, including `decoded-review/`, `final-review-*.jpg`, `walk-motion-review.jpg`, `rescue-motion-review.jpg` and `all-frame-audit/`. The complete 30-page all-frame atlas is machine-produced evidence; it is not described as individual native-resolution manual inspection of every frame.

## Remaining visual/production limits

- These are procedural dimensional cartoon people, not an exact reconstruction of the supplied reference's proprietary character rig or renderer.
- Foreground crests, roofs and railway structure can briefly hide portions of a complete actor or sign during moving transitions. In particular, the main wave pass can obscure lower bodies even where the actor's own local fluid depth is shallow. That is occlusion, not deleted anatomy, but it can still read ambiguously.
- The legal sign is fully readable around its central view; incoming/outgoing oblique views can crop lettering.
- The demonstration table and remembrance station are persistent explanatory staging and can appear before their narrated close-up. Legal/remembrance time changes are labeled, not literal 1919 geography.
- The pool persists in the modeled street field, but this is not a calibrated CFD/structural model or an exact inundation map of the whole historical tank yard.
- Fast district transfers coexist with slower reading arcs. The camera never enters an authored settled hold, but nonzero mathematical speed is not a guarantee of equally strong perceived motion in every frame.
- Regression tests cover explicit envelopes, joints and obstacles, not every possible triangle/prop intersection.
- Captions are speech-activity/word-weight timed. No complete manual listening or phonetic lip-sync claim is made.

This is a completed, technically validated revision offered for user review—not a claim of aesthetic approval.
