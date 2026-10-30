# 05_edit — conform and subtitle notes

**The edit is `../timeline.json`.** There is no separate EDL to keep in sync; the builder reads the
timeline and renders the cut.

## Conform checklist

1. `timeline.json` validated (`--dry-run`) and sums to 1,200 frames.
2. Every shot has exactly one asset in `../04_animation/shots/`.
3. Build → `--verify` PASS.
4. Five VO cues land on the frames listed in `PRODUCTION_PLAN.md` §4.4.
5. Impact frames intact: S26 (fire-palm) and S31/S32 (black → title).
6. Subtitles burned only for the platform master, never on the archive master.

## Subtitle burn

`../01_script/vo_ep01.srt` is the sidecar. Recipe (run from the repo root, so `fonts/` resolves):

```bash
FF=$(python3 -c "import imageio_ffmpeg;print(imageio_ffmpeg.get_ffmpeg_exe())")
$FF -y -i rise_of_legend/08_delivery/ep01_animatic.mp4 \
  -vf "subtitles=rise_of_legend/01_script/vo_ep01.srt:fontsdir=fonts:\
force_style='FontName=Noto Sans Devanagari,Fontsize=18,PrimaryColour=&H00FFFFFF,\
OutlineColour=&H00000000,BorderStyle=1,Outline=2,Shadow=0,MarginV=38,Alignment=2'" \
  -c:v libx264 -preset slow -crf 19 -pix_fmt yuv420p -r 10 \
  -c:a aac -b:a 192k -ar 48000 -movflags +faststart \
  rise_of_legend/08_delivery/ep01_master_subs.mp4
```

## Vertical cut

Keep a second timeline (`timeline_vertical.json`, same shot ids, per-shot reframe values) rather than
centre-cropping the wide master. Build it with the same tool:

```bash
python3 rise_of_legend/07_build/assemble_10fps.py --timeline rise_of_legend/timeline_vertical.json \
  --build
```

## Changelog

| Version | Date | Change |
|---|---|---|
| v1 | — | 32-shot cut, 1,200 frames, slate animatic approved |
