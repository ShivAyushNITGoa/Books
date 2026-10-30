# 08_delivery — what ships

## Current files

| File | What | QC |
|---|---|---|
| `ep01_animatic.mp4` | **Current cut.** All 30 boards + title, guide VO muxed. h264 CRF 23, 14.9 MB | PASS (resolution, fps, duration, frames, audio) |
| `boards_contact_sheet.jpg` | 6×5 grid of the 30 boards, for review | — |
| `animatic_slates.mp4` | Older timing pass, slate cards instead of art | PASS |

## Planned files

| File | Spec | Status |
|---|---|---|
| `ep01_animation.mp4` | Same cut with animated clips (inbetweens) instead of held boards | waiting on 04_animation |
| `ep01_master_subs.mp4` | h264 CRF 19, burned Hindi+English subs, −14 LUFS | waiting on mix |
| `ep01_vertical.mp4` | 1080×1920, 10 fps, per-shot reframe | waiting on vertical timeline |
| `ep01_teaser_4s.mp4` | 40 frames, S22 hero shot + title, loops | waiting on S22 |
| `still_S22.png`, `still_S29.png`, `still_S32.png` | press / thumbnail frames (`S22.jpg`, `S29.jpg` exist) | to export |

## Release checklist

- [ ] `assemble_10fps.py --verify` prints **OVERALL: PASS** on every file.
- [ ] 120.000 s / 1,200 frames / 10.0 fps / 1920×1080 / h264 + AAC 48 kHz.
- [ ] Audio present on the master; silent-safe check done (watch once muted).
- [ ] Subtitles checked for line length and safe area; Devanagari shaping correct.
- [ ] `00_admin/legal_checklist.md` complete, credits correct.
- [ ] Thumbnail has no third-party character/actor likeness.

## Versioning

`ep01_animatic.mp4` → `ep01_animatic_v2.mp4` only when the cut changes. Old cuts stay.
Keep committed renders at or below ~15 MB (`--crf 23` gives 14.9 MB); for higher-bitrate masters
put the file on a release or Drive and link it here.

## Integration

Rejoin/inspect with the same frame-exact concat the builder uses:

```bash
printf "file '%s'\n" rise_of_legend/output/shots/S*.mp4 > list.txt
ffmpeg -f concat -safe 0 -i list.txt -c copy joined.mp4
```
