# 03_animatic — timing passes and review cuts

The animatic is the film's spine. Every frame decision is made here, before a single inbetween is drawn.

## Current cut

`../08_delivery/animatic_slates.mp4` — 120.00 s, 1,200 frames, 10 fps, QC PASS.
Slate cards stand in for artwork; the cut, frame counts and title slam are final.

## Review convention

When a note changes the cut, **do not overwrite** — add a numbered note file:

```
03_animatic/notes_v1.md      what changed, shot by shot, with frame numbers
03_animatic/review_v1.mp4    the cut that was reviewed (optional, keep < 10 MB)
```

Changes always go through `timeline.json`, then rebuild:

```bash
python3 rise_of_legend/07_build/assemble_10fps.py --slates --build
```

## What we review on the animatic

1. **Does it read mute?** Play it with sound off.
2. **Beat length**: does any beat overstay? (Rule: no shot longer than 140 frames.)
3. **Cuts on VO**: do the five VO cues land on picture events? (See `PRODUCTION_PLAN.md` §4.4.)
4. **Escalation**: beats 5, 8 and 9 must be visibly bigger than beat 2.
5. **The 8-frame black at S31** — does the title slam hit, or does it need 12 frames?

## Versioning

`animatic_slates.mp4` → `ep01_animatic.mp4` → `ep01_animatic_v2.mp4` (only if the cut changes after
animation starts). Never delete a superseded cut while the film is in production: it is the record of
what was approved.
