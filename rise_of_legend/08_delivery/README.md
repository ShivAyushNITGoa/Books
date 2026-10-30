# 08_delivery — what ships

## Current files

| File | What | QC |
|---|---|---|
| `animatic_slates.mp4` | Timing pass: 120.00 s, 1,200 frames, 10 fps, 1920×1080, silent | PASS (resolution, fps, duration, frames) |

## Planned files

| File | Spec | Status |
|---|---|---|
| `ep01_animatic.mp4` | Same cut with finished shot art + VO | waiting on 04_animation |
| `ep01_master_subs.mp4` | h264 CRF 19, burned Hindi+English subs, −14 LUFS | waiting on mix |
| `ep01_vertical.mp4` | 1080×1920, 10 fps, per-shot reframe | waiting on vertical timeline |
| `ep01_teaser_4s.mp4` | 40 frames, S22 hero shot + title, loops | waiting on S22 |
| `still_S22.png`, `still_S29.png`, `still_S32.png` | press / thumbnail frames | waiting on art |

## Release checklist

- [ ] `assemble_10fps.py --verify` prints **OVERALL: PASS** on every file.
- [ ] 120.000 s / 1,200 frames / 10.0 fps / 1920×1080 / h264 + AAC 48 kHz.
- [ ] Audio present on the master; silent-safe check done (watch once muted).
- [ ] Subtitles checked for line length and safe area; Devanagari shaping correct.
- [ ] `00_admin/legal_checklist.md` complete, credits correct.
- [ ] Thumbnail has no third-party character/actor likeness.

## Versioning

`ep01_animatic.mp4` → `ep01_animatic_v2.mp4` only when the cut changes. Old cuts stay.
Do **not** commit renders larger than ~15 MB; put them on a release or Drive and link here.

## Integration

Rejoin/inspect with the same frame-exact concat the builder uses:

```bash
printf "file '%s'\n" rise_of_legend/output/shots/S*.mp4 > list.txt
ffmpeg -f concat -safe 0 -i list.txt -c copy joined.mp4
```
