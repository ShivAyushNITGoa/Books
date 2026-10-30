# TV11 master-prompt rebuild — delivery

- Source: authoritative 319-cue `tv11.srt` and full raw VO from `video 11 full.mp3`.
- Build: official `editing/build_video.py --style pro`, 1920×1080, 24 fps, H.264 CRF 24, AAC 48 kHz stereo; no burned captions and no logo.
- Duration: 1205.96 s (20:05.96), following `max(SRT span, VO) + 2 s`.
- Cue mapping: 319 unique prompts, cue classes, and images; dry-run found 319/319 images.

## Parts

Each part is below the 97 MB splitter cap. Boundaries are exact, at chapter cue starts where selected.

| Part | Time range (s) | Duration | Size |
|---|---:|---:|---:|
| `tv11_2k_part1.mp4` | 0–324 | 324.00 s | 65,214,849 bytes |
| `tv11_2k_part2.mp4` | 324–578 | 254.00 s | 52,232,967 bytes |
| `tv11_2k_part3.mp4` | 578–895 | 317.00 s | 68,776,332 bytes |
| `tv11_2k_part4.mp4` | 895–1205.96 | 310.96 s | 65,720,608 bytes |

Acceptance check: `editing/verify_parts.py --ep tv11 --cues 319` — **OVERALL PASS**. All parts report 1920×1080, 24 fps, H.264 + AAC at 48 kHz, and under 100 MB. A stream-copy rejoin measured 1205.98 s, 0.02 s from the master (AAC packet padding; below one video frame).

## Rejoin

From the repository root:

```sh
printf "file '%s'\n" tv11_2k_part1.mp4 tv11_2k_part2.mp4 tv11_2k_part3.mp4 tv11_2k_part4.mp4 > list.txt
ffmpeg -f concat -safe 0 -i list.txt -c copy tv11_joined.mp4
```

The local full master is `output/tv11_final.mp4`; the four delivery parts above are the committed files.
