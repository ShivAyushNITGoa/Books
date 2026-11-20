# TV12 opening style demo

Deliverable: `output/tv12_demo_final.mp4` (local render, intentionally ignored by Git).

## Verified
- Exactly 30.00 seconds, 720 decoded video frames, 1280×720 at 24 fps.
- H.264 video and AAC stereo audio at 48 kHz; complete decode exits successfully.
- Nine sequential original images, opening timestamp labels 0-00 through 0-29.
- Original GitHub narration blob matches local file: 40fa3fd8b35c10887ad03d9e93ebb1f9d5060bf7.
- No music, audio normalization, or burned captions. Narration is AAC-transcoded.

## Style and pipeline analysis
The documented pro preset implements eased image motion, saliency-biased framing, energy-driven movement, same-image punch-ins, class-sensitive cuts/fades, color grading, grain and vignette. The demo uses that preset rather than adding unrelated inserts or captions. Cue classes are provisional energy/style choices, not validated semantic annotations. The opening timing SRT is a visual timing scaffold derived from filenames, NOT an authoritative transcript. Text placeholders are never burned in.

Added an exact preview-duration option because the previous cue-limit path could retain full narration duration. Added episode/resolution/CRF/preview-specific cache directories to reduce demo/full collisions; this is not a complete content-addressed cache, so clear caches when changing source assets or style settings.

## Approval gate / outstanding issues
Full rendering has NOT started. Review motion, transitions, grade and pacing first.
An authoritative full SRT is still needed to verify narration alignment; filename timings alone cannot establish word-level synchronization.
Docs conflict between 2560×1440 delivery and no upscaling of 1376×768 sources. Demo uses 1280×720; confirm full delivery resolution before full render.
Technical decode QA is complete; subjective visual/audio approval remains with the user. Output is tagged full-range yuvj420p, so limited-range yuv420p/color-range consistency should be corrected and checked before final delivery.
